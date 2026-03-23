"""AnalysisResult ORM model.

Uses standard SQLAlchemy types compatible with both SQLite and PostgreSQL.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text, ForeignKey
from sqlalchemy.orm import Session, relationship

from app.core.database import Base


def _uuid_str() -> str:
    return str(uuid.uuid4())


class AnalysisResult(Base):
    """Stores the JSON output of a full pattern-analysis run."""

    __tablename__ = "analysis_results"

    id = Column(String(36), primary_key=True, default=_uuid_str)
    exam_name = Column(String(128), nullable=False, index=True)
    subject = Column(String(128), nullable=False, index=True)
    # JSON stored as text — works on both SQLite and PostgreSQL
    _result_json_str = Column("result_json", Text, nullable=False, default="{}")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # User isolation boundary
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=True)

    # Relationships
    user = relationship("User", back_populates="analyses")

    # ── Convenience property to transparently serialize/deserialize JSON ──
    @property
    def result_json(self) -> dict:
        try:
            return json.loads(self._result_json_str or "{}")
        except (json.JSONDecodeError, TypeError):
            return {}

    @result_json.setter
    def result_json(self, value: dict) -> None:
        self._result_json_str = json.dumps(value)

    def __repr__(self) -> str:
        return (
            f"<AnalysisResult {self.exam_name} {self.subject} "
            f"created={self.created_at}>"
        )
