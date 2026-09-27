import json
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import current_user, require_class_access
from app.core.scope import visible_classroom_ids, visible_student_ids
from app.models.classroom import Classroom
from app.models.submission import AssignmentSubmission
from app.models.task import GroundedTask
from app.models.user import User
from app.schemas.submission import SubmissionResponse, SubmissionGrade
from app.services import exam_service, progress_service, upload_rules

router = APIRouter(prefix="/submissions", tags=["Submissions & Gradebook"])

@router.get("", response_model=List[SubmissionResponse])
def get_submissions(task_id: str = None, student_id: str = None, db: Session = Depends(get_db),
                    user: User = Depends(current_user)):
    query = db.query(AssignmentSubmission)
    if user.role == "GURU":
        classes = visible_classroom_ids(user, db)
        tasks = [t.id for t in db.query(GroundedTask).filter(GroundedTask.classroom_id.in_(classes))] if classes else []
        if not tasks:
            return []
        query = query.filter(AssignmentSubmission.task_id.in_(tasks))
    else:
        students = visible_student_ids(user, db)
        if not students:
            return []
        query = query.filter(AssignmentSubmission.student_id.in_(students))
    if task_id:
        query = query.filter(AssignmentSubmission.task_id == task_id)
    if student_id:
        query = query.filter(AssignmentSubmission.student_id == student_id)
    subs = query.all()
    # Exams whose time ran out are closed here too, so the gradebook never shows a stuck "in progress".
    running = [s for s in subs if s.status == "IN_PROGRESS"]
    if running:
        tasks_by_id = {t.id: t for t in db.query(GroundedTask).filter(GroundedTask.id.in_({s.task_id for s in running}))}
        if any(exam_service.settle(tasks_by_id[s.task_id], s) for s in running if s.task_id in tasks_by_id):
            db.commit()
    return subs

def parse_deadline(task: GroundedTask):
    if task.closes_at:
        return task.closes_at
    try:  # legacy tasks kept their deadline as an ISO string
        return exam_service.to_utc_naive(datetime.fromisoformat(task.due_date.replace("Z", "+00:00"))) if task.due_date else None
    except ValueError:
        return None

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(task_id: str = Form(...), content: str = Form(""), keep_files: str = Form("[]"),
                      files: List[UploadFile] = File(default=[]), db: Session = Depends(get_db),
                      user: User = Depends(current_user)):
    """One submission per student per assignment; handing in again replaces it until the teacher grades it."""
    task = db.get(GroundedTask, task_id)
    if user.role != "SISWA" or not task:
        raise HTTPException(403, "Hanya siswa kelas ini yang dapat mengumpulkan tugas.")
    require_class_access(db.get(Classroom, task.classroom_id), user)
    if task.type in ("quiz", "exam"):
        raise HTTPException(400, "Kuis dan ujian dikerjakan di halamannya sendiri.")
    content = content.strip()
    if len(content) > 20000:
        raise HTTPException(400, "Jawaban terlalu panjang (maksimal 20.000 karakter).")
    try:
        keep_ids = set(json.loads(keep_files or "[]"))
    except (ValueError, TypeError):
        raise HTTPException(400, "Daftar lampiran tidak valid.")

    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.task_id == task.id,
                                                AssignmentSubmission.student_id == user.id).first()
    if sub and sub.status == "GRADED":
        raise HTTPException(409, "Tugas ini sudah dinilai guru.")
    kept = [a for a in (sub.attachments or [])] if sub else []
    kept = [a for a in kept if a.get("id") in keep_ids]
    incoming = upload_rules.read_files(files, already=len(kept))
    if not content and not kept and not incoming:
        raise HTTPException(400, "Tulis jawaban atau lampirkan file terlebih dahulu.")

    now = datetime.utcnow()
    if not sub:
        sub = AssignmentSubmission(id=f"sub_{uuid.uuid4().hex[:8]}", task_id=task.id, task_title=task.title,
                                   student_id=user.id, student_name=user.name, content="")
        db.add(sub)
    for dropped in (a for a in (sub.attachments or []) if a.get("id") not in keep_ids):
        upload_rules.remove(f"submissions/{sub.id}", dropped)
    stored = upload_rules.store(f"submissions/{sub.id}", incoming)
    sub.attachments = kept + stored
    sub.attachment_name = (sub.attachments[0]["name"] if sub.attachments else None)
    sub.content = content
    sub.submitted_at = now
    deadline = parse_deadline(task)
    sub.is_late = bool(deadline and now > deadline)
    sub.status = "SUBMITTED"
    progress_service.record_activity(user)
    db.commit()
    db.refresh(sub)
    return sub

@router.patch("/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(submission_id: str, data: SubmissionGrade, db: Session = Depends(get_db),
                     user: User = Depends(current_user)):
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    task = db.query(GroundedTask).filter(GroundedTask.id == sub.task_id).first()
    require_class_access(db.query(Classroom).filter(Classroom.id == task.classroom_id).first() if task else None,
                         user, teacher=True)

    if task.type == "exam":
        exam_service.settle(task, sub)
        if sub.status == "IN_PROGRESS":
            raise HTTPException(409, "Siswa masih mengerjakan ujian ini.")
        essays = {q["id"]: q for q in exam_service.questions_of(task) if q["kind"] == "essay"}
        given = data.essay_scores or {}
        if set(given) != set(essays):
            raise HTTPException(400, "Isi poin untuk setiap soal esai.")
        for qid, points in given.items():
            if not 0 <= points <= essays[qid]["points"]:
                raise HTTPException(400, f"Poin esai harus antara 0 dan {essays[qid]['points']:g}.")
        sub.essay_scores = given
        exam_service.apply_grade(task, sub)
    else:
        if data.grade is None:
            raise HTTPException(400, "Isi nilai 0 sampai 100.")
        sub.grade = data.grade
        sub.status = "GRADED"
    sub.feedback = data.feedback

    db.commit()
    db.refresh(sub)
    return sub
