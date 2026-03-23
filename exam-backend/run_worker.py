"""Convenience script to start the Celery worker locally."""

import subprocess
import sys


def main():
    print("Starting Celery worker for Exam Pattern Analyzer...")
    print("  Broker: Redis (see .env for REDIS_URL)")
    print("  Concurrency: 2 workers")
    print()

    cmd = [
        sys.executable, "-m", "celery",
        "-A", "app.tasks.process_paper.celery_app",
        "worker",
        "--loglevel=info",
        "--concurrency=2",
        "--pool=solo",  # Required on Windows
    ]

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\nCelery worker stopped.")


if __name__ == "__main__":
    main()
