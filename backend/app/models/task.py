from sqlalchemy import Column, String, Boolean, JSON, DateTime
from datetime import datetime
from app.core.database import Base

class GroundedTask(Base):
    __tablename__ = "tasks"

    id = Column(String(64), primary_key=True, index=True)
    classroom_id = Column(String(64), nullable=False, index=True)
    classroom_name = Column(String(255), nullable=False)
    type = Column(String(32), nullable=False) # "material", "quiz", "exam", "assignment"
    title = Column(String(255), nullable=False)
    chapter = Column(String(128), nullable=True)
    source_reference = Column(String(255), nullable=False)
    difficulty_level = Column(String(32), default="MEDIUM") # "BASIC", "MEDIUM", "CHALLENGING", "MASTERY"
    is_published = Column(Boolean, default=True)
    due_date = Column(String(64), nullable=True)
    content_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
