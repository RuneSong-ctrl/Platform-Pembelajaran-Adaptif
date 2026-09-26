from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.config import settings
from app.core.auth import current_user, require_class_access
from app.core.scope import visible_classroom_ids, visible_student_ids
from app.models.credential import BlockchainCredential
from app.models.user import User
from app.models.classroom import Classroom
from app.models.task import GroundedTask, QuizAttempt
from app.api.v1.endpoints.tasks import MAX_QUIZ_ATTEMPTS
from app.models.submission import AssignmentSubmission
import uuid
from datetime import datetime
from app.schemas.credential import (
    CredentialResponse,
    CredentialMintRequest,
    CredentialClaimRequest,
    CredentialVerifyResponse,
)
from app.services.blockchain_service import append_block, verify_credential_integrity

PASSING_SCORE = 50

router = APIRouter(prefix="/credentials", tags=["Blockchain Vault"])

@router.get("", response_model=List[CredentialResponse])
def get_all_credentials(student_id: str = None, db: Session = Depends(get_db), actor: User = Depends(current_user)):
    query = db.query(BlockchainCredential)
    if actor.role == "GURU":
        classes = visible_classroom_ids(actor, db)
        if not classes:
            return []
        query = query.filter(BlockchainCredential.classroom_id.in_(classes))
    else:
        students = visible_student_ids(actor, db)
        if not students:
            return []
        query = query.filter(BlockchainCredential.student_id.in_(students))
    if student_id:
        query = query.filter(BlockchainCredential.student_id == student_id)
    return query.order_by(BlockchainCredential.block_index.asc()).all()

@router.post("/mint", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
def mint_blockchain_credential(data: CredentialMintRequest, db: Session = Depends(get_db),
                               actor: User = Depends(current_user)):
    """Teacher-issued credential (the teacher attests the score)."""
    cls = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
    require_class_access(cls, actor, teacher=True)
    user = db.query(User).filter(User.id == data.student_id).first()
    if not user or user.id not in (cls.student_ids or []):
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan di kelas ini")
    if not 0 <= data.score <= 100:
        raise HTTPException(status_code=400, detail="Nilai harus di antara 0 dan 100.")
    return append_block(db, student=user, classroom=cls, competency_title=data.competency_title, score=data.score)

@router.post("/claim", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
def claim_quiz_credential(data: CredentialClaimRequest, db: Session = Depends(get_db),
                          actor: User = Depends(current_user)):
    """Student earns a credential for a quiz. The score is graded here from the answers, never taken from the client."""
    if actor.role != "SISWA":
        raise HTTPException(403, "Hanya siswa yang dapat mengklaim sertifikat kuis.")
    task = db.get(GroundedTask, data.task_id)
    if not task or task.type != "quiz":
        raise HTTPException(404, "Kuis tidak ditemukan.")
    cls = db.get(Classroom, task.classroom_id)
    require_class_access(cls, actor)

    questions = {q.get("id"): q for q in (task.content_json or {}).get("questions", []) if q.get("id")}
    if not questions:
        raise HTTPException(400, "Kuis ini belum memiliki soal.")
    # Answers already checked through /tasks/{id}/answer are final; the client cannot swap them afterwards.
    attempt = db.get(QuizAttempt, (actor.id, task.id)) or QuizAttempt(student_id=actor.id, task_id=task.id, answers={}, finished=0)
    if (attempt.finished or 0) >= MAX_QUIZ_ATTEMPTS:
        raise HTTPException(409, f"Kamu sudah mengerjakan kuis ini {MAX_QUIZ_ATTEMPTS} kali.")
    locked = {q: v for q, v in (attempt.answers or {}).items() if q in questions}
    # Grading closes this attempt: answers reset for a retake, and the attempt is counted.
    attempt.answers, attempt.finished = {}, (attempt.finished or 0) + 1
    db.merge(attempt)
    if any(a.question_id not in questions for a in data.answers):
        raise HTTPException(400, "Ada jawaban untuk soal yang tidak ada di kuis ini.")
    # One answer per question (first wins), locked-in answers override whatever the client sends.
    answers = {}
    for a in data.answers:
        answers.setdefault(a.question_id, a.selected_index)
    answers.update(locked)
    if len(answers) < min(4, len(questions)):
        raise HTTPException(400, "Jawaban belum lengkap.")

    key = lambda qid: questions[qid].get("correctIndex", questions[qid].get("correct_index"))
    correct = sum(1 for qid, chosen in answers.items() if chosen is not None and chosen == key(qid))
    score = round(correct / len(answers) * 100, 1)

    # Every attempt lands in the teacher's gradebook (best score kept), passed or not.
    sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.student_id == actor.id, AssignmentSubmission.task_id == task.id
    ).first()
    if not sub:
        sub = AssignmentSubmission(id=f"sub_{uuid.uuid4().hex[:8]}", task_id=task.id, task_title=task.title,
                                   student_id=actor.id, student_name=actor.name, content="")
        db.add(sub)
    if sub.grade is None or score > sub.grade:
        sub.grade = score
        sub.content = f"Kuis dinilai otomatis: {correct} dari {len(answers)} jawaban benar."
        sub.submitted_at = datetime.utcnow()
    sub.status = "GRADED"
    db.commit()

    if score < PASSING_SCORE:
        raise HTTPException(400, f"Skor {score:g}% belum mencapai batas lulus {PASSING_SCORE}%.")

    # One credential per quiz per student; retaking a passed quiz returns the original.
    existing = db.query(BlockchainCredential).filter(
        BlockchainCredential.student_id == actor.id, BlockchainCredential.task_id == task.id
    ).first()
    if existing:
        return existing

    return append_block(
        db,
        student=actor,
        classroom=cls,
        competency_title=f"Penguasaan {task.chapter or task.title}",
        score=score,
        task_id=task.id,
    )

@router.get("/verify/{query}", response_model=CredentialVerifyResponse)
def verify_credential(query: str, simulate_score: Optional[float] = None, db: Session = Depends(get_db)):
    """
    Verifikasi publik (tanpa login) via Certificate ID, Block Hash, atau TxID.
    Mengecek hash blok itu sendiri dan sambungannya ke blok sebelumnya.
    simulate_score menghitung ulang hash dengan nilai lain untuk demo deteksi manipulasi.
    """
    clean_q = query.strip()
    cert = db.query(BlockchainCredential).filter(
        (BlockchainCredential.certificate_id == clean_q) |
        (BlockchainCredential.block_hash == clean_q) |
        (BlockchainCredential.transaction_id == clean_q)
    ).first()

    if not cert:
        return CredentialVerifyResponse(
            is_valid=False,
            is_tampered=False,
            computed_hash="N/A",
            recorded_hash="N/A",
            certificate=None,
            tamper_reason="Hash atau ID Sertifikat tidak terdaftar di ledger blockchain."
        )

    if cert.block_index == 1:
        expected_prev = settings.GENESIS_PREVIOUS_HASH
    else:
        prev = db.query(BlockchainCredential).filter(BlockchainCredential.block_index == cert.block_index - 1).first()
        expected_prev = prev.block_hash if prev else ""  # missing previous block = broken chain
    return verify_credential_integrity(cert, simulate_score, expected_prev)
