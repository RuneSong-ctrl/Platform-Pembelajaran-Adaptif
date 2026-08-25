# Rencana Implementasi: Dedicated Profiling Adaptive Learning & Custom AI Gateway (EduAdapt K-12)

Dokumen ini adalah rencana implementasi final yang telah disetujui untuk perombakan masif sistem pembelajaran adaptif K-12.

---

## 🎯 Pilar & Arsitektur Utama

1. **Profiling Eksklusif Tanpa Switcher di Halaman Materi (`AdaptiveLearnPage.tsx`)**:
   - Setiap siswa disajikan **100% format pembelajaran eksklusif** sesuai hasil asesmen diagnostiknya.
   - **Siswa Kinestetik** ➔ Langsung masuk ke **Real 2D Canvas Mini-Game ("Bio-Organ Quest")**, Drag & Drop Reaction Reactor, dan Variable Experiment Simulator (Slider pH & Suhu).
   - **Siswa Auditori** ➔ Langsung masuk ke **Spotify-like Podcast Station** dengan **Karaoke Transcript Syncing** (*Dual-Coding Theory*).
   - **Siswa Visual** ➔ Langsung masuk ke **Interactive Node-Graph Flowchart**, Visual Concept Comparison Cards, dan Visual Storyboard Player.

2. **Pergantian Modalitas Terkunci di Asesmen Diagnostik (`/assessment`)**:
   - Siswa tidak dapat berpindah gaya belajar secara sembarangan di halaman materi.
   - Perubahan gaya belajar hanya dapat dilakukan melalui tombol **"Asesmen Ulang Gaya Belajar"** di Halaman Profil (`StudentProfilePage.tsx`), yang memvalidasi ulang preferensi kognitif melalui serangkaian pertanyaan diagnostik ilmiah.

3. **Integrasi Modul di Ruang Kelas Siswa (`StudentClassPage.tsx`)**:
   - Katalog modul silabus resmi guru per bab dengan indikator status kesiapan materi per profil ("🎮 Mode Game Siap", "🎧 Mode Podcast Siap", "👁️ Mode Diagram Siap").
   - Tombol *"Mulai Belajar"* yang langsung membawa siswa ke materi dalam format profilnya.

4. **Dukungan Custom AI Provider di Backend**:
   - Menambahkan konfigurasi di `.env` dan `config.py`:
     ```env
     AI_PROVIDER="custom"                # "custom" | "gemini" | "openai"
     AI_BASE_URL="https://api.your-provider.com/v1"
     AI_API_KEY="your-custom-api-key"
     AI_MODEL="your-model-name"
     ```
   - Adapter HTTP universal di `gemini_service.py` menggunakan `httpx` yang kompatibel dengan OpenAI API format, Gemini API, OpenRouter, atau server LLM lokal.

---

## 📁 Rincian File yang Dimodifikasi

### 1. Backend
- [MODIFY] [`backend/app/core/config.py`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/app/core/config.py): Tambah konfigurasi Custom AI Provider (`AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`).
- [MODIFY] [`backend/app/services/gemini_service.py`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/app/services/gemini_service.py): Adapter HTTP universal (OpenAI/Gemini/Custom) & generator representasi multimodal (Visual, Audio Script, Kinesthetic Mini-game config).
- [MODIFY] [`backend/app/api/v1/endpoints/ai.py`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/app/api/v1/endpoints/ai.py): Endpoint `POST /api/v1/ai/multimodal-content`.
- [MODIFY] [`backend/.env.example`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/.env.example): Update contoh variabel lingkungan untuk custom AI provider.

### 2. Frontend
- [MODIFY] [`frontend/src/types/index.ts`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/types/index.ts): Definisi data untuk 2D Game items, Podcast Chapters, dan Node-Graph.
- [MODIFY] [`frontend/src/services/apiClient.ts`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/services/apiClient.ts): Handler `getMultimodalMaterial`.
- [MODIFY] [`frontend/src/pages/student/StudentClassPage.tsx`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/pages/student/StudentClassPage.tsx): Tampilan modul guru & direct launch per profil.
- [MODIFY] [`frontend/src/pages/student/AdaptiveLearnPage.tsx`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/pages/student/AdaptiveLearnPage.tsx): Pembelajaran eksklusif per profil (2D Game untuk Kinestetik, Spotify Podcast + Karaoke Sync untuk Auditori, Node Graph untuk Visual — tanpa switcher bebas).

---

## 🧪 Rencana Verifikasi
- Pengujian endpoint backend dan fallback offline.
- Pengujian game 2D Canvas kinestetik (gerakan karakter, penyerapan nutrisi, reaksi enzim, efek audio).
- Pengujian audio player Spotify-like (pemutaran suara TTS, penyorotan teks karaoke real-time).
- Pengujian diagram interaktif visual (interaksi klik node dan storyboard).
- Pengujian build frontend TypeScript (`npm run build`).
