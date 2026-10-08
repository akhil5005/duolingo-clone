"""Playing through an active session."""

from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.session import AnswerIn, AnswerOut, CompletionOut, SessionStatusOut
from app.services import session_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/{session_id}/answers", response_model=AnswerOut)
def submit_answer(
    session_id: str, body: AnswerIn, db: DbSession, user: CurrentUser
) -> AnswerOut:
    result = session_service.submit_answer(
        db, user, session_id, body.exercise_id, body.answer
    )
    db.commit()
    return result


@router.post("/{session_id}/complete", response_model=CompletionOut)
def complete_session(session_id: str, db: DbSession, user: CurrentUser) -> CompletionOut:
    result = session_service.complete(db, user, session_id)
    db.commit()
    return result


@router.post("/{session_id}/abandon", response_model=SessionStatusOut)
def abandon_session(session_id: str, db: DbSession, user: CurrentUser) -> SessionStatusOut:
    result = session_service.abandon(db, user, session_id)
    db.commit()
    return result
