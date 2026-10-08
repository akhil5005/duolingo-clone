"""Typed exercise payloads.

``exercises.payload`` is a JSON column so each exercise type can carry the
shape it needs, but it is never treated as untyped data: every read and every
seeded row goes through this discriminated union, keyed on the exercise type.

Each payload owns a ``to_public()`` that returns the client-safe projection.
Answer keys (``correct_option_id``, ``accepted``, ``correct``, the pair mapping)
exist only on the server side, which is what makes the lesson loop tamper-proof.
"""

import random
from typing import Annotated, Any, Literal, Self, Union

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, model_validator

from app.models.enums import ExerciseType


def _shuffled(items: list[Any], seed: int) -> list[Any]:
    """Shuffle deterministically.

    Seeded by exercise id so the order is stable: a wrong answer re-asks the
    same exercise later in the lesson and the learner must see the same tiles.
    """
    return random.Random(seed).sample(items, len(items))


class _PayloadBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    def to_public(self, exercise_id: int) -> dict[str, Any]:
        raise NotImplementedError

    def canonical_answer(self) -> str:
        """The solution text shown in the red feedback bar."""
        raise NotImplementedError


class MCOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    text: str
    emoji: str | None = None


class MCPayload(_PayloadBase):
    type: Literal[ExerciseType.MULTIPLE_CHOICE]
    question: str
    options: list[MCOption] = Field(min_length=2, max_length=4)
    correct_option_id: str

    @model_validator(mode="after")
    def _correct_option_exists(self) -> Self:
        ids = [o.id for o in self.options]
        if len(set(ids)) != len(ids):
            raise ValueError("multiple_choice option ids must be unique")
        if self.correct_option_id not in ids:
            raise ValueError("correct_option_id must reference one of the options")
        return self

    def to_public(self, exercise_id: int) -> dict[str, Any]:
        options = _shuffled(list(self.options), exercise_id)
        return {
            "question": self.question,
            "options": [o.model_dump() for o in options],
        }

    def canonical_answer(self) -> str:
        return next(o.text for o in self.options if o.id == self.correct_option_id)


class TranslatePayload(_PayloadBase):
    type: Literal[ExerciseType.TRANSLATE]
    source_text: str
    source_lang: str
    target_lang: str
    tokens: list[str] = Field(min_length=2)
    accepted: list[list[str]] = Field(min_length=1)

    def to_public(self, exercise_id: int) -> dict[str, Any]:
        return {
            "source_text": self.source_text,
            "source_lang": self.source_lang,
            "target_lang": self.target_lang,
            "tokens": _shuffled(list(self.tokens), exercise_id),
        }

    def canonical_answer(self) -> str:
        return " ".join(self.accepted[0])


class MatchPair(BaseModel):
    model_config = ConfigDict(extra="forbid")

    left: str
    right: str


class MatchPayload(_PayloadBase):
    type: Literal[ExerciseType.MATCH_PAIRS]
    pairs: list[MatchPair] = Field(min_length=3, max_length=6)

    def to_public(self, exercise_id: int) -> dict[str, Any]:
        # Both columns are shuffled independently, otherwise the pairs would sit
        # on the same rows and the exercise would be trivial.
        return {
            "left": _shuffled([p.left for p in self.pairs], exercise_id),
            "right": _shuffled([p.right for p in self.pairs], exercise_id + 977),
        }

    def canonical_answer(self) -> str:
        return ", ".join(f"{p.left} = {p.right}" for p in self.pairs)


class FillBlankPayload(_PayloadBase):
    type: Literal[ExerciseType.FILL_BLANK]
    before: str
    after: str
    options: list[str] = Field(min_length=2, max_length=4)
    correct: str
    translation: str

    @model_validator(mode="after")
    def _correct_is_an_option(self) -> Self:
        if self.correct not in self.options:
            raise ValueError("fill_blank correct must be one of the options")
        return self

    def to_public(self, exercise_id: int) -> dict[str, Any]:
        return {
            "before": self.before,
            "after": self.after,
            "options": _shuffled(list(self.options), exercise_id),
            "translation": self.translation,
        }

    def canonical_answer(self) -> str:
        return " ".join(part for part in (self.before, self.correct, self.after) if part)


class TypeAnswerPayload(_PayloadBase):
    type: Literal[ExerciseType.TYPE_ANSWER]
    source_text: str
    target_lang: str
    accepted: list[str] = Field(min_length=1)

    def to_public(self, _exercise_id: int) -> dict[str, Any]:
        return {"source_text": self.source_text, "target_lang": self.target_lang}

    def canonical_answer(self) -> str:
        return self.accepted[0]


ExercisePayload = Annotated[
    Union[MCPayload, TranslatePayload, MatchPayload, FillBlankPayload, TypeAnswerPayload],
    Field(discriminator="type"),
]

_payload_adapter: TypeAdapter[ExercisePayload] = TypeAdapter(ExercisePayload)


def parse_payload(exercise_type: str, payload: dict[str, Any]) -> ExercisePayload:
    """Validate a stored payload.

    The discriminator lives on the ``exercises.type`` column rather than inside
    the JSON blob (no duplicated source of truth), so it is merged back in here.
    """
    return _payload_adapter.validate_python({**payload, "type": exercise_type})
