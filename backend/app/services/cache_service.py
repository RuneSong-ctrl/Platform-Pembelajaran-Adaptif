import hashlib
import time
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Response Cache: { sha256_hash: { "data": Any, "expires_at": float } }
_RESPONSE_CACHE: Dict[str, Dict[str, Any]] = {}

# Rate Limiter Tracker: { client_key: [timestamp1, timestamp2, ...] }
_RATE_LIMIT_BUCKET: Dict[str, list] = {}

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

def check_rate_limit(client_id: str, limit_per_minute: int = 20):
    """
    Rate limiter sliding window per IP atau User ID untuk mencegah flooding API.
    """
    now = time.time()
    one_minute_ago = now - 60.0
    
    timestamps = _RATE_LIMIT_BUCKET.get(client_id, [])
    # Hapus timestamp yang lebih tua dari 1 menit
    valid_timestamps = [t for t in timestamps if t > one_minute_ago]
    
    if len(valid_timestamps) >= limit_per_minute:
        logger.warning(f"[Security] Rate limit exceeded for client '{client_id}': {len(valid_timestamps)} reqs/min")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Batas kuota interaksi AI terlampaui (Maksimal 20 request/menit). Harap tunggu 1 menit sebelum mengirim pesan kembali."
        )
    
    valid_timestamps.append(now)
    _RATE_LIMIT_BUCKET[client_id] = valid_timestamps
