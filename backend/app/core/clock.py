"""The single source of time for the whole backend.

Every date/time rule (streaks, hearts regeneration, the daily goal, the weekly
league) reads the clock through this module. Using ``datetime.now()`` anywhere
else is a bug: it would bypass the simulated-day offset that lets the demo jump
forward in time, and it would use the server's timezone instead of the
learner's.
"""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.core.config import get_settings

_day_offset: int = 0
_frozen_now: datetime | None = None


def timezone() -> ZoneInfo:
    return ZoneInfo(get_settings().app_timezone)


def set_day_offset(days: int) -> None:
    """Shift the app's idea of "now" by whole days (debug / demo tooling)."""
    global _day_offset
    _day_offset = days


def day_offset() -> int:
    return _day_offset


def freeze(moment: datetime | None) -> None:
    """Pin ``now()`` to a fixed moment. Tests only; ``None`` resumes real time."""
    global _frozen_now
    _frozen_now = moment


def now() -> datetime:
    """Timezone-aware current moment, including the simulated day offset."""
    base = _frozen_now if _frozen_now is not None else datetime.now(timezone())
    return base.astimezone(timezone()) + timedelta(days=_day_offset)


def today() -> date:
    return now().date()


def start_of_week(day: date | None = None) -> date:
    """Monday of the week containing ``day`` (leagues run Monday-Sunday)."""
    anchor = day or today()
    return anchor - timedelta(days=anchor.weekday())


def naive_now() -> datetime:
    """``now()`` without tzinfo, for SQLite DATETIME columns.

    SQLite has no native timezone support, so storing aware datetimes and
    reading them back gives naive values anyway. We normalise on write so every
    stored timestamp is comparable (all are app-timezone local time).
    """
    return now().replace(tzinfo=None)
