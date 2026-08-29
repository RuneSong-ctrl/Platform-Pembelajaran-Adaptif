from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    classroom_id: str
    title: str
    raw_text: str
    file_url: Optional[str] = None
    summary: Optional[str] = None
    podcast_script: Optional[str] = None
    podcast_audio_url: Optional[str] = None
    mindmap_code: Optional[str] = None
    visual_image_url: Optional[str] = None
    visual_nodes_json: Optional[str] = None
    flashcards_json: Optional[str] = None
    karaoke_json: Optional[str] = None
    podcast_episodes_json: Optional[str] = None
    game_config_json: Optional[str] = None
    fill_blank_json: Optional[str] = None
    sorting_challenges_json: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: str
    chunks_count: int = 1
    vector_id: str
    status: str = "READY"
    uploaded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
