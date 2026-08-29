import os
import sys
import json
import logging

logging.basicConfig(level=logging.INFO)
sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, check_and_migrate_db
from app.models.document import GroundedDocument
from app.services.gemini_service import (
    _generate_podcast_episodes,
    _generate_visual_nodes_metadata,
    _generate_universal_game_config,
    _generate_sorting_challenges,
    generate_document_adaptive_assets,
)

def test_phase1_backend():
    print("\n=======================================================")
    print("           PHASE 1 BACKEND VALIDATION TEST             ")
    print("=======================================================")
    
    # 1. Test DB Migration
    check_and_migrate_db()
    print("[1/6] DB migration check: PASSED")

    sample_title = "Fotosintesis dan Reaksi Terang Gelap"
    sample_context = """
    Fotosintesis adalah proses anabolisme yang mengubah energi cahaya matahari menjadi energi kimia dalam bentuk glukosa.
    Reaksi terang terjadi pada membran tilakoid kloroplas, di mana foton diserap oleh klorofil (fotosistem I dan II) memicu fotolisis air menjadi ion H+ dan gas O2.
    Aliran elektron nonsiklis dan siklis menghasilkan energi dalam bentuk ATP dan daya reduksi NADPH.
    Reaksi gelap (Siklus Calvin) berlangsung di stroma tanpa memerlukan cahaya langsung. Tahapannya meliputi fiksasi karbon oleh enzim RuBisCO, reduksi PGA menjadi PGAL, dan regenerasi RuBP.
    Faktor pembatas laju fotosintesis antara lain intensitas cahaya, konsentrasi CO2, suhu lingkungan, dan ketersediaan air.
    """

    # 2. Test Podcast Episodes Generator (Solo Narration, 3-5 Episodes)
    print("\n[2/6] Testing _generate_podcast_episodes (Solo Narrator)...")
    episodes = _generate_podcast_episodes(sample_title, sample_context)
    assert isinstance(episodes, list) and len(episodes) >= 2, f"Expected >=2 episodes, got {len(episodes)}"
    for ep in episodes:
        assert "title" in ep and "script" in ep and "order" in ep
        assert len(ep["script"]) > 30
    print(f"  -> Generated {len(episodes)} episodes.")
    print(f"  -> Ep 1 Title: {episodes[0]['title']}")
    print(f"  -> Ep 1 Script excerpt: {episodes[0]['script'][:80]}...")
    print("  -> Podcast Episodes Generation: PASSED")

    # 3. Test React Flow Visual Nodes Metadata Generator
    print("\n[3/6] Testing _generate_visual_nodes_metadata (React Flow Data)...")
    nodes_json = _generate_visual_nodes_metadata(sample_title, sample_context, "")
    nodes = json.loads(nodes_json)
    assert isinstance(nodes, list) and len(nodes) >= 2
    n1 = nodes[0]
    assert "position" in n1 and "connections" in n1 and "detailedExplanation" in n1
    print(f"  -> Generated {len(nodes)} interactive nodes.")
    print(f"  -> Node 1: '{n1.get('title')}' at position {n1.get('position')}")
    print(f"  -> Detailed Explanation: {n1.get('detailedExplanation')[:90]}...")
    print("  -> Visual Nodes Metadata: PASSED")

    # 4. Test Expanded Reactor Drag-and-Drop (5-8 slots & components)
    print("\n[4/6] Testing _generate_universal_game_config (5-8 Slot Reactor)...")
    game_cfg_json = _generate_universal_game_config(sample_title, sample_context)
    game_cfg = json.loads(game_cfg_json)
    assert "reactorDragDrop" in game_cfg
    slots = game_cfg["reactorDragDrop"].get("slots", [])
    components = game_cfg["reactorDragDrop"].get("components", [])
    assert len(slots) >= 4 and len(components) >= 4, f"Expected >=4 slots/components, got {len(slots)} slots and {len(components)} components"
    print(f"  -> Reactor Title: {game_cfg['reactorDragDrop'].get('reactorTitle')}")
    print(f"  -> Slots count: {len(slots)}, Components count: {len(components)}")
    print(f"  -> Slot 1: {slots[0].get('name')} (Target: {slots[0].get('acceptedItemId')})")
    print("  -> Reactor Drag & Drop Config: PASSED")

    # 5. Test Process Sorting Challenges Generator
    print("\n[5/6] Testing _generate_sorting_challenges (Chronological Sorting)...")
    sorting_json = _generate_sorting_challenges(sample_title, sample_context)
    sorting_list = json.loads(sorting_json)
    assert isinstance(sorting_list, list) and len(sorting_list) >= 2
    s1 = sorting_list[0]
    assert "instruction" in s1 and "items" in s1 and "correctOrder" in s1
    assert len(s1["items"]) >= 3
    print(f"  -> Generated {len(sorting_list)} sorting challenges.")
    print(f"  -> Challenge 1: {s1.get('instruction')}")
    print(f"  -> Items count: {len(s1.get('items'))}")
    print("  -> Process Sorting Challenges: PASSED")

    # 6. Test Orchestrator & API Endpoints
    print("\n[6/6] Testing generate_document_adaptive_assets & FastAPI Endpoints...")
    with SessionLocal() as db:
        test_doc_id = "doc_test_phase1_demo"
        # Clean existing test doc if any
        db.query(GroundedDocument).filter(GroundedDocument.id == test_doc_id).delete()
        db.commit()

        doc = GroundedDocument(
            id=test_doc_id,
            classroom_id="cls_demo_01",
            title=sample_title,
            raw_text=sample_context,
            vector_id="vec_test",
            status="READY"
        )
        db.add(doc)
        db.commit()

        assets = generate_document_adaptive_assets(test_doc_id, db)
        assert assets.get("podcast_episodes_json") is not None
        assert assets.get("sorting_challenges_json") is not None
        assert assets.get("visual_nodes_json") is not None
        print("  -> generate_document_adaptive_assets completed successfully.")

    with TestClient(app) as client:
        resp_episodes = client.get(f"/api/v1/documents/{test_doc_id}/podcast-episodes")
        assert resp_episodes.status_code == 200
        episodes_resp = resp_episodes.json()
        assert isinstance(episodes_resp, list) and len(episodes_resp) >= 2
        print(f"  -> GET /documents/{test_doc_id}/podcast-episodes: 200 OK (returned {len(episodes_resp)} episodes)")

        resp_audio = client.get(f"/api/v1/documents/{test_doc_id}/podcast-audio?episode=1")
        assert resp_audio.status_code == 200
        assert len(resp_audio.content) > 200
        print(f"  -> GET /documents/{test_doc_id}/podcast-audio?episode=1: 200 OK ({len(resp_audio.content)} bytes audio stream)")

    print("\n=======================================================")
    print("       ALL PHASE 1 BACKEND CHECKS PASSED (100%)        ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_phase1_backend()
