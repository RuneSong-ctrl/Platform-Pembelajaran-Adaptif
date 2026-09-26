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

TEACHER_INSTRUCTION = """Kamu adalah asisten mengajar untuk guru di EduAdapt (Kurikulum Merdeka, Indonesia).
Bantu guru menyiapkan pembelajaran: rencana pelajaran, soal dan kunci jawaban, rubrik, penjelasan sederhana untuk siswa,
dan membaca kondisi kelas dari data yang diberikan.

Aturan:
1. Pakai bahasa Indonesia yang lugas dan langsung ke inti. Jangan berbasa-basi atau memuji pertanyaan.
2. Jika ada teks di [MODUL_GURU], jadikan itu dasar utama dan sebut judul materinya. Jika materi tidak memuat jawabannya, katakan terus terang lalu beri saran umum yang ditandai sebagai di luar materi.
3. Jika ada [DATA_KELAS], jawab pertanyaan tentang siswa hanya dari data itu. Jangan mengarang nama, nilai, atau kejadian.
4. Untuk soal, selalu sertakan kunci jawaban. Untuk rencana pelajaran, sertakan tujuan, langkah beserta alokasi waktu, dan cara menilai.
5. Jangan pakai tabel Markdown; pakai daftar bernomor atau poin supaya mudah dibaca di layar chat.
"""

def _call_gemini_text(
    prompt: str,
    system_instruction: Optional[str] = None,
    temperature: float = 0.5,
    json_mode: bool = False,
    max_output_tokens: int = 4000,
) -> Optional[str]:
    """
    Eksekutor inferensi teks terpadu untuk Gemini AI Tutor & Alat Pembelajaran Adaptif:
    1. Coba 9router / OpenAI-compatible Gateway jika endpoint terkonfigurasi di .env.
    2. Eksekusi langsung via SDK resmi Google Gemini (google.genai).
    """
    # 1. Coba via 9router Gateway jika endpoint diisi
    if settings.CHAT_ENDPOINT and (settings.CHAT_API_KEY or (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.startswith("sk-"))):
        try:
            from app.services.gateway_service import AIGatewayService
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})
            reply = AIGatewayService.generate_chat(messages, model=settings.CHAT_MODEL, temperature=temperature)
            if reply:
                return reply
        except Exception as e:
            logger.debug(f"[GeminiService] Gateway chat error: {e}")

    # 2. Coba via SDK resmi Google Gemini
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("sk-"):
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            config_params: Dict[str, Any] = {
                "temperature": temperature,
                "max_output_tokens": max_output_tokens
            }
            if system_instruction:
                config_params["system_instruction"] = system_instruction
            if json_mode:
                config_params["response_mime_type"] = "application/json"

            config = types.GenerateContentConfig(**config_params)

            model_candidates = [
                settings.clean_chat_model,
                "gemini-3.7-flash",
                "gemini-3.5-flash",
                "gemini-3.5-flash-lite",
                "gemini-2.5-flash",
                "gemini-2.5-flash-lite"
            ]
            seen = set()
            unique_candidates = [m for m in model_candidates if m and not (m in seen or seen.add(m))]

            for model_name in unique_candidates:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=config
                    )
                    if response and response.text:
                        return response.text.strip()
                except Exception as e:
                    logger.debug(f"[GeminiService] Gemini SDK model '{model_name}' failed: {e}")
                    continue
        except Exception as e:
            logger.error(f"[GeminiService] Gemini SDK execution error: {e}")

    return None

def chat_with_gemini(
    user_query: str,
    chat_history: List[Dict[str, str]],
    classroom_id: Optional[str] = None,
    document_id: Optional[str] = None,
    learning_style: Optional[str] = "VISUAL",
    student_name: Optional[str] = "Siswa",
    teacher_context: Optional[str] = None,
) -> Dict[str, Any]:
    """teacher_context set (even "") switches to the teacher assistant; it holds the [DATA_KELAS] summary."""
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
    
    is_teacher = teacher_context is not None
    system_inst = TEACHER_INSTRUCTION if is_teacher else _build_system_instruction(learning_style)
    asker = "Pertanyaan Guru" if is_teacher else f"Pertanyaan Siswa ({student_name})"
    class_block = f"\n\n[DATA_KELAS]\n{teacher_context}\n[/DATA_KELAS]" if teacher_context else ""

    rag_context = ""
    citations = []
    if relevant_chunks:
        rag_context = "\n\n".join([f"[{chk['document_title']}]: {chk['text']}" for chk in relevant_chunks])
        citations = list({f"{chk['document_title']} (Relevansi: {int(chk['similarity_score'] * 100)}%)" for chk in relevant_chunks})

    # 2.A Call 9router AI Gateway if endpoint is set or API key is sk-
    if settings.CHAT_ENDPOINT and (settings.CHAT_API_KEY or (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.startswith("sk-"))):
        try:
            from app.services.gateway_service import AIGatewayService
            messages = [{"role": "system", "content": system_inst}]
            trimmed_history = chat_history[-6:] if len(chat_history) > 6 else chat_history
            for h in trimmed_history:
                role = "user" if h.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": h.get("text", "")})
            prompt_content = f"""[MODUL_GURU]
{rag_context if rag_context else "Belum ada dokumen modul spesifik terindeks. Jawab berdasarkan prinsip sains kurikulum umum."}
[/MODUL_GURU]{class_block}

{asker}: {clean_query}"""
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
            logger.debug(f"[GeminiService] 9router chat generation failed: {e}")

    # 2.B Call official Google Gemini SDK if standard Gemini API Key
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("sk-"):
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            prompt_content = f"""[MODUL_GURU]
{rag_context if rag_context else "Belum ada dokumen modul spesifik terindeks. Jawab berdasarkan prinsip sains kurikulum umum."}
[/MODUL_GURU]{class_block}

{asker}: {clean_query}"""

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
                system_instruction=system_inst,
                temperature=0.4,
                max_output_tokens=1500,
            )

            model_candidates = [
                settings.clean_chat_model,
                "gemini-3.7-flash",
                "gemini-3.5-flash",
                "gemini-3.5-flash-lite",
                "gemini-2.5-flash",
            ]
            seen = set()
            unique_candidates = [m for m in model_candidates if m and not (m in seen or seen.add(m))]

            reply_text = None
            used_model = settings.clean_chat_model
            for target_model in unique_candidates:
                try:
                    response = client.models.generate_content(
                        model=target_model,
                        contents=contents,
                        config=config
                    )
                    if response and response.text:
                        reply_text = response.text
                        used_model = target_model
                        break
                except Exception as e:
                    logger.debug(f"[GeminiService] Chat model '{target_model}' error: {e}")
                    continue

            if reply_text:
                return {
                    "text": reply_text,
                    "citation": " • ".join(citations) if citations else "Asisten Belajar EduAdapt",
                    "is_grounded": bool(relevant_chunks),
                    "model": used_model
                }
        except Exception as e:
            logger.error(f"[GeminiService] API generation failed: {e}")

    # 3. Fallback jika offline / API key kosong
    if is_teacher:
        return {
            "text": "Asisten belum bisa menjawab karena layanan AI tidak tersambung. Periksa GEMINI_API_KEY atau CHAT_ENDPOINT di file .env backend, lalu coba lagi.",
            "citation": "",
            "is_grounded": False,
            "model": "unavailable",
        }
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

    reply = _call_gemini_text(user_prompt, system_instruction=system_prompt, temperature=0.6, json_mode=True)
    if reply:
        try:
            clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", reply.strip(), flags=re.MULTILINE).strip()
            match = re.search(r"\[\s*\{.*\}\s*\]", clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) >= min(3, num_questions):
                logger.info(f"[GeminiService] Successfully generated {len(parsed)} AI quiz questions.")
                return parsed
            elif isinstance(parsed, dict) and "questions" in parsed and isinstance(parsed["questions"], list):
                return parsed["questions"]
        except Exception as e:
            logger.warning(f"[GeminiService] Quiz JSON parsing error: {e}")

    # No invented template questions: the caller tells the teacher to try again instead.
    return []

def generate_visual_mindmap(concept: str, context: Optional[str] = None) -> Dict[str, str]:
    """
    Menghasilkan diagram alur visual Mermaid.js berbasis konsep saintifik.
    """
    clean_concept = sanitize_user_input(concept, max_chars=300)
    context_str = f" Berdasarkan materi: {context[:500]}." if context else ""
    prompt = f"Buatlah diagram alur Mermaid.js (graph TD) sederhana dan edukatif untuk konsep atau materi: '{clean_concept}'.{context_str} Kembalikan HANYA kode diagram mermaid valid di dalam blok ```mermaid."

    reply = _call_gemini_text(prompt, temperature=0.3)
    if reply:
        mermaid_match = re.search(r"```mermaid\s*(.*?)\s*```", reply, re.DOTALL)
        if mermaid_match:
            return {
                "type": "mermaid",
                "code": mermaid_match.group(1).strip(),
                "title": clean_concept
            }
        elif "graph " in reply:
            return {
                "type": "mermaid",
                "code": reply.strip(),
                "title": clean_concept
            }

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

def _generate_podcast_episodes(doc_title: str, context: str) -> List[Dict[str, Any]]:
    """
    Menghasilkan playlist 3-5 episode podcast mendalam dan komprehensif (minimal 1.5 - 2.5 menit per episode)
    dalam format narasi tunggal (solo narrator) edukatif yang komunikatif, terstruktur, dan kaya analogi.
    """
    prompt = f"""Kamu adalah narator podcast edukasi adaptif profesional kelas dunia (Solo Narrator).
Berdasarkan modul ajar: '{doc_title}', rancanglah playlist 3 sampai 5 episode podcast MENDALAM, DETAIL, dan KOMPREHENSIF.

PERSYARATAN WAJIB KONTEN & DURASI:
- Setiap episode WAJIB berdurasi minimal 1.5 menit (90 sampai 150 detik), dengan panjang naskah sekitar 220 sampai 350 kata (1.400 - 2.200 karakter).
- DILARANG KERAS membuat naskah pendek/rangkuman dangkal. Setiap episode harus membedah topik secara tuntas, menjelaskan mekanisme sebab-akibat, memberikan analogi konkret dunia nyata, dan mengupas studi kasus nyata yang relevan.
- Format narasi tunggal: teks tuturan murni yang dibacakan mengalir oleh seorang pembimbing ahli yang ramah dan inspiratif, tanpa tag pembicara, tanpa dialog, tanpa tanda markdown bintang '**' atau pagar '#'.
- Kembalikan HANYA JSON array murni tanpa format markdown pembungkus.

Format JSON:
[
  {{
    "id": "ep_1",
    "order": 1,
    "title": "Episode 1: [Judul Sub-Topik Fondasi & Cara Kerja Inti]",
    "description": "Ringkasan 1-2 kalimat tentang konsep mendalam yang dibedah di episode ini.",
    "script": "Halo rekan pembelajar adaptif! Selamat datang di episode pertama... (naskah tuturan lengkap, mengalir, dan mendalam minimal 220-350 kata)...",
    "durationSec": 100
  }}
]

Konteks Modul Ajar:
{context[:5500]}"""

    try:
        reply = _call_gemini_text(prompt, temperature=0.6, json_mode=True)
        if reply:
            clean_json = re.sub(r"^```json\s*", "", reply.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            match = re.search(r"\[\s*\{.*\}\s*\]", clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) >= 2:
                valid_eps = []
                for idx, ep in enumerate(parsed):
                    if ep.get("title") and ep.get("script"):
                        words = len(ep["script"].split())
                        est_sec = max(90, min(180, int(words / 2.2)))
                        valid_eps.append({
                            "id": ep.get("id") or f"ep_{idx + 1}",
                            "order": idx + 1,
                            "title": ep.get("title") or f"Episode {idx + 1}: {doc_title}",
                            "description": ep.get("description") or f"Pembahasan mendalam sub-topik ke-{idx + 1} dari modul {doc_title}.",
                            "script": re.sub(r"[*#_`~>\[\]]+", " ", ep["script"]).strip(),
                            "durationSec": ep.get("durationSec") or est_sec
                        })
                if valid_eps:
                    return valid_eps
    except Exception as e:
        logger.debug(f"[AdaptiveAssets] Podcast episodes AI generation error: {e}")

    # Fallback substantif mendalam jika AI offline
    paras = [p.strip() for p in context.split("\n\n") if len(p.strip()) > 60]
    if not paras:
        paras = [f"Pembahasan komprehensif mengenai materi {doc_title}."]

    fallback_eps = []
    titles = [
        f"Episode 1: Fondasi Filosofis & Hakikat {doc_title}",
        f"Episode 2: Mekanisme Inti & Interaksi Sistemik",
        f"Episode 3: Analisis Kasus Nyata & Dinamika Masalah",
        f"Episode 4: Implementasi Strategis & Sintesis Masa Depan"
    ]
    descs = [
        f"Membedah latar belakang mendasar, ruang lingkup konsep, dan urgensi mempelajari {doc_title}.",
        f"Menguraikan proses demi proses bagaimana komponen saling terhubung dan bekerja secara nyata.",
        f"Mempelajari skenario nyata di lapangan, tantangan kritis, dan solusi adaptif yang dapat diterapkan.",
        f"Menarik benang merah ke penerapan teknologi praktis dan keterampilan abad ke-21."
    ]

    count = min(4, max(2, len(paras)))
    for idx in range(count):
        p_text = paras[idx] if idx < len(paras) else paras[0]
        script_body = (
            f"Halo rekan pembelajar adaptif! Selamat datang di episode ke-{idx + 1} dari seri podcast modul {doc_title}. "
            f"Pada sesi kali ini, fokus utama kita adalah membedah {titles[idx].split(': ')[1]}. "
            f"Mari kita mulai dari pemahaman mendasar: {p_text}. "
            f"Ketika kita menelaah konsep ini lebih dalam, kita melihat bahwa setiap unsur memiliki peranan yang sangat krusial dalam menjaga keseimbangan sistem. "
            f"Bayangkan seperti sebuah mesin presisi tinggi, di mana setiap roda gigi harus selaras agar hasil akhir dapat tercapai secara optimal. "
            f"Dalam implementasi praktisnya, pemahaman ini memberikan fondasi yang kokoh bagi kita untuk menganalisis berbagai skenario kompleks dan mengambil keputusan berbasis bukti yang tepat. "
            f"Tetap fokus, renungkan prinsip kuncinya, dan mari kita lanjutkan eksplorasi konsep berikutnya di episode mendatang!"
        )
        words = len(script_body.split())
        est_sec = max(90, min(150, int(words / 2.2)))
        fallback_eps.append({
            "id": f"ep_{idx + 1}",
            "order": idx + 1,
            "title": titles[idx],
            "description": descs[idx],
            "script": script_body,
            "durationSec": est_sec
        })

    return fallback_eps

def _generate_visual_nodes_metadata(doc_title: str, context: str, mindmap_code: str) -> str:
    """
    Menghasilkan metadata simpul (node) kaya konten untuk kanvas interaktif React Flow
    lengkap dengan posisi koordinat auto-layout, koneksi relasional, dan side-panel detail.
    """
    prompt = f"""Kamu adalah desainer pembelajaran visual interaktif (Interactive Visual Learning Specialist).
Berdasarkan materi '{doc_title}', rancanglah 4 sampai 6 simpul konsep terstruktur (React Flow interactive nodes) yang mencakup seluruh peta pemahaman modul.

Konteks Materi:
{context[:3500]}

Kembalikan HANYA JSON array murni tanpa markdown blok atau teks pengantar. Format JSON:
[
  {{
    "id": "node_1",
    "title": "Nama Konsep Pokok",
    "category": "Fondasi Teori / Mekanisme & Proses / Regulasi Sistem / Aplikasi Terapan",
    "shortDefinition": "Definisi singkat 1-2 kalimat untuk badge kartu.",
    "detailedExplanation": "Penjelasan mendalam 3-5 kalimat komprehensif yang membongkar cara kerja konsep ini secara tuntas untuk side-panel.",
    "keyPrinciples": ["Prinsip penting 1", "Prinsip penting 2", "Prinsip penting 3"],
    "realWorldAnalogy": "Analogi nyata yang sangat konkret dan mudah dibayangkan siswa.",
    "visualMetaphor": "Deskripsi gambaran visual grafis untuk imajinasi spasial siswa.",
    "connections": ["node_2", "node_3"],
    "position": {{ "x": 100, "y": 150 }},
    "comparisonWithOtherNodes": [
      {{ "targetNode": "Konsep Lain", "differences": "Perbedaan karakteristik", "similarities": "Titik kesamaan fungsional" }}
    ],
    "practicalApplications": ["Contoh aplikasi nyata 1", "Contoh aplikasi nyata 2"]
  }}
]"""

    try:
        reply = _call_gemini_text(prompt, temperature=0.5, json_mode=True)
        if reply:
            clean_json = re.sub(r"^```json\s*", "", reply.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            match = re.search(r"\[\s*\{.*\}\s*\]", clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) >= 2:
                # Pastikan posisi default teratur jika belum ada
                for idx, n in enumerate(parsed):
                    if "position" not in n or not isinstance(n["position"], dict):
                        col = idx % 3
                        row = idx // 3
                        n["position"] = {"x": 80 + col * 260, "y": 60 + row * 180}
                    if "connections" not in n or not isinstance(n["connections"], list):
                        next_id = f"node_{idx + 2}" if idx + 2 <= len(parsed) else "node_1"
                        n["connections"] = [next_id]
                return json.dumps(parsed, ensure_ascii=False)
    except Exception as e:
        logger.debug(f"[AdaptiveAssets] Visual nodes AI metadata error: {e}")

    # Fallback substantif terstruktur dengan posisi teratur
    paras = [p.strip() for p in context.split("\n\n") if len(p.strip()) > 30]
    fallback_nodes = [
        {
            "id": "node_1",
            "title": f"Fondasi Konsep {doc_title}",
            "category": "Fondasi Teori",
            "shortDefinition": paras[0][:140] if paras else f"Prinsip dasar pembangun konsep {doc_title}.",
            "detailedExplanation": (paras[0] if paras else f"Konsep {doc_title} adalah pilar penting.") + " Pembahasan ini mencakup terminologi, parameter kunci, dan kerangka ilmiah dasar yang menopang seluruh materi.",
            "keyPrinciples": ["Definisi terminologi ilmiah", "Karakteristik variabel pokok", "Postulat dasar sistem"],
            "realWorldAnalogy": "Bagaikan fondasi bangunan bertingkat yang menopang seluruh struktur lantai di atasnya.",
            "visualMetaphor": "Balok pijakan kokoh yang menjadi titik tumpu bagi cabang-cabang mekanisme lainnya.",
            "connections": ["node_2", "node_3"],
            "position": {"x": 60, "y": 80},
            "comparisonWithOtherNodes": [
                {"targetNode": "Mekanisme Dinamis", "differences": "Fondasi bersifat konstan sedangkan mekanisme bersifat interaktif", "similarities": "Keduanya saling melengkapi sistem"}
            ],
            "practicalApplications": ["Identifikasi parameter dasar eksperimen", "Penyusunan hipotesis awal"]
        },
        {
            "id": "node_2",
            "title": "Mekanisme & Hubungan Sistemik",
            "category": "Mekanisme & Proses",
            "shortDefinition": paras[1][:140] if len(paras) > 1 else "Hubungan timbal balik dan dinamika kerja antar-elemen konsep.",
            "detailedExplanation": (paras[1] if len(paras) > 1 else "Mekanisme proses berjalan melalui interaksi dinamis antar komponen.") + " Setiap perubahan pada satu variabel langsung mempengaruhi kesetimbangan variabel lainnya.",
            "keyPrinciples": ["Hukum aksi-reaksi sistemik", "Faktor katalisator dan akselerator", "Dinamika kesetimbangan"],
            "realWorldAnalogy": "Bagaikan gir-gir mesin jam mekanik yang berputar harmonis menciptakan detak waktu yang akurat.",
            "visualMetaphor": "Rangkaian roda gigi saling mengunci dengan panah energi yang mengalir terus menerus.",
            "connections": ["node_3", "node_4"],
            "position": {"x": 340, "y": 80},
            "comparisonWithOtherNodes": [
                {"targetNode": "Fondasi Konsep", "differences": "Menjelaskan cara kerja dinamis di lapangan", "similarities": "Berpijak pada aturan hukum ilmiah yang sama"}
            ],
            "practicalApplications": ["Prediksi luaran eksperimen laboratorium", "Pengendalian laju proses"]
        },
        {
            "id": "node_3",
            "title": "Regulasi & Faktor Pengendali",
            "category": "Regulasi Sistem",
            "shortDefinition": paras[2][:140] if len(paras) > 2 else "Parameter pengendali yang menjaga stabilitas kondisi ideal.",
            "detailedExplanation": "Sistem ini memerlukan regulasi ketat terhadap kondisi lingkungan eksternal dan internal agar proses tetap berjalan pada efisiensi puncak tanpa mengalami disrupsi.",
            "keyPrinciples": ["Toleransi ambang batas variabel", "Umpan balik negatif dan positif", "Respon adaptif sistem"],
            "realWorldAnalogy": "Bagaikan termostat otomatis yang mengatur suhu ruangan agar tetap sejuk dan stabil.",
            "visualMetaphor": "Katup pengaman dengan indikator jarum ukur yang berayun di zona hijau optimal.",
            "connections": ["node_4"],
            "position": {"x": 60, "y": 280},
            "comparisonWithOtherNodes": [
                {"targetNode": "Mekanisme Dinamis", "differences": "Regulasi bertindak sebagai rem dan gas pengendali", "similarities": "Bekerja di dalam domain sistem yang sama"}
            ],
            "practicalApplications": ["Optimasi kondisi reaksi", "Mitigasi anomali dan error"]
        },
        {
            "id": "node_4",
            "title": "Aplikasi Terapan & Sintesis",
            "category": "Aplikasi Terapan",
            "shortDefinition": paras[3][:140] if len(paras) > 3 else "Implementasi praktis konsep dalam teknologi, lingkungan, dan kehidupan.",
            "detailedExplanation": "Penguasaan konsep memungkinkan rekayasa teknologi terapan, pemecahan masalah saintifik nyata, serta inovasi dalam industri modern.",
            "keyPrinciples": ["Optimalisasi pemanfaatan sistem", "Efisiensi konversi energi", "Keberlanjutan fungsi"],
            "realWorldAnalogy": "Bagaikan mobil listrik mutakhir yang memadukan aerodinamika, motor listrik, dan baterai pintar.",
            "visualMetaphor": "Pohon yang berbuah lebat sebagai hasil dari akar yang kokoh dan batang yang sehat.",
            "connections": ["node_1"],
            "position": {"x": 340, "y": 280},
            "comparisonWithOtherNodes": [
                {"targetNode": "Fondasi Konsep", "differences": "Fokus pada produk dan manfaat akhir", "similarities": "Merupakan perwujudan konkret dari teori dasar"}
            ],
            "practicalApplications": ["Inovasi bioteknologi/teknik terapan", "Pemecahan studi kasus nyata"]
        }
    ]
    return json.dumps(fallback_nodes, ensure_ascii=False)

def _generate_universal_game_config(doc_title: str, context: str) -> str:
    """
    Menghasilkan konfigurasi Reaktor Drag & Drop Kinestetik yang diperluas (5-8 slot dan komponen).
    Setiap slot memiliki deskripsi tugas dan komponen yang harus dipasangkan secara tepat.
    """
    prompt = f"""Kamu adalah Lead Game Designer edukasi adaptif kinestetik.
Rancanglah konfigurasi Reaktor Perakitan Konseptual (Reactor Drag & Drop Assembly) yang SANGAT KAYA berisi TEPAT 5 sampai 8 soket (slots) dan 5 sampai 8 komponen (components) untuk materi: '{doc_title}'.

Materi:
{context[:3500]}

Format JSON WAJIB (HANYA JSON murni tanpa markdown pembuka/penutup):
{{
  "gameTitle": "Reaktor Perakitan Sistem: {doc_title}",
  "gameType": "reactor-sim",
  "theme": {{
    "heroName": "Nano-Explorer Kognitif",
    "arenaBackground": "chemical-lab",
    "heroSprite": "⚗️",
    "missionObjective": "Pasangkan 5 sampai 8 komponen konsep ke dalam soket reaktor yang tepat untuk mengaktifkan sistem!"
  }},
  "reactorDragDrop": {{
    "reactorTitle": "Reaktor Sintesis & Perakitan {doc_title}",
    "instruction": "Tarik (drag) setiap komponen materi dari panel kiri dan letakkan (drop) ke dalam soket reaktor yang sesuai!",
    "slots": [
      {{ "id": "slot_1", "name": "Nama Soket 1", "acceptedItemId": "item_1", "description": "Fungsi/peran soket ini dalam sistem" }},
      {{ "id": "slot_2", "name": "Nama Soket 2", "acceptedItemId": "item_2", "description": "Fungsi/peran soket 2" }},
      {{ "id": "slot_3", "name": "Nama Soket 3", "acceptedItemId": "item_3", "description": "Fungsi/peran soket 3" }},
      {{ "id": "slot_4", "name": "Nama Soket 4", "acceptedItemId": "item_4", "description": "Fungsi/peran soket 4" }},
      {{ "id": "slot_5", "name": "Nama Soket 5", "acceptedItemId": "item_5", "description": "Fungsi/peran soket 5" }},
      {{ "id": "slot_6", "name": "Nama Soket 6", "acceptedItemId": "item_6", "description": "Fungsi/peran soket 6" }}
    ],
    "components": [
      {{ "id": "item_1", "label": "Nama Komponen 1", "type": "substrate", "hint": "Petunjuk penempatan komponen 1" }},
      {{ "id": "item_2", "label": "Nama Komponen 2", "type": "catalyst", "hint": "Petunjuk penempatan komponen 2" }},
      {{ "id": "item_3", "label": "Nama Komponen 3", "type": "regulator", "hint": "Petunjuk penempatan komponen 3" }},
      {{ "id": "item_4", "label": "Nama Komponen 4", "type": "energy", "hint": "Petunjuk penempatan komponen 4" }},
      {{ "id": "item_5", "label": "Nama Komponen 5", "type": "stabilizer", "hint": "Petunjuk penempatan komponen 5" }},
      {{ "id": "item_6", "label": "Nama Komponen 6", "type": "product", "hint": "Petunjuk penempatan komponen 6" }}
    ]
  }}
}}"""

    try:
        reply = _call_gemini_text(prompt, temperature=0.5, json_mode=True)
        if reply:
            clean_json = re.sub(r"^```json\s*", "", reply.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            match = re.search(r"\{\s*\"gameTitle\".*\}\s*", clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
            parsed = json.loads(clean_json)
            if "reactorDragDrop" in parsed and isinstance(parsed["reactorDragDrop"].get("slots"), list) and len(parsed["reactorDragDrop"]["slots"]) >= 4:
                return json.dumps(parsed, ensure_ascii=False)
    except Exception as e:
        logger.debug(f"[AdaptiveAssets] Universal game config AI error: {e}")

    # Fallback config terstruktur 6-slot reaktor
    fallback_config = {
        "gameTitle": f"Reaktor Perakitan Sistem: {doc_title}",
        "gameType": "reactor-sim",
        "theme": {
            "heroName": "Nano-Explorer Kognitif",
            "arenaBackground": "chemical-lab",
            "heroSprite": "⚗️",
            "missionObjective": "Pasangkan 6 komponen konsep ke dalam soket reaktor yang tepat untuk mengaktifkan sistem!"
        },
        "reactorDragDrop": {
            "reactorTitle": f"Reaktor Sintesis & Perakitan: {doc_title}",
            "instruction": "Tarik (drag) setiap komponen materi dari panel kiri dan letakkan (drop) ke dalam soket reaktor yang sesuai!",
            "slots": [
                { "id": "slot_1", "name": "Soket Substrat Primer", "acceptedItemId": "item_1", "description": "Menampung bahan baku dasar reaksi" },
                { "id": "slot_2", "name": "Sisi Aktif Katalisator", "acceptedItemId": "item_2", "description": "Menurunkan energi aktivasi sistem" },
                { "id": "slot_3", "name": "Regulator Keseimbangan", "acceptedItemId": "item_3", "description": "Mengontrol laju dan arah proses" },
                { "id": "slot_4", "name": "Kofaktor Penggerak Energi", "acceptedItemId": "item_4", "description": "Menyuplai energi kinetik molekuler" },
                { "id": "slot_5", "name": "Stabilisator Buffer Lingkungan", "acceptedItemId": "item_5", "description": "Menjaga pH dan kondisi optimal" },
                { "id": "slot_6", "name": "Kondensor Produk Akhir", "acceptedItemId": "item_6", "description": "Menampung hasil sintesis stabil" }
            ],
            "components": [
                { "id": "item_1", "label": f"Bahan Baku {doc_title[:18]}", "type": "substrate", "hint": "Pasangkan ke soket bahan baku dasar primer" },
                { "id": "item_2", "label": "Biokatalis Enzimatis", "type": "catalyst", "hint": "Pasangkan ke sisi aktif katalisator" },
                { "id": "item_3", "label": "Regulator Alosterik", "type": "regulator", "hint": "Pasangkan ke modul regulator keseimbangan" },
                { "id": "item_4", "label": "Donor Energi ATP/GTP", "type": "energy", "hint": "Pasangkan ke soket kofaktor penggerak energi" },
                { "id": "item_5", "label": "Larutan Penyangga Buffer", "type": "stabilizer", "hint": "Pasangkan ke stabilisator buffer lingkungan" },
                { "id": "item_6", "label": "Produk Konversi Stabil", "type": "product", "hint": "Pasangkan ke kondensor produk akhir" }
            ]
        }
    }
    return json.dumps(fallback_config, ensure_ascii=False)

def _generate_sorting_challenges(doc_title: str, context: str) -> str:
    """
    Menghasilkan tantangan kinestetik Process Sorting / Ordering interaktif
    di mana siswa menyusun langkah-langkah proses atau kronologi materi secara runtut.
    """
    prompt = f"""Kamu adalah desainer pembelajaran aktif kinestetik (Kinesthetic Ordering Specialist).
Berdasarkan materi: '{doc_title}', susunlah 3 sampai 5 tantangan menyusun urutan proses / kronologi / tahapan mekanisme (Sorting/Ordering Challenges).

Konteks Materi:
{context[:3800]}

Kembalikan HANYA JSON array murni tanpa format markdown pembungkus:
[
  {{
    "id": "sort_1",
    "instruction": "Susunlah tahapan proses mekanisme ... dari awal hingga akhir dengan benar!",
    "items": [
      "Langkah Pertama: ...",
      "Langkah Kedua: ...",
      "Langkah Ketiga: ...",
      "Langkah Keempat: ..."
    ],
    "correctOrder": [0, 1, 2, 3],
    "hint": "Perhatikan inisiasi reaksi pada tahap awal.",
    "explanation": "Penjelasan mengapa urutan ini yang tepat secara kaidah ilmiah..."
  }}
]"""

    try:
        reply = _call_gemini_text(prompt, temperature=0.4, json_mode=True)
        if reply:
            clean_json = re.sub(r"^```json\s*", "", reply.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            match = re.search(r"\[\s*\{.*\}\s*\]", clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) >= 2:
                valid_sorts = []
                for idx, s in enumerate(parsed):
                    if s.get("instruction") and isinstance(s.get("items"), list) and len(s["items"]) >= 3:
                        valid_sorts.append({
                            "id": s.get("id") or f"sort_{idx + 1}",
                            "instruction": s["instruction"],
                            "items": s["items"],
                            "correctOrder": s.get("correctOrder") or list(range(len(s["items"]))),
                            "hint": s.get("hint") or f"Analisis alur sebab-akibat pada topik {doc_title}.",
                            "explanation": s.get("explanation") or f"Urutan ini mencerminkan tahapan logis konsep {doc_title}."
                        })
                if valid_sorts:
                    return json.dumps(valid_sorts, ensure_ascii=False)
    except Exception as e:
        logger.debug(f"[AdaptiveAssets] Sorting challenges AI error: {e}")

    # Fallback substantif 3 tantangan sorting
    fallback_sorts = [
        {
            "id": "sort_1",
            "instruction": f"Susunlah tahapan inisiasi dan aktivasi konsep '{doc_title}' secara kronologis!",
            "items": [
                "1. Pengenalan rangsangan/substrat pada sistem penerima",
                "2. Pengikatan spesifik dan penurunan energi aktivasi",
                "3. Terjadinya reaksi transformasi perantara",
                "4. Pembentukan produk akhir yang stabil dan pelepasan sistem"
            ],
            "correctOrder": [0, 1, 2, 3],
            "hint": "Mulailah dari interaksi awal antara bahan baku dan reseptor.",
            "explanation": "Proses selalu diawali dengan pengenalan substrat, diikuti pembentukan kompleks transisi, reaksi katalitik, dan diakhiri dengan pelepasan produk."
        },
        {
            "id": "sort_2",
            "instruction": "Urutkan tahapan analisis pemecahan masalah (Problem-Solving) berdasarkan materi ini!",
            "items": [
                "Identifikasi parameter variabel dasar",
                "Perumusan hipotesis sebab-akibat",
                "Pengujian dengan manipulasi variabel terkontrol",
                "Verifikasi hasil dan penarikan kesimpulan ilmiah"
            ],
            "correctOrder": [0, 1, 2, 3],
            "hint": "Gunakan metode ilmiah dari observasi awal hingga simpulan.",
            "explanation": "Metode ilmiah berurutan dari identifikasi masalah, hipotesis, eksperimen, hingga penarikan kesimpulan terverifikasi."
        },
        {
            "id": "sort_3",
            "instruction": "Susunlah tingkatan hierarki konseptual dari level mikroskopis ke aplikasi makro!",
            "items": [
                "Struktur molekuler dan ikatan kimiawi inti",
                "Organisasi jaringan dan kompleksitas seluler",
                "Dinamika sistem fisiologis terpadu",
                "Implementasi teknologi dan ekosistem terapan"
            ],
            "correctOrder": [0, 1, 2, 3],
            "hint": "Urutkan dari unit terkecil mikroskopik menuju skala ekosistem luas.",
            "explanation": "Hierarki sains berjenjang dari skala molekul, sel, sistem organ, hingga aplikasi makro di lingkungan."
        }
    ]
    return json.dumps(fallback_sorts, ensure_ascii=False)

def _generate_fill_in_the_blank(doc_title: str, context: str) -> str:
    """
    Menghasilkan tantangan kinestetik Drag & Drop Fill-in-the-Blank interaktif
    yang 100% universal untuk semua mata pelajaran sekolah K-12.
    Format output: JSON string berisi list FillBlankItem.
    """
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
        reply = _call_gemini_text(prompt, temperature=0.4, json_mode=True)
        if reply:
            clean_json = re.sub(r"^```json\s*", "", reply.strip(), flags=re.IGNORECASE)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            match = re.search(r"\[\s*\{.*\}\s*\]", clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
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
        logger.debug(f"[AdaptiveAssets] Fill-in-the-blank AI generation error: {e}")

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


import textwrap

def _svg_wrap_text(
    text: Any,
    x: int,
    start_y: int,
    line_height: int,
    max_chars: int = 40,
    font_size: float = 11,
    fill: str = "#475569",
    font_weight: str = "400",
    font_family: str = "Inter, sans-serif",
    max_lines: int = 3
) -> str:
    """Helper untuk memformat teks panjang SVG dengan pemotongan per kata yang rapi (tanpa kata terpotong)."""
    clean_str = str(text or "").strip()
    if not clean_str:
        return ""
    lines = textwrap.wrap(clean_str, width=max_chars)
    lines = lines[:max_lines]
    output = []
    for idx, l in enumerate(lines):
        cur_y = start_y + idx * line_height
        escaped = l.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
        output.append(
            f'<text x="{x}" y="{cur_y}" fill="{fill}" font-family="{font_family}" font-size="{font_size}" font-weight="{font_weight}">{escaped}</text>'
        )
    return "\n".join(output)

def _generate_infographic_data(doc_title: str, raw_text: str) -> Dict[str, Any]:
    """
    Menghasilkan metadata terstruktur 4-Tahap infografis berkualitas tinggi yang merangkum seluruh isi modul:
    - Tahap 1: Fondasi & Konsep Inti (Definisi & 3 Pilar Utama)
    - Tahap 2: Alur Mekanisme 4-Tahap Berurutan (Inisiasi -> Interaksi -> Regulasi -> Hasil)
    - Tahap 3: Parameter Kunci & Kaidah Ilmiah Terukur
    - Tahap 4: Analogi Nyata & Studi Kasus Terapan
    """
    context_sample = raw_text[:12000] if len(raw_text) > 12000 else raw_text

    prompt = f"""Kamu adalah Pakar Visualisasi Informasi, Lead Infographic Designer, dan Arsitek Kurikulum K-12.
Rangkum materi berikut menjadi 1 STRUKTUR POSTER INFOGRAFIS 4-TAHAP PEMBELAJARAN yang sangat komprehensif, padat, dan mencakup semua esensi materi modul.

MATERI PEMBELAJARAN:
Judul: {doc_title}
Isi Dokumen:
{context_sample}

SUSUN DATA DALAM FORMAT JSON 4-TAHAP BERIKUT (Gunakan Bahasa Indonesia baku, padat, informatif, dan jelas):
{{
  "doc_title": "{doc_title}",
  "subtitle": "Subjudul Ringkas & Menarik yang Merangkum Esensi Seluruh Materi",
  "category_badge": "INFOGRAFIS 4-TAHAP KURIKULUM ADAPTIF",
  "tahap_1_fondasi": {{
    "title": "Tahap 1: Fondasi & Konsep Inti",
    "definition": "Definisi menyeluruh dan latar belakang mendasar konsep ini secara ilmiah dan gamblang.",
    "big_idea": "Gagasan pokok atau hukum dasar yang menopang seluruh pemahaman topik.",
    "key_pillars": [
      {{"name": "Pilar 1", "desc": "Penjelasan pilar kunci pertama materi."}},
      {{"name": "Pilar 2", "desc": "Penjelasan pilar kunci kedua materi."}},
      {{"name": "Pilar 3", "desc": "Penjelasan pilar kunci ketiga materi."}}
    ]
  }},
  "tahap_2_mekanisme": {{
    "title": "Tahap 2: Alur Mekanisme & Dinamika 4-Langkah",
    "steps": [
      {{"step_num": 1, "title": "Inisiasi & Variabel Awal", "desc": "Langkah pertama dimulainya proses atau interaksi komponen dasar.", "badge": "Tahap 1"}},
      {{"step_num": 2, "title": "Interaksi & Reaksi Sistemik", "desc": "Proses perubahan, dinamika variabel, atau hubungan sebab-akibat.", "badge": "Tahap 2"}},
      {{"step_num": 3, "title": "Regulasi & Kendali Keseimbangan", "desc": "Faktor pengendali, batasan hukum alam, dan stabilisasi.", "badge": "Tahap 3"}},
      {{"step_num": 4, "title": "Luaran Akhir & Kondisi Ideal", "desc": "Hasil akhir yang tercapai dan keseimbangan sistem yang terbentuk.", "badge": "Tahap 4"}}
    ]
  }},
  "tahap_3_parameter": {{
    "title": "Tahap 3: Parameter Kunci & Kaidah Ilmiah",
    "metrics": [
      {{"label": "Tingkat Akurasi & Kaidah Utama", "value_pct": 88, "explanation": "Kesesuaian kaidah dasar dengan prinsip kurikulum."}},
      {{"label": "Efisiensi Siklus & Dinamika", "value_pct": 74, "explanation": "Optimalisasi hubungan fungsi antar komponen materi."}},
      {{"label": "Sensitivitas & Faktor Pembatas", "value_pct": 62, "explanation": "Pengaruh variabel luar terhadap kestabilan sistem."}}
    ]
  }},
  "tahap_4_aplikasi": {{
    "title": "Tahap 4: Analogi Nyata & Studi Kasus Terapan",
    "analogy_title": "Analogi Kehidupan Nyata",
    "analogy_desc": "Analogi konkret dan mudah dibayangkan siswa untuk menjelaskan cara kerja konsep ini.",
    "case_study_title": "Studi Kasus & Penerapan Praktis",
    "case_study_desc": "Contoh implementasi nyata di bidang teknologi, fenomena alam, atau industri modern."
  }},
  "key_takeaway": "Pesan kesimpulan kunci dalam 1-2 kalimat tegas untuk memperkuat retensi belajar siswa."
}}

Output HANYA objek JSON valid murni tanpa format markdown (tanpa ```json ... ```)."""

    try:
        reply = _call_gemini_text(prompt, temperature=0.2, json_mode=True)
        if reply:
            clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", reply.strip(), flags=re.MULTILINE).strip()
            match = re.search(r"\{.*\}", clean_json, re.DOTALL)
            if match:
                clean_json = match.group(0)
            parsed = json.loads(clean_json)
            if isinstance(parsed, dict) and "tahap_1_fondasi" in parsed:
                logger.info(f"[AdaptiveAssets] Sukses mengekstrak Infografis 4-Tahap untuk '{doc_title}'.")
                return parsed
            elif isinstance(parsed, dict) and "roadmap_journey" in parsed:
                return parsed
    except Exception as e:
        logger.warning(f"[AdaptiveAssets] Infographic 4-Tahap JSON extraction error: {e}")

    # Fallback substantif komprehensif 4-Tahap
    paras = [p.strip() for p in raw_text.split("\n\n") if len(p.strip()) > 30]
    p1 = paras[0] if len(paras) > 0 else f"Pemahaman fundamental mengenai konsep dan prinsip {doc_title}."
    p2 = paras[1] if len(paras) > 1 else "Mekanisme interaksi komponen dalam dinamika sistem terpadu."
    p3 = paras[2] if len(paras) > 2 else "Regulasi ilmiah dan kaidah baku yang mengontrol kestabilan proses."
    p4 = paras[3] if len(paras) > 3 else "Penerapan aplikatif nyata untuk memecahkan persoalan dunia nyata."

    return {
        "doc_title": doc_title,
        "subtitle": f"Pemetaan 4-Tahap Alur Konseptual & Analisis Wawasan {doc_title}",
        "category_badge": "INFOGRAFIS 4-TAHAP KURIKULUM ADAPTIF",
        "tahap_1_fondasi": {
            "title": "Tahap 1: Fondasi & Konsep Inti",
            "definition": p1[:180],
            "big_idea": f"Prinsip fundamental {doc_title} yang menopang pemahaman ilmiah terstruktur.",
            "key_pillars": [
                {"name": "Terminologi Ilmiah", "desc": "Karakteristik variabel pokok dan definisi dasar konsep."},
                {"name": "Dinamika Sistemik", "desc": "Hubungan fungsional antara unsur-unsur pembangun materi."},
                {"name": "Hukum Keseimbangan", "desc": "Kaidah baku yang mempertahankan kestabilan proses."}
            ]
        },
        "tahap_2_mekanisme": {
            "title": "Tahap 2: Alur Mekanisme & Dinamika 4-Langkah",
            "steps": [
                {"step_num": 1, "title": "1. Inisiasi & Variabel Awal", "desc": p1[:100], "badge": "Langkah 1"},
                {"step_num": 2, "title": "2. Interaksi Antar-Komponen", "desc": p2[:100], "badge": "Langkah 2"},
                {"step_num": 3, "title": "3. Transformasi & Regulasi", "desc": p3[:100], "badge": "Langkah 3"},
                {"step_num": 4, "title": "4. Luaran & Keseimbangan", "desc": p4[:100], "badge": "Langkah 4"}
            ]
        },
        "tahap_3_parameter": {
            "title": "Tahap 3: Parameter Kunci & Kaidah Ilmiah",
            "metrics": [
                {"label": "Tingkat Akurasi Model Teori", "value_pct": 86.5, "explanation": "Kesesuaian kaidah baku dengan observasi ilmiah."},
                {"label": "Efisiensi Siklus & Reaksi", "value_pct": 74.0, "explanation": "Optimalisasi sumber daya dan dinamika sistem."},
                {"label": "Daya Tahan & Toleransi Variabel", "value_pct": 61.5, "explanation": "Kemampuan sistem mempertahankan kesetimbangan."}
            ]
        },
        "tahap_4_aplikasi": {
            "title": "Tahap 4: Analogi Nyata & Studi Kasus Terapan",
            "analogy_title": "Analogi Cara Kerja",
            "analogy_desc": f"Bagaikan sistem presisi di mana setiap komponen bekerja selaras untuk menghasilkan luaran terencana pada modul {doc_title}.",
            "case_study_title": "Penerapan Sains & Teknologi",
            "case_study_desc": "Implementasi nyata konsep dalam pemecahan masalah teknologi modern dan fenomena alam sehari-hari."
        },
        "key_takeaway": f"Penguasaan materi {doc_title} memberikan landasan berpikir kritis dalam menganalisis fenomena sains dan penerapannya di dunia nyata."
    }


def _render_rich_infographic_svg(doc_title: str, data: Dict[str, Any]) -> str:
    """
    Merender poster infografis vektor SVG 4-Tahap resolusi tinggi (1200 x 1400 px)
    dengan koordinat absolut terhitung presisi tanpa tabrakan teks:
    - Header: Judul & Subjudul Modul
    - Tahap 1: Fondasi & Konsep Inti (Definisi & 3 Pilar Utama)
    - Tahap 2: Alur Mekanisme 4-Langkah (4 Kartu Berurutan dengan Panah Koneksi)
    - Tahap 3: Parameter Kunci & Kaidah Ilmiah (Progress Bar Metrik)
    - Tahap 4: Analogi Nyata & Studi Kasus Terapan
    - Kesimpulan Kunci (Key Takeaway Banner)
    """
    def esc(text: Any) -> str:
        s = str(text or "")
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

    clean_title = esc(data.get("doc_title", doc_title))[:60]
    subtitle = esc(data.get("subtitle", f"Pemetaan 4-Tahap Alur Konseptual & Analisis Wawasan {doc_title}"))[:95]
    badge = esc(data.get("category_badge", "INFOGRAFIS 4-TAHAP KURIKULUM ADAPTIF"))[:50]

    # --- TAHAP 1: FONDASI ---
    t1 = data.get("tahap_1_fondasi", {})
    t1_title = esc(t1.get("title", "Tahap 1: Fondasi & Konsep Inti"))[:50]
    t1_def = t1.get("definition", f"Definisi dan konsep dasar {doc_title}.")
    t1_pillars = t1.get("key_pillars", [
        {"name": "Pilar Teoretis", "desc": "Landasan terminologi dan kaidah baku materi."},
        {"name": "Dinamika Proses", "desc": "Interaksi terstruktur antar variabel pokok."},
        {"name": "Keseimbangan", "desc": "Kaidah ilmiah pengontrol stabilitas sistem."}
    ])[:3]

    # --- TAHAP 2: ALUR MEKANISME ---
    t2 = data.get("tahap_2_mekanisme", {})
    t2_title = esc(t2.get("title", "Tahap 2: Alur Mekanisme & Dinamika 4-Langkah"))[:65]
    t2_steps = t2.get("steps", [])
    if not t2_steps:
        old_steps = data.get("roadmap_journey", [])
        if old_steps:
            t2_steps = [
                {"step_num": s.get("step_num", i+1), "title": s.get("title", f"Tahap {i+1}"), "desc": s.get("desc", ""), "badge": f"Langkah {i+1}"}
                for i, s in enumerate(old_steps[:4])
            ]
        else:
            t2_steps = [
                {"step_num": 1, "title": "Inisiasi & Variabel Awal", "desc": "Interaksi awal bahan baku atau komponen dasar materi.", "badge": "Langkah 1"},
                {"step_num": 2, "title": "Interaksi Dinamis", "desc": "Perubahan reaksi dan keterkaitan sebab-akibat sistemik.", "badge": "Langkah 2"},
                {"step_num": 3, "title": "Regulasi Sistem", "desc": "Pengendalian kaidah ilmiah menjaga kesetimbangan.", "badge": "Langkah 3"},
                {"step_num": 4, "title": "Luaran & Hasil", "desc": "Kondisi stabil akhir yang terukur dan terverifikasi.", "badge": "Langkah 4"}
            ]

    # --- TAHAP 3: PARAMETER KUNCI ---
    t3 = data.get("tahap_3_parameter", {})
    t3_title = esc(t3.get("title", "Tahap 3: Parameter Kunci & Kaidah Ilmiah"))[:55]
    t3_metrics = t3.get("metrics", data.get("metrics_breakdown", [
        {"label": "Tingkat Akurasi Model Teori", "value_pct": 86.5, "explanation": "Kesesuaian kaidah teoretis dengan observasi ilmiah."},
        {"label": "Efisiensi Dinamika", "value_pct": 74.0, "explanation": "Optimalisasi konversi dan keterkaitan fungsi materi."},
        {"label": "Daya Tahan Kesetimbangan", "value_pct": 62.0, "explanation": "Stabilitas variabel terhadap gangguan eksternal."}
    ]))[:3]

    # --- TAHAP 4: ANALOGI & STUDI KASUS ---
    t4 = data.get("tahap_4_aplikasi", {})
    t4_title = esc(t4.get("title", "Tahap 4: Analogi Nyata & Studi Kasus Terapan"))[:55]
    t4_analogy_title = esc(t4.get("analogy_title", "Analogi Kehidupan Nyata"))[:40]
    t4_analogy_desc = t4.get("analogy_desc", f"Bagaikan rangkaian sistem presisi di mana setiap komponen saling melengkapi pada materi {doc_title}.")
    t4_case_title = esc(t4.get("case_study_title", "Penerapan Sains & Teknologi"))[:40]
    t4_case_desc = t4.get("case_study_desc", "Penerapan nyata konsep dalam industri modern, riset teknologi masa depan, dan fenomena alam.")

    # --- KEY TAKEAWAY ---
    takeaway = data.get("key_takeaway", f"Penguasaan materi {doc_title} melatih nalar kritis dan pemahaman holistik terhadap fenomena sains.")

    # -------------------------------------------------------------
    # BUILD TAHAP 1 (Definition + 3 Pillars)
    # -------------------------------------------------------------
    t1_def_wrapped = _svg_wrap_text(t1_def, x=90, start_y=230, line_height=19, max_chars=100, font_size=12, fill="#334155", max_lines=2)

    t1_pillars_svg = ""
    pillar_colors = ["#0284C7", "#10B981", "#8B5CF6"]
    for idx, p in enumerate(t1_pillars[:3]):
        px = 85 + idx * 355
        p_name = esc(p.get("name", f"Pilar 0{idx+1}"))[:24]
        p_desc = p.get("desc", "")
        p_color = pillar_colors[idx % len(pillar_colors)]
        wrapped_p_desc = _svg_wrap_text(p_desc, x=px + 16, start_y=325, line_height=17, max_chars=34, font_size=11, fill="#475569", max_lines=3)
        t1_pillars_svg += f"""
        <!-- Pillar Card {idx+1} -->
        <g>
          <rect x="{px}" y="275" width="340" height="110" rx="14" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2"/>
          <rect x="{px + 16}" y="293" width="8" height="8" rx="4" fill="{p_color}"/>
          <text x="{px + 30}" y="301" fill="#0F172A" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="12.5" font-weight="800">{p_name}</text>
          {wrapped_p_desc}
        </g>
        """

    # -------------------------------------------------------------
    # BUILD TAHAP 2 (4 Sequential Step Cards)
    # -------------------------------------------------------------
    t2_cards_svg = ""
    step_colors = ["#0284C7", "#0D9488", "#F59E0B", "#8B5CF6"]
    step_light_bgs = ["#E0F2FE", "#CCFBF1", "#FEF3C7", "#EDE9FE"]

    for idx, st in enumerate(t2_steps[:4]):
        cx = 60 + idx * 275
        st_num = st.get("step_num", idx + 1)
        st_t = esc(st.get("title", f"Langkah {idx+1}"))[:24]
        st_desc = st.get("desc", "")
        st_badge = esc(st.get("badge", f"Langkah {idx+1}"))[:14]
        col = step_colors[idx % len(step_colors)]
        bg_col = step_light_bgs[idx % len(step_light_bgs)]
        wrapped_st_desc = _svg_wrap_text(st_desc, x=cx + 16, start_y=615, line_height=17, max_chars=25, font_size=11, fill="#475569", max_lines=4)

        arrow_svg = ""
        if idx < 3:
            arrow_svg = f"""
            <!-- Connector Arrow -->
            <g transform="translate({cx + 261}, 595)">
              <circle cx="6" cy="0" r="9" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
              <path d="M 4 -3.5 L 8 0 L 4 3.5" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            """

        t2_cards_svg += f"""
        <g>
          <!-- Step Card -->
          <rect x="{cx}" y="515" width="258" height="205" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#cardShadow)"/>
          <rect x="{cx}" y="515" width="258" height="5" rx="2.5" fill="{col}"/>
          
          <!-- Step Number Badge -->
          <circle cx="{cx + 32}" cy="548" r="14" fill="{bg_col}"/>
          <text x="{cx + 32}" y="553" fill="{col}" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="13" font-weight="900" text-anchor="middle">{st_num}</text>
          
          <rect x="{cx + 56}" y="538" width="186" height="22" rx="11" fill="#F1F5F9"/>
          <text x="{cx + 149}" y="553" fill="#64748B" font-family="Inter, sans-serif" font-size="10" font-weight="800" text-anchor="middle">{st_badge}</text>

          <!-- Step Title -->
          <text x="{cx + 16}" y="590" fill="#0F172A" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="12.5" font-weight="800">{st_t}</text>

          <!-- Wrapped Step Description -->
          {wrapped_st_desc}
          
          {arrow_svg}
        </g>
        """

    # -------------------------------------------------------------
    # BUILD TAHAP 3 (Progress Bar Metrics)
    # -------------------------------------------------------------
    t3_bars_svg = ""
    for idx, mb in enumerate(t3_metrics[:3]):
        by = 855 + idx * 80
        val = float(mb.get("value_pct", 75))
        bar_w = int((val / 100.0) * 440)
        col = "#0284C7" if idx == 0 else ("#10B981" if idx == 1 else "#F59E0B")
        exp_wrapped = _svg_wrap_text(mb.get("explanation", ""), x=90, start_y=by + 48, line_height=16, max_chars=52, font_size=10.5, fill="#64748B", max_lines=1)
        t3_bars_svg += f"""
        <g>
          <text x="90" y="{by}" fill="#1E293B" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="12.5" font-weight="800">{esc(mb.get('label', 'Kaidah'))[:35]}</text>
          <text x="530" y="{by}" fill="{col}" font-family="monospace" font-size="13.5" font-weight="900" text-anchor="end">{val:.1f}%</text>
          
          <!-- Bar Track -->
          <rect x="90" y="{by + 10}" width="440" height="20" rx="10" fill="#E2E8F0"/>
          <!-- Bar Fill -->
          <rect x="90" y="{by + 10}" width="{bar_w}" height="20" rx="10" fill="{col}"/>
          <text x="{max(90 + bar_w - 12, 130)}" y="{by + 24}" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="10.5" font-weight="900" text-anchor="end">{val:.1f}%</text>
          
          {exp_wrapped}
        </g>
        """

    # -------------------------------------------------------------
    # BUILD TAHAP 4 (Analogy & Case Study Sub-Boxes)
    # -------------------------------------------------------------
    analogy_wrapped = _svg_wrap_text(t4_analogy_desc, x=660, start_y=885, line_height=18, max_chars=48, font_size=11, fill="#334155", max_lines=3)
    case_wrapped = _svg_wrap_text(t4_case_desc, x=660, start_y=1015, line_height=18, max_chars=48, font_size=11, fill="#334155", max_lines=3)

    # -------------------------------------------------------------
    # BUILD KEY TAKEAWAY WRAPPED
    # -------------------------------------------------------------
    takeaway_wrapped = _svg_wrap_text(takeaway, x=95, start_y=1240, line_height=20, max_chars=115, font_size=12.5, fill="#F8FAFC", font_weight="500", max_lines=2)

    # -------------------------------------------------------------
    # COMPLETE SVG COMPOSITION (Absolute Coordinates)
    # -------------------------------------------------------------
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1380" width="100%" height="100%">
  <defs>
    <!-- Drop Shadows -->
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0F172A" flood-opacity="0.05"/>
    </filter>
    <filter id="heroShadow" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#0F172A" flood-opacity="0.12"/>
    </filter>
    
    <linearGradient id="takeawayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
  </defs>

  <!-- Clean Editorial Light Background -->
  <rect width="1200" height="1380" fill="#F8FAFC"/>

  <!-- ========================================================= -->
  <!-- 0. HEADER BANNER                                          -->
  <!-- ========================================================= -->
  <rect x="60" y="40" width="310" height="28" rx="6" fill="#E0F2FE"/>
  <text x="215" y="59" fill="#0284C7" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="10.5" font-weight="900" text-anchor="middle" letter-spacing="1.2">✦ {badge}</text>
  
  <text x="60" y="105" fill="#0F172A" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="32" font-weight="900">{clean_title}</text>
  <text x="60" y="132" fill="#475569" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="14.5" font-weight="600">{subtitle}</text>

  <!-- ========================================================= -->
  <!-- 1. TAHAP 1: FONDASI & KONSEP INTI                         -->
  <!-- ========================================================= -->
  <!-- Container Box -->
  <rect x="60" y="160" width="1080" height="245" rx="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#cardShadow)"/>
  
  <!-- Section Badge -->
  <rect x="85" y="180" width="220" height="26" rx="6" fill="#E0F2FE"/>
  <text x="195" y="197" fill="#0284C7" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="900" text-anchor="middle">💡 {t1_title}</text>
  
  <!-- Definition Text -->
  {t1_def_wrapped}
  
  <!-- 3 Pillars Grid -->
  {t1_pillars_svg}

  <!-- ========================================================= -->
  <!-- 2. TAHAP 2: ALUR MEKANISME 4-LANGKAH                      -->
  <!-- ========================================================= -->
  <text x="60" y="450" fill="#0F172A" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="16" font-weight="900">⚡ {t2_title}</text>
  <text x="60" y="470" fill="#64748B" font-family="Inter, sans-serif" font-size="11" font-weight="500">Alur berkesinambungan 4 langkah dari inisiasi awal hingga terbentuknya luaran sistem seimbang.</text>

  <!-- 4 Step Cards -->
  {t2_cards_svg}

  <!-- ========================================================= -->
  <!-- 3. TAHAP 3 & TAHAP 4 (2-COLUMN BENTO GRID)                -->
  <!-- ========================================================= -->
  
  <!-- LEFT COLUMN: TAHAP 3 (PARAMETER & KAIDAH) -->
  <rect x="60" y="760" width="525" height="360" rx="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#cardShadow)"/>
  
  <rect x="85" y="780" width="280" height="26" rx="6" fill="#E0F2FE"/>
  <text x="225" y="797" fill="#0284C7" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="900" text-anchor="middle">📊 {t3_title}</text>
  
  <text x="85" y="828" fill="#64748B" font-family="Inter, sans-serif" font-size="11" font-weight="500">Kaidah baku, ambang batas variabel, dan metrik stabilitas sistem.</text>
  <line x1="85" y1="840" x2="560" y2="840" stroke="#F1F5F9" stroke-width="1.5"/>
  
  {t3_bars_svg}

  <!-- RIGHT COLUMN: TAHAP 4 (ANALOGI & STUDI KASUS) -->
  <rect x="615" y="760" width="525" height="360" rx="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#cardShadow)"/>
  
  <rect x="640" y="780" width="300" height="26" rx="6" fill="#F3E8FF"/>
  <text x="790" y="797" fill="#7C3AED" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="11" font-weight="900" text-anchor="middle">🌐 {t4_title}</text>
  
  <text x="640" y="828" fill="#64748B" font-family="Inter, sans-serif" font-size="11" font-weight="500">Konkretisasi konsep melalui analogi nyata dan aplikasi dunia modern.</text>
  <line x1="640" y1="840" x2="1115" y2="840" stroke="#F1F5F9" stroke-width="1.5"/>
  
  <!-- Sub-box 1: Analogy -->
  <rect x="640" y="855" width="475" height="115" rx="12" fill="#FAF5FF" stroke="#E9D5FF" stroke-width="1"/>
  <text x="660" y="878" fill="#581C87" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="12" font-weight="800">🔍 {t4_analogy_title}</text>
  {analogy_wrapped}

  <!-- Sub-box 2: Case Study -->
  <rect x="640" y="985" width="475" height="115" rx="12" fill="#FFFBEB" stroke="#FDE68A" stroke-width="1"/>
  <text x="660" y="1008" fill="#78350F" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="12" font-weight="800">🚀 {t4_case_title}</text>
  {case_wrapped}

  <!-- ========================================================= -->
  <!-- 4. KEY TAKEAWAY BANNER (HERO SUMMARY)                     -->
  <!-- ========================================================= -->
  <rect x="60" y="1150" width="1080" height="130" rx="18" fill="url(#takeawayGrad)" filter="url(#heroShadow)"/>
  
  <rect x="95" y="1172" width="160" height="24" rx="12" fill="#10B981" fill-opacity="0.25"/>
  <text x="175" y="1188" fill="#34D399" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="10.5" font-weight="900" text-anchor="middle">💡 KESIMPULAN KUNCI</text>
  
  <text x="95" y="1218" fill="#FFFFFF" font-family="Plus Jakarta Sans, Inter, sans-serif" font-size="14" font-weight="800">Prinsip Aplikatif Terintegrasi:</text>
  
  {takeaway_wrapped}

  <!-- ========================================================= -->
  <!-- 5. FOOTER WATERMARK                                       -->
  <!-- ========================================================= -->
  <text x="600" y="1325" fill="#94A3B8" font-family="Inter, sans-serif" font-size="11" font-weight="600" text-anchor="middle">
    EduAdapt Adaptive Intelligence • Infografis 4-Tahap Kurikulum Terpadu • Lossless Vector SVG
  </text>
</svg>"""
    return svg



def generate_document_adaptive_assets(doc_id: str, db: Any) -> Dict[str, Any]:
    """
    Jalur kompatibilitas podcast: mempertahankan playlist, sintesis, dan cache audio.
    Unit visual/praktik dibuat terpisah melalui learning_unit_service setelah validasi sumber.
    """
    import os
    from app.models.document import GroundedDocument
    from app.services.gateway_service import AIGatewayService
    
    doc = db.query(GroundedDocument).filter(GroundedDocument.id == doc_id).first()
    if not doc:
        logger.error(f"[AdaptiveAssets] Document {doc_id} not found.")
        return {}

    podcasts_dir = os.path.join(settings.UPLOADS_DIR, "podcasts")
    images_dir = os.path.join(settings.UPLOADS_DIR, "images")
    os.makedirs(podcasts_dir, exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)

    summary_context = doc.raw_text[:8000] if len(doc.raw_text) > 8000 else doc.raw_text

    # 1. GENERATE PODCAST EPISODES PLAYLIST & AUDIO PER EPISODE
    episodes_data = []
    if doc.podcast_episodes_json:
        try:
            episodes_data = json.loads(doc.podcast_episodes_json)
        except Exception:
            episodes_data = []

    if not episodes_data:
        logger.info(f"[AdaptiveAssets] Menyusun playlist podcast multi-episode untuk '{doc.title}'...")
        episodes_data = _generate_podcast_episodes(doc.title, summary_context)
        doc.podcast_episodes_json = json.dumps(episodes_data, ensure_ascii=False)
        db.commit()

    # Synthesize audio file for each episode
    combined_scripts = []
    for ep in episodes_data:
        ep_order = ep.get("order", 1)
        ep_script = ep.get("script", "")
        combined_scripts.append(f"[{ep.get('title', f'Episode {ep_order}')}]\n{ep_script}")
        
        wav_filepath = os.path.join(podcasts_dir, f"{doc.id}_ep{ep_order}.wav")
        mp3_filepath = os.path.join(podcasts_dir, f"{doc.id}_ep{ep_order}.mp3")
        
        needs_synth = (
            not os.path.exists(wav_filepath) or os.path.getsize(wav_filepath) < 200
        ) and (
            not os.path.exists(mp3_filepath) or os.path.getsize(mp3_filepath) < 200
        )
        
        if needs_synth:
            try:
                logger.info(f"[AdaptiveAssets] Mensintesis audio Gemini Orus Episode {ep_order} ({len(ep_script)} karakter)...")
                audio_bytes = AIGatewayService.generate_speech(text=ep_script, voice="Orus", model="gemini-3.1-flash-tts-preview")
                if audio_bytes and len(audio_bytes) > 200:
                    ext = ".wav" if audio_bytes.startswith(b"RIFF") else ".mp3"
                    target_fp = os.path.join(podcasts_dir, f"{doc.id}_ep{ep_order}{ext}")
                    with open(target_fp, "wb") as f:
                        f.write(audio_bytes)
                    if ext == ".wav":
                        with open(mp3_filepath, "wb") as f:
                            f.write(audio_bytes)
                    logger.info(f"[AdaptiveAssets] Audio Episode {ep_order} disimpan ({len(audio_bytes)} bytes)")
            except Exception as e:
                logger.warning(f"[AdaptiveAssets] Episode {ep_order} TTS error: {e}")

        ep["audioUrl"] = f"/api/v1/documents/{doc.id}/podcast-audio?episode={ep_order}"

    doc.podcast_episodes_json = json.dumps(episodes_data, ensure_ascii=False)
    doc.podcast_script = "\n\n".join(combined_scripts)
    doc.podcast_audio_url = f"/api/v1/documents/{doc.id}/podcast-audio?episode=1"
    db.commit()

    # Also keep legacy main audio fallback if needed
    main_audio_path = os.path.join(podcasts_dir, f"{doc.id}_podcast.mp3")
    first_ep_path = os.path.join(podcasts_dir, f"{doc.id}_ep1.mp3")
    if os.path.exists(first_ep_path) and not os.path.exists(main_audio_path):
        try:
            with open(first_ep_path, "rb") as rf, open(main_audio_path, "wb") as wf:
                wf.write(rf.read())
        except Exception:
            pass

    # Kinesthetic practice is now built from teacher-approved learning units (practice missions), so the old
    # reactor/sorting/fill-in game data is no longer generated here.
    return {
        "podcast_audio_url": doc.podcast_audio_url,
        "podcast_episodes_json": doc.podcast_episodes_json,
        "podcast_script": doc.podcast_script,
    }

