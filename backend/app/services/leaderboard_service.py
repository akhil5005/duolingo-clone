"""The weekly league table.

Ranking is an aggregation over the XP ledger for the current Monday-to-Sunday
window, so it reflects exactly the XP the learner can see elsewhere in the app.
There is only one league in this build; real Duolingo shards learners into
leagues of thirty, which is a grouping on top of the same query.
"""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.core import clock
from app.models.user import User
from app.repositories import user_repo, xp_repo
from app.schemas.leaderboard import LeaderboardOut, LeaderboardRowOut

LEAGUE_NAME = "Bronze League"
PROMOTION_PLACES = 5
DEMOTION_PLACES = 3

ZONE_PROMOTION = "promotion"
ZONE_DEMOTION = "demotion"
ZONE_NONE = "none"


def _zone(rank: int, total: int) -> str:
    if rank <= PROMOTION_PLACES:
        return ZONE_PROMOTION
    if total > PROMOTION_PLACES + DEMOTION_PLACES and rank > total - DEMOTION_PLACES:
        return ZONE_DEMOTION
    return ZONE_NONE


def build(db: Session, me: User) -> LeaderboardOut:
    week_start = clock.start_of_week()
    week_end = week_start + timedelta(days=6)
    totals = xp_repo.weekly_totals_all_users(db, week_start, week_end)
    users = user_repo.list_users(db)

    # Ties are broken by display name so the order is stable between requests.
    ranked = sorted(users, key=lambda user: (-totals.get(user.id, 0), user.display_name))
    total = len(ranked)

    rows = [
        LeaderboardRowOut(
            rank=rank,
            user_id=user.id,
            display_name=user.display_name,
            avatar_color=user.avatar_color,
            xp=totals.get(user.id, 0),
            is_me=user.id == me.id,
            zone=_zone(rank, total),
        )
        for rank, user in enumerate(ranked, start=1)
    ]

    return LeaderboardOut(
        league_name=LEAGUE_NAME,
        days_left=(week_end - clock.today()).days + 1,
        my_rank=next((row.rank for row in rows if row.is_me), None),
        promotion_cutoff=PROMOTION_PLACES,
        demotion_cutoff=max(0, total - DEMOTION_PLACES),
        rows=rows,
    )
