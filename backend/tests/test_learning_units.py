"""Run standalone: python tests/test_learning_units.py. No user DB, media, or AI calls."""
import os
import sys
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
TEST_DIR = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(TEST_DIR.name) / "test.db").replace("\\", "/")
os.environ["UPLOADS_DIR"] = str(Path(TEST_DIR.name) / "uploads")

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.core.database import Base, engine, SessionLocal
from app.core.config import settings
from app.core.auth import hash_password, verify_password, create_session
from app.models.user import User
from app.models.classroom import Classroom
from app.models.document import GroundedDocument
from app.api.v1.endpoints import auth, documents, learning_units, users, classrooms, tasks, submissions
from app.services.learning_unit_service import (
    AdaptiveDocument, make_segments, validate_units, generate_units, validate_infographic,
)
from app.services.gemini_service import generate_document_adaptive_assets

app = FastAPI()
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(learning_units.router)
app.include_router(users.router)
app.include_router(classrooms.router)
app.include_router(tasks.router)
app.include_router(submissions.router)


def unit(segment_id="seg_1", quote="Kucing termasuk hewan mamalia."):
    ref = {"segment_id": segment_id, "quote": quote}
    return {"id": "u1", "title": "Mamalia", "learning_objective": "Mengenali contoh hewan mamalia.",
            "concepts": [{"name": "Mamalia", "explanation": quote, "source_refs": [ref]}],
            "source_refs": [ref], "suggested_visual": "none", "suggested_activity": "grouping",
            "comprehension_checks": [{"question": "Manakah contoh mamalia?", "options": ["Kucing", "Ayam"],
                                      "correct_index": 0, "explanation": quote, "source_refs": [ref]}]}


def segment(page, text):
    return {"id": f"seg_{page}", "page": page, "label": f"Halaman {page}", "text": text}


INFO_SOURCE = ("Model bigram memprediksi kata berdasarkan satu kata sebelumnya. "
               "Probabilitas bigram dihitung P(wn|wn-1) = C(wn-1 wn) / C(wn-1). "
               "Smoothing Laplace menambahkan satu pada setiap hitungan. Akurasi model mencapai 72% pada data uji.")


def ref(quote):
    return [{"segment_id": "seg_1", "quote": quote}]


def infographic(**overrides):
    data = {
        "title": "Model Bahasa N-Gram", "subtitle": "",
        "big_idea": {"text": "Kata berikutnya ditebak dari kata sebelumnya.", "source_refs": ref("Model bigram memprediksi kata")},
        "definition": {"text": "Bigram memakai satu kata sebelumnya.", "source_refs": ref("berdasarkan satu kata sebelumnya")},
        "pillars": [{"name": "Smoothing", "desc": "Menambah satu pada hitungan.", "source_refs": ref("Smoothing Laplace menambahkan satu")}],
        "flow_title": "", "flow_steps": [],
        "key_facts": [{"label": "Rumus bigram", "value": "P(wn|wn-1) = C(wn-1 wn) / C(wn-1)", "explanation": "",
                       "source_refs": ref("P(wn|wn-1) = C(wn-1 wn) / C(wn-1)")}],
        "metrics": [{"label": "Akurasi", "value_pct": 72, "explanation": "", "source_refs": ref("Akurasi model mencapai 72%")}],
        "application": None,
        "analogy": {"title": "Seperti menebak lirik lagu", "story": "Kita menebak kata berikutnya dari kata yang baru saja didengar."},
        "takeaway": {"text": "Konteks pendek sudah membantu prediksi.", "source_refs": ref("Model bigram memprediksi kata")},
    }
    data.update(overrides)
    return data


class LearningUnitTests(unittest.TestCase):
    def setUp(self):
        assert Path(engine.url.database).resolve().is_relative_to(Path(TEST_DIR.name).resolve()), "Tests must use their own temporary database"
        # No test may reach the real image model or OCR; tests that need them patch these again.
        for target in ("app.services.ai_image_service.draw", "app.services.ai_image_service.read_text"):
            patcher = patch(target, side_effect=RuntimeError("no image AI in tests"))
            patcher.start()
            self.addCleanup(patcher.stop)
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        self.client = TestClient(app)
        with SessionLocal() as db:
            teacher = User(id="teacher", name="Guru", email="guru@example.org", role="GURU", password_hash=hash_password("Password-1234"))
            student = User(id="student", name="Siswa", email="siswa@example.org", role="SISWA")
            other = User(id="other", name="Lain", email="lain@example.org", role="GURU")
            db.add_all([teacher, student, other])
            db.add(Classroom(id="class", name="Kelas", teacher_id="teacher", teacher_name="Guru", grade=4,
                             subject="IPA", student_ids=["student"], join_code="ABC123"))
            db.add(GroundedDocument(id="doc", classroom_id="class", title="Mamalia", raw_text="Kucing termasuk hewan mamalia.",
                                    vector_id="v", podcast_script="Existing podcast", podcast_audio_url="/documents/doc/podcast-audio?episode=1",
                                    podcast_episodes_json=json.dumps([{"id": "ep_1", "order": 1, "title": "Mamalia", "script": "Existing podcast"}])))
            db.commit()
            self.teacher = {"Authorization": "Bearer " + create_session(teacher, db)}
            self.student = {"Authorization": "Bearer " + create_session(student, db)}
            self.other = {"Authorization": "Bearer " + create_session(other, db)}
        self.url = "/documents/doc/learning-units"

    def test_password_and_sessions(self):
        self.assertFalse(verify_password("wrong-password", hash_password("Password-1234")))
        self.assertEqual(self.client.post("/auth/login", json={"identifier": "guru@example.org", "password": "wrong-password"}).status_code, 401)
        self.assertEqual(self.client.post("/auth/login", json={"identifier": "student", "password": "Password-1234"}).status_code, 401)
        response = self.client.post("/auth/login", json={"identifier": "teacher", "password": "Password-1234"})
        headers = {"Authorization": "Bearer " + response.json()["token"]}
        self.assertEqual(self.client.get("/auth/me", headers=headers).status_code, 200)
        self.client.post("/auth/logout", headers=headers)
        self.assertEqual(self.client.get("/auth/me", headers=headers).status_code, 401)

    def test_new_student_requires_profiling_and_profile_persists(self):
        response = self.client.post("/auth/register", json={"name": "Siswa Baru", "email": "baru@example.org",
                                                            "role": "SISWA", "password": "Password-1234", "grade": 7})
        self.assertEqual(response.status_code, 201)
        created = response.json()["user"]
        self.assertIsNone(created["learning_style"])
        self.assertIsNone(created["modality_scores"])
        headers = {"Authorization": "Bearer " + response.json()["token"]}
        url = f"/users/{created['id']}"

        self.assertEqual(self.client.patch(url, json={"learning_style": "LAINNYA"}, headers=headers).status_code, 422)
        self.assertEqual(self.client.patch(url, json={"modality_scores": {"visual": 900}}, headers=headers).status_code, 422)
        self.assertEqual(self.client.patch(url, json={"email": "guru@example.org"}, headers=headers).status_code, 409)
        self.assertEqual(self.client.patch("/users/student", json={"name": "Diambil"}, headers=headers).status_code, 403)
        saved = self.client.patch(url, headers=headers, json={
            "learning_style": "AUDITORI", "modality_scores": {"visual": 30, "audio": 50, "practice": 20}})
        self.assertEqual(saved.status_code, 200)

        again = self.client.post("/auth/login", json={"identifier": "baru@example.org", "password": "Password-1234"})
        self.assertEqual(again.json()["user"]["learning_style"], "AUDITORI")
        self.assertEqual(again.json()["user"]["email"], "baru@example.org")
        self.client.post("/auth/logout", headers=headers)
        self.assertEqual(self.client.patch(url, json={"name": "X"}, headers=headers).status_code, 401)

    def test_infographic_keeps_sourced_blocks_and_drops_invented_numbers(self):
        sources = [segment(1, INFO_SOURCE)]
        self.assertEqual(validate_infographic(infographic(), sources)["metrics"][0]["value_pct"], 72)

        invented = infographic(
            metrics=[{"label": "Akurasi", "value_pct": 72, "explanation": "", "source_refs": ref("Akurasi model mencapai 72%")},
                     {"label": "Efisiensi", "value_pct": 86.5, "explanation": "", "source_refs": ref("Smoothing Laplace menambahkan satu")}],
            key_facts=[{"label": "Rumus karangan", "value": "E = mc^2", "explanation": "", "source_refs": ref("Model bigram memprediksi kata")}],
            pillars=[{"name": "Palsu", "desc": "Tidak ada di materi.", "source_refs": ref("kalimat yang tidak pernah ada")}],
        )
        cleaned = validate_infographic(invented, sources, lenient=True)
        self.assertEqual([m["value_pct"] for m in cleaned["metrics"]], [72])  # 86.5 is not in its quote
        self.assertEqual(cleaned["key_facts"], [])
        self.assertEqual(cleaned["pillars"], [])
        self.assertEqual(cleaned["analogy"]["title"], "Seperti menebak lirik lagu")  # allowed, labelled in the UI

        with self.assertRaises(ValueError):  # teacher edits are strict
            validate_infographic(invented, sources)
        with self.assertRaises(ValueError):  # anchors are required
            validate_infographic(infographic(big_idea={"text": "Tanpa sumber", "source_refs": ref("tidak ada")}), sources, lenient=True)

    def test_quote_matching_ignores_case_and_punctuation_only(self):
        from app.services.learning_unit_service import _quote_in
        source = "Cyber crime adalah “kejahatan” yang dilakukan—melalui jaringan komputer."
        self.assertTrue(_quote_in('cyber crime adalah "kejahatan" yang dilakukan', source))
        self.assertTrue(_quote_in("dilakukan - melalui jaringan", source))
        self.assertFalse(_quote_in("kejahatan yang dilakukan melalui internet", source))  # different word
        self.assertFalse(_quote_in("kejahatan dilakukan melalui jaringan", source))  # word removed
        self.assertFalse(_quote_in("rime adalah", source))  # must start on a word boundary

    def test_diagram_keeps_sourced_nodes_and_valid_structure(self):
        sources = [segment(1, INFO_SOURCE)]
        node = lambda id, label, parent=None, quote="Model bigram memprediksi kata": {
            "id": id, "label": label, "parent": parent, "detail": "", "source_refs": ref(quote)}
        mindmap = {"kind": "mindmap", "title": "Peta N-Gram", "edges": [], "nodes": [
            node("root", "N-Gram"), node("bigram", "Bigram", "root"), node("smooth", "Smoothing", "root", "Smoothing Laplace"),
            node("fake", "Karangan", "root", "kalimat yang tidak ada"), node("child", "Anak karangan", "fake")]}
        diagram = validate_infographic(infographic(diagram=mindmap), sources, lenient=True)["diagram"]
        self.assertEqual([n["id"] for n in diagram["nodes"]], ["root", "bigram", "smooth"])  # fake branch removed

        flow = {"kind": "flowchart", "title": "Alur", "nodes": [node("a", "Hitung"), node("b", "Bagi"), node("c", "Lepas")],
                "edges": [{"source": "a", "target": "b", "label": "lalu"}]}
        self.assertEqual([n["id"] for n in validate_infographic(infographic(diagram=flow), sources, lenient=True)["diagram"]["nodes"]], ["a", "b"])
        # A root whose quote fails borrows the validated big-idea source; its sourced branches survive.
        unsourced_root = dict(mindmap, nodes=[node("root", "N-Gram", quote="judul yang tidak ada"), *mindmap["nodes"][1:3]])
        kept = validate_infographic(infographic(diagram=unsourced_root), sources, lenient=True)["diagram"]
        self.assertEqual([n["id"] for n in kept["nodes"]], ["root", "bigram", "smooth"])
        self.assertEqual(kept["nodes"][0]["source_refs"], infographic()["big_idea"]["source_refs"])
        broken = {"kind": "mindmap", "title": "Dua akar", "edges": [], "nodes": [node("x", "Satu"), node("y", "Dua")]}
        self.assertIsNone(validate_infographic(infographic(diagram=broken), sources, lenient=True)["diagram"])

        with self.assertRaises(ValueError):  # teacher edit with an unsourced node
            validate_infographic(infographic(diagram=mindmap), sources)
        self.assertEqual(validate_infographic(infographic(diagram=dict(mindmap, nodes=mindmap["nodes"][:3])), sources)["diagram"]["kind"], "mindmap")

    def test_ai_art_is_text_free_and_redrawn_once_if_lettered(self):
        from app.services import ai_image_service
        info = validate_infographic(infographic(), [segment(1, INFO_SOURCE)])
        prompts = []
        def fake_draw(prompt, aspect_ratio="1:1"):
            prompts.append((prompt, aspect_ratio))
            kind = b"hero" if aspect_ratio == "16:9" else b"icon"
            return kind + str(sum(1 for _, r in prompts if r == aspect_ratio)).encode()
        # The first hero comes back with lettering and is redrawn clean; the icon is clean first time.
        fake_read = lambda image: "SMOOTHING" if image == b"hero1" else "TIDAK ADA"
        with patch.object(ai_image_service, "draw", side_effect=fake_draw), \
             patch.object(ai_image_service, "read_text", side_effect=fake_read):
            art = ai_image_service.create_art("doc", info)
        self.assertTrue(art["hero_url"])
        self.assertEqual([icon["label"] for icon in art["icons"]], ["Smoothing"])
        self.assertEqual(art["lettered"], [])
        self.assertTrue(all("Absolutely no text" in prompt for prompt, _ in prompts))
        self.assertEqual(sorted(ratio for _, ratio in prompts), ["16:9", "16:9", "1:1"])  # hero redrawn once
        hero_file = Path(settings.UPLOADS_DIR) / "images" / art["hero_url"].rsplit("/", 1)[1]
        self.assertEqual(hero_file.read_bytes(), b"hero2")  # the clean redraw is the one kept
        ai_image_service.remove_files(art)

        # A picture that keeps its lettering after one redraw is kept but flagged for the teacher.
        with patch.object(ai_image_service, "draw", side_effect=fake_draw) as draw, \
             patch.object(ai_image_service, "read_text", return_value="KATA ASING"):
            flagged = ai_image_service.create_art("doc", info)
        self.assertEqual(draw.call_count, 4)  # hero and icon, each drawn twice
        self.assertEqual(sorted(flagged["lettered"]), ["Ikon Smoothing", "Ilustrasi utama"])

        paths = [Path(settings.UPLOADS_DIR) / "images" / url.rsplit("/", 1)[1] for url in ai_image_service.image_urls(flagged)]
        self.assertTrue(all(path.exists() for path in paths))
        ai_image_service.remove_file("/uploads/images/../../eduadapt.db")  # refused: not an AI image path
        ai_image_service.remove_files(flagged)
        self.assertFalse(any(path.exists() for path in paths))

    def test_icon_whitespace_is_trimmed(self):
        try:
            import io
            from PIL import Image
        except ImportError:
            self.skipTest("Pillow not installed")
        from app.services.ai_image_service import trim_whitespace
        canvas = Image.new("RGB", (1000, 1000), (255, 255, 255))
        canvas.paste(Image.new("RGB", (200, 100), (30, 120, 200)), (600, 700))  # small off-centre icon
        buffer = io.BytesIO()
        canvas.save(buffer, format="PNG")
        trimmed = Image.open(io.BytesIO(trim_whitespace(buffer.getvalue())))
        self.assertEqual(trimmed.size, (232, 232))  # 200px icon + 8% padding each side, square
        self.assertEqual(trimmed.getpixel((116, 116)), (30, 120, 200))  # icon now centred
        self.assertEqual(trim_whitespace(b"not an image"), b"not an image")  # never breaks the pipeline

    def test_infographic_goes_through_review_before_students_see_it(self):
        with SessionLocal() as db:
            db.get(GroundedDocument, "doc").raw_text = INFO_SOURCE
            db.commit()
        def reply(prompt, **kwargs):
            payload = json.loads(prompt)
            if "sources" in payload:  # the whole-document infographic request
                return json.dumps(infographic())
            return json.dumps({"units": [unit(payload["source"]["id"], "Model bigram memprediksi kata")]})
        with patch("app.services.gemini_service._call_gemini_text", side_effect=reply), \
             patch("app.services.ai_image_service.draw", return_value=b"\x89PNG fake image"), \
             patch("app.services.ai_image_service.read_text", return_value="TIDAK ADA"):
            self.assertEqual(self.client.post(self.url + "/generate", headers=self.teacher).status_code, 202)
        draft = self.client.get(self.url + "/draft", headers=self.teacher).json()
        self.assertEqual(draft["infographic"]["title"], "Model Bahasa N-Gram")
        self.assertEqual((draft["image"]["state"], draft["image"]["lettered"]), ("READY", []))
        self.assertEqual([icon["label"] for icon in draft["image"]["icons"]], ["Smoothing"])
        first_image = Path(settings.UPLOADS_DIR) / "images" / draft["image"]["hero_url"].rsplit("/", 1)[1]
        self.assertTrue(first_image.exists())
        student_view = self.client.get(self.url, headers=self.student).json()
        self.assertIsNone(student_view["infographic"])
        self.assertIsNone(student_view["image"])
        self.assertEqual(self.client.post(self.url + "/image", headers=self.student).status_code, 403)

        edited = dict(draft["infographic"], title="N-Gram untuk Kelas 10")
        saved = self.client.put(self.url + "/draft", headers=self.teacher,
                                json={"revision": draft["revision"], "units": draft["units"], "infographic": edited})
        self.assertEqual(saved.status_code, 200)
        bad = dict(edited, metrics=[{"label": "X", "value_pct": 99, "explanation": "", "source_refs": ref("Model bigram memprediksi kata")}])
        rejected = self.client.put(self.url + "/draft", headers=self.teacher,
                                   json={"revision": saved.json()["revision"], "units": draft["units"], "infographic": bad})
        self.assertEqual(rejected.status_code, 422)

        self.assertEqual(self.client.post(self.url + "/approve", headers=self.teacher,
                                          json={"revision": saved.json()["revision"]}).status_code, 200)
        published = self.client.get(self.url, headers=self.student).json()
        self.assertEqual(published["infographic"]["title"], "N-Gram untuk Kelas 10")
        self.assertEqual(published["visual"], "PUBLISHED")
        self.assertEqual(published["image"], {"state": "READY", "hero_url": draft["image"]["hero_url"],
                                              "icons": draft["image"]["icons"]})  # no check report for students

        # Redrawing the draft artwork keeps the published one; removing the draft artwork keeps it too.
        with patch("app.services.ai_image_service.draw", return_value=b"\x89PNG second"), \
             patch("app.services.ai_image_service.read_text", return_value="TIDAK ADA"):
            self.assertEqual(self.client.post(self.url + "/image", headers=self.teacher).status_code, 202)
        second = self.client.get(self.url + "/draft", headers=self.teacher).json()["image"]
        self.assertNotEqual(second["hero_url"], draft["image"]["hero_url"])
        self.assertTrue(first_image.exists())  # still published
        self.assertEqual(self.client.delete(self.url + "/image", headers=self.teacher).status_code, 200)
        self.assertFalse((Path(settings.UPLOADS_DIR) / "images" / second["hero_url"].rsplit("/", 1)[1]).exists())
        self.assertEqual(self.client.get(self.url, headers=self.student).json()["image"]["hero_url"], draft["image"]["hero_url"])

    def test_practice_stages_follow_the_approved_content(self):
        from app.services.practice_service import practice_stage_ids
        node = lambda id, parent=None: {"id": id, "label": id, "parent": parent, "detail": "", "source_refs": []}
        info = {"flow_steps": [{}, {}, {}], "diagram": {"kind": "mindmap", "nodes": [
            node("r"), node("a", "r"), node("b", "r"), node("a1", "a"), node("b1", "b")]}}
        seq_unit = {"id": "unit_2", "visual": {"kind": "sequence", "nodes": [{}, {}, {}]}}
        short_unit = {"id": "unit_3", "visual": {"kind": "sequence", "nodes": [{}, {}]}}
        self.assertEqual(practice_stage_ids(info, [seq_unit, short_unit]),
                         ["sequence-main", "map-branches", "map-details", "sequence-unit-unit_2"])
        timeline = {"flow_steps": [], "diagram": {"kind": "timeline", "nodes": [node("x"), node("y"), node("z")]}}
        self.assertEqual(practice_stage_ids(timeline, []), ["sequence-main"])
        self.assertEqual(practice_stage_ids({"flow_steps": [{}, {}]}, []), [])  # nothing worth practising

    def test_harder_practice_stages_stay_locked_until_easier_ones_are_done(self):
        node = lambda id, parent=None: {"id": id, "label": f"Label {id}", "parent": parent, "detail": "", "source_refs": ref("Model bigram memprediksi kata")}
        info = validate_infographic(infographic(
            flow_steps=[{"title": f"Langkah {i}", "desc": "Langkah dalam materi.", "caption": "", "source_refs": ref("Model bigram memprediksi kata")} for i in range(3)],
            diagram={"kind": "mindmap", "title": "Peta", "edges": [], "nodes": [
                node("r"), node("a", "r"), node("b", "r"), node("a1", "a"), node("b1", "b")]}),
            [segment(1, INFO_SOURCE)])
        with SessionLocal() as db:
            db.add(AdaptiveDocument(document_id="doc", source_segments=[segment(1, INFO_SOURCE)], generation_state="DRAFT",
                                    revision=1, draft_units=[unit()], published_units=[unit()], published_infographic=info,
                                    published_revision=1))
            db.commit()
        url = "/documents/doc/practice-progress"
        start = self.client.get(url, headers=self.student).json()
        self.assertEqual(start, {"stages": ["sequence-main", "map-branches", "map-details"], "completed": [], "xp": 0})

        skipped = self.client.post(url, headers=self.student, json={"stage": "map-details", "xp": 30})
        self.assertEqual(skipped.status_code, 409)  # hard level before the easy ones
        self.assertEqual(self.client.post(url, headers=self.student, json={"stage": "sequence-main", "xp": 99}).status_code, 422)
        self.assertEqual(self.client.post(url, headers=self.student, json={"stage": "sequence-main", "xp": 25}).json()["completed"], ["sequence-main"])
        self.assertEqual(self.client.post(url, headers=self.student, json={"stage": "map-details", "xp": 30}).status_code, 409)
        self.client.post(url, headers=self.student, json={"stage": "map-branches", "xp": 20})
        done = self.client.post(url, headers=self.student, json={"stage": "map-details", "xp": 30}).json()
        self.assertEqual((done["completed"], done["xp"]), (["sequence-main", "map-branches", "map-details"], 75))
        again = self.client.post(url, headers=self.student, json={"stage": "sequence-main", "xp": 5}).json()
        self.assertEqual(again["xp"], 75)  # repeating a finished stage keeps the first result
        self.assertEqual(self.client.get(url, headers=self.student).json()["completed"], done["completed"])  # persisted

        self.assertEqual(self.client.post(url, headers=self.teacher, json={"stage": "sequence-main", "xp": 10}).status_code, 403)
        self.assertEqual(self.client.post(url, headers=self.student, json={"stage": "tidak-ada", "xp": 10}).status_code, 409)
        self.assertEqual(self.client.get(url, headers=self.other).status_code, 403)  # not in this class

    def test_migration_upgrades_an_older_adaptive_documents_table(self):
        from sqlalchemy import inspect, text
        from app.core.database import check_and_migrate_db
        # Same shape as databases created before published_sources existed.
        with engine.begin() as conn:
            conn.execute(text("DROP TABLE adaptive_documents"))
            conn.execute(text(
                "CREATE TABLE adaptive_documents (document_id VARCHAR(64) PRIMARY KEY, source_segments JSON NOT NULL, "
                "source_hash VARCHAR(64), generation_state VARCHAR(24) NOT NULL, error TEXT, generation_token VARCHAR(64), "
                "started_at DATETIME, revision INTEGER NOT NULL, draft_units JSON NOT NULL, published_units JSON NOT NULL, "
                "published_revision INTEGER, approved_by VARCHAR(64), approved_at DATETIME)"))
            conn.execute(text("INSERT INTO adaptive_documents (document_id, source_segments, generation_state, revision, "
                              "draft_units, published_units) VALUES ('old', '[]', 'DRAFT', 1, '[]', '[]')"))
        check_and_migrate_db()
        check_and_migrate_db()  # idempotent
        self.assertIn("published_sources", {c["name"] for c in inspect(engine).get_columns("adaptive_documents")})

        # Upload schedules podcast and unit jobs; keep every AI/TTS/embedding call offline.
        with patch("app.services.gemini_service._call_gemini_text", side_effect=RuntimeError("no AI")), \
             patch("app.services.gateway_service.AIGatewayService.generate_speech", side_effect=RuntimeError("no TTS")), \
             patch("app.services.vector_store.get_batch_text_embeddings", side_effect=lambda texts, **_: [[0.0] * 8 for _ in texts]):
            response = self.client.post("/documents/upload-file", headers=self.teacher, data={"classroom_id": "class", "title": "Modul"},
                                        files={"file": ("modul.txt", b"Fotosintesis terjadi di daun tumbuhan hijau.", "text/plain")})
        self.assertEqual(response.status_code, 201)
        with SessionLocal() as db:
            self.assertEqual(db.get(AdaptiveDocument, "old").published_sources, [])
            self.assertIsNotNone(db.get(AdaptiveDocument, response.json()["id"]))

    def test_new_accounts_only_see_their_own_data(self):
        def register(name, role):
            r = self.client.post("/auth/register", json={"name": name, "email": f"{name}@example.org",
                                                        "role": role, "password": "Password-1234"})
            return r.json()["user"], {"Authorization": "Bearer " + r.json()["token"]}

        sujana, sujana_h = register("sujana", "GURU")
        self.assertEqual(self.client.get("/classrooms", headers=sujana_h).json(), [])
        self.assertEqual(self.client.get("/documents", headers=sujana_h).json(), [])
        self.assertEqual(self.client.get("/tasks", headers=sujana_h).json(), [])
        self.assertEqual(self.client.get("/submissions", headers=sujana_h).json(), [])
        self.assertEqual([u["id"] for u in self.client.get("/users", headers=sujana_h).json()], [sujana["id"]])
        self.assertEqual(self.client.get("/classrooms/class", headers=sujana_h).status_code, 404)
        self.assertEqual(self.client.post("/tasks", headers=sujana_h, json={
            "classroom_id": "class", "classroom_name": "Kelas", "type": "quiz", "title": "Susupan", "source_reference": "x"}).status_code, 403)
        for path in ("/classrooms", "/documents", "/users"):
            self.assertEqual(self.client.get(path).status_code, 401)

        # The seeded owner still sees their class; its student sees it too.
        self.assertEqual([c["id"] for c in self.client.get("/classrooms", headers=self.teacher).json()], ["class"])
        self.assertEqual([d["id"] for d in self.client.get("/documents", headers=self.student).json()], ["doc"])

        pupil, pupil_h = register("pupil", "SISWA")
        self.assertEqual(self.client.get("/documents", headers=pupil_h).json(), [])
        progress = self.client.get(f"/users/{pupil['id']}/progress", headers=pupil_h).json()
        self.assertEqual((progress["visual_total"], progress["audio_minutes"], progress["overall_progress"]), (0, 0, 0))
        self.assertEqual(pupil["xp_total"], 0)
        self.assertEqual(self.client.get(f"/users/{pupil['id']}/progress", headers=sujana_h).status_code, 404)

        joined = self.client.post("/classrooms/join", headers=pupil_h, json={"join_code": "abc123", "student_id": "spoofed"})
        self.assertEqual(joined.status_code, 200)
        self.assertIn(pupil["id"], joined.json()["classroom"]["student_ids"])
        self.assertEqual([d["id"] for d in self.client.get("/documents", headers=pupil_h).json()], ["doc"])

    def test_sources_cover_tail_and_validate_quotes(self):
        sources = make_segments([(1, "A" * 9000), (2, ""), (3, "Konsep penting pada halaman terakhir.")])
        # The long page is split; the empty page is skipped; the short tail page joins the previous part.
        self.assertEqual([s["label"] for s in sources], ["Halaman 1", "Halaman 1–3"])
        self.assertTrue(sources[-1]["text"].endswith("Konsep penting pada halaman terakhir."))
        self.assertEqual(sum(s["text"].count("A") for s in sources), 9000)
        slides = make_segments([(n, f"Slide {n} berisi beberapa baris materi.") for n in range(1, 25)])
        self.assertEqual(len(slides), 1)
        self.assertEqual((slides[0]["page"], slides[0]["label"]), (1, "Halaman 1–24"))
        with self.assertRaises(ValueError):
            validate_units([unit()], sources)
        with self.assertRaises(ValueError):
            make_segments([(None, "")])
        with self.assertRaises(ValueError):
            make_segments([(None, "a" * 160001)])
        self.assertIsNone(make_segments([(None, "Teks manual yang cukup panjang.")])[0]["page"])

    def test_visual_forms_and_source_validation(self):
        quote = "Rebus air terlebih dahulu, kemudian seduh teh. Teh panas lebih hangat daripada teh dingin."
        sources = make_segments([(1, quote)])
        ref = {"segment_id": "seg_1", "quote": quote}
        nodes = [{"id": "air", "label": "Rebus air", "explanation": "Rebus air terlebih dahulu.", "source_refs": [ref]},
                 {"id": "teh", "label": "Seduh teh", "explanation": "Kemudian seduh teh.", "source_refs": [ref]}]
        forms = [
            {"kind": "concept_map", "title": "Hubungan langkah", "nodes": nodes,
             "links": [{"source": "air", "target": "teh", "label": "dilanjutkan dengan", "source_refs": [ref]}]},
            {"kind": "sequence", "title": "Menyeduh teh", "nodes": nodes},
            {"kind": "comparison", "title": "Suhu teh", "columns": ["Teh panas", "Teh dingin"],
             "rows": [{"aspect": "Suhu relatif", "values": ["Lebih hangat", "Lebih dingin"], "source_refs": [ref]}]},
        ]
        for visual in forms:
            with self.subTest(kind=visual["kind"]):
                item = {**unit(quote=quote), "suggested_visual": visual["kind"], "visual": visual}
                self.assertEqual(validate_units([item], sources)[0]["visual"]["kind"], visual["kind"])
                invalid = json.loads(json.dumps(item))
                content = invalid["visual"].get("rows") or invalid["visual"]["nodes"]
                content[0]["source_refs"][0]["quote"] = "Kutipan ini tidak ada di sumber."
                with self.assertRaises(ValueError):
                    validate_units([invalid], sources)
        invalid = {**unit(quote=quote), "suggested_visual": "concept_map", "visual": forms[0]}
        invalid["visual"]["links"][0]["target"] = "missing"
        with self.assertRaises(ValueError):
            validate_units([invalid], sources)
        invalid["visual"] = forms[2]
        invalid["suggested_visual"] = "comparison"
        invalid["visual"]["rows"][0]["values"] = ["Satu nilai saja"]
        with self.assertRaises(ValueError):
            validate_units([invalid], sources)
        invalid["visual"] = forms[1]
        with self.assertRaises(ValueError):
            validate_units([invalid], sources)
        legacy = unit(quote=quote)
        legacy["suggested_visual"] = "concept_map"
        self.assertIsNone(validate_units([legacy], sources)[0]["visual"])

    def test_all_segments_reach_generator(self):
        sources = [segment(1, "Kucing termasuk hewan mamalia."), segment(2, "Burung mempunyai sayap untuk bergerak.")]
        calls = []
        def reply(prompt, **kwargs):
            source = json.loads(prompt)["source"]
            calls.append(source["id"])
            return json.dumps({"units": [unit(source["id"], source["text"])]})
        with patch("app.services.gemini_service._call_gemini_text", side_effect=reply):
            result, skipped = generate_units(SimpleNamespace(title="Hewan"), SimpleNamespace(grade=4, subject="IPA"), sources)
        self.assertEqual(calls, ["seg_1", "seg_2"])
        self.assertEqual(len({u["id"] for u in result}), 2)
        self.assertEqual(skipped, [])

    def test_one_invalid_segment_is_skipped_and_reported(self):
        sources = [segment(1, "Kucing termasuk hewan mamalia."), segment(2, "• Smoothing mengurangi nol pada model."),
                   segment(3, "Burung mempunyai sayap untuk bergerak.")]
        def reply(prompt, **kwargs):
            source = json.loads(prompt)["source"]
            if source["id"] == "seg_3":
                return "bukan json"
            if source["id"] == "seg_1":  # two units; the second cites text that is not in the source
                return json.dumps({"units": [unit("seg_1", source["text"]), unit("seg_1", "Kutipan karangan AI saja.")]})
            return json.dumps({"units": [unit("seg_2", "• Smoothing")]})  # short quote from the N-Gram report
        with patch("app.services.gemini_service._call_gemini_text", side_effect=reply) as ai:
            result, skipped = generate_units(SimpleNamespace(title="Campuran"), SimpleNamespace(grade=10, subject="TIK"), sources)
        self.assertEqual(len(result), 2)
        self.assertEqual(skipped, ["Halaman 3"])
        self.assertEqual(ai.call_count, 4)  # seg_3 is retried once before being skipped

    def test_review_and_retry_never_touch_audio(self):
        audio_dir = Path(settings.UPLOADS_DIR) / "podcasts"
        audio_dir.mkdir(parents=True, exist_ok=True)
        audio = audio_dir / "doc_ep1.wav"
        audio.write_bytes(b"RIFF" + b"a" * 300)
        original = audio.read_bytes()
        item = unit()
        item["suggested_visual"] = "concept_map"
        ref = item["source_refs"][0]
        item["visual"] = {"kind": "concept_map", "title": "Klasifikasi kucing",
                          "nodes": [{"id": key, "label": label, "explanation": ref["quote"], "source_refs": [ref]}
                                    for key, label in [("cat", "Kucing"), ("mammal", "Mamalia")]],
                          "links": [{"source": "cat", "target": "mammal", "label": "termasuk", "source_refs": [ref]}]}
        with patch("app.services.gemini_service._call_gemini_text", return_value=json.dumps({"units": [item]})), \
             patch("app.services.gateway_service.AIGatewayService.generate_speech", side_effect=AssertionError("TTS must not run")):
            self.assertEqual(self.client.post(self.url + "/generate").status_code, 401)
            self.assertEqual(self.client.post(self.url + "/generate", headers=self.other).status_code, 403)
            self.assertEqual(self.client.post(self.url + "/generate", headers=self.student).status_code, 403)
            self.assertEqual(self.client.post(self.url + "/generate", headers=self.teacher).status_code, 202)
            draft = self.client.get(self.url + "/draft", headers=self.teacher).json()
            self.assertEqual(draft["state"], "DRAFT")
            self.assertEqual(self.client.get(self.url + "/draft", headers=self.student).status_code, 403)
            self.assertEqual(self.client.get(self.url, headers=self.student).json()["units"], [])
            self.assertEqual(self.client.post(self.url + "/approve", headers=self.teacher, json={"revision": 99}).status_code, 409)
            self.assertEqual(self.client.post(self.url + "/approve", headers=self.teacher, json={"revision": draft["revision"]}).status_code, 200)
            published = self.client.get(self.url, headers=self.student).json()
            self.assertNotIn("comprehension_checks", published["units"][0])
            self.assertEqual(published["units"][0]["visual"]["kind"], "concept_map")
            draft["units"][0]["visual"]["title"] = "Judul draf diperbarui"
            self.assertEqual(self.client.put(self.url + "/draft", headers=self.teacher,
                                           json={"revision": draft["revision"], "units": draft["units"]}).status_code, 200)
            self.assertEqual(self.client.get(self.url, headers=self.student).json()["units"], published["units"])
            self.assertEqual(self.client.post(self.url + "/approve", headers=self.teacher,
                                            json={"revision": draft["revision"]}).status_code, 409)
            with patch("app.services.gemini_service._call_gemini_text", return_value="not json"):
                self.client.post(self.url + "/generate", headers=self.teacher)
            failed = self.client.get(self.url, headers=self.student).json()
            self.assertEqual(failed["state"], "ERROR")
            self.assertEqual(failed["units"], published["units"])
            self.assertEqual(self.client.get("/documents/doc/podcast-audio").content, original)
            self.assertEqual(audio.read_bytes(), original)
            with SessionLocal() as db:
                self.assertEqual(db.get(GroundedDocument, "doc").podcast_script, "Existing podcast")

    def test_cached_podcast_still_works_and_missing_audio_uses_tts(self):
        audio_dir = Path(settings.UPLOADS_DIR) / "podcasts"
        audio_dir.mkdir(parents=True, exist_ok=True)
        for path in audio_dir.glob("doc_*"):
            path.unlink()
        game = json.dumps({"reactorTitle": "Reaktor", "items": []})
        with patch("app.services.gateway_service.AIGatewayService.generate_speech", return_value=b"RIFF" + b"b" * 300) as tts, \
             patch("app.services.gemini_service._call_gemini_text", return_value=game) as text_ai:
            with SessionLocal() as db:
                generate_document_adaptive_assets("doc", db)
                generate_document_adaptive_assets("doc", db)
                restored = db.get(GroundedDocument, "doc")
                self.assertFalse(restored.game_config_json)  # old kinesthetic games are no longer generated
                self.assertEqual(restored.podcast_script, "[Mamalia]\nExisting podcast")
            self.assertEqual(tts.call_count, 1)
            self.assertEqual(text_ai.call_count, 0)  # the podcast pipeline makes no extra AI calls
        self.assertEqual(self.client.get("/documents/doc/podcast-audio").status_code, 200)
        self.assertEqual(self.client.get("/documents/doc/visual-image").status_code, 409)


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        engine.dispose()
        TEST_DIR.cleanup()
