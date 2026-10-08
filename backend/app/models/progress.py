"""Per-skill learner progress.

Only the raw counter is stored. ``locked / available / in_progress / completed``
is derived in path_service from this counter plus the skill ordering, so the
lock state can never drift out of sync with the content.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True, index=True
    )
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    legendary_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
