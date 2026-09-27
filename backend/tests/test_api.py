import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"

def test_auth_register_and_login_flow():
    unique_email = f"user.{uuid.uuid4().hex[:6]}@student.eduadapt.id"
    with TestClient(app) as client:
        # 1. Register new student
        payload = {
            "name": "Budi Santoso",
            "email": unique_email,
            "role": "SISWA",
            "grade": 11,
            "password": "secretpassword123"
        }
        reg_resp = client.post("/api/v1/auth/register", json=payload)
        assert reg_resp.status_code == 201
        reg_data = reg_resp.json()
        assert reg_data["success"] is True
        assert reg_data["user"]["name"] == "Budi Santoso"
        assert reg_data["user"]["role"] == "SISWA"
        assert reg_data["user"]["grade"] == 11
        user_id = reg_data["user"]["id"]
        auth = {"Authorization": f"Bearer {reg_data['token']}"}

        # 2. Duplicate email check
        dup_resp = client.post("/api/v1/auth/register", json=payload)
        assert dup_resp.status_code == 400

        # 3. Login with registered email
        login_resp = client.post("/api/v1/auth/login", json={
            "identifier": unique_email,
            "password": "secretpassword123"
        })
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        assert login_data["success"] is True
        assert login_data["user"]["id"] == user_id
        assert login_data["user"]["name"] == "Budi Santoso"

        # 4. Update profile
        update_resp = client.patch(f"/api/v1/users/{user_id}", json={
            "name": "Budi Santoso Updated",
            "grade": 12
        }, headers=auth)
        assert update_resp.status_code == 200
        assert update_resp.json()["name"] == "Budi Santoso Updated"
        assert update_resp.json()["grade"] == 12

def test_session_slides_forward_and_ends_after_idle_week():
    from datetime import datetime, timedelta
    from app.core.auth import AuthSession, SESSION_IDLE, token_hash
    from app.core.database import SessionLocal
    email = f"sess.{uuid.uuid4().hex[:6]}@student.eduadapt.id"
    with TestClient(app) as client:
        token = client.post("/api/v1/auth/register", json={"name": "Sesi", "email": email, "role": "SISWA", "password": "secretpassword123"}).json()["token"]
        auth = {"Authorization": f"Bearer {token}"}
        db = SessionLocal()
        try:
            row = db.get(AuthSession, token_hash(token))
            assert row.expires_at > datetime.utcnow() + SESSION_IDLE - timedelta(minutes=5)

            # Last used 3 hours ago: any request pushes the 7-day window forward again.
            row.expires_at = datetime.utcnow() + SESSION_IDLE - timedelta(hours=3)
            db.commit()
            assert client.get("/api/v1/auth/me", headers=auth).status_code == 200
            db.expire_all()
            assert db.get(AuthSession, token_hash(token)).expires_at > datetime.utcnow() + SESSION_IDLE - timedelta(minutes=5)

            # Unused for 7 days in a row: the student has to log in again.
            db.get(AuthSession, token_hash(token)).expires_at = datetime.utcnow() - timedelta(seconds=1)
            db.commit()
            assert client.get("/api/v1/auth/me", headers=auth).status_code == 401
        finally:
            db.close()


def test_auth_login_invalid():
    with TestClient(app) as client:
        payload = {
            "identifier": "unknown.user.999@nonexistent.id",
            "password": "sandi"
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

def test_evaluate_dda_api():
    payload = {
        "current_level": "BASIC",
        "consecutive_correct": 1,
        "consecutive_incorrect": 0,
        "total_correct": 1,
        "total_answered": 1,
        "is_correct": True,
        "response_time_sec": 12.5,
        "question_index": 1
    }
    with TestClient(app) as client:
        response = client.post("/api/v1/dda/evaluate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["next_level"] == "MEDIUM"
        assert data["action"] == "LEVEL_UP"

def test_learning_progress_endpoints():
    unique_email = f"student.{uuid.uuid4().hex[:6]}@eduadapt.id"
    with TestClient(app) as client:
        reg_resp = client.post("/api/v1/auth/register", json={
            "name": "Siti Rahma",
            "email": unique_email,
            "role": "SISWA",
            "grade": 10,
            "password": "secretpassword123"
        })
        assert reg_resp.status_code == 201
        user_id = reg_resp.json()["user"]["id"]
        auth = {"Authorization": f"Bearer {reg_resp.json()['token']}"}

        # GET progress
        prog_resp = client.get(f"/api/v1/users/{user_id}/progress", headers=auth)
        assert prog_resp.status_code == 200
        prog_data = prog_resp.json()
        assert "visual_progress" in prog_data
        assert "audio_progress" in prog_data
        assert "practice_progress" in prog_data

        # PATCH track activity
        track_resp = client.patch(f"/api/v1/users/{user_id}/progress", json={
            "modality_type": "visual",
            "increment_amount": 2,
            "activity_title": "Eksplorasi Diagram Sel"
        }, headers=auth)
        assert track_resp.status_code == 200
        track_data = track_resp.json()
        assert track_data["visual_completed"] >= 2
        assert track_data["visual_progress"] > 0

        # GET style analytics
        style_resp = client.get(f"/api/v1/users/{user_id}/style-analytics", headers=auth)
        assert style_resp.status_code == 200
        style_data = style_resp.json()
        assert "visual_params" in style_data
        assert "auditory_params" in style_data
        assert "kinesthetic_params" in style_data
        assert style_data["visual_params"]["mindmap_explored_count"] >= 2
        # Nothing graded yet: no accuracy is reported rather than an invented one.
        assert style_data["accuracy_avg_pct"] is None
        assert "spatial_retention_pct" not in style_data["visual_params"]


def test_streak_counts_consecutive_active_days_only():
    from datetime import timedelta
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.services.progress_service import local_today
    email = f"streak.{uuid.uuid4().hex[:6]}@student.eduadapt.id"
    with TestClient(app) as client:
        reg = client.post("/api/v1/auth/register", json={"name": "Rajin", "email": email, "role": "SISWA", "password": "secretpassword123"}).json()
        auth, uid = {"Authorization": f"Bearer {reg['token']}"}, reg["user"]["id"]
        me = lambda: client.get("/api/v1/auth/me", headers=auth).json()
        assert me()["streak_days"] == 0  # nothing learned yet

        track = lambda: client.patch(f"/api/v1/users/{uid}/progress", json={"modality_type": "visual", "amount": 1}, headers=auth)
        assert track().status_code == 200
        assert me()["streak_days"] == 1
        track()
        assert me()["streak_days"] == 1  # same day counts once

        def set_last(days_ago, streak):
            db = SessionLocal()
            try:
                user = db.get(User, uid)
                user.last_active_on, user.streak_days = local_today() - timedelta(days=days_ago), streak
                db.commit()
            finally:
                db.close()

        set_last(1, 3)  # learned yesterday with a 3-day streak
        track()
        assert me()["streak_days"] == 4
        set_last(3, 4)  # skipped two days
        assert me()["streak_days"] == 0
