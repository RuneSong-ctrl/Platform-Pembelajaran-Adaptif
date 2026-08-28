import json
import logging
import re
import uuid
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.vector_store import search_relevant_chunks

logger = logging.getLogger(__name__)

# Security: Prompt Injection Detection Patterns
SUSPICIOUS_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"system\s*prompt",
    r"you\s+are\s+now\s+in\s+dan\s+mode",
    r"bypass\s+safety",
    r"forget\s+everything",
    r"drop\s+table",
    r"<script.*?>.*?</script>",
]

def sanitize_user_input(text: str, max_chars: int = 1500) -> str:
    """
    Sanitasi input siswa: batasi panjang karakter dan deteksi pola jailbreak.
    """
    clean = text.strip()[:max_chars]
    for pat in SUSPICIOUS_PATTERNS:
        if re.search(pat, clean, re.IGNORECASE):
            logger.warning(f"[Security] Suspicious prompt injection pattern detected: '{pat}'")
            # Replace suspicious phrase with safe token
            clean = re.sub(pat, "[FILTERED_INPUT]", clean, flags=re.IGNORECASE)
    return clean

def _build_system_instruction(learning_style: Optional[str] = "VISUAL") -> str:
    style_guide = {
        "VISUAL": "Gaya belajar siswa: VISUAL. Gunakan analogi visual yang kuat, poin-poin struktural bernomor, dan bayangkan bentuk/diagram konsep agar mudah divisualisasikan.",
        "AUDITORI": "Gaya belajar siswa: AUDITORI. Gunakan gaya bahasa bertutur yang mengalir, komunikatif, bernada dialogis yang enak didengar dan mudah dicerna jika dibacakan oleh Text-to-Speech.",
        "KINESTETIK": "Gaya belajar siswa: KINESTETIK. Hubungkan konsep dengan simulasi tindakan nyata, langkah eksperimen laboratorium, skenario kasus sebab-akibat, dan manipulasi objek.",
    }.get((learning_style or "VISUAL").upper(), "Gunakan pendekatan pembelajaran personal yang jelas dan terstruktur.")

    return f"""Kamu adalah Asisten Belajar AI Tutor Resmi EduAdapt (Kurikulum K-12 Indonesia).
Tugas utamamu adalah mendampingi siswa memahami materi pelajaran dengan berpijak KETAT pada modul ajar yang telah diunggah guru di kelas.

{style_guide}

ATURAN GROUNDING & SITASI WAJIB (MUTLAK):
1. Seluruh jawaban konsep akademik HARUS berdasar pada teks materi yang ada di dalam tag [MODUL_GURU].
2. Pada akhir setiap jawaban yang membahas materi pelajaran, kamu WAJIB mencantumkan rujukan sumber resmi dengan format persis:
   `📖 Sumber Materi: [Judul Dokumen/Modul], Bagian: [Topik Bahasan]`
3. Jangan pernah berhalusinasi atau mengarang rumus/fakta di luar isi kurikulum dan [MODUL_GURU].
4. Jika pertanyaan siswa sama sekali TIDAK ditemukan di dalam teks [MODUL_GURU], katakan secara jujur dan santun:
   "Topik ini belum tercakup dalam modul ajar yang diunggah guru di kelasmu. Berikut penjelasan konsep sains umum sebagai referensi tambahan: ..." dan tetap sertakan penanda bahwa ini merupakan wawasan umum tambahan di luar modul resmi kelas.
5. Akhiri penjelasan dengan 1 pertanyaan reflektif singkat untuk memancing pemikiran kritis siswa.
"""

def chat_with_gemini(
    user_query: str,
    chat_history: List[Dict[str, str]],
    classroom_id: Optional[str] = None,
    document_id: Optional[str] = None,
    learning_style: Optional[str] = "VISUAL",
    student_name: Optional[str] = "Siswa"
) -> Dict[str, Any]:
    """
    Menghasilkan balasan AI Tutor dengan grounding RAG dan adaptasi kognitif.
    """
    clean_query = sanitize_user_input(user_query)
    
    # 1. RAG Vector Search: Temukan top-3 chunk relevan
    relevant_chunks = search_relevant_chunks(
        query=clean_query,
        classroom_id=classroom_id,
        document_id=document_id,
        top_k=3
    )
    
    rag_context = ""
    citations = []
    if relevant_chunks:
        rag_context = "\n\n".join([f"[{chk['document_title']}]: {chk['text']}" for chk in relevant_chunks])
        citations = list({f"{chk['document_title']} (Relevansi: {int(chk['similarity_score'] * 100)}%)" for chk in relevant_chunks})

    # 2.A Call 9router AI Gateway if endpoint is set or API key is sk-
    if settings.CHAT_ENDPOINT and (settings.CHAT_API_KEY or (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.startswith("sk-"))):
        try:
            from app.services.gateway_service import AIGatewayService
            system_inst = _build_system_instruction(learning_style)
            messages = [{"role": "system", "content": system_inst}]
            trimmed_history = chat_history[-6:] if len(chat_history) > 6 else chat_history
            for h in trimmed_history:
                role = "user" if h.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": h.get("text", "")})
            prompt_content = f"""[MODUL_GURU]
{rag_context if rag_context else "Belum ada dokumen modul spesifik terindeks. Jawab berdasarkan prinsip sains kurikulum umum."}
[/MODUL_GURU]

Pertanyaan Siswa ({student_name}): {clean_query}"""
            messages.append({"role": "user", "content": prompt_content})

            chat_reply = AIGatewayService.generate_chat(messages, model=settings.CHAT_MODEL, temperature=0.4)
            if chat_reply:
                return {
                    "text": chat_reply,
                    "citation": " • ".join(citations) if citations else "9router Gateway • EduAdapt",
                    "is_grounded": bool(relevant_chunks),
                    "model": settings.CHAT_MODEL
                }
        except Exception as e:
            logger.warning(f"[GeminiService] 9router chat generation failed: {e}")

    # 2.B Call official Google Gemini SDK if standard Gemini API Key
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("sk-"):
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            prompt_content = f"""[MODUL_GURU]
{rag_context if rag_context else "Belum ada dokumen modul spesifik terindeks. Jawab berdasarkan prinsip sains kurikulum umum."}
[/MODUL_GURU]

Pertanyaan Siswa ({student_name}): {clean_query}"""

            # Build sliding history (maximum last 6 messages)
            trimmed_history = chat_history[-6:] if len(chat_history) > 6 else chat_history
            
            contents = []
            for h in trimmed_history:
                role = "user" if h.get("sender") == "user" else "model"
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=h.get("text", ""))]
                ))
            
            contents.append(types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt_content)]
            ))

            config = types.GenerateContentConfig(
                system_instruction=_build_system_instruction(learning_style),
                temperature=0.4, # Rendah untuk mencegah halusinasi
                max_output_tokens=1000,
            )

            response = client.models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=contents,
                config=config
            )

            reply_text = response.text if response.text else "Maaf, saya tidak dapat memproses jawaban saat ini."
            
            return {
                "text": reply_text,
                "citation": " • ".join(citations) if citations else "Asisten Belajar EduAdapt",
                "is_grounded": bool(relevant_chunks),
                "model": settings.GEMINI_CHAT_MODEL
            }
        except Exception as e:
            logger.error(f"[GeminiService] API generation failed: {e}")

    # 3. Fallback jika offline / API key kosong
    if relevant_chunks:
        primary_chunk = relevant_chunks[0]["text"]
        return {
            "text": f"Berdasarkan modul ter-grounding:\n\n{primary_chunk}\n\nTopik ini sangat penting untuk penguasaan konsep kurikulummu.",
            "citation": " • ".join(citations),
            "is_grounded": True,
            "model": "local-rag-fallback"
        }
    
    return {
        "text": f"Pertanyaan mengenai '{clean_query}' adalah konsep yang menarik! Pastikan gurumu telah mengunggah modul lengkap di kelas ini agar saya dapat merujuk ke bab dan halaman kurikulum resmimu.",
        "citation": "EduAdapt Kurikulum",
        "is_grounded": False,
        "model": "local-fallback"
    }

def generate_ai_quiz(
    doc_title: str,
    raw_text: str,
    topic: str,
    difficulty: str = "MEDIUM",
    num_questions: int = 10
) -> List[Dict[str, Any]]:
    """
    Menghasilkan draf kuis adaptif DDA terstruktur dalam format JSON dari dokumen guru.
    Secara default menghasilkan 10 butir soal yang bervariasi dari aspek konsep,
    tingkat kesulitan berjenjang (HOTS), serta pengacakan posisi kunci jawaban A, B, C, D.
    """
    import random

    # Ambil sampel konteks representatif (hingga 10.000 karakter) agar soal mencakup berbagai sub-bab materi
    if len(raw_text) > 10000:
        part_len = 3000
        p1 = raw_text[:part_len]
        mid = len(raw_text) // 2
        p2 = raw_text[mid:mid + part_len]
        p3 = raw_text[-part_len:]
        context_sample = f"{p1}\n\n[... Sub-topik Lanjutan ...]\n\n{p2}\n\n[... Sub-topik Evaluasi ...]\n\n{p3}"
    else:
        context_sample = raw_text

    system_prompt = f"""Kamu adalah Pakar Kurikulum K-12 & Asesor Soal Ujian Nasional/HOTS Resmi EduAdapt.
Tugas utamamu adalah menyusun draf kuis pilihan ganda yang SANGAT BERVARIASI, cerdas, berbobot, dan 100% berakar (ter-grounding) pada teks dokumen materi guru.

PANDUAN KETAT VARIABILITAS & STRUKTUR SOAL:
1. JUMLAH SOAL: Hasilkan tepat {num_questions} butir soal pilihan ganda.
2. DIVERSIFIKASI TOPIK (MUTLAK):
   - Setiap butir soal WAJIB menguji konsep, sub-bab, hukum, rumus, atau mekanisme reaksi yang BERBEDA. Dilarang mengulang pertanyaan yang serupa.
3. SEBARAN TINGKAT KESULITAN BERTINGKAT:
   - Soal 1–3: Tingkat 'BASIC' (Pemahaman definisi, terminologi, dan komponen dasar materi).
   - Soal 4–7: Tingkat 'MEDIUM' (Aplikasi konsep, mekanisme interaksi, sebab-akibat langsung).
   - Soal 8–{num_questions}: Tingkat 'CHALLENGING' atau 'MASTERY' (Analisis kasus tingkat tinggi/HOTS, prediksi gangguan sistem, kalkulasi atau evaluasi komparatif).
4. OPSI JAWABAN (A, B, C, D) & PENGACAKAN KUNCI:
   - 4 opsi per soal. Pengecoh (distractor) harus kredibel dan edukatif.
   - PENTING: KUNCI JAWABAN HARUS DIACAK MERATA! Nilai "correctIndex" (0 untuk A, 1 untuk B, 2 untuk C, 3 untuk D) WAJIB bervariasi di setiap soal. Jangan menaruh jawaban benar selalu di opsi A / index 0.
5. PENJELASAN (EXPLANATION):
   - Sertakan "analogi" (analogi konkret kehidupan nyata), "visual" (alur bagan konsep ringkas), dan "langkah" (langkah penalaran kebenaran).
6. FORMAT OUTPUT:
   - Wajib JSON array murni tanpa pembungkus teks markdown (tanpa ```json ... ```)."""

    user_prompt = f"""Dokumen Rujukan: {doc_title}
Topik Spesifik: {topic}
Target Jumlah Soal: {num_questions} butir soal pilihan ganda

Isi Materi Dokumen Guru Ter-grounding:
{context_sample}

Susunlah sekarang {num_questions} soal berkualitas tinggi dalam format JSON array:
[
  {{
    "id": "q_1",
    "questionText": "Pertanyaan terstruktur dan jelas...",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    "correctIndex": 1,
    "difficulty": "BASIC",
    "sourceReference": "{doc_title}",
    "explanation": {{
      "analogi": "Analogi...",
      "visual": "Bagan Alur...",
      "langkah": "1. ... 2. ..."
    }}
  }}
]"""

    # 1. Coba via 9router AI Gateway
    if settings.CHAT_ENDPOINT and (settings.CHAT_API_KEY or (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.startswith("sk-"))):
        try:
            from app.services.gateway_service import AIGatewayService
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            reply = AIGatewayService.generate_chat(messages, model=settings.CHAT_MODEL, temperature=0.6)
            if reply:
                clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", reply.strip(), flags=re.MULTILINE).strip()
                match = re.search(r"\[\s*\{.*\}\s*\]", clean_json, re.DOTALL)
                if match:
                    clean_json = match.group(0)
                parsed = json.loads(clean_json)
                if isinstance(parsed, list) and len(parsed) >= min(4, num_questions):
                    logger.info(f"[GeminiService] Successfully generated {len(parsed)} AI quiz questions via gateway.")
                    return parsed
                elif isinstance(parsed, dict) and "questions" in parsed and isinstance(parsed["questions"], list):
                    return parsed["questions"]
        except Exception as e:
            logger.warning(f"[GeminiService] 9router quiz generation error: {e}")

    # 2. Coba via Google Gemini SDK resmi jika key Google
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("sk-"):
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                temperature=0.6,
            )

            response = client.models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=user_prompt,
                config=config
            )

            clean_text = response.text.strip()
            match = re.search(r"\[\s*\{.*\}\s*\]", clean_text, re.DOTALL)
            if match:
                clean_text = match.group(0)
            parsed = json.loads(clean_text)
            if isinstance(parsed, list) and len(parsed) >= min(4, num_questions):
                return parsed
            elif isinstance(parsed, dict) and "questions" in parsed:
                return parsed["questions"]
        except Exception as e:
            logger.error(f"[GeminiService] Gemini SDK Quiz generation error: {e}")

    # 3. Dynamic RAG Fallback Generator yang BERVARIATIF & BERKUALITAS (bukan dummy seragam)
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if len(p.strip()) > 40]
    if not paragraphs:
        paragraphs = [p.strip() for p in raw_text.split(". ") if len(p.strip()) > 30]
    if not paragraphs:
        paragraphs = [f"Konsep dasar modul {doc_title} mengenai bab {topic}."]

    question_templates = [
        "Berdasarkan prinsip materi '{title}', apa konsep inti yang diuraikan pada aspek ini?",
        "Manakah pernyataan yang paling akurat mengenai mekanisme dalam sub-bahasan '{topic}'?",
        "Mengapa tahapan berikut memegang peranan krusial dalam pemahaman konsep: '{topic}'?",
        "Bagaimana korelasi fungsi antara komponen sistemik materi ini dengan penerapannya?",
        "Apa implikasi teoritis yang terjadi apabila parameter dalam materi ini mengalami pergeseran?",
        "Berdasarkan rujukan resmi modul ajar, terminologi manakah yang tepat mendeskripsikan fenomena ini?",
        "Bagaimana perbandingan karakteristik yang tepat antara premis dasar dan hasil analisis materi?",
        "Pada tingkat analisis lanjutan, mengapa mekanisme ini memerlukan regulasi keseimbangan?",
        "Penerapan manakah yang paling sesuai dengan kaidah ilmiah yang termuat dalam bab '{topic}'?",
        "Apa simpulan esensial yang dapat ditarik dari pembahasan terstruktur pada bagian ini?"
    ]

    difficulty_ladder = ["BASIC", "BASIC", "MEDIUM", "MEDIUM", "MEDIUM", "CHALLENGING", "CHALLENGING", "CHALLENGING", "MASTERY", "MASTERY"]
    fallback_questions = []

    for idx in range(num_questions):
        p_idx = idx % len(paragraphs)
        para = paragraphs[p_idx]
        
        # Ambil kalimat pertama sebagai inti jawaban benar
        sentences = [s.strip() for s in para.split(". ") if len(s.strip()) > 15]
        correct_answer = sentences[0] if sentences else para[:90]
        if len(correct_answer) > 110:
            correct_answer = correct_answer[:105] + "..."

        # Buat pilihan pengecoh dari paragraf lain dalam dokumen yang sama
        other_paras = [p for i, p in enumerate(paragraphs) if i != p_idx]
        distractors = []
        for d_idx in range(3):
            if other_paras:
                dp = other_paras[(idx + d_idx) % len(other_paras)]
                ds = [s.strip() for s in dp.split(". ") if len(s.strip()) > 15]
                d_ans = ds[0] if ds else dp[:85]
                distractors.append(d_ans[:95] + "...")
            else:
                distractors.append(f"Hipotesis tanpa regulasi kesetimbangan pada sub-bab {d_idx + 1}")

        # Acak posisi kunci jawaban (0, 1, 2, atau 3)
        target_correct_index = random.randint(0, 3)
        options = list(distractors[:3])
        options.insert(target_correct_index, correct_answer)

        stem_tmpl = question_templates[idx % len(question_templates)]
        q_text = stem_tmpl.format(title=doc_title, topic=topic or doc_title)

        diff = difficulty_ladder[idx % len(difficulty_ladder)]

        fallback_questions.append({
            "id": f"q_gen_{uuid.uuid4().hex[:6]}",
            "questionText": q_text,
            "options": options,
            "correctIndex": target_correct_index,
            "difficulty": diff,
            "sourceReference": f"{doc_title} (Bagian {idx + 1})",
            "explanation": {
                "analogi": f"Ibarat menelaah komponen {idx + 1} dalam rangkaian kerja terpadu pada bab {topic}.",
                "visual": f"Skema Konsep ➔ {topic} ➔ Langkah Pengujian {idx + 1} ➔ Simpulan Terverifikasi.",
                "langkah": f"1. Cermati modul rujukan ➔ 2. Analisis premis: '{correct_answer[:45]}...' ➔ 3. Pilih opsi {chr(65 + target_correct_index)}."
            }
        })

    return fallback_questions

def generate_visual_mindmap(concept: str, context: Optional[str] = None) -> Dict[str, str]:
    """
    Menghasilkan diagram alur visual Mermaid.js berbasis konsep saintifik.
    """
    clean_concept = sanitize_user_input(concept, max_chars=300)
    context_str = f" Berdasarkan materi: {context[:500]}." if context else ""
    
    # 1. Coba via 9router AI Gateway jika endpoint atau key sk- tersedia
    if settings.CHAT_ENDPOINT and (settings.CHAT_API_KEY or (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.startswith("sk-"))):
        try:
            from app.services.gateway_service import AIGatewayService
            prompt = f"Buatlah diagram alur Mermaid.js (graph TD) sederhana dan edukatif untuk topik: '{clean_concept}'.{context_str} Kembalikan HANYA kode diagram mermaid valid di dalam blok ```mermaid."
            messages = [{"role": "user", "content": prompt}]
            reply = AIGatewayService.generate_chat(messages, model=settings.CHAT_MODEL, temperature=0.3)
            if reply:
                mermaid_match = re.search(r"```mermaid\s*(.*?)\s*```", reply, re.DOTALL)
                if mermaid_match:
                    return {
                        "type": "mermaid",
                        "code": mermaid_match.group(1).strip(),
                        "title": clean_concept
                    }
        except Exception as e:
            logger.warning(f"[GeminiService] 9router mindmap error: {e}")

    # 2. Coba via Google Gemini SDK resmi jika key Google
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("sk-"):
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"Buatlah diagram alur Mermaid.js (graph TD) sederhana dan edukatif untuk konsep: '{clean_concept}'. Kembalikan HANYA kode diagram mermaid valid di dalam blok ```mermaid."
            
            response = client.models.generate_content(
                model=settings.GEMINI_CHAT_MODEL,
                contents=prompt
            )
            
            mermaid_match = re.search(r"```mermaid\s*(.*?)\s*```", response.text, re.DOTALL)
            if mermaid_match:
                return {
                    "type": "mermaid",
                    "code": mermaid_match.group(1).strip(),
                    "title": clean_concept
                }
        except Exception as e:
            logger.error(f"[GeminiService] Mindmap generation error: {e}")

    # Fallback clean diagram
    return {
        "type": "mermaid",
        "code": f"""graph TD
    A["{clean_concept}"] --> B["Komponen Inti"]
    A --> C["Mekanisme Reaksi"]
    B --> D["Analisis Fisiologis"]
    C --> D""",
        "title": clean_concept
    }

def _build_dialog_karaoke_timestamps(raw_dialog_lines: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    Menghitung penanda detik pemutaran (Dual-Coding Theory) untuk penyorotan real-time transkrip karaoke.
    Kecepatan bicara rata-rata bahasa Indonesia: ~2.8 kata per detik dengan jeda 0.4 detik antar giliran bicara.
    """
    karaoke_segments = []
    current_time = 0.0
    for idx, item in enumerate(raw_dialog_lines):
        speaker = item.get("speaker", "Narator")
        text = item.get("text", "").strip()
        if not text:
            continue
        words = text.split()
        word_count = len(words)
        # Hitung durasi wicara wajar (minimal 2.5 detik)
        duration = max(2.5, round(word_count / 2.7, 1))
        start_sec = round(current_time, 1)
        end_sec = round(current_time + duration, 1)
        role = "host" if any(w in speaker.lower() for w in ["host", "ardi", "moderator"]) else "expert"
        
        karaoke_segments.append({
            "id": f"seg_{idx + 1}",
            "speaker": speaker,
            "role": role,
            "startSec": start_sec,
            "endSec": end_sec,
            "text": text
        })
        current_time = end_sec + 0.35
    return karaoke_segments

def _generate_conversational_podcast(doc_title: str, context: str) -> tuple[str, str]:
    """
    Menghasilkan naskah podcast bertutur (Conversational Dialog antara Host & Pakar)
    sekaligus menghasilkan array karaoke_json berpenanda waktu.
    """
    from app.services.gateway_service import AIGatewayService
    
    prompt = f"""Kamu adalah produser podcast sains edukatif terbaik. Buatlah naskah podcast pembelajaran interaktif dalam bentuk dialog bertutur (Conversational Dialog) antara dua orang:
1. Kak Ardi (EduHost): komunikatif, antusias, memancing analogi sehari-hari dan rasa ingin tahu siswa.
2. Bu Citra (EduExpert): lugas, mendalam, membongkar mekanisme ilmiah dan menghubungkan konsep secara komprehensif.

Judul Topik: {doc_title}
Konteks Modul Ajar:
{context[:4000]}

ATURAN FORMAT WAJIB:
- Buat 8 sampai 14 giliran dialog yang mengalir alami dan membahas tuntas materi.
- Format setiap baris persis:
[Kak Ardi]: Kalimat tuturan host...
[Bu Citra]: Kalimat penjelasan pakar...
- JANGAN gunakan format markdown seperti bintang '**', pagar '#', atau bullet. Tuliskan teks wicara murni."""

    dialog_lines = []
    try:
        reply = AIGatewayService.generate_chat([{"role": "user", "content": prompt}], model=settings.CHAT_MODEL, temperature=0.6)
        if reply:
            for line in reply.split("\n"):
                line = line.strip()
                match = re.match(r"^\[?(Kak Ardi|Bu Citra|Host|Pakar|Edukator)\]?:\s*(.+)$", line, re.IGNORECASE)
                if match:
                    speaker = "Kak Ardi (Host)" if "ardi" in match.group(1).lower() or "host" in match.group(1).lower() else "Bu Citra (Pakar)"
                    dialog_lines.append({"speaker": speaker, "text": match.group(2).strip()})
    except Exception as e:
        logger.warning(f"[AdaptiveAssets] Conversational podcast AI prompt error: {e}")

    # Fallback dialog terstruktur jika AI belum merespons
    if len(dialog_lines) < 4:
        paras = [p.strip() for p in context.split("\n\n") if len(p.strip()) > 30]
        p1 = paras[0] if len(paras) > 0 else f"Pembahasan materi penting mengenai {doc_title}."
        p2 = paras[1] if len(paras) > 1 else f"Konsep inti dan mekanisme ilmiah dari {doc_title}."
        p3 = paras[2] if len(paras) > 2 else f"Aplikasi nyata dan kesimpulan penting bagi pemahaman siswa."
        
        dialog_lines = [
            {"speaker": "Kak Ardi (Host)", "text": f"Halo rekan belajar adaptif! Selamat datang di EduVoice Studio. Hari ini kita membedah topik menarik: {doc_title}. Bu Citra, kenapa konsep ini sangat fundamental?"},
            {"speaker": "Bu Citra (Pakar)", "text": f"Halo Kak Ardi dan teman-teman! {doc_title} ini sangat menarik karena menjadi landasan utama. {p1[:280]}."},
            {"speaker": "Kak Ardi (Host)", "text": "Wah, jadi ada mekanisme sebab-akibat yang saling berkaitan ya? Bagaimana proses kerjanya berjalan di dunia nyata?"},
            {"speaker": "Bu Citra (Pakar)", "text": f"Tepat sekali Kak Ardi. Jika kita telaah lebih mendalam: {p2[:320]}. Setiap komponen punya peran spesifik yang tidak bisa dipisahkan."},
            {"speaker": "Kak Ardi (Host)", "text": "Luar biasa penjelasannya! Lalu apa kesimpulan penting yang wajib diingat teman-teman sebelum mulai eksplorasi kinestetik?"},
            {"speaker": "Bu Citra (Pakar)", "text": f"Kuncinya adalah mengamati dinamika variabelnya. {p3[:300]}. Pahami prinsip dasarnya dan selamat bereksperimen!"}
        ]

    karaoke_segments = _build_dialog_karaoke_timestamps(dialog_lines)
    script_text = "\n\n".join([f"{item['speaker']}: {item['text']}" for item in dialog_lines])
    return script_text, json.dumps(karaoke_segments, ensure_ascii=False)

def _generate_visual_nodes_metadata(doc_title: str, context: str, mindmap_code: str) -> str:
    """
    Menghasilkan metadata simpul (node) interaktif untuk membuka kartu komparasi visual
    dan visual storyboard player ketika siswa mengeklik simpul pada diagram Mermaid/SVG.
    """
    from app.services.gateway_service import AIGatewayService

    prompt = f"""Kamu adalah perancang pembelajaran visual (Visual Learning Designer).
Berdasarkan topik: '{doc_title}' dan isi materi di bawah, susunlah metadata 4 sampai 6 simpul konsep penting untuk kartu komparasi visual interaktif.

Konteks Materi:
{context[:3500]}

Kembalikan HANYA JSON array murni tanpa markdown blok atau teks pengantar. Format JSON:
[
  {{
    "id": "node_1",
    "title": "Nama Konsep Pokok",
    "category": "Fondasi / Proses / Regulasi / Aplikasi",
    "shortDefinition": "Definisi singkat padat 1-2 kalimat.",
    "keyPrinciples": ["Prinsip penting 1", "Prinsip penting 2"],
    "realWorldAnalogy": "Analogi visual yang sangat mudah dibayangkan siswa.",
    "comparisonWithOtherNodes": [
      {{ "targetNode": "Konsep Pembanding", "differences": "Perbedaan spesifik", "similarities": "Titik kesamaan" }}
    ],
    "practicalApplications": ["Contoh aplikasi 1", "Contoh aplikasi 2"]
  }}
]"""

    try:
        reply = AIGatewayService.generate_chat([{"role": "user", "content": prompt}], model=settings.CHAT_MODEL, temperature=0.5)
        if reply:
            clean_json = re.sub(r"^```json\s*", "", reply.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) >= 2:
                return json.dumps(parsed, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"[AdaptiveAssets] Visual nodes AI metadata error: {e}")

    # Fallback substantif terstruktur
    paras = [p.strip() for p in context.split("\n\n") if len(p.strip()) > 30]
    fallback_nodes = [
        {
            "id": "node_1",
            "title": f"Fondasi Konsep {doc_title}",
            "category": "Fondasi Teori",
            "shortDefinition": paras[0][:150] if paras else f"Prinsip dasar pembangun konsep {doc_title}.",
            "keyPrinciples": ["Definisi terminologi ilmiah", "Karakteristik variabel pokok"],
            "realWorldAnalogy": "Bagaikan fondasi bangunan yang menopang seluruh struktur di atasnya.",
            "comparisonWithOtherNodes": [
                {"targetNode": "Mekanisme Dinamis", "differences": "Fondasi bersifat konstan sedangkan mekanisme bersifat interaktif", "similarities": "Keduanya saling melengkapi sistem"}
            ],
            "practicalApplications": ["Identifikasi parameter dasar", "Analisis studi kasus awal"]
        },
        {
            "id": "node_2",
            "title": "Mekanisme & Hubungan Variabel",
            "category": "Proses & Interaksi",
            "shortDefinition": paras[1][:150] if len(paras) > 1 else "Hubungan timbal balik dan dinamika kerja antar-elemen konsep.",
            "keyPrinciples": ["Hukum aksi-reaksi dalam sistem", "Faktor katalisator dan penghambat"],
            "realWorldAnalogy": "Bagaikan gir-gir mesin jam yang berputar bersamaan menciptakan detik yang tepat.",
            "comparisonWithOtherNodes": [
                {"targetNode": "Fondasi Konsep", "differences": "Menjelaskan cara kerja aktif di lapangan", "similarities": "Berpijak pada aturan hukum ilmiah yang sama"}
            ],
            "practicalApplications": ["Prediksi luaran eksperimen", "Pengendalian laju reaksi"]
        },
        {
            "id": "node_3",
            "title": "Evaluasi & Aplikasi Nyata",
            "category": "Penerapan & Sintesis",
            "shortDefinition": paras[2][:150] if len(paras) > 2 else "Implementasi praktis konsep dalam teknologi, lingkungan, dan kehidupan.",
            "keyPrinciples": ["Optimalisasi pemanfaatan sistem", "Mitigasi resiko dan batasan konsep"],
            "realWorldAnalogy": "Bagaikan kendaraan modern yang memanfaatkan seluruh prinsip aerodinamika untuk melaju efisien.",
            "comparisonWithOtherNodes": [
                {"targetNode": "Mekanisme & Hubungan Variabel", "differences": "Fokus pada produk akhir bukan proses intern", "similarities": "Hasil langsung dari efisiensi mekanisme"}
            ],
            "practicalApplications": ["Inovasi teknologi terapan", "Pemecahan problem saintifik modern"]
        }
    ]
    return json.dumps(fallback_nodes, ensure_ascii=False)

def _generate_universal_game_config(doc_title: str, context: str) -> str:
    """
    Menghasilkan konfigurasi gamifikasi kinestetik universal yang mencakup:
    1. Mini-Game Kanvas 2D 'Bio-Organ Quest' / 'Concept Collector Quest' (tombol arah, serap molekul nutrisi/konsep).
    2. Simulator Reaksi / Laboratorium berfitur Slider Variabel Suhu & pH (atau variabel spesifik subjek).
    3. Reaktor Drag-and-Drop / Interactive Slot Assembly.
    """
    from app.services.gateway_service import AIGatewayService

    is_bio = any(w in (doc_title + context[:500]).lower() for w in ["organ", "enzim", "sel", "nutrisi", "biologi", "tubuh", "darah", "jantung", "pencernaan"])
    is_chem = any(w in (doc_title + context[:500]).lower() for w in ["reaksi", "larutan", "asam", "basa", "kimia", "senyawa", "katalis", "molekul", "atom"])
    
    prompt = f"""Kamu adalah Lead Game Designer edukasi adaptif kinestetik (Universal Kinesthetic Gamification Engine).
Rancanglah GameConfig interaktif lengkap untuk materi: '{doc_title}'.

Materi:
{context[:3500]}

Format JSON WAJIB yang harus kamu hasilkan (HANYA JSON murni tanpa markdown pembuka/penutup):
{{
  "gameTitle": "Nama Game Menarik (contoh: Bio-Organ Quest: Sintesis Enzim)",
  "gameType": "bio-quest",
  "theme": {{
    "heroName": "Nama Karakter (contoh: Sel Bio-Bot / Nano-Probe)",
    "arenaBackground": "cellular",
    "heroSprite": "🧬",
    "missionObjective": "Gerakkan karakter dengan tombol arah untuk menyerap molekul nutrisi dan hindari inhibitor racun!"
  }},
  "collectorGame": {{
    "playerSpeed": 6,
    "targetScore": 100,
    "timeLimitSec": 60,
    "collectibles": [
      {{
        "id": "c1",
        "label": "Nama Molekul / Konsep 1 (contoh: Glukosa / Substrat Inti)",
        "category": "nutrient",
        "points": 15,
        "speed": 2.5,
        "feedback": "Bagus! Nutrisi diserap untuk metabolisme!",
        "color": "#1D5E4D"
      }},
      {{
        "id": "c2",
        "label": "Nama Inhibitor / Racun / Miskonsepsi (contoh: Racun Sianida / Radikal)",
        "category": "toxic",
        "points": -20,
        "speed": 3.0,
        "feedback": "Awas! Inhibitor merusak stabilitas sel!",
        "color": "#BA1A1A"
      }},
      {{
        "id": "c3",
        "label": "Katalisator / Koenzim Penguat",
        "category": "catalyst",
        "points": 25,
        "speed": 2.0,
        "feedback": "Bonus laju reaksi berlipat ganda!",
        "color": "#785308"
      }}
    ]
  }},
  "variableSimulator": {{
    "simTitle": "Simulator Reaksi Enzim & Pengaruh Variabel",
    "description": "Geser slider suhu dan pH untuk menguji kinetika laju reaksi dan denaturasi.",
    "reactionOutputFormulaName": "Laju Reaksi Efektif (%)",
    "optimalConditionsSummary": "Suhu optimal 37°C - 40°C pada pH netral 7.0 - 7.6",
    "variables": [
      {{
        "id": "var_suhu",
        "name": "Suhu Lingkungan",
        "min": 0,
        "max": 100,
        "step": 1,
        "defaultValue": 37,
        "unit": "°C",
        "optimalRange": [36, 42],
        "explanation": "Suhu di bawah optimal memperlambat gerak molekul, suhu di atas 55°C mendenaturasi struktur protein enzim."
      }},
      {{
        "id": "var_ph",
        "name": "Derajat Keasaman (pH)",
        "min": 1,
        "max": 14,
        "step": 0.5,
        "defaultValue": 7.4,
        "unit": "pH",
        "optimalRange": [7.0, 8.0],
        "explanation": "Perubahan pH mengubah muatan ionik pada sisi aktif enzim."
      }}
    ],
    "dynamicObservations": [
      {{
        "condition": "suhu < 20",
        "status": "inactive",
        "ratePercent": 18,
        "visualStateColor": "#5B8FB9",
        "narrativeFeedback": "Suhu terlalu dingin! Gerak brownian substrat lambat, tumbukan efektif jarang terjadi."
      }},
      {{
        "condition": "suhu >= 36 && suhu <= 42 && ph >= 7 && ph <= 8",
        "status": "optimal",
        "ratePercent": 98,
        "visualStateColor": "#1D5E4D",
        "narrativeFeedback": "Kondisi optimal tercapai! Laju reaksi maksimal, kompleks enzim-substrat terbentuk sempurna!"
      }},
      {{
        "condition": "suhu > 55 || ph < 3 || ph > 11",
        "status": "denatured",
        "ratePercent": 0,
        "visualStateColor": "#BA1A1A",
        "narrativeFeedback": "Struktur konformasi sisi aktif rusak permanen (Denaturasi)! Substrat tidak dapat berikatan lagi."
      }}
    ]
  }},
  "reactorDragDrop": {{
    "reactorTitle": "Reaktor Perakitan Sistem Pembelajaran",
    "instruction": "Pasangkan komponen ke dalam soket reaktor yang tepat untuk memicu reaksi sintesis!",
    "slots": [
      {{ "id": "slot_1", "name": "Soket Substrat Utama", "acceptedItemId": "item_1", "description": "Menampung bahan baku reaksi" }},
      {{ "id": "slot_2", "name": "Sisi Aktif Katalis", "acceptedItemId": "item_2", "description": "Menurunkan energi aktivasi" }},
      {{ "id": "slot_3", "name": "Aseptor Energi", "acceptedItemId": "item_3", "description": "Menyerap luaran stabil" }}
    ],
    "components": [
      {{ "id": "item_1", "label": "Komponen Substrat", "type": "reagent", "hint": "Pasangkan ke soket bahan baku" }},
      {{ "id": "item_2", "label": "Enzim Katalisator", "type": "catalyst", "hint": "Pasangkan ke sisi aktif" }},
      {{ "id": "item_3", "label": "Stabilisator Energi", "type": "stabilizer", "hint": "Pasangkan ke soket luaran" }}
    ]
  }}
}}"""

    try:
        reply = AIGatewayService.generate_chat([{"role": "user", "content": prompt}], model=settings.CHAT_MODEL, temperature=0.5)
        if reply:
            clean_json = re.sub(r"^```json\s*", "", reply.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            parsed = json.loads(clean_json)
            if "collectorGame" in parsed and "variableSimulator" in parsed:
                return json.dumps(parsed, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"[AdaptiveAssets] Universal game config AI error: {e}")

    # Fallback config terstruktur universal adaptif
    hero_title = "Bio-Organ Quest" if is_bio else "Kinetic Reactor Quest"
    hero_sprite = "🧬" if is_bio else "⚗️" if is_chem else "🚀"
    
    fallback_config = {
        "gameTitle": f"{hero_title}: {doc_title}",
        "gameType": "bio-quest" if is_bio else "reactor-sim",
        "theme": {
            "heroName": "Nano-Explorer Kognitif",
            "arenaBackground": "cellular" if is_bio else "chemical-lab",
            "heroSprite": hero_sprite,
            "missionObjective": "Gerakkan karakter dengan tombol arah / sentuhan untuk menyerap fragmen konsep nutrisi dan hindari racun!"
        },
        "collectorGame": {
            "playerSpeed": 6,
            "targetScore": 100,
            "timeLimitSec": 60,
            "collectibles": [
                {
                    "id": "col_1",
                    "label": f"Nutrisi Inti: {doc_title[:20]}",
                    "category": "nutrient",
                    "points": 15,
                    "speed": 2.2,
                    "feedback": "Hebat! Nutrisi konsep diserap sempurna!",
                    "color": "#1D5E4D"
                },
                {
                    "id": "col_2",
                    "label": "Koenzim Katalisator",
                    "category": "catalyst",
                    "points": 25,
                    "speed": 2.8,
                    "feedback": "Bonus energi aktivasi diperoleh!",
                    "color": "#785308"
                },
                {
                    "id": "col_3",
                    "label": "Inhibitor / Miskonsepsi",
                    "category": "toxic",
                    "points": -20,
                    "speed": 3.2,
                    "feedback": "Awas! Inhibitor merusak kestabilan sistem!",
                    "color": "#BA1A1A"
                }
            ]
        },
        "variableSimulator": {
            "simTitle": "Simulator Reaksi Enzimatis & Kinetika Variabel",
            "description": "Uji perubahan laju reaksi dengan menggeser slider variabel suhu dan derajat keasaman (pH).",
            "reactionOutputFormulaName": "Laju Efisiensi Reaksi (%)",
            "optimalConditionsSummary": "Suhu optimal 36°C - 42°C dengan pH netral 7.0 - 7.8",
            "variables": [
                {
                    "id": "var_suhu",
                    "name": "Suhu Reaksi",
                    "min": 0,
                    "max": 100,
                    "step": 1,
                    "defaultValue": 37,
                    "unit": "°C",
                    "optimalRange": [36, 42],
                    "explanation": "Suhu mengontrol kinetika partikel; jika terlalu panas (>55°C) ikatan hidrogen enzim rusak (denaturasi)."
                },
                {
                    "id": "var_ph",
                    "name": "Derajat Keasaman (pH)",
                    "min": 1,
                    "max": 14,
                    "step": 0.5,
                    "defaultValue": 7.4,
                    "unit": "pH",
                    "optimalRange": [7.0, 8.0],
                    "explanation": "pH mempengaruhi ionisasi gugus fungsional pada sisi aktif enzim."
                }
            ],
            "dynamicObservations": [
                {
                    "condition": "suhu < 20",
                    "status": "inactive",
                    "ratePercent": 20,
                    "visualStateColor": "#5B8FB9",
                    "narrativeFeedback": "Suhu rendah menyebabkan molekul substrat bergerak lambat, tumbukan efektif berkurang."
                },
                {
                    "condition": "suhu >= 36 && suhu <= 42 && ph >= 7 && ph <= 8",
                    "status": "optimal",
                    "ratePercent": 96,
                    "visualStateColor": "#1D5E4D",
                    "narrativeFeedback": "Kondisi optimal tercapai! Kompleks enzim-substrat terbentuk pada efisiensi puncak!"
                },
                {
                    "condition": "suhu > 55 || ph < 3 || ph > 11",
                    "status": "denatured",
                    "ratePercent": 0,
                    "visualStateColor": "#BA1A1A",
                    "narrativeFeedback": "Terjadi Denaturasi! Struktur 3D sisi aktif enzim rusak dan kehilangan kemampuan katalitiknya."
                }
            ]
        },
        "reactorDragDrop": {
            "reactorTitle": "Reaktor Kimia / Biologis Modular",
            "instruction": "Pasangkan komponen ke soket yang sesuai untuk memicu sintesis reaksi.",
            "slots": [
                { "id": "slot_1", "name": "Soket Substrat Primer", "acceptedItemId": "item_1", "description": "Menampung bahan baku materi" },
                { "id": "slot_2", "name": "Sisi Aktif Katalisator", "acceptedItemId": "item_2", "description": "Mempercepat penurunan energi aktivasi" },
                { "id": "slot_3", "name": "Kondensor Produk", "acceptedItemId": "item_3", "description": "Menampung luaran sintesis stabil" }
            ],
            "components": [
                { "id": "item_1", "label": "Substrat Molekuler", "type": "substrate", "hint": "Masukkan ke soket primer" },
                { "id": "item_2", "label": "Enzim Biokatalis", "type": "catalyst", "hint": "Pasangkan ke sisi aktif" },
                { "id": "item_3", "label": "Stabilisator Buffer", "type": "buffer", "hint": "Pasangkan ke kondensor produk" }
            ]
        }
    }
    return json.dumps(fallback_config, ensure_ascii=False)

def _generate_fill_in_the_blank(doc_title: str, context: str) -> str:
    """
    Menghasilkan tantangan kinestetik Drag & Drop Fill-in-the-Blank interaktif
    yang 100% universal untuk semua mata pelajaran sekolah K-12.
    Format output: JSON string berisi list FillBlankItem.
    """
    from app.services.gateway_service import AIGatewayService

    prompt = f"""Kamu adalah desainer pembelajaran aktif kinestetik (Kinesthetic Learning Specialist).
Berdasarkan judul materi '{doc_title}' dan isi teks kurikulum di bawah ini, rancanglah 4 sampai 6 butir tantangan kalimat berlubang (Fill-in-the-Blank Drag & Drop) yang menguji pemahaman konsep-konsep kunci esensial.

Panduan:
1. Pilih 4 sampai 6 kalimat penting yang membahas konsep/mekanisme/definisi penting.
2. Pada setiap kalimat, gantikan SATU kata/istilah kunci paling penting dengan tanda '[BLANK]'.
3. Sediakan 'blankWord' (kata yang benar) dan 'options' (4 pilihan kata: 1 kata benar + 3 kata pengecoh yang masuk akal dan relevan).
4. Berikan 'hint' (petunjuk singkat) dan 'explanation' (penjelasan mengapa jawaban tersebut tepat).

Konteks Materi:
{context[:4000]}

Kembalikan HANYA JSON array murni tanpa format markdown (tanpa ```json ... ```):
[
  {{
    "id": "fib_1",
    "sentence": "Kalimat konsep di mana kata kunci diganti dengan [BLANK].",
    "blankWord": "KataKunci",
    "options": ["KataKunci", "Pengecoh1", "Pengecoh2", "Pengecoh3"],
    "hint": "Petunjuk penalaran singkat...",
    "explanation": "Penjelasan ilmiah atau logis mengapa KataKunci adalah jawaban yang tepat..."
  }}
]"""

    try:
        reply = AIGatewayService.generate_chat([{"role": "user", "content": prompt}], model=settings.CHAT_MODEL, temperature=0.4)
        if reply:
            clean_json = re.sub(r"^```json\s*", "", reply.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) >= 2:
                valid_items = []
                for idx, it in enumerate(parsed):
                    if it.get("sentence") and it.get("blankWord") and isinstance(it.get("options"), list):
                        s = it["sentence"]
                        if "[BLANK]" not in s:
                            s = s.replace(it["blankWord"], "[BLANK]")
                        valid_items.append({
                            "id": it.get("id") or f"fib_{idx + 1}",
                            "sentence": s,
                            "blankWord": it["blankWord"],
                            "options": it["options"],
                            "hint": it.get("hint") or f"Fokus pada konsep kunci {doc_title}.",
                            "explanation": it.get("explanation") or f"{it['blankWord']} adalah elemen inti dalam memahami {doc_title}."
                        })
                if valid_items:
                    return json.dumps(valid_items, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"[AdaptiveAssets] Fill-in-the-blank AI generation error: {e}")

    # Fallback berbasis ekstraksi kalimat materi
    paras = [p.strip() for p in context.split("\n\n") if len(p.strip()) > 30]
    fallback_items = []
    stopwords = {"yang", "untuk", "dengan", "dalam", "adalah", "pada", "dari", "oleh", "secara", "sebagai", "dapat", "akan", "serta", "karena", "sebuah"}
    
    for idx, para in enumerate(paras[:5]):
        sentences = [s.strip() for s in re.split(r"[.?!]\s+", para) if len(s.strip()) > 25]
        target_s = sentences[0] if sentences else para[:100]
        words = re.findall(r"\b[A-Za-z0-9\-]{4,}\b", target_s)
        content_words = [w for w in words if w.lower() not in stopwords]
        
        if content_words:
            chosen_word = max(content_words[:5], key=len)
            blanked_s = re.sub(rf"\b{re.escape(chosen_word)}\b", "[BLANK]", target_s, count=1)
            distractors = ["Metode", "Struktur", "Prinsip", "Faktor"]
            opts = [chosen_word] + [d for d in distractors if d.lower() != chosen_word.lower()][:3]
            fallback_items.append({
                "id": f"fib_{idx + 1}",
                "sentence": blanked_s,
                "blankWord": chosen_word,
                "options": opts,
                "hint": f"Perhatikan konteks bahasan ke-{idx + 1} dari modul.",
                "explanation": f"Kata '{chosen_word}' merupakan istilah kunci yang melengkapi pernyataan konsep tersebut secara akurat."
            })

    if not fallback_items:
        fallback_items = [
            {
                "id": "fib_1",
                "sentence": f"Pemahaman konsep dasar [BLANK] sangat penting untuk menguasai materi ini secara menyeluruh.",
                "blankWord": "Teori",
                "options": ["Teori", "Hipotesis", "Simulasi", "Asumsi"],
                "hint": "Landasan fundamental ilmu.",
                "explanation": "Teori merupakan fondasi konseptual yang menopang pemahaman materi."
            }
        ]

    return json.dumps(fallback_items, ensure_ascii=False)

def generate_document_adaptive_assets(doc_id: str, db: Any) -> Dict[str, Any]:
    """
    Menghasilkan seluruh aset adaptif pembelajaran terpadu untuk satu dokumen (Kelas) sekali saja:
    1. Naskah Podcast Naratif Bertutur (Conversational Dialog Host & Pakar)
    2. Real-Time Karaoke Transcript Timestamps JSON (Dual-Coding Theory)
    3. Audio Podcast TTS (MP3/WAV) di disk uploads/podcasts/
    4. Diagram Peta Konsep Mermaid Visual
    5. Metadata Simpul Interaktif Visual (Kartu Komparasi & Visual Storyboard)
    6. Gambar Infografis AI (atau Fallback SVG High-Res Edukasi)
    7. AI Smart Flashcards JSON
    8. Universal Multi-Subject Kinesthetic Game Config JSON (Bio-Organ Quest, Slider Suhu/pH, Reaktor)
    
    Seluruh siswa di kelas yang bersangkutan langsung mengakses aset ini tanpa membuang token lagi.
    """
    import os
    import base64
    from app.models.document import GroundedDocument
    from app.services.gateway_service import AIGatewayService
    
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == doc_id).first()
    if not doc:
        logger.error(f"[AdaptiveAssets] Document {doc_id} not found.")
        return {}

    os.makedirs("uploads/podcasts", exist_ok=True)
    os.makedirs("uploads/images", exist_ok=True)

    summary_context = doc.raw_text[:8000] if len(doc.raw_text) > 8000 else doc.raw_text

    # 1. GENERATE CONVERSATIONAL PODCAST SCRIPT & KARAOKE SYNC TIMESTAMPS
    if not doc.podcast_script or not doc.karaoke_json or len(doc.podcast_script) < 200:
        logger.info(f"[AdaptiveAssets] Menyusun naskah podcast dialog dan sinkronisasi karaoke untuk '{doc.title}'...")
        script_text, karaoke_json_str = _generate_conversational_podcast(doc.title, summary_context)
        doc.podcast_script = script_text
        doc.karaoke_json = karaoke_json_str

    # 2. GENERATE AUDIO FILE VIA TTS
    audio_exists = any(
        os.path.exists(os.path.join("uploads", "podcasts", f"{doc.id}_podcast.{ext}"))
        for ext in ["mp3", "wav"]
    )
    if not doc.podcast_audio_url or not audio_exists:
        try:
            audio_filename = f"{doc.id}_podcast.mp3"
            audio_filepath = os.path.join("uploads", "podcasts", audio_filename)
            
            # Bersihkan format dialog speaker tag untuk narasi audio yang halus
            clean_tts_input = re.sub(r"\[?(Kak Ardi|Bu Citra|Host|Pakar)\]?:\s*", "", doc.podcast_script)
            clean_tts_input = clean_tts_input[:3500]
            
            logger.info(f"[AdaptiveAssets] Mensintesis audio podcast via EduVoice TTS ({len(clean_tts_input)} karakter)...")
            audio_bytes = AIGatewayService.generate_speech(text=clean_tts_input, voice=settings.TTS_VOICE, model=settings.TTS_MODEL)
            if audio_bytes and len(audio_bytes) > 200:
                with open(audio_filepath, "wb") as f:
                    f.write(audio_bytes)
                doc.podcast_audio_url = f"/api/v1/documents/{doc.id}/podcast-audio"
                logger.info(f"[AdaptiveAssets] Audio podcast berhasil disimpan ke {audio_filepath} ({len(audio_bytes)} bytes)")
        except Exception as e:
            logger.warning(f"[AdaptiveAssets] TTS generation error: {e}")

    # 3. GENERATE VISUAL MINDMAP (Mermaid SVG Code)
    if not doc.mindmap_code:
        try:
            logger.info(f"[AdaptiveAssets] Menyusun peta konsep diagram Mermaid untuk '{doc.title}'...")
            mindmap_res = generate_visual_mindmap(doc.title, summary_context[:2000])
            if mindmap_res and "code" in mindmap_res:
                doc.mindmap_code = mindmap_res["code"]
        except Exception as e:
            logger.warning(f"[AdaptiveAssets] Mindmap generation error: {e}")

    # 4. GENERATE INTERACTIVE VISUAL NODES METADATA (Kartu Komparasi & Storyboard)
    if not doc.visual_nodes_json:
        logger.info(f"[AdaptiveAssets] Menyusun metadata simpul visual dan kartu komparasi untuk '{doc.title}'...")
        doc.visual_nodes_json = _generate_visual_nodes_metadata(doc.title, summary_context, doc.mindmap_code or "")

    # 5. GENERATE VISUAL INFOGRAPHIC IMAGE
    image_exists = os.path.exists(os.path.join("uploads", "images", f"{doc.id}_visual.png"))
    if not doc.visual_image_url or not image_exists:
        try:
            image_filename = f"{doc.id}_visual.png"
            image_filepath = os.path.join("uploads", "images", image_filename)
            
            img_prompt = f"Detailed educational scientific infographic diagram of {doc.title}, clean biology physics chemistry visual charts, labelled biological or scientific mechanism, professional medical textbook illustration, no blurry text, high resolution"
            img_res = AIGatewayService.generate_image(prompt=img_prompt, size="1024x1024", model=settings.IMAGE_GEN_MODEL)
            
            if img_res and "b64_json" in img_res and img_res["b64_json"]:
                img_data = base64.b64decode(img_res["b64_json"])
                with open(image_filepath, "wb") as f:
                    f.write(img_data)
                doc.visual_image_url = f"/api/v1/documents/{doc.id}/visual-image"
                logger.info(f"[AdaptiveAssets] Visual infographic saved to {image_filepath}")
            elif img_res and "url" in img_res:
                doc.visual_image_url = img_res["url"]
        except Exception as e:
            logger.warning(f"[AdaptiveAssets] Image gen error: {e}")

    # 6. GENERATE UNIVERSAL KINESTHETIC GAME CONFIG (Bio-Organ Quest, Slider Suhu/pH, Reaktor)
    if not doc.game_config_json:
        logger.info(f"[AdaptiveAssets] Merancang konfigurasi gamifikasi kinestetik universal untuk '{doc.title}'...")
        doc.game_config_json = _generate_universal_game_config(doc.title, summary_context)

    # 7. GENERATE AI FLASHCARDS
    if not doc.flashcards_json:
        try:
            paras = [p.strip() for p in doc.raw_text.split("\n\n") if len(p.strip()) > 30]
            flashcards = []
            for idx, p in enumerate(paras[:6]):
                sentences = [s.strip() for s in re.split(r"[.?!]\s+", p) if len(s.strip()) > 5]
                q = sentences[0] if sentences else p[:70]
                ans = ". ".join(sentences[1:3]) if len(sentences) > 1 else p
                flashcards.append({
                    "id": f"fc_{idx + 1}",
                    "question": f"Apa prinsip inti dari konsep berikut: \"{q[:80]}\"?",
                    "answer": ans[:200] if ans else p[:150],
                    "hint": f"Perhatikan hubungan sebab-akibat pada bab ke-{idx + 1}.",
                    "conceptTag": f"KONSEP 0{idx + 1}"
                })
            if flashcards:
                doc.flashcards_json = json.dumps(flashcards, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"[AdaptiveAssets] Flashcards error: {e}")

    # 8. GENERATE UNIVERSAL FILL-IN-THE-BLANK KINESTHETIC CHALLENGES
    if not doc.fill_blank_json:
        logger.info(f"[AdaptiveAssets] Merancang tantangan kinestetik Drag & Drop Fill-in-the-Blank untuk '{doc.title}'...")
        doc.fill_blank_json = _generate_fill_in_the_blank(doc.title, summary_context)

    db.commit()
    db.refresh(doc)
    logger.info(f"[AdaptiveAssets] Selesai memproduksi seluruh aset adaptif pembelajaran terpadu untuk '{doc.title}' ({doc.id})")
    return {
        "podcast_audio_url": doc.podcast_audio_url,
        "podcast_script": doc.podcast_script,
        "karaoke_json": doc.karaoke_json,
        "mindmap_code": doc.mindmap_code,
        "visual_nodes_json": doc.visual_nodes_json,
        "visual_image_url": doc.visual_image_url,
        "game_config_json": doc.game_config_json,
        "flashcards_json": doc.flashcards_json,
        "fill_blank_json": doc.fill_blank_json,
    }

