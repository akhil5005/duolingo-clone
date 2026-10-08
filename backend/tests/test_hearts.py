"""Heart regeneration, spending and refilling, against a frozen clock."""

from datetime import timedelta

import pytest
from sqlalchemy.orm import Session

from app.core import clock
from app.core.config import get_settings
from app.core.errors import ConflictError, PaymentRequiredError
from app.models.user import HEART_REFILL_COST_GEMS, MAX_HEARTS, User
from app.services import hearts_service

from tests.conftest import FROZEN_NOW


def minutes_ago(minutes: int) -> object:
    return (FROZEN_NOW + timedelta(minutes=-minutes)).replace(tzinfo=None)


def regen_minutes() -> int:
    return get_settings().heart_regen_minutes


def test_no_regeneration_before_a_full_interval(seeded_db: Session, learner: User) -> None:
    learner.hearts = 2
    learner.hearts_updated_at = minutes_ago(regen_minutes() - 1)

    hearts_service.apply_regen(learner)

    assert learner.hearts == 2


def test_one_heart_per_interval(seeded_db: Session, learner: User) -> None:
    learner.hearts = 2
    learner.hearts_updated_at = minutes_ago(regen_minutes())

    hearts_service.apply_regen(learner)

    assert learner.hearts == 3


def test_leftover_time_carries_over(seeded_db: Session, learner: User) -> None:
    """90 minutes at a 60-minute rate is one heart plus 30 minutes of credit."""
    learner.hearts = 1
    learner.hearts_updated_at = minutes_ago(int(regen_minutes() * 1.5))

    hearts_service.apply_regen(learner)

    assert learner.hearts == 2
    elapsed = (clock.naive_now() - learner.hearts_updated_at).total_seconds() / 60
    assert round(elapsed) == round(regen_minutes() * 0.5)


def test_regeneration_stops_at_the_cap(seeded_db: Session, learner: User) -> None:
    learner.hearts = 1
    learner.hearts_updated_at = minutes_ago(regen_minutes() * 20)

    hearts_service.apply_regen(learner)

    assert learner.hearts == MAX_HEARTS
    assert hearts_service.next_heart_at(learner) is None


def test_next_heart_at_is_one_interval_away(seeded_db: Session, learner: User) -> None:
    learner.hearts = 3
    learner.hearts_updated_at = clock.naive_now()

    due = hearts_service.next_heart_at(learner)

    assert due is not None
    assert round((due.replace(tzinfo=None) - clock.naive_now()).total_seconds() / 60) == (
        regen_minutes()
    )


def test_spending_from_full_starts_the_regeneration_clock(
    seeded_db: Session, learner: User
) -> None:
    """Otherwise a full learner would appear to have been waiting for hours."""
    learner.hearts = MAX_HEARTS
    learner.hearts_updated_at = minutes_ago(regen_minutes() * 5)

    hearts_service.spend_heart(learner)

    assert learner.hearts == MAX_HEARTS - 1
    assert learner.hearts_updated_at == clock.naive_now()


def test_spending_never_goes_below_zero(seeded_db: Session, learner: User) -> None:
    learner.hearts = 0

    hearts_service.spend_heart(learner)

    assert learner.hearts == 0


def test_granting_never_exceeds_the_cap(seeded_db: Session, learner: User) -> None:
    learner.hearts = MAX_HEARTS

    hearts_service.grant_heart(learner)

    assert learner.hearts == MAX_HEARTS


def test_refill_costs_gems_and_fills_up(seeded_db: Session, learner: User) -> None:
    learner.hearts = 1
    learner.gems = HEART_REFILL_COST_GEMS

    hearts_service.refill(learner)

    assert learner.hearts == MAX_HEARTS
    assert learner.gems == 0


def test_refill_without_enough_gems_is_rejected(seeded_db: Session, learner: User) -> None:
    learner.hearts = 1
    learner.gems = HEART_REFILL_COST_GEMS - 1

    with pytest.raises(PaymentRequiredError):
        hearts_service.refill(learner)

    assert learner.hearts == 1


def test_refill_when_already_full_is_rejected(seeded_db: Session, learner: User) -> None:
    learner.hearts = MAX_HEARTS
    learner.gems = HEART_REFILL_COST_GEMS

    with pytest.raises(ConflictError):
        hearts_service.refill(learner)

    assert learner.gems == HEART_REFILL_COST_GEMS


def test_simulating_a_day_regenerates_every_heart(seeded_db: Session, learner: User) -> None:
    """The developer tool shifts the whole clock, not just the date."""
    learner.hearts = 0
    learner.hearts_updated_at = clock.naive_now()

    clock.set_day_offset(1)
    hearts_service.apply_regen(learner)

    assert learner.hearts == MAX_HEARTS
