# MASTER DESIGN SYSTEM & UI/UX SPECIFICATION (DESIGN.md)
## Adaptive AI & Blockchain Learning Platform
*Sistem Pembelajaran Digital K-12 Personal, Terpercaya, dan Inklusif*

---

# 🚨 CORE DIRECTIVE: NO AI SLOP, NO VIBECODED APP

> ### 🛑 MANIFESTO: ANTI-AI SLOP & ANTI-VIBECODE STANDARD
> **Platform ini BUKAN template landing page AI abal-abal, BUKAN wrapper LLM generik, dan TIDAK BOLEH terlihat seperti aplikasi hasil "vibecoding" murahan.**
> 
> Seluruh antarmuka dirancang sebagai **sistem produk pendidikan nyata (Enterprise-Grade K-12 Educational Operating System)** yang fungsional, berbobot ilmiah, memiliki arsitektur data autentik, dan ramah pengguna di lapangan.

---

## 📌 30 Anti-Patterns (Vibecode Traps) & Aturan Penegakannya

Berikut adalah penegakan 30 aturan anti-vibecoding yang wajib dipatuhi secara ketat di seluruh UI/UX platform:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               30 RULES TO PREVENT AI SLOP & VIBECODED UI                                         │
├─────┬───────────────────────────────┬──────────────────────────────────────────┬─────────────────────────────────┤
│ NO  │ VIBECODED / AI SLOP TRAP      │ STATUS DI PLATFORM KITA                  │ ATURAN IMPLEMENTASI NYATA       │
├─────┼───────────────────────────────┼──────────────────────────────────────────┼─────────────────────────────────┤
│ 1   │ Harsh gradients               │ 🚫 DILARANG KERAS                        │ Gunakan Solid Pastel Surfaces.  │
│ 2   │ Generic Lucide default icons  │ 🚫 DILARANG ICON TEMPLATE POLOS          │ Gunakan Custom Squircle Icon    │
│     │                               │                                          │ Badges dengan latar pastel.     │
│ 3   │ Pure white `#FFF` background  │ 🚫 DILARANG LATAR KOSONG POLOS           │ Canvas bertingkat (`#F7F6FA`)   │
│     │                               │                                          │ dengan kontur surface bertingkat│
│ 4   │ Rainbow coloring              │ 🚫 DILARANG WARNA-WARNI ASAL             │ Sistem Pastel Token terstruktur │
│     │                               │                                          │ (Mint, Lavender, Butter, Sky).  │
│ 5   │ Muddy / harsh drop shadows    │ 🚫 DILARANG BAYANGAN PEKAT KASAR         │ Multi-layered ambient elevation │
│     │                               │                                          │ halus (`rgba(31,34,46, 0.04)`). │
│ 6   │ 3 feature cards in a row      │ 🚫 DILARANG KARTU FITUR KLISE 3 KOLOM    │ Layout adaptif berbasis peran:  │
│     │                               │                                          │ Feed personal, Learning Path,   │
│     │                               │                                          │ Stream Kelas & Ingestion Matrix.│
│ 7   │ Emoji spam everywhere         │ 🚫 DILARANG EMOJI OVERUSE                │ Gunakan sistem ikon SVG mikro   │
│     │                               │                                          │ berbobot profesional.           │
│ 8   │ Liquid glass / Glassmorphism  │ 🚫 STRICT ZERO GLASSMORPHISM             │ Solid clean surfaces & crisp    │
│     │                               │                                          │ 1px borders. No blur filters.   │
│ 9   │ Overused AI em-dashes (—)     │ 🚫 DILARANG COPYWRITING KLISE AI         │ Bahasa lugas pedagogis K-12     │
│     │                               │                                          │ (Bahasa Indonesia & Inggris).   │
│ 10  │ Inter / Geist / Grotesk bias  │ 🚫 HINDARI TIPOGRAFI BOILERPLATE KAKU    │ Humanist rounded sans:          │
│     │                               │                                          │ Plus Jakarta Sans / Outfit.     │
│ 11  │ Colored left stripe on cards  │ 🚫 DILARANG AKSEN STRIP KIRI KLISE       │ Desain kartu full-surface       │
│     │                               │                                          │ berkarakter squircle menyeluruh.│
│ 12  │ Fake marketing testimonials   │ 🚫 DILARANG TESTIMONI PALSU              │ Tampilkan data kelas nyata,     │
│     │                               │                                          │ progres siswa & submission asli.│
│ 13  │ Forced Bento Grids            │ 🚫 DILARANG BENTO GRID ASAL TEMPEL       │ Modul analitik terstruktur: DDA,│
│     │                               │                                          │ Mastery Heatmap, RAG Indexing.  │
│ 14  │ Terminal window mockups       │ 🚫 DILARANG JENDELA TERMINAL GIMMICK     │ Gunakan interface akademik nyata│
│     │                               │                                          │ (Knowledge Base, RAG Ingestion).│
│ 15  │ "It's not x, it's y" slogans  │ 🚫 DILARANG SLOGAN AI GENERIK            │ Wording jelas, deskriptif,      │
│     │                               │                                          │ berfokus pada hasil belajar.    │
│ 16  │ Plain checkmark bullet lists  │ 🚫 DILARANG POIN CENTANG KLISE           │ Status chips interaktif:        │
│     │                               │                                          │ Mastered, Remedial, In-Progress.│
│ 17  │ 3 generic pricing tiers       │ 🚫 DILARANG TABEL HARGA SAAS FREE/PRO    │ Role-based access akademik:     │
│     │                               │                                          │ Siswa, Guru, Orang Tua, Sekolah.│
│ 18  │ No real product demo          │ 🚫 DILARANG MOCKUP KOSONG TANPA FUNGSI   │ Full working interactive state: │
│     │                               │                                          │ Quiz DDA, RAG parser, Passport. │
│ 19  │ Random soft corner radius     │ 🚫 DILARANG RADIUS ASAL-ASALAN           │ Sistem token radius konsisten:  │
│     │                               │                                          │ 8px, 12px, 18px, 26px, 32px, 9999│
│ 20  │ Neon purple on black theme    │ 🚫 DILARANG DARK MODE AI KLONINGAN       │ Pastel Harmony & Slate Theme    │
│     │                               │                                          │ ramah visual mata anak sekolah. │
│ 21  │ Missing skeleton loaders      │ 🚫 DILARANG CONTENT JUMP / TANPA LOADING │ Skeleton loader wajib ada pada  │
│     │                               │                                          │ setiap kartu async & RAG fetch. │
│ 22  │ Radial background orbs / glow │ 🚫 DILARANG BOLA GRADASI RADIAL BURAM    │ Latar bersih solid terstruktur. │
│ 23  │ Dot grid patterns in bg       │ 🚫 DILARANG POLA TITIK-TITIK TEMPLATE    │ Permukaan datar bersih/minimalis│
│ 24  │ Sparkle icon (✨) spam         │ 🚫 DILARANG ICON SPARKLE DI SEMUA FITUR  │ Label fitur berbasis fungsi     │
│     │                               │                                          │ ("Rekomendasi AI", "Modul DDA") │
│ 25  │ Animated floaty arrows        │ 🚫 DILARANG PANAH BERGOYANG GIMMICK      │ Micro-actions terarah & presisi │
│     │                               │                                          │ (Circle Action Buttons `→`).    │
│ 26  │ Missing Terms of Service (TOS)│ 🚫 DILARANG MENGABAIKAN LEGALITAS        │ Sertakan modul TOS & kepatuhan  │
│     │                               │                                          │ akademik K-12.                  │
│ 27  │ Missing Privacy Policy (PDP)  │ 🚫 DILARANG TANPA KEBIJAKAN PRIVASI      │ Kepatuhan UU PDP / Perlindungan │
│     │                               │                                          │ Data Anak K-12 & Rekam Medis AI │
│ 28  │ Gratuitous hover animations   │ 🚫 DILARANG HOVER HEBOH TANPA TUJUAN     │ Micro-elevation 3px terukur     │
│     │                               │                                          │ untuk tactile touch feedback.   │
│ 29  │ Blinding neon accents         │ 🚫 DILARANG WARNA NEON MENYILAWAKAN      │ Palet pastel terkalibrasi       │
│     │                               │                                          │ dengan standar kontras WCAG AAA.│
│ 30  │ Washed-out / illegible pastel │ 🚫 DILARANG PASTEL PUCAT TAK TERBACA     │ Pastel bertekstur tebal dengan  │
│     │                               │                                          │ teks Deep Charcoal Slate kontras│
└─────┴───────────────────────────────┴──────────────────────────────────────────┴─────────────────────────────────┘
```

---

## 1. Arsitektur Produk & Identitas Utama

Platform ini dibangun di atas **4 Pilar Ilmiah Proposal Hibah Penelitian Fundamental (HPF)**:

```
                      ┌────────────────────────────────────────────────────────┐
                      │    ADAPTIVE AI & BLOCKCHAIN LEARNING ECOSYSTEM (K-12)  │
                      └───────────────────────────┬────────────────────────────┘
                                                  │
         ┌────────────────────────┬───────────────┴────────────────┬────────────────────────┐
         ▼                        ▼                                ▼                        ▼
┌──────────────────┐    ┌──────────────────┐             ┌──────────────────┐     ┌──────────────────┐
│  AI ADAPTIVE     │    │  TEACHER-GROUNDED│             │ OFFLINE LEARNING │     │  BLOCKCHAIN      │
│  ENGINE          │    │  RAG INGESTION   │             │ SYNC ENGINE      │     │  PASSPORT        │
├──────────────────┤    ├──────────────────┤             ├──────────────────┤     ├──────────────────┤
│• Initial Profiling│   │• Upload Dokumen  │             │• Unduh Paket     │     │• Tamper-Proof    │
│• Generative Path │    │• Vector Parsing  │             │• Belajar Offline │     │• Verified Ledger │
│• Dynamic Diff.   │    │• Grounded Quiz   │             │• Auto Local-Sync │     │• Portable Wallet │
│  Adjustment(DDA) │    │• AI Explanation  │             │• Konflik Queue   │     │• Tanpa Jargon Gas│
└──────────────────┘    └──────────────────┘             └──────────────────┘     └──────────────────┘
```

---

## 2. Sistem Warna Pastel Solid & Bebas Glassmorphism

### 2.1. Standar Tanpa Kaca Buram (*Zero Glassmorphism*)
1. Tidak ada `backdrop-filter: blur(...)`.
2. Tidak ada kartu semi-transparan yang membuat teks sulit terbaca di atas latar belakang bergerak.
3. Semua kartu menggunakan **Solid Surface**, garis tepi kontur tipis **1px Border**, dan **Soft Ambient Shadow**.

### 2.2. Definisi Token Warna Pastel Fungsional

```
===================================================================================================
TOKEN                    HEX CODE       PREVIEW               PERAN & ELEMEN DESAIN
===================================================================================================
--canvas-main            #F7F6FA        rgb(247, 246, 250)    Latar utama aplikasi (Off-white tinted)
--surface-card           #FFFFFF        rgb(255, 255, 255)    Kartu putih solid bertingkat
--surface-subtle         #F0EEF6        rgb(240, 238, 246)    Latar tab inaktif & border section

[PASTEL DOMAIN TOKENS]
--mint-base              #D1EBE1        rgb(209, 235, 225)    Sains, Modul Sukses, Visual Learning
--mint-dark              #1D5E4D        rgb(29, 94, 77)       Teks kontras tinggi pada kartu Mint

--lavender-base          #E3DBF8        rgb(227, 219, 248)    Data Analysis, AI Insights, Audio Modality
--lavender-dark          #4B3B7A        rgb(75, 59, 122)      Teks kontras tinggi pada kartu Lavender

--butter-base            #FEE7B3        rgb(254, 231, 179)    Skor Kognitif, Gamifikasi, Kinestetik
--butter-dark            #785308        rgb(120, 83, 8)       Teks kontras tinggi pada kartu Butter

--sky-base               #D2E5FA        rgb(210, 229, 250)    Matematika, Offline Pack, Info Sistem
--sky-dark               #21518A        rgb(33, 81, 138)      Teks kontras tinggi pada kartu Sky

--coral-base             #FCD9D7        rgb(252, 217, 215)    Tugas Mendesak, Perlu Remedial, Deadline
--coral-dark             #852C28        rgb(133, 44, 40)      Teks kontras tinggi pada kartu Coral

[KONTRASTIF & TEKS]
--text-primary           #1C1E26        rgb(28, 30, 38)       Judul H1-H3, Skor Utama, Pill Aktif
--text-secondary         #5A5E70        rgb(90, 94, 112)      Deskripsi modul & informasi pendukung
--text-muted             #9195A8        rgb(145, 149, 168)    Label tanggal & status sekunder
--border-subtle          #E6E4EE        rgb(230, 228, 238)    Pembatas kartu 1px halus
===================================================================================================
```

---

## 3. Sistem Tipografi Humanist & Hierarki (Anti-Generic)

Menggunakan **Plus Jakarta Sans** (Google Fonts) untuk menghadirkan kesan bersahabat, terstruktur, dan mudah dibaca oleh siswa sekolah dasar hingga menengah atas.

```
+----------------------------------------------------------------------------------------------------+
| LEVEL          | UKURAN | LINE-HEIGHT | WEIGHT     | PENERAPAN NYATA                               |
+----------------+--------+-------------+------------+-----------------------------------------------+
| Display Score  | 36px   | 44px        | Bold 800   | Angka Skor ("200 Score", "Mastery 92%")       |
| Heading 1 (H1) | 28px   | 36px        | Bold 700   | "Your Progress Today", "Status Jalur Belajar" |
| Heading 2 (H2) | 22px   | 30px        | Bold 700   | "Designing Seamless User Experiences"         |
| Heading 3 (H3) | 18px   | 26px        | SemiBold   | Judul Modul, Widget Analitik, Tugas Baru      |
| Body Large     | 16px   | 24px        | Medium 500 | Ringkasan materi guru, feedback guru          |
| Body Regular   | 14px   | 20px        | Regular    | Deskripsi tugas, instruksi pengerjaan         |
| Caption / Chip | 12px   | 16px        | SemiBold   | Filter ("Weekly"), Rating ("⭐ 3.5"), Waktu    |
| Micro Status   | 11px   | 14px        | Bold 700   | Badge ("OFFLINE READY", "VERIFIED LEDGER")    |
+----------------+--------+-------------+------------+-----------------------------------------------+
```

---

## 4. Komponen UI Inti (Sesuai Referensi Visual)

### 4.1. Kartu Materi Squircle Pastel (Solid Surface Course Card)
* **Karakter Visual**: Permukaan solid pastel mint/lavender, sudut melengkung ramah (radius 26px), bayangan halus.
* **Elemen Anatomi**:
  1. *Icon Pill (Kiri Atas)*: Squircle putih solid dengan ikon komputer / analitik (`#FFFFFF`).
  2. *Rating / Level Chip (Kanan Atas)*: Pill putih berisikan badge tingkat kesulitan atau rating modul (`⭐ 3.5` / `Level 2`).
  3. *Domain Tag*: Teks kategori uppercase semi-bold (misal: `TECH & SOFTWARE`, `MATEMATIKA ADAPTIF`).
  4. *Course Title*: Tipografi tebal warna slate gelap (`#1C1E26`).
  5. *Active Learners Stack*: Foto avatar lingkaran siswa aktif disertai counter pill (`+5 Siswa`).
  6. *Circle Action Trigger (`→`)*: Tombol aksi bulat solid putih dengan panah hitam tegas.

```
┌──────────────────────────────────────────────────────────┐
│  ┌───┐                                      ┌──────────┐ │
│  │ 💻│ Tech & Software                      │  ⭐ 3.5  │ │
│  └───┘                                      └──────────┘ │
│                                                          │
│  Designing Seamless User Experiences                     │
│  (Materi Terverifikasi Guru via RAG Ingestion)           │
│                                                          │
│  ┌───┐┌───┐┌───┐                                ┌─────┐  │
│  │ 👨││ 👩││ 🧑│ +5 Siswa Sedang Belajar         │  →  │  │
│  └───┘└───┘└───┘                                └─────┘  │
└──────────────────────────────────────────────────────────┘
```

### 4.2. Arc Progress Gauge Meter
* Busur setengah lingkaran bervolume tebal: Transisi dari lavender ke warm butter yellow.
* Menampilkan metrik DDA kognitif siswa (misal: `200 Score`, `Akurasi 94%`, `Kecepatan: 1.4 detik/soal`).

### 4.3. Filter Waktu Berbentuk Kapsul (*Segmented Pills*)
* **Pill Aktif**: Berwarna hitam slate pekat (`#1C1E26`) dengan teks putih cerah.
* **Pill Inaktif**: Berwarna abu-lavender pastel lembut (`#F2EFFC`) dengan teks abu terstruktur.
* Pilihan: `Mingguan (Weekly)` | `Bulanan (Month)` | `Tahunan (Year)`.

### 4.4. Async Loading State (*Skeleton Loader*)
* Mencegah "content jump" saat AI melakukan analisis atau RAG mengambil dokumen:
* Gunakan shimmering skeleton berlatar `#EBE8F4` tanpa animasi kasar.

---

## 5. Arsitektur Hybrid: Mobile-First + Desktop Dashboard

Platform menggabungkan kenyamanan aplikasi mobile untuk siswa & orang tua dengan keleluasaan dashboard desktop untuk guru & verifikator:

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                             HYBRID INTERFACE ARCHITECTURE                                  │
├───────────────────────┬──────────────────────────────────┬─────────────────────────────────┤
│ ASPEK                 │ MOBILE-FIRST (Student & Parent)  │ DESKTOP DASHBOARD (Teacher/LMS) │
├───────────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Target Perangkat      │ Smartphone & Tablet (375px-768px)│ Desktop / Laptop (1280px-1920px)│
│ Zona Navigasi         │ Bottom Floating Nav Bar (Pill)   │ Collapsible Left Sidebar        │
│ Tampilan Utama        │ Daily Progress, Adaptive Feed    │ Kelas, RAG Vector Base, Grade   │
│ Adaptasi Konten       │ 3 Format (Visual, Audio, Game)   │ Matriks DDA & Sebaran Siswa     │
│ Mode Koneksi          │ Offline Downloader & Auto-Sync   │ Sinkronisasi Log & Konflik Data │
│ Ledger Bukti          │ Kartu Paspor Belajar & QR Valid  │ Penerbitan Sertifikat & Ledger  │
└───────────────────────┴──────────────────────────────────┴─────────────────────────────────┘
```

### 5.1. Spesifikasi Tampilan Mobile-First (Siswa)

```
┌─────────────────────────────────────────┐
│ [9:30 PM]                          📶🔋 │
│                                         │
│ ┌───┐  Halo, Ayu!               ┌───┐   │
│ │ 👧│  Profil: Visual & Cepat   │ 🔔│   │
│ └───┘  ═══════════════════════  └───┘   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │          YOUR PROGRESS TODAY        │ │
│ │               ╭───────╮             │ │
│ │              │  200   │             │ │
│ │               ╰───────╯             │ │
│ │          Score • Level 2 DDA        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─── Jalur Belajar Personal (AI) ───┐ │
│ │ 🟢 Modul Visual: Pecahan Desimal    │ │
│ │    Diagram Interaktif • 15 Mnt      │ │
│ │ 🟣 Modul Audio: Sistem Pencernaan   │ │
│ │    Spotify-style Podcast Ep. 1      │ │
│ │ 🟡 Misi Kinestetik: Eco-Guardian    │ │
│ │    Tantangan Simulasi Interaktif    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📦 Paket Offline: 3 Modul Siap      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🏠 Home  📚 Belajar  🏫 Kelas  🏆 ID │ │ <── Floating Bottom Navigation
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 5.2. Spesifikasi Tampilan Desktop Dashboard (Guru & LMS)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [LOGO] ADAPTIVE AI & BLOCKCHAIN LMS                     [Cari Modul/Siswa...]     (🔔) [Pak Budi, S.Pd]│
├───────────────┬────────────────────────────────────────────────────────┬───────────────────────────────┤
│ MENU UTAMA    │ WORKSPACE UTAMA GURU                                   │ ANALITIK ADAPTIF REALTIME     │
│ • Overview    │                                                        │                               │
│ • Kelas 8A    │ ┌────────────────────────────────────────────────────┐ │ ┌───────────────────────────┐ │
│ • Knowledge   │ │ KELAS 8A • MATEMATIKA ADAPTIF                      │ │ │ SEBARAN TINGKAT DDA SISWA │ │
│   Base (RAG)  │ │ 32 Siswa • 14 Dokumen Terindeks • 5 Tugas          │ │ │ • Foundation: 8 Siswa     │ │
│ • Buat AI Quiz│ └────────────────────────────────────────────────────┘ │ │ • Standard:   18 Siswa    │ │
│ • Penilaian   │                                                        │ │ • Advanced:    6 Siswa    │ │
│ • Paspor Siswa│ [ + Upload Dokumen RAG ] [ + Generate Quiz ] [ Nilai ] │ └───────────────────────────┘ │
│ • Legal & PDP │                                                        │                               │
│               │ ┌────────────────────────────────────────────────────┐ │ ┌───────────────────────────┐ │
│               │ │ KNOWLEDGE BASE GURU (RAG GROUNDING)                │ │ │ FEED AKTIVITAS BELAJAR    │ │
│               │ │ 📄 BAB 3 - Operasi Pecahan.pdf (Vector ID: #8821)  │ │ │ • Ayu: Selesai Kuis (90)  │ │
│               │ │ 📄 BAB 4 - Geometri.pdf        (Status: Terindeks) │ │ │ • Budi: Putar Audio Ep 2  │ │
│               │ └────────────────────────────────────────────────────┘ │ └───────────────────────────┘ │
│               │                                                        │                               │
│               │ ┌────────────────────────────────────────────────────┐ │ ┌───────────────────────────┐ │
│               │ │ TUGAS SISWA PERLU DIREVIEW                         │ │ │ BLOCKCHAIN PASSPORT LEDGER│ │
│               │ │ • Ayu Lestari - Tugas Pecahan [Beri Feedback]      │ │ │ 14 Sertifikat Valid       │ │
│               │ │ • Doni Pratama - Kuis DDA 2   [Terverifikasi]      │ │ │ Hash: 0x8f9c...cde8       │ │
│               │ └────────────────────────────────────────────────────┘ │ └───────────────────────────┘ │
└───────────────┴────────────────────────────────────────────────────────┴───────────────────────────────┘
```

---

## 6. Kepatuhan Hukum & Perlindungan Data Anak (No Slop Standard)

Sebagai platform pendidikan K-12 nyata (bukan proyek vibecode main-main):
1. **Modul Terms of Service (TOS)**: Ketentuan hak kekayaan intelektual materi ajar guru dan integritas akademik siswa.
2. **Privacy Policy (UU PDP & Perlindungan Data K-12)**:
   - Data biometrik/kognitif dan rekam kelelahan (*Digital Wellbeing*) **tidak dijual ke pihak ketiga** dan **bukan instrumen diagnosis klinis**.
   - Identitas digital pada Blockchain hanya mencatat hash pembuktian kompetensi tanpa mempublikasikan data pribadi sensitif secara telanjang (*Zero-Knowledge Verification concept*).

---

## 7. Kode Token CSS Produksi (Siap Implementasi)

```css
/* ==========================================================================
   ADAPTIVE AI & BLOCKCHAIN LEARNING PLATFORM - DESIGN SYSTEM TOKENS
   STRICT: ZERO-GLASSMORPHISM | SOLID PASTEL SURFACES | HIGH CONTRAST WCAG AAA
   ========================================================================== */

:root {
  /* Canvas & Base Layers */
  --canvas-bg: #F7F6FA;
  --surface-card: #FFFFFF;
  --surface-subtle: #F0EEF6;

  /* Solid Pastel Tokens */
  --pastel-mint: #D1EBE1;
  --pastel-mint-subtle: #EBF6F2;
  --pastel-mint-dark: #1D5E4D;

  --pastel-lavender: #E3DBF8;
  --pastel-lavender-subtle: #F2EFFC;
  --pastel-lavender-dark: #4B3B7A;

  --pastel-butter: #FEE7B3;
  --pastel-butter-subtle: #FFF6DF;
  --pastel-butter-dark: #785308;

  --pastel-sky: #D2E5FA;
  --pastel-sky-subtle: #EDF4FD;
  --pastel-sky-dark: #21518A;

  --pastel-coral: #FCD9D7;
  --pastel-coral-subtle: #FDF0EF;
  --pastel-coral-dark: #852C28;

  /* Contrast Slate Typography */
  --text-primary: #1C1E26;
  --text-secondary: #5A5E70;
  --text-muted: #9195A8;
  --brand-slate: #1F222E;

  /* Real Depth System (No Glass Blurs) */
  --border-card: 1px solid rgba(28, 30, 38, 0.08);
  --shadow-ambient: 0 4px 14px rgba(28, 30, 38, 0.04);
  --shadow-lift: 0 10px 28px rgba(28, 30, 38, 0.07);

  /* Radius Consistency */
  --radius-badge: 12px;
  --radius-button: 16px;
  --radius-card: 26px;
  --radius-container: 32px;
  --radius-pill: 9999px;
}

/* Base Body Application */
body {
  margin: 0;
  background-color: var(--canvas-bg);
  color: var(--text-primary);
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Card Components */
.card-pastel-mint {
  background-color: var(--pastel-mint);
  border: var(--border-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-ambient);
  padding: 24px;
}

.card-pastel-lavender {
  background-color: var(--pastel-lavender);
  border: var(--border-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-ambient);
  padding: 24px;
}

.card-pastel-butter {
  background-color: var(--pastel-butter);
  border: var(--border-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-ambient);
  padding: 24px;
}

.card-white-solid {
  background-color: var(--surface-card);
  border: var(--border-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-ambient);
  padding: 24px;
}

/* Squircle Action Button */
.btn-circle-action {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-pill);
  background-color: #FFFFFF;
  color: var(--text-primary);
  border: 1px solid rgba(28, 30, 38, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-ambient);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease;
}

.btn-circle-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
}

/* Pill Segments */
.pill-active-dark {
  background-color: var(--brand-slate);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
}

.pill-inactive-pastel {
  background-color: var(--surface-subtle);
  color: var(--text-secondary);
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
}
```

---
*Dokumen ini menjadi standar baku pengembangan UI/UX frontend prototipe penelitian HPF 2026.*
