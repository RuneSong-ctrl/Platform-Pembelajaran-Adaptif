# FINAL MASTER PROJECT CONTEXT  
## Adaptive AI & Blockchain Learning Platform

**Sumber utama:** Proposal Hibah Penelitian Fundamental (HPF) 2026  
**Judul penelitian:** *Pengembangan Pembelajaran Berbasis Adaptive AI dan Blockchain untuk Mewujudkan Ekosistem Pendidikan Digital yang Personal dan Aman*

---

# 1. Tujuan Dokumen

Dokumen ini merupakan **master context project** yang menjadi acuan bersama untuk:

- UI/UX Design
- Frontend
- Backend
- AI Adaptive Engine
- Retrieval-Augmented Generation (RAG)
- Blockchain
- Offline Learning Sync
- Quality Assurance
- Prototype Demonstration
- Dokumentasi penelitian

Dokumen ini menerjemahkan proposal penelitian menjadi konsep produk dan kebutuhan prototipe yang lebih operasional.

Proposal tetap menjadi **source of truth utama**.

---

# 2. Status Informasi

Agar tidak terjadi kesalahan interpretasi, seluruh informasi pada dokumen ini dibagi menjadi tiga kategori.

## [PROPOSAL]

Informasi yang disebutkan secara eksplisit atau memiliki dasar langsung pada proposal HPF.

## [DESIGN DECISION]

Keputusan produk, UI/UX, atau teknis yang diturunkan dari proposal atau ditetapkan oleh tim untuk membuat sistem dapat direalisasikan.

## [OPEN DECISION]

Aspek yang belum ditentukan oleh proposal maupun tim dan masih membutuhkan keputusan lebih lanjut.

---

# 3. Core Product Idea

Platform ini bukan sekadar LMS dan bukan sekadar aplikasi yang menempelkan fitur AI.

**Inti utama produk adalah pengalaman belajar yang adaptif terhadap karakteristik setiap siswa.**

Secara konseptual:

```text
Student
   ↓
Initial Ability Assessment
   ↓
Learning / Cognitive Profile
   ↓
AI Understands Student Characteristics
   ↓
Adaptive Student Dashboard
   ↓
Personal Learning Path
   ↓
Adaptive Learning Experience
   ↓
Adaptive Quiz & Difficulty
   ↓
Learning Performance
   ↓
AI Re-evaluates Student
   ↓
Dashboard & Learning Path Updated
   ↺
```

Dengan demikian, **setiap siswa tidak harus mendapatkan pengalaman belajar yang identik**.

AI berusaha memahami:

- kemampuan awal,
- pola belajar,
- kecepatan belajar,
- performa,
- akurasi,
- waktu respons,
- progress,
- dan modalitas belajar,

kemudian pengalaman siswa disesuaikan berdasarkan informasi tersebut.

---

# 4. Dasar Adaptivitas dari Proposal

## 4.1 Initial Ability Assessment

[PROPOSAL]

Proposal menyatakan bahwa proses pembelajaran diawali dengan **Initial Ability Assessment** untuk menganalisis:

- kecepatan pemrosesan,
- pengenalan pola,
- modalitas belajar siswa.

Berdasarkan hasil tersebut, sistem membangun profil multidimensional siswa.

---

## 4.2 Cognitive Profile

[PROPOSAL]

Proposal secara eksplisit menyebut penggunaan LLM untuk membangun **profil kognitif siswa** melalui Initial Ability Assessment.

Profil inilah yang menjadi dasar personalisasi pembelajaran.

---

## 4.3 Generative Curriculum

[PROPOSAL]

Setelah profil multidimensional terbentuk, AI membangun **Generative Curriculum** berdasarkan karakteristik siswa.

Pada UI produk, istilah teknis ini direpresentasikan sebagai:

**Personal Learning Path**

---

## 4.4 Dynamic Difficulty Adjustment

[PROPOSAL]

AI menerapkan **Dynamic Difficulty Adjustment (DDA)** dan mengevaluasi:

- akurasi,
- waktu respons,

untuk menyesuaikan tingkat kesulitan pembelajaran secara real-time.

Pada bagian metode proposal, kemampuan DDA berdasarkan akurasi dan response time juga dijadikan indikator capaian AI Adaptive Engine.

---

# 5. Adaptive Student Experience

## 5.1 Adaptive Dashboard

[DESIGN DECISION]

Proposal **tidak secara literal mengatakan bahwa layout dashboard harus berubah berdasarkan profiling**.

Proposal menyebut adanya dashboard siswa yang terintegrasi dengan backend AI.

Namun karena profil siswa digunakan untuk membentuk Generative Curriculum dan DDA, tim menetapkan bahwa **hasil adaptasi AI juga direpresentasikan sampai ke Student Dashboard**.

Dengan demikian:

> **Student Dashboard menjadi pintu utama pengalaman belajar adaptif.**

Dashboard menggunakan informasi seperti:

```text
Learning Profile
+
Current Mastery
+
Learning Progress
+
Quiz Performance
+
Response Time
+
Teacher Activity
+
Current Learning Goal
```

untuk menentukan:

- materi utama yang muncul,
- aktivitas yang direkomendasikan,
- urutan learning path,
- jenis representasi materi,
- latihan,
- level difficulty,
- remedial,
- challenge,
- CTA utama,
- dan rekomendasi belajar berikutnya.

---

# 6. One Platform, Different Student Experience

[DESIGN DECISION]

Dua siswa pada kelas dan mata pelajaran yang sama dapat memiliki dashboard yang berbeda.

### Student A

```text
Learning Profile
Visual-oriented

Current Weakness
Fractions

Mastery
55%

Dashboard

Continue Learning
→ Operasi Pecahan

Recommended for You
→ Visual Explanation: Pecahan

Practice Again
→ Penyebut Berbeda

Difficulty
→ Foundation
```

### Student B

```text
Learning Profile
Fast Processing

Fractions Mastery
91%

Dashboard

Continue Learning
→ Persentase

Recommended Challenge
→ Advanced Problem Solving

Difficulty
→ Advanced
```

Prinsip utama:

> **One platform, different learning experience for every student.**

---

# 7. Adaptasi Berdasarkan Modalitas Belajar

[PROPOSAL]

Proposal menyebut **modalitas belajar siswa** sebagai salah satu aspek yang dianalisis dalam Initial Ability Assessment.

Proposal tidak menjelaskan secara detail bagaimana setiap modalitas harus diterjemahkan menjadi bentuk UI.

Mapping berikut merupakan:

**[DESIGN DECISION — TEAM CONTEXT]**

---

# 7.1 Visual-Oriented Learning

Jika siswa lebih cocok dengan pendekatan visual, pengalaman belajar dapat dibuat:

- lebih colorful,
- kaya ilustrasi,
- diagram,
- infographic,
- mind map,
- animation,
- visual progress,
- interactive visualization.

Contoh:

```text
Topic:
Sistem Pencernaan

Recommended Format:
Visual Learning

→ Diagram Organ
→ Animated Process
→ Infographic
→ Visual Quiz
```

Dashboard siswa juga dapat lebih menonjolkan:

- thumbnail,
- illustrations,
- diagram,
- visual cards.

---

# 7.2 Audio-Oriented Learning

[DESIGN DECISION — TEAM CONTEXT]

Untuk siswa yang lebih cocok menggunakan materi audio, pengalaman dapat dibuat menyerupai pengalaman aplikasi audio atau playlist.

Contoh:

```text
Sistem Pencernaan

Audio Learning Playlist

▶ 01. Mengenal Sistem Pencernaan
   06:42

▶ 02. Organ Pencernaan
   08:15

▶ 03. Proses Pencernaan
   10:20

▶ 04. Ringkasan Materi
   04:32
```

UI dapat menampilkan:

- playlist,
- audio player,
- chapter,
- progress audio,
- resume listening,
- transcript.

Konsepnya menyerupai pengalaman **Spotify-like playlist**, tetapi kontennya merupakan materi pembelajaran.

---

# 7.3 Kinesthetic / Practice-Oriented Learning

[DESIGN DECISION — TEAM CONTEXT]

Untuk siswa yang lebih cocok belajar dengan aktivitas langsung, sistem menonjolkan:

- hands-on practice,
- interactive simulation,
- challenge,
- mini-game,
- experiment,
- drag-and-drop,
- problem-solving,
- gamification.

Contoh:

```text
Recommended Activity

Build the Food Chain

Drag organisms into the
correct ecosystem.

[Start Activity]
```

atau:

```text
Mission

Eco-Planet Guardian

Complete the ecosystem
challenge to continue.
```

---

# 8. Adaptasi Tidak Berarti Memberi Label Permanen

[DESIGN DECISION]

Sistem sebaiknya tidak menampilkan label absolut seperti:

> Kamu adalah Visual Learner.

Gunakan wording seperti:

> Berdasarkan aktivitas belajarmu, materi visual saat ini direkomendasikan untukmu.

Profil siswa dapat berubah seiring sistem mendapatkan data baru.

Dengan demikian:

```text
Initial Profile
      ↓
Learning Activity
      ↓
New Performance Data
      ↓
AI Re-evaluation
      ↓
Updated Profile
      ↓
Updated Experience
```

---

# 9. Continuous Adaptation Loop

Adaptivitas tidak berhenti setelah Initial Assessment.

```text
Initial Assessment
       ↓
Learning Profile
       ↓
Adaptive Dashboard
       ↓
Learning
       ↓
Quiz / Practice / Assignment
       ↓
Student Performance
       ↓
Accuracy
Response Time
Mastery
Teacher Feedback
       ↓
AI Re-evaluation
       ↓
Learning Profile Updated
       ↓
Learning Path Updated
       ↓
Dashboard Updated
       ↺
```

Ini merupakan salah satu konsep produk terpenting.

---

# 10. Product Vision

[PROPOSAL]

Platform ditujukan sebagai ekosistem pendidikan digital K-12 yang:

- personal,
- adaptif,
- aman,
- inklusif,
- dapat digunakan pada daerah dengan konektivitas terbatas,
- dan memiliki rekam akademik yang dapat diverifikasi.

Proposal menggabungkan dua pilar utama:

1. **AI Adaptive Engine**
2. **Blockchain Learning Passport**



---

# 11. Novelty dari Proposal

[PROPOSAL]

Proposal menyebut tiga fitur pembeda:

### Offline Learning Sync

Pembelajaran dapat dilakukan pada kondisi minim internet.

### Digital Wellbeing & Mental Health AI Monitor

Sistem mengamati indikator perilaku tertentu untuk membantu mengenali kelelahan atau stres.

### Gamifikasi Imersif & Kolaborasi Global

Termasuk:

- Eco-Planet Guardian
- Global Collaboration Missions



---

# 12. Target User

Platform memiliki tiga persona utama.

## Student

Fokus:

- belajar,
- personal learning,
- assignment,
- quiz,
- adaptive dashboard,
- achievement.

## Teacher / Mentor

Fokus:

- mengelola pembelajaran,
- menyediakan knowledge source,
- membuat materi,
- assignment,
- quiz,
- grading,
- monitoring.

## Parent

Fokus:

- perkembangan anak,
- Knowledge Map,
- achievement,
- aktivitas belajar.

---

# 13. Platform Strategy

[DESIGN DECISION]

Proposal tidak menetapkan secara eksplisit arsitektur mobile-first atau desktop-first.

Proposal hanya menyebut prototipe frontend untuk siswa, guru, dan orang tua.

Selain itu terdapat aktivitas:

> Uji Coba Perangkat Mobile / Offline Sync di Lapangan.

Rekomendasi:

| Persona | Primary Platform |
|---|---|
| Student | Mobile-first PWA/App |
| Parent | Mobile-first |
| Teacher | Web/Desktop |
| Credential Verifier | Web |

---

# 14. High-Level Product Architecture

```text
                    PLATFORM
                       │
      ┌────────────────┼────────────────┐
      │                │                │
      ↓                ↓                ↓
 Learning         Adaptive AI       Trust &
 Management        Engine          Accessibility
      │                │                │
      │                │                │
 Classes          Profiling        Blockchain
 Materials        Learning Profile Learning Passport
 Assignments      Generative       Verification
 Quizzes          Curriculum       Offline Sync
 Submission       DDA
 Grade            RAG
 Feedback
```

---

# 15. Teacher as Learning Content Provider

[DESIGN DECISION]

Guru tidak hanya menjadi monitoring user.

Guru menjadi pihak yang menyediakan **sumber pengetahuan akademik** untuk platform.

Guru dapat:

- membuat kelas,
- menambahkan materi,
- upload dokumen,
- membuat assignment,
- membuat quiz,
- membuat question bank,
- memberikan nilai,
- memberikan feedback.

---

# 16. Teacher Content Management

Guru memiliki **Content Library**.

Jenis materi:

- PDF,
- document,
- text,
- image,
- slide,
- video,
- audio,
- external link.

Metadata:

```text
Title
Subject
Topic
Grade
Learning Objective
Difficulty
Prerequisite
Source
Status
```

Guru dapat:

```text
Create
Edit
Preview
Publish
Unpublish
Archive
```

---

# 17. Teacher Material as RAG Grounding

[DESIGN DECISION — CORE TECHNICAL CONTEXT]

Proposal menyebut penggunaan LLM dan Generative Curriculum, tetapi **tidak menyebut Retrieval-Augmented Generation secara eksplisit**.

Tim menetapkan bahwa materi yang diberikan guru dapat digunakan sebagai **knowledge grounding melalui RAG**.

Arsitektur konseptual:

```text
Teacher
   ↓
Upload Material
   ↓
Content Processing
   ↓
Parsing
   ↓
Chunking
   ↓
Embedding
   ↓
Vector Knowledge Base
   ↓
RAG Retrieval
   ↓
LLM / AI Adaptive Engine
```

Tujuannya agar AI menggunakan materi yang relevan dari guru sebagai konteks ketika menghasilkan atau menyesuaikan pembelajaran.

---

# 18. RAG Knowledge Sources

Knowledge base dapat terdiri dari:

```text
Teacher Materials
       +
Approved Platform Materials
       +
Curriculum Resources
```

Prioritas utama untuk prototype:

**Teacher-provided learning material.**

---

# 19. Fungsi RAG

Dengan grounding tersebut, AI dapat membantu:

### Student

- menjelaskan materi,
- menjawab pertanyaan berdasarkan materi,
- memberikan contoh,
- membuat rangkuman,
- membuat remedial explanation,
- menyesuaikan representasi materi.

### Teacher

- membuat quiz,
- membuat soal,
- membuat summary,
- membuat variasi materi,
- membuat latihan.

---

# 20. Adaptive Content Generation

Contoh:

Guru upload:

```text
BAB 3
Sistem Pencernaan Manusia
```

RAG mengambil konten relevan.

Kemudian AI dapat menghasilkan representasi berbeda.

### Visual Student

```text
Diagram Sistem Pencernaan
+
Infographic
+
Visual Explanation
```

### Audio Student

```text
Audio Playlist
Episode 1
Episode 2
Episode 3
```

### Practice-Oriented Student

```text
Interactive Activity
+
Simulation
+
Challenge
```

Sumber konsepnya tetap berasal dari materi guru.

---

# 21. AI Must Remain Grounded

[DESIGN DECISION]

AI sebaiknya tidak bebas menghasilkan materi akademik tanpa sumber jika materi guru tersedia.

Preferred flow:

```text
Student Request
      ↓
Retrieve Relevant Material
      ↓
RAG Context
      ↓
LLM
      ↓
Adaptive Response
```

---

# 22. Teacher Control

Guru tetap menjadi academic authority.

```text
Teacher Defines
Learning Objective
      ↓
Teacher Provides Material
      ↓
Material Grounded in RAG
      ↓
AI Personalizes Representation
      ↓
Student Learns
```

Prinsipnya:

> **Guru menentukan apa yang dipelajari.**

> **AI membantu menentukan bagaimana materi tersebut paling sesuai diberikan kepada setiap siswa.**

---

# 23. Class Management

[DESIGN DECISION]

Guru dapat:

- create class,
- edit class,
- archive class,
- add student,
- remove student,
- manage subject.

Contoh:

```text
Kelas 8A
Matematika

32 Students
14 Materials
5 Assignments
7 Quizzes
```

---

# 24. Classroom Stream

Setiap kelas memiliki activity stream.

```text
Teacher uploaded:
Operasi Pecahan

New Assignment:
Latihan Pecahan

New Quiz:
Pecahan Dasar

Due Tomorrow:
Project Matematika
```

---

# 25. Assignment Management

[DESIGN DECISION]

Guru dapat membuat assignment.

Informasi:

```text
Title
Instructions
Subject
Topic
Class
Attachment
Due Date
Maximum Score
```

Attachment:

- PDF
- document
- image
- link
- worksheet
- video

---

# 26. Student Assignment Submission

Siswa dapat mengumpulkan:

- PDF,
- document,
- image,
- file,
- text answer,
- link.

Flow:

```text
Teacher Creates Assignment
        ↓
Student Receives Assignment
        ↓
Student Works
        ↓
Upload Submission
        ↓
Submit
        ↓
Teacher Reviews
        ↓
Grade & Feedback
```

---

# 27. Assignment Status

```text
Not Started
In Progress
Submitted
Late
Returned
Graded
```

---

# 28. Resubmission

Jika guru meminta revisi:

```text
Submitted
    ↓
Returned
    ↓
Student Revises
    ↓
Resubmit
    ↓
Teacher Reviews Again
```

---

# 29. Quiz Management

Guru dapat membuat quiz dengan:

### Manual Creation

Guru menambahkan soal sendiri.

### Question Bank

Guru mengambil soal yang sudah tersedia.

### AI-Assisted Quiz

AI menghasilkan draft soal menggunakan materi guru sebagai grounding.

---

# 30. AI Quiz Generation with RAG

```text
Teacher Material
       ↓
RAG Retrieval
       ↓
Quiz Generator
       ↓
Draft Questions
       ↓
Teacher Review
       ↓
Edit
       ↓
Approve
       ↓
Publish
```

AI **tidak langsung publish**.

Guru tetap review dan approve.

---

# 31. Question Bank

Metadata:

```text
Question
Subject
Topic
Learning Objective
Difficulty
Answer
Explanation
Source Material
```

---

# 32. Adaptive Quiz

Adaptive quiz dapat menggunakan:

```text
Learning Profile
+
Current Mastery
+
Previous Accuracy
+
Response Time
+
Current Difficulty
```

untuk memilih pertanyaan berikutnya.

Contoh:

```text
Level 2
   ↓
Correct + Fast
   ↓
Level 3
   ↓
Incorrect
   ↓
Level 2 Reinforcement
```

---

# 33. Quiz Results as Adaptive Input

Setelah quiz:

```text
Accuracy
Response Time
Topic Mastery
Common Mistakes
Difficulty Performance
```

masuk kembali ke AI Adaptive Engine.

```text
Quiz Result
    ↓
AI Analysis
    ↓
Update Learning Profile
    ↓
Update Learning Path
    ↓
Update Dashboard
```

---

# 34. Teacher Grading & Feedback

Guru dapat melihat submission siswa dan memberikan:

- score,
- comment,
- feedback,
- revision request.

Hasil guru dapat menjadi salah satu input perkembangan siswa.

---

# 35. Gradebook

Guru dapat melihat:

| Student | Assignment | Quiz | Mastery | Progress |
|---|---:|---:|---:|---:|
| Ayu | 85 | 90 | 82% | 87% |
| Budi | 75 | 78 | 70% | 72% |

---

# 36. Student Dashboard — Core Information

Adaptive Student Dashboard menampilkan konten berdasarkan kondisi siswa.

Komponen:

### Continue Learning

AI menentukan aktivitas yang paling relevan.

### Personal Learning Path

Progress dan rekomendasi topic.

### Recommended for You

Materi berdasarkan Learning Profile.

### Practice / Reinforcement

Jika terdapat weakness.

### Challenge

Jika mastery tinggi.

### Tasks

Assignment dan quiz dari guru.

### Recent Feedback

Teacher feedback.

### Achievement

Learning Passport.

### Offline Status

Downloaded materials dan sync status.

---

# 37. Dashboard Adaptation Dimensions

[DESIGN DECISION]

Dashboard dapat beradaptasi pada beberapa dimensi.

## Content Priority

Materi yang ditampilkan lebih dahulu.

## Content Representation

Visual, audio, practice, atau kombinasi.

## Difficulty

Foundation hingga Advanced.

## Recommendation

Next lesson, remedial, challenge.

## Navigation Emphasis

Aktivitas yang paling relevan dapat diberi prioritas.

## Gamification

Dapat lebih menonjol pada siswa yang membutuhkan experiential learning.

---

# 38. Personal Learning Path

Contoh:

```text
Mathematics
│
├── ✓ Basic Numbers
├── ✓ Basic Fractions
├── ● Fraction Operations
├── ○ Decimals
└── 🔒 Percentage
```

Status:

- Mastered
- Current
- Recommended
- Needs Review
- Locked

---

# 39. Teacher Dashboard

Guru menggunakan dashboard desktop-first.

Informasi:

### Classes

Daftar kelas.

### Students

Progress setiap siswa.

### Content

Materi dan RAG source.

### Assignments

Tugas.

### Quizzes

Quiz dan question bank.

### Adaptive Learning Analytics

- mastery,
- accuracy,
- response time,
- DDA level.

### Submission

Tugas yang perlu dinilai.

### Gradebook

Nilai.

### Credential

Achievement siswa.

---

# 40. Teacher Navigation

```text
Teacher
│
├── Overview
├── Classes
│   ├── Stream
│   ├── Students
│   └── Gradebook
│
├── Content
│   ├── Materials
│   └── Knowledge Base
│
├── Assignments
│   ├── Create
│   ├── Submissions
│   └── Grading
│
├── Quizzes
│   ├── Create Quiz
│   ├── AI Generate
│   ├── Question Bank
│   └── Results
│
├── Adaptive Analytics
├── Credentials
├── Reports
└── Settings
```

---

# 41. Student Navigation

Mobile-first:

```text
Home
Learn
Class
Passport
Profile
```

### Learn

```text
Learning Path
Recommended
Subjects
Practice
```

### Class

```text
Stream
Materials
Assignments
Quizzes
```

---

# 42. Parent Dashboard

[PROPOSAL]

Proposal secara eksplisit menyebut **Knowledge Map** pada dashboard orang tua.

Parent dapat melihat:

- progress anak,
- Knowledge Map,
- assignment,
- achievement,
- learning activity.

---

# 43. Knowledge Map

Contoh:

```text
            Mathematics
                 │
       ┌─────────┴─────────┐
     Numbers            Geometry
       │
   ┌───┴────┐
Fractions Decimal
    ✓        ●
```

Status:

```text
Mastered
Learning
Needs Support
Not Started
```

---

# 44. Blockchain Learning Passport

[PROPOSAL]

Capaian akademik siswa dicatat pada blockchain ledger dan dikaitkan dengan identitas digital siswa.

Tujuannya membentuk portfolio yang:

- dapat diverifikasi,
- transparan,
- tamper-proof,
- portable lintas institusi.

---

# 45. Blockchain UX

[DESIGN DECISION]

Blockchain tidak perlu terlihat sebagai blockchain kepada siswa.

Gunakan:

```text
Learning Passport
Verified Achievement
Credential
Verification
```

Hindari terminology utama:

```text
Wallet
Hash
Gas Fee
Transaction
Smart Contract
```

---

# 46. Achievement Flow

```text
Learning Activity
      ↓
Mastery
      ↓
Achievement
      ↓
Teacher / School Verification
      ↓
Credential
      ↓
Learning Passport
```

---

# 47. Credential Verification

```text
QR / Verification Link
        ↓
Credential Page
        ↓
Blockchain Verification
        ↓
Verified / Invalid
```

---

# 48. Offline Learning Sync

[PROPOSAL]

Proposal menyebut siswa dapat mengunduh paket pembelajaran personal.

Progress disimpan secara lokal dan otomatis disinkronisasi kembali ketika koneksi tersedia.

---

# 49. Offline Flow

```text
Download Learning Package
        ↓
Internet Lost
        ↓
Learning Continues
        ↓
Progress Saved Locally
        ↓
Connection Returns
        ↓
Synchronization
        ↓
Learning Progress Updated
```

---

# 50. Offline Content

Dapat mencakup:

- learning material,
- image,
- audio,
- activity,
- quiz,
- assignment instructions.

Jika memungkinkan, submission dapat disimpan secara lokal dan diupload setelah internet tersedia.

---

# 51. Connectivity States

```text
Online

Offline
Progress saved locally

Waiting to Sync

Synchronizing

Synced

Sync Failed
```

---

# 52. Digital Wellbeing

[PROPOSAL]

Proposal menyebut AI dapat menganalisis biomarker perilaku digital dan memberikan intervensi seperti jeda atau mindfulness.

Untuk prototype:

[DESIGN DECISION]

Gunakan pendekatan ringan seperti:

```text
How are you feeling?

😊 Great
🙂 Good
😐 Okay
😓 Tired
```

dan:

> Kamu sudah belajar cukup lama. Mau istirahat sebentar?

Fitur ini tidak boleh diposisikan sebagai diagnosis medis.

---

# 53. Gamification

[PROPOSAL]

Proposal menyebut:

- Eco-Planet Guardian
- Global Collaboration Missions



Gamification dapat menggunakan:

- XP,
- badges,
- level,
- mission,
- interactive simulation,
- challenge.

Gamification juga dapat menjadi salah satu bentuk pembelajaran untuk siswa yang lebih cocok dengan pengalaman **hands-on / practice-oriented**.

---

# 54. Main Student Journey

```text
Login
  ↓
Initial Ability Assessment
  ↓
Learning Profile
  ↓
Adaptive Student Dashboard
  ↓
Personal Learning Path
  ↓
Adaptive Content
  ↓
Practice / Quiz
  ↓
Assignment
  ↓
Submission
  ↓
Teacher Feedback
  ↓
Learning Progress
  ↓
AI Re-evaluation
  ↓
Dashboard Updated
  ↓
Mastery
  ↓
Achievement
  ↓
Learning Passport
```

---

# 55. Main Teacher Journey

```text
Login
  ↓
Create Class
  ↓
Upload Material
  ↓
Material Entered into RAG Knowledge Base
  ↓
Create Assignment / Quiz
  ↓
Publish
  ↓
Student Learns
  ↓
Monitor Progress
  ↓
Review Submission
  ↓
Grade & Feedback
  ↓
Verify Mastery
  ↓
Issue Achievement
```

---

# 56. Core AI + RAG Flow

```text
                  TEACHER
                     │
              Upload Material
                     │
                     ↓
             Knowledge Ingestion
                     │
            Parsing / Chunking
                     │
                  Embedding
                     │
                     ↓
               Vector Store
                     │
                     ↓
                   RAG
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
   Adaptive Content        Quiz Generator
          │                     │
          └──────────┬──────────┘
                     ↓
              AI Adaptive Engine
                     │
                     ↓
                  STUDENT
                     │
             Learning Profile
                     │
                     ↓
             Adaptive Dashboard
```

---

# 57. Core Adaptive Loop

```text
Student Profile
      ↓
Adaptive Dashboard
      ↓
Learning Experience
      ↓
Student Activity
      ↓
Performance Data
      ↓
AI Analysis
      ↓
Updated Student Profile
      ↓
Updated Learning Path
      ↓
Updated Dashboard
      ↺
```

**Loop ini merupakan jantung produk.**

---

# 58. Data Used by Adaptive AI

[DESIGN DECISION]

AI dapat mempertimbangkan:

```text
Initial Assessment
Learning Profile
Topic Mastery
Quiz Accuracy
Response Time
Assignment Results
Learning Progress
Completed Activities
Student Feedback
```

Tidak semua data harus digunakan pada prototype pertama.

---

# 59. Role-Based Responsibility

## Teacher

```text
Create
Control
Review
Assess
Verify
```

## AI

```text
Analyze
Retrieve
Recommend
Adapt
Personalize
```

## Student

```text
Learn
Practice
Submit
Progress
```

## Parent

```text
Observe
Understand
Support
```

---

# 60. Core Data Entities

## Users

```text
Student
Teacher
Parent
School
```

## Learning

```text
Class
Subject
Topic
LearningObjective
Material
MaterialSource
```

## RAG

```text
KnowledgeDocument
DocumentChunk
Embedding
KnowledgeBase
```

## Assignment

```text
Assignment
Submission
Grade
Feedback
```

## Quiz

```text
Quiz
Question
QuestionBank
QuizAttempt
QuizAnswer
Difficulty
```

## Adaptive AI

```text
InitialAssessment
LearningProfile
LearningPath
LearningProgress
Mastery
DDARecord
Recommendation
```

## Blockchain

```text
Achievement
Credential
Verification
```

## Offline

```text
OfflinePackage
OfflineActivity
SyncQueue
SyncRecord
```

---

# 61. Prototype Priorities

## P0 — Core Product

Wajib ditunjukkan:

1. Initial Ability Assessment
2. Learning Profile
3. **Adaptive Student Dashboard**
4. Personal Learning Path
5. Adaptive Learning Representation
6. Dynamic Difficulty Adjustment
7. Teacher Dashboard
8. Teacher Upload Material
9. Material Knowledge Base / RAG concept
10. Teacher Create Quiz
11. Teacher Create Assignment
12. Student Assignment
13. Student Upload Submission
14. Teacher Grade & Feedback
15. Parent Knowledge Map
16. Offline Learning
17. Learning Passport

---

# 62. P1 — Supporting

- Question Bank
- Gradebook
- AI Material Assistance
- Credential Verification
- Notifications
- Detailed Analytics
- Reports

---

# 63. P2 — Concept Demonstration

- Wellbeing AI
- Eco-Planet Guardian
- Global Collaboration Missions
- Advanced Gamification

---

# 64. Recommended Prototype Scenario

Gunakan satu siswa contoh.

### Ayu — kelas 8

```text
Ayu Login
    ↓
Initial Ability Assessment
    ↓
AI Builds Learning Profile
    ↓
AI Detects Current Learning Preference
    ↓
Adaptive Dashboard Generated
    ↓
Recommended Learning Path
    ↓
Teacher Material Retrieved through RAG
    ↓
AI Presents Material Adaptively
    ↓
Ayu Takes Adaptive Quiz
    ↓
DDA Adjusts Difficulty
    ↓
Teacher Gives Assignment
    ↓
Ayu Uploads Submission
    ↓
Teacher Grades
    ↓
AI Receives New Performance Data
    ↓
Learning Profile Updated
    ↓
Dashboard Changes
    ↓
Mastery Achieved
    ↓
Learning Passport Updated
```

---

# 65. Demonstration of Different Learning Experiences

Untuk menunjukkan novelty dengan jelas, prototype dapat membandingkan tiga siswa dengan topik sama.

### Student A — Visual-Oriented

```text
Material:
Sistem Pencernaan

Dashboard recommends:
→ Interactive Diagram
→ Infographic
→ Visual Quiz
```

### Student B — Audio-Oriented

```text
Material:
Sistem Pencernaan

Dashboard recommends:
→ Audio Playlist
→ Audio Explanation
→ Transcript
```

### Student C — Practice-Oriented

```text
Material:
Sistem Pencernaan

Dashboard recommends:
→ Interactive Simulation
→ Hands-on Activity
→ Gamified Challenge
```

**Konsep akademiknya sama.**

**Cara penyampaian dan pengalaman belajarnya berbeda.**

Inilah yang harus terlihat dengan jelas pada prototype.

---

# 66. UX Principles

## Adaptive, Not Random

Setiap perubahan pengalaman harus memiliki alasan dari data siswa.

## AI Is Invisible but Helpful

Gunakan:

> Direkomendasikan untukmu.

bukan:

> LLM generated content.

## Teacher Remains in Control

AI membantu, guru tetap academic authority.

## RAG Before Free Generation

Gunakan materi terpercaya jika tersedia.

## Blockchain Should Be Invisible

User melihat manfaat verifikasi, bukan kompleksitas blockchain.

## Progress Before Analytics

Siswa melihat perkembangan.

Guru melihat data detail.

---

# 67. User-Facing Vocabulary

| Technical | User-facing |
|---|---|
| Cognitive Profile | Learning Profile |
| Generative Curriculum | Personal Learning Path |
| DDA | Adaptive Difficulty |
| RAG Retrieval | — disembunyikan |
| Vector Knowledge Base | — disembunyikan |
| Blockchain Ledger | Learning Passport |
| Credential Hash | Verification Details |
| Sync Queue | Waiting to Sync |

---

# 68. Critical Boundary: Proposal vs Design Decision

## Explicitly Supported by Proposal

- K-12 platform
- Initial Ability Assessment
- processing speed
- pattern recognition
- learning modality
- cognitive profile
- Generative Curriculum
- Dynamic Difficulty Adjustment
- accuracy
- response time
- Blockchain Learning Passport
- Offline Learning Sync
- Digital Wellbeing AI
- Gamification
- student dashboard
- teacher dashboard
- parent Knowledge Map

---

## Design Decisions Added by Team

- Adaptive Student Dashboard
- different dashboard content per profile
- visual/audio/practice-specific UI
- Spotify-like audio learning
- hands-on gamified learning
- teacher LMS capabilities
- teacher upload material
- RAG architecture
- vector knowledge base
- AI-grounded quiz generation
- assignment management
- student submission
- grading
- gradebook
- continuous adaptive loop.

---

# 69. Important Open Decisions

## AI

- metode profiling secara ilmiah,
- aturan update profil,
- weight setiap signal,
- DDA algorithm,
- LLM provider/model.

## RAG

- embedding model,
- vector database,
- supported file formats,
- chunking strategy,
- citation strategy,
- document access control.

## Learning Modality

- apakah kategori visual/audio/kinesthetic digunakan sebagai kategori formal,
- apakah berupa preference score,
- apakah satu siswa dapat memiliki kombinasi beberapa modalitas.

Rekomendasi:

**gunakan skor/proporsi dinamis daripada label tunggal permanen.**

Contoh:

```text
Visual Preference      75%
Audio Preference       40%
Practice Preference    82%
```

---

# 70. Product Positioning

Platform ini bukan:

> Google Classroom + AI.

Google Classroom-like features hanya menjadi **Learning Management Layer**.

Nilai utama produk tetap:

```text
Adaptive Student Experience
          +
Teacher-Grounded RAG
          +
Offline Learning
          +
Verified Learning Passport
```

---

# 71. Core Product Statement

> **Platform pembelajaran digital K-12 yang menggunakan Adaptive AI untuk memahami karakteristik dan pola belajar setiap siswa melalui Initial Ability Assessment dan data aktivitas pembelajaran. Profil tersebut digunakan untuk membentuk Personal Learning Path, menyesuaikan difficulty, serta mempersonalisasi pengalaman hingga ke Student Dashboard dan cara penyajian materi. Guru tetap menjadi pengendali akademik dengan menyediakan materi, tugas, dan quiz; materi guru digunakan sebagai knowledge grounding melalui RAG agar AI menghasilkan penjelasan, rekomendasi, dan latihan berdasarkan sumber pembelajaran yang relevan. Platform dilengkapi Offline Learning Sync untuk memastikan aksesibilitas dan Blockchain Learning Passport untuk mencatat serta memverifikasi pencapaian akademik siswa.**

---

# 72. Simplified Product Logic

```text
GURU
│
├── Create Class
├── Upload Material
├── Material → RAG Knowledge Base
├── Create Assignment
├── Create Quiz
└── Grade Student
          │
          ↓
         AI
          │
├── Understand Student
├── Build Learning Profile
├── Retrieve Teacher Knowledge
├── Adapt Material
├── Adapt Difficulty
├── Recommend Activity
└── Adapt Dashboard
          │
          ↓
       STUDENT
          │
├── Adaptive Dashboard
├── Personal Learning Path
├── Adaptive Material
├── Quiz
├── Assignment
├── Upload Submission
└── Achievement
          │
          ↓
 BLOCKCHAIN LEARNING PASSPORT
```

---

# 73. North-Star Experience

Pesan utama yang harus dipahami reviewer setelah melihat prototype adalah:

> **Platform ini tidak memberikan pengalaman belajar yang sama kepada semua siswa. AI memahami karakteristik, performa, dan pola belajar setiap siswa, lalu menyesuaikan jalur belajar, tingkat kesulitan, prioritas aktivitas, bentuk penyajian materi, hingga isi dashboard siswa. Guru tetap menentukan sumber dan tujuan pembelajaran melalui materi yang digunakan sebagai grounding RAG, sementara AI mempersonalisasi cara materi tersebut diberikan kepada masing-masing siswa.**

Versi singkat:

> **Guru menyediakan pengetahuan. AI memahami siswa. Dashboard dan pembelajaran menyesuaikan siswa.**

---

# 74. Final Project Definition

Platform ini terdiri dari empat kemampuan utama:

## 1. Understand the Student

```text
Assessment
↓
Profiling
↓
Learning Profile
```

## 2. Adapt the Experience

```text
Adaptive Dashboard
Personal Learning Path
Adaptive Content
Adaptive Difficulty
```

## 3. Ground the AI

```text
Teacher Material
↓
RAG
↓
Trusted AI Learning Context
```

## 4. Preserve Progress & Trust

```text
Offline Learning
+
Blockchain Learning Passport
```

---

# 75. Final Context Status

Dokumen ini menjadi **master context final** untuk tahap:

- PRD,
- user flow,
- wireframe,
- UI/UX design,
- design system,
- prototype,
- frontend,
- backend,
- AI architecture,
- RAG architecture,
- blockchain architecture.

Konsep utama yang tidak boleh hilang pada tahap desain berikutnya adalah:

> **Adaptive AI bukan hanya menghasilkan soal dengan difficulty berbeda. Adaptasi harus terasa sebagai pengalaman belajar personal secara keseluruhan, mulai dari Learning Profile, isi Student Dashboard, Personal Learning Path, format materi, rekomendasi, latihan, difficulty, hingga aktivitas berikutnya.**

Dan:

> **Guru merupakan sumber dan pengendali pengetahuan akademik. Materi yang diberikan guru menjadi salah satu sumber utama RAG agar AI tetap grounded ketika membantu proses pembelajaran.**

Kedua prinsip tersebut menjadi **core product context** yang harus dipertahankan pada seluruh tahap pengembangan berikutnya.