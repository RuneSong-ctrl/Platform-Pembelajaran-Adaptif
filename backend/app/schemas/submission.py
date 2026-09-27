from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class SubmissionBase(BaseModel):
    task_id: str
    task_title: str
    student_id: str
    student_name: str
    content: str
    attachment_name: Optional[str] = None

class SubmissionGrade(BaseModel):
    # Assignments: a 0-100 grade. Exams: points per essay question; the server works out the grade.
    grade: Optional[float] = Field(default=None, ge=0, le=100)
    essay_scores: Optional[Dict[str, float]] = None
    feedback: str = Field(default="", max_length=2000)

class SubmissionResponse(SubmissionBase):
    id: str
    submitted_at: Optional[datetime] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    status: str = "SUBMITTED"
    attachments: Optional[List[Dict[str, Any]]] = None
    answers: Optional[Dict[str, Any]] = None
    essay_scores: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    is_late: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)
