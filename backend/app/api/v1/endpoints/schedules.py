import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import current_user
from app.core.scope import visible_student_ids
from app.models.schedule import LearningSchedule
from app.models.user import User
from app.schemas.schedule import ScheduleResponse, ScheduleCreate

router = APIRouter(prefix="/schedules", tags=["Learning Schedules"])


def own_schedule(schedule_id: str, db: Session, user: User) -> LearningSchedule:
    sch = db.query(LearningSchedule).filter(LearningSchedule.id == schedule_id).first()
    if not sch or sch.student_id != user.id:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    return sch

@router.get("", response_model=List[ScheduleResponse])
def get_schedules(student_id: str = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    students = visible_student_ids(user, db) if user.role != "GURU" else set()
    if student_id:
        students &= {student_id}
    if not students:
        return []
    return db.query(LearningSchedule).filter(LearningSchedule.student_id.in_(students)).all()

@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role != "SISWA":
        raise HTTPException(403, "Jadwal belajar dibuat oleh siswa.")
    sch_id = f"sch_{uuid.uuid4().hex[:8]}"
    new_sch = LearningSchedule(
        id=sch_id,
        student_id=user.id,
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
def toggle_schedule_completion(schedule_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    sch = own_schedule(schedule_id, db, user)
    sch.completed = not sch.completed
    db.commit()
    db.refresh(sch)
    return sch

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    sch = own_schedule(schedule_id, db, user)
    db.delete(sch)
    db.commit()
    return {"success": True, "message": "Jadwal berhasil dihapus"}
