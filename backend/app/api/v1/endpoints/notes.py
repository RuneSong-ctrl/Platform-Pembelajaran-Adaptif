import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.note import ParentTeacherNote
from app.schemas.schedule import NoteResponse, NoteCreate, NoteReply

router = APIRouter(prefix="/notes", tags=["Parent-Teacher Notes"])

@router.get("", response_model=List[NoteResponse])
def get_notes(user_id: str = None, student_id: str = None, db: Session = Depends(get_db)):
    query = db.query(ParentTeacherNote)
    if user_id:
        query = query.filter((ParentTeacherNote.sender_id == user_id) | (ParentTeacherNote.receiver_id == user_id))
    if student_id:
        query = query.filter(ParentTeacherNote.student_id == student_id)
    return query.order_by(ParentTeacherNote.created_at.desc()).all()

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def send_note(data: NoteCreate, db: Session = Depends(get_db)):
    note_id = f"note_{uuid.uuid4().hex[:8]}"
    new_note = ParentTeacherNote(
        id=note_id,
        sender_id=data.sender_id,
        sender_name=data.sender_name,
        sender_role=data.sender_role,
        receiver_id=data.receiver_id,
        student_id=data.student_id,
        student_name=data.student_name,
        message=data.message,
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.post("/{note_id}/reply", response_model=NoteResponse)
def reply_note(note_id: str, data: NoteReply, db: Session = Depends(get_db)):
    note = db.query(ParentTeacherNote).filter(ParentTeacherNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Pesan catatan tidak ditemukan")
        
    note.reply = data.reply
    note.replied_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note
