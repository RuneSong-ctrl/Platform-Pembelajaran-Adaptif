from sqlalchemy import Column, String, Float, Text, DateTime, JSON, Boolean
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
    status = Column(String(32), default="SUBMITTED")  # "IN_PROGRESS" (exam running), "SUBMITTED", "GRADED"
    attachments = Column(JSON, nullable=True)  # [{id, name, size, mime, path}]
    answers = Column(JSON, nullable=True)  # exam: {question_id: option index or essay text}
    essay_scores = Column(JSON, nullable=True)  # exam: {question_id: points given by the teacher}
    started_at = Column(DateTime, nullable=True)
    is_late = Column(Boolean, nullable=True)
