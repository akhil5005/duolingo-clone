"""Demo tooling for the settings screen.

Streaks and heart regeneration are time-based, which makes them awkward to show
off in a five-minute demo. Rather than mocking the rules, these tools move the
app's clock: every date rule reads ``core.clock``, so advancing the day
exercises exactly the same code paths a real day would.
"""

from datetime import date

from sqlalchemy.orm import Session

from app.core import clock
from app.core.config import get_settings
from app.core.errors import NotFoundError
from app.models.gamification import UserAchievement, XpEvent
from app.models.progress import UserSkillProgress
from app.models.session import LessonSession, SessionAnswer
from app.models.user import User
from app.repositories import app_state_repo, content_repo
from app.seed.seed import seed_learners

MAX_ADVANCE_DAYS = 365


def ensure_enabled() -> None:
    if not get_settings().debug_tools_enabled:
        raise NotFoundError("Developer tools are disabled on this server.")


def advance_day(db: Session, days: int) -> date:
    """Shift the app's idea of today, and remember it across restarts."""
    offset = app_state_repo.get_day_offset(db) + days
    offset = max(-MAX_ADVANCE_DAYS, min(MAX_ADVANCE_DAYS, offset))
    app_state_repo.set_day_offset(db, offset)
    clock.set_day_offset(offset)
    return clock.today()


def reset_demo(db: Session) -> None:
    """Put the demo back to its seeded state, dated relative to today."""
    db.query(SessionAnswer).delete()
    db.query(LessonSession).delete()
    db.query(XpEvent).delete()
    db.query(UserAchievement).delete()
    db.query(UserSkillProgress).delete()
    db.query(User).delete()

    app_state_repo.set_day_offset(db, 0)
    clock.set_day_offset(0)
    db.flush()

    plain = content_repo.get_course(db)
    course = content_repo.get_course_tree(db, plain.id) if plain else None
    if course is None:
        raise NotFoundError("No course has been seeded yet.")
    seed_learners(db, course)
