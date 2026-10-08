"""Demo-only tooling, gated by DEBUG_TOOLS_ENABLED."""

from datetime import date

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core import clock
from app.core.deps import DbSession
from app.services import debug_service

router = APIRouter(prefix="/api/debug", tags=["debug"])


class AdvanceDayIn(BaseModel):
    days: int = Field(default=1, ge=-30, le=30)


class AdvanceDayOut(BaseModel):
    today: date
    day_offset: int


class ResetOut(BaseModel):
    status: str


@router.post("/advance-day", response_model=AdvanceDayOut)
def advance_day(body: AdvanceDayIn, db: DbSession) -> AdvanceDayOut:
    debug_service.ensure_enabled()
    today = debug_service.advance_day(db, body.days)
    db.commit()
    return AdvanceDayOut(today=today, day_offset=clock.day_offset())


@router.post("/reset", response_model=ResetOut)
def reset(db: DbSession) -> ResetOut:
    debug_service.ensure_enabled()
    debug_service.reset_demo(db)
    db.commit()
    return ResetOut(status="reset")
