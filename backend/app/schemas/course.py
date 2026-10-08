"""Schemas for the course catalogue."""

from pydantic import BaseModel


class CourseSummaryOut(BaseModel):
    id: int
    title: str
    language_code: str
    flag_emoji: str
    total_skills: int
    completed_skills: int
    is_current: bool
