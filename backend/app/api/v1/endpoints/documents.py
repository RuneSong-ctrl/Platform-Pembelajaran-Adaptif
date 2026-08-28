import uuid
import io
import re
import pypdf
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.document import GroundedDocument
from app.models.classroom import Classroom
from app.schemas.document import DocumentResponse, DocumentCreate
from app.services.vector_store import index_document, remove_document_from_index

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])

def _extract_text_from_file_bytes(filename: str, content: bytes) -> str:
    """Helper to extract clean plain text from PDF or text-based files."""
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        reader = pypdf.PdfReader(io.BytesIO(content))
        text_parts = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_parts.append(page_text.strip())
        return "\n\n".join(text_parts)
    else:
        # Fallback to UTF-8 / latin-1 text decoding for .txt, .md, .csv
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1", errors="ignore")

def _clean_filename_to_title(filename: str) -> str:
    # Remove file extension and replace underscores/dashes with spaces
    base = re.sub(r"\.[a-zA-Z0-9]+$", "", filename)
    clean = re.sub(r"[_\-]+", " ", base).strip()
    return clean.title() if clean else "Modul Pembelajaran"

@router.get("", response_model=List[DocumentResponse])
def get_documents(classroom_id: str = None, db: Session = Depends(get_db)):
    query = db.query(GroundedDocument)
    if classroom_id:
        query = query.filter(GroundedDocument.classroom_id == classroom_id)
    return query.all()

@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extracts text from uploaded PDF/document without saving yet, for preview/editing."""
    try:
        content = await file.read()
        extracted_text = _extract_text_from_file_bytes(file.filename, content)
        suggested_title = _clean_filename_to_title(file.filename)
        return {
            "success": True,
            "filename": file.filename,
            "title": suggested_title,
            "text": extracted_text,
            "length": len(extracted_text),
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Gagal mengekstrak teks dari file '{file.filename}': {str(e)}"
        )

@router.post("/upload-file", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document_file(
    background_tasks: BackgroundTasks,
    classroom_id: str = Form(...),
    title: Optional[str] = Form(None),
    summary: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Directly uploads a PDF/document file, extracts its text, indexes vectors, and saves to database."""
    content = await file.read()
    raw_text = _extract_text_from_file_bytes(file.filename, content)
    
    if not raw_text.strip():
        raise HTTPException(
            status_code=400,
            detail="File tidak memuat teks yang dapat dibaca. Pastikan file PDF bukan hasil scan murni tanpa teks/OCR."
        )
    
    doc_title = title.strip() if (title and title.strip()) else _clean_filename_to_title(file.filename)
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    vector_id = f"vec_{doc_id}_qdrant"
    
    # Auto-index into vector store (Batch accelerated)
    chunks_count = index_document(
        document_id=doc_id,
        classroom_id=classroom_id,
        title=doc_title,
        raw_text=raw_text
    )
    
    doc_summary = summary.strip() if (summary and summary.strip()) else f"Modul ajar: {doc_title} (Sumber: {file.filename})"
    
    new_doc = GroundedDocument(
        id=doc_id,
        classroom_id=classroom_id,
        title=doc_title,
        file_url=f"/uploads/{file.filename}",
        raw_text=raw_text,
        chunks_count=chunks_count or 1,
        vector_id=vector_id,
        status="READY",
        summary=doc_summary
    )
    db.add(new_doc)
    
    # Update classroom count
    cls = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if cls:
        cls.documents_count += 1
        
    db.commit()
    db.refresh(new_doc)

    # Pre-generate classroom-wide adaptive assets in background (Podcast, Mindmap, Infographic)
    def _run_adaptive_assets_bg(doc_id_param: str):
        from app.core.database import SessionLocal
        from app.services.gemini_service import generate_document_adaptive_assets
        try:
            with SessionLocal() as bg_db:
                generate_document_adaptive_assets(doc_id_param, bg_db)
        except Exception as e:
            print(f"[Documents] Background adaptive assets error: {e}")

    background_tasks.add_task(_run_adaptive_assets_bg, new_doc.id)

    return new_doc

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(data: DocumentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    vector_id = f"vec_{doc_id}_qdrant"
    
    # Auto-index into vector store (Batch accelerated)
    chunks_count = index_document(
        document_id=doc_id,
        classroom_id=data.classroom_id,
        title=data.title,
        raw_text=data.raw_text
    )
    
    new_doc = GroundedDocument(
        id=doc_id,
        classroom_id=data.classroom_id,
        title=data.title,
        file_url=data.file_url or "#",
        raw_text=data.raw_text,
        chunks_count=chunks_count or 1,
        vector_id=vector_id,
        status="READY",
        summary=data.summary or f"Ringkasan otomatis AI untuk modul: {data.title}"
    )
    db.add(new_doc)
    
    # Update classroom count
    cls = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
    if cls:
        cls.documents_count += 1
        
    db.commit()
    db.refresh(new_doc)

    # Pre-generate classroom-wide adaptive assets in background
    def _run_adaptive_assets_bg_upload(doc_id_param: str):
        from app.core.database import SessionLocal
        from app.services.gemini_service import generate_document_adaptive_assets
        try:
            with SessionLocal() as bg_db:
                generate_document_adaptive_assets(doc_id_param, bg_db)
        except Exception as e:
            print(f"[Documents] Background adaptive assets error: {e}")

    background_tasks.add_task(_run_adaptive_assets_bg_upload, new_doc.id)

    return new_doc

@router.post("/{document_id}/generate-assets", response_model=DocumentResponse)
def generate_assets_endpoint(document_id: str, db: Session = Depends(get_db)):
    """Menghasilkan atau memperbarui aset materi adaptif kelas (Audio Podcast, Mindmap, Gambar, Flashcard)."""
    from app.services.gemini_service import generate_document_adaptive_assets
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    generate_document_adaptive_assets(document_id, db)
    db.refresh(doc)
    return doc

@router.get("/{document_id}/podcast-audio")
@router.head("/{document_id}/podcast-audio")
def get_podcast_audio(document_id: str, db: Session = Depends(get_db)):
    """Mengalirkan file audio podcast materi edukasi adaptif (MP3/WAV)."""
    import os
    from fastapi.responses import FileResponse
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    # 1. Periksa apakah file audio podcast (.mp3 atau .wav) sudah tersedia di disk
    for ext in ["mp3", "wav"]:
        filepath = os.path.join("uploads", "podcasts", f"{document_id}_podcast.{ext}")
        if os.path.exists(filepath) and os.path.getsize(filepath) > 200:
            media_type = "audio/mpeg" if ext == "mp3" else "audio/wav"
            return FileResponse(filepath, media_type=media_type)
    
    # 2. Jika belum ada, buat langsung on-demand
    from app.services.gemini_service import generate_document_adaptive_assets
    generate_document_adaptive_assets(document_id, db)
    
    for ext in ["mp3", "wav"]:
        filepath = os.path.join("uploads", "podcasts", f"{document_id}_podcast.{ext}")
        if os.path.exists(filepath) and os.path.getsize(filepath) > 200:
            media_type = "audio/mpeg" if ext == "mp3" else "audio/wav"
            return FileResponse(filepath, media_type=media_type)
    
    raise HTTPException(status_code=404, detail="Audio podcast belum selesai dibuat.")

@router.get("/{document_id}/visual-image")
def get_visual_image(document_id: str, db: Session = Depends(get_db)):
    """Mengalirkan gambar ilustrasi materi kelas (PNG) atau SVG ilustrasi visual edukatif bermutu tinggi."""
    import os
    from fastapi.responses import FileResponse, Response
    filepath = os.path.join("uploads", "images", f"{document_id}_visual.png")
    if os.path.exists(filepath) and os.path.getsize(filepath) > 200:
        return FileResponse(filepath, media_type="image/png")
    
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == document_id).first()
    title = doc.title if doc else "Modul Pembelajaran Adaptif"
    clean_title = title.replace("<", "&lt;").replace(">", "&gt;").replace("&", "&amp;")

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0E2820"/>
          <stop offset="50%" stop-color="#1D5E4D"/>
          <stop offset="100%" stop-color="#081A15"/>
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <rect width="1000" height="600" fill="url(#bgGrad)" rx="24"/>
      <g opacity="0.12" stroke="#9DE1CA" stroke-width="1">
        <line x1="150" y1="0" x2="150" y2="600"/>
        <line x1="350" y1="0" x2="350" y2="600"/>
        <line x1="550" y1="0" x2="550" y2="600"/>
        <line x1="750" y1="0" x2="750" y2="600"/>
        <line x1="0" y1="150" x2="1000" y2="150"/>
        <line x1="0" y1="300" x2="1000" y2="300"/>
        <line x1="0" y1="450" x2="1000" y2="450"/>
      </g>
      <rect x="80" y="60" width="840" height="480" rx="30" fill="url(#cardGrad)" stroke="#9DE1CA" stroke-width="2" stroke-opacity="0.35"/>
      <rect x="120" y="100" width="230" height="34" rx="17" fill="#9DE1CA" fill-opacity="0.25"/>
      <text x="235" y="122" fill="#9DE1CA" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="1">EDUADAPT VISUAL STUDIO</text>
      <text x="120" y="185" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="900">{clean_title[:38]}</text>
      <text x="120" y="215" fill="#D1EBE1" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="500">Infografis Konseptual &amp; Pemetaan Visual Kurikulum</text>
      <g transform="translate(680, 260)">
        <circle cx="0" cy="0" r="55" fill="#9DE1CA" fill-opacity="0.25" stroke="#9DE1CA" stroke-width="3" filter="url(#glow)"/>
        <text x="0" y="8" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">INTI</text>
        <circle cx="-110" cy="110" r="42" fill="#E3DBF8" fill-opacity="0.25" stroke="#E3DBF8" stroke-width="2"/>
        <text x="-110" y="116" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">MEKANISME</text>
        <circle cx="110" cy="110" r="42" fill="#FFF4DC" fill-opacity="0.25" stroke="#FFF4DC" stroke-width="2"/>
        <text x="110" y="116" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">APLIKASI</text>
        <line x1="-38" y1="38" x2="-80" y2="80" stroke="#9DE1CA" stroke-width="3" stroke-dasharray="6,6"/>
        <line x1="38" y1="38" x2="80" y2="80" stroke="#9DE1CA" stroke-width="3" stroke-dasharray="6,6"/>
      </g>
      <rect x="120" y="270" width="440" height="70" rx="18" fill="#ffffff" fill-opacity="0.08" stroke="#9DE1CA" stroke-width="1" stroke-opacity="0.25"/>
      <text x="145" y="300" fill="#9DE1CA" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800">🔬 Struktur Konseptual Ter-Grounding</text>
      <text x="145" y="324" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="400">Representasi visual relasi komponen dengan penanda graf terstruktur.</text>
      <rect x="120" y="360" width="440" height="70" rx="18" fill="#ffffff" fill-opacity="0.08" stroke="#9DE1CA" stroke-width="1" stroke-opacity="0.25"/>
      <text x="145" y="390" fill="#9DE1CA" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800">⚡ Dinamika Variabel &amp; Hubungan Kausal</text>
      <text x="145" y="414" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="400">Pemahaman spasial interaktif untuk memperkuat retensi memori jangka panjang.</text>
    </svg>"""
    return Response(content=svg_content, media_type="image/svg+xml")

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    # Remove from vector index
    remove_document_from_index(document_id)
    
    cls = db.query(Classroom).filter(Classroom.id == doc.classroom_id).first()
    if cls and cls.documents_count > 0:
        cls.documents_count -= 1
        
    db.delete(doc)
    db.commit()
    return {"success": True, "message": "Dokumen berhasil dihapus"}
