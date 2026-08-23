from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class SubmissionBase(BaseModel):
    task_id: str
    task_title: str
    student_id: str
    student_name: str
    content: str
    attachment_name: Optional[str] = None

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionGrade(BaseModel):
    grade: float
    feedback: str

class SubmissionResponse(SubmissionBase):
    id: str
    submitted_at: Optional[datetime] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    status: str = "SUBMITTED"

    model_config = ConfigDict(from_attributes=True)
