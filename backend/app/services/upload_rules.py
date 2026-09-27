"""Files attached to tasks by teachers and to submissions by students.

Only documents a class actually needs are accepted, and the file's first bytes must match its extension,
so a renamed executable or HTML page cannot be stored as "tugas.pdf".
"""
import os
import re
import shutil
import uuid
from pathlib import Path
from typing import List

from fastapi import HTTPException, UploadFile

from app.core.config import settings

MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_FILES = 5

_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
ALLOWED = {
    ".pdf": ("application/pdf", (b"%PDF",)),
    ".png": ("image/png", (b"\x89PNG\r\n\x1a\n",)),
    ".jpg": ("image/jpeg", (b"\xff\xd8\xff",)),
    ".jpeg": ("image/jpeg", (b"\xff\xd8\xff",)),
    ".webp": ("image/webp", (b"RIFF",)),
    ".docx": (_DOCX, (b"PK\x03\x04",)),
}


def safe_name(name: str) -> str:
    base = os.path.basename((name or "").replace("\\", "/"))
    base = re.sub(r"[^A-Za-z0-9._ -]+", "_", base).strip(" .")
    return (base or "file")[-120:]


def read_files(files: List[UploadFile], already: int = 0) -> List[tuple]:
    """Validates uploads and returns (name, mime, bytes). `already` counts files kept from before."""
    files = [f for f in files if f and f.filename]
    if len(files) + already > MAX_FILES:
        raise HTTPException(400, f"Maksimal {MAX_FILES} file.")
    out = []
    for f in files:
        name = safe_name(f.filename)
        ext = os.path.splitext(name)[1].lower()
        if ext not in ALLOWED:
            raise HTTPException(400, f"{name}: hanya PDF, JPG, PNG, WEBP, atau DOCX yang diterima.")
        data = f.file.read(MAX_FILE_BYTES + 1)
        if not data:
            raise HTTPException(400, f"{name}: file kosong.")
        if len(data) > MAX_FILE_BYTES:
            raise HTTPException(400, f"{name}: ukuran melebihi 10 MB.")
        mime, signatures = ALLOWED[ext]
        if not any(data.startswith(s) for s in signatures) or (ext == ".webp" and data[8:12] != b"WEBP"):
            raise HTTPException(400, f"{name}: isi file tidak sesuai jenisnya.")
        out.append((name, mime, data))
    return out


def _folder(rel: str) -> Path:
    return Path(settings.UPLOADS_DIR) / rel


def store(rel_folder: str, files: List[tuple]) -> List[dict]:
    """Saves validated files under uploads/<rel_folder>/ and returns their descriptors."""
    folder = _folder(rel_folder)
    folder.mkdir(parents=True, exist_ok=True)
    stored = []
    for name, mime, data in files:
        file_id = f"f{uuid.uuid4().hex[:10]}"
        (folder / f"{file_id}_{name}").write_bytes(data)
        stored.append({"id": file_id, "name": name, "size": len(data), "mime": mime,
                       "path": f"/uploads/{rel_folder}/{file_id}_{name}"})
    return stored


def remove(rel_folder: str, descriptor: dict) -> None:
    (_folder(rel_folder) / f"{descriptor['id']}_{descriptor['name']}").unlink(missing_ok=True)


def remove_folder(rel_folder: str) -> None:
    shutil.rmtree(_folder(rel_folder), ignore_errors=True)
