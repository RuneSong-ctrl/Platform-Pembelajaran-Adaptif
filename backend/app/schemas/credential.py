from pydantic import BaseModel, ConfigDict
from typing import Optional

class CredentialMintRequest(BaseModel):
    student_id: str
    classroom_id: str
    competency_title: str
    score: float

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

    model_config = ConfigDict(from_attributes=True)

class CredentialVerifyResponse(BaseModel):
    is_valid: bool = True
    is_tampered: bool = False
    computed_hash: str
    recorded_hash: str
    certificate: Optional[CredentialResponse] = None
    tamper_reason: Optional[str] = None
