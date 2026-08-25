from sqlalchemy import Column, String, Integer, Float, Boolean, Text, JSON, DateTime
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    role = Column(String(32), nullable=False) # "SISWA", "GURU", "ORTU"
    avatar = Column(String(32), nullable=True)
    grade = Column(Integer, nullable=True)
    
    # Student specific
    learning_style = Column(String(32), nullable=True, default="VISUAL") # "VISUAL", "AUDITORI", "KINESTETIK"
    modality_scores = Column(JSON, nullable=True) # {"visual": 82, "audio": 45, "practice": 55} (Initial AI Diagnostic Predisposition)
    learning_progress = Column(JSON, nullable=True) # {"visual": 0, "audio": 0, "practice": 0, "visual_completed": 0, "audio_minutes": 0, "practice_completed": 0} (Real Learning Activity Progress)
    processing_speed = Column(String(32), nullable=True, default="MODERATE") # "FAST", "MODERATE", "DELIBERATE"
    xp_total = Column(Integer, default=0)
    streak_days = Column(Integer, default=1)
    hearts = Column(Integer, default=5)
    current_dda_level = Column(String(32), default="BASIC") # "BASIC", "MEDIUM", "CHALLENGING", "MASTERY"
    
    # Parent / Teacher specific
    children_ids = Column(JSON, nullable=True)
    subject_specialization = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
