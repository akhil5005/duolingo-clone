"""Starting a lesson, practice or legendary session.

The exercise queue is built and stored server-side. The client is handed the
exercises with their answer keys stripped, which is what makes XP tamper-proof:
the only thing it can do is submit an answer for the exercise at the head of
the queue and let the server decide.
"""

import random
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import clock
from app.core.errors import ConflictError, NotFoundError
from app.models.course import Exercise, Lesson, Skill
from app.models.enums import SessionMode, SessionStatus, SkillState
from app.models.session import LessonSession
from app.models.user import MAX_HEARTS, User
from app.repositories import content_repo
from app.schemas.exercise import PublicExercise
from app.schemas.session import SessionOut
from app.services import hearts_service, path_service

PRACTICE_EXERCISE_COUNT = 10
LEGENDARY_EXERCISE_COUNT = 15
ANY_SKILL = 0


def _abandon_stale_sessions(db: Session, user: User) -> None:
    """Close out anything still open, so a learner only ever has one live session."""
    stale = db.scalars(
        select(LessonSession).where(
            LessonSession.user_id == user.id,
            LessonSession.status == SessionStatus.ACTIVE,
        )
    ).all()
    for session in stale:
        session.status = SessionStatus.ABANDONED
        session.finished_at = clock.naive_now()


def _create(
    db: Session,
    user: User,
    *,
    skill: Skill,
    lesson: Lesson | None,
    mode: str,
    exercise_ids: list[int],
) -> LessonSession:
    if not exercise_ids:
        raise ConflictError("There are no exercises to practise yet.", code="NO_EXERCISES")

    _abandon_stale_sessions(db, user)
    session = LessonSession(
        id=str(uuid.uuid4()),
        user_id=user.id,
        skill_id=skill.id,
        lesson_id=lesson.id if lesson else None,
        mode=mode,
        status=SessionStatus.ACTIVE,
        exercise_queue=list(exercise_ids),
        answered_correct=[],
        total_exercises=len(exercise_ids),
        mistakes=0,
        started_at=clock.naive_now(),
    )
    db.add(session)
    db.flush()
    return session


def to_session_out(db: Session, session: LessonSession, user: User, skill: Skill) -> SessionOut:
    exercises = content_repo.get_exercises(db, session.exercise_queue)
    return SessionOut(
        session_id=session.id,
        mode=session.mode,
        skill_id=skill.id,
        skill_title=skill.title,
        lesson_id=session.lesson_id,
        exercises=[
            PublicExercise.from_model(exercises[exercise_id])
            for exercise_id in session.exercise_queue
        ],
        queue=list(session.exercise_queue),
        hearts=user.hearts,
        max_hearts=MAX_HEARTS,
        total_exercises=session.total_exercises,
    )


def start_lesson(db: Session, user: User, lesson_id: int) -> SessionOut:
    lesson = content_repo.get_lesson(db, lesson_id)
    if lesson is None:
        raise NotFoundError("That lesson does not exist.")

    status = path_service.require_status(db, user, lesson.skill_id)
    if status.state == SkillState.LOCKED:
        raise ConflictError("Finish the skills above to unlock this one.", code="SKILL_LOCKED")

    hearts_service.apply_regen(user)
    if user.hearts <= 0:
        raise ConflictError(
            "You are out of hearts. Practise or refill to keep going.", code="NO_HEARTS"
        )

    session = _create(
        db,
        user,
        skill=lesson.skill,
        lesson=lesson,
        mode=SessionMode.LESSON,
        exercise_ids=[exercise.id for exercise in lesson.exercises],
    )
    return to_session_out(db, session, user, lesson.skill)


def _sample(exercises: list[Exercise], count: int, seed: int) -> list[int]:
    """Pick a random subset, or everything available when the pool is smaller."""
    chooser = random.Random(seed)
    pool = list(exercises)
    chooser.shuffle(pool)
    return [exercise.id for exercise in pool[:count]]


def start_practice(db: Session, user: User, skill_id: int) -> SessionOut:
    """Practice draws on finished material only, and never costs a heart.

    ``skill_id = 0`` means "anything I have started", which is what the
    out-of-hearts prompt and the global practice button use.
    """
    course = path_service.course_for(db, user)
    statuses = path_service.skill_statuses(db, user, course)

    if skill_id != ANY_SKILL and skill_id not in statuses:
        raise NotFoundError("That skill does not exist.")

    wanted = [
        status
        for status in statuses.values()
        if status.lessons_completed > 0 and skill_id in (ANY_SKILL, status.skill.id)
    ]
    pool = [
        exercise
        for status in wanted
        for lesson in status.skill.lessons[: status.lessons_completed]
        for exercise in lesson.exercises
    ]
    if not pool:
        raise ConflictError("Finish a lesson before practising.", code="NOTHING_TO_PRACTISE")

    anchor = wanted[0].skill
    session = _create(
        db,
        user,
        skill=anchor,
        lesson=None,
        mode=SessionMode.PRACTICE,
        exercise_ids=_sample(pool, PRACTICE_EXERCISE_COUNT, seed=int(clock.now().timestamp())),
    )
    return to_session_out(db, session, user, anchor)


def start_legendary(db: Session, user: User, skill_id: int) -> SessionOut:
    """A bonus run over a finished skill: one mistake ends it."""
    status = path_service.require_status(db, user, skill_id)
    if status.state != SkillState.COMPLETED:
        raise ConflictError(
            "Complete every lesson in this skill to try the legendary challenge.",
            code="SKILL_NOT_COMPLETE",
        )

    skill = content_repo.get_skill(db, skill_id)
    if skill is None:
        raise NotFoundError("That skill does not exist.")

    pool = [exercise for lesson in skill.lessons for exercise in lesson.exercises]
    session = _create(
        db,
        user,
        skill=skill,
        lesson=None,
        mode=SessionMode.LEGENDARY,
        exercise_ids=_sample(pool, LEGENDARY_EXERCISE_COUNT, seed=int(clock.now().timestamp())),
    )
    return to_session_out(db, session, user, skill)
