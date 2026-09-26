from sqlalchemy import Column, String, JSON, DateTime
from datetime import datetime
from app.core.database import Base

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    document_id = Column(String(64), nullable=True)
    # ponytail: messages stored inline as JSON; move to its own table if chats get long enough to need paging
    messages = Column(JSON, nullable=False, default=list)  # [{"sender", "text", "citation", "timestamp"}]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, index=True)
