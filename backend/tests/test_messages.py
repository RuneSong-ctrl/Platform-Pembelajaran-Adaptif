import uuid

from fastapi.testclient import TestClient

from app.main import app


def login(client, role, name="User"):
    email = f"msg.{uuid.uuid4().hex[:8]}@example.org"
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


def test_announcements_reach_only_the_class():
    with TestClient(app) as client:
        teacher, student, _, cls = setup(client)
        outsider, _ = login(client, "SISWA")
        other_teacher, _ = login(client, "GURU")

        assert client.post("/api/v1/announcements", json={"classroom_id": cls["id"], "text": "  "}, headers=teacher).status_code == 422
        assert client.post("/api/v1/announcements", json={"classroom_id": cls["id"], "text": "Hai"}, headers=student).status_code == 403
        assert client.post("/api/v1/announcements", json={"classroom_id": cls["id"], "text": "Hai"}, headers=other_teacher).status_code == 403
        ann = client.post("/api/v1/announcements", json={"classroom_id": cls["id"], "text": "Besok ulangan bab 2."}, headers=teacher).json()

        assert [a["text"] for a in client.get("/api/v1/announcements", headers=student).json()] == ["Besok ulangan bab 2."]
        assert client.get("/api/v1/announcements", headers=outsider).json() == []
        assert client.get(f"/api/v1/announcements?classroom_id={cls['id']}", headers=outsider).json() == []

        assert client.delete(f"/api/v1/announcements/{ann['id']}", headers=student).status_code == 403
        assert client.delete(f"/api/v1/announcements/{ann['id']}", headers=teacher).status_code == 200
        assert client.get("/api/v1/announcements", headers=student).json() == []


def test_private_thread_between_teacher_and_student():
    with TestClient(app) as client:
        teacher, student, s_user, cls = setup(client)
        classmate, c_user = login(client, "SISWA", "Ani")
        client.post("/api/v1/classrooms/join", json={"join_code": cls["join_code"], "student_id": "x"}, headers=classmate)

        # Student writes; a spoofed student_id is ignored, so it lands in their own thread.
        sent = client.post("/api/v1/messages", json={"classroom_id": cls["id"], "student_id": c_user["id"], "text": "Bu, saya izin."}, headers=student)
        assert sent.status_code == 201 and sent.json()["mine"] is True

        inbox = client.get("/api/v1/messages/threads", headers=teacher).json()
        assert [(t["student_name"], t["unread"]) for t in inbox] == [("Budi", 1)]

        # The classmate cannot read Budi's thread: they only ever see their own (empty) one.
        assert client.get(f"/api/v1/messages?classroom_id={cls['id']}&student_id={s_user['id']}", headers=classmate).json() == []

        thread = client.get(f"/api/v1/messages?classroom_id={cls['id']}&student_id={s_user['id']}", headers=teacher).json()
        assert [(m["text"], m["mine"]) for m in thread] == [("Bu, saya izin.", False)]
        assert client.get("/api/v1/messages/threads", headers=teacher).json()[0]["unread"] == 0  # opening marks read

        client.post("/api/v1/messages", json={"classroom_id": cls["id"], "student_id": s_user["id"], "text": "Baik."}, headers=teacher)
        assert client.get("/api/v1/messages/threads", headers=student).json()[0]["unread"] == 1

        # Outsiders, other teachers and parents are refused; teachers can't open a thread with a non-member.
        outsider, _ = login(client, "SISWA")
        parent, _ = login(client, "ORTU")
        other_teacher, _ = login(client, "GURU")
        for who in (outsider, parent, other_teacher):
            assert client.get(f"/api/v1/messages?classroom_id={cls['id']}&student_id={s_user['id']}", headers=who).status_code == 403
        _, stranger = login(client, "SISWA")
        assert client.post("/api/v1/messages", json={"classroom_id": cls["id"], "student_id": stranger["id"], "text": "x"}, headers=teacher).status_code == 404

        # Once removed from the class, the student loses the thread.
        client.delete(f"/api/v1/classrooms/{cls['id']}/students/{s_user['id']}", headers=teacher)
        assert client.get(f"/api/v1/messages?classroom_id={cls['id']}", headers=student).status_code == 403
        assert client.get("/api/v1/messages/threads", headers=teacher).json() == []


def test_parent_teacher_notes_need_a_real_link():
    from app.core.database import SessionLocal
    from app.models.user import User
    with TestClient(app) as client:
        teacher, student, s_user, cls = setup(client)
        parent, p_user = login(client, "ORTU", "Ibu Budi")
        stranger_parent, _ = login(client, "ORTU")
        other_teacher, ot_user = login(client, "GURU")
        teacher_id = client.get("/api/v1/users", headers=teacher).json()
        teacher_id = next(u["id"] for u in teacher_id if u["role"] == "GURU")

        def note(sender, receiver_id, student_id=s_user["id"]):
            return client.post("/api/v1/notes", json={"receiver_id": receiver_id, "student_id": student_id,
                                                      "student_name": "palsu", "message": "Halo"}, headers=sender)

        # Not linked yet: the parent is not Budi's parent, so nobody can open this channel.
        assert note(parent, teacher_id).status_code == 403
        with SessionLocal() as db:
            db.get(User, p_user["id"]).children_ids = [s_user["id"]]
            db.commit()

        ok = note(parent, teacher_id)
        assert ok.status_code == 201 and ok.json()["student_name"] == "Budi"  # name from DB, not the client
        assert note(teacher, p_user["id"]).status_code == 201
        assert note(stranger_parent, teacher_id).status_code == 403   # not the child's parent
        assert note(parent, ot_user["id"]).status_code == 403          # teacher does not teach the child
        assert note(other_teacher, p_user["id"]).status_code == 403
        assert note(teacher, s_user["id"]).status_code == 403          # students are not note recipients
        assert note(student, teacher_id).status_code == 403


def test_parent_links_child_with_one_time_code():
    with TestClient(app) as client:
        teacher, student, s_user, cls = setup(client)
        parent, p_user = login(client, "ORTU", "Ibu Budi")
        other_parent, _ = login(client, "ORTU")

        assert client.post("/api/v1/family/parent-code", headers=parent).status_code == 403
        old = client.post("/api/v1/family/parent-code", headers=student).json()["code"]
        code = client.post("/api/v1/family/parent-code", headers=student).json()["code"]
        assert len(code) == 8 and code != old

        assert client.post("/api/v1/family/children", json={"code": old}, headers=parent).status_code == 404  # replaced
        assert client.post("/api/v1/family/children", json={"code": code}, headers=student).status_code == 403
        linked = client.post("/api/v1/family/children", json={"code": code.lower()}, headers=parent)
        assert linked.json() == {"id": s_user["id"], "name": "Budi"}
        assert client.post("/api/v1/family/children", json={"code": code}, headers=other_parent).status_code == 404  # single use

        # The link is what the rest of the app trusts: the parent now sees the child and can write to the teacher.
        people = {u["id"] for u in client.get("/api/v1/users", headers=parent).json()}
        assert s_user["id"] in people
        teacher_id = next(u["id"] for u in client.get("/api/v1/users", headers=teacher).json() if u["role"] == "GURU")
        assert client.post("/api/v1/notes", json={"receiver_id": teacher_id, "student_id": s_user["id"], "message": "Halo Bu"},
                           headers=parent).status_code == 201


def test_live_events_reach_both_sides_and_carry_no_content():
    import asyncio
    import threading
    from unittest.mock import patch
    from app.services import live

    # notify() is called from sync endpoints on worker threads; the event must land on the subscriber's loop.
    async def roundtrip():
        sub = live.subscribe("u1")
        threading.Thread(target=live.notify, args=(["u1", "u2"], {"type": "message"})).start()
        got = await asyncio.wait_for(sub[1].get(), timeout=2)
        live.unsubscribe("u1", sub)
        return got
    assert asyncio.run(roundtrip()) == {"type": "message"}

    with TestClient(app) as client, patch("app.services.live.notify") as notify:
        teacher, student, s_user, cls = setup(client)
        client.post("/api/v1/messages", json={"classroom_id": cls["id"], "text": "Rahasia"}, headers=student)
        users, event = notify.call_args.args
        assert set(users) == {s_user["id"], cls["teacher_id"]}
        assert event == {"type": "message", "classroom_id": cls["id"], "student_id": s_user["id"], "parent_id": None}  # ids only

        client.post("/api/v1/announcements", json={"classroom_id": cls["id"], "text": "Info"}, headers=teacher)
        users, event = notify.call_args.args
        assert s_user["id"] in users and event["type"] == "announcement"

        assert client.get("/api/v1/messages/stream?t=salah").status_code == 401


def test_teacher_signup_needs_school_code_and_class_code_can_be_reset(monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "TEACHER_INVITE_CODE", "SEKOLAH-123")
    with TestClient(app) as client:
        body = {"name": "Pak Guru", "role": "GURU", "password": "secretpassword123"}
        email = lambda: f"g.{uuid.uuid4().hex[:8]}@example.org"
        assert client.post("/api/v1/auth/register", json={**body, "email": email()}).status_code == 403
        assert client.post("/api/v1/auth/register", json={**body, "email": email(), "invite_code": "salah"}).status_code == 403
        assert client.post("/api/v1/auth/register", json={**body, "email": email(), "invite_code": "SEKOLAH-123"}).status_code == 201
        # Students and parents never need it.
        assert client.post("/api/v1/auth/register", json={**body, "role": "SISWA", "email": email()}).status_code == 201

    monkeypatch.setattr(settings, "TEACHER_INVITE_CODE", "")
    with TestClient(app) as client:
        teacher, student, s_user, cls = setup(client)
        newcomer, _ = login(client, "SISWA")
        assert client.post(f"/api/v1/classrooms/{cls['id']}/reset-code", headers=student).status_code == 403
        fresh = client.post(f"/api/v1/classrooms/{cls['id']}/reset-code", headers=teacher).json()
        assert fresh["join_code"] != cls["join_code"] and s_user["id"] in fresh["student_ids"]  # members stay
        assert client.post("/api/v1/classrooms/join", json={"join_code": cls["join_code"], "student_id": "x"}, headers=newcomer).status_code == 404
        assert client.post("/api/v1/classrooms/join", json={"join_code": fresh["join_code"], "student_id": "x"}, headers=newcomer).status_code == 200



def test_parent_teacher_thread_is_private_and_needs_a_linked_child():
    with TestClient(app) as client:
        teacher, student, s_user, cls = setup(client)
        parent, p_user = login(client, "ORTU", "Ibu Budi")
        stranger, _ = login(client, "ORTU")
        other_student, o_user = login(client, "SISWA", "Ani")
        client.post("/api/v1/classrooms/join", json={"join_code": cls["join_code"], "student_id": "x"}, headers=other_student)
        msg = lambda who, **kw: client.post("/api/v1/messages", json={"classroom_id": cls["id"], "text": "Halo", **kw}, headers=who)

        assert msg(parent, student_id=s_user["id"]).status_code == 403  # not linked yet
        code = client.post("/api/v1/family/parent-code", headers=student).json()["code"]
        client.post("/api/v1/family/children", json={"code": code}, headers=parent)

        assert msg(parent, student_id=s_user["id"]).status_code == 201
        assert msg(parent, student_id=o_user["id"]).status_code == 403   # not their child
        assert msg(stranger, student_id=s_user["id"]).status_code == 403

        # The teacher sees it as a separate thread from the student's own chat, and can reply.
        inbox = client.get("/api/v1/messages/threads", headers=teacher).json()
        assert [(t["parent_name"], t["student_name"], t["unread"]) for t in inbox] == [("Ibu Budi", "Budi", 1)]
        assert msg(teacher, student_id=s_user["id"], parent_id=p_user["id"]).status_code == 201
        assert client.get("/api/v1/messages/threads", headers=parent).json()[0]["unread"] == 1

        # The student cannot read the parent thread; the parent cannot read the student thread.
        msg(student)
        own = client.get(f"/api/v1/messages?classroom_id={cls['id']}", headers=student).json()
        assert [m["sender_name"] for m in own] == ["Budi"]
        thread = client.get(f"/api/v1/messages?classroom_id={cls['id']}&student_id={s_user['id']}", headers=parent).json()
        assert [m["sender_name"] for m in thread] == ["Ibu Budi", "Bu Sari"]

        # Parents read their child's class announcements but cannot post.
        client.post("/api/v1/announcements", json={"classroom_id": cls["id"], "text": "Rapat orang tua"}, headers=teacher)
        assert [a["text"] for a in client.get("/api/v1/announcements", headers=parent).json()] == ["Rapat orang tua"]
        assert client.get("/api/v1/announcements", headers=stranger).json() == []
        assert client.post("/api/v1/announcements", json={"classroom_id": cls["id"], "text": "x"}, headers=parent).status_code == 403
