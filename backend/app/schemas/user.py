from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, List, Any
from datetime import datetime

class ModalityScores(BaseModel):
    visual: int = 80
    audio: int = 45
    practice: int = 55

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str # "SISWA", "GURU", "ORTU"
    avatar: Optional[str] = None
    grade: Optional[int] = 10
    learning_style: Optional[str] = "VISUAL"
    modality_scores: Optional[ModalityScores] = None
    processing_speed: Optional[str] = "MODERATE"
    xp_total: Optional[int] = 0
    streak_days: Optional[int] = 1
    hearts: Optional[int] = 5
    current_dda_level: Optional[str] = "BASIC"
    children_ids: Optional[List[str]] = []
    subject_specialization: Optional[str] = None

class UserCreate(UserBase):
    id: Optional[str] = None

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    role: str = "SISWA" # "SISWA", "GURU", "ORTU"
    password: Optional[str] = None
    grade: Optional[int] = 10
    subject_specialization: Optional[str] = None

class UserLogin(BaseModel):
    identifier: str
    password: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    grade: Optional[int] = None
    learning_style: Optional[str] = None
    modality_scores: Optional[Dict[str, int]] = None
    processing_speed: Optional[str] = None
    xp_total: Optional[int] = None
    streak_days: Optional[int] = None
    hearts: Optional[int] = None
    current_dda_level: Optional[str] = None

class UserResponse(UserBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AuthResponse(BaseModel):
    success: bool = True
    message: str = "Autentikasi berhasil"
    token: Optional[str] = None
    user: UserResponse
