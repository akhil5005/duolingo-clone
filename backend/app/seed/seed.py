"""Idempotent database seeding.

Run explicitly with ``python -m app.seed.seed [--reset]``, or automatically at
startup when the ``courses`` table is empty (see ``app.main``). Content is
upserted by natural keys so re-running never duplicates rows; learners are only
created when missing, so replaying the seed never wipes real progress.
"""

import argparse
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import clock
from app.core.database import Base, SessionLocal, engine
from app.models.course import Course, Exercise, Lesson, Skill, Unit
from app.models.user import User
from app.repositories import xp_repo
from app.schemas.seed import CourseFile, LessonSeed, SkillSeed, UnitSeed
from app.seed.learners import (
    DEFAULT_USERNAME,
    seed_achievements,
    seed_default_learner,
    seed_rivals,
)

SEED_DIR = Path(__file__).parent
# The learner starts here; the rest of the catalogue is theirs to switch to.
DEFAULT_LANGUAGE_CODE = "es"


def course_files() -> list[Path]:
    """Every ``*_course.json`` beside this module, in a stable order."""
    return sorted(SEED_DIR.glob("*_course.json"))


def load_course_file(path: Path) -> CourseFile:
    return CourseFile.model_validate(json.loads(path.read_text(encoding="utf-8")))


def _upsert_course(db: Session, data: CourseFile) -> Course:
    course = db.scalars(
        select(Course).where(
            Course.language_code == data.course.language_code,
            Course.from_language == data.course.from_language,
        )
    ).first()
    if course is None:
        course = Course(**data.course.model_dump())
        db.add(course)
    else:
        course.title = data.course.title
        course.flag_emoji = data.course.flag_emoji
    db.flush()
    return course


def _upsert_unit(db: Session, course: Course, seed: UnitSeed) -> Unit:
    unit = db.scalars(
        select(Unit).where(Unit.course_id == course.id, Unit.order_index == seed.order_index)
    ).first()
    if unit is None:
        unit = Unit(course_id=course.id, order_index=seed.order_index)
        db.add(unit)
    unit.title, unit.description, unit.color_hex = seed.title, seed.description, seed.color_hex
    db.flush()
    return unit


def _upsert_skill(db: Session, unit: Unit, seed: SkillSeed) -> Skill:
    skill = db.scalars(
        select(Skill).where(Skill.unit_id == unit.id, Skill.order_index == seed.order_index)
    ).first()
    if skill is None:
        skill = Skill(unit_id=unit.id, order_index=seed.order_index)
        db.add(skill)
    skill.title, skill.icon = seed.title, seed.icon
    db.flush()
    return skill


def _upsert_lesson(db: Session, skill: Skill, seed: LessonSeed) -> Lesson:
    lesson = db.scalars(
        select(Lesson).where(Lesson.skill_id == skill.id, Lesson.order_index == seed.order_index)
    ).first()
    if lesson is None:
        lesson = Lesson(skill_id=skill.id, order_index=seed.order_index)
        db.add(lesson)
    lesson.xp_reward = seed.xp_reward
    db.flush()

    for exercise_seed in seed.exercises:
        exercise = db.scalars(
            select(Exercise).where(
                Exercise.lesson_id == lesson.id,
                Exercise.order_index == exercise_seed.order_index,
            )
        ).first()
        if exercise is None:
            exercise = Exercise(lesson_id=lesson.id, order_index=exercise_seed.order_index)
            db.add(exercise)
        exercise.type = exercise_seed.type
        exercise.prompt = exercise_seed.prompt
        exercise.payload = exercise_seed.payload
        exercise.tts_text = exercise_seed.tts_text
        exercise.tts_lang = exercise_seed.tts_lang
    db.flush()
    return lesson


def seed_course(db: Session, data: CourseFile) -> Course:
    """Insert or refresh one whole course tree."""
    course = _upsert_course(db, data)
    for unit_seed in data.units:
        unit = _upsert_unit(db, course, unit_seed)
        for skill_seed in unit_seed.skills:
            skill = _upsert_skill(db, unit, skill_seed)
            for lesson_seed in skill_seed.lessons:
                _upsert_lesson(db, skill, lesson_seed)
    db.expire(course)
    return course


def seed_content(db: Session) -> Course:
    """Seed every course file and return the one the learner starts on.

    The default course is seeded first so it keeps the lowest id and heads the
    catalogue; the rest follow alphabetically.
    """
    files = course_files()
    if not files:
        raise FileNotFoundError(f"No *_course.json files found in {SEED_DIR}")

    data = sorted(
        (load_course_file(path) for path in files),
        key=lambda d: (d.course.language_code != DEFAULT_LANGUAGE_CODE, d.course.title),
    )
    return [seed_course(db, one) for one in data][0]


def seed_learners(db: Session, course: Course) -> None:
    """Create the demo learner and their league rivals if they do not exist."""
    seed_achievements(db)
    if db.scalars(select(User).where(User.username == DEFAULT_USERNAME)).first() is not None:
        return
    learner = seed_default_learner(db, course)
    week_start = clock.start_of_week()
    learner_week_xp = sum(
        xp_repo.totals_by_day(db, learner.id, week_start, clock.today()).values()
    )
    seed_rivals(db, course, learner_week_xp)


def seed_all(db: Session) -> None:
    course = seed_content(db)
    seed_learners(db, course)
    db.commit()


def reset(db: Session) -> None:
    """Drop every table and seed from scratch (``--reset``)."""
    db.close()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the lingoleap database.")
    parser.add_argument(
        "--reset", action="store_true", help="drop all tables before seeding"
    )
    args = parser.parse_args()

    if args.reset:
        with SessionLocal() as db:
            reset(db)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_all(db)
        titles = [c.title for c in db.scalars(select(Course).order_by(Course.id)).all()]
        print(f"Seeded courses: {', '.join(titles) or 'none'}")


if __name__ == "__main__":
    main()
