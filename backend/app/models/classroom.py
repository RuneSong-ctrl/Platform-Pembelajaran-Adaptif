from sqlalchemy import Column, String, Integer, DateTime, JSON
from datetime import datetime
from app.core.database import Base

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    grade = Column(Integer, nullable=False, default=10)
    subject = Column(String(128), nullable=False)
    join_code = Column(String(16), unique=True, index=True, nullable=False)
    teacher_id = Column(String(64), nullable=False, index=True)
    teacher_name = Column(String(255), nullable=False)
    student_ids = Column(JSON, default=list)
    documents_count = Column(Integer, default=0)
    tasks_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
