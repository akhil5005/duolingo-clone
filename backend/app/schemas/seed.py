"""Validation schema for ``spanish_course.json``.

The seed file is content, not code, so it gets the same treatment as API input:
every exercise payload is run through the discriminated union before it reaches
the database. A typo in the JSON fails at seed time, not mid-lesson.
"""

from typing import Any, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ExerciseType
from app.schemas.exercise_payloads import parse_payload


class ExerciseSeed(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_index: int = Field(ge=1)
    type: ExerciseType
    prompt: str
    payload: dict[str, Any]
    tts_text: str | None = None
    tts_lang: str | None = None

    @model_validator(mode="after")
    def _payload_matches_type(self) -> Self:
        parse_payload(self.type, self.payload)
        return self


class LessonSeed(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_index: int = Field(ge=1)
    xp_reward: int = Field(default=10, ge=1)
    exercises: list[ExerciseSeed] = Field(min_length=1)


class VocabularySeed(BaseModel):
    """One word the skill teaches, before it is ever tested."""

    model_config = ConfigDict(extra="forbid")

    term: str
    translation: str
    emoji: str | None = None


class SkillSeed(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_index: int = Field(ge=1)
    title: str
    icon: str
    vocabulary: list[VocabularySeed] = Field(default_factory=list)
    lessons: list[LessonSeed] = Field(min_length=1)


class UnitSeed(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order_index: int = Field(ge=1)
    title: str
    description: str
    color_hex: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    grammar_note: str | None = None
    skills: list[SkillSeed] = Field(min_length=1)


class CourseSeed(BaseModel):
    model_config = ConfigDict(extra="forbid")

    language_code: str
    title: str
    from_language: str
    flag_emoji: str


class CourseFile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    course: CourseSeed
    units: list[UnitSeed] = Field(min_length=1)
