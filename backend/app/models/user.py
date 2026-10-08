"""The learner. One row per seeded user; one of them is the default learner."""

from datetime import date, datetime

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

MAX_HEARTS = 5
HEART_REFILL_COST_GEMS = 350
ALLOWED_DAILY_GOALS = (10, 20, 30, 50)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("hearts BETWEEN 0 AND 5", name="ck_user_hearts_range"),
        CheckConstraint("daily_goal_xp IN (10, 20, 30, 50)", name="ck_user_daily_goal"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True)
    display_name: Mapped[str] = mapped_column(String(80))
    avatar_color: Mapped[str] = mapped_column(String(9))
    # The single seam where real authentication would plug in later: get_current_user
    # resolves the learner by this flag instead of by a token.
    is_default_learner: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    current_course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True
    )

    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=0)
    hearts: Mapped[int] = mapped_column(Integer, default=MAX_HEARTS)
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime)

    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=20)
    sound_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime)
