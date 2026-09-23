import os
import uuid
import io
import re
import pypdf
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.config import settings
from app.core.database import get_db
from app.models.document import GroundedDocument
from app.models.classroom import Classroom
from app.models.user import User
from app.core.auth import current_user, media_user, require_class_access
from app.core.scope import visible_classroom_ids
from app.services.learning_unit_service import AdaptiveDocument, extract_segments, make_segments, MAX_FILE_BYTES
from app.api.v1.endpoints.learning_units import access, schedule_generation
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

def _build_pdf_from_text(title: str, text: str, doc_id: str) -> str:
    """Builds a formatted PDF document on disk using reportlab and returns the relative /uploads/ path."""
    uploads_dir = settings.UPLOADS_DIR
    os.makedirs(uploads_dir, exist_ok=True)
    
    clean_title = re.sub(r"[^a-zA-Z0-9_-]", "_", title)[:30]
    safe_filename = f"{doc_id}_{clean_title}.pdf"
    target_path = os.path.join(uploads_dir, safe_filename)
    
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        doc_pdf = SimpleDocTemplate(
            target_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#25134A'),
            spaceAfter=10,
        )
        meta_style = ParagraphStyle(
            'DocMeta',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#5A5E70'),
            spaceAfter=12,
        )
        body_style = ParagraphStyle(
            'DocBody',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#1C1E26'),
            spaceAfter=8,
        )

        story = [
            Paragraph(f"<b>{title}</b>", title_style),
            Paragraph("<i>Modul Pembelajaran Kurikulum Terintegrasi &bull; Platform EduAdapt</i>", meta_style),
            HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E3DBF8'), spaceAfter=14),
        ]
        
        for line in (text or "Materi Belajar").split("\n"):
            line_str = line.strip()
            if not line_str:
                story.append(Spacer(1, 6))
                continue
            sanitized = line_str.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(sanitized, body_style))

        doc_pdf.build(story)
        return f"/uploads/{safe_filename}"
    except Exception as e:
        print(f"[Documents] PDF build error: {e}")
        return f"/uploads/{safe_filename}"

@router.get("", response_model=List[DocumentResponse])
def get_documents(classroom_id: str = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    allowed = visible_classroom_ids(user, db)
    if classroom_id:
        allowed &= {classroom_id}
    if not allowed:
        return []
    return db.query(GroundedDocument).filter(GroundedDocument.classroom_id.in_(allowed)).all()

@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...), user: User = Depends(current_user)):
    """Extracts text from uploaded PDF/document without saving yet, for preview/editing."""
    if user.role != "GURU":
        raise HTTPException(403, "Hanya guru yang dapat mengunggah materi.")
    content = await file.read(MAX_FILE_BYTES + 1)
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(413, "File melebihi batas 20 MB.")
    try:
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
    user: User = Depends(current_user),
):
    """Directly uploads a PDF/document file, extracts its text, indexes vectors, and saves to database."""
    require_class_access(db.get(Classroom, classroom_id), user, teacher=True)
    content = await file.read(MAX_FILE_BYTES + 1)
    try:
        sources = extract_segments(file.filename or "document.txt", content)
    except Exception as exc:
        raise HTTPException(422, "File tidak terbaca atau melebihi batas. Gunakan PDF berteks/TXT, maksimal 20 MB dan 160.000 karakter.") from exc
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
    
    # Save uploaded physical file to disk
    uploads_dir = settings.UPLOADS_DIR
    os.makedirs(uploads_dir, exist_ok=True)
    clean_fn = re.sub(r"[^a-zA-Z0-9._-]", "_", file.filename)
    safe_filename = f"{doc_id}_{clean_fn}"
    file_path = os.path.join(uploads_dir, safe_filename)
    with open(file_path, "wb") as f_out:
        f_out.write(content)

    new_doc = GroundedDocument(
        id=doc_id,
        classroom_id=classroom_id,
        title=doc_title,
        file_url=f"/uploads/{safe_filename}",
        raw_text=raw_text,
        chunks_count=chunks_count or 1,
        vector_id=vector_id,
        status="READY",
        summary=doc_summary
    )
    db.add(new_doc)
    # Saved in the same commit as the document, so a failure never leaves a half-created module.
    db.add(AdaptiveDocument(document_id=doc_id, source_segments=sources))

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

    # Background tasks run in order: the quick learning-unit draft first, then the slow podcast/TTS.
    schedule_generation(new_doc.id, db, background_tasks)
    background_tasks.add_task(_run_adaptive_assets_bg, new_doc.id)

    return new_doc

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(data: DocumentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: User = Depends(current_user)):
    require_class_access(db.get(Classroom, data.classroom_id), user, teacher=True)
    try:
        sources = make_segments([(None, data.raw_text)])
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    vector_id = f"vec_{doc_id}_qdrant"
    
    # Auto-index into vector store (Batch accelerated)
    chunks_count = index_document(
        document_id=doc_id,
        classroom_id=data.classroom_id,
        title=data.title,
        raw_text=data.raw_text
    )
    
    # Ensure physical PDF exists on disk
    file_url = data.file_url
    if not file_url or file_url == "#" or not file_url.endswith(".pdf"):
        file_url = _build_pdf_from_text(data.title, data.raw_text, doc_id)

    new_doc = GroundedDocument(
        id=doc_id,
        classroom_id=data.classroom_id,
        title=data.title,
        file_url=file_url or f"/uploads/{doc_id}.pdf",
        raw_text=data.raw_text,
        chunks_count=chunks_count or 1,
        vector_id=vector_id,
        status="READY",
        summary=data.summary or f"Ringkasan otomatis AI untuk modul: {data.title}"
    )
    db.add(new_doc)
    db.add(AdaptiveDocument(document_id=doc_id, source_segments=sources))

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

    schedule_generation(new_doc.id, db, background_tasks)
    background_tasks.add_task(_run_adaptive_assets_bg_upload, new_doc.id)

    return new_doc

@router.get("/{document_id}/pdf")
@router.head("/{document_id}/pdf")
def get_document_pdf(document_id: str, db: Session = Depends(get_db), user: User = Depends(media_user)):
    """Menyajikan file dokumen PDF modul pembelajaran. Menjamin selalu tersedia (auto-build jika belum ada)."""
    doc = access(document_id, db, user)
    
    # Check if doc.file_url exists on disk
    if doc.file_url and doc.file_url not in ("#", "None"):
        filename = doc.file_url.replace("/uploads/", "").lstrip("/")
        cand_path = os.path.join(settings.UPLOADS_DIR, filename)
        if os.path.exists(cand_path) and os.path.getsize(cand_path) > 100:
            clean_fn = f"{re.sub(r'[^a-zA-Z0-9_-]', '_', doc.title)[:30]}.pdf"
            return FileResponse(cand_path, media_type="application/pdf", filename=clean_fn)
            
    # Auto-generate PDF on the fly if missing from disk
    safe_rel_path = _build_pdf_from_text(doc.title, doc.raw_text or doc.summary, doc.id)
    doc.file_url = safe_rel_path
    db.commit()
    
    full_path = os.path.join(settings.UPLOADS_DIR, safe_rel_path.replace("/uploads/", "").lstrip("/"))
    clean_fn = f"{re.sub(r'[^a-zA-Z0-9_-]', '_', doc.title)[:30]}.pdf"
    return FileResponse(full_path, media_type="application/pdf", filename=clean_fn)

@router.post("/{document_id}/generate-assets", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
def generate_assets_endpoint(document_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db),
                             user: User = Depends(current_user)):
    """Menyiapkan aset yang belum ada (podcast, aktivitas kinestetik) di latar belakang; aset yang sudah ada dilewati."""
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")

    require_class_access(db.get(Classroom, doc.classroom_id), user, teacher=True)

    # Runs outside the request so long AI/TTS work never holds this request's connection.
    def _run(doc_id_param: str):
        from app.core.database import SessionLocal
        from app.services.gemini_service import generate_document_adaptive_assets
        try:
            with SessionLocal() as bg_db:
                generate_document_adaptive_assets(doc_id_param, bg_db)
        except Exception as e:
            print(f"[Documents] Background adaptive assets error: {e}")

    background_tasks.add_task(_run, document_id)
    return doc

@router.get("/{document_id}/podcast-audio")
@router.head("/{document_id}/podcast-audio")
def get_podcast_audio(document_id: str, episode: int = 1, db: Session = Depends(get_db), user: User = Depends(media_user)):
    """Mengalirkan file audio podcast materi edukasi adaptif per episode (MP3/WAV)."""
    access(document_id, db, user)
    
    # 1. Periksa apakah file audio episode spesifik sudah tersedia di disk
    candidate_filenames = [
        f"{document_id}_ep{episode}.wav",
        f"{document_id}_ep{episode}.mp3",
        f"{document_id}_podcast.wav",
        f"{document_id}_podcast.mp3"
    ]
    for fn in candidate_filenames:
        filepath = os.path.join(settings.UPLOADS_DIR, "podcasts", fn)
        if os.path.exists(filepath) and os.path.getsize(filepath) > 200:
            media_type = "audio/wav" if fn.endswith(".wav") else "audio/mpeg"
            return FileResponse(filepath, media_type=media_type)
    
    # 2. Jika belum ada, buat langsung on-demand
    from app.services.gemini_service import generate_document_adaptive_assets
    generate_document_adaptive_assets(document_id, db)
    
    for fn in candidate_filenames:
        filepath = os.path.join(settings.UPLOADS_DIR, "podcasts", fn)
        if os.path.exists(filepath) and os.path.getsize(filepath) > 200:
            media_type = "audio/mpeg" if fn.endswith(".mp3") else "audio/wav"
            return FileResponse(filepath, media_type=media_type)
    
    raise HTTPException(status_code=404, detail="Audio podcast episode belum selesai dibuat.")

@router.get("/{document_id}/podcast-episodes")
def get_podcast_episodes(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Mengambil metadata playlist episode podcast (judul, durasi, audioUrl) untuk materi ini."""
    import json
    doc = access(document_id, db, user)
    
    if not doc.podcast_episodes_json:
        from app.services.gemini_service import generate_document_adaptive_assets
        generate_document_adaptive_assets(document_id, db)
        db.refresh(doc)
    
    if doc.podcast_episodes_json:
        try:
            return json.loads(doc.podcast_episodes_json)
        except Exception:
            pass
    
    return [
        {
            "id": "ep_1",
            "order": 1,
            "title": f"Episode 1: Fondasi {doc.title}",
            "description": f"Ringkasan materi dasar {doc.title}.",
            "durationSec": 45,
            "audioUrl": f"/api/v1/documents/{doc.id}/podcast-audio?episode=1",
            "script": doc.podcast_script or doc.summary or "Ringkasan materi."
        }
    ]

@router.get("/{document_id}/infographic")
@router.get("/{document_id}/visual-image")
def get_unreviewed_visual(document_id: str, db: Session = Depends(get_db), user: User = Depends(media_user)):
    access(document_id, db, user)
    raise HTTPException(409, "Visual lama belum terverifikasi. Gunakan unit belajar yang disetujui guru.")


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    
    require_class_access(db.get(Classroom, doc.classroom_id), user, teacher=True)
    adaptive = db.get(AdaptiveDocument, document_id)
    if adaptive:
        from app.services.ai_image_service import remove_files
        remove_files(adaptive.draft_image)
        remove_files(adaptive.published_image)
    from app.services.practice_service import PracticeProgress
    db.query(PracticeProgress).filter(PracticeProgress.document_id == document_id).delete()
    db.query(AdaptiveDocument).filter(AdaptiveDocument.document_id == document_id).delete()
    # Remove from vector index
    remove_document_from_index(document_id)
    
    cls = db.query(Classroom).filter(Classroom.id == doc.classroom_id).first()
    if cls and cls.documents_count > 0:
        cls.documents_count -= 1
        
    db.delete(doc)
    db.commit()
    return {"success": True, "message": "Dokumen berhasil dihapus"}
