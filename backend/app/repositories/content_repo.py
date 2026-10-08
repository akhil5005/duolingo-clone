"""Read access to seeded course content."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.course import Course, Exercise, Lesson, Skill, Unit


def count_courses(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(Course)) or 0


def get_course(db: Session, course_id: int | None = None) -> Course | None:
    """The learner's course, or the only seeded course when none is set."""
    stmt = select(Course).order_by(Course.id)
    if course_id is not None:
        stmt = stmt.where(Course.id == course_id)
    return db.scalars(stmt.limit(1)).first()


def get_course_tree(db: Session, course_id: int) -> Course | None:
    """The whole course eagerly loaded: one query per level, not per skill."""
    stmt = (
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.units).selectinload(Unit.skills).selectinload(Skill.lessons))
    )
    return db.scalars(stmt).first()


def get_lesson(db: Session, lesson_id: int) -> Lesson | None:
    stmt = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(selectinload(Lesson.exercises), selectinload(Lesson.skill))
    )
    return db.scalars(stmt).first()


def get_skill(db: Session, skill_id: int) -> Skill | None:
    stmt = (
        select(Skill)
        .where(Skill.id == skill_id)
        .options(selectinload(Skill.lessons).selectinload(Lesson.exercises))
    )
    return db.scalars(stmt).first()


def get_exercises(db: Session, exercise_ids: list[int]) -> dict[int, Exercise]:
    if not exercise_ids:
        return {}
    rows = db.scalars(select(Exercise).where(Exercise.id.in_(exercise_ids))).all()
    return {row.id: row for row in rows}
