"""XP ledger and achievements."""

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import AchievementMetric, XpSource, check_in


class XpEvent(Base):
    """Append-only XP ledger.

    Every XP award is a row here. The daily goal, the weekly league and the
    7-day chart are all aggregations over this table, so they can never
    disagree. ``users.total_xp`` is a denormalised running total kept in the
    same transaction.
    """

    __tablename__ = "xp_events"
    __table_args__ = (
        CheckConstraint(check_in("source", XpSource), name="ck_xp_source"),
        Index("ix_xp_events_user_date", "user_id", "activity_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    amount: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(16))
    session_id: Mapped[str | None] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="SET NULL"), nullable=True
    )
    # The learner's local date (from core.clock), not the server's UTC date.
    activity_date: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime)


class Achievement(Base):
    """Catalogue row: "reach <threshold> of <metric>"."""

    __tablename__ = "achievements"
    __table_args__ = (
        CheckConstraint(check_in("metric", AchievementMetric), name="ck_achievement_metric"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(200))
    icon: Mapped[str] = mapped_column(String(16))
    metric: Mapped[str] = mapped_column(String(32))
    threshold: Mapped[int] = mapped_column(Integer)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    unlocked_at: Mapped[datetime] = mapped_column(DateTime)
