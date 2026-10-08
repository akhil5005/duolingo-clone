"""Daily streak rules.

A streak is "alive" while the learner was active today or yesterday. Rather
than a nightly job resetting broken streaks, the break is applied lazily on
read, so the number is always correct no matter how long the app slept.
"""

from dataclasses import dataclass
from datetime import date, timedelta

from app.core import clock
from app.models.user import User


@dataclass(frozen=True)
class StreakChange:
    before: int
    after: int
    extended_today: bool


def effective_streak(user: User) -> int:
    """The streak as it should be shown now, persisting a break if there is one."""
    today = clock.today()
    if user.last_active_date is None:
        user.streak_count = 0
        return 0
    if user.last_active_date < today - timedelta(days=1):
        user.streak_count = 0
        return 0
    return user.streak_count


def register_activity(user: User) -> StreakChange:
    """Record that the learner finished a session today."""
    today = clock.today()
    before = effective_streak(user)

    if user.last_active_date == today:
        extended = False  # already counted today; the streak only moves once a day
    else:
        continued = user.last_active_date == today - timedelta(days=1)
        user.streak_count = before + 1 if continued else 1
        extended = True

    user.last_active_date = today
    user.longest_streak = max(user.longest_streak, user.streak_count)
    return StreakChange(before=before, after=user.streak_count, extended_today=extended)


def week_activity(active_days: set[date], monday: date | None = None) -> list[bool]:
    """Seven Monday-to-Sunday flags for the current week's streak dots."""
    start = monday or clock.start_of_week()
    return [(start + timedelta(days=offset)) in active_days for offset in range(7)]
