"""Schemas for the learning path (home screen)."""

from pydantic import BaseModel

from app.schemas.me import CourseBrief


class PathSkillOut(BaseModel):
    id: int
    title: str
    icon: str
    state: str
    lessons_completed: int
    total_lessons: int
    next_lesson_id: int | None
    legendary: bool


class PathUnitOut(BaseModel):
    id: int
    order_index: int
    title: str
    description: str
    color_hex: str
    completed_skills: int
    total_skills: int
    skills: list[PathSkillOut]


class PathOut(BaseModel):
    course: CourseBrief
    units: list[PathUnitOut]
