import hashlib
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


def media_user(token: str | None = None, credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
               db: Session = Depends(get_db)) -> User:
    """<audio>, <img> and PDF links cannot send headers, so media GETs also accept ?token=."""
    # ponytail: the session token then shows up in URLs/logs; switch to short-lived signed URLs if that matters.
    if not credentials and token:
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    return current_user(credentials, db)


def require_class_access(classroom, user: User, *, teacher: bool = False):
    if not classroom:
        raise HTTPException(404, "Kelas tidak ditemukan.")
    owner = user.role == "GURU" and classroom.teacher_id == user.id
    member = user.role == "SISWA" and user.id in (classroom.student_ids or [])
    if not owner and (teacher or not member):
        raise HTTPException(403, "Anda tidak memiliki akses ke kelas ini.")
