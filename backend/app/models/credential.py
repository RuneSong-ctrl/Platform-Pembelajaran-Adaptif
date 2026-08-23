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
    block_index = Column(Integer, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    block_hash = Column(String(64), nullable=False, index=True)
    transaction_id = Column(String(64), nullable=False, index=True)
    issued_at = Column(String(64), nullable=False)
    qr_verification_url = Column(String(512), nullable=False)
    is_verified = Column(Boolean, default=True)
