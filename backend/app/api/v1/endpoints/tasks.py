import copy
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import current_user, require_class_access
from app.core.scope import visible_classroom_ids
from app.models.task import GroundedTask, QuizAttempt
from pydantic import BaseModel
from app.models.classroom import Classroom
from app.models.user import User
from app.schemas.task import TaskResponse, TaskCreate, QuizGenerateRequest
from app.services.rag_service import generate_grounded_quiz_draft

router = APIRouter(prefix="/tasks", tags=["Tasks & Quizzes"])

ANSWER_KEYS = ("correctIndex", "correct_index")


def for_viewer(task: GroundedTask, user: User):
    """Teachers see the full quiz; everyone else gets it without answer keys or the worked solution."""
    if user.role == "GURU":
        return task
    view = TaskResponse.model_validate(task).model_dump()
    content = copy.deepcopy(view.get("content_json") or {})
    for q in content.get("questions") or []:
        for key in ANSWER_KEYS:
            q.pop(key, None)
        if isinstance(q.get("explanation"), dict):
            q["explanation"].pop("langkah", None)  # step-by-step names the right option; shown after answering
    view["content_json"] = content
    return view


@router.get("", response_model=List[TaskResponse])
def get_tasks(classroom_id: str = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    allowed = visible_classroom_ids(user, db)
    if classroom_id:
        allowed &= {classroom_id}
    if not allowed:
        return []
    return [for_viewer(t, user) for t in db.query(GroundedTask).filter(GroundedTask.classroom_id.in_(allowed)).all()]

@router.get("/{task_id}", response_model=TaskResponse)
def get_task_by_id(task_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = db.query(GroundedTask).filter(GroundedTask.id == task_id).first()
    if not task or task.classroom_id not in visible_classroom_ids(user, db):
        raise HTTPException(status_code=404, detail="Tugas / Kuis tidak ditemukan")
    return for_viewer(task, user)


MAX_QUIZ_ATTEMPTS = 3


class AnswerIn(BaseModel):
    question_id: str
    selected_index: int | None = None  # None = time ran out


@router.post("/{task_id}/answer")
def answer_question(task_id: str, data: AnswerIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Grades one quiz answer on the server. The first answer to a question in an attempt is final,
    so the feedback cannot be used to probe for the right option before committing."""
    task = db.get(GroundedTask, task_id)
    if user.role != "SISWA" or not task or task.type != "quiz":
        raise HTTPException(404, "Kuis tidak ditemukan.")
    require_class_access(db.get(Classroom, task.classroom_id), user)
    question = next((q for q in (task.content_json or {}).get("questions", []) if q.get("id") == data.question_id), None)
    if not question:
        raise HTTPException(404, "Soal tidak ditemukan.")
    attempt = db.get(QuizAttempt, (user.id, task_id)) or QuizAttempt(student_id=user.id, task_id=task_id, answers={}, finished=0)
    if (attempt.finished or 0) >= MAX_QUIZ_ATTEMPTS:
        raise HTTPException(409, f"Kamu sudah mengerjakan kuis ini {MAX_QUIZ_ATTEMPTS} kali.")
    answers = dict(attempt.answers or {})
    chosen = answers.setdefault(data.question_id, data.selected_index)
    attempt.answers = answers
    db.merge(attempt)
    db.commit()
    correct_index = question.get("correctIndex", question.get("correct_index"))
    return {"correct": chosen is not None and chosen == correct_index, "correct_index": correct_index,
            "selected_index": chosen, "langkah": (question.get("explanation") or {}).get("langkah")}

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
