import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import current_user, require_class_access
from app.core.scope import visible_classroom_ids, visible_student_ids
from app.models.classroom import Classroom
from app.models.submission import AssignmentSubmission
from app.models.task import GroundedTask
from app.models.user import User
from app.schemas.submission import SubmissionResponse, SubmissionCreate, SubmissionGrade

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
    return query.all()

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(data: SubmissionCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    task = db.query(GroundedTask).filter(GroundedTask.id == data.task_id).first()
    if user.role != "SISWA" or not task:
        raise HTTPException(403, "Hanya siswa kelas ini yang dapat mengumpulkan tugas.")
    require_class_access(db.query(Classroom).filter(Classroom.id == task.classroom_id).first(), user)
    sub_id = f"sub_{uuid.uuid4().hex[:8]}"
    new_sub = AssignmentSubmission(
        id=sub_id,
        task_id=data.task_id,
        task_title=data.task_title,
        student_id=user.id,
        student_name=user.name,
        content=data.content,
        attachment_name=data.attachment_name,
        status="SUBMITTED"
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.patch("/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(submission_id: str, data: SubmissionGrade, db: Session = Depends(get_db),
                     user: User = Depends(current_user)):
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    task = db.query(GroundedTask).filter(GroundedTask.id == sub.task_id).first()
    require_class_access(db.query(Classroom).filter(Classroom.id == task.classroom_id).first() if task else None,
                         user, teacher=True)

    sub.grade = data.grade
    sub.feedback = data.feedback
    sub.status = "GRADED"

    db.commit()
    db.refresh(sub)
    return sub
