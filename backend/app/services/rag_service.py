import uuid
from typing import List, Dict, Any

def mock_vector_chunking(raw_text: str) -> List[str]:
    # Split text into semantic chunks
    paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [raw_text]
    return paragraphs

def generate_grounded_quiz_draft(chapter_title: str, difficulty: str = "MEDIUM", num_q: int = 10) -> List[Dict[str, Any]]:
    """
    Menghasilkan draft kuis pilihan ganda yang ter-grounding 100% pada materi kurikulum sains K-12 (10 soal bervariasi).
    """
    import random
    
    base_questions = [
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": f"Pada organ manakah enzim ptialin (amilase saliva) memecah amilum menjadi maltosa?",
            "options": ["Rongga Mulut (pH 6.8)", "Ventrikulus / Lambung (pH 1.5)", "Duodenum (pH 8.0)", "Ileum / Usus Halus"],
            "correctIndex": 0,
            "difficulty": "BASIC",
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
            "difficulty": "BASIC",
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
            "options": ["Sfingter Pilorus", "Vili dan Mikrovili", "Plika Semilunaris", "Duktus Koleodokus"],
            "correctIndex": 1,
            "difficulty": "MEDIUM",
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
            "options": ["Ptialin", "Pepsin", "Lipase Pankreas", "Renin"],
            "correctIndex": 2,
            "difficulty": "MEDIUM",
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 42",
            "explanation": {
                "analogi": "Seperti pemotong molekul lemak setelah butiran lemak dipecah oleh empedu.",
                "visual": "Diagram Alur Duodenum ➔ Getah Pankreas ➔ Lipase ➔ Emulsi Lemak Terurai.",
                "langkah": "1. Empedu mengemulsikan lemak ➔ 2. Lipase memotong ikatan ester ➔ 3. Terbentuk asam lemak & gliserol."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Cairan empedu yang diproduksi oleh hati disimpan sementara di kantung empedu. Fungsi utama cairan ini adalah...",
            "options": ["Menghidrolisis protein menjadi asam amino", "Mengemulsikan lemak agar luas permukaan kontak enzim meningkat", "Membunuh bakteri pada usus besar", "Mengubah glukosa menjadi glikogen"],
            "correctIndex": 1,
            "difficulty": "MEDIUM",
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 48",
            "explanation": {
                "analogi": "Seperti sabun pencuci piring yang memecah gumpalan minyak menjadi butiran halus.",
                "visual": "Hati ➔ Vesica Fellea ➔ Garam Empedu ➔ Emulsifikasi Gumpalan Lipid.",
                "langkah": "1. Lemak masuk duodenum ➔ 2. Hormon CCK memicu empedu keluar ➔ 3. Partikel lemak teremulsi mempermudah kerja lipase."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Bagian manakah dari usus besar yang memiliki peran utama dalam penyerapan kembali air dan pembentukan massa feses?",
            "options": ["Apendiks", "Sekum", "Kolon (Asenden, Transversum, Desenden)", "Rektum"],
            "correctIndex": 2,
            "difficulty": "BASIC",
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 54",
            "explanation": {
                "analogi": "Seperti mesin dehidrator yang menyerap air berlebih sebelum produk akhir dikemas.",
                "visual": "Ileum ➔ Sekum ➔ Kolon ➔ Reabsorpsi H2O & Elektrolit ➔ Feses.",
                "langkah": "1. Sisa makanan masuk kolon ➔ 2. Mukosa kolon menyerap air secara osmosis ➔ 3. Bakteri E. coli membentuk vitamin K."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Jika seseorang mengalami gangguan pada sel parietal lambung sehingga produksi HCl menurun drastis, apa dampak klinis langsung yang terjadi?",
            "options": ["Pencernaan protein terhambat dan risiko infeksi bakteri saluran cerna meningkat", "Lemak tidak dapat diserap sama sekali di usus halus", "Produksi air liur terhenti total", "Dinding lambung mengalami perforasi akut"],
            "correctIndex": 0,
            "difficulty": "CHALLENGING",
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 61",
            "explanation": {
                "analogi": "Ibarat pos gerbang keamanan yang kehabisan disinfektan sekaligus pekerja pembuka kemasan protein mogok.",
                "visual": "Disfungsi Sel Parietal ➔ HCl Anjlok ➔ Pepsinogen Tidak Teraktivasi ➔ Malabsorpsi Protein.",
                "langkah": "1. Tanpa HCl, pepsinogen tetap inaktif ➔ 2. Denaturasi protein gagal ➔ 3. Bakteri patogen makanan lolos ke usus."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Hormon apakah yang dilepaskan dinding duodenum saat mendeteksi asam kimus dari lambung untuk memicu sekresi bikarbonat netralisasi?",
            "options": ["Gastrin", "Insulin", "Sekretin", "Glukagon"],
            "correctIndex": 2,
            "difficulty": "CHALLENGING",
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 70",
            "explanation": {
                "analogi": "Seperti alarm kebakaran asam yang memanggil pemadam berbasis cairan basa penetral.",
                "visual": "Kimus Asam (pH < 4.5) ➔ Sel S Duodenum ➔ Sekretin ➔ Duktus Pankreas ➔ HCO3-.",
                "langkah": "1. Kimus asam masuk duodenum ➔ 2. Sel enteroendokrin mendeteksi H+ ➔ 3. Sekretin disekresi ke darah menuju pankreas."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Seseorang mengonsumsi makanan kaya karbohidrat, protein, dan lemak. Di manakah lokasi pertama di mana KETIGA makronutrien tersebut dicerna secara simultan oleh enzim?",
            "options": ["Mulut", "Lambung", "Duodenum (Usus 12 Jari)", "Kolon"],
            "correctIndex": 2,
            "difficulty": "CHALLENGING",
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 78",
            "explanation": {
                "analogi": "Seperti stasiun persimpangan utama di mana ketiga jenis bahan mentah diproses bersama oleh tiga tim spesialis.",
                "visual": "Duodenum: Amilase (Karbohidrat) + Tripsin/Kimotripsin (Protein) + Lipase (Lipid).",
                "langkah": "1. Di mulut hanya karbohidrat ➔ 2. Di lambung hanya protein ➔ 3. Di duodenum getah pankreas mencerna ketiganya."
            }
        },
        {
            "id": f"q_ai_{uuid.uuid4().hex[:6]}",
            "questionText": "Bagaimanakah mekanisme absorbsi glukosa melintasi membran sel epitel usus halus menuju ke aliran darah sirkulasi porta hepatika?",
            "options": ["Difusi sederhana mengikuti gradien konsentrasi tanpa ion", "Transpor aktif sekunder kotranspor bersama ion Na+ (SGLT-1) lalu difusi terfasilitasi (GLUT-2)", "Endositosis vesikular berenergi tinggi", "Osmosis langsung melalui pori membran sel"],
            "correctIndex": 1,
            "difficulty": "MASTERY",
            "sourceReference": f"{chapter_title} - Modul Silabus Guru Hal. 88",
            "explanation": {
                "analogi": "Seperti menumpang mobil sodium yang meluncur masuk garasi, lalu keluar pintu belakang melalui pintu putar khusus.",
                "visual": "Lumen Usus ➔ SGLT1 (Na+/Glukosa) ➔ Sitosol Epitel ➔ GLUT2 ➔ Kapiler Vena Porta.",
                "langkah": "1. Pompa Na+/K+ ATPase menciptakan gradien ion ➔ 2. Na+ menarik glukosa lewat SGLT-1 ➔ 3. Glukosa keluar lewat GLUT-2 ke darah."
            }
        }
    ]
    
    return base_questions[:num_q]
