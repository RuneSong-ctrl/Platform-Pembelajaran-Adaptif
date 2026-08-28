from fastapi import APIRouter, Depends, Request, HTTPException, status, Response
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.document import GroundedDocument
from app.services.gemini_service import chat_with_gemini, generate_ai_quiz, generate_visual_mindmap
from app.services.gateway_service import AIGatewayService
from app.services.cache_service import get_cache_key, get_cached_response, set_cached_response, check_rate_limit
from app.services.vector_store import index_document

router = APIRouter(prefix="/ai", tags=["AI Brain & RAG"])

# --- Request & Response Schemas ---
class ChatRequest(BaseModel):
    message: str = Field(..., max_length=1500)
    history: Optional[List[Dict[str, str]]] = []
    classroom_id: Optional[str] = None
    document_id: Optional[str] = None
    learning_style: Optional[str] = "VISUAL"
    student_name: Optional[str] = "Siswa"
    student_id: Optional[str] = "guest"

class ChatResponse(BaseModel):
    text: str
    citation: str
    is_grounded: bool
    cached: bool = False
    model: str

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

@router.post("/chat", response_model=ChatResponse)
def ai_chat_endpoint(payload: ChatRequest, request: Request):
    client_ip = request.client.host if request.client else payload.student_id or "default_client"
    check_rate_limit(f"{client_ip}_{payload.student_id}", limit_per_minute=20)
    
    # 1. Semantic Response Cache Check
    cache_key = get_cache_key(
        "chat",
        payload.message.strip().lower(),
        payload.classroom_id,
        payload.document_id,
        payload.learning_style
    )
    cached_data = get_cached_response(cache_key)
    if cached_data:
        return ChatResponse(
            text=cached_data["text"],
            citation=cached_data["citation"],
            is_grounded=cached_data["is_grounded"],
            cached=True,
            model=cached_data["model"]
        )
    
    # 2. Process with Gemini & RAG
    reply = chat_with_gemini(
        user_query=payload.message,
        chat_history=payload.history or [],
        classroom_id=payload.classroom_id,
        document_id=payload.document_id,
        learning_style=payload.learning_style,
        student_name=payload.student_name
    )
    
    # 3. Cache the response
    set_cached_response(cache_key, reply, ttl_seconds=86400)
    
    return ChatResponse(
        text=reply["text"],
        citation=reply["citation"],
        is_grounded=reply["is_grounded"],
        cached=False,
        model=reply["model"]
    )

@router.post("/generate-quiz")
def ai_generate_quiz_endpoint(payload: GenerateQuizRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "quiz_generator"
    check_rate_limit(f"quiz_{client_ip}", limit_per_minute=10)
    
    # Find source document in DB
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == payload.document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokumen modul rujukan tidak ditemukan di database"
        )
    
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
def ai_diagram_endpoint(payload: DiagramRequest, request: Request):
    client_ip = request.client.host if request.client else "diagram_generator"
    check_rate_limit(f"diagram_{client_ip}", limit_per_minute=15)
    
    cache_key = get_cache_key("diagram", payload.concept.strip().lower())
    cached_diag = get_cached_response(cache_key)
    if cached_diag:
        return {**cached_diag, "cached": True}
    
    diag = generate_visual_mindmap(payload.concept)
    set_cached_response(cache_key, diag, ttl_seconds=86400)
    return {**diag, "cached": False}

@router.post("/index-document")
def index_document_endpoint(payload: IndexDocRequest, db: Session = Depends(get_db)):
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == payload.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
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
def tts_endpoint(payload: TTSRequest):
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
def generate_image_endpoint(payload: ImageGenRequest):
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
def embeddings_endpoint(payload: EmbeddingRequest):
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
