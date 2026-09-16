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

def chunk_text(text: str, chunk_size: int = 850, overlap: int = 150) -> List[str]:
    """
    Memecah teks silabus/modul ajar menjadi potongan semantik yang kohesif.
    Ukuran 850 karakter (~120-150 kata) memberikan konteks semantik paragraf yang ideal untuk RAG.
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
    Menghasilkan vektor embedding untuk satu teks menggunakan 9router Embedding Gateway atau Google Gemini.
    """
    if not text.strip():
        return [0.0] * 128
    
    # 1. Coba via 9router / Custom Embedding Gateway jika endpoint diatur
    if settings.EMBEDDING_ENDPOINT and (settings.EMBEDDING_API_KEY or settings.GEMINI_API_KEY):
        try:
            from app.services.gateway_service import AIGatewayService
            vecs = AIGatewayService.generate_embeddings([text], model=settings.EMBEDDING_MODEL or settings.GEMINI_EMBEDDING_MODEL)
            if vecs and len(vecs) > 0 and len(vecs[0]) > 0:
                return vecs[0]
        except Exception as e:
            logger.debug(f"[VectorStore] 9router Embedding Gateway error: {e}")

    # 2. Coba via Google Gemini SDK jika menggunakan key Google
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("sk-"):
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            model_name = settings.clean_embedding_model
            for candidate in [model_name, "gemini-embedding-001", "gemini-embedding-2"]:
                try:
                    result = client.models.embed_content(
                        model=candidate,
                        contents=text
                    )
                    if hasattr(result, "embedding") and result.embedding:
                        return result.embedding.values
                    elif hasattr(result, "embeddings") and result.embeddings:
                        return result.embeddings[0].values
                except Exception:
                    continue
        except Exception as e:
            logger.warning(f"[VectorStore] Gemini Embedding API error, falling back to local vectorizer: {e}")
    
    return _compute_fallback_embedding(text)

def get_batch_text_embeddings(texts: List[str], batch_size: int = 30) -> List[List[float]]:
    """
    Menghasilkan vektor embedding untuk banyak teks sekaligus secara batch (hingga 30 potongan per request).
    Mengakselerasi indexing ribuan teks hingga 30x lipat lebih cepat tanpa timeout.
    """
    if not texts:
        return []

    all_embeddings: List[List[float]] = []

    # 1. Coba batch via 9router / Custom Embedding Gateway jika endpoint diatur
    if settings.EMBEDDING_ENDPOINT and (settings.EMBEDDING_API_KEY or settings.GEMINI_API_KEY):
        try:
            from app.services.gateway_service import AIGatewayService
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                vecs = AIGatewayService.generate_embeddings(batch, model=settings.EMBEDDING_MODEL or settings.GEMINI_EMBEDDING_MODEL)
                if vecs and len(vecs) == len(batch):
                    all_embeddings.extend(vecs)
                else:
                    for t in batch:
                        all_embeddings.append(get_text_embedding(t))
            if len(all_embeddings) == len(texts):
                return all_embeddings
        except Exception as e:
            logger.warning(f"[VectorStore] Batch embedding gateway error: {e}")
            all_embeddings = []

    # 2. Coba batch via Google Gemini SDK langsung
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("sk-"):
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            model_name = settings.clean_embedding_model
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                for candidate in [model_name, "gemini-embedding-001", "gemini-embedding-2"]:
                    try:
                        result = client.models.embed_content(
                            model=candidate,
                            contents=batch
                        )
                        if hasattr(result, "embeddings") and result.embeddings:
                            batch_vecs = [e.values for e in result.embeddings]
                            all_embeddings.extend(batch_vecs)
                            break
                    except Exception:
                        continue
            if len(all_embeddings) == len(texts):
                return all_embeddings
        except Exception as e:
            logger.warning(f"[VectorStore] Gemini SDK batch embedding error: {e}")
            all_embeddings = []

    # 3. Fallback per item jika batch gagal
    for t in texts:
        all_embeddings.append(get_text_embedding(t))
    return all_embeddings

def index_document(document_id: str, classroom_id: str, title: str, raw_text: str) -> int:
    """
    Melakukan chunking dan mengindeks seluruh vektor modul ajar ke vector store secara efisien.
    """
    chunks = chunk_text(raw_text)
    if not chunks:
        chunks = [raw_text] if raw_text.strip() else []
    
    # Dapatkan embedding secara batch berkecepatan tinggi
    vectors = get_batch_text_embeddings(chunks, batch_size=30)
    
    indexed_chunks = []
    for idx, (chunk_str, vector) in enumerate(zip(chunks, vectors)):
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
    logger.info(f"[VectorStore] Indexed document '{title}' ({document_id}) with {len(indexed_chunks)} chunks (batch accelerated).")
    return len(indexed_chunks)

def remove_document_from_index(document_id: str):
    """
    Menghapus indeks dokumen dari memory saat dokumen dihapus oleh guru.
    """
    if document_id in _VECTOR_INDEX:
        del _VECTOR_INDEX[document_id]

def ensure_vector_index_loaded():
    """
    Memastikan seluruh dokumen dari database sudah terindeks ke memory vector store.
    """
    if _VECTOR_INDEX:
        return
    try:
        from app.core.database import SessionLocal
        from app.models.document import GroundedDocument
        with SessionLocal() as db:
            docs = db.query(GroundedDocument).all()
            for doc in docs:
                if doc.id not in _VECTOR_INDEX:
                    index_document(
                        document_id=doc.id,
                        classroom_id=doc.classroom_id,
                        title=doc.title,
                        raw_text=doc.raw_text
                    )
            logger.info(f"[VectorStore] Loaded {len(docs)} documents into in-memory index.")
    except Exception as e:
        logger.warning(f"[VectorStore] Auto-load vector index error: {e}")

def search_relevant_chunks(
    query: str,
    classroom_id: Optional[str] = None,
    document_id: Optional[str] = None,
    top_k: int = 3,
    min_similarity: float = 0.10
) -> List[Dict[str, Any]]:
    """
    Melakukan hybrid semantic & keyword similarity search untuk menemukan top-k chunk yang paling relevan.
    """
    ensure_vector_index_loaded()

    query_vec = np.array(get_text_embedding(query), dtype=np.float32)
    q_norm = np.linalg.norm(query_vec)
    query_words = set(re.findall(r"\w+", query.lower()))
    
    all_chunks = []
    for doc_id, chunks in _VECTOR_INDEX.items():
        if document_id and doc_id != document_id:
            continue
        for chk in chunks:
            if classroom_id and chk.get("classroom_id") != classroom_id:
                continue
            all_chunks.append(chk)
    
    # If filtered classroom has no chunks, search across all documents as fallback
    if not all_chunks:
        for doc_id, chunks in _VECTOR_INDEX.items():
            all_chunks.extend(chunks)
            
    if not all_chunks:
        return []
    
    scored_chunks = []
    for chk in all_chunks:
        vec = np.array(chk["vector"], dtype=np.float32)
        v_norm = np.linalg.norm(vec)
        cos_sim = 0.0
        if q_norm > 0 and v_norm > 0:
            cos_sim = float(np.dot(query_vec, vec) / (q_norm * v_norm))

        # Lexical keyword overlap score
        chunk_words = set(re.findall(r"\w+", chk["text"].lower()))
        overlap = len(query_words.intersection(chunk_words))
        lex_sim = (overlap / max(1, len(query_words))) if query_words else 0.0
        
        # Hybrid combined similarity score
        final_sim = max(cos_sim, lex_sim * 0.85)
        
        if final_sim >= min_similarity or len(all_chunks) <= top_k:
            scored_chunks.append({
                "chunk_id": chk["chunk_id"],
                "text": chk["text"],
                "document_id": chk["document_id"],
                "document_title": chk["document_title"],
                "similarity_score": round(final_sim, 4),
            })
    
    # Sort descending by similarity
    scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored_chunks[:top_k]
