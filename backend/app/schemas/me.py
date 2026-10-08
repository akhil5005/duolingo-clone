"""Schemas for the current learner."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class CourseBrief(BaseModel):
    title: str
    flag_emoji: str
    language_code: str


class MeOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    total_xp: int
    gems: int
    hearts: int
    max_hearts: int
    next_heart_at: datetime | None
    # The client counts down to next_heart_at; it needs the server's clock to do
    # that correctly while the "simulate next day" demo offset is active.
    server_now: datetime
    streak: int
    longest_streak: int
    last_active_date: date | None
    today_xp: int
    daily_goal_xp: int
    # Monday-to-Sunday activity flags for the streak calendar popover.
    week_activity: list[bool]
    sound_enabled: bool
    course: CourseBrief | None


class MeUpdate(BaseModel):
    display_name: Annotated[str, Field(min_length=1, max_length=40)] | None = None
    daily_goal_xp: Literal[10, 20, 30, 50] | None = None
    sound_enabled: bool | None = None
