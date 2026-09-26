from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from datetime import datetime
from app.core.database import Base

class BlockchainCredential(Base):
    __tablename__ = "credentials"

    id = Column(String(64), primary_key=True, index=True)
    certificate_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "KOG-2026-X7A9"
    student_id = Column(String(64), nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    classroom_id = Column(String(64), nullable=False)
    classroom_name = Column(String(255), nullable=False)
    competency_title = Column(String(255), nullable=False)
    score = Column(Float, nullable=False)
    task_id = Column(String(64), nullable=True, index=True)  # quiz that earned it; null for teacher-issued
    block_index = Column(Integer, nullable=False, unique=True)
    previous_hash = Column(String(64), nullable=False)
    block_hash = Column(String(64), nullable=False, index=True)
    transaction_id = Column(String(64), nullable=False, index=True)
    issued_at = Column(String(64), nullable=False)
    qr_verification_url = Column(String(512), nullable=False)
    is_verified = Column(Boolean, default=True)
    # 1 = legacy payload (score only); 2 = also seals competency title, class and student name. NULL on old rows = 1.
    hash_version = Column(Integer, nullable=True, default=2)
