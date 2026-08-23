from sqlalchemy import Column, String, Float, Text, DateTime
from datetime import datetime
from app.core.database import Base

class AssignmentSubmission(Base):
    __tablename__ = "submissions"

    id = Column(String(64), primary_key=True, index=True)
    task_id = Column(String(64), nullable=False, index=True)
    task_title = Column(String(255), nullable=False)
    student_id = Column(String(64), nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    attachment_name = Column(String(255), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    grade = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String(32), default="SUBMITTED") # "SUBMITTED", "GRADED"
