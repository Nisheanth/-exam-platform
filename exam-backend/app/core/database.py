"""SQLAlchemy engine, session factory, and Base declarative class.

Uses SQLite by default (zero-install, built into Python).
Switch DATABASE_URL in .env to a PostgreSQL URL for production.
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# ── Engine ───────────────────────────────────────────────────────────────────
# SQLite needs connect_args; PostgreSQL doesn't need them.
_db_url = settings.database_url
_is_sqlite = _db_url.startswith("sqlite")

_engine_kwargs: dict = {}
if _is_sqlite:
    # SQLite: allow access from multiple threads (needed by FastAPI/uvicorn)
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL connection pool settings
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20
    _engine_kwargs["pool_pre_ping"] = True

engine = create_engine(
    _db_url,
    echo=False,  # Set to True to see SQL in terminal
    **_engine_kwargs,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


# ── Dependency for FastAPI ────────────────────────────────────────────────────
def get_db() -> Session:  # type: ignore[misc]
    """Yield a transactional DB session, auto-closing on exit."""
    db = SessionLocal()
    try:
        yield db  # type: ignore[misc]
    finally:
        db.close()


def init_db() -> None:
    """Create all tables in the database.

    Called once at application startup.  For SQLite, no extensions are needed.
    For PostgreSQL with pgvector, the extension is created if the driver
    supports it (errors are silently ignored so the server still boots).
    """
    log = logging.getLogger(__name__)

    if not _is_sqlite:
        # Try to enable pgvector — only meaningful on PostgreSQL
        try:
            from sqlalchemy import text
            with engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        except Exception as exc:  # noqa: BLE001
            log.warning("pgvector extension not available (non-fatal): %s", exc)

    # Create all tables defined via ORM models
    Base.metadata.create_all(bind=engine)
    log.info("Database tables created / verified.")
