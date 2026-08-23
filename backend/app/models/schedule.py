from sqlalchemy import Column, String, Boolean
from app.core.database import Base

class LearningSchedule(Base):
    __tablename__ = "schedules"

    id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(64), nullable=False, index=True)
    day = Column(String(32), nullable=False) # "Senin", "Selasa", dll.
    time = Column(String(64), nullable=False) # "16:00 - 16:30"
    duration = Column(String(32), nullable=False) # "30 mnt"
    title = Column(String(255), nullable=False)
    format = Column(String(32), nullable=False) # "Visual", "Audio", "Praktik", "Kuis"
    completed = Column(Boolean, default=False)
