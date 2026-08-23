# 🐍 EduAdapt Backend API

Backend REST API berbasis **FastAPI (Python 3)** & **MySQL / SQLAlchemy 2.0 ORM** untuk mendukung platform pembelajaran adaptif K-12, mesin Dynamic Difficulty Adjustment (DDA), dan Blockchain Secure Vault.

---

## 🚀 Panduan Memulai Cepat

### 1. Masuk ke Direktori Backend
```bash
cd backend
```

### 2. Buat Virtual Environment (Opsional tapi Disarankan)
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate
```

### 3. Instal Dependensi
```bash
pip install -r requirements.txt
```

### 4. Konfigurasi Database (.env)
Sesuaikan `DATABASE_URL` di file `.env`:
- **MySQL**: `DATABASE_URL="mysql+pymysql://root:password@localhost:3306/eduadapt_db"`
- **SQLite (Otomatis)**: `DATABASE_URL="sqlite:///./eduadapt.db"`

### 5. Jalankan Server API
```bash
python run.py
```
atau
```bash
uvicorn app.main:app --reload --port 8000
```

Buka dokumentasi interaktif Swagger di: **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## 🏛️ Endpoint REST API Utama

| Modul | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| **Auth & Users** | `GET /api/v1/users` | Mengambil data seluruh pengguna & profil kognitif |
| **Classrooms** | `GET /api/v1/classrooms` | Manajemen rombel & kode gabung siswa |
| **Documents RAG**| `POST /api/v1/documents/upload` | Upload modul silabus guru untuk grounding AI |
| **Tasks & AI Quiz**| `POST /api/v1/tasks/generate-quiz` | Pembangkitan kuis ter-grounding otomatis |
| **DDA Engine** | `POST /api/v1/dda/evaluate` | Evaluasi kenaikan/penurunan level adaptif |
| **Assessment** | `POST /api/v1/assessment/submit` | Analisis modalitas & kecepatan pemrosesan siswa |
| **Blockchain Vault**| `POST /api/v1/credentials/mint`<br>`GET /api/v1/credentials/verify/{id}` | Penerbitan & verifikasi kriptografis SHA-256 Merkle |
| **Schedules** | `GET /api/v1/schedules` | Manajemen target mingguan siswa |

---

## 🧪 Menjalankan Pengujian Unit (Pytest)
```bash
pytest
```
