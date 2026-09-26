import hashlib
import time
import hmac
import secrets
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import Session

from app.core.database import Base, get_db
from app.models.user import User


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    token_hash = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)


def hash_password(password: str) -> str:
    if not 10 <= len(password) <= 128:
        raise ValueError("Password harus terdiri dari 10–128 karakter.")
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored or not 10 <= len(password) <= 128:
        return False
    try:
        algorithm, salt, expected = stored.split("$")
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1)
        return hmac.compare_digest(actual, bytes.fromhex(expected))
    except (ValueError, TypeError):
        return False


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(user: User, db: Session) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AuthSession(token_hash=token_hash(token), user_id=user.id,
                       expires_at=datetime.utcnow() + timedelta(hours=12)))
    db.commit()
    return token


bearer = HTTPBearer(auto_error=False)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
                 db: Session = Depends(get_db)) -> User:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Silakan masuk kembali.")
    session = db.get(AuthSession, token_hash(credentials.credentials))
    if not session or session.expires_at <= datetime.utcnow():
        raise HTTPException(401, "Sesi berakhir. Silakan masuk kembali.")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(401, "Sesi tidak valid.")
    return user


MEDIA_TICKET_TTL = 2 * 60 * 60


def _ticket_sig(payload: str) -> str:
    from app.core.config import settings
    return hmac.new(settings.SECRET_KEY.encode(), f"media:{payload}".encode(), hashlib.sha256).hexdigest()[:40]


def make_media_ticket(user: User) -> str:
    """Read-only pass for URLs (<img>, <audio>, PDF links, EventSource), which cannot send headers.
    It is not a session: it cannot call the API, and it expires on its own."""
    payload = f"{user.id}.{int(time.time()) + MEDIA_TICKET_TTL}"
    return f"{payload}.{_ticket_sig(payload)}"


def user_from_ticket(ticket: str, db: Session) -> User:
    payload, _, sig = ticket.rpartition(".")
    user_id, _, exp = payload.rpartition(".")
    if not (sig and exp.isdigit() and hmac.compare_digest(sig, _ticket_sig(payload)) and int(exp) > time.time()):
        raise HTTPException(401, "Tautan media kedaluwarsa. Muat ulang halaman.")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(401, "Sesi tidak valid.")
    return user


def media_user(t: str | None = None, credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
               db: Session = Depends(get_db)) -> User:
    """Media GETs accept the normal Bearer header, or ?t=<media ticket> for plain links. Never a session token."""
    if credentials:
        return current_user(credentials, db)
    if t:
        return user_from_ticket(t, db)
    raise HTTPException(401, "Silakan masuk kembali.")


def require_class_access(classroom, user: User, *, teacher: bool = False):
    if not classroom:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    owner = user.role == "GURU" and classroom.teacher_id == user.id
    member = user.role == "SISWA" and user.id in (classroom.student_ids or [])
    if not owner and (teacher or not member):
        raise HTTPException(403, "Anda tidak memiliki akses ke kelas ini.")
