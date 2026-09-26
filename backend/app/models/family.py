from sqlalchemy import Column, DateTime, String

from app.core.database import Base


class ParentLinkCode(Base):
    """One-time code a student hands to a parent so the parent can link to the student's account."""
    __tablename__ = "parent_link_codes"

    code = Column(String(16), primary_key=True)
    student_id = Column(String(64), nullable=False, unique=True)  # one live code per student
    expires_at = Column(DateTime, nullable=False)
