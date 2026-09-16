import os
import sys
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_all_gemini_tools")

sys.path.insert(0, os.path.abspath("."))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal, engine, Base
from app.models.document import GroundedDocument
from app.models.classroom import Classroom
from app.models.user import User
from app.services.vector_store import (
    get_text_embedding,
    get_batch_text_embeddings,
    chunk_text,
    index_document,
    search_relevant_chunks,
    ensure_vector_index_loaded
)
from app.services.gemini_service import (
    chat_with_gemini,
    generate_ai_quiz,
    generate_visual_mindmap,
    _generate_conversational_podcast,
    _generate_visual_nodes_metadata,
    _generate_universal_game_config,
    _generate_fill_in_the_blank,
    generate_document_adaptive_assets
)
from app.services.gateway_service import AIGatewayService

def run_comprehensive_validation():
    print("=================================================================")
    print("       EDUADAPT - PURE GEMINI & AI TOOLS VALIDATION SUITE        ")
    print("=================================================================")
    print(f"Chat Model (Resolved):      {settings.clean_chat_model}")
    print(f"Embedding Model (Resolved): {settings.clean_embedding_model}")
    print(f"Gemini API Key Detected:    {bool(settings.GEMINI_API_KEY)}")
    print(f"9router Gateway Active:     {bool(settings.CHAT_ENDPOINT)}")
    print("-----------------------------------------------------------------")

    summary_results = {}

    # --- 1. CHAT WITH GEMINI ---
    print("\n[TOOL 1/10] Testing Gemini Chat AI Tutor (chat_with_gemini)...")
    try:
        chat_res = chat_with_gemini(
            user_query="Halo AI Tutor, jelaskan konsep difusi dan osmosis secara singkat dan beri analogi visual.",
            chat_history=[],
            learning_style="VISUAL",
            student_name="Ahmad"
        )
        assert chat_res and "text" in chat_res and len(chat_res["text"]) > 20
        print(f"  -> SUCCESS! Model: {chat_res.get('model')}")
        print(f"  -> Excerpt: {chat_res['text'][:140]}...")
        summary_results["Chat AI Tutor"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["Chat AI Tutor"] = f"FAILED ({e})"

    # --- 2. VECTOR EMBEDDING & BATCH EMBEDDING ---
    print("\n[TOOL 2/10] Testing Gemini Vector Embeddings (Single & Batch)...")
    try:
        sample_texts = [
            "Membran sel bersifat semipermeabel mengatur keluar masuknya zat.",
            "Fotosintesis reaksi terang menghasilkan ATP dan NADPH di membran tilakoid.",
            "Mitokondria merupakan organel penghasil energi utama melalui siklus Krebs."
        ]
        single_vec = get_text_embedding(sample_texts[0])
        assert single_vec and len(single_vec) > 100
        print(f"  -> Single Embedding SUCCESS! Dimension: {len(single_vec)}")

        batch_vecs = get_batch_text_embeddings(sample_texts, batch_size=3)
        assert len(batch_vecs) == len(sample_texts)
        print(f"  -> Batch Embedding SUCCESS! Processed {len(batch_vecs)} texts simultaneously.")
        summary_results["Vector Embeddings"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["Vector Embeddings"] = f"FAILED ({e})"

    # --- 3. RAG INDEXING & SEMANTIC RETRIEVAL ---
    print("\n[TOOL 3/10] Testing Semantic RAG Indexing & Vector Search...")
    try:
        test_doc_id = "test_doc_biologi_01"
        test_class_id = "class_bio_101"
        test_title = "Biologi Sel dan Transport Membran"
        test_content = """
        Membran plasma tersusun atas fosfolipid bilayer dengan protein integral dan perifer.
        Transport pasif meliputi difusi sederhana, difusi terfasilitasi, dan osmosis yang tidak membutuhkan energi ATP.
        Transport aktif membutuhkan energi ATP untuk memompa ion melawan gradien konsentrasi, seperti pompa natrium-kalium.
        Endositosis dan eksositosis merupakan mekanisme transport makromolekul melalui vesikula.
        """
        indexed_count = index_document(test_doc_id, test_class_id, test_title, test_content)
        assert indexed_count >= 1
        print(f"  -> Document indexing SUCCESS! Chunks created: {indexed_count}")

        search_res = search_relevant_chunks("Bagaimana mekanisme pompa natrium-kalium dan apakah butuh ATP?", document_id=test_doc_id, top_k=1)
        assert len(search_res) > 0
        print(f"  -> Vector search SUCCESS! Top match similarity: {search_res[0].get('similarity_score', 0):.4f}")
        print(f"  -> Matched chunk: {search_res[0].get('text', '')[:100]}...")
        summary_results["Semantic RAG Indexing"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["Semantic RAG Indexing"] = f"FAILED ({e})"

    # --- 4. AI QUIZ GENERATION ---
    print("\n[TOOL 4/10] Testing AI Quiz Generator (generate_ai_quiz)...")
    try:
        quiz_list = generate_ai_quiz(
            doc_title=test_title,
            raw_text=test_content,
            topic="Transport Membran",
            difficulty="MEDIUM",
            num_questions=3
        )
        assert isinstance(quiz_list, list) and len(quiz_list) >= 1
        print(f"  -> SUCCESS! Generated {len(quiz_list)} questions.")
        q1 = quiz_list[0]
        print(f"  -> Sample Question: {q1.get('questionText')}")
        print(f"  -> Options: {q1.get('options')}")
        print(f"  -> Correct Index: {q1.get('correctIndex')} ({q1.get('options', [])[q1.get('correctIndex', 0)] if q1.get('options') else ''})")
        summary_results["AI Quiz Generator"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["AI Quiz Generator"] = f"FAILED ({e})"

    # --- 5. VISUAL MINDMAP (MERMAID) ---
    print("\n[TOOL 5/10] Testing Visual Mindmap Generator (generate_visual_mindmap)...")
    try:
        mindmap_res = generate_visual_mindmap("Transport Pasif dan Aktif Sel", test_content)
        assert mindmap_res and "code" in mindmap_res and len(mindmap_res["code"]) > 10
        print(f"  -> SUCCESS! Generated Mermaid code:")
        print(f"     {mindmap_res['code'].replace(chr(10), ' | ')[:120]}...")
        summary_results["Visual Mindmap (Mermaid)"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["Visual Mindmap (Mermaid)"] = f"FAILED ({e})"

    # --- 6. CONVERSATIONAL PODCAST & KARAOKE SYNC ---
    print("\n[TOOL 6/10] Testing Conversational Podcast Dialog & Real-Time Karaoke Sync...")
    try:
        script, karaoke_json = _generate_conversational_podcast("Transport Membran Sel", test_content)
        k_segments = json.loads(karaoke_json)
        assert len(script) > 100 and len(k_segments) >= 2
        print(f"  -> SUCCESS! Podcast script characters: {len(script)}")
        print(f"  -> Synchronized karaoke segments: {len(k_segments)}")
        print(f"  -> Sample Karaoke Seg 1 ({k_segments[0].get('role')}): [{k_segments[0].get('startSec')}s - {k_segments[0].get('endSec')}s] {k_segments[0].get('text')[:60]}...")
        summary_results["Conversational Podcast & Karaoke"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["Conversational Podcast & Karaoke"] = f"FAILED ({e})"

    # --- 7. INTERACTIVE VISUAL NODES METADATA ---
    print("\n[TOOL 7/10] Testing Interactive Visual Nodes Metadata Generator...")
    try:
        nodes_json = _generate_visual_nodes_metadata("Transport Membran Sel", test_content, mindmap_res.get("code", ""))
        nodes_list = json.loads(nodes_json)
        assert isinstance(nodes_list, list) and len(nodes_list) >= 2
        print(f"  -> SUCCESS! Interactive nodes generated: {len(nodes_list)}")
        print(f"  -> Node 1: '{nodes_list[0].get('title')}' ({nodes_list[0].get('category')})")
        print(f"     Analogy: {nodes_list[0].get('realWorldAnalogy')}")
        summary_results["Visual Nodes Metadata"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["Visual Nodes Metadata"] = f"FAILED ({e})"

    # --- 8. UNIVERSAL KINESTHETIC GAME CONFIG & FILL-IN-THE-BLANK ---
    print("\n[TOOL 8/10] Testing Universal Kinesthetic Game & Fill-in-the-Blank Generators...")
    try:
        game_cfg_json = _generate_universal_game_config("Transport Membran Sel", test_content)
        game_cfg = json.loads(game_cfg_json)
        assert "collectorGame" in game_cfg and "variableSimulator" in game_cfg
        print(f"  -> Game Config SUCCESS! Title: '{game_cfg.get('gameTitle')}'")
        print(f"  -> Variables simulated: {[v.get('name') for v in game_cfg.get('variableSimulator', {}).get('variables', [])]}")

        fib_json = _generate_fill_in_the_blank("Transport Membran Sel", test_content)
        fib_list = json.loads(fib_json)
        assert isinstance(fib_list, list) and len(fib_list) >= 2
        print(f"  -> Fill-in-the-Blank SUCCESS! {len(fib_list)} interactive challenges generated.")
        print(f"  -> Challenge 1: {fib_list[0].get('sentence')} (Target: '{fib_list[0].get('blankWord')}')")
        summary_results["Universal Kinesthetic Gamification"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["Universal Kinesthetic Gamification"] = f"FAILED ({e})"

    # --- 9. TEXT-TO-SPEECH (TTS) AUDIO GENERATION ---
    print("\n[TOOL 9/10] Testing Text-to-Speech (TTS) Voice Synthesis...")
    try:
        audio_bytes = AIGatewayService.generate_speech("Selamat datang di sistem pembelajaran adaptif EduAdapt.", voice="id-ID-ArdiNeural")
        assert audio_bytes and len(audio_bytes) > 500
        print(f"  -> TTS Audio SUCCESS! Generated {len(audio_bytes)} bytes of clear Indonesian voice audio.")
        summary_results["TTS Audio Synthesis"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["TTS Audio Synthesis"] = f"FAILED ({e})"

    # --- 10. FASTAPI TESTCLIENT ENDPOINT VALIDATION ---
    print("\n[TOOL 10/10] Testing FastAPI Endpoints via TestClient...")
    try:
        with TestClient(app) as client:
            # Test Chat Endpoint
            resp_chat = client.post("/api/v1/ai/chat", json={
                "message": "Apa itu osmosis?",
                "learning_style": "VISUAL",
                "student_name": "Devan",
                "student_id": "std_test"
            })
            assert resp_chat.status_code == 200
            data_chat = resp_chat.json()
            assert "text" in data_chat and "citation" in data_chat
            print(f"  -> POST /api/v1/ai/chat: 200 OK (Model: {data_chat.get('model')})")

            # Test Diagram Endpoint
            resp_diag = client.post("/api/v1/ai/diagram", json={"concept": "Osmosis dan Difusi"})
            assert resp_diag.status_code == 200
            data_diag = resp_diag.json()
            assert "code" in data_diag and data_diag.get("type") == "mermaid"
            print(f"  -> POST /api/v1/ai/diagram: 200 OK (Type: {data_diag.get('type')})")

            # Test TTS Endpoint
            resp_tts = client.post("/api/v1/ai/tts", json={"text": "Tes sintesis suara EduAdapt."})
            assert resp_tts.status_code == 200
            assert len(resp_tts.content) > 200
            print(f"  -> POST /api/v1/ai/tts: 200 OK ({len(resp_tts.content)} bytes audio stream)")

            summary_results["FastAPI Endpoints"] = "PASSED"
    except Exception as e:
        print(f"  -> FAILED: {e}")
        summary_results["FastAPI Endpoints"] = f"FAILED ({e})"

    print("\n=================================================================")
    print("                    FINAL VERIFICATION SUMMARY                   ")
    print("=================================================================")
    all_passed = True
    for tool_name, status in summary_results.items():
        icon = "[PASSED]" if status == "PASSED" else "[FAILED]"
        print(f"  {icon} {tool_name:<38} : {status}")
        if status != "PASSED":
            all_passed = False
    print("-----------------------------------------------------------------")
    print(f"OVERALL STATUS: {'ALL TOOLS OPERATIONAL & OPTIMAL (SUCCESS)' if all_passed else 'SOME TOOLS FAILED'}")
    print("=================================================================")
    return all_passed

if __name__ == "__main__":
    success = run_comprehensive_validation()
    sys.exit(0 if success else 1)
