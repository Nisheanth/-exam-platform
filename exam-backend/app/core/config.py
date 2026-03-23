"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object – values come from .env / env vars."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── App ──────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # ── PostgreSQL (only used if DATABASE_URL points to PostgreSQL) ──────
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "exam_user"
    POSTGRES_PASSWORD: str = "exam_password"
    POSTGRES_DB: str = "exam_analyzer"

    # ── Redis / Celery ───────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Google Gemini ─────────────────────────────────────────────────
    GOOGLE_API_KEY: str = ""

    # ── Anthropic (legacy – not used; kept for compat) ───────────────────
    ANTHROPIC_API_KEY: str = ""

    # ── Tesseract ────────────────────────────────────────────────────────
    TESSERACT_CMD: str = "tesseract"

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── Uploads ──────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"

    # ── Database URL ─────────────────────────────────────────────────────
    # Default: SQLite → zero-install, file created automatically.
    # For production set in .env:
    #   DATABASE_URL=postgresql://exam_user:exam_password@localhost/exam_analyzer
    DATABASE_URL: str = "sqlite:///exam_analyzer.db"

    # ── Derived ──────────────────────────────────────────────────────────
    @property
    def database_url(self) -> str:
        return self.DATABASE_URL

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("sqlite:"):
            return url.replace("sqlite:", "sqlite+aiosqlite:", 1)
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def upload_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()
