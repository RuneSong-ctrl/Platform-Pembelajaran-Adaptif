from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class ClassroomBase(BaseModel):
    name: str
    grade: int = 10
    subject: str
    teacher_id: str
    teacher_name: str

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomJoin(BaseModel):
    join_code: str
    student_id: str

class ClassroomResponse(ClassroomBase):
    id: str
    join_code: str
    student_ids: List[str] = []
    documents_count: int = 0
    tasks_count: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
