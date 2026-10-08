"""Tiny key/value table for app-wide state that outlives a request.

Currently only ``day_offset``, which backs the "simulate next day" demo tool.
"""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

DAY_OFFSET_KEY = "day_offset"


class AppState(Base):
    __tablename__ = "app_state"

    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    value: Mapped[str] = mapped_column(Text)
