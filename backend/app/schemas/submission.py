from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class SubmissionBase(BaseModel):
    task_id: str
    task_title: str
    student_id: str
    student_name: str
    content: str
    attachment_name: Optional[str] = None

class SubmissionCreate(BaseModel):
    # Student and task title come from the server; client copies of them are ignored.
    task_id: str
    content: str = Field(min_length=1, max_length=20000)
    attachment_name: Optional[str] = Field(default=None, max_length=255)

class SubmissionGrade(BaseModel):
    grade: float = Field(ge=0, le=100)
    feedback: str = Field(default="", max_length=2000)

class SubmissionResponse(SubmissionBase):
    id: str
    submitted_at: Optional[datetime] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    status: str = "SUBMITTED"

    model_config = ConfigDict(from_attributes=True)
