from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.assessment import AssessmentSubmitRequest, AssessmentResultResponse

router = APIRouter(prefix="/assessment", tags=["Initial Assessment"])

@router.post("/submit", response_model=AssessmentResultResponse)
def submit_initial_assessment(data: AssessmentSubmitRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")
        
    v_total = sum(a.visual_score for a in data.answers) or 10
    a_total = sum(a.audio_score for a in data.answers) or 10
    p_total = sum(a.practice_score for a in data.answers) or 10
    
    total_sum = v_total + a_total + p_total
    v_pct = round((v_total / total_sum) * 100)
    a_pct = round((a_total / total_sum) * 100)
    p_pct = 100 - (v_pct + a_pct)
    
    dominant = "VISUAL"
    if a_total > v_total and a_total > p_total:
        dominant = "AUDITORI"
    elif p_total > v_total and p_total > a_total:
        dominant = "KINESTETIK"
        
    # Processing speed calculation based on average response time
    avg_time = sum(a.response_time_sec for a in data.answers) / (len(data.answers) or 1)
    speed = "FAST" if avg_time <= 8.0 else "MODERATE" if avg_time <= 18.0 else "DELIBERATE"
    
    user.learning_style = dominant
    user.modality_scores = {"visual": v_pct, "audio": a_pct, "practice": p_pct}
    user.processing_speed = speed
    
    db.commit()
    db.refresh(user)
    
    return AssessmentResultResponse(
        student_id=user.id,
        dominant_modality=dominant,
        modality_scores={"visual": v_pct, "audio": a_pct, "practice": p_pct},
        processing_speed=speed,
        message=f"Asesmen berhasil diproses. Rekomendasi modalitas adaptif: {dominant}."
    )
