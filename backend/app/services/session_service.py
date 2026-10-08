"""Answering, completing and abandoning a session.

Everything a single learner action touches - the queue, hearts, the XP ledger,
skill progress, the streak and achievements - is written inside one
transaction, committed by the router.
"""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.core import clock
from app.core.errors import ConflictError, NotFoundError
from app.models.course import Exercise
from app.models.enums import SessionMode, SessionStatus, XpSource
from app.models.session import LessonSession, SessionAnswer
from app.models.user import User
from app.repositories import content_repo, progress_repo, xp_repo
from app.schemas.exercise_payloads import parse_payload
from app.schemas.session import (
    AnswerOut,
    CompletionOut,
    DailyGoalOut,
    SessionStatusOut,
    SkillProgressOut,
    XpLineOut,
)
from app.services import (
    achievement_service,
    answer_checker,
    hearts_service,
    path_service,
    streak_service,
    xp_service,
)
from app.services.xp_service import XpLine


def _load_active(db: Session, user: User, session_id: str) -> LessonSession:
    session = db.get(LessonSession, session_id)
    if session is None or session.user_id != user.id:
        raise NotFoundError("That session does not exist.")
    if session.status != SessionStatus.ACTIVE:
        raise ConflictError("This session has already finished.", code="SESSION_FINISHED")
    return session


def submit_answer(
    db: Session, user: User, session_id: str, exercise_id: int, raw_answer: dict
) -> AnswerOut:
    session = _load_active(db, user, session_id)
    queue = list(session.exercise_queue)

    if not queue or queue[0] != exercise_id:
        raise ConflictError(
            "That is not the exercise you are on.", code="WRONG_EXERCISE"
        )

    exercise = db.get(Exercise, exercise_id)
    if exercise is None:
        raise NotFoundError("That exercise does not exist.")

    try:
        result = answer_checker.check(parse_payload(exercise.type, exercise.payload), raw_answer)
    except ValueError as exc:
        raise ConflictError(str(exc), code="INVALID_ANSWER", status_code=422) from exc

    db.add(
        SessionAnswer(
            session_id=session.id,
            exercise_id=exercise_id,
            answer=raw_answer,
            is_correct=result.is_correct,
            answered_at=clock.naive_now(),
        )
    )

    answered_correct = list(session.answered_correct)
    queue.pop(0)
    if result.is_correct:
        answered_correct.append(exercise_id)
    else:
        # Duolingo re-asks a missed exercise before the lesson can end.
        queue.append(exercise_id)
        session.mistakes += 1
        if session.mode == SessionMode.LESSON:
            hearts_service.apply_regen(user)
            hearts_service.spend_heart(user)
            if user.hearts <= 0:
                session.status = SessionStatus.FAILED
        elif session.mode == SessionMode.LEGENDARY:
            session.status = SessionStatus.FAILED

    if session.status == SessionStatus.FAILED:
        session.finished_at = clock.naive_now()

    # Reassign rather than mutate: SQLAlchemy does not track in-place JSON edits.
    session.exercise_queue = queue
    session.answered_correct = answered_correct

    return AnswerOut(
        is_correct=result.is_correct,
        correct_answer=result.correct_answer,
        note=result.note,
        hearts=user.hearts,
        session_status=session.status,
        progress=len(answered_correct) / session.total_exercises,
        queue=queue,
    )


def _advance_skill(db: Session, user: User, session: LessonSession) -> None:
    """Credit the lesson if it was the learner's next uncompleted one.

    Replaying an earlier lesson is allowed but must not inflate the counter, so
    progress only moves when the finished lesson is the one the path pointed at.
    """
    if session.mode != SessionMode.LESSON or session.lesson_id is None:
        return

    skill = content_repo.get_skill(db, session.skill_id)
    if skill is None:
        return

    progress = progress_repo.get_or_create(db, user.id, session.skill_id)
    expected_index = progress.lessons_completed
    if expected_index >= len(skill.lessons):
        return
    if skill.lessons[expected_index].id != session.lesson_id:
        return

    progress.lessons_completed += 1
    if progress.lessons_completed >= len(skill.lessons) and progress.completed_at is None:
        progress.completed_at = clock.naive_now()


def _xp_lines(db: Session, session: LessonSession) -> tuple[list[XpLine], str]:
    if session.mode == SessionMode.PRACTICE:
        return [XpLine("Practice", xp_service.PRACTICE_XP)], XpSource.PRACTICE
    if session.mode == SessionMode.LEGENDARY:
        return [XpLine("Legendary challenge", xp_service.LEGENDARY_XP)], XpSource.LEGENDARY

    lesson = content_repo.get_lesson(db, session.lesson_id) if session.lesson_id else None
    lines = [XpLine("Lesson complete", lesson.xp_reward if lesson else 10)]
    if session.mistakes == 0:
        lines.append(XpLine("No mistakes", xp_service.PERFECT_LESSON_BONUS))
    return lines, XpSource.LESSON


def complete(db: Session, user: User, session_id: str) -> CompletionOut:
    session = _load_active(db, user, session_id)
    if session.exercise_queue:
        raise ConflictError("There are still exercises left.", code="SESSION_INCOMPLETE")

    session.status = SessionStatus.COMPLETED
    session.finished_at = clock.naive_now()

    goal_before = xp_service.today_xp(db, user.id)
    lines, source = _xp_lines(db, session)
    xp_earned = xp_service.award(db, user, lines, source=source, session_id=session.id)

    _advance_skill(db, user, session)
    if session.mode == SessionMode.PRACTICE:
        hearts_service.grant_heart(user)
    if session.mode == SessionMode.LEGENDARY:
        progress = progress_repo.get_or_create(db, user.id, session.skill_id)
        progress.legendary_at = clock.naive_now()

    streak = streak_service.register_activity(user)
    db.flush()
    new_achievements = achievement_service.evaluate(db, user)

    goal_after = goal_before + xp_earned
    monday = clock.start_of_week()
    active_days = xp_repo.active_days(db, user.id, monday, monday + timedelta(days=6))
    status = path_service.require_status(db, user, session.skill_id)
    duration = (session.finished_at - session.started_at).total_seconds()
    attempts = session.total_exercises + session.mistakes

    return CompletionOut(
        xp_breakdown=[XpLineOut(label=line.label, amount=line.amount) for line in lines],
        xp_earned=xp_earned,
        total_xp=user.total_xp,
        accuracy=round(session.total_exercises / attempts * 100) if attempts else 100,
        duration_seconds=int(duration),
        streak_before=streak.before,
        streak_after=streak.after,
        streak_extended_today=streak.extended_today,
        week_activity=streak_service.week_activity(active_days, monday),
        daily_goal=DailyGoalOut(
            today_xp=goal_after,
            goal=user.daily_goal_xp,
            reached=goal_after >= user.daily_goal_xp,
            just_reached=goal_before < user.daily_goal_xp <= goal_after,
        ),
        hearts=user.hearts,
        new_achievements=new_achievements,
        skill=SkillProgressOut(
            id=status.skill.id,
            state=status.state,
            lessons_completed=status.lessons_completed,
            total_lessons=status.total_lessons,
        ),
    )


def abandon(db: Session, user: User, session_id: str) -> SessionStatusOut:
    """Quitting mid-lesson. Hearts already spent stay spent."""
    session = _load_active(db, user, session_id)
    session.status = SessionStatus.ABANDONED
    session.finished_at = clock.naive_now()
    return SessionStatusOut(status=session.status)
