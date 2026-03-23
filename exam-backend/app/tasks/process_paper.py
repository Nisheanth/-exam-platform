"""Paper processing pipeline.

Runs as a Celery task when Redis is available.
Falls back to a synchronous call when Redis is not reachable (no Docker needed).
"""

from __future__ import annotations

import json
import uuid
from pathlib import Path

import structlog

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.paper import Paper, Question
from app.services.ocr import extract_text
from app.services.parser import parse_questions
from app.services.embedder import encode
from app.services.classifier import classify_batch

logger = structlog.get_logger(__name__)
settings = get_settings()

# ── Attempt to set up Celery; degrade gracefully if Redis is unavailable ──────
_celery_app = None
try:
    from celery import Celery

    _celery_app = Celery(
        "exam_tasks",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
    )
    _celery_app.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
        broker_connection_retry_on_startup=False,
    )
    logger.info("celery_configured", broker=settings.REDIS_URL)
except Exception as _exc:  # noqa: BLE001
    logger.warning("celery_unavailable", reason=str(_exc))


# ── Core processing logic (used by both Celery task and sync fallback) ────────
def _run_pipeline(paper_id: str, file_path: str) -> dict:
    """Execute the full paper processing pipeline synchronously."""
    db = SessionLocal()
    paper_uuid = str(paper_id)

    try:
        paper = db.query(Paper).filter(Paper.id == paper_uuid).first()
        if not paper:
            raise ValueError(f"Paper {paper_id} not found in database")

        logger.info("task_start", paper_id=paper_id, file=file_path)

        # ── Step 1: Extract text ──────────────────────────────────────
        try:
            pages = extract_text(file_path)
        except Exception as exc:
            logger.error("ocr_failed", paper_id=paper_id, error=str(exc))
            paper.status = "failed"
            paper.error_message = f"Text extraction failed: {exc}"
            db.commit()
            raise

        if not pages or all(len(p.strip()) == 0 for p in pages):
            paper.status = "failed"
            paper.error_message = "No text could be extracted from the file"
            db.commit()
            return {"paper_id": paper_id, "status": "failed", "questions": 0}

        logger.info("text_extracted", paper_id=paper_id, pages=len(pages))

        # ── Step 2: Parse questions ───────────────────────────────────
        parsed = parse_questions(pages)

        if not parsed:
            paper.status = "failed"
            paper.error_message = "No questions could be parsed from the text"
            db.commit()
            return {"paper_id": paper_id, "status": "failed", "questions": 0}

        logger.info("questions_parsed", paper_id=paper_id, count=len(parsed))

        # ── Step 3: Create Question records ───────────────────────────
        question_objs: list[Question] = []
        question_texts: list[str] = []

        for pq in parsed:
            q = Question(
                id=str(uuid.uuid4()),
                paper_id=paper_uuid,
                text=pq.text,
                topic=None,
                question_type=pq.question_type,
                marks=pq.marks,
            )
            question_objs.append(q)
            question_texts.append(pq.text)

        db.add_all(question_objs)
        db.flush()

        # ── Step 4: Classify topics ────────────────────────────────────
        try:
            subject = paper.subject or ""
            topics = classify_batch(question_texts, subject)
            for q, topic in zip(question_objs, topics):
                q.topic = topic
            db.flush()
        except Exception as exc:
            logger.warning("topic_classification_failed", error=str(exc))

        # ── Step 5: Generate embeddings ────────────────────────────────
        try:
            embeddings = encode(question_texts)
            for q, emb in zip(question_objs, embeddings):
                q.embedding = json.dumps(emb.tolist())
            db.flush()
        except Exception as exc:
            logger.warning("embedding_failed", error=str(exc))

        # ── Step 6: Update paper status ───────────────────────────────
        paper.status = "complete"
        paper.questions_extracted = len(question_objs)
        paper.error_message = None
        db.commit()

        logger.info("task_complete", paper_id=paper_id, questions=len(question_objs))

        return {
            "paper_id": paper_id,
            "status": "complete",
            "questions": len(question_objs),
        }

    except Exception as exc:
        db.rollback()
        try:
            paper = db.query(Paper).filter(Paper.id == paper_uuid).first()
            if paper and paper.status != "failed":
                paper.status = "failed"
                paper.error_message = str(exc)
                db.commit()
        except Exception:
            pass
        logger.error("task_failed", paper_id=paper_id, error=str(exc))
        raise

    finally:
        db.close()


# ── Public interface ──────────────────────────────────────────────────────────
class _SyncTask:
    """Mimics Celery's task.delay() interface but runs synchronously."""

    class _FakeResult:
        id = "sync-no-celery"

    def delay(self, paper_id: str, file_path: str) -> "_SyncTask._FakeResult":
        logger.info("running_synchronously", paper_id=paper_id)
        try:
            _run_pipeline(paper_id, file_path)
        except Exception as exc:  # noqa: BLE001
            logger.error("sync_pipeline_failed", error=str(exc))
        return self._FakeResult()


if _celery_app is not None:
    @_celery_app.task(bind=True, name="process_paper", max_retries=2)
    def process_paper_task(self, paper_id: str, file_path: str) -> dict:
        """Celery task wrapper around the core pipeline."""
        try:
            return _run_pipeline(paper_id, file_path)
        except Exception as exc:
            if self.request.retries < self.max_retries:
                raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
            raise
else:
    process_paper_task = _SyncTask()  # type: ignore[assignment]
