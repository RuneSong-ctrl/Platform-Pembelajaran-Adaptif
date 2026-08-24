import uuid
import io
import re
import pypdf
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
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
    
    # Auto-index into vector store
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
    return new_doc

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(data: DocumentCreate, db: Session = Depends(get_db)):
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    vector_id = f"vec_{doc_id}_qdrant"
    
    # Auto-index into vector store
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
    return new_doc

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
