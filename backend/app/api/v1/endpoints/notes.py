import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import current_user
from app.models.note import ParentTeacherNote
from app.models.user import User
from app.core.scope import visible_classrooms
from app.schemas.schedule import NoteResponse, NoteCreate, NoteReply

router = APIRouter(prefix="/notes", tags=["Parent-Teacher Notes"])

def check_note_pair(sender: User, receiver_id: str, student_id: str, db: Session) -> User:
    """A note must be between a student's parent and a teacher of that student, about that student."""
    student = db.get(User, student_id)
    receiver = db.get(User, receiver_id)
    if not student or student.role != "SISWA" or not receiver:
        raise HTTPException(404, "Penerima atau siswa tidak ditemukan.")
    teacher, parent = (sender, receiver) if sender.role == "GURU" else (receiver, sender)
    teaches = teacher.role == "GURU" and any(student.id in (c.student_ids or []) for c in visible_classrooms(teacher, db))
    is_parent = parent.role == "ORTU" and student.id in (parent.children_ids or [])
    if not (teaches and is_parent):
        raise HTTPException(403, "Catatan hanya bisa dikirim antara guru dan orang tua dari siswa yang bersangkutan.")
    return student

@router.get("", response_model=List[NoteResponse])
def get_notes(user_id: str = None, student_id: str = None, db: Session = Depends(get_db),
              user: User = Depends(current_user)):
    # Only conversations the signed-in user takes part in; user_id is kept for API compatibility.
    query = db.query(ParentTeacherNote).filter(
        (ParentTeacherNote.sender_id == user.id) | (ParentTeacherNote.receiver_id == user.id))
    if student_id:
        query = query.filter(ParentTeacherNote.student_id == student_id)
    return query.order_by(ParentTeacherNote.created_at.desc()).all()

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def send_note(data: NoteCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if user.role not in ("GURU", "ORTU"):
        raise HTTPException(403, "Catatan hanya untuk guru dan orang tua.")
    student = check_note_pair(user, data.receiver_id, data.student_id, db)
    note_id = f"note_{uuid.uuid4().hex[:8]}"
    new_note = ParentTeacherNote(
        id=note_id,
        sender_id=user.id,
        sender_name=user.name,
        sender_role=user.role,
        receiver_id=data.receiver_id,
        student_id=data.student_id,
        student_name=student.name,
        message=data.message,
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.post("/{note_id}/reply", response_model=NoteResponse)
def reply_note(note_id: str, data: NoteReply, db: Session = Depends(get_db), user: User = Depends(current_user)):
    note = db.query(ParentTeacherNote).filter(ParentTeacherNote.id == note_id).first()
    if not note or note.receiver_id != user.id:
        raise HTTPException(status_code=404, detail="Pesan catatan tidak ditemukan")

    note.reply = data.reply
    note.replied_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note
