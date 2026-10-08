"""Starting a session: a lesson, a practice run or a legendary challenge."""

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, DbSession
from app.schemas.session import SessionOut
from app.services import lesson_service

router = APIRouter(prefix="/api", tags=["sessions"])


@router.post(
    "/lessons/{lesson_id}/sessions",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
def start_lesson(lesson_id: int, db: DbSession, user: CurrentUser) -> SessionOut:
    result = lesson_service.start_lesson(db, user, lesson_id)
    db.commit()
    return result


@router.post(
    "/skills/{skill_id}/practice",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
def start_practice(skill_id: int, db: DbSession, user: CurrentUser) -> SessionOut:
    """``skill_id = 0`` practises everything the learner has started."""
    result = lesson_service.start_practice(db, user, skill_id)
    db.commit()
    return result


@router.post(
    "/skills/{skill_id}/legendary",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
)
def start_legendary(skill_id: int, db: DbSession, user: CurrentUser) -> SessionOut:
    result = lesson_service.start_legendary(db, user, skill_id)
    db.commit()
    return result
