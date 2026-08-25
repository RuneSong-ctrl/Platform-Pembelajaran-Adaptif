from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, List, Any
from datetime import datetime

class ModalityScores(BaseModel):
    visual: int = 80
    audio: int = 45
    practice: int = 55

class LearningProgress(BaseModel):
    visual: int = 0 # 0 - 100%
    audio: int = 0 # 0 - 100%
    practice: int = 0 # 0 - 100%
    visual_completed: Optional[int] = 0
    visual_total: Optional[int] = 0
    audio_minutes: Optional[int] = 0
    audio_completed: Optional[int] = 0
    practice_completed: Optional[int] = 0
    practice_total: Optional[int] = 0

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str # "SISWA", "GURU", "ORTU"
    avatar: Optional[str] = None
    grade: Optional[int] = 10
    learning_style: Optional[str] = "VISUAL"
    modality_scores: Optional[ModalityScores] = None
    learning_progress: Optional[LearningProgress] = None
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
    learning_progress: Optional[Dict[str, Any]] = None
    processing_speed: Optional[str] = None
    xp_total: Optional[int] = None
    streak_days: Optional[int] = None
    hearts: Optional[int] = None
    current_dda_level: Optional[str] = None

class LearningActivityTrackRequest(BaseModel):
    modality_type: str # "visual", "audio", "practice"
    increment_amount: Optional[int] = 1 # e.g. 1 diagram explored, 5 mins listened, 1 lab completed
    activity_title: Optional[str] = None

class LearningProgressResponse(BaseModel):
    student_id: str
    visual_progress: int
    audio_progress: int
    practice_progress: int
    visual_completed: int
    visual_total: int
    audio_minutes: int
    audio_completed: int
    practice_completed: int
    practice_total: int
    overall_progress: int
    details: Dict[str, Any]

class VisualAnalyticsParams(BaseModel):
    spatial_retention_pct: int
    scan_speed_sec_per_node: float
    infographic_accuracy_pct: int
    mindmap_explored_count: int
    mindmap_total_count: int
    visual_progress_pct: int
    status_label: str = "Tinggi"

class AuditoryAnalyticsParams(BaseModel):
    total_listening_minutes: int
    target_listening_minutes: int = 45
    verbal_retention_pct: int
    focus_stability_pct: int
    ideal_playback_speed: float
    sessions_completed: int
    audio_progress_pct: int
    status_label: str = "Optimal"

class KinestheticAnalyticsParams(BaseModel):
    lab_accuracy_pct: int
    trial_error_iterations: float
    mission_speed_minutes: float
    dda_problem_solving_level: str
    missions_completed: int
    missions_total: int
    practice_progress_pct: int
    status_label: str = "Sangat Efektif"

class LearningStyleAnalyticsResponse(BaseModel):
    student_id: str
    learning_style: str # "VISUAL", "AUDITORI", "KINESTETIK"
    current_dda_level: str
    xp_total: int
    accuracy_avg_pct: int
    visual_params: VisualAnalyticsParams
    auditory_params: AuditoryAnalyticsParams
    kinesthetic_params: KinestheticAnalyticsParams
    updated_at: datetime

class UserResponse(UserBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AuthResponse(BaseModel):
    success: bool = True
    message: str = "Autentikasi berhasil"
    token: Optional[str] = None
    user: UserResponse
