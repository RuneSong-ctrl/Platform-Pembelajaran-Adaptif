from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class QuizQuestionSchema(BaseModel):
    id: str
    question_text: str
    options: List[str]
    correct_index: int
    difficulty: str
    source_reference: str
    explanation: Dict[str, str]

class TaskBase(BaseModel):
    classroom_id: str
    classroom_name: str
    type: str  # "assignment", "quiz", "exam" ("material" in old rows)
    title: str = Field(min_length=1, max_length=255)
    chapter: Optional[str] = None
    source_reference: str = "Dibuat guru"
    difficulty_level: str = "MEDIUM"
    is_published: bool = True
    due_date: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    exam_label: Optional[str] = None
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    time_limit_minutes: Optional[int] = None
    max_attempts: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    chapter: Optional[str] = None
    is_published: Optional[bool] = None
    content_json: Optional[Dict[str, Any]] = None
    exam_label: Optional[str] = None
    opens_at: Optional[datetime] = None
    closes_at: Optional[datetime] = None
    time_limit_minutes: Optional[int] = None

class TaskResponse(TaskBase):
    id: str
    created_at: Optional[datetime] = None
    attachments: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(from_attributes=True)

class ExamAnswers(BaseModel):
    # option index for multiple choice, text for essays
    answers: Dict[str, Any] = {}
