"""Application settings, loaded from environment variables / .env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./duolingo.db"
    cors_origins: str = "http://localhost:3000"
    cors_origin_regex: str = r"https://.*\.vercel\.app"
    app_timezone: str = "Asia/Kolkata"
    heart_regen_minutes: int = 60
    debug_tools_enabled: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        # Browsers send the Origin header without a trailing slash, so a configured
        # "https://app.vercel.app/" would never match. Normalise it away.
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
