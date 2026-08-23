import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.services.seed_service import seed_initial_data

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = SessionLocal()
    seed_initial_data(db)
    db.close()
    yield

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"

def test_get_users():
    with TestClient(app) as client:
        response = client.get("/api/v1/users")
        assert response.status_code == 200
        users = response.json()
        assert len(users) >= 3
        assert any(u["id"] == "user_ayu_01" for u in users)

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

def test_verify_credential_api():
    with TestClient(app) as client:
        response = client.get("/api/v1/credentials/verify/KOG-2026-X7A9")
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert data["is_tampered"] is False
