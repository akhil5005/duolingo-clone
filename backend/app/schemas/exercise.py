"""The client-facing projection of an exercise (never carries answer keys)."""

from typing import Any

from pydantic import BaseModel

from app.models.course import Exercise
from app.schemas.exercise_payloads import parse_payload


class PublicExercise(BaseModel):
    id: int
    order_index: int
    type: str
    prompt: str
    payload: dict[str, Any]
    tts_text: str | None = None
    tts_lang: str | None = None

    @classmethod
    def from_model(cls, exercise: Exercise) -> "PublicExercise":
        payload = parse_payload(exercise.type, exercise.payload)
        return cls(
            id=exercise.id,
            order_index=exercise.order_index,
            type=exercise.type,
            prompt=exercise.prompt,
            payload=payload.to_public(exercise.id),
            tts_text=exercise.tts_text,
            tts_lang=exercise.tts_lang,
        )
