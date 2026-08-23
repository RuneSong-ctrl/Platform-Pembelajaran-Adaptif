from pydantic import BaseModel, ConfigDict
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
    type: str # "material", "quiz", "exam", "assignment"
    title: str
    chapter: Optional[str] = None
    source_reference: str
    difficulty_level: str = "MEDIUM"
    is_published: bool = True
    due_date: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class QuizGenerateRequest(BaseModel):
    classroom_id: str
    chapter_title: str
    difficulty_level: str = "MEDIUM"
    num_questions: int = 4
