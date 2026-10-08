"""The weekly league table."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.core import clock
from app.models.gamification import XpEvent
from app.models.user import User
from app.repositories import user_repo
from app.services import leaderboard_service


def test_rows_are_ranked_by_weekly_xp(seeded_db: Session, learner: User) -> None:
    board = leaderboard_service.build(seeded_db, learner)

    assert board.league_name == "Bronze League"
    assert len(board.rows) == 15  # the learner plus fourteen seeded rivals
    assert [row.rank for row in board.rows] == list(range(1, 16))
    assert [row.xp for row in board.rows] == sorted(
        (row.xp for row in board.rows), reverse=True
    )


def test_exactly_one_row_is_me_and_my_rank_matches(seeded_db: Session, learner: User) -> None:
    board = leaderboard_service.build(seeded_db, learner)

    mine = [row for row in board.rows if row.is_me]
    assert len(mine) == 1
    assert mine[0].display_name == learner.display_name
    assert board.my_rank == mine[0].rank


def test_promotion_and_demotion_zones(seeded_db: Session, learner: User) -> None:
    board = leaderboard_service.build(seeded_db, learner)

    promotion = [row.rank for row in board.rows if row.zone == "promotion"]
    demotion = [row.rank for row in board.rows if row.zone == "demotion"]

    assert promotion == [1, 2, 3, 4, 5]
    assert demotion == [13, 14, 15]


def test_only_xp_inside_the_current_week_counts(seeded_db: Session, learner: User) -> None:
    before = leaderboard_service.build(seeded_db, learner)
    my_xp_before = next(row.xp for row in before.rows if row.is_me)

    # One event last week, one today: only today's should move the total.
    seeded_db.add(
        XpEvent(
            user_id=learner.id,
            amount=500,
            source="lesson",
            activity_date=clock.start_of_week() - timedelta(days=1),
            created_at=clock.naive_now(),
        )
    )
    seeded_db.add(
        XpEvent(
            user_id=learner.id,
            amount=15,
            source="lesson",
            activity_date=clock.today(),
            created_at=clock.naive_now(),
        )
    )
    seeded_db.flush()

    after = leaderboard_service.build(seeded_db, learner)
    assert next(row.xp for row in after.rows if row.is_me) == my_xp_before + 15


def test_ties_are_broken_by_display_name(seeded_db: Session, learner: User) -> None:
    """A stable order matters: the league is re-read on every page view."""
    for user in user_repo.list_users(seeded_db):
        seeded_db.query(XpEvent).filter(XpEvent.user_id == user.id).delete()
    seeded_db.flush()

    rows = leaderboard_service.build(seeded_db, learner).rows

    assert all(row.xp == 0 for row in rows)
    assert [row.display_name for row in rows] == sorted(row.display_name for row in rows)
