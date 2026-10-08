"""Access to the XP ledger."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.gamification import XpEvent


def total_on(db: Session, user_id: int, day: date) -> int:
    stmt = select(func.coalesce(func.sum(XpEvent.amount), 0)).where(
        XpEvent.user_id == user_id, XpEvent.activity_date == day
    )
    return db.scalar(stmt) or 0


def totals_by_day(db: Session, user_id: int, start: date, end: date) -> dict[date, int]:
    """XP per day in the inclusive range ``[start, end]``."""
    stmt = (
        select(XpEvent.activity_date, func.coalesce(func.sum(XpEvent.amount), 0))
        .where(
            XpEvent.user_id == user_id,
            XpEvent.activity_date >= start,
            XpEvent.activity_date <= end,
        )
        .group_by(XpEvent.activity_date)
    )
    return {row[0]: row[1] for row in db.execute(stmt).all()}


def weekly_totals_all_users(db: Session, start: date, end: date) -> dict[int, int]:
    """XP per user in the inclusive range, for the league table."""
    stmt = (
        select(XpEvent.user_id, func.coalesce(func.sum(XpEvent.amount), 0))
        .where(XpEvent.activity_date >= start, XpEvent.activity_date <= end)
        .group_by(XpEvent.user_id)
    )
    return {row[0]: row[1] for row in db.execute(stmt).all()}


def active_days(db: Session, user_id: int, start: date, end: date) -> set[date]:
    stmt = (
        select(XpEvent.activity_date)
        .where(
            XpEvent.user_id == user_id,
            XpEvent.activity_date >= start,
            XpEvent.activity_date <= end,
        )
        .distinct()
    )
    return set(db.scalars(stmt).all())
