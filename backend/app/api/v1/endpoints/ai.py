from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.classroom import Classroom
from app.models.user import User
from app.models.ai_conversation import AIConversation
from datetime import datetime
import uuid
from app.core.auth import current_user, require_class_access
from app.api.v1.endpoints.learning_units import access
from app.services.gemini_service import chat_with_gemini, generate_ai_quiz, generate_visual_mindmap
from app.services.gateway_service import AIGatewayService
from app.services.cache_service import get_cache_key, get_cached_response, set_cached_response, check_rate_limit
from app.services.vector_store import index_document

router = APIRouter(prefix="/ai", tags=["AI Brain & RAG"], dependencies=[Depends(current_user)])


def require_teacher(user: User):
    # Raw model proxies cost money per call; no student-facing page uses them.
    if user.role != "GURU":
        raise HTTPException(403, "Hanya guru yang dapat memakai fitur ini.")

# --- Request & Response Schemas ---
class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1500)
    history: Optional[List[Dict[str, str]]] = []
    classroom_id: Optional[str] = None
    document_id: Optional[str] = None
    learning_style: Optional[str] = "VISUAL"
    student_name: Optional[str] = "Siswa"
    student_id: Optional[str] = "guest"
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    text: str
    citation: str
    is_grounded: bool
    cached: bool = False
    model: str
    conversation_id: Optional[str] = None

class GenerateQuizRequest(BaseModel):
    document_id: str
    topic: str
    difficulty: Optional[str] = "MEDIUM"
    num_questions: Optional[int] = 10

class DiagramRequest(BaseModel):
    concept: str = Field(..., max_length=300)

class IndexDocRequest(BaseModel):
    document_id: str

class TTSRequest(BaseModel):
    text: str = Field(..., max_length=2000)
    voice: Optional[str] = None
    model: Optional[str] = None

class ImageGenRequest(BaseModel):
    prompt: str = Field(..., max_length=1000)
    size: Optional[str] = "1024x1024"
    model: Optional[str] = None

class EmbeddingRequest(BaseModel):
    texts: List[str]
    model: Optional[str] = None

def own_conversation(conversation_id: str, db: Session, user: User) -> AIConversation:
    conv = db.get(AIConversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(404, "Percakapan tidak ditemukan.")
    return conv

def conversation_summary(c: AIConversation) -> Dict[str, Any]:
    return {"id": c.id, "title": c.title, "document_id": c.document_id, "updated_at": c.updated_at}

@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db), user: User = Depends(current_user)):
    convs = (
        db.query(AIConversation)
        .filter(AIConversation.user_id == user.id)
        .order_by(AIConversation.updated_at.desc())
        .limit(100)
        .all()
    )
    return [conversation_summary(c) for c in convs]

@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    conv = own_conversation(conversation_id, db, user)
    return {**conversation_summary(conv), "messages": conv.messages or []}

@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.delete(own_conversation(conversation_id, db, user))
    db.commit()
    return {"deleted": True}

@router.post("/chat", response_model=ChatResponse)
def ai_chat_endpoint(payload: ChatRequest, db: Session = Depends(get_db), user: User = Depends(current_user)):
    check_rate_limit(f"chat_{user.id}", limit_per_minute=20)
    if payload.document_id:
        payload.classroom_id = access(payload.document_id, db, user).classroom_id
    elif payload.classroom_id:
        require_class_access(db.get(Classroom, payload.classroom_id), user)

    conv = own_conversation(payload.conversation_id, db, user) if payload.conversation_id else None
    # Saved conversations use their stored history, not whatever the client sends.
    history = [{"sender": m["sender"], "text": m["text"]} for m in conv.messages] if conv else (payload.history or [])

    # 1. Semantic Response Cache Check (only for context-free first questions)
    cache_key = get_cache_key(
        "chat",
        payload.message.strip().lower(),
        payload.classroom_id,
        payload.document_id,
        payload.learning_style
    )
    cached_data = get_cached_response(cache_key) if not history else None
    if cached_data:
        reply, cached = cached_data, True
    else:
        # 2. Process with Gemini & RAG
        reply = chat_with_gemini(
            user_query=payload.message,
            chat_history=history,
            classroom_id=payload.classroom_id,
            document_id=payload.document_id,
            learning_style=payload.learning_style,
            student_name=payload.student_name
        )
        cached = False
        # 3. Cache the response
        if not history:
            set_cached_response(cache_key, reply, ttl_seconds=86400)

    # 4. Persist the exchange
    now = datetime.utcnow()
    if not conv:
        title = " ".join(payload.message.split())
        conv = AIConversation(
            id=f"conv_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            title=title[:60] + ("…" if len(title) > 60 else ""),
            document_id=payload.document_id,
            messages=[],
            created_at=now,
        )
        db.add(conv)
    ts = now.isoformat() + "Z"
    conv.messages = [
        *(conv.messages or []),
        {"sender": "user", "text": payload.message, "timestamp": ts},
        {"sender": "ai", "text": reply["text"], "citation": reply["citation"], "timestamp": ts},
    ]
    conv.updated_at = now
    db.commit()

    return ChatResponse(
        text=reply["text"],
        citation=reply["citation"],
        is_grounded=reply["is_grounded"],
        cached=cached,
        model=reply["model"],
        conversation_id=conv.id,
    )

@router.post("/generate-quiz")
def ai_generate_quiz_endpoint(payload: GenerateQuizRequest, db: Session = Depends(get_db), user: User = Depends(current_user)):
    check_rate_limit(f"quiz_{user.id}", limit_per_minute=10)
    doc = access(payload.document_id, db, user)
    
    # Cache check
    cache_key = get_cache_key("quiz", payload.document_id, payload.topic, payload.difficulty, payload.num_questions)
    cached_quiz = get_cached_response(cache_key)
    if cached_quiz:
        return {"questions": cached_quiz, "cached": True}
    
    # Generate quiz using Gemini
    questions = generate_ai_quiz(
        doc_title=doc.title,
        raw_text=doc.raw_text,
        topic=payload.topic,
        difficulty=payload.difficulty or "MEDIUM",
        num_questions=payload.num_questions or 10
    )
    
    set_cached_response(cache_key, questions, ttl_seconds=86400)
    return {"questions": questions, "cached": False}

@router.post("/diagram")
def ai_diagram_endpoint(payload: DiagramRequest, user: User = Depends(current_user)):
    check_rate_limit(f"diagram_{user.id}", limit_per_minute=15)
    
    cache_key = get_cache_key("diagram", payload.concept.strip().lower())
    cached_diag = get_cached_response(cache_key)
    if cached_diag:
        return {**cached_diag, "cached": True}
    
    diag = generate_visual_mindmap(payload.concept)
    set_cached_response(cache_key, diag, ttl_seconds=86400)
    return {**diag, "cached": False}

@router.post("/index-document")
def index_document_endpoint(payload: IndexDocRequest, db: Session = Depends(get_db), user: User = Depends(current_user)):
    doc = access(payload.document_id, db, user, teacher=True)
    
    chunks_count = index_document(
        document_id=doc.id,
        classroom_id=doc.classroom_id,
        title=doc.title,
        raw_text=doc.raw_text
    )
    
    doc.chunks_count = chunks_count
    db.commit()
    return {"status": "success", "indexed_chunks": chunks_count}

@router.post("/tts", summary="Generate Audio Podcast / Narasi Materi via 9router TTS")
def tts_endpoint(payload: TTSRequest, user: User = Depends(current_user)):
    require_teacher(user)
    audio_data = AIGatewayService.generate_speech(
        text=payload.text,
        voice=payload.voice,
        model=payload.model
    )
    if not audio_data:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gagal menghasilkan audio dari gateway TTS. Periksa konfigurasi TTS_ENDPOINT & API Key di .env"
        )
    media_type = "audio/wav" if audio_data.startswith(b"RIFF") else "audio/mpeg"
    return Response(content=audio_data, media_type=media_type)

@router.post("/generate-image", summary="Generate Visual Mindmap / Diagram via 9router Image Gen")
def generate_image_endpoint(payload: ImageGenRequest, user: User = Depends(current_user)):
    require_teacher(user)
    result = AIGatewayService.generate_image(
        prompt=payload.prompt,
        size=payload.size or "1024x1024",
        model=payload.model
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gagal menghasilkan gambar dari gateway Image Generation. Periksa konfigurasi IMAGE_GEN_ENDPOINT & API Key di .env"
        )
    return result

@router.post("/embeddings", summary="Generate Vector Embeddings via 9router Embeddings")
def embeddings_endpoint(payload: EmbeddingRequest, user: User = Depends(current_user)):
    require_teacher(user)
    vectors = AIGatewayService.generate_embeddings(
        texts=payload.texts,
        model=payload.model
    )
    if vectors is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gagal menghasilkan vektor embedding dari gateway. Periksa konfigurasi EMBEDDING_ENDPOINT & API Key di .env"
        )
    return {"data": [{"embedding": vec} for vec in vectors]}
