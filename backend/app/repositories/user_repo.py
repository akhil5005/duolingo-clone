"""Read access to learner rows."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_default_learner(db: Session) -> User | None:
    stmt = select(User).where(User.is_default_learner.is_(True)).order_by(User.id).limit(1)
    return db.scalars(stmt).first()


def get_by_username(db: Session, username: str) -> User | None:
    return db.scalars(select(User).where(User.username == username)).first()


def list_users(db: Session) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)).all())
