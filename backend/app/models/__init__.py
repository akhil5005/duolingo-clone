"""Importing this package registers every table on ``Base.metadata``."""

from app.models.app_state import AppState
from app.models.course import Course, Exercise, Lesson, Skill, Unit
from app.models.enums import (
    AchievementMetric,
    ExerciseType,
    SessionMode,
    SessionStatus,
    SkillState,
    XpSource,
)
from app.models.gamification import Achievement, UserAchievement, XpEvent
from app.models.progress import UserSkillProgress
from app.models.session import LessonSession, SessionAnswer
from app.models.user import User

__all__ = [
    "AchievementMetric",
    "Achievement",
    "AppState",
    "Course",
    "Exercise",
    "ExerciseType",
    "Lesson",
    "LessonSession",
    "SessionAnswer",
    "SessionMode",
    "SessionStatus",
    "Skill",
    "SkillState",
    "Unit",
    "User",
    "UserAchievement",
    "UserSkillProgress",
    "XpEvent",
    "XpSource",
]
