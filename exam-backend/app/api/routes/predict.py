"""AI prediction endpoint powered by Claude."""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.schemas.paper import ErrorResponse
from app.schemas.prediction import PredictRequest, PredictResponse
from app.services.predictor import predict

logger = structlog.get_logger(__name__)
settings = get_settings()

router = APIRouter(prefix="/api", tags=["Predictions"])


@router.post(
    "/predict",
    response_model=PredictResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    summary="Generate AI-powered exam predictions",
)
async def generate_predictions(
    request: PredictRequest,
    db: Session = Depends(get_db),
):
    """Use Claude to predict likely questions for the next exam.

    Requires a completed analysis run (``analysis_id``). The analysis
    data is formatted into a structured prompt and sent to Claude,
    which returns question predictions with confidence levels.
    """
    if not settings.GOOGLE_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Google API key not configured. Set GOOGLE_API_KEY in .env",
        )

    try:
        response = predict(
            db=db,
            exam_name=request.exam_name.strip(),
            subject=request.subject.strip(),
            analysis_id=request.analysis_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("prediction_failed", error=str(exc), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Prediction generation failed: {exc}",
        )

    return response
