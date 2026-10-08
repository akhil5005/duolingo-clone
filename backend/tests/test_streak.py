"""Streak rules, against a frozen clock."""

from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core import clock
from app.models.user import User
from app.services import streak_service


def test_first_ever_activity_starts_at_one(seeded_db: Session, learner: User) -> None:
    learner.last_active_date = None
    learner.streak_count = 0

    change = streak_service.register_activity(learner)

    assert (change.before, change.after, change.extended_today) == (0, 1, True)
    assert learner.last_active_date == clock.today()


def test_activity_yesterday_extends_the_streak(seeded_db: Session, learner: User) -> None:
    learner.last_active_date = clock.today() - timedelta(days=1)
    learner.streak_count = 4

    change = streak_service.register_activity(learner)

    assert (change.before, change.after, change.extended_today) == (4, 5, True)


def test_a_second_session_today_does_not_move_the_streak(
    seeded_db: Session, learner: User
) -> None:
    learner.last_active_date = clock.today()
    learner.streak_count = 7

    change = streak_service.register_activity(learner)

    assert (change.before, change.after, change.extended_today) == (7, 7, False)


def test_a_missed_day_restarts_at_one(seeded_db: Session, learner: User) -> None:
    learner.last_active_date = clock.today() - timedelta(days=2)
    learner.streak_count = 12

    change = streak_service.register_activity(learner)

    assert (change.before, change.after) == (0, 1)
    assert change.extended_today is True


def test_longest_streak_only_grows(seeded_db: Session, learner: User) -> None:
    learner.last_active_date = clock.today() - timedelta(days=1)
    learner.streak_count = 9
    learner.longest_streak = 30

    streak_service.register_activity(learner)

    assert learner.streak_count == 10
    assert learner.longest_streak == 30


def test_a_broken_streak_reads_as_zero_and_is_persisted(
    seeded_db: Session, learner: User
) -> None:
    """The break is applied on read, so no nightly job is needed."""
    learner.last_active_date = clock.today() - timedelta(days=3)
    learner.streak_count = 11

    assert streak_service.effective_streak(learner) == 0
    assert learner.streak_count == 0


def test_yesterdays_streak_is_still_alive(seeded_db: Session, learner: User) -> None:
    learner.last_active_date = clock.today() - timedelta(days=1)
    learner.streak_count = 11

    assert streak_service.effective_streak(learner) == 11


def test_week_activity_maps_monday_to_sunday(seeded_db: Session, learner: User) -> None:
    monday = clock.start_of_week()
    active = {monday, monday + timedelta(days=2), monday + timedelta(days=6)}

    flags = streak_service.week_activity(active, monday)

    assert flags == [True, False, True, False, False, False, True]


def test_simulating_one_day_then_a_lesson_extends_the_streak(
    client: TestClient, seeded_db: Session
) -> None:
    from tests.test_lesson_flow_api import play_out, start_next_lesson

    before = client.get("/api/me").json()["streak"]
    assert before == 4

    assert client.post("/api/debug/advance-day", json={"days": 1}).status_code == 200
    # Yesterday's activity is now two days ago, so the streak has broken.
    assert client.get("/api/me").json()["streak"] == 0

    session = start_next_lesson(client)
    play_out(client, seeded_db, session["session_id"], session["queue"])
    summary = client.post(f"/api/sessions/{session['session_id']}/complete").json()

    assert summary["streak_after"] == 1


def test_simulating_a_day_after_practising_today_keeps_the_streak_alive(
    client: TestClient, seeded_db: Session
) -> None:
    from tests.test_lesson_flow_api import play_out, start_next_lesson

    session = start_next_lesson(client)
    play_out(client, seeded_db, session["session_id"], session["queue"])
    assert client.post(f"/api/sessions/{session['session_id']}/complete").json()[
        "streak_after"
    ] == 5

    client.post("/api/debug/advance-day", json={"days": 1})
    assert client.get("/api/me").json()["streak"] == 5, "yesterday still counts"

    next_session = start_next_lesson(client)
    play_out(client, seeded_db, next_session["session_id"], next_session["queue"])
    summary = client.post(f"/api/sessions/{next_session['session_id']}/complete").json()

    assert summary["streak_after"] == 6
