"""Heart economy: lazy regeneration, spending, refilling.

Hearts regenerate in real time without a scheduler. Instead of a background
job, the balance is recomputed from ``hearts_updated_at`` every time the user
row is read or written, which is cheap and survives restarts (important on a
free-tier host that sleeps).
"""

from datetime import datetime, timedelta

from app.core import clock
from app.core.config import get_settings
from app.core.errors import ConflictError, PaymentRequiredError
from app.models.user import HEART_REFILL_COST_GEMS, MAX_HEARTS, User


def _regen_minutes() -> int:
    return get_settings().heart_regen_minutes


def apply_regen(user: User) -> None:
    """Credit any hearts earned since ``hearts_updated_at``.

    The leftover time is preserved: if 90 minutes passed at a 60-minute rate the
    learner gets one heart and keeps 30 minutes of progress towards the next.
    """
    now = clock.naive_now()
    if user.hearts >= MAX_HEARTS:
        user.hearts_updated_at = now
        return

    minutes = _regen_minutes()
    elapsed = (now - user.hearts_updated_at).total_seconds() / 60
    gained = int(elapsed // minutes)
    if gained <= 0:
        return

    user.hearts = min(MAX_HEARTS, user.hearts + gained)
    if user.hearts >= MAX_HEARTS:
        user.hearts_updated_at = now
    else:
        user.hearts_updated_at = user.hearts_updated_at + timedelta(minutes=gained * minutes)


def next_heart_at(user: User) -> datetime | None:
    """When the next heart lands, or ``None`` when the learner is full."""
    if user.hearts >= MAX_HEARTS:
        return None
    due = user.hearts_updated_at + timedelta(minutes=_regen_minutes())
    return due.replace(tzinfo=clock.timezone())


def spend_heart(user: User) -> None:
    """Take one heart for a wrong answer in lesson mode."""
    if user.hearts <= 0:
        return
    # Freeze the regen window at the moment of the first loss, otherwise a full
    # learner would appear to have been waiting since their last top-up.
    if user.hearts >= MAX_HEARTS:
        user.hearts_updated_at = clock.naive_now()
    user.hearts -= 1


def grant_heart(user: User) -> None:
    """Reward one heart (practice mode), never above the cap."""
    if user.hearts >= MAX_HEARTS:
        return
    user.hearts += 1
    if user.hearts >= MAX_HEARTS:
        user.hearts_updated_at = clock.naive_now()


def refill(user: User) -> None:
    """Buy a full set of hearts with (mocked) gems."""
    apply_regen(user)
    if user.hearts >= MAX_HEARTS:
        raise ConflictError("Your hearts are already full.", code="HEARTS_FULL")
    if user.gems < HEART_REFILL_COST_GEMS:
        raise PaymentRequiredError(
            f"You need {HEART_REFILL_COST_GEMS} gems to refill your hearts."
        )
    user.gems -= HEART_REFILL_COST_GEMS
    user.hearts = MAX_HEARTS
    user.hearts_updated_at = clock.naive_now()
