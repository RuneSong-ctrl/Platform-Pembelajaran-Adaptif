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

def _call_gemini_text(
    prompt: str,
    system_instruction: Optional[str] = None,
    temperature: float = 0.5,
    json_mode: bool = False
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
                "max_output_tokens": 4000
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
            logger.debug(f"[GeminiService] 9router chat generation failed: {e}")

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

def generate_document_adaptive_assets(doc_id: str, db: Any) -> Dict[str, Any]:
    """
    Menghasilkan seluruh aset adaptif pembelajaran terpadu untuk satu dokumen (Kelas) sekali saja:
    1. Playlist 3-5 Episode Podcast Narasi Tunggal (30-60 detik per episode)
    2. File Audio MP3 per Episode di disk uploads/podcasts/{doc_id}_ep{N}.mp3
    3. Metadata Simpul Interaktif Visual (React Flow: posisi, relasi, side-panel kaya)
    4. Diagram Peta Konsep Mermaid Visual (Fallback)
    5. Reaktor Drag-and-Drop Diperluas (5-8 Slot dan Komponen)
    6. Tantangan Kinestetik Sorting / Ordering Kronologis
    7. Tantangan Drag & Drop Fill-in-the-Blank
    8. Smart Flashcards JSON
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

    # 2. GENERATE INTERACTIVE VISUAL NODES (React Flow)
    if not doc.visual_nodes_json:
        logger.info(f"[AdaptiveAssets] Menyusun metadata simpul visual interaktif React Flow untuk '{doc.title}'...")
        doc.visual_nodes_json = _generate_visual_nodes_metadata(doc.title, summary_context, doc.mindmap_code or "")

    # 3. GENERATE VISUAL MINDMAP (Mermaid SVG Code)
    if not doc.mindmap_code:
        try:
            logger.info(f"[AdaptiveAssets] Menyusun peta konsep diagram Mermaid untuk '{doc.title}'...")
            mindmap_res = generate_visual_mindmap(doc.title, summary_context[:2000])
            if mindmap_res and "code" in mindmap_res:
                doc.mindmap_code = mindmap_res["code"]
        except Exception as e:
            logger.warning(f"[AdaptiveAssets] Mindmap generation error: {e}")

    # 4. GENERATE EXPANDED 5-8 SLOT REACTOR DRAG-AND-DROP
    if not doc.game_config_json:
        logger.info(f"[AdaptiveAssets] Merancang Reaktor Perakitan Kinestetik (5-8 slot) untuk '{doc.title}'...")
        doc.game_config_json = _generate_universal_game_config(doc.title, summary_context)

    # 5. GENERATE PROCESS SORTING / ORDERING CHALLENGES
    if not doc.sorting_challenges_json:
        logger.info(f"[AdaptiveAssets] Merancang tantangan kinestetik Process Sorting untuk '{doc.title}'...")
        doc.sorting_challenges_json = _generate_sorting_challenges(doc.title, summary_context)

    # 6. GENERATE UNIVERSAL FILL-IN-THE-BLANK
    if not doc.fill_blank_json:
        logger.info(f"[AdaptiveAssets] Merancang tantangan Fill-in-the-Blank untuk '{doc.title}'...")
        doc.fill_blank_json = _generate_fill_in_the_blank(doc.title, summary_context)

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

    # 8. SET VISUAL INFOGRAPHIC IMAGE URL & GENERATE IF POSSIBLE
    if not doc.visual_image_url:
        doc.visual_image_url = f"/api/v1/documents/{doc.id}/visual-image"
    
    image_filepath = os.path.join("uploads", "images", f"{doc.id}_visual.png")
    if not os.path.exists(image_filepath):
        try:
            import base64
            img_prompt = f"Professional clean educational scientific infographic poster diagram of {doc.title}, high definition visual learning charts, medical and science textbook style, sharp labels"
            img_res = AIGatewayService.generate_image(prompt=img_prompt, size="1024x1024", model=settings.IMAGE_GEN_MODEL)
            if img_res and "b64_json" in img_res and img_res["b64_json"]:
                img_data = base64.b64decode(img_res["b64_json"])
                with open(image_filepath, "wb") as f:
                    f.write(img_data)
                logger.info(f"[AdaptiveAssets] Visual image saved to {image_filepath}")
        except Exception as e:
            logger.debug(f"[AdaptiveAssets] Image generation notice: {e}")

    db.commit()
    db.refresh(doc)
    logger.info(f"[AdaptiveAssets] Selesai memproduksi seluruh aset adaptif untuk '{doc.title}' ({doc.id})")
    return {
        "podcast_audio_url": doc.podcast_audio_url,
        "podcast_episodes_json": doc.podcast_episodes_json,
        "podcast_script": doc.podcast_script,
        "mindmap_code": doc.mindmap_code,
        "visual_nodes_json": doc.visual_nodes_json,
        "visual_image_url": doc.visual_image_url,
        "game_config_json": doc.game_config_json,
        "sorting_challenges_json": doc.sorting_challenges_json,
        "fill_blank_json": doc.fill_blank_json,
        "flashcards_json": doc.flashcards_json,
    }

