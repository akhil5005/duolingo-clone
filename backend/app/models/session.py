"""Server-side lesson sessions.

The queue of exercises lives on the server so XP cannot be faked: the client
can only answer the exercise at the head of the queue, and the server decides
correctness, hearts and XP.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import SessionMode, SessionStatus, check_in


class LessonSession(Base):
    __tablename__ = "lesson_sessions"
    __table_args__ = (
        CheckConstraint(check_in("mode", SessionMode), name="ck_session_mode"),
        CheckConstraint(check_in("status", SessionStatus), name="ck_session_status"),
        Index("ix_lesson_sessions_user_status", "user_id", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    # NULL for practice/legendary sessions, which draw from a whole skill.
    lesson_id: Mapped[int | None] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True, index=True
    )
    mode: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(16), default=SessionStatus.ACTIVE)
    # Remaining exercise ids, in order. A wrong answer moves its id to the back.
    exercise_queue: Mapped[list[int]] = mapped_column(JSON, default=list)
    answered_correct: Mapped[list[int]] = mapped_column(JSON, default=list)
    total_exercises: Mapped[int] = mapped_column(Integer)
    mistakes: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    answers: Mapped[list["SessionAnswer"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class SessionAnswer(Base):
    """An audit row per submitted answer; used for accuracy and debugging."""

    __tablename__ = "session_answers"
    __table_args__ = (Index("ix_session_answers_session", "session_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("lesson_sessions.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id", ondelete="CASCADE"))
    answer: Mapped[dict[str, Any]] = mapped_column(JSON)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    answered_at: Mapped[datetime] = mapped_column(DateTime)

    session: Mapped[LessonSession] = relationship(back_populates="answers")
