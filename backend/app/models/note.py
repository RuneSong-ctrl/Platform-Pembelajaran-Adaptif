from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
from app.core.database import Base

class ParentTeacherNote(Base):
    __tablename__ = "parent_notes"

    id = Column(String(64), primary_key=True, index=True)
    sender_id = Column(String(64), nullable=False)
    sender_name = Column(String(255), nullable=False)
    sender_role = Column(String(32), nullable=False) # "GURU", "ORTU"
    receiver_id = Column(String(64), nullable=False, index=True)
    student_id = Column(String(64), nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    reply = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    replied_at = Column(DateTime, nullable=True)
