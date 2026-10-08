"""Schemas for the weekly league."""

from pydantic import BaseModel


class LeaderboardRowOut(BaseModel):
    rank: int
    user_id: int
    display_name: str
    avatar_color: str
    xp: int
    is_me: bool
    zone: str


class LeaderboardOut(BaseModel):
    league_name: str
    days_left: int
    my_rank: int | None
    promotion_cutoff: int
    demotion_cutoff: int
    rows: list[LeaderboardRowOut]
