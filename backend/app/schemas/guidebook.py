"""The unit guidebook: what a unit teaches, before and after you are tested."""

from pydantic import BaseModel


class VocabularyOut(BaseModel):
    term: str
    translation: str
    emoji: str | None = None


class GuidebookSkillOut(BaseModel):
    id: int
    title: str
    icon: str
    vocabulary: list[VocabularyOut]


class GuidebookUnitOut(BaseModel):
    id: int
    # Position within the course. The row id is not it: a second course
    # continues the same primary key sequence, so unit one of French is row 3.
    order_index: int
    title: str
    description: str
    color_hex: str
    grammar_note: str | None
    skills: list[GuidebookSkillOut]


class GuidebookOut(BaseModel):
    course_title: str
    language_code: str
    units: list[GuidebookUnitOut]
