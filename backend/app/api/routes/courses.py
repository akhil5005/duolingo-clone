"""The course catalogue."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.course import CourseSummaryOut
from app.services import course_service

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=list[CourseSummaryOut])
def list_courses(db: DbSession, user: CurrentUser) -> list[CourseSummaryOut]:
    return course_service.list_courses(db, user)
