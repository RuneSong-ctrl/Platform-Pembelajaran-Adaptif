# 📋 EduAdapt Platform - Master Task List & Roadmap

Dokumen ini memantau progres implementasi 5 agenda pengembangan utama platform pembelajaran adaptif berbasis AI dan Dynamic Difficulty Adjustment (DDA).

---

## 📌 Status Tracker

- [x] **Task 1: Perbaikan Tampilan Responsif Guru & Siswa**
  - [x] Perbaikan sidebar desktop besar: Hapus `max-w-7xl mx-auto` agar sidebar menempel di tepi kiri (*docked*), tidak menjorok ke dalam pada monitor besar (1440px / 1920px+).
  - [x] Sidebar fixed (tidak ikut ter-scroll): Terapkan struktur App Shell (`h-screen overflow-hidden` pada wrapper dan `overflow-y-auto` pada area konten samping `<main>`).
  - [x] Tampilan materi & kuis di sisi siswa: Tata letak deskripsi tidak dibuat menyamping (*horizontal cramped*), melainkan ditata menurun vertikal (*stacked*) agar nyaman dibaca.
  - [x] Responsivitas mobile & tablet untuk seluruh portal pengajar dan siswa.

- [x] **Task 2: Materi Adaptif per Cara Belajar (Auditori, Visual, Kinestetik) & Batch Pre-Generation**
  - [x] **Batch Pre-Generation Sekali per Kelas (Hemat Token)**: Saat guru upload modul di kelas A, sistem sekali men-generate audio podcast narasi panjang (9Router TTS Orus HD), diagram visual Mermaid, ilustrasi gambar, dan flashcard yang tersimpan di server. Seluruh siswa di kelas langsung streaming aset yang sama tanpa memanggil ulang AI per siswa.
  - [x] **Pembersihan Total Browser Voice**: Seluruh sisa `window.speechSynthesis` di Beranda dan halaman status dibersihkan total; 100% audio murni dari 9Router Orus HD.
  - [x] **Chatbot AI Tutor Berbasis RAG & Sitasi Sumber Wajib**: Retrieval dokumen otomatis dari database dengan hybrid semantic search. Jawaban chatbot wajib bersumber dari modul ajar guru dan mencantumkan rujukan resmi `📖 Sumber Materi: [Judul Modul], Bagian: [Topik]`.
  - [x] **Visual**: Diagram SVG Mermaid ter-render langsung tanpa script, kontrol zoom/fullscreen, dan pre-loaded mindmap.
  - [ ] **Kinestetik (Gamifikasi)**: Pending (akan dirancang gamifikasi yang lebih mendalam pada sesi berikutnya sesuai arahan).

- [ ] **Task 3: Sistem Pembuatan Laporan Akademik (Report & Analytics)**
  - [ ] Rekapitulasi nilai dan capaian kompetensi per siswa dan per kelas.
  - [ ] Analitik kognitif berbasis grafik perkembangan DDA (Basic, Medium, Challenging, Mastery).
  - [ ] Ekspor laporan akademik resmi (format cetak / PDF / ringkasan siap unduh untuk guru & orang tua).
  - [ ] Integrasi verifikasi sertifikat kredensial blockchain pada lembar capaian.

- [ ] **Task 4: Ruang Kelas Terfokus (Google Classroom Style)**
  - [ ] Fokus utama: Menampilkan modul ajar yang diunggah guru untuk rombel bersangkutan.
  - [ ] Manajemen tugas aktif, tenggat waktu pengumpulan (*due dates*), status penilaian guru.
  - [ ] Daftar kuis DDA aktif yang terikat langsung dengan kelas tersebut.
  - [ ] Antarmuka pengumpulan tugas uraian & lampiran catatan mandiri siswa.

- [x] **Task 5: Halaman Materi Khusus Multi-Kelas Adaptif**
  - [x] Halaman materi khusus yang otomatis beradaptasi sesuai modalitas belajar siswa (Auditori / Visual / Kinestetik).
  - [x] Adaptasi multi-kelas: Jika siswa mengikuti lebih dari satu kelas (misal: Biologi 10-A, Fisika 10-B, Matematika 10-A), konten materi otomatis terkelompokkan:
    - **Auditori**: Episode mewakili kelas yang diikuti, dan bagian (*track*) mewakili ringkasan materi per bab.
    - **Visual**: Selektor kelas dengan peta konsep (*mindmap*) masing-masing kelas.
    - **Kinestetik**: Arena lab & flashcard yang dikelompokkan berdasarkan materi kelas aktif.

---

## 🛠️ Catatan Arsitektur & Aturan Desain
1. **Layout Shell**: Selalu gunakan `h-screen flex flex-col overflow-hidden` dengan `<Navbar />` full width (`w-full px-4 sm:px-6 lg:px-8`).
2. **Sidebar**: `hidden md:flex w-64 shrink-0 h-full overflow-y-auto` di tepi kiri tanpa margin horizontal liar.
3. **Area Konten**: `<main className="flex-1 overflow-y-auto min-w-0 ...">` agar scrolling hanya terjadi di sisi konten samping.
