"""Current-learner endpoints. Routers parse and delegate; rules live in services."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.me import MeOut, MeUpdate
from app.services import me_service

router = APIRouter(prefix="/api/me", tags=["me"])


@router.get("", response_model=MeOut)
def read_me(db: DbSession, user: CurrentUser) -> MeOut:
    result = me_service.build(db, user)
    db.commit()  # persists lazily-applied heart regen / streak breaks
    return result


@router.patch("", response_model=MeOut)
def update_me(patch: MeUpdate, db: DbSession, user: CurrentUser) -> MeOut:
    result = me_service.update(db, user, patch)
    db.commit()
    return result


@router.post("/hearts/refill", response_model=MeOut)
def refill_hearts(db: DbSession, user: CurrentUser) -> MeOut:
    result = me_service.refill_hearts(db, user)
    db.commit()
    return result
