import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.config import settings
from app.models.credential import BlockchainCredential
from app.models.user import User
from app.models.classroom import Classroom
from app.schemas.credential import CredentialResponse, CredentialMintRequest, CredentialVerifyResponse
from app.services.blockchain_service import (
    generate_block_hash,
    generate_transaction_id,
    verify_credential_integrity
)

router = APIRouter(prefix="/credentials", tags=["Blockchain Vault"])

@router.get("", response_model=List[CredentialResponse])
def get_all_credentials(student_id: str = None, db: Session = Depends(get_db)):
    query = db.query(BlockchainCredential)
    if student_id:
        query = query.filter(BlockchainCredential.student_id == student_id)
    return query.order_by(BlockchainCredential.block_index.asc()).all()

@router.post("/mint", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
def mint_blockchain_credential(data: CredentialMintRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
        
    cls = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
    cls_name = cls.name if cls else "Kelas Sains"
    
    # Get last block to chain
    last_block = db.query(BlockchainCredential).order_by(BlockchainCredential.block_index.desc()).first()
    next_index = (last_block.block_index + 1) if last_block else 1
    prev_hash = last_block.block_hash if last_block else settings.GENESIS_PREVIOUS_HASH
    
    cert_id = f"KOG-2026-{uuid.uuid4().hex[:4].upper()}"
    issued_at = datetime.datetime.utcnow().isoformat() + "Z"
    
    block_hash = generate_block_hash(
        block_index=next_index,
        previous_hash=prev_hash,
        student_id=user.id,
        certificate_id=cert_id,
        score=data.score,
        timestamp=issued_at
    )
    
    tx_id = generate_transaction_id(block_hash, cert_id)
    qr_url = f"http://localhost:5173/verify?cert={cert_id}&hash={block_hash}"
    
    new_cred = BlockchainCredential(
        id=f"cred_{uuid.uuid4().hex[:8]}",
        certificate_id=cert_id,
        student_id=user.id,
        student_name=user.name,
        classroom_id=data.classroom_id,
        classroom_name=cls_name,
        competency_title=data.competency_title,
        score=data.score,
        block_index=next_index,
        previous_hash=prev_hash,
        block_hash=block_hash,
        transaction_id=tx_id,
        issued_at=issued_at,
        qr_verification_url=qr_url,
        is_verified=True
    )
    db.add(new_cred)
    db.commit()
    db.refresh(new_cred)
    return new_cred

@router.get("/verify/{query}", response_model=CredentialVerifyResponse)
def verify_credential(query: str, db: Session = Depends(get_db)):
    """
    Verifikasi Kriptografis SHA-256 Terbuka via Certificate ID atau Block Hash
    """
    clean_q = query.strip()
    cert = db.query(BlockchainCredential).filter(
        (BlockchainCredential.certificate_id == clean_q) | 
        (BlockchainCredential.block_hash == clean_q) |
        (BlockchainCredential.transaction_id == clean_q)
    ).first()
    
    if not cert:
        return CredentialVerifyResponse(
            is_valid=False,
            is_tampered=True,
            computed_hash="N/A",
            recorded_hash="N/A",
            certificate=None,
            tamper_reason="Hash atau ID Sertifikat tidak terdaftar di ledger blockchain."
        )
        
    return verify_credential_integrity(cert)
