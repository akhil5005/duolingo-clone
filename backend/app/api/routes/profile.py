"""The learner profile page."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.profile import ProfileOut
from app.services import profile_service

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def read_profile(db: DbSession, user: CurrentUser) -> ProfileOut:
    result = profile_service.build(db, user)
    db.commit()  # persists a lazily-applied streak break
    return result
