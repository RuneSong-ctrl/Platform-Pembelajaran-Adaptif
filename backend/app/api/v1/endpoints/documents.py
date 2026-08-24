import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.document import GroundedDocument
from app.models.classroom import Classroom
from app.schemas.document import DocumentResponse, DocumentCreate
from app.services.vector_store import index_document, remove_document_from_index

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])

@router.get("", response_model=List[DocumentResponse])
def get_documents(classroom_id: str = None, db: Session = Depends(get_db)):
    query = db.query(GroundedDocument)
    if classroom_id:
        query = query.filter(GroundedDocument.classroom_id == classroom_id)
    return query.all()

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
