"""Pydantic v2 request / response schemas for paper endpoints."""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


# ── Upload ────────────────────────────────────────────────────────────────────
class PaperUploadResponse(BaseModel):
    """Returned immediately after a paper is accepted for processing."""

    paper_id: str = Field(..., examples=["b2c3d4e5-f6a7-8901-bcde-f01234567890"])
    status: str = Field(default="processing", examples=["processing"])
    task_id: str = Field(..., examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"])

    model_config = {"from_attributes": True}


# ── Status ────────────────────────────────────────────────────────────────────
class PaperStatusResponse(BaseModel):
    """Current processing status of an uploaded paper."""

    paper_id: str
    status: str = Field(..., examples=["processing", "complete", "failed"])
    questions_extracted: int = Field(default=0, examples=[42])
    error: str | None = Field(default=None, examples=[None])

    model_config = {"from_attributes": True}


# ── List ──────────────────────────────────────────────────────────────────────
class PaperSummary(BaseModel):
    """Compact representation used in list responses."""

    paper_id: str
    year: int = Field(..., examples=[2023])
    subject: str = Field(..., examples=["Physics"])
    exam_name: str = Field(..., examples=["NEET"])
    questions_extracted: int = Field(default=0, examples=[45])
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class PaperListResponse(BaseModel):
    papers: list[PaperSummary]


# ── Analysis request ─────────────────────────────────────────────────────────
class AnalysisRequest(BaseModel):
    exam_name: str = Field(..., examples=["NEET"])
    subject: str = Field(..., examples=["Physics"])


# ── Analysis sub-objects ──────────────────────────────────────────────────────
class RepeatedQuestion(BaseModel):
    question_text: str
    years: list[int]
    frequency: int
    topic: str


class TopicHeatmapEntry(BaseModel):
    topic: str = Field(..., examples=["Laws of Motion"])
    year_counts: dict[str, int] = Field(
        ..., examples=[{"2020": 3, "2021": 2, "2022": 0, "2023": 4}]
    )
    total: int = Field(..., examples=[9])
    gap_years: int = Field(..., examples=[0])


class ImportantQuestion(BaseModel):
    question_text: str
    score: float = Field(..., examples=[0.87])
    topic: str
    years_seen: list[int]


class AnalysisRunResponse(BaseModel):
    analysis_id: str
    repeated_questions: list[RepeatedQuestion]
    topic_heatmap: list[TopicHeatmapEntry]
    important_questions: list[ImportantQuestion]


# ── Error ─────────────────────────────────────────────────────────────────────
class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
