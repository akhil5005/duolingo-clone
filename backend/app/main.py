"""FastAPI application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import inspect

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    courses,
    debug,
    guidebook,
    leaderboard,
    lessons,
    me,
    path,
    profile,
    sessions,
)
from app.core import clock
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.core.errors import register_error_handlers
from app.repositories import app_state_repo, content_repo
from app.seed.seed import seed_all


def _add_missing_columns() -> None:
    """Add columns the models declare but an existing file predates.

    ``create_all`` creates missing tables and nothing else, so a database that
    outlives a deploy would keep serving the old shape and fail every read. A
    real migration tool is the answer once the data is worth keeping; until
    then this covers the only change SQLite can make in place, and it is a
    no-op on the fresh file a redeploy normally produces.
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as connection:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue
            present = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in present or not (column.nullable or column.default):
                    continue
                ddl = column.type.compile(dialect=engine.dialect)
                connection.exec_driver_sql(
                    f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {ddl}'
                )


def _bootstrap() -> None:
    """Prepare the database for serving.

    There is no migration tool by design: the schema is created from the models,
    and the demo content is re-seeded whenever the database comes up empty. That
    matters on a free host with an ephemeral filesystem, where the SQLite file
    disappears on every redeploy, restart and idle spin-down.
    """
    Base.metadata.create_all(bind=engine)
    _add_missing_columns()
    with SessionLocal() as db:
        clock.set_day_offset(app_state_repo.get_day_offset(db))
        if content_repo.count_courses(db) == 0:
            seed_all(db)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    _bootstrap()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="lingoleap API",
        description="Backend for a Duolingo-style language learning app.",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=settings.cors_origin_regex or None,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)
    app.include_router(me.router)
    app.include_router(path.router)
    app.include_router(guidebook.router)
    app.include_router(courses.router)
    app.include_router(leaderboard.router)
    app.include_router(lessons.router)
    app.include_router(sessions.router)
    app.include_router(profile.router)
    app.include_router(debug.router)

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
