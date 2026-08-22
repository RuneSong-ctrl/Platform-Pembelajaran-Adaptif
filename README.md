# 🎓 EduAdapt Platform

<div align="center">

![EduAdapt Banner](https://img.shields.io/badge/EduAdapt-Adaptive%20AI%20%26%20Blockchain%20Vault-blue?style=for-the-badge)

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-FCC72B?style=flat-square&logo=vitest&logoColor=black)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**Platform E-Learning Adaptif K-12 Berbasis AI Brain & Blockchain Secure Vault**  
*Riset Hibah Fundamental Universitas Udayana*

</div>

---

## 📌 Ringkasan Proyek (Overview)

**EduAdapt** adalah platform pembelajaran digital adaptif yang dirancang untuk siswa K-12 (SD Kelas 1 hingga SMA Kelas 12), guru, dan orang tua. Platform ini mengintegrasikan dua pilar teknologi utama:

1. 🧠 **AI Adaptive Brain (Dynamic Difficulty Adjustment & RAG)**:
   - Menyesuaikan tingkat kesulitan soal secara dinamis (*Mudah* ➔ *Sedang* ➔ *Menantang* ➔ *Mahir*) berdasarkan performa dan waktu respons siswa.
   - Pembangkitan materi dan kuis ter-grounding 100% dari silabus/PDF guru guna mencegah halusinasi AI.
2. 🔐 **Blockchain Vault (Kredensial Transparan & Anti-Manipulasi)**:
   - Pencatatan capaian belajar, badge kompetensi, dan sertifikat digital ke dalam ledger permanen yang dapat diverifikasi secara publik via kode QR / hash verifikasi.
3. 🎮 **Gamifikasi Pembelajaran Interaktif (Duolingo-Inspired)**:
   - Jalur belajar berupa *stepping stones* pulau bertingkat, XP rewards, *daily streaks*, avatar leveling, dan feedback apresiatif yang ramah anak.

---

## 🏛️ Arsitektur Peran Pengguna (User Roles)

```mermaid
graph TD
    subgraph Guru [👩‍🏫 Portal Guru / Studio Konten]
        G1[Kelola Rombel & Kode Kelas]
        G2[Upload Silabus / Modul PDF RAG]
        G3[AI Quiz & Assessment Generator]
        G4[Gradebook & Validasi Capaian]
    end

    subgraph Siswa [🎮 Portal Siswa / Gamified Path]
        S1[Asesmen Awal Gaya Belajar]
        S2[Learning Path & Sesi Belajar Adaptif]
        S3[Kuis DDA Interaktif & Bantuan AI]
        S4[Klaim Paspor Belajar Blockchain Vault]
    end

    subgraph OrangTua [👨‍👩‍👧 Hub Orang Tua]
        P1[Pantau Knowledge Map & Waktu Belajar]
        P2[Cek Peringatan Kesulitan Siswa]
        P3[Verifikasi Sertifikat Digital Anak]
    end

    subgraph Publik [🌐 Verifikasi Terbuka]
        PUB1[Scan QR Code Sertifikat]
        PUB2[Verifikasi Keaslian Hash Ledger]
    end

    G2 -->|Grounding Knowledge Base| S2
    S2 -->|Data Progres Realtime| G4
    S4 -->|Ledger Record| P3
    S4 -->|Public Proof| PUB2
```

---

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Bahasa**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom Claymorphism / Neumorphism Tokens
- **Komponen UI**: [Radix UI Primitives](https://www.radix-ui.com/), [Lucide React Icons](https://lucide.dev/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Pengujian**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **CI/CD**: GitHub Actions

---

## 📂 Struktur Direktori

```text
Platform-Pembelajaran-Adaptif/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI Workflow
├── frontend/                    # Aplikasi Web Frontend (React + Vite)
│   ├── public/                  # Static assets & PWA manifest
│   ├── src/
│   │   ├── __tests__/           # Unit & Integration Tests (Vitest)
│   │   ├── components/          # Reusable UI & Layout Components
│   │   ├── contexts/            # Global App Context & State
│   │   ├── lib/                 # Utilitas & Helper Functions
│   │   ├── pages/               # Halaman Aplikasi (Siswa, Guru, Orang Tua, dsb.)
│   │   ├── services/            # Logika DDA Engine, RAG Mock, Blockchain Vault
│   │   ├── types/               # TypeScript Interface & Type Definitions
│   │   ├── App.tsx              # Router & Route Configurations
│   │   └── main.tsx             # Entry Point React
│   ├── package.json             # Dependensi & Script Frontend
│   ├── vite.config.ts           # Konfigurasi Vite
│   └── vitest.config.ts         # Konfigurasi Unit Test Vitest
├── .gitignore                   # Root Git Ignore
├── PRD.md                       # Product Requirements Document
├── SPEC.md                      # Technical Specification Document
└── README.md                    # Dokumentasi Utama Repositori
```

---

## 🛠️ Panduan Memulai (Quick Start)

### Prasyarat
- **Node.js**: `v18.0.0` atau lebih baru (Disarankan `v20+`)
- **npm**: `v9.0.0` atau lebih baru

### 1. Kloning Repositori
```bash
git clone https://github.com/<username>/Platform-Pembelajaran-Adaptif.git
cd Platform-Pembelajaran-Adaptif/frontend
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (Opsional)
Salin contoh file `.env`:
```bash
cp .env.example .env
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

---

## 🧪 Pengujian & Build

```bash
# Menjalankan unit tests
npm run test

# Menjalankan type-checking dan build production
npm run build

# Menjalankan preview build production
npm run preview
```

---

## 📚 Dokumentasi Terkait

- [PRD (Product Requirements Document)](./PRD.md)
- [Technical Specification](./SPEC.md)
- [Design Guide (Frontend)](./frontend/DESIGN.md)

---

## 📄 Lisensi

Proyek ini berada di bawah lisensi [MIT](LICENSE).
