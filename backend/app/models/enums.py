"""String enums mirrored by CHECK constraints in the schema."""

from enum import StrEnum


class ExerciseType(StrEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRANSLATE = "translate"
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"


class SessionMode(StrEnum):
    LESSON = "lesson"
    PRACTICE = "practice"
    LEGENDARY = "legendary"


class SessionStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    ABANDONED = "abandoned"


class XpSource(StrEnum):
    LESSON = "lesson"
    PRACTICE = "practice"
    LEGENDARY = "legendary"
    BONUS = "bonus"


class AchievementMetric(StrEnum):
    LESSONS_COMPLETED = "lessons_completed"
    STREAK = "streak"
    TOTAL_XP = "total_xp"
    PERFECT_LESSONS = "perfect_lessons"
    UNITS_COMPLETED = "units_completed"


class SkillState(StrEnum):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


def check_in(column: str, enum: type[StrEnum]) -> str:
    """SQL fragment for a CHECK constraint restricting a column to an enum."""
    values = ", ".join(f"'{member.value}'" for member in enum)
    return f"{column} IN ({values})"
