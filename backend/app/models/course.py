"""Course content: course -> units -> skills -> lessons -> exercises.

This half of the schema is immutable reference data written by the seeder; no
learner state lives here. Each level is ordered by ``order_index`` and unique
within its parent, which is what makes the learning path deterministic.
"""

from typing import Any

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ExerciseType, check_in


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (UniqueConstraint("language_code", "from_language", name="uq_course_pair"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    language_code: Mapped[str] = mapped_column(String(8))
    title: Mapped[str] = mapped_column(String(120))
    from_language: Mapped[str] = mapped_column(String(8))
    flag_emoji: Mapped[str] = mapped_column(String(8))

    units: Mapped[list["Unit"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Unit.order_index",
    )


class Unit(Base):
    __tablename__ = "units"
    __table_args__ = (UniqueConstraint("course_id", "order_index", name="uq_unit_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True
    )
    order_index: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(240))
    color_hex: Mapped[str] = mapped_column(String(9))

    course: Mapped[Course] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit",
        cascade="all, delete-orphan",
        order_by="Skill.order_index",
    )


class Skill(Base):
    __tablename__ = "skills"
    __table_args__ = (UniqueConstraint("unit_id", "order_index", name="uq_skill_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id", ondelete="CASCADE"), index=True)
    order_index: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    icon: Mapped[str] = mapped_column(String(40))

    unit: Mapped[Unit] = relationship(back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="skill",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index",
    )


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("skill_id", "order_index", name="uq_lesson_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    order_index: Mapped[int] = mapped_column(Integer)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    skill: Mapped[Skill] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="Exercise.order_index",
    )


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (
        UniqueConstraint("lesson_id", "order_index", name="uq_exercise_order"),
        CheckConstraint(check_in("type", ExerciseType), name="ck_exercise_type"),
        Index("ix_exercises_lesson_order", "lesson_id", "order_index"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"), index=True
    )
    order_index: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(32))
    prompt: Mapped[str] = mapped_column(Text)
    # Shape varies per type; validated by a Pydantic discriminated union on read
    # and on seed. Answer keys live in here and never reach the client.
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)
    tts_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    tts_lang: Mapped[str | None] = mapped_column(String(16), nullable=True)

    lesson: Mapped[Lesson] = relationship(back_populates="exercises")
