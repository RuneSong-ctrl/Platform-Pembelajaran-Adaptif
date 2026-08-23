from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    classroom_id: str
    title: str
    raw_text: str
    file_url: Optional[str] = None
    summary: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: str
    chunks_count: int = 1
    vector_id: str
    status: str = "READY"
    uploaded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
