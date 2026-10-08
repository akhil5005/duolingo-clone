"""The app_state key/value table."""

from sqlalchemy.orm import Session

from app.models.app_state import DAY_OFFSET_KEY, AppState


def get_value(db: Session, key: str) -> str | None:
    row = db.get(AppState, key)
    return row.value if row else None


def set_value(db: Session, key: str, value: str) -> None:
    row = db.get(AppState, key)
    if row is None:
        db.add(AppState(key=key, value=value))
    else:
        row.value = value


def get_day_offset(db: Session) -> int:
    raw = get_value(db, DAY_OFFSET_KEY)
    try:
        return int(raw) if raw is not None else 0
    except ValueError:
        return 0


def set_day_offset(db: Session, days: int) -> None:
    set_value(db, DAY_OFFSET_KEY, str(days))
