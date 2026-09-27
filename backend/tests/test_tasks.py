"""Assignments with files, manual quizzes, and timed exams (UTS/UAS)."""
import json
import uuid
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models.submission import AssignmentSubmission

PDF = b"%PDF-1.4\n%test\n"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


def login(client, role, name="User"):
    email = f"task.{uuid.uuid4().hex[:8]}@example.org"
    body = client.post("/api/v1/auth/register", json={"name": name, "email": email, "role": role,
                                                      "password": "secretpassword123"}).json()
    return {"Authorization": f"Bearer {body['token']}"}, body["user"]


def setup(client):
    teacher, _ = login(client, "GURU", "Bu Sari")
    student, s_user = login(client, "SISWA", "Budi")
    cls = client.post("/api/v1/classrooms", json={"name": "Bio 10", "subject": "Biologi", "teacher_id": "x",
                                                  "teacher_name": "x"}, headers=teacher).json()
    client.post("/api/v1/classrooms/join", json={"join_code": cls["join_code"], "student_id": "x"}, headers=student)
    return teacher, student, s_user, cls


def iso(delta_minutes: float) -> str:
    return (datetime.utcnow() + timedelta(minutes=delta_minutes)).isoformat() + "Z"


def exam_body(cls, **extra):
    body = {"classroom_id": cls["id"], "classroom_name": "x", "type": "exam", "title": "UTS Biologi",
            "exam_label": "UTS", "opens_at": iso(-5), "closes_at": iso(120), "time_limit_minutes": 30,
            "content_json": {"instructions": "Kerjakan dengan jujur.", "questions": [
                {"id": "q1", "kind": "mcq", "questionText": "Organel energi?", "options": ["Ribosom", "Mitokondria"],
                 "correctIndex": 1, "points": 2},
                {"id": "q2", "kind": "essay", "questionText": "Jelaskan fotosintesis.", "points": 8},
            ]}}
    body.update(extra)
    return body


def test_only_the_class_teacher_manages_tasks_and_questions_are_validated():
    with TestClient(app) as client:
        teacher, student, _, cls = setup(client)
        other_teacher, _ = login(client, "GURU")
        base = {"classroom_id": cls["id"], "classroom_name": "x", "type": "assignment", "title": "Laporan praktikum",
                "content_json": {"instructions": "Tulis laporan."}, "closes_at": iso(60)}

        assert client.post("/api/v1/tasks", json=base, headers=student).status_code == 403
        assert client.post("/api/v1/tasks", json=base, headers=other_teacher).status_code == 403
        assert client.post("/api/v1/tasks", json={**base, "type": "material"}, headers=teacher).status_code == 400
        task = client.post("/api/v1/tasks", json=base, headers=teacher).json()
        assert task["type"] == "assignment" and task["attachments"] == []

        # A quiz needs complete multiple-choice questions; essays belong to exams only.
        quiz = {**base, "type": "quiz", "content_json": {"questions": [{"questionText": "2+2?", "options": ["3", "4"]}]}}
        assert client.post("/api/v1/tasks", json=quiz, headers=teacher).status_code == 400
        quiz["content_json"]["questions"][0]["correctIndex"] = 1
        assert client.post("/api/v1/tasks", json=quiz, headers=teacher).status_code == 201
        essay_quiz = {**base, "type": "quiz", "content_json": {"questions": [{"kind": "essay", "questionText": "Jelaskan"}]}}
        assert client.post("/api/v1/tasks", json=essay_quiz, headers=teacher).status_code == 400

        # Exams need a window, a duration and a label.
        assert client.post("/api/v1/tasks", json=exam_body(cls, time_limit_minutes=None), headers=teacher).status_code == 400
        assert client.post("/api/v1/tasks", json=exam_body(cls, closes_at=iso(-10)), headers=teacher).status_code == 400
        assert client.post("/api/v1/tasks", json=exam_body(cls, exam_label="Kuis"), headers=teacher).status_code == 400

        assert client.patch(f"/api/v1/tasks/{task['id']}", json={"title": "Laporan 2"}, headers=other_teacher).status_code == 403
        assert client.patch(f"/api/v1/tasks/{task['id']}", json={"title": "Laporan 2"}, headers=teacher).json()["title"] == "Laporan 2"
        assert client.delete(f"/api/v1/tasks/{task['id']}", headers=student).status_code == 403
        assert client.delete(f"/api/v1/tasks/{task['id']}", headers=teacher).json() == {"deleted": True}
        assert client.get(f"/api/v1/tasks/{task['id']}", headers=teacher).status_code == 404


def test_assignment_files_are_checked_and_private_to_the_student_and_teacher():
    with TestClient(app) as client:
        teacher, student, s_user, cls = setup(client)
        classmate, _ = login(client, "SISWA")
        cls_full = client.post("/api/v1/classrooms/join", json={"join_code": cls["join_code"], "student_id": "x"}, headers=classmate)
        assert cls_full.status_code in (200, 201)
        task = client.post("/api/v1/tasks", json={"classroom_id": cls["id"], "classroom_name": "x", "type": "assignment",
                                                  "title": "Poster sel", "closes_at": iso(60)}, headers=teacher).json()

        # Teacher attachment: whole class may open it.
        with_att = client.post(f"/api/v1/tasks/{task['id']}/attachments", files=[("files", ("soal.pdf", PDF, "application/pdf"))],
                               headers=teacher).json()
        att_path = with_att["attachments"][0]["path"]
        assert client.get(att_path, headers=classmate).status_code == 200

        # Wrong type, fake content, too big, too many.
        post = lambda files, **form: client.post("/api/v1/submissions", data={"task_id": task["id"], **form}, files=files, headers=student)
        assert post([("files", ("virus.exe", b"MZ", "application/octet-stream"))]).status_code == 400
        assert post([("files", ("tugas.pdf", b"<html>not a pdf</html>", "application/pdf"))]).status_code == 400
        assert post([("files", ("besar.pdf", PDF + b"0" * (10 * 1024 * 1024), "application/pdf"))]).status_code == 400
        assert post([("files", (f"f{i}.png", PNG, "image/png")) for i in range(6)]).status_code == 400
        assert post([]).status_code == 400  # neither text nor file

        sub = post([("files", ("foto.png", PNG, "image/png"))], content="Ini posterku").json()
        assert sub["status"] == "SUBMITTED" and sub["is_late"] is False and sub["attachments"][0]["name"] == "foto.png"
        file_path = sub["attachments"][0]["path"]
        assert client.get(file_path, headers=student).status_code == 200
        assert client.get(file_path, headers=teacher).status_code == 200
        assert client.get(file_path, headers=classmate).status_code == 403

        # Handing in again replaces the submission (no duplicate rows) and can drop old files.
        again = post([("files", ("laporan.pdf", PDF, "application/pdf"))], content="Revisi",
                     keep_files=json.dumps([sub["attachments"][0]["id"]])).json()
        assert again["id"] == sub["id"] and [a["name"] for a in again["attachments"]] == ["foto.png", "laporan.pdf"]
        mine = client.get(f"/api/v1/submissions?task_id={task['id']}", headers=teacher).json()
        assert len([s for s in mine if s["student_id"] == s_user["id"]]) == 1

        graded = client.patch(f"/api/v1/submissions/{sub['id']}/grade", json={"grade": 88, "feedback": "Bagus"}, headers=teacher).json()
        assert graded["status"] == "GRADED" and graded["grade"] == 88
        assert post([], content="Terlambat revisi").status_code == 409  # graded work is closed


def test_late_assignment_is_flagged():
    with TestClient(app) as client:
        teacher, student, _, cls = setup(client)
        task = client.post("/api/v1/tasks", json={"classroom_id": cls["id"], "classroom_name": "x", "type": "assignment",
                                                  "title": "Esai", "closes_at": iso(-1)}, headers=teacher).json()
        sub = client.post("/api/v1/submissions", data={"task_id": task["id"], "content": "Maaf telat"}, headers=student).json()
        assert sub["is_late"] is True


def test_exam_hides_questions_runs_once_and_combines_auto_and_essay_scores():
    with TestClient(app) as client:
        teacher, student, _, cls = setup(client)
        exam = client.post("/api/v1/tasks", json=exam_body(cls), headers=teacher).json()

        # Before starting, students see only the instructions and counts, never questions or keys.
        listed = next(t for t in client.get("/api/v1/tasks", headers=student).json() if t["id"] == exam["id"])
        assert "questions" not in listed["content_json"] and listed["content_json"]["question_count"] == 2
        started = client.post(f"/api/v1/tasks/{exam['id']}/start", headers=student).json()
        assert all("correctIndex" not in q for q in started["questions"])
        assert started["deadline"]

        # Reopening resumes the same attempt with the saved answers.
        client.put(f"/api/v1/tasks/{exam['id']}/progress", json={"answers": {"q1": 1}}, headers=student)
        resumed = client.post(f"/api/v1/tasks/{exam['id']}/start", headers=student).json()
        assert resumed["submission_id"] == started["submission_id"] and resumed["answers"] == {"q1": 1}

        done = client.post(f"/api/v1/tasks/{exam['id']}/submit", json={"answers": {"q2": "Tumbuhan membuat glukosa."}},
                           headers=student).json()
        assert done["status"] == "SUBMITTED" and done["grade"] is None  # essay still waiting for the teacher
        assert client.post(f"/api/v1/tasks/{exam['id']}/start", headers=student).status_code == 409  # one attempt

        assert client.patch(f"/api/v1/submissions/{done['id']}/grade", json={"essay_scores": {"q2": 9}}, headers=teacher).status_code == 400
        graded = client.patch(f"/api/v1/submissions/{done['id']}/grade", json={"essay_scores": {"q2": 6}}, headers=teacher).json()
        assert graded["status"] == "GRADED" and graded["grade"] == 80.0  # (2 + 6) / 10


def test_exam_window_and_timeout_are_enforced_on_the_server():
    with TestClient(app) as client:
        teacher, student, _, cls = setup(client)
        not_open = client.post("/api/v1/tasks", json=exam_body(cls, opens_at=iso(30)), headers=teacher).json()
        assert client.post(f"/api/v1/tasks/{not_open['id']}/start", headers=student).status_code == 403

        exam = client.post("/api/v1/tasks", json=exam_body(cls, time_limit_minutes=1), headers=teacher).json()
        started = client.post(f"/api/v1/tasks/{exam['id']}/start", headers=student).json()
        client.put(f"/api/v1/tasks/{exam['id']}/progress", json={"answers": {"q1": 1}}, headers=student)

        # The student's phone dies; three minutes later the time is over.
        db = SessionLocal()
        try:
            sub = db.get(AssignmentSubmission, started["submission_id"])
            sub.started_at = datetime.utcnow() - timedelta(minutes=3)
            db.commit()
        finally:
            db.close()
        assert client.put(f"/api/v1/tasks/{exam['id']}/progress", json={"answers": {"q1": 0}}, headers=student).status_code == 409
        closed = next(s for s in client.get(f"/api/v1/submissions?task_id={exam['id']}", headers=teacher).json())
        assert closed["status"] == "SUBMITTED" and closed["answers"] == {"q1": 1}  # saved answer kept, late change refused
