"""Linking a parent account to a child: the student makes a short-lived code, the parent redeems it once."""
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.auth import current_user
from app.core.database import get_db
from app.models.family import ParentLinkCode
from app.models.user import User
from app.services.cache_service import check_rate_limit

router = APIRouter(prefix="/family", tags=["Parent linking"])

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O or 1/I, easy to read aloud
CODE_TTL = timedelta(hours=24)


class RedeemIn(BaseModel):
    code: str = Field(min_length=4, max_length=16)


@router.post("/parent-code")
def create_parent_code(db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role != "SISWA":
        raise HTTPException(403, "Hanya siswa yang bisa membuat kode orang tua.")
    db.query(ParentLinkCode).filter(ParentLinkCode.student_id == user.id).delete()  # new code replaces the old one
    row = ParentLinkCode(code="".join(secrets.choice(ALPHABET) for _ in range(8)), student_id=user.id,
                         expires_at=datetime.utcnow() + CODE_TTL)
    db.add(row)
    db.commit()
    return {"code": row.code, "expires_at": row.expires_at}


@router.post("/children")
def link_child(data: RedeemIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role != "ORTU":
        raise HTTPException(403, "Hanya akun orang tua yang bisa menghubungkan anak.")
    # Codes are guessable only by brute force; cap attempts per parent.
    check_rate_limit(f"link_{user.id}", limit_per_minute=5,
                     detail="Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.")
    row = db.get(ParentLinkCode, data.code.strip().upper().replace("-", "").replace(" ", ""))
    if not row or row.expires_at < datetime.utcnow():
        raise HTTPException(404, "Kode tidak valid atau sudah kedaluwarsa. Minta anak membuat kode baru.")
    child = db.get(User, row.student_id)
    db.delete(row)  # single use
    if not child:
        db.commit()
        raise HTTPException(404, "Akun anak tidak ditemukan.")
    user.children_ids = list(dict.fromkeys([*(user.children_ids or []), child.id]))
    db.commit()
    return {"id": child.id, "name": child.name}
