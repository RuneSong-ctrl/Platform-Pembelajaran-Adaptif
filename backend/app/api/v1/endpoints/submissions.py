import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.submission import AssignmentSubmission
from app.schemas.submission import SubmissionResponse, SubmissionCreate, SubmissionGrade

router = APIRouter(prefix="/submissions", tags=["Submissions & Gradebook"])

@router.get("", response_model=List[SubmissionResponse])
def get_submissions(task_id: str = None, student_id: str = None, db: Session = Depends(get_db)):
    query = db.query(AssignmentSubmission)
    if task_id:
        query = query.filter(AssignmentSubmission.task_id == task_id)
    if student_id:
        query = query.filter(AssignmentSubmission.student_id == student_id)
    return query.all()

@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(data: SubmissionCreate, db: Session = Depends(get_db)):
    sub_id = f"sub_{uuid.uuid4().hex[:8]}"
    new_sub = AssignmentSubmission(
        id=sub_id,
        task_id=data.task_id,
        task_title=data.task_title,
        student_id=data.student_id,
        student_name=data.student_name,
        content=data.content,
        attachment_name=data.attachment_name,
        status="SUBMITTED"
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.patch("/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(submission_id: str, data: SubmissionGrade, db: Session = Depends(get_db)):
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
        
    sub.grade = data.grade
    sub.feedback = data.feedback
    sub.status = "GRADED"
    
    db.commit()
    db.refresh(sub)
    return sub
