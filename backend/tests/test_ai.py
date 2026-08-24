import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.vector_store import chunk_text, search_relevant_chunks, index_document
from app.services.cache_service import get_cache_key, get_cached_response, set_cached_response

def test_semantic_chunking():
    sample_text = "Jantung manusia adalah organ vital sistem kardiovaskular. " * 30
    chunks = chunk_text(sample_text, chunk_size=300, overlap=50)
    assert len(chunks) > 1
    assert all(len(c) <= 350 for c in chunks)

def test_vector_indexing_and_search():
    doc_id = "doc_test_123"
    title = "Modul Fotosintesis"
    text = "Klorofil pada daun menyerap cahaya matahari pada panjang gelombang merah dan biru. Reaksi terang terjadi di membran tilakoid kloroplas menghasilkan ATP dan NADPH."
    
    count = index_document(doc_id, "class_1", title, text)
    assert count >= 1
    
    results = search_relevant_chunks("di mana reaksi terang terjadi?", document_id=doc_id, top_k=1)
    assert len(results) >= 1
    assert results[0]["document_title"] == title

def test_ai_cache_and_rate_limit():
    key = get_cache_key("test", "query1")
    set_cached_response(key, {"answer": "cached answer"}, ttl_seconds=60)
    
    cached = get_cached_response(key)
    assert cached is not None
    assert cached["answer"] == "cached answer"

def test_ai_chat_endpoint():
    with TestClient(app) as client:
        payload = {
            "message": "Bagaimana proses pencernaan karbohidrat di mulut?",
            "learning_style": "VISUAL",
            "student_name": "Devan",
            "student_id": "std_101"
        }
        response = client.post("/api/v1/ai/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "text" in data
        assert "citation" in data
        assert "model" in data
        
        # Second identical call should hit cache
        resp2 = client.post("/api/v1/ai/chat", json=payload)
        assert resp2.status_code == 200
        assert resp2.json()["cached"] is True

def test_ai_diagram_endpoint():
    with TestClient(app) as client:
        payload = {"concept": "Siklus Krebs"}
        response = client.post("/api/v1/ai/diagram", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "code" in data
        assert data["type"] == "mermaid"
