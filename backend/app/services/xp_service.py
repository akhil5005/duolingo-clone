"""XP awards.

Writing an ``xp_events`` row is the only way XP is created. ``users.total_xp``
is kept in step in the same transaction so reads stay a single column lookup,
while every aggregate (daily goal, league, 7-day chart) derives from the ledger.
"""

from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from app.core import clock
from app.models.gamification import XpEvent
from app.models.user import User
from app.repositories import xp_repo

PERFECT_LESSON_BONUS = 5
PRACTICE_XP = 5
LEGENDARY_XP = 40


@dataclass(frozen=True)
class XpLine:
    label: str
    amount: int


def award(
    db: Session,
    user: User,
    lines: list[XpLine],
    *,
    source: str,
    session_id: str | None = None,
    bonus_source: str = "bonus",
    day: date | None = None,
) -> int:
    """Persist one ledger row per XP line and bump the learner's total.

    The first line carries the session's own source; extra lines (the perfect
    bonus) are recorded separately so the breakdown stays auditable.
    """
    activity_date = day or clock.today()
    created_at = clock.naive_now()
    total = 0
    for index, line in enumerate(lines):
        if line.amount <= 0:
            continue
        db.add(
            XpEvent(
                user_id=user.id,
                amount=line.amount,
                source=source if index == 0 else bonus_source,
                session_id=session_id,
                activity_date=activity_date,
                created_at=created_at,
            )
        )
        total += line.amount
    user.total_xp += total
    return total


def today_xp(db: Session, user_id: int) -> int:
    return xp_repo.total_on(db, user_id, clock.today())
