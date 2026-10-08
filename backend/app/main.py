"""FastAPI application factory."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import leaderboard, me, path
from app.core import clock
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.core.errors import register_error_handlers
from app.repositories import app_state_repo, content_repo
from app.seed.seed import seed_all


def _bootstrap() -> None:
    """Prepare the database for serving.

    There is no migration tool by design: the schema is created from the models,
    and the demo content is re-seeded whenever the database comes up empty. That
    matters on a free host with an ephemeral filesystem, where the SQLite file
    disappears on every redeploy, restart and idle spin-down.
    """
    Base.metadata.create_all(bind=engine)
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
    app.include_router(leaderboard.router)

    @app.get("/health", tags=["meta"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
