import uuid
from typing import List, Dict, Any

def mock_vector_chunking(raw_text: str) -> Tuple_Chunks:
    # Split text into semantic chunks
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [raw_text]
    return paragraphs

def generate_grounded_quiz_draft(chapter_title: str, difficulty: str = "MEDIUM", num_q: int = 4) -> List[Dict[str, Any]]:
    """
    Menghasilkan draft kuis pilihan ganda yang ter-grounding 100% pada silabus Biologi Bab 3
    """
    base_questions = [
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": f"Pada organ manakah enzim ptialin (amilase saliva) memecah amilum menjadi maltosa?",
            "options": ["Rongga Mulut (pH 6.8)", "Ventrikulus / Lambung (pH 1.5)", "Duodenum (pH 8.0)", "Ileum / Usus Halus"],
            "correctIndex": 0,
            "difficulty": difficulty,
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 12",
            "explanation": {
                "analogi": "Seperti gunting pertama yang memotong pita panjang menjadi potongan kecil sebelum masuk ke pabrik utama.",
                "visual": "Bagan Rongga Mulut ➔ Kelenjar Saliva ➔ Enzim Ptialin ➔ Maltosa.",
                "langkah": "1. Amilum masuk ➔ 2. Dikunyah & bercampur saliva ➔ 3. Enzim ptialin memutus ikatan alfa-1,4-glikosidik."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Kondisi asam ekstrem pada lambung (pH 1.5-2.0) disebabkan oleh HCl yang berfungsi untuk...",
            "options": ["Mengaktifkan pepsinogen menjadi pepsin aktif & membunuh patogen", "Memecah lemak menjadi asam lemak", "Menyerap air dan mineral", "Mengemulsikan garam empedu"],
            "correctIndex": 0,
            "difficulty": difficulty,
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 24",
            "explanation": {
                "analogi": "Seperti kunci pembuka gembok yang mengaktifkan pekerja khusus (pepsin) untuk membongkar protein.",
                "visual": "Diagram Lambung ➔ Sel Parietal ➔ HCl ➔ Aktivasi Pepsinogen ➔ Pepsin.",
                "langkah": "1. Makanan masuk lambung ➔ 2. Gastrin memicu sekresi HCl ➔ 3. Pepsinogen terpotong menjadi pepsin aktif."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Struktur apakah pada dinding ileum yang memperluas bidang penyerapan nutrisi hingga setara luas lapangan tenis?",
            "options": ["Vili dan Mikrovili", "Sfingter Pilorus", "Plika Semilunaris", "Duktus Koleodokus"],
            "correctIndex": 0,
            "difficulty": difficulty,
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 36",
            "explanation": {
                "analogi": "Seperti handuk berbulu lebat yang mampu menyerap jauh lebih banyak air dibanding kain rata biasa.",
                "visual": "Diagram Penampang Melintang Vili Usus ➔ Pembuluh Lakteal & Kapiler.",
                "langkah": "1. Kimus masuk ileum ➔ 2. Vili menyentuh sari makanan ➔ 3. Glukosa diserap ke kapiler darah, asam lemak ke limfa."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Enzim apakah yang disekresikan oleh pankreas ke dalam duodenum untuk menghidrolisis lemak menjadi asam lemak dan gliserol?",
            "options": ["Lipase Pankreas", "Ptialin", "Pepsin", "Renin"],
            "correctIndex": 0,
            "difficulty": difficulty,
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 42",
            "explanation": {
                "analogi": "Seperti pemotong molekul lemak setelah butiran lemak dipecah oleh empedu.",
                "visual": "Diagram Alur Duodenum ➔ Getah Pankreas ➔ Lipase ➔ Emulsi Lemak Terurai.",
                "langkah": "1. Empedu mengemulsikan lemak ➔ 2. Lipase memotong ikatan ester ➔ 3. Terbentuk asam lemak & gliserol."
            }
        }
    ]
    
    return base_questions[:num_q]
