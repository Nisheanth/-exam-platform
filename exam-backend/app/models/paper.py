"""Paper and Question ORM models.

Uses only standard SQLAlchemy types so it works with both SQLite and PostgreSQL.
The 'embedding' column stores vectors as a JSON text string for SQLite compatibility.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Float,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid_str() -> str:
    return str(uuid.uuid4())


class Paper(Base):
    """Represents one uploaded exam paper (PDF / image)."""

    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=_uuid_str)
    exam_name = Column(String(128), nullable=False, index=True)
    subject = Column(String(128), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    filename = Column(String(512), nullable=False)
    status = Column(
        Enum("processing", "complete", "failed", name="paper_status"),
        nullable=False,
        default="processing",
    )
    questions_extracted = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    questions = relationship(
        "Question", back_populates="paper", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return (
            f"<Paper {self.exam_name} {self.subject} {self.year} "
            f"[{self.status}]>"
        )


class Question(Base):
    """A single question extracted from a paper."""

    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=_uuid_str)
    paper_id = Column(
        String(36),
        ForeignKey("papers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text = Column(Text, nullable=False)
    topic = Column(String(256), nullable=True)
    question_type = Column(
        Enum("mcq", "short", "long", "numerical", name="question_type"),
        nullable=True,
    )
    marks = Column(Float, nullable=True)
    # Embedding stored as JSON text for SQLite compatibility
    # (pgvector Vector column would be used on PostgreSQL)
    embedding = Column(Text, nullable=True)

    # Relationships
    paper = relationship("Paper", back_populates="questions")

    def __repr__(self) -> str:
        return f"<Question {str(self.id)[:8]} paper={str(self.paper_id)[:8]}>"
