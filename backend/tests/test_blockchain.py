import pytest
from app.services.blockchain_service import (
    generate_block_hash,
    generate_transaction_id,
    calculate_sha256
)

def test_deterministic_block_hashing():
    genesis_prev = "0000000000000000000000000000000000000000000000000000000000000000"
    issued_at = "2026-08-15T10:30:00.000Z"
    
    hash1 = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 94.5, issued_at)
    hash2 = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 94.5, issued_at)
    
    assert hash1 == hash2
    assert len(hash1) == 64

def test_tamper_detection():
    genesis_prev = "0000000000000000000000000000000000000000000000000000000000000000"
    issued_at = "2026-08-15T10:30:00.000Z"
    
    original_hash = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 94.5, issued_at)
    tampered_hash = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 100.0, issued_at) # Nilai diubah ke 100
    
    assert original_hash != tampered_hash

def test_transaction_id_format():
    block_hash = "a" * 64
    tx_id = generate_transaction_id(block_hash, "KOG-2026-X7A9")
    assert tx_id.startswith("0x")
    assert len(tx_id) == 42 # "0x" + 40 chars


# --- API: quiz claim, public verify, chain integrity ---
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.credential import BlockchainCredential


def _login(client, role):
    email = f"bc.{uuid.uuid4().hex[:8]}@example.org"
    resp = client.post("/api/v1/auth/register", json={"name": f"User {role}", "email": email, "role": role, "password": "secretpassword123"})
    body = resp.json()
    return {"Authorization": f"Bearer {body['token']}"}, body.get("user", body)


def _quiz_setup(client):
    teacher, t_user = _login(client, "GURU")
    student, _ = _login(client, "SISWA")
    cls = client.post("/api/v1/classrooms", json={"name": "Bio 10", "subject": "Biologi", "teacher_id": "x", "teacher_name": "x"}, headers=teacher).json()
    client.post("/api/v1/classrooms/join", json={"join_code": cls["join_code"], "student_id": "x"}, headers=student)
    questions = [{"id": f"q{i}", "questionText": f"Soal {i}", "options": ["a", "b", "c", "d"], "correctIndex": i % 4, "difficulty": "BASIC"} for i in range(4)]
    task = client.post("/api/v1/tasks", json={
        "classroom_id": cls["id"], "classroom_name": cls["name"], "type": "quiz", "title": "Kuis Sel",
        "chapter": "Sel Hewan", "source_reference": "Bab 1", "content_json": {"questions": questions},
    }, headers=teacher).json()
    return teacher, student, task


def _answers(correct_count):
    return [{"question_id": f"q{i}", "selected_index": (i % 4) if i < correct_count else (i + 1) % 4} for i in range(4)]


def test_student_claims_credential_graded_on_server():
    with TestClient(app) as client:
        _, student, task = _quiz_setup(client)

        failed = client.post("/api/v1/credentials/claim", json={"task_id": task["id"], "answers": _answers(1)}, headers=student)
        assert failed.status_code == 400

        resp = client.post("/api/v1/credentials/claim", json={"task_id": task["id"], "answers": _answers(3)}, headers=student)
        assert resp.status_code == 201, resp.text
        cred = resp.json()
        assert cred["score"] == 75.0  # graded from answers, not sent by the client
        assert cred["competency_title"] == "Penguasaan Sel Hewan"
        assert "/verify?cert=" in cred["qr_verification_url"]

        again = client.post("/api/v1/credentials/claim", json={"task_id": task["id"], "answers": _answers(4)}, headers=student).json()
        assert again["certificate_id"] == cred["certificate_id"]  # one credential per quiz

        # Public verify works without logging in
        check = client.get(f"/api/v1/credentials/verify/{cred['certificate_id']}").json()
        assert check["is_valid"] is True
        assert check["certificate"]["student_id"] == cred["student_id"]

        sim = client.get(f"/api/v1/credentials/verify/{cred['certificate_id']}?simulate_score=100").json()
        assert sim["is_valid"] is False and sim["is_tampered"] is True


def test_claim_rejects_outsiders_and_teachers():
    with TestClient(app) as client:
        teacher, _, task = _quiz_setup(client)
        outsider, _ = _login(client, "SISWA")
        assert client.post("/api/v1/credentials/claim", json={"task_id": task["id"], "answers": _answers(4)}, headers=outsider).status_code == 403
        assert client.post("/api/v1/credentials/claim", json={"task_id": task["id"], "answers": _answers(4)}, headers=teacher).status_code == 403
        bad = [{"question_id": "nope", "selected_index": 0}] * 4
        _, student, task2 = _quiz_setup(client)
        assert client.post("/api/v1/credentials/claim", json={"task_id": task2["id"], "answers": bad}, headers=student).status_code == 400


def test_verify_detects_db_tampering_and_broken_chain():
    with TestClient(app) as client:
        _, student, task = _quiz_setup(client)
        cred = client.post("/api/v1/credentials/claim", json={"task_id": task["id"], "answers": _answers(3)}, headers=student).json()
        _, student2, task2 = _quiz_setup(client)
        cred2 = client.post("/api/v1/credentials/claim", json={"task_id": task2["id"], "answers": _answers(4)}, headers=student2).json()
        assert cred2["previous_hash"] == cred["block_hash"]

        db = SessionLocal()
        try:
            row = db.query(BlockchainCredential).filter_by(certificate_id=cred["certificate_id"]).one()
            original_score, original_hash = row.score, row.block_hash
            row.score = 100.0  # someone edits the DB directly
            db.commit()
            assert client.get(f"/api/v1/credentials/verify/{cred['certificate_id']}").json()["is_valid"] is False

            # Re-hashing the edited block to hide it breaks the link to the next block instead.
            from app.services.blockchain_service import block_hash_for
            row.block_hash = block_hash_for(row)
            db.commit()
            assert client.get(f"/api/v1/credentials/verify/{cred['certificate_id']}").json()["is_valid"] is True
            nxt = client.get(f"/api/v1/credentials/verify/{cred2['certificate_id']}").json()
            assert nxt["is_valid"] is False and "Rantai" in nxt["tamper_reason"]

            row.score, row.block_hash = original_score, original_hash
            db.commit()
        finally:
            db.close()


def test_v2_hash_seals_certificate_text_and_v1_still_verifies():
    with TestClient(app) as client:
        _, student, task = _quiz_setup(client)
        cred = client.post("/api/v1/credentials/claim", json={"task_id": task["id"], "answers": _answers(3)}, headers=student).json()
        assert cred["hash_version"] == 2

        db = SessionLocal()
        try:
            row = db.query(BlockchainCredential).filter_by(certificate_id=cred["certificate_id"]).one()
            original = (row.competency_title, row.block_hash, row.hash_version)

            row.competency_title = "Penguasaan Fisika Kuantum"  # edit only the title
            db.commit()
            assert client.get(f"/api/v1/credentials/verify/{cred['certificate_id']}").json()["is_valid"] is False

            # A legacy (v1) block is still checked with the old formula.
            row.competency_title, row.hash_version = original[0], None
            row.block_hash = generate_block_hash(row.block_index, row.previous_hash, row.student_id, row.certificate_id, row.score, row.issued_at)
            db.commit()
            assert client.get(f"/api/v1/credentials/verify/{cred['certificate_id']}").json()["is_valid"] is True

            row.competency_title, row.block_hash, row.hash_version = original
            db.commit()
        finally:
            db.close()
