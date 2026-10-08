"""Schemas for the learner profile."""

from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.me import CourseBrief


class ProfileUserOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    course: CourseBrief | None


class ProfileStatsOut(BaseModel):
    streak: int
    longest_streak: int
    total_xp: int
    league: str
    # Mocked: there is a single league in this build, so nobody has finished a
    # week in the top three yet.
    top3_finishes: int
    lessons_completed: int
    joined_at: datetime


class AchievementProgressOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    metric: str
    current: int
    threshold: int
    unlocked_at: datetime | None


class DailyXpOut(BaseModel):
    date: date
    xp: int


class ProfileOut(BaseModel):
    user: ProfileUserOut
    stats: ProfileStatsOut
    achievements: list[AchievementProgressOut]
    xp_last_7_days: list[DailyXpOut]
