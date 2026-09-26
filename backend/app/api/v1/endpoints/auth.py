import hmac
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.config import settings
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.services.cache_service import check_rate_limit
from app.core.database import get_db
from app.models.user import User
from app.core.auth import AuthSession, bearer, create_session, current_user, hash_password, make_media_ticket, token_hash, verify_password, MEDIA_TICKET_TTL
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
def register_new_account(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    clean_name = payload.name.strip()
    
    if not clean_name or len(clean_name) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama lengkap wajib diisi, maksimal 100 karakter"
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
    if role == "GURU" and settings.TEACHER_INVITE_CODE:
        # Per-address cap so the invite code cannot be guessed by trying many sign-ups.
        check_rate_limit(f"register_guru_{request.client.host if request.client else 'x'}", limit_per_minute=5,
                         detail="Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.")
        if not hmac.compare_digest((payload.invite_code or "").strip().encode(), settings.TEACHER_INVITE_CODE.encode()):
            raise HTTPException(403, "Kode undangan guru salah. Minta kode ke admin sekolah.")
        
    # 3. Create user entity
    user_id = f"user_{role.lower()}_{uuid.uuid4().hex[:8]}"
    avatar = _generate_initials(clean_name)
    
    try:
        password_hash = hash_password(payload.password or "")
    except ValueError as exc:
        raise HTTPException(422, str(exc))

    new_user = User(
        password_hash=password_hash,
        id=user_id,
        name=clean_name,
        email=clean_email,
        role=role,
        avatar=avatar,
        grade=payload.grade if role == "SISWA" else None,
        learning_style=None,
        modality_scores=None,
        processing_speed="MODERATE" if role == "SISWA" else None,
        xp_total=0,
        streak_days=1,
        hearts=5,
        current_dda_level="BASIC" if role == "SISWA" else None,
        children_ids=[] if role == "ORTU" else None,
        subject_specialization=payload.subject_specialization if role == "GURU" else None,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = create_session(new_user, db)

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
    
    check_rate_limit(f"login_{clean_id}", limit_per_minute=10,
                     detail="Terlalu banyak percobaan masuk. Tunggu satu menit lalu coba lagi.")
    # Exact, case-insensitive match on email, ID or name ("%" and "_" are plain characters here).
    user = (
        db.query(User)
        .filter(
            (func.lower(User.email) == clean_id)
            | (func.lower(User.id) == clean_id)
            | (func.lower(User.name) == clean_id)
        )
        .first()
    )
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Kredensial tidak valid. Akun lama perlu aktivasi oleh pengelola.")

    token = create_session(user, db)
    
    return AuthResponse(
        success=True,
        message="Berhasil masuk ke portal EduAdapt.",
        token=token,
        user=UserResponse.model_validate(user)
    )


@router.get("/media-ticket")
def media_ticket(user: User = Depends(current_user)):
    return {"ticket": make_media_ticket(user), "expires_in": MEDIA_TICKET_TTL}


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(current_user)):
    return user


@router.post("/logout")
def logout(user: User = Depends(current_user), credentials=Depends(bearer), db: Session = Depends(get_db)):
    db.query(AuthSession).filter(AuthSession.token_hash == token_hash(credentials.credentials)).delete()
    db.commit()
    return {"success": True}

