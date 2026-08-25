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
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["name"] == "Budi Santoso Updated"
        assert update_resp.json()["grade"] == 12

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
            "grade": 10
        })
        assert reg_resp.status_code == 201
        user_id = reg_resp.json()["user"]["id"]

        # GET progress
        prog_resp = client.get(f"/api/v1/users/{user_id}/progress")
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
        })
        assert track_resp.status_code == 200
        track_data = track_resp.json()
        assert track_data["visual_completed"] >= 2
        assert track_data["visual_progress"] > 0

        # GET style analytics
        style_resp = client.get(f"/api/v1/users/{user_id}/style-analytics")
        assert style_resp.status_code == 200
        style_data = style_resp.json()
        assert "visual_params" in style_data
        assert "auditory_params" in style_data
        assert "kinesthetic_params" in style_data
        assert style_data["visual_params"]["spatial_retention_pct"] > 0
        assert style_data["kinesthetic_params"]["lab_accuracy_pct"] > 0
        assert style_data["auditory_params"]["verbal_retention_pct"] > 0
