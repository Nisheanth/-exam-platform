"""Convenience script to start the FastAPI server locally."""

import uvicorn
from app.core.config import get_settings


def main():
    settings = get_settings()
    print(f"Starting Exam Pattern Analyzer API on {settings.APP_HOST}:{settings.APP_PORT}")
    print(f"  Environment: {settings.APP_ENV}")
    print(f"  Docs: http://localhost:{settings.APP_PORT}/docs")
    print(f"  Health: http://localhost:{settings.APP_PORT}/health")
    print()

    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_DEBUG,
        log_level="info",
    )


if __name__ == "__main__":
    main()
