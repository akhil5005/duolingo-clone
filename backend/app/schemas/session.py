"""Schemas for the lesson session lifecycle."""

from typing import Any

from pydantic import BaseModel, Field

from app.schemas.exercise import PublicExercise


class SessionOut(BaseModel):
    session_id: str
    mode: str
    skill_id: int
    skill_title: str
    lesson_id: int | None
    exercises: list[PublicExercise]
    queue: list[int]
    hearts: int
    max_hearts: int
    total_exercises: int


class AnswerIn(BaseModel):
    exercise_id: int
    answer: dict[str, Any] = Field(default_factory=dict)


class AnswerOut(BaseModel):
    is_correct: bool
    correct_answer: str
    note: str | None
    hearts: int
    session_status: str
    progress: float
    queue: list[int]


class XpLineOut(BaseModel):
    label: str
    amount: int


class DailyGoalOut(BaseModel):
    today_xp: int
    goal: int
    reached: bool
    just_reached: bool


class AchievementOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str


class SkillProgressOut(BaseModel):
    id: int
    state: str
    lessons_completed: int
    total_lessons: int


class CompletionOut(BaseModel):
    xp_breakdown: list[XpLineOut]
    xp_earned: int
    total_xp: int
    accuracy: int
    duration_seconds: int
    streak_before: int
    streak_after: int
    streak_extended_today: bool
    week_activity: list[bool]
    daily_goal: DailyGoalOut
    hearts: int
    new_achievements: list[AchievementOut]
    skill: SkillProgressOut


class SessionStatusOut(BaseModel):
    status: str
