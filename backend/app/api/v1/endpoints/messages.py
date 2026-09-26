"""Class announcements (teacher -> class) and private teacher <-> student threads, one per student per class."""
import asyncio
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.core.auth import current_user, require_class_access, user_from_ticket
from app.core.database import SessionLocal, get_db
from app.core.scope import visible_classrooms
from app.models.classroom import Classroom
from app.models.message import Announcement, DirectMessage
from app.models.user import User
from app.services import live
from app.services.cache_service import check_rate_limit

router = APIRouter(tags=["Announcements & Messages"])


class TextIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)

    @field_validator("text")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Pesan tidak boleh kosong.")
        return v.strip()


class AnnouncementIn(TextIn):
    classroom_id: str


class MessageIn(TextIn):
    classroom_id: str
    student_id: str | None = None  # teachers and parents name the student; students always write in their own thread
    parent_id: str | None = None   # teachers set it to answer a parent; parents always write in their own thread


def announcement_view(a: Announcement) -> dict:
    return {"id": a.id, "classroom_id": a.classroom_id, "author_name": a.author_name, "text": a.text,
            "created_at": a.created_at}


def message_view(m: DirectMessage, me: User) -> dict:
    return {"id": m.id, "sender_name": m.sender_name, "text": m.text, "created_at": m.created_at,
            "mine": m.sender_id == me.id, "read": m.read_at is not None}


def thread_access(classroom_id: str, student_id: str | None, parent_id: str | None, user: User,
                  db: Session) -> tuple[Classroom, str, str | None]:
    """Who may open a thread: the class teacher, the enrolled student (own thread only), or a linked parent
    (own thread about their own child only). Returns (class, student_id, parent_id)."""
    cls = db.get(Classroom, classroom_id)
    if not cls:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    if user.role == "SISWA":
        require_class_access(cls, user)
        return cls, user.id, None
    enrolled = student_id is not None and student_id in (cls.student_ids or [])
    if user.role == "ORTU":
        if not enrolled or student_id not in (user.children_ids or []):
            raise HTTPException(403, "Anda tidak memiliki akses ke percakapan ini.")
        return cls, student_id, user.id
    require_class_access(cls, user, teacher=True)
    if not enrolled:
        raise HTTPException(404, "Siswa tidak terdaftar di kelas ini.")
    if parent_id:
        parent = db.get(User, parent_id)
        if not parent or parent.role != "ORTU" or student_id not in (parent.children_ids or []):
            raise HTTPException(404, "Orang tua siswa ini tidak ditemukan.")
    return cls, student_id, parent_id or None


def thread_filter(q, classroom_id: str, student_id: str, parent_id: str | None):
    q = q.filter(DirectMessage.classroom_id == classroom_id, DirectMessage.student_id == student_id)
    return q.filter(DirectMessage.parent_id == parent_id) if parent_id else q.filter(DirectMessage.parent_id.is_(None))


# --- Announcements ---

@router.get("/announcements")
def list_announcements(classroom_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    # Teacher: own classes. Student: joined classes. Parent: their children's classes (read only).
    ids = {c.id for c in visible_classrooms(user, db)}
    if classroom_id:
        ids &= {classroom_id}
    if not ids:
        return []
    rows = (db.query(Announcement).filter(Announcement.classroom_id.in_(ids))
            .order_by(Announcement.created_at.desc()).limit(50).all())
    return [announcement_view(a) for a in rows]


@router.post("/announcements", status_code=201)
def create_announcement(data: AnnouncementIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    require_class_access(db.get(Classroom, data.classroom_id), user, teacher=True)
    check_rate_limit(f"announce_{user.id}", limit_per_minute=10, detail="Terlalu banyak pesan dalam satu menit. Tunggu sebentar lalu coba lagi.")
    a = Announcement(id=f"ann_{uuid.uuid4().hex[:12]}", classroom_id=data.classroom_id, author_id=user.id,
                     author_name=user.name, text=data.text)
    db.add(a)
    db.commit()
    cls = db.get(Classroom, data.classroom_id)
    live.notify([*(cls.student_ids or []), cls.teacher_id], {"type": "announcement", "classroom_id": cls.id})
    return announcement_view(a)


@router.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    a = db.get(Announcement, announcement_id)
    if not a:
        raise HTTPException(404, "Pengumuman tidak ditemukan.")
    require_class_access(db.get(Classroom, a.classroom_id), user, teacher=True)
    db.delete(a)
    db.commit()
    return {"deleted": True}


# --- Private messages ---

@router.get("/messages/threads")
def list_threads(db: Session = Depends(get_db), user: User = Depends(current_user)):
    """Inbox: one row per thread with the last message and how many incoming messages are unread."""
    classes = {c.id: c for c in visible_classrooms(user, db)}
    if not classes:
        return []
    q = db.query(DirectMessage).filter(DirectMessage.classroom_id.in_(classes))
    if user.role == "SISWA":
        q = q.filter(DirectMessage.student_id == user.id, DirectMessage.parent_id.is_(None))
    elif user.role == "ORTU":
        q = q.filter(DirectMessage.parent_id == user.id)
    rows = q.order_by(DirectMessage.created_at.asc()).all()
    people = {u.id: u for u in db.query(User).filter(User.id.in_(
        {m.student_id for m in rows} | {m.parent_id for m in rows if m.parent_id}))} if rows else {}
    threads: dict[tuple, dict] = {}
    for m in rows:
        cls, parent = classes[m.classroom_id], people.get(m.parent_id)
        # Closed threads: the student left the class, or the parent is no longer linked to the child.
        if m.student_id not in (cls.student_ids or []):
            continue
        if m.parent_id and (not parent or m.student_id not in (parent.children_ids or [])):
            continue
        t = threads.setdefault((m.classroom_id, m.student_id, m.parent_id), {
            "classroom_id": m.classroom_id, "classroom_name": cls.name, "teacher_name": cls.teacher_name,
            "student_id": m.student_id, "student_name": getattr(people.get(m.student_id), "name", "Siswa"),
            "parent_id": m.parent_id, "parent_name": parent.name if parent else None, "unread": 0})
        if m.sender_id != user.id and m.read_at is None:
            t["unread"] += 1
        t["last_text"], t["last_at"] = m.text, m.created_at
    return sorted(threads.values(), key=lambda t: t["last_at"], reverse=True)


@router.get("/messages")
def get_thread(classroom_id: str, student_id: str | None = None, parent_id: str | None = None,
               db: Session = Depends(get_db), user: User = Depends(current_user)):
    _, sid, pid = thread_access(classroom_id, student_id, parent_id, user, db)
    rows = (thread_filter(db.query(DirectMessage), classroom_id, sid, pid)
            .order_by(DirectMessage.created_at.asc()).limit(500).all())
    now = datetime.utcnow()
    for m in rows:
        if m.sender_id != user.id and m.read_at is None:
            m.read_at = now
    db.commit()
    return [message_view(m, user) for m in rows]


@router.post("/messages", status_code=201)
def send_message(data: MessageIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cls, sid, pid = thread_access(data.classroom_id, data.student_id, data.parent_id, user, db)
    check_rate_limit(f"dm_{user.id}", limit_per_minute=30, detail="Terlalu banyak pesan dalam satu menit. Tunggu sebentar lalu coba lagi.")
    m = DirectMessage(id=f"dm_{uuid.uuid4().hex[:12]}", classroom_id=data.classroom_id, student_id=sid,
                      parent_id=pid, sender_id=user.id, sender_name=user.name, text=data.text)
    db.add(m)
    db.commit()
    live.notify([pid or sid, cls.teacher_id],
                {"type": "message", "classroom_id": cls.id, "student_id": sid, "parent_id": pid})
    return message_view(m, user)


@router.get("/messages/stream")
async def stream_events(request: Request, t: str):
    """Push channel for the signed-in user. EventSource cannot send headers, so it passes a media ticket as ?t=."""
    # Resolve the user with a short-lived session so an open stream never holds a DB connection.
    with SessionLocal() as db:
        user_id = user_from_ticket(t, db).id
    sub = live.subscribe(user_id)

    async def events():
        try:
            yield "retry: 3000\n\n"
            while not await request.is_disconnected():
                try:
                    event = await asyncio.wait_for(sub[1].get(), timeout=20)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"  # keeps proxies from closing an idle connection
        finally:
            live.unsubscribe(user_id, sub)

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
