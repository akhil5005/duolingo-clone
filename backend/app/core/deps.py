"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import NotFoundError
from app.models.user import User
from app.repositories import user_repo

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(db: DbSession) -> User:
    """Resolve the logged-in learner.

    Authentication is deliberately simplified for this assignment: there is one
    seeded learner flagged ``is_default_learner``. This dependency is the single
    seam where a real token/session lookup would be dropped in later; nothing
    else in the codebase knows how the user was identified.
    """
    user = user_repo.get_default_learner(db)
    if user is None:
        raise NotFoundError("No default learner has been seeded.", code="NO_LEARNER")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
