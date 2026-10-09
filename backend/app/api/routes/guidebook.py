"""The unit guidebook: key phrases and grammar notes for the current course."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.guidebook import GuidebookOut
from app.services import guidebook_service

router = APIRouter(prefix="/api/guidebook", tags=["guidebook"])


@router.get("", response_model=GuidebookOut)
def read_guidebook(db: DbSession, user: CurrentUser) -> GuidebookOut:
    return guidebook_service.build(db, user)
