import re
import math
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory document chunk vector registry
# Format: { document_id: [ { "chunk_id": str, "text": str, "vector": List[float], "doc_title": str, "class_id": str } ] }
_VECTOR_INDEX: Dict[str, List[Dict[str, Any]]] = {}

def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """
    Memecah teks silabus/modul ajar menjadi potongan semantik yang kohesif.
    """
    clean = re.sub(r"\s+", " ", text).strip()
    if not clean:
        return []
    
    if len(clean) <= chunk_size:
        return [clean]
    
    chunks = []
    start = 0
    while start < len(clean):
        end = start + chunk_size
        if end >= len(clean):
            chunks.append(clean[start:])
            break
        
        # Cari batas akhir kalimat terdekat
        last_period = clean.rfind(". ", start, end)
        if last_period != -1 and last_period > start + (chunk_size // 2):
            actual_end = last_period + 1
        else:
            actual_end = end
        
        chunks.append(clean[start:actual_end].strip())
        start = actual_end - overlap
        
    return [c for c in chunks if len(c) > 20]

def _compute_fallback_embedding(text: str, dim: int = 128) -> List[float]:
    """
    Deterministic pseudo-embedding fallback jika API Key belum dipasang.
    Menggunakan hashing n-gram terdistribusi seragam.
    """
    words = re.findall(r"\w+", text.lower())
    vec = np.zeros(dim, dtype=np.float32)
    if not words:
        return vec.tolist()
    
    for word in words:
        h = hash(word) % dim
        vec[h] += 1.0
        
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

def get_text_embedding(text: str) -> List[float]:
    """
    Menghasilkan vektor embedding menggunakan model text-embedding-004 Google Gemini.
    """
    if not text.strip():
        return [0.0] * 128
    
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            result = client.models.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text
            )
            if hasattr(result, "embedding") and result.embedding:
                return result.embedding.values
            elif hasattr(result, "embeddings") and result.embeddings:
                return result.embeddings[0].values
        except Exception as e:
            logger.warning(f"[VectorStore] Gemini Embedding API error, falling back to local vectorizer: {e}")
    
    return _compute_fallback_embedding(text)

def index_document(document_id: str, classroom_id: str, title: str, raw_text: str) -> int:
    """
    Melakukan chunking dan mengindeks seluruh vektor modul ajar ke vector store.
    """
    chunks = chunk_text(raw_text)
    if not chunks:
        chunks = [raw_text] if raw_text.strip() else []
    
    indexed_chunks = []
    for idx, chunk_str in enumerate(chunks):
        vector = get_text_embedding(chunk_str)
        indexed_chunks.append({
            "chunk_id": f"{document_id}_chk_{idx + 1}",
            "chunk_index": idx + 1,
            "text": chunk_str,
            "vector": vector,
            "document_id": document_id,
            "document_title": title,
            "classroom_id": classroom_id,
        })
    
    _VECTOR_INDEX[document_id] = indexed_chunks
    logger.info(f"[VectorStore] Indexed document '{title}' ({document_id}) with {len(indexed_chunks)} chunks.")
    return len(indexed_chunks)

def remove_document_from_index(document_id: str):
    """
    Menghapus indeks dokumen dari memory saat dokumen dihapus oleh guru.
    """
    if document_id in _VECTOR_INDEX:
        del _VECTOR_INDEX[document_id]

def search_relevant_chunks(
    query: str,
    classroom_id: Optional[str] = None,
    document_id: Optional[str] = None,
    top_k: int = 3,
    min_similarity: float = 0.15
) -> List[Dict[str, Any]]:
    """
    Melakukan cosine similarity search untuk menemukan top-k chunk yang paling relevan dengan pertanyaan siswa.
    """
    query_vec = np.array(get_text_embedding(query), dtype=np.float32)
    q_norm = np.linalg.norm(query_vec)
    if q_norm == 0:
        return []
    
    all_chunks = []
    for doc_id, chunks in _VECTOR_INDEX.items():
        if document_id and doc_id != document_id:
            continue
        for chk in chunks:
            if classroom_id and chk.get("classroom_id") != classroom_id:
                continue
            all_chunks.append(chk)
    
    if not all_chunks:
        return []
    
    scored_chunks = []
    for chk in all_chunks:
        vec = np.array(chk["vector"], dtype=np.float32)
        v_norm = np.linalg.norm(vec)
        if v_norm == 0:
            sim = 0.0
        else:
            # Cosine similarity
            sim = float(np.dot(query_vec, vec) / (q_norm * v_norm))
        
        if sim >= min_similarity:
            scored_chunks.append({
                "chunk_id": chk["chunk_id"],
                "text": chk["text"],
                "document_id": chk["document_id"],
                "document_title": chk["document_title"],
                "similarity_score": round(sim, 4),
            })
    
    # Sort descending by similarity
    scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored_chunks[:top_k]
