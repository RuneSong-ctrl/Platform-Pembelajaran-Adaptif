import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import current_user, require_class_access
from app.core.scope import visible_classroom_ids
from app.models.task import GroundedTask
from app.models.classroom import Classroom
from app.models.user import User
from app.schemas.task import TaskResponse, TaskCreate, QuizGenerateRequest
from app.services.rag_service import generate_grounded_quiz_draft

router = APIRouter(prefix="/tasks", tags=["Tasks & Quizzes"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(classroom_id: str = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    allowed = visible_classroom_ids(user, db)
    if classroom_id:
        allowed &= {classroom_id}
    if not allowed:
        return []
    return db.query(GroundedTask).filter(GroundedTask.classroom_id.in_(allowed)).all()

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(task_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = db.query(GroundedTask).filter(GroundedTask.id == task_id).first()
    if not task or task.classroom_id not in visible_classroom_ids(user, db):
        raise HTTPException(status_code=404, detail="Tugas / Kuis tidak ditemukan")
    return task

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cls = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
    require_class_access(cls, user, teacher=True)
    task_id = f"task_{uuid.uuid4().hex[:8]}"

    new_task = GroundedTask(
        id=task_id,
        classroom_id=data.classroom_id,
        classroom_name=data.classroom_name,
        type=data.type,
        title=data.title,
        chapter=data.chapter,
        source_reference=data.source_reference,
        difficulty_level=data.difficulty_level,
        is_published=data.is_published,
        due_date=data.due_date,
        content_json=data.content_json
    )
    db.add(new_task)
    cls.tasks_count += 1
    db.commit()
    db.refresh(new_task)
    return new_task

@router.post("/generate-quiz")
def generate_ai_quiz(req: QuizGenerateRequest, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cls = db.query(Classroom).filter(Classroom.id == req.classroom_id).first()
    require_class_access(cls, user, teacher=True)
    cls_name = cls.name

    generated_questions = generate_grounded_quiz_draft(
        chapter_title=req.chapter_title,
        difficulty=req.difficulty_level,
        num_q=req.num_questions
    )

    task_id = f"task_ai_{uuid.uuid4().hex[:8]}"
    new_task = GroundedTask(
        id=task_id,
        classroom_id=req.classroom_id,
        classroom_name=cls_name,
        type="quiz",
        title=f"Kuis Ter-Grounding AI: {req.chapter_title}",
        chapter=req.chapter_title,
        source_reference=f"Dokumen Kurikulum {cls_name}",
        difficulty_level=req.difficulty_level,
        is_published=True,
        content_json={
            "overview": f"Kuis AI otomatis ter-grounding dari modul {req.chapter_title} tanpa halusinasi.",
            "questions": generated_questions
        }
    )
    db.add(new_task)
    cls.tasks_count += 1
    db.commit()
    db.refresh(new_task)

    return {
        "success": True,
        "message": "Kuis ter-grounding berhasil dibangkitkan oleh AI",
        "task": new_task
    }
