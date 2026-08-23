from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ScheduleBase(BaseModel):
    student_id: str
    day: str
    time: str
    duration: str
    title: str
    format: str
    completed: bool = False

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleResponse(ScheduleBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

class NoteBase(BaseModel):
    sender_id: str
    sender_name: str
    sender_role: str
    receiver_id: str
    student_id: str
    student_name: str
    message: str

class NoteCreate(NoteBase):
    pass

class NoteReply(BaseModel):
    reply: str

class NoteResponse(NoteBase):
    id: str
    reply: Optional[str] = None
    created_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
