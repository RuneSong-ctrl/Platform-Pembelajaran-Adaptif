from sqlalchemy import Column, String, Integer, Text, DateTime
from datetime import datetime
from app.core.database import Base

class GroundedDocument(Base):
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True, index=True)
    classroom_id = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    file_url = Column(String(512), nullable=True)
    raw_text = Column(Text, nullable=False)
    chunks_count = Column(Integer, default=1)
    vector_id = Column(String(128), nullable=False)
    status = Column(String(32), default="READY") # "PROCESSING", "READY", "ERROR"
    summary = Column(Text, nullable=True)
    podcast_script = Column(Text, nullable=True)
    podcast_audio_url = Column(String(512), nullable=True)
    mindmap_code = Column(Text, nullable=True)
    visual_image_url = Column(Text, nullable=True)
    visual_nodes_json = Column(Text, nullable=True)
    flashcards_json = Column(Text, nullable=True)
    karaoke_json = Column(Text, nullable=True)
    podcast_episodes_json = Column(Text, nullable=True)
    game_config_json = Column(Text, nullable=True)
    fill_blank_json = Column(Text, nullable=True)
    sorting_challenges_json = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
