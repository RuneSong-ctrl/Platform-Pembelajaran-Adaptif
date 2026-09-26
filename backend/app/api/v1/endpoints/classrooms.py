import uuid
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.classroom import Classroom
from app.models.user import User
from datetime import datetime, timedelta
from app.models.task import GroundedTask
from app.models.submission import AssignmentSubmission
from app.core.auth import current_user, require_class_access
from app.services.cache_service import check_rate_limit
from app.core.scope import visible_classrooms, visible_classroom_ids
from app.schemas.classroom import ClassroomResponse, ClassroomCreate, ClassroomJoin

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])

def generate_join_code() -> str:
    return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

@router.get("", response_model=List[ClassroomResponse])
def get_classrooms(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return visible_classrooms(user, db)

@router.get("/{classroom_id}", response_model=ClassroomResponse)
def get_classroom_by_id(classroom_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cls = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not cls or cls.id not in visible_classroom_ids(user, db):
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    return cls

@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(data: ClassroomCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role != "GURU":
        raise HTTPException(403, "Hanya guru yang dapat membuat kelas.")
    cls_id = f"cls_{uuid.uuid4().hex[:8]}"
    join_code = generate_join_code()
    
    new_cls = Classroom(
        id=cls_id,
        name=data.name,
        grade=data.grade,
        subject=data.subject,
        join_code=join_code,
        teacher_id=user.id,
        teacher_name=user.name,
        student_ids=[],
        documents_count=0,
        tasks_count=0
    )
    db.add(new_cls)
    db.commit()
    db.refresh(new_cls)
    return new_cls

@router.post("/join")
def join_classroom(data: ClassroomJoin, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role != "SISWA":
        raise HTTPException(403, "Hanya siswa yang dapat bergabung.")
    check_rate_limit(f"join_{user.id}", limit_per_minute=10,
                     detail="Terlalu banyak percobaan kode kelas. Tunggu satu menit lalu coba lagi.")
    data.student_id = user.id
    cls = db.query(Classroom).filter(Classroom.join_code == data.join_code.upper()).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kode kelas tidak valid")
    
    students = list(cls.student_ids or [])
    if data.student_id in students:
        return {"success": True, "message": f"Anda sudah terdaftar di kelas {cls.name}", "classroom": cls}
        
    students.append(data.student_id)
    cls.student_ids = students
    db.commit()
    db.refresh(cls)
    return {"success": True, "message": f"Berhasil bergabung ke kelas {cls.name}", "classroom": cls}


@router.post("/{classroom_id}/reset-code", response_model=ClassroomResponse)
def reset_join_code(classroom_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """New code (and so a new invite link); the old code and link stop working. Joined students stay."""
    cls = db.get(Classroom, classroom_id)
    require_class_access(cls, user, teacher=True)
    code = generate_join_code()
    while db.query(Classroom).filter(Classroom.join_code == code).first():
        code = generate_join_code()
    cls.join_code = code
    db.commit()
    db.refresh(cls)
    return cls

@router.get("/{classroom_id}/students")
def get_class_roster(classroom_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Roster for the class teacher: who joined, and which students need a closer look."""
    cls = db.get(Classroom, classroom_id)
    require_class_access(cls, user, teacher=True)
    return class_roster(cls, db)

def class_roster(cls: Classroom, db: Session) -> list[dict]:
    from app.api.v1.endpoints.users import learning_progress_for
    classroom_id = cls.id
    task_ids = [t.id for t in db.query(GroundedTask.id).filter(GroundedTask.classroom_id == classroom_id)]
    ids = list(cls.student_ids or [])
    students = db.query(User).filter(User.id.in_(ids)).all() if ids else []
    subs = db.query(AssignmentSubmission).filter(AssignmentSubmission.task_id.in_(task_ids),
                                                 AssignmentSubmission.student_id.in_(ids)).all() if task_ids and ids else []
    week_ago = datetime.utcnow() - timedelta(days=7)
    roster = []
    for s in students:
        mine = [x for x in subs if x.student_id == s.id]
        grades = [x.grade for x in mine if x.grade is not None]
        avg = round(sum(grades) / len(grades)) if grades else None
        missing = len(task_ids) - len({x.task_id for x in mine})
        last = max([x.submitted_at for x in mine if x.submitted_at] + [s.updated_at or s.created_at or week_ago])
        alerts = []
        if missing > 0:
            alerts.append(f"Belum mengumpulkan {missing} tugas")
        if avg is not None and avg < 70:
            alerts.append("Nilai rata-rata di bawah 70")
        if last < week_ago:
            alerts.append("Tidak aktif lebih dari 7 hari")
        roster.append({
            "id": s.id, "name": s.name, "email": s.email, "avatar": s.avatar,
            "learning_style": s.learning_style, "level": s.current_dda_level,
            "xp_total": s.xp_total or 0, "streak_days": s.streak_days or 0,
            "progress": learning_progress_for(s, db).overall_progress,
            "tasks_total": len(task_ids), "tasks_submitted": len(task_ids) - missing,
            "average_grade": avg, "last_active": last.isoformat(), "alerts": alerts,
        })
    roster.sort(key=lambda r: (-len(r["alerts"]), r["name"].lower()))
    return roster

@router.delete("/{classroom_id}/students/{student_id}")
def remove_student(classroom_id: str, student_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cls = db.get(Classroom, classroom_id)
    require_class_access(cls, user, teacher=True)
    if student_id not in (cls.student_ids or []):
        raise HTTPException(404, "Siswa tidak terdaftar di kelas ini.")
    cls.student_ids = [sid for sid in cls.student_ids if sid != student_id]
    db.commit()
    return {"success": True}
