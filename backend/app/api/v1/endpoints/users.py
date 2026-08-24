import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    user_id = payload.id or f"user_{payload.role.lower()}_{uuid.uuid4().hex[:8]}"
    avatar = payload.avatar or payload.name[:2].upper()
    
    user = User(
        id=user_id,
        name=payload.name.strip(),
        email=clean_email,
        role=payload.role.upper(),
        avatar=avatar,
        grade=payload.grade,
        learning_style=payload.learning_style or "VISUAL",
        modality_scores=payload.modality_scores.model_dump() if payload.modality_scores else {"visual": 80, "audio": 45, "practice": 55},
        processing_speed=payload.processing_speed or "MODERATE",
        xp_total=payload.xp_total or 0,
        streak_days=payload.streak_days or 1,
        hearts=payload.hearts or 5,
        current_dda_level=payload.current_dda_level or "BASIC",
        children_ids=payload.children_ids or [],
        subject_specialization=payload.subject_specialization,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user

@router.patch("/{user_id}", response_model=UserResponse)
def update_user_profile(user_id: str, updates: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
        
    db.commit()
    db.refresh(user)
    return user
