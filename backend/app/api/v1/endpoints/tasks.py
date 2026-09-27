import copy
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import current_user, require_class_access
from app.core.scope import visible_classroom_ids
from app.models.task import GroundedTask, QuizAttempt
from app.models.submission import AssignmentSubmission
from pydantic import BaseModel
from app.models.classroom import Classroom
from app.models.user import User
from app.schemas.task import TaskResponse, TaskCreate, TaskUpdate, ExamAnswers
from app.schemas.submission import SubmissionResponse
from app.services import exam_service, progress_service, upload_rules

router = APIRouter(prefix="/tasks", tags=["Tasks & Quizzes"])

ANSWER_KEYS = ("correctIndex", "correct_index")


def for_viewer(task: GroundedTask, user: User):
    """Teachers see the full quiz; everyone else gets it without answer keys or the worked solution."""
    if user.role == "GURU":
        return task
    view = TaskResponse.model_validate(task).model_dump()
    content = copy.deepcopy(view.get("content_json") or {})
    if task.type == "exam":
        # Exam questions are only handed out by /start, inside the exam window.
        questions = exam_service.questions_of(task)
        view["content_json"] = {"instructions": content.get("instructions", ""), "question_count": len(questions),
                                "total_points": sum(q["points"] for q in questions),
                                "has_essay": any(q["kind"] == "essay" for q in questions)}
        return view
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
    progress_service.record_activity(user)
    attempt.answers = answers
    db.merge(attempt)
    db.commit()
    correct_index = question.get("correctIndex", question.get("correct_index"))
    return {"correct": chosen is not None and chosen == correct_index, "correct_index": correct_index,
            "selected_index": chosen, "langkah": (question.get("explanation") or {}).get("langkah")}

TASK_TYPES = ("assignment", "quiz", "exam")
EXAM_LABELS = ("UTS", "UAS", "Ulangan")


def clean_content(task_type: str, content: dict | None) -> dict:
    """Normalizes instructions and questions; questions must be answerable and gradable."""
    content = dict(content or {})
    content["instructions"] = str(content.get("instructions") or "")[:10000]
    if task_type == "assignment":
        content.pop("questions", None)
        return content
    questions = content.get("questions") or []
    if not questions:
        raise HTTPException(400, "Tambahkan minimal satu soal.")
    if len(questions) > 100:
        raise HTTPException(400, "Maksimal 100 soal.")
    cleaned, seen = [], set()
    for i, q in enumerate(questions, 1):
        kind = q.get("kind") or "mcq"
        if kind not in ("mcq", "essay"):
            raise HTTPException(400, f"Soal {i}: jenis soal tidak dikenal.")
        if kind == "essay" and task_type != "exam":
            raise HTTPException(400, f"Soal {i}: soal esai hanya untuk ujian.")
        text = str(q.get("questionText") or q.get("question_text") or "").strip()
        if not text:
            raise HTTPException(400, f"Soal {i}: pertanyaan masih kosong.")
        try:
            points = float(q.get("points", 1) or 1)
        except (TypeError, ValueError):
            raise HTTPException(400, f"Soal {i}: poin harus berupa angka.")
        if not 0 < points <= 100:
            raise HTTPException(400, f"Soal {i}: poin harus antara 1 dan 100.")
        qid = str(q.get("id") or f"q{i}")
        if qid in seen:
            qid = f"q{i}_{uuid.uuid4().hex[:4]}"
        seen.add(qid)
        item = {**q, "id": qid, "kind": kind, "questionText": text, "points": points}
        item.pop("question_text", None)
        if kind == "mcq":
            options = [str(o).strip() for o in (q.get("options") or [])]
            if len(options) < 2 or not all(options):
                raise HTTPException(400, f"Soal {i}: isi minimal dua pilihan jawaban.")
            key = q.get("correctIndex", q.get("correct_index"))
            if not isinstance(key, int) or isinstance(key, bool) or not 0 <= key < len(options):
                raise HTTPException(400, f"Soal {i}: pilih kunci jawabannya.")
            item.update(options=options, correctIndex=key)
            item.pop("correct_index", None)
        else:
            for key in ("options", "correctIndex", "correct_index"):
                item.pop(key, None)
        cleaned.append(item)
    content["questions"] = cleaned
    return content


def check_schedule(task_type: str, opens_at, closes_at, time_limit, exam_label):
    if task_type == "exam":
        if not opens_at or not closes_at:
            raise HTTPException(400, "Ujian perlu waktu buka dan waktu tutup.")
        if closes_at <= opens_at:
            raise HTTPException(400, "Waktu tutup ujian harus setelah waktu buka.")
        if not time_limit or not 1 <= time_limit <= 600:
            raise HTTPException(400, "Durasi ujian harus 1 sampai 600 menit.")
        if exam_label not in EXAM_LABELS:
            raise HTTPException(400, "Pilih jenis ujian: UTS, UAS, atau Ulangan.")


def owned_task(task_id: str, db: Session, user: User) -> GroundedTask:
    task = db.get(GroundedTask, task_id)
    if not task:
        raise HTTPException(404, "Tugas tidak ditemukan.")
    require_class_access(db.get(Classroom, task.classroom_id), user, teacher=True)
    return task


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cls = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
    require_class_access(cls, user, teacher=True)
    if data.type not in TASK_TYPES:
        raise HTTPException(400, "Jenis tugas harus Tugas, Kuis, atau Ujian.")
    opens_at, closes_at = exam_service.to_utc_naive(data.opens_at), exam_service.to_utc_naive(data.closes_at)
    exam_label = data.exam_label if data.type == "exam" else None
    time_limit = data.time_limit_minutes if data.type == "exam" else None
    check_schedule(data.type, opens_at, closes_at, time_limit, exam_label)
    task_id = f"task_{uuid.uuid4().hex[:8]}"

    new_task = GroundedTask(
        id=task_id,
        classroom_id=data.classroom_id,
        classroom_name=cls.name,
        type=data.type,
        title=data.title.strip(),
        chapter=data.chapter,
        source_reference=data.source_reference or "Dibuat guru",
        difficulty_level=data.difficulty_level,
        is_published=data.is_published,
        due_date=data.due_date,
        content_json=clean_content(data.type, data.content_json),
        exam_label=exam_label,
        opens_at=opens_at if data.type == "exam" else None,
        closes_at=closes_at,
        time_limit_minutes=time_limit,
        max_attempts={"quiz": MAX_QUIZ_ATTEMPTS, "exam": 1}.get(data.type),
        attachments=[],
    )
    db.add(new_task)
    cls.tasks_count = (cls.tasks_count or 0) + 1
    db.commit()
    db.refresh(new_task)
    return new_task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, data: TaskUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = owned_task(task_id, db, user)
    fields = data.model_dump(exclude_unset=True)
    if "content_json" in fields:
        content = clean_content(task.type, fields["content_json"])
        started = db.query(AssignmentSubmission).filter(AssignmentSubmission.task_id == task.id).first()
        if started and task.type == "exam" and content.get("questions") != (task.content_json or {}).get("questions"):
            raise HTTPException(409, "Ujian sudah dikerjakan siswa, soalnya tidak bisa diubah lagi.")
        task.content_json = content
    if "title" in fields:
        task.title = fields["title"].strip()
    for key in ("chapter", "is_published"):
        if key in fields:
            setattr(task, key, fields[key])
    if "closes_at" in fields:
        task.closes_at = exam_service.to_utc_naive(fields["closes_at"])
    if task.type == "exam":
        if "opens_at" in fields:
            task.opens_at = exam_service.to_utc_naive(fields["opens_at"])
        if "time_limit_minutes" in fields:
            task.time_limit_minutes = fields["time_limit_minutes"]
        if "exam_label" in fields:
            task.exam_label = fields["exam_label"]
    check_schedule(task.type, task.opens_at, task.closes_at, task.time_limit_minutes, task.exam_label)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = owned_task(task_id, db, user)
    for sub in db.query(AssignmentSubmission).filter(AssignmentSubmission.task_id == task.id).all():
        upload_rules.remove_folder(f"submissions/{sub.id}")
        db.delete(sub)
    db.query(QuizAttempt).filter(QuizAttempt.task_id == task.id).delete(synchronize_session=False)
    upload_rules.remove_folder(f"tasks/{task.id}")
    cls = db.get(Classroom, task.classroom_id)
    if cls:
        cls.tasks_count = max(0, (cls.tasks_count or 0) - 1)
    db.delete(task)
    db.commit()
    return {"deleted": True}


@router.post("/{task_id}/attachments", response_model=TaskResponse)
def add_attachments(task_id: str, files: List[UploadFile] = File(...), db: Session = Depends(get_db),
                    user: User = Depends(current_user)):
    task = owned_task(task_id, db, user)
    existing = list(task.attachments or [])
    stored = upload_rules.store(f"tasks/{task.id}", upload_rules.read_files(files, already=len(existing)))
    task.attachments = existing + stored
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}/attachments/{file_id}", response_model=TaskResponse)
def remove_attachment(task_id: str, file_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = owned_task(task_id, db, user)
    target = next((a for a in task.attachments or [] if a.get("id") == file_id), None)
    if not target:
        raise HTTPException(404, "Lampiran tidak ditemukan.")
    upload_rules.remove(f"tasks/{task.id}", target)
    task.attachments = [a for a in task.attachments if a.get("id") != file_id]
    db.commit()
    db.refresh(task)
    return task


# ---- Timed exams -------------------------------------------------------------------------------

def exam_for_student(task_id: str, db: Session, user: User) -> GroundedTask:
    task = db.get(GroundedTask, task_id)
    if user.role != "SISWA" or not task or task.type != "exam":
        raise HTTPException(404, "Ujian tidak ditemukan.")
    require_class_access(db.get(Classroom, task.classroom_id), user)
    return task


def exam_payload(task: GroundedTask, sub: AssignmentSubmission) -> dict:
    questions = [{"id": q["id"], "kind": q["kind"], "questionText": q.get("questionText", ""),
                  "options": q.get("options") if q["kind"] == "mcq" else None, "points": q["points"]}
                 for q in exam_service.questions_of(task)]
    return {"submission_id": sub.id, "status": sub.status, "started_at": sub.started_at,
            "deadline": exam_service.deadline(task, sub), "server_now": datetime.utcnow(),
            "questions": questions, "answers": sub.answers or {}}


def clean_answers(task: GroundedTask, answers: dict) -> dict:
    kinds = {q["id"]: q for q in exam_service.questions_of(task)}
    cleaned = {}
    for qid, value in (answers or {}).items():
        q = kinds.get(qid)
        if not q or value is None:
            continue
        if q["kind"] == "mcq":
            if not isinstance(value, int) or isinstance(value, bool) or not 0 <= value < len(q.get("options") or []):
                raise HTTPException(400, "Jawaban pilihan ganda tidak valid.")
            cleaned[qid] = value
        else:
            cleaned[qid] = str(value)[:5000]
    return cleaned


def running_attempt(task: GroundedTask, db: Session, user: User) -> AssignmentSubmission:
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.task_id == task.id,
                                                AssignmentSubmission.student_id == user.id).first()
    if not sub:
        raise HTTPException(409, "Ujian belum dimulai.")
    if exam_service.settle(task, sub):
        db.commit()
    if sub.status != "IN_PROGRESS":
        raise HTTPException(409, "Waktu ujian sudah habis, jawabanmu sudah terkirim.")
    return sub


@router.post("/{task_id}/start")
def start_exam(task_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = exam_for_student(task_id, db, user)
    now = datetime.utcnow()
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.task_id == task.id,
                                                AssignmentSubmission.student_id == user.id).first()
    if sub:
        if exam_service.settle(task, sub, now):
            db.commit()
        if sub.status != "IN_PROGRESS":
            raise HTTPException(409, "Ujian ini sudah kamu kerjakan.")
        return exam_payload(task, sub)  # reopening the page resumes with the same clock
    if task.opens_at and now < task.opens_at:
        raise HTTPException(403, "Ujian belum dibuka.")
    if task.closes_at and now >= task.closes_at:
        raise HTTPException(403, "Ujian sudah ditutup.")
    sub = AssignmentSubmission(id=f"sub_{uuid.uuid4().hex[:8]}", task_id=task.id, task_title=task.title,
                               student_id=user.id, student_name=user.name, content="", answers={},
                               status="IN_PROGRESS", started_at=now, submitted_at=now)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return exam_payload(task, sub)


@router.put("/{task_id}/progress")
def save_exam_progress(task_id: str, data: ExamAnswers, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = exam_for_student(task_id, db, user)
    sub = running_attempt(task, db, user)
    sub.answers = {**(sub.answers or {}), **clean_answers(task, data.answers)}
    db.commit()
    return {"saved": True, "deadline": exam_service.deadline(task, sub)}


@router.post("/{task_id}/submit", response_model=SubmissionResponse)
def submit_exam(task_id: str, data: ExamAnswers, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = exam_for_student(task_id, db, user)
    sub = running_attempt(task, db, user)
    sub.answers = {**(sub.answers or {}), **clean_answers(task, data.answers)}
    exam_service.finish(task, sub, datetime.utcnow())
    progress_service.record_activity(user)
    db.commit()
    db.refresh(sub)
    return sub
