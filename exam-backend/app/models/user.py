"""User accounts for data privacy and multi-tenant isolation."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid_str() -> str:
    return str(uuid.uuid4())


class User(Base):
    """Stores unique users to ensure their PDFs and APIs are strictly private."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid_str)
    email = Column(String(128), unique=True, index=True, nullable=False)
    # Storing standard raw passwords for hackathon convenience. In enterprise production, this should be bcrypt-hashed.
    password = Column(String(128), nullable=False)
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    papers = relationship("Paper", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("AnalysisResult", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
