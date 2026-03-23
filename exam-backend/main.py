"""FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import analysis, papers, predict, chat
from app.core.config import get_settings
from app.core.database import init_db

# ── IMPORTANT: Import all ORM models so SQLAlchemy's Base.metadata ───────────
# knows about them before init_db() calls create_all().
import app.models.paper     # noqa: F401  registers Paper + Question
import app.models.analysis  # noqa: F401  registers AnalysisResult

# ── Structlog configuration ───────────────────────────────────────────────────
try:
    # structlog 21+ preferred chain
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
except AttributeError:
    # Fallback for older structlog versions
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

logger = structlog.get_logger(__name__)
settings = get_settings()


# ── Lifespan (replaces deprecated @app.on_event) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise DB tables. Shutdown: nothing special needed."""
    logger.info("app_startup", env=settings.APP_ENV, db=settings.database_url)
    try:
        init_db()
        logger.info("database_initialised")
    except Exception as exc:  # noqa: BLE001
        logger.error("database_init_failed", error=str(exc))
        # Allow server to start even if DB init fails (tables may already exist)
    yield
    logger.info("app_shutdown")


# ── App creation ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Exam Pattern Analyzer & Predictor",
    description=(
        "Analyse historical exam papers to identify question patterns, "
        "topic frequency trends, and generate AI-powered predictions "
        "for upcoming exams."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return a consistent JSON error shape for unhandled exceptions."""
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Simple liveness probe — returns ok when the server is running."""
    return {"status": "ok", "version": "1.0.0"}


# ── Register routers ──────────────────────────────────────────────────────────
app.include_router(papers.router)
app.include_router(analysis.router)
app.include_router(predict.router)
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


# ── Run directly ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=False,  # Set to True only in dev; causes issues with SQLite
    )
