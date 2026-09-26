from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

class CredentialMintRequest(BaseModel):
    student_id: str
    classroom_id: str
    competency_title: str
    score: float

class QuizAnswer(BaseModel):
    question_id: str
    selected_index: Optional[int] = None  # None = waktu habis

class CredentialClaimRequest(BaseModel):
    task_id: str
    answers: List[QuizAnswer] = Field(..., max_length=50)

class CredentialResponse(BaseModel):
    id: str
    certificate_id: str
    student_id: str
    student_name: str
    classroom_id: str
    classroom_name: str
    competency_title: str
    score: float
    block_index: int
    previous_hash: str
    block_hash: str
    transaction_id: str
    issued_at: str
    qr_verification_url: str
    is_verified: bool
    task_id: Optional[str] = None
    hash_version: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class CredentialVerifyResponse(BaseModel):
    is_valid: bool = True
    is_tampered: bool = False
    computed_hash: str
    recorded_hash: str
    certificate: Optional[CredentialResponse] = None
    tamper_reason: Optional[str] = None
