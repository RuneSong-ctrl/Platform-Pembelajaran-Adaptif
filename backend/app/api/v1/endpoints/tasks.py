import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.task import GroundedTask
from app.models.classroom import Classroom
from app.schemas.task import TaskResponse, TaskCreate, QuizGenerateRequest
from app.services.rag_service import generate_grounded_quiz_draft

router = APIRouter(prefix="/tasks", tags=["Tasks & Quizzes"])

@router.get("", response_model=List[TaskResponse])
def get_tasks(classroom_id: str = None, db: Session = Depends(get_db)):
    query = db.query(GroundedTask)
    if classroom_id:
        query = query.filter(GroundedTask.classroom_id == classroom_id)
    return query.all()

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(task_id: str, db: Session = Depends(get_db)):
    task = db.query(GroundedTask).filter(GroundedTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tugas / Kuis tidak ditemukan")
    return task

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
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
    
    cls = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
    if cls:
        cls.tasks_count += 1
        
    db.commit()
    db.refresh(new_task)
    return new_task

@router.post("/generate-quiz")
def generate_ai_quiz(req: QuizGenerateRequest, db: Session = Depends(get_db)):
    cls = db.query(Classroom).filter(Classroom.id == req.classroom_id).first()
    cls_name = cls.name if cls else "Kelas Sains"
    
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
    if cls:
        cls.tasks_count += 1
    db.commit()
    db.refresh(new_task)
    
    return {
        "success": True,
        "message": "Kuis ter-grounding berhasil dibangkitkan oleh AI",
        "task": new_task
    }
