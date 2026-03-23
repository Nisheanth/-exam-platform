"""Pydantic v2 schemas for the prediction endpoint."""

from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    exam_name: str = Field(..., examples=["NEET"])
    subject: str = Field(..., examples=["Physics"])
    analysis_id: UUID = Field(
        ..., examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
    )


class PredictionItem(BaseModel):
    question: str
    topic: str
    confidence: str = Field(..., examples=["High", "Medium"])
    reason: str


class PredictResponse(BaseModel):
    predictions: list[PredictionItem]
    overdue_topics: list[str]
    strategy_tip: str

class FlashcardItem(BaseModel):
    id: int
    front: str
    back: str
    topic: str
    mastered: bool = False

class FlashcardResponse(BaseModel):
    flashcards: list[FlashcardItem]
