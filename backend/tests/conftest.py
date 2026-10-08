"""Shared test fixtures: an in-memory database, seeded content and a frozen clock."""

from collections.abc import Iterator
from datetime import datetime
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core import clock
from app.core.database import Base, get_db
from app.main import create_app
from app.models.user import User
from app.repositories import user_repo
from app.seed.seed import seed_all

# A fixed Thursday morning: late enough in the week that the seeded league has
# several days of history, so week-based assertions are stable.
FROZEN_NOW = datetime(2026, 10, 8, 9, 0, tzinfo=ZoneInfo("Asia/Kolkata"))


@pytest.fixture(autouse=True)
def frozen_clock() -> Iterator[None]:
    clock.freeze(FROZEN_NOW)
    clock.set_day_offset(0)
    yield
    clock.freeze(None)
    clock.set_day_offset(0)


@pytest.fixture
def engine(frozen_clock: None) -> Iterator[Engine]:
    # StaticPool keeps every connection pointed at the same in-memory database.
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def db(engine: Engine) -> Iterator[Session]:
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with factory() as session:
        yield session


@pytest.fixture
def seeded_db(db: Session) -> Session:
    seed_all(db)
    return db


@pytest.fixture
def learner(seeded_db: Session) -> User:
    user = user_repo.get_default_learner(seeded_db)
    assert user is not None
    return user


@pytest.fixture
def client(seeded_db: Session) -> Iterator[TestClient]:
    """An API client bound to the in-memory database.

    ``TestClient`` is used without its context manager on purpose: that skips
    the app's lifespan, which would otherwise create and seed the real
    on-disk database.
    """
    app = create_app()
    app.dependency_overrides[get_db] = lambda: seeded_db
    yield TestClient(app)
    app.dependency_overrides.clear()
