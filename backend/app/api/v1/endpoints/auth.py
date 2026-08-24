import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegister,
    UserLogin,
    AuthResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _generate_initials(name: str) -> str:
    parts = [p for p in name.strip().split(" ") if p]
    if not parts:
        return "ED"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_new_account(payload: UserRegister, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    clean_name = payload.name.strip()
    
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama lengkap tidak boleh kosong"
        )
    
    # 1. Check if email already exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alamat email sudah terdaftar. Silakan langsung masuk."
        )
    
    # 2. Normalize role
    role = payload.role.upper() if payload.role else "SISWA"
    if role not in ["SISWA", "GURU", "ORTU"]:
        role = "SISWA"
        
    # 3. Create user entity
    user_id = f"user_{role.lower()}_{uuid.uuid4().hex[:8]}"
    avatar = _generate_initials(clean_name)
    
    new_user = User(
        id=user_id,
        name=clean_name,
        email=clean_email,
        role=role,
        avatar=avatar,
        grade=payload.grade if role == "SISWA" else None,
        learning_style="VISUAL" if role == "SISWA" else None,
        modality_scores={"visual": 80, "audio": 45, "practice": 55} if role == "SISWA" else None,
        processing_speed="MODERATE" if role == "SISWA" else None,
        xp_total=100 if role == "SISWA" else 0,
        streak_days=1,
        hearts=5,
        current_dda_level="BASIC" if role == "SISWA" else None,
        children_ids=[] if role == "ORTU" else None,
        subject_specialization=payload.subject_specialization if role == "GURU" else None,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = f"eduadapt_jwt_{uuid.uuid4().hex}"
    
    return AuthResponse(
        success=True,
        message="Akun berhasil didaftarkan.",
        token=token,
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=AuthResponse)
def login_account(payload: UserLogin, db: Session = Depends(get_db)):
    clean_id = payload.identifier.strip().lower()
    
    if not clean_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Harap masukkan nama akun, email, atau ID Anda."
        )
    
    # Look up by email (exact), ID (exact), or name (case-insensitive)
    user = (
        db.query(User)
        .filter(
            (User.email.ilike(clean_id))
            | (User.id.ilike(clean_id))
            | (User.name.ilike(clean_id))
        )
        .first()
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun tidak ditemukan. Periksa kembali nama akun atau email Anda."
        )
        
    token = f"eduadapt_jwt_{uuid.uuid4().hex}"
    
    return AuthResponse(
        success=True,
        message="Berhasil masuk ke portal EduAdapt.",
        token=token,
        user=UserResponse.model_validate(user)
    )
