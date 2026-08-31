# 📘 Walkthrough: Rekapitulasi & Panduan Pembaruan Sistem

Dokumen ini mendokumentasikan seluruh pembaruan arsitektur, integrasi kecerdasan buatan (AI), penataan antarmuka pengguna (UI/UX), serta hasil pengujian sistem yang dilakukan pada platform **EduAdapt (Platform Pembelajaran Adaptif)**.

---

## 📑 Daftar Isi
1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Integrasi AI Voice Engine: Google Gemini ORUS TTS](#2-integrasi-ai-voice-engine-google-gemini-orus-tts)
3. [Standar Podcast Pedagogis (1.5+ Menit per Episode)](#3-standar-podcast-pedagogis-15-menit-per-episode)
4. [Pemisahan & Penataan Arsitektur Antarmuka Siswa (UI/UX)](#4-pemisahan--penataan-arsitektur-antarmuka-siswa-uiux)
5. [Tabel Status Modul & Audio di Database](#5-tabel-status-modul--audio-di-database)
6. [Daftar Berkas & Komponen yang Dimodifikasi](#6-daftar-berkas--komponen-yang-dimodifikasi)
7. [Hasil Verifikasi & Uji Kualitas (QA)](#7-hasil-verifikasi--uji-kualitas-qa)
8. [Panduan Pemeliharaan & Roadmap Fitur Berikutnya](#8-panduan-pemeliharaan--roadmap-fitur-berikutnya)

---

## 1. Ringkasan Eksekutif

Pada sesi hari ini, sistem berhasil ditingkatkan secara menyeluruh pada aspek:
- **Audio Sintesis AI**: Mengganti suara browser default dengan model suara studio resmi **Google Gemini (`Orus`)** via Google GenAI SDK.
- **Kedalaman Konten Auditori**: Mengubah naskah singkat menjadi narasi mendalam terstruktur berdurasi minimal **1.5 hingga 2.7 menit per episode**.
- **Arsitektur Halaman Siswa**: Memisahkan secara tegas antara dokumen materi murni dari guru dengan ruang eksplorasi materi adaptif agar antarmuka tidak tumpang-tindih.

---

## 2. Integrasi AI Voice Engine: Google Gemini ORUS TTS

### ⚙️ Arsitektur Sintesis Suara
Engine suara diimplementasikan pada [`backend/app/services/gateway_service.py`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/app/services/gateway_service.py) dengan spesifikasi:

* **Model AI**: `gemini-3.1-flash-tts-preview`
* **Konfigurasi Persona Suara**:
  ```python
  types.GenerateContentConfig(
      response_modalities=["AUDIO"],
      speech_config=types.SpeechConfig(
          voice_config=types.VoiceConfig(
              prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Orus")
          )
      ),
  )
  ```
* **Format Audio Output**: Lossless Linear PCM 24.000 Hz 16-bit Mono yang dikonversi menjadi berkas `.wav` dan `.mp3` standar via pustaka `wave` Python.
* **Failover Otomatis**: Jika kuota API Gemini TTS mencapai batas, sistem otomatis beralih ke engine EdgeTTS (`id-ID-ArdiNeural` / `id-ID-GadisNeural`) tanpa mengganggu pengalaman pengguna.

---

## 3. Standar Podcast Pedagogis (1.5+ Menit per Episode)

Prompt generator podcast pada [`backend/app/services/gemini_service.py`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/app/services/gemini_service.py) distandarkan dengan aturan:
1. **Panjang Naskah**: Wajib 250–360 kata (1.500–2.500 karakter) per episode.
2. **Struktur Narasi**:
   - Pembuka kontekstual yang memantik rasa ingin tahu.
   - Penjelasan mekanisme sebab-akibat yang bertahap.
   - Analogi nyata dalam kehidupan sehari-hari.
   - Studi kasus faktual (contoh: Deepfake Hong Kong, Ransomware PDN, Fenomena Fisika Kuantum).
3. **Simultan Auto-Commit**: Begitu dokumen materi diunggah guru, backend langsung mengompilasi JSON episode dan menyintesis audio Gemini Orus ke folder `uploads/podcasts/`.

---

## 4. Pemisahan & Penataan Arsitektur Antarmuka Siswa (UI/UX)

Untuk mencegah kekacauan tampilan (*cognitive overload*), alur antarmuka dibagi menjadi 3 zona spesifik:

```mermaid
graph TD
    A["Ruang Kelas: ClassDetailPage"] -->|Klik Buka Modul| B["Pembaca Materi: ClassMaterialReaderPage"]
    A -->|Tab Tugas| C["Penugasan & Kuis"]
    A -->|Tab Anggota| D["Daftar Guru & Siswa"]
    B -->|Tab 1: PDF Viewer| E["Dokumen Asli PDF Guru"]
    B -->|Tab 2: Naskah Teks| F["Teks Digital Terformat"]
    B -->|CTA Non-Sticky di Bawah| G["Halaman Materi Adaptif: AdaptiveLearnPage"]
    G -->|Gaya Belajar Auditori| H["Studio Podcast Gemini Orus"]
    G -->|Gaya Belajar Visual| I["Peta Konsep Mindmap & Infografis"]
    G -->|Gaya Belajar Kinestetik| J["Lab Interaktif Drag-and-Drop"]
```

### Detail Perubahan Halaman:
1. **Halaman Ruang Kelas ([`ClassDetailPage.tsx`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/pages/student/ClassDetailPage.tsx))**:
   - Menampilkan daftar materi murni kurikulum (tanpa badge teknis RAG/adaptif).
   - Menyediakan feed pengumuman kelas, tugas, kuis, dan data pengajar.
2. **Halaman Pembaca Materi ([`ClassMaterialReaderPage.tsx`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/pages/student/ClassMaterialReaderPage.tsx))**:
   - Khusus membaca materi asli: Tab **Dokumen PDF Guru** dan Tab **Teks Digital Terformat**.
   - Dilengkapi tombol buka di tab baru dan tombol CTA statis di bagian bawah menuju Materi Adaptif.
3. **Halaman Materi Adaptif ([`AdaptiveLearnPage.tsx`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/pages/student/AdaptiveLearnPage.tsx))**:
   - Menjadi sentral pengalaman adaptif mandiri sesuai profil siswa (Studio Podcast Orus, Mindmap, dan Simulasi Taktil).

---

## 5. Tabel Status Modul & Audio di Database

Seluruh materi aktif di database telah 100% diregenerasi dengan suara **Google Gemini ORUS**:

| Kelas | ID Dokumen | Judul Materi | Episode | Rata-rata Durasi | Ukuran File Rata-rata | Status Suara |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Fisika Kuantum A** | `doc_e93ebb56` | *E Book Fisika Kuantum* | 3 Ep | **1.6 – 1.8 Menit** | 4.8 – 5.2 MB | **Gemini Orus** |
| **Fisika Kuantum A** | `doc_d4f9ea7f` | *Tamnet Ti 24 Vibecoding* | 3 Ep | **2.5 – 2.7 Menit** | 7.1 – 7.8 MB | **Gemini Orus** |
| **Biologi** | `doc_8895e763` | *Cyber Ethic & Cyber Crime* | 4 Ep | **1.7 – 2.0 Menit** | 4.8 – 5.6 MB | **Gemini Orus** |
| **Biologi** | `doc_ae8ab92f` | *UntungGak Proposal* | 3 Ep | **2.1 – 2.3 Menit** | 6.2 – 6.6 MB | **Gemini Orus** |
| **Sains & Alam** | `doc_test_phase1_demo` | *Fotosintesis & Reaksi Terang* | 4 Ep | **1.7 – 1.8 Menit** | 4.8 – 5.2 MB | **Gemini Orus** |
| **Biologi Sel** | `doc_03de0721` | *Struktur Membran Sel* | 3 Ep | **2.3 – 2.4 Menit** | 6.5 – 6.9 MB | **Gemini Orus** |

---

## 6. Daftar Berkas & Komponen yang Dimodifikasi

### Backend:
- [`backend/app/services/gateway_service.py`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/app/services/gateway_service.py):
  - Penambahan fungsi `_synthesize_gemini_tts()` berbasis `gemini-3.1-flash-tts-preview` suara `Orus`.
  - Integrasi fallback ke EdgeTTS.
- [`backend/app/services/gemini_service.py`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/app/services/gemini_service.py):
  - Penyesuaian prompt naskah 1.5+ menit (250–360 kata per episode).
  - Otomatisasi sintesis audio batch saat upload materi baru.
- [`backend/app/api/v1/endpoints/documents.py`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/backend/app/api/v1/endpoints/documents.py):
  - Prioritas penyajian file Lossless `.wav` di endpoint `GET /api/v1/documents/{document_id}/podcast-audio`.

### Frontend:
- [`frontend/src/pages/student/ClassDetailPage.tsx`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/pages/student/ClassDetailPage.tsx):
  - Pembersihan list materi dari badge teknis adaptif.
- [`frontend/src/pages/student/ClassMaterialReaderPage.tsx`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/pages/student/ClassMaterialReaderPage.tsx):
  - Menjadikan halaman fokus membaca (PDF Viewer + Naskah Teks) dengan CTA terpisah.
- [`frontend/src/pages/student/AdaptiveLearnPage.tsx`](file:///c:/Users/ramad/Documents/PROJECT/Platform-Pembelajaran-Adaptif/frontend/src/pages/student/AdaptiveLearnPage.tsx):
  - Sentralisasi pengalaman adaptif Auditori, Visual, dan Kinestetik.

---

## 7. Hasil Verifikasi & Uji Kualitas (QA)

### 1. Uji Streaming HTTP Audio Endpoint
```
[200 OK] doc_e93ebb56 (Fisika Kuantum) Ep 1: audio/wav 5,184,044 bytes (1.80 mins)
[200 OK] doc_e93ebb56 (Fisika Kuantum) Ep 2: audio/wav 4,896,044 bytes (1.70 mins)
[200 OK] doc_e93ebb56 (Fisika Kuantum) Ep 3: audio/wav 4,782,764 bytes (1.66 mins)
[200 OK] doc_d4f9ea7f (Tamnet Vibecode) Ep 1: audio/wav 7,768,364 bytes (2.70 mins)
[200 OK] doc_d4f9ea7f (Tamnet Vibecode) Ep 2: audio/wav 7,155,884 bytes (2.48 mins)
[200 OK] doc_d4f9ea7f (Tamnet Vibecode) Ep 3: audio/wav 7,088,684 bytes (2.46 mins)
```

### 2. Frontend Unit Test (`vitest`)
```
 ✓ src/__tests__/ddaEngine.test.ts (6 tests)
 ✓ src/__tests__/blockchainVault.test.ts (4 tests)
 ✓ src/__tests__/appContext.test.tsx (4 tests)
 Test Files  3 passed (3)
      Tests  14 passed (14)
```

### 3. Production Build (`npm run build`)
```
✓ 2103 modules transformed.
dist/index.html                   1.54 kB │ gzip:  0.71 kB
dist/assets/index-catcyhtR.css  513.90 kB │ gzip: 54.07 kB
dist/assets/index-6LiBMfh5.js   992.27 kB │ gzip: 275.49 kB
✓ built in 7.86s
```

---

## 8. Panduan Pemeliharaan & Roadmap Fitur Berikutnya

### 🔮 Agenda Pengembangan Berikutnya:
1. **Audit & Optimasi AI Visual**:
   - Memastikan generator infografis (`generate_image`) dan diagram Mermaid SVG pada tab Visual menghasilkan ilustrasi konsep resolusi tinggi tanpa kegagalan API.
2. **Peningkatan Dashboard Guru**:
   - Form pembuatan pengumuman kelas secara instan dari sisi guru.
   - Fitur *Student Reader Preview* dari portal guru untuk memvalidasi tampilan materi sebelum dipublikasikan ke siswa.
3. **Analitik Keterlibatan Siswa**:
   - Pelacakan progress mendengarkan audio podcast dan pencapaian kompetensi materi adaptif.
