"""Paper management endpoints: upload, status, list, delete."""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.paper import Paper
from app.schemas.paper import (
    ErrorResponse,
    PaperListResponse,
    PaperStatusResponse,
    PaperSummary,
    PaperUploadResponse,
)
from app.tasks.process_paper import process_paper_task

logger = structlog.get_logger(__name__)
settings = get_settings()

router = APIRouter(prefix="/api/papers", tags=["Papers"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp", ".webp"}


@router.post(
    "/upload",
    response_model=PaperUploadResponse,
    status_code=202,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Upload an exam paper for processing",
)
async def upload_paper(
    file: UploadFile = File(...),
    subject: str = Form(...),
    year: int = Form(...),
    exam_name: str = Form(...),
    db: Session = Depends(get_db),
):
    """Accept a PDF or image file and queue it for async processing."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    if year < 1900 or year > 2100:
        raise HTTPException(status_code=400, detail="Year must be between 1900 and 2100")

    # Save file to disk
    paper_id = str(uuid.uuid4())
    safe_filename = f"{paper_id}{ext}"
    upload_dir = settings.upload_path
    file_path = upload_dir / safe_filename

    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as exc:
        logger.error("file_save_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

    # Create DB record
    paper = Paper(
        id=paper_id,
        exam_name=exam_name.strip(),
        subject=subject.strip(),
        year=year,
        filename=safe_filename,
        status="processing",
    )
    db.add(paper)
    db.commit()

    # Dispatch task (Celery if available, else synchronous)
    task = process_paper_task.delay(paper_id, str(file_path))

    logger.info(
        "paper_uploaded",
        paper_id=paper_id,
        task_id=task.id,
        filename=file.filename,
    )

    return PaperUploadResponse(
        paper_id=paper_id,
        status="processing",
        task_id=task.id,
    )


@router.get(
    "/{paper_id}/status",
    response_model=PaperStatusResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get processing status of a paper",
)
async def get_paper_status(
    paper_id: str,
    db: Session = Depends(get_db),
):
    """Return the current processing status and question count."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail=f"Paper {paper_id} not found")

    return PaperStatusResponse(
        paper_id=paper.id,
        status=paper.status,
        questions_extracted=paper.questions_extracted,
        error=paper.error_message,
    )


@router.get(
    "",
    response_model=PaperListResponse,
    summary="List papers with optional filters",
)
async def list_papers(
    exam_name: Optional[str] = None,
    subject: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List all papers, optionally filtered by exam_name, subject, or year."""
    query = db.query(Paper)

    if exam_name:
        query = query.filter(Paper.exam_name == exam_name)
    if subject:
        query = query.filter(Paper.subject == subject)
    if year:
        query = query.filter(Paper.year == year)

    papers = query.order_by(Paper.year.desc(), Paper.created_at.desc()).all()

    summaries = [
        PaperSummary(
            paper_id=p.id,
            year=p.year,
            subject=p.subject,
            exam_name=p.exam_name,
            questions_extracted=p.questions_extracted,
            uploaded_at=p.created_at,
        )
        for p in papers
    ]

    return PaperListResponse(papers=summaries)


@router.delete(
    "/{paper_id}",
    status_code=204,
    responses={404: {"model": ErrorResponse}},
    summary="Delete a paper and its questions",
)
async def delete_paper(
    paper_id: str,
    db: Session = Depends(get_db),
):
    """Delete a paper, its questions, and the uploaded file."""
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail=f"Paper {paper_id} not found")

    file_path = settings.upload_path / paper.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(paper)
    db.commit()

    logger.info("paper_deleted", paper_id=paper_id)
