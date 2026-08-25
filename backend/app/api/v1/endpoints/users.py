import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.user import User
from app.models.submission import AssignmentSubmission
from app.models.schedule import LearningSchedule
from app.models.credential import BlockchainCredential
from app.models.document import GroundedDocument
from app.models.task import GroundedTask
from app.schemas.user import (
    UserResponse,
    UserCreate,
    UserUpdate,
    LearningActivityTrackRequest,
    LearningProgressResponse,
    LearningStyleAnalyticsResponse,
    VisualAnalyticsParams,
    AuditoryAnalyticsParams,
    KinestheticAnalyticsParams,
)

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
    
    initial_progress = {
        "visual": 0,
        "audio": 0,
        "practice": 0,
        "visual_completed": 0,
        "visual_total": 0,
        "audio_minutes": 0,
        "audio_completed": 0,
        "practice_completed": 0,
        "practice_total": 0,
    }
    if payload.learning_progress:
        initial_progress.update(payload.learning_progress.model_dump(exclude_unset=True))
    
    user = User(
        id=user_id,
        name=payload.name.strip(),
        email=clean_email,
        role=payload.role.upper(),
        avatar=avatar,
        grade=payload.grade,
        learning_style=payload.learning_style or "VISUAL",
        modality_scores=payload.modality_scores.model_dump() if payload.modality_scores else {"visual": 80, "audio": 45, "practice": 55},
        learning_progress=initial_progress,
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

@router.get("/{user_id}/progress", response_model=LearningProgressResponse)
def get_student_learning_progress(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    raw_prog = user.learning_progress or {}
    
    # Real activity aggregation from database tables
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == user_id).all()
    schedules = db.query(LearningSchedule).filter(LearningSchedule.student_id == user_id).all()
    credentials = db.query(BlockchainCredential).filter(BlockchainCredential.student_id == user_id).all()
    
    db_docs_count = db.query(GroundedDocument).count()
    db_tasks_count = db.query(GroundedTask).count()

    visual_sched_done = sum(1 for s in schedules if s.format == "Visual" and s.completed)
    audio_sched_done = sum(1 for s in schedules if s.format == "Audio" and s.completed)
    practice_sched_done = sum(1 for s in schedules if s.format in ["Praktik", "Kuis"] and s.completed)

    subs_graded = sum(1 for sub in submissions if sub.status == "GRADED")
    subs_total = len(submissions)

    # Dynamic totals derived from curriculum database
    v_total = max(raw_prog.get("visual_total") or 0, db_docs_count, 4)
    p_total = max(raw_prog.get("practice_total") or 0, db_tasks_count, 4)

    # Stored and tracked activity counters
    v_completed = min(v_total, raw_prog.get("visual_completed", visual_sched_done + (1 if db_docs_count > 0 else 0)))
    a_minutes = raw_prog.get("audio_minutes", max(audio_sched_done * 15, 10))
    a_completed = raw_prog.get("audio_completed", max(audio_sched_done, 1))
    p_completed = min(p_total, raw_prog.get("practice_completed", max(subs_total, practice_sched_done) + (1 if credentials else 0)))

    # Calculate percentages
    v_pct = raw_prog.get("visual")
    if v_pct is None:
        v_pct = round((v_completed / v_total) * 100) if v_total > 0 else 0
    v_pct = max(0, min(100, int(v_pct)))

    a_pct = raw_prog.get("audio")
    if a_pct is None:
        a_target_minutes = 45
        a_pct = min(100, round((a_minutes / a_target_minutes) * 100)) if a_target_minutes > 0 else 0
    a_pct = max(0, min(100, int(a_pct)))

    p_pct = raw_prog.get("practice")
    if p_pct is None:
        p_pct = round((p_completed / p_total) * 100) if p_total > 0 else 0
    p_pct = max(0, min(100, int(p_pct)))

    overall = round((v_pct + a_pct + p_pct) / 3)

    return LearningProgressResponse(
        student_id=user.id,
        visual_progress=v_pct,
        audio_progress=a_pct,
        practice_progress=p_pct,
        visual_completed=v_completed,
        visual_total=v_total,
        audio_minutes=a_minutes,
        audio_completed=a_completed,
        practice_completed=p_completed,
        practice_total=p_total,
        overall_progress=overall,
        details={
            "submissions_count": subs_total,
            "submissions_graded": subs_graded,
            "credentials_count": len(credentials),
            "schedules_completed": sum(1 for s in schedules if s.completed),
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
    )

@router.patch("/{user_id}/progress", response_model=LearningProgressResponse)
def track_student_learning_activity(
    user_id: str,
    payload: LearningActivityTrackRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    m_type = payload.modality_type.strip().lower()
    if m_type not in ["visual", "audio", "practice"]:
        raise HTTPException(status_code=400, detail="Tipe modalitas harus 'visual', 'audio', atau 'practice'")

    amount = max(1, min(1000, payload.increment_amount or 1))

    current_prog = dict(user.learning_progress or {})
    db_docs_count = db.query(GroundedDocument).count()
    db_tasks_count = db.query(GroundedTask).count()
    
    if m_type == "visual":
        current_prog["visual_completed"] = (current_prog.get("visual_completed") or 0) + amount
        v_total = max(current_prog.get("visual_total") or 0, db_docs_count, current_prog["visual_completed"])
        current_prog["visual_total"] = v_total
        current_prog["visual"] = min(100, round((current_prog["visual_completed"] / v_total) * 100))
    elif m_type == "audio":
        current_prog["audio_minutes"] = (current_prog.get("audio_minutes") or 0) + amount
        current_prog["audio_completed"] = (current_prog.get("audio_completed") or 0) + 1
        current_prog["audio"] = min(100, round((current_prog["audio_minutes"] / 45) * 100))
    elif m_type == "practice":
        current_prog["practice_completed"] = (current_prog.get("practice_completed") or 0) + amount
        p_total = max(current_prog.get("practice_total") or 0, db_tasks_count, current_prog["practice_completed"])
        current_prog["practice_total"] = p_total
        current_prog["practice"] = min(100, round((current_prog["practice_completed"] / p_total) * 100))

    user.learning_progress = current_prog
    db.commit()
    db.refresh(user)

    return get_student_learning_progress(user_id=user_id, db=db)

@router.get("/{user_id}/style-analytics", response_model=LearningStyleAnalyticsResponse)
def get_student_style_analytics(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    # Get dynamic progress from DB
    prog = get_student_learning_progress(user_id=user_id, db=db)
    
    # Real database queries
    credentials = db.query(BlockchainCredential).filter(BlockchainCredential.student_id == user_id).all()
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == user_id).all()
    
    # Calculate real accuracy from credentials or graded submissions
    graded_subs = [s.score for s in submissions if s.score is not None]
    if credentials:
        avg_accuracy = round(sum(c.score or 0 for c in credentials) / len(credentials))
    elif graded_subs:
        avg_accuracy = round(sum(graded_subs) / len(graded_subs))
    else:
        avg_accuracy = (
            95 if user.current_dda_level == "MASTERY"
            else (85 if user.current_dda_level == "CHALLENGING" else 75)
        )

    speed_is_fast = user.processing_speed == "FAST"
    dda_lvl = user.current_dda_level or "BASIC"

    # Visual Params computed dynamically
    visual_params = VisualAnalyticsParams(
        spatial_retention_pct=avg_accuracy,
        scan_speed_sec_per_node=1.5 if speed_is_fast else 2.2,
        infographic_accuracy_pct=min(100, max(70, avg_accuracy + 5)),
        mindmap_explored_count=prog.visual_completed,
        mindmap_total_count=prog.visual_total,
        visual_progress_pct=prog.visual_progress,
        status_label="Sangat Efektif" if prog.visual_progress >= 70 else "Tinggi"
    )

    # Auditory Params computed dynamically
    auditory_params = AuditoryAnalyticsParams(
        total_listening_minutes=prog.audio_minutes,
        target_listening_minutes=45,
        verbal_retention_pct=max(70, avg_accuracy),
        focus_stability_pct=90 if prog.audio_minutes >= 20 else 85,
        ideal_playback_speed=1.25 if speed_is_fast else 1.0,
        sessions_completed=prog.audio_completed,
        audio_progress_pct=prog.audio_progress,
        status_label="Optimal" if prog.audio_progress >= 50 else "Sedang Berkembang"
    )

    # Kinesthetic Params computed dynamically
    kinesthetic_params = KinestheticAnalyticsParams(
        lab_accuracy_pct=avg_accuracy,
        trial_error_iterations=1.2 if dda_lvl == "MASTERY" else (1.4 if dda_lvl == "CHALLENGING" else 1.8),
        mission_speed_minutes=2.8 if speed_is_fast else 3.2,
        dda_problem_solving_level=dda_lvl,
        missions_completed=prog.practice_completed,
        missions_total=prog.practice_total,
        practice_progress_pct=prog.practice_progress,
        status_label="Sangat Efektif" if prog.practice_progress >= 60 else "Aktif Mandiri"
    )

    return LearningStyleAnalyticsResponse(
        student_id=user.id,
        learning_style=user.learning_style or "KINESTETIK",
        current_dda_level=dda_lvl,
        xp_total=user.xp_total or (sum(c.score or 0 for c in credentials)) or 100,
        accuracy_avg_pct=avg_accuracy,
        visual_params=visual_params,
        auditory_params=auditory_params,
        kinesthetic_params=kinesthetic_params,
        updated_at=datetime.utcnow() if hasattr(datetime, 'utcnow') else user.updated_at
    )

