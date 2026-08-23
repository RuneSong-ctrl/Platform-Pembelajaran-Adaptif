import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.schedule import LearningSchedule
from app.schemas.schedule import ScheduleResponse, ScheduleCreate

router = APIRouter(prefix="/schedules", tags=["Learning Schedules"])

@router.get("", response_model=List[ScheduleResponse])
def get_schedules(student_id: str = None, db: Session = Depends(get_db)):
    query = db.query(LearningSchedule)
    if student_id:
        query = query.filter(LearningSchedule.student_id == student_id)
    return query.all()

@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db)):
    sch_id = f"sch_{uuid.uuid4().hex[:8]}"
    new_sch = LearningSchedule(
        id=sch_id,
        student_id=data.student_id,
        day=data.day,
        time=data.time,
        duration=data.duration,
        title=data.title,
        format=data.format,
        completed=data.completed
    )
    db.add(new_sch)
    db.commit()
    db.refresh(new_sch)
    return new_sch

@router.patch("/{schedule_id}/toggle", response_model=ScheduleResponse)
def toggle_schedule_completion(schedule_id: str, db: Session = Depends(get_db)):
    sch = db.query(LearningSchedule).filter(LearningSchedule.id == schedule_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    sch.completed = not sch.completed
    db.commit()
    db.refresh(sch)
    return sch

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: str, db: Session = Depends(get_db)):
    sch = db.query(LearningSchedule).filter(LearningSchedule.id == schedule_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    db.delete(sch)
    db.commit()
    return {"success": True, "message": "Jadwal berhasil dihapus"}
