"""The learning path (home screen)."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.path import PathOut
from app.services import path_service

router = APIRouter(prefix="/api/path", tags=["path"])


@router.get("", response_model=PathOut)
def read_path(db: DbSession, user: CurrentUser) -> PathOut:
    return path_service.build_path(db, user)
