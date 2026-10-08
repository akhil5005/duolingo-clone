"""Shapes the client may submit for each exercise type.

Answers arrive as free-form JSON, so they get the same validation treatment as
the payloads they are graded against. A malformed body is a 422, never a
silently wrong answer that costs the learner a heart.
"""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.models.enums import ExerciseType


class _AnswerBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class MCAnswer(_AnswerBase):
    option_id: str


class TranslateAnswer(_AnswerBase):
    tokens: list[str]


class MatchPairAnswer(_AnswerBase):
    left: str
    right: str


class MatchAnswer(_AnswerBase):
    pairs: list[MatchPairAnswer] = Field(min_length=1)


class FillBlankAnswer(_AnswerBase):
    choice: str


class TypeAnswerAnswer(_AnswerBase):
    text: str


ANSWER_MODELS: dict[str, type[_AnswerBase]] = {
    ExerciseType.MULTIPLE_CHOICE: MCAnswer,
    ExerciseType.TRANSLATE: TranslateAnswer,
    ExerciseType.MATCH_PAIRS: MatchAnswer,
    ExerciseType.FILL_BLANK: FillBlankAnswer,
    ExerciseType.TYPE_ANSWER: TypeAnswerAnswer,
}


def parse_answer(exercise_type: str, answer: dict[str, Any]) -> _AnswerBase:
    model = ANSWER_MODELS.get(exercise_type)
    if model is None:
        raise ValueError(f"Unknown exercise type: {exercise_type}")
    try:
        return model.model_validate(answer)
    except ValidationError as exc:
        raise ValueError(f"Malformed answer for a {exercise_type} exercise") from exc
