import uuid
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.classroom import Classroom
from app.models.user import User
from app.schemas.classroom import ClassroomResponse, ClassroomCreate, ClassroomJoin

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])

def generate_join_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

@router.get("", response_model=List[ClassroomResponse])
def get_classrooms(db: Session = Depends(get_db)):
    return db.query(Classroom).all()

@router.get("/{classroom_id}", response_model=ClassroomResponse)
def get_classroom_by_id(classroom_id: str, db: Session = Depends(get_db)):
    cls = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    return cls

@router.post("", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(data: ClassroomCreate, db: Session = Depends(get_db)):
    cls_id = f"cls_{uuid.uuid4().hex[:8]}"
    join_code = generate_join_code()
    
    new_cls = Classroom(
        id=cls_id,
        name=data.name,
        grade=data.grade,
        subject=data.subject,
        join_code=join_code,
        teacher_id=data.teacher_id,
        teacher_name=data.teacher_name,
        student_ids=[],
        documents_count=0,
        tasks_count=0
    )
    db.add(new_cls)
    db.commit()
    db.refresh(new_cls)
    return new_cls

@router.post("/join")
def join_classroom(data: ClassroomJoin, db: Session = Depends(get_db)):
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
