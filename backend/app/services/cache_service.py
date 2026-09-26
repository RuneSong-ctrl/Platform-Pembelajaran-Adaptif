import hashlib
import time
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.database import Base
from sqlalchemy import Column, Float, Integer, String

logger = logging.getLogger(__name__)

# Response Cache: { sha256_hash: { "data": Any, "expires_at": float } }
_RESPONSE_CACHE: Dict[str, Dict[str, Any]] = {}

# Rate Limiter Tracker: { client_key: [timestamp1, timestamp2, ...] }

def get_cache_key(*args) -> str:
    """
    Menghasilkan hash deterministik SHA-256 dari parameter query.
    """
    raw = "|".join(str(a) for a in args)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def get_cached_response(cache_key: str) -> Optional[Any]:
    """
    Mengambil respons dari cache memori jika belum kedaluwarsa.
    """
    entry = _RESPONSE_CACHE.get(cache_key)
    if not entry:
        return None
    
    if time.time() > entry["expires_at"]:
        del _RESPONSE_CACHE[cache_key]
        return None
    
    logger.info(f"[Cache] HIT for key {cache_key[:8]}... Saved 1 AI call!")
    return entry["data"]

def set_cached_response(cache_key: str, data: Any, ttl_seconds: int = 86400):
    """
    Menyimpan respons AI ke cache memori dengan TTL tertentu.
    """
    _RESPONSE_CACHE[cache_key] = {
        "data": data,
        "expires_at": time.time() + ttl_seconds
    }

class RateHit(Base):
    """One counted request. Kept in the database so limits hold across restarts and worker processes."""
    __tablename__ = "rate_hits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(160), nullable=False, index=True)
    ts = Column(Float, nullable=False, index=True)


def check_rate_limit(client_id: str, limit_per_minute: int = 20, detail: str | None = None):
    """Sliding one-minute window per key (user, account or address)."""
    from app.core.database import SessionLocal

    now = time.time()
    with SessionLocal() as db:
        db.query(RateHit).filter(RateHit.ts < now - 60).delete()  # old hits are never needed again
        used = db.query(RateHit).filter(RateHit.key == client_id).count()
        if used < limit_per_minute:
            db.add(RateHit(key=client_id, ts=now))
        db.commit()

    if used >= limit_per_minute:
        logger.warning(f"[Security] Rate limit exceeded for client '{client_id}': {used} reqs/min")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail or "Batas kuota interaksi AI terlampaui (Maksimal 20 request/menit). Harap tunggu 1 menit sebelum mengirim pesan kembali."
        )
