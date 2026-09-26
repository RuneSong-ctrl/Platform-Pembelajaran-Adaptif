import hashlib
import uuid
import datetime
from typing import Optional
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.credential import BlockchainCredential
from app.schemas.credential import CredentialVerifyResponse, CredentialResponse

def calculate_sha256(message: str) -> str:
    return hashlib.sha256(message.encode("utf-8")).hexdigest()

CURRENT_HASH_VERSION = 2

def generate_block_hash(
    block_index: int,
    previous_hash: str,
    student_id: str,
    certificate_id: str,
    score: float,
    timestamp: str,
    *,
    version: int = 1,
    competency_title: str = "",
    classroom_name: str = "",
    student_name: str = "",
) -> str:
    """
    Sesuai SPEC.md §4 (Deterministic Merkle Chaining):
    v1 payload = block_index | previous_hash | student_id | certificate_id | score.toFixed(1) | timestamp
    v2 payload = "v2" | v1 fields | competency_title | classroom_name | student_name
    v2 also seals the fields shown on the certificate, so editing them breaks the hash.
    """
    payload = f"{block_index}|{previous_hash}|{student_id}|{certificate_id}|{score:.1f}|{timestamp}"
    if version >= 2:
        payload = f"v2|{payload}|{competency_title}|{classroom_name}|{student_name}"
    return calculate_sha256(payload)

def block_hash_for(cert: BlockchainCredential, score: Optional[float] = None) -> str:
    """Recomputes a stored block's hash with the formula it was sealed with."""
    return generate_block_hash(
        cert.block_index,
        cert.previous_hash,
        cert.student_id,
        cert.certificate_id,
        cert.score if score is None else score,
        cert.issued_at,
        version=cert.hash_version or 1,
        competency_title=cert.competency_title,
        classroom_name=cert.classroom_name,
        student_name=cert.student_name,
    )

def generate_transaction_id(block_hash: str, certificate_id: str) -> str:
    tx_hash = calculate_sha256(f"{block_hash}|{certificate_id}")
    return f"0x{tx_hash[:40]}"

def append_block(
    db: Session,
    *,
    student,
    classroom,
    competency_title: str,
    score: float,
    task_id: Optional[str] = None,
) -> BlockchainCredential:
    """Appends one credential block to the end of the chain.

    block_index is unique, so two requests racing for the same index make one
    commit fail; that one re-reads the chain tip and tries again.
    """
    for _ in range(5):
        last_block = db.query(BlockchainCredential).order_by(BlockchainCredential.block_index.desc()).first()
        next_index = (last_block.block_index + 1) if last_block else 1
        prev_hash = last_block.block_hash if last_block else settings.GENESIS_PREVIOUS_HASH

        cert_id = f"KOG-{datetime.datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"
        issued_at = datetime.datetime.utcnow().isoformat() + "Z"
        block_hash = generate_block_hash(
            next_index, prev_hash, student.id, cert_id, score, issued_at,
            version=CURRENT_HASH_VERSION,
            competency_title=competency_title,
            classroom_name=classroom.name,
            student_name=student.name,
        )

        cred = BlockchainCredential(
            id=f"cred_{uuid.uuid4().hex[:8]}",
            certificate_id=cert_id,
            student_id=student.id,
            student_name=student.name,
            classroom_id=classroom.id,
            classroom_name=classroom.name,
            competency_title=competency_title,
            score=score,
            task_id=task_id,
            block_index=next_index,
            previous_hash=prev_hash,
            block_hash=block_hash,
            transaction_id=generate_transaction_id(block_hash, cert_id),
            issued_at=issued_at,
            qr_verification_url=f"{settings.FRONTEND_URL.rstrip('/')}/verify?cert={cert_id}",
            is_verified=True,
            hash_version=CURRENT_HASH_VERSION,
        )
        db.add(cred)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            continue
        db.refresh(cred)
        return cred
    raise RuntimeError("Gagal menambahkan blok setelah beberapa percobaan; coba lagi.")

def verify_credential_integrity(
    cert: BlockchainCredential,
    forced_score_check: Optional[float] = None,
    expected_previous_hash: Optional[str] = None,
) -> CredentialVerifyResponse:
    """Checks the block's own hash and, when expected_previous_hash is given, its link to the block before it."""
    computed_hash = block_hash_for(cert, forced_score_check)

    hash_ok = computed_hash == cert.block_hash
    link_ok = expected_previous_hash is None or expected_previous_hash == cert.previous_hash
    is_valid = hash_ok and link_ok

    if not hash_ok:
        reason = "Deteksi Tamper Kriptografis: Hash payload saat ini tidak cocok dengan block hash permanen pada ledger."
    elif not link_ok:
        reason = f"Rantai blok terputus: previous_hash blok #{cert.block_index} tidak cocok dengan hash blok sebelumnya."
    else:
        reason = None

    return CredentialVerifyResponse(
        is_valid=is_valid,
        is_tampered=not is_valid,
        computed_hash=computed_hash,
        recorded_hash=cert.block_hash,
        certificate=CredentialResponse.model_validate(cert),
        tamper_reason=reason,
    )
