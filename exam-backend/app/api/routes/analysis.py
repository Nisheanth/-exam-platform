"""Analysis endpoints: trigger and fetch pattern analysis."""

from __future__ import annotations

import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.analysis import AnalysisResult
from app.schemas.paper import (
    AnalysisRequest,
    AnalysisRunResponse,
    ErrorResponse,
    RepeatedQuestion,
    TopicHeatmapEntry,
    ImportantQuestion,
)
from app.services.analyzer import run_full_analysis

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.post(
    "/run",
    response_model=AnalysisRunResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="Run pattern analysis for an exam/subject",
)
async def run_analysis(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
):
    """Execute the full analysis pipeline.

    This is a synchronous endpoint that:
    1. Loads all questions for the given exam/subject
    2. Clusters questions by similarity
    3. Computes repeated questions, topic heatmap, and importance scores
    4. Stores and returns the result

    For large datasets, this may take several seconds.
    """
    try:
        analysis = run_full_analysis(
            db=db,
            exam_name=request.exam_name.strip(),
            subject=request.subject.strip(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("analysis_failed", error=str(exc))
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {exc}",
        )

    result = analysis.result_json

    return AnalysisRunResponse(
        analysis_id=analysis.id,
        repeated_questions=[
            RepeatedQuestion(**rq) for rq in result.get("repeated_questions", [])
        ],
        topic_heatmap=[
            TopicHeatmapEntry(**th) for th in result.get("topic_heatmap", [])
        ],
        important_questions=[
            ImportantQuestion(**iq) for iq in result.get("important_questions", [])
        ],
    )


@router.get(
    "/{analysis_id}",
    response_model=AnalysisRunResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Fetch a previously computed analysis by ID",
)
async def get_analysis(
    analysis_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve a stored analysis result."""
    analysis = (
        db.query(AnalysisResult)
        .filter(AnalysisResult.id == analysis_id)
        .first()
    )
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis {analysis_id} not found",
        )

    result = analysis.result_json

    return AnalysisRunResponse(
        analysis_id=analysis.id,
        repeated_questions=[
            RepeatedQuestion(**rq) for rq in result.get("repeated_questions", [])
        ],
        topic_heatmap=[
            TopicHeatmapEntry(**th) for th in result.get("topic_heatmap", [])
        ],
        important_questions=[
            ImportantQuestion(**iq) for iq in result.get("important_questions", [])
        ],
    )
