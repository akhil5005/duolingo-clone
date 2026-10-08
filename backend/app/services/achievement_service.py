"""Achievement evaluation.

Achievements are declarative: each row is "reach <threshold> of <metric>". The
metrics are recomputed after every completed session rather than incremented,
so a counter can never drift away from the data it describes.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import clock
from app.models.course import Skill, Unit
from app.models.enums import AchievementMetric, SessionMode, SessionStatus
from app.models.gamification import Achievement, UserAchievement
from app.models.progress import UserSkillProgress
from app.models.session import LessonSession
from app.models.user import User
from app.schemas.session import AchievementOut


def _perfect_lessons(db: Session, user_id: int) -> int:
    stmt = select(func.count()).select_from(LessonSession).where(
        LessonSession.user_id == user_id,
        LessonSession.status == SessionStatus.COMPLETED,
        LessonSession.mode == SessionMode.LESSON,
        LessonSession.mistakes == 0,
    )
    return db.scalar(stmt) or 0


def _units_completed(db: Session, user_id: int) -> int:
    """Units where every skill has all of its lessons finished."""
    completed_skill_ids = set(
        db.scalars(
            select(UserSkillProgress.skill_id).where(
                UserSkillProgress.user_id == user_id,
                UserSkillProgress.completed_at.is_not(None),
            )
        ).all()
    )
    if not completed_skill_ids:
        return 0

    rows = db.execute(select(Skill.unit_id, Skill.id).join(Unit, Unit.id == Skill.unit_id)).all()
    skills_by_unit: dict[int, set[int]] = {}
    for unit_id, skill_id in rows:
        skills_by_unit.setdefault(unit_id, set()).add(skill_id)

    return sum(1 for skills in skills_by_unit.values() if skills <= completed_skill_ids)


def current_metrics(db: Session, user: User) -> dict[str, int]:
    lessons_completed = (
        db.scalar(
            select(func.coalesce(func.sum(UserSkillProgress.lessons_completed), 0)).where(
                UserSkillProgress.user_id == user.id
            )
        )
        or 0
    )
    return {
        AchievementMetric.LESSONS_COMPLETED: lessons_completed,
        AchievementMetric.STREAK: user.streak_count,
        AchievementMetric.TOTAL_XP: user.total_xp,
        AchievementMetric.PERFECT_LESSONS: _perfect_lessons(db, user.id),
        AchievementMetric.UNITS_COMPLETED: _units_completed(db, user.id),
    }


def evaluate(db: Session, user: User) -> list[AchievementOut]:
    """Unlock anything the learner now qualifies for; return only the new ones."""
    metrics = current_metrics(db, user)
    unlocked_ids = set(
        db.scalars(
            select(UserAchievement.achievement_id).where(UserAchievement.user_id == user.id)
        ).all()
    )

    newly_unlocked: list[AchievementOut] = []
    for achievement in db.scalars(select(Achievement).order_by(Achievement.id)).all():
        if achievement.id in unlocked_ids:
            continue
        if metrics.get(achievement.metric, 0) < achievement.threshold:
            continue
        db.add(
            UserAchievement(
                user_id=user.id,
                achievement_id=achievement.id,
                unlocked_at=clock.naive_now(),
            )
        )
        newly_unlocked.append(
            AchievementOut(
                code=achievement.code,
                title=achievement.title,
                description=achievement.description,
                icon=achievement.icon,
            )
        )
    return newly_unlocked
