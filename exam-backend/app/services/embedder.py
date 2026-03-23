"""Sentence-transformer embedding service.

NOTE: sentence-transformers / numpy are optional heavy dependencies.
If they are not installed the server still starts and all routes work;
only the embedding feature is disabled (questions are stored without vectors).
"""

from __future__ import annotations

import json
import logging
from uuid import UUID

import structlog

from app.models.paper import Question

logger = structlog.get_logger(__name__)

# Try to import heavy ML deps — degrade gracefully if missing
try:
    import numpy as np
    from sentence_transformers import SentenceTransformer

    _ML_AVAILABLE = True
    logger.info("ml_deps_available")
except ImportError:
    _ML_AVAILABLE = False
    logger.warning(
        "ml_deps_missing",
        msg="sentence-transformers / numpy not installed. Embeddings disabled.",
    )

_model = None


def _get_model():
    global _model
    if not _ML_AVAILABLE:
        return None
    if _model is None:
        logger.info("loading_embedding_model", model="all-MiniLM-L6-v2")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def encode(texts: list[str]):
    """Encode texts into embeddings. Returns None if ML deps not available."""
    if not _ML_AVAILABLE or not texts:
        return None
    model = _get_model()
    if model is None:
        return None
    embeddings = model.encode(
        texts,
        show_progress_bar=False,
        batch_size=64,
        normalize_embeddings=True,
    )
    import numpy as np
    return np.asarray(embeddings, dtype=np.float32)


def store_embeddings(db, paper_id, questions: list[Question], embeddings) -> None:
    """Persist embedding vectors. No-op if embeddings is None."""
    if embeddings is None:
        logger.info("embeddings_skipped_no_ml", paper_id=str(paper_id))
        return
    for q, emb in zip(questions, embeddings):
        q.embedding = json.dumps(emb.tolist())
    db.flush()
    logger.info("embeddings_stored", paper_id=str(paper_id), count=len(questions))
