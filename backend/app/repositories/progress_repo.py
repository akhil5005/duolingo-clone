"""Read/write access to per-skill progress rows."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.progress import UserSkillProgress


def progress_map(db: Session, user_id: int) -> dict[int, UserSkillProgress]:
    rows = db.scalars(
        select(UserSkillProgress).where(UserSkillProgress.user_id == user_id)
    ).all()
    return {row.skill_id: row for row in rows}


def get(db: Session, user_id: int, skill_id: int) -> UserSkillProgress | None:
    return db.get(UserSkillProgress, {"user_id": user_id, "skill_id": skill_id})


def get_or_create(db: Session, user_id: int, skill_id: int) -> UserSkillProgress:
    row = get(db, user_id, skill_id)
    if row is None:
        row = UserSkillProgress(user_id=user_id, skill_id=skill_id, lessons_completed=0)
        db.add(row)
        db.flush()
    return row


def count_lessons_completed(db: Session, user_id: int) -> int:
    rows = db.scalars(
        select(UserSkillProgress.lessons_completed).where(UserSkillProgress.user_id == user_id)
    ).all()
    return sum(rows)
