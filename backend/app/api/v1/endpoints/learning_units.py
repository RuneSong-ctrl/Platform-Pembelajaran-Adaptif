import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import current_user, require_class_access
from app.core.database import get_db
from app.models.classroom import Classroom
from app.models.document import GroundedDocument
from app.models.user import User
from app.services.learning_unit_service import (
    AdaptiveDocument, DraftUpdate, RevisionRequest, discard_draft_image_file, image_is_stale, image_pending,
    run_generation, run_image_generation, validate_infographic, validate_units,
)
from app.services.ai_image_service import image_urls, remove_file
from app.services.practice_service import PracticeProgress, complete_stage, practice_stage_ids, progress_view

router = APIRouter(prefix="/documents", tags=["Learning units"])


def access(document_id, db, user, teacher=False):
    doc = db.get(GroundedDocument, document_id)
    if not doc:
        raise HTTPException(404, "Dokumen tidak ditemukan.")
    require_class_access(db.get(Classroom, doc.classroom_id), user, teacher=teacher)
    return doc


def ensure_record(document_id, db):
    record = db.get(AdaptiveDocument, document_id)
    if not record:
        db.add(AdaptiveDocument(document_id=document_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
        record = db.get(AdaptiveDocument, document_id)
    return record


def metadata(record):
    stale = bool(record and record.generation_state == "PROCESSING" and record.started_at
                 and record.started_at < datetime.utcnow() - timedelta(minutes=30))
    result = {"state": record.generation_state if record else "NOT_GENERATED",
            "error": record.error if record else None,
            "revision": record.revision if record else 0,
            "published_revision": record.published_revision if record else None,
            "approved_at": record.approved_at if record else None,
            "visual": "PUBLISHED" if record and (record.published_infographic or any(unit.get("visual") for unit in record.published_units)) else "NOT_GENERATED",
            "practice": "UNREVIEWED"}
    if stale:
        result.update(state="ERROR", error="Generasi terhenti atau melewati batas 30 menit. Silakan coba ulang.")
    return result


@router.get("/{document_id}/learning-units/status")
def unit_status(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user)
    return metadata(db.get(AdaptiveDocument, document_id))


@router.get("/{document_id}/learning-units/draft")
def get_draft(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user, teacher=True)
    record = db.get(AdaptiveDocument, document_id)
    return {**metadata(record), "units": record.draft_units if record else [],
            "infographic": record.draft_infographic if record else None,
            "image": image_view(record.draft_image if record else None),
            "sources": record.source_segments if record else []}


def image_view(image):
    # An interrupted job (e.g. server restart) would otherwise show "processing" forever.
    if image and image.get("state") == "PROCESSING" and image_is_stale(image):
        return {"state": "ERROR", "error": "Pembuatan gambar terhenti. Coba buat ulang gambar."}
    return image


@router.post("/{document_id}/learning-units/image", status_code=202)
def regenerate_image(document_id: str, background_tasks: BackgroundTasks,
                     db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user, teacher=True)
    record = db.get(AdaptiveDocument, document_id)
    if not record or record.generation_state != "DRAFT" or not record.draft_infographic:
        raise HTTPException(409, "Buat draf dengan infografis terlebih dahulu.")
    if record.draft_image and not image_is_stale(record.draft_image):
        raise HTTPException(409, "Gambar masih dibuat. Silakan tunggu.")
    previous = record.draft_image
    record.draft_image = image_pending()
    db.commit()
    discard_draft_image_file(previous, record.published_image)
    background_tasks.add_task(run_image_generation, document_id, record.generation_token)
    return image_view(record.draft_image)


@router.delete("/{document_id}/learning-units/image")
def remove_image(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user, teacher=True)
    record = db.get(AdaptiveDocument, document_id)
    if not record or not record.draft_image:
        raise HTTPException(404, "Tidak ada gambar pada draf.")
    if record.draft_image.get("state") == "PROCESSING" and not image_is_stale(record.draft_image):
        raise HTTPException(409, "Gambar masih dibuat. Silakan tunggu.")
    previous = record.draft_image
    record.draft_image = None
    db.commit()
    discard_draft_image_file(previous, record.published_image)
    return {"image": None}


def schedule_generation(document_id, db, background_tasks):
    ensure_record(document_id, db)
    token = uuid.uuid4().hex
    # ponytail: in-process background jobs; stale claims are retryable after 30 minutes.
    stale_before = datetime.utcnow() - timedelta(minutes=30)
    updated = db.query(AdaptiveDocument).filter(
        AdaptiveDocument.document_id == document_id,
        or_(AdaptiveDocument.generation_state != "PROCESSING", AdaptiveDocument.started_at < stale_before),
    ).update({"generation_state": "PROCESSING", "error": None,
              "generation_token": token, "started_at": datetime.utcnow()}, synchronize_session=False)
    db.commit()
    if not updated:
        raise HTTPException(409, "Generasi masih berjalan. Silakan tunggu.")
    background_tasks.add_task(run_generation, document_id, token)
    db.expire_all()
    return metadata(db.get(AdaptiveDocument, document_id))


@router.post("/{document_id}/learning-units/generate", status_code=202)
def generate(document_id: str, background_tasks: BackgroundTasks,
             db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user, teacher=True)
    return schedule_generation(document_id, db, background_tasks)


@router.put("/{document_id}/learning-units/draft")
def save_draft(document_id: str, payload: DraftUpdate,
               db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user, teacher=True)
    record = db.get(AdaptiveDocument, document_id)
    if not record:
        raise HTTPException(409, "Buat unit belajar terlebih dahulu.")
    try:
        units = validate_units([unit.model_dump() for unit in payload.units], record.source_segments)
        infographic = validate_infographic(payload.infographic.model_dump() if payload.infographic else None,
                                           record.source_segments)
    except ValueError as exc:
        # Pydantic details are long and English; our own ValueErrors are short Indonesian messages.
        detail = "Isi unit atau kutipan sumber tidak valid." if isinstance(exc, ValidationError) else str(exc)
        raise HTTPException(422, detail)
    changed = db.query(AdaptiveDocument).filter(
        AdaptiveDocument.document_id == document_id, AdaptiveDocument.revision == payload.revision,
        AdaptiveDocument.generation_state != "PROCESSING",
    ).update({"draft_units": units, "draft_infographic": infographic, "revision": payload.revision + 1,
              "generation_state": "DRAFT", "error": None}, synchronize_session=False)
    if not changed:
        db.rollback()
        raise HTTPException(409, "Revisi berubah atau generasi berjalan. Muat ulang draf.")
    db.commit()
    db.expire_all()
    return get_draft(document_id, db, user)


@router.post("/{document_id}/learning-units/approve")
def approve(document_id: str, payload: RevisionRequest,
            db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user, teacher=True)
    record = db.get(AdaptiveDocument, document_id)
    if not record:
        raise HTTPException(409, "Draf belum tersedia.")
    try:
        units = validate_units(record.draft_units, record.source_segments)
        infographic = validate_infographic(record.draft_infographic, record.source_segments)
    except ValueError:
        raise HTTPException(422, "Draf belum valid untuk dipublikasikan.")
    # Only a finished picture is published; one still being drawn is simply not included.
    image = record.draft_image if (record.draft_image or {}).get("state") == "READY" else None
    old_published = record.published_image
    changed = db.query(AdaptiveDocument).filter(
        AdaptiveDocument.document_id == document_id, AdaptiveDocument.revision == payload.revision,
        AdaptiveDocument.generation_state == "DRAFT",
    ).update({"published_units": units, "published_infographic": infographic,
              "published_image": image,
              "published_sources": record.source_segments,
              "published_revision": payload.revision,
              "approved_by": user.id, "approved_at": datetime.utcnow()}, synchronize_session=False)
    if not changed:
        db.rollback()
        raise HTTPException(409, "Revisi berubah. Tinjau kembali sebelum menyetujui.")
    db.commit()
    still_used = set(image_urls(image)) | set(image_urls(record.draft_image))
    for url in image_urls(old_published):
        if url not in still_used:
            remove_file(url)
    db.expire_all()
    return metadata(db.get(AdaptiveDocument, document_id))


@router.get("/{document_id}/learning-units")
def published(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user)
    record = db.get(AdaptiveDocument, document_id)
    # Do not expose draft assessments or answer keys to students.
    units = [{key: value for key, value in unit.items() if key != "comprehension_checks"}
             for unit in (record.published_units if record else [])]
    sources = [{key: value for key, value in source.items() if key != "text"}
               for source in ((record.published_sources or []) if record and units else [])]
    image = record.published_image if record and units else None
    return {**metadata(record), "units": units, "sources": sources,
            "infographic": record.published_infographic if record and units else None,
            # Students get the pictures, never the teacher-facing check report.
            "image": {"state": "READY", "hero_url": image.get("hero_url"), "icons": image.get("icons") or []} if image else None}


class StageDone(BaseModel):
    stage: str = Field(min_length=1, max_length=120)
    xp: int = Field(ge=0, le=30)  # matches MAX_STAGE_XP; larger claims are rejected, not silently trimmed


def published_stages(record) -> list[str]:
    if not record or not record.published_units:
        return []
    return practice_stage_ids(record.published_infographic, record.published_units)


@router.get("/{document_id}/practice-progress")
def get_practice_progress(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    access(document_id, db, user)
    stages = published_stages(db.get(AdaptiveDocument, document_id))
    return progress_view(db.get(PracticeProgress, (user.id, document_id)), stages)


@router.post("/{document_id}/practice-progress")
def finish_practice_stage(document_id: str, payload: StageDone, db: Session = Depends(get_db),
                          user: User = Depends(current_user)):
    access(document_id, db, user)
    if user.role != "SISWA":
        raise HTTPException(403, "Progres misi hanya dicatat untuk siswa.")
    stages = published_stages(db.get(AdaptiveDocument, document_id))
    record = db.get(PracticeProgress, (user.id, document_id))
    if not record:
        record = PracticeProgress(user_id=user.id, document_id=document_id, completed=[])
        db.add(record)
    try:
        # Order is enforced here: a harder stage cannot be recorded before every easier stage.
        complete_stage(record, stages, payload.stage, payload.xp)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(409, str(exc))
    db.commit()
    return progress_view(record, stages)
