"""The weekly league."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.leaderboard import LeaderboardOut
from app.services import leaderboard_service

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("", response_model=LeaderboardOut)
def read_leaderboard(db: DbSession, user: CurrentUser) -> LeaderboardOut:
    return leaderboard_service.build(db, user)
