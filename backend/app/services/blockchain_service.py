import hashlib
from typing import Dict, Any, Optional, Tuple
from app.models.credential import BlockchainCredential
from app.schemas.credential import CredentialVerifyResponse, CredentialResponse

def calculate_sha256(message: str) -> str:
    return hashlib.sha256(message.encode("utf-8")).hexdigest()

def generate_block_hash(
    block_index: int,
    previous_hash: str,
    student_id: str,
    certificate_id: str,
    score: float,
    timestamp: str
) -> str:
    """
    Sesuai SPEC.md §4 (Deterministic Merkle Chaining):
    payload = block_index | previous_hash | student_id | certificate_id | score.toFixed(1) | timestamp
    """
    payload = f"{block_index}|{previous_hash}|{student_id}|{certificate_id}|{score:.1f}|{timestamp}"
    return calculate_sha256(payload)

def generate_transaction_id(block_hash: str, certificate_id: str) -> str:
    tx_hash = calculate_sha256(f"{block_hash}|{certificate_id}")
    return f"0x{tx_hash[:40]}"

def verify_credential_integrity(
    cert: BlockchainCredential,
    forced_score_check: Optional[float] = None
) -> CredentialVerifyResponse:
    score_to_verify = forced_score_check if forced_score_check is not None else cert.score
    computed_hash = generate_block_hash(
        cert.block_index,
        cert.previous_hash,
        cert.student_id,
        cert.certificate_id,
        score_to_verify,
        cert.issued_at
    )
    
    is_valid = (computed_hash == cert.block_hash)
    
    cert_response = CredentialResponse.model_validate(cert) if cert else None
    
    return CredentialVerifyResponse(
        is_valid=is_valid,
        is_tampered=not is_valid,
        computed_hash=computed_hash,
        recorded_hash=cert.block_hash,
        certificate=cert_response,
        tamper_reason="Deteksi Tamper Kriptografis: Hash payload saat ini tidak cocok dengan block hash permanen pada ledger." if not is_valid else None
    )
