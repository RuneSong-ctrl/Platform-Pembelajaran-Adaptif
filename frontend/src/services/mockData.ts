import {
  User,
  Classroom,
  GroundedDocument,
  GroundedTask,
  BlockchainCredential,
  AssignmentSubmission,
  ParentTeacherNote,
  OfflinePackage,
} from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "user_ayu_01",
    name: "Ayu Lestari",
    email: "ayu@student.eduadapt.id",
    role: "SISWA",
    avatar: "AL",
    grade: 10,
    learningStyle: "VISUAL",
    modalityScores: {
      visual: 82,
      audio: 45,
      practice: 55,
    },
    processingSpeed: "MODERATE",
    xpTotal: 450,
    streakDays: 14,
    hearts: 5,
    currentDDALevel: "MEDIUM",
  },
  {
    id: "user_budi_02",
    name: "Budi Pratama",
    email: "budi@student.eduadapt.id",
    role: "SISWA",
    avatar: "BP",
    grade: 10,
    learningStyle: "KINESTETIK",
    modalityScores: {
      visual: 40,
      audio: 35,
      practice: 90,
    },
    processingSpeed: "FAST",
    xpTotal: 720,
    streakDays: 21,
    hearts: 4,
    currentDDALevel: "CHALLENGING",
  },
  {
    id: "user_citra_03",
    name: "Citra Dewi",
    email: "citra@student.eduadapt.id",
    role: "SISWA",
    avatar: "CD",
    grade: 10,
    learningStyle: "AUDITORI",
    modalityScores: {
      visual: 48,
      audio: 88,
      practice: 42,
    },
    processingSpeed: "MODERATE",
    xpTotal: 310,
    streakDays: 7,
    hearts: 3,
    currentDDALevel: "BASIC",
  },
  {
    id: "user_teacher_01",
    name: "I Made Sukadana, S.Pd., M.Ed.",
    email: "sukadana@guru.eduadapt.id",
    role: "GURU",
    avatar: "MS",
    subjectSpecialization: "Biologi & Matematika K-12",
  },
  {
    id: "user_parent_01",
    name: "Ibu Ni Wayan Sari",
    email: "wayan.sari@parent.id",
    role: "ORTU",
    avatar: "WS",
    childrenIds: ["user_ayu_01"],
  },
];

export const MOCK_CLASSROOMS: Classroom[] = [
  {
    id: "cls_bio_10a",
    name: "Biologi & Sains Kelas 10-A",
    grade: 10,
    subject: "Biologi",
    joinCode: "UDU802",
    teacherId: "user_teacher_01",
    teacherName: "I Made Sukadana, S.Pd.",
    studentIds: ["user_ayu_01", "user_budi_02", "user_citra_03"],
    documentsCount: 4,
    tasksCount: 6,
    createdAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "cls_mat_10a",
    name: "Matematika Adaptif Kelas 10-A",
    grade: 10,
    subject: "Matematika",
    joinCode: "MAT714",
    teacherId: "user_teacher_01",
    teacherName: "I Made Sukadana, S.Pd.",
    studentIds: ["user_ayu_01", "user_budi_02"],
    documentsCount: 3,
    tasksCount: 4,
    createdAt: "2026-08-05T08:00:00.000Z",
  },
];

export const MOCK_GROUNDED_DOCUMENTS: GroundedDocument[] = [
  {
    id: "doc_bio_01",
    classroomId: "cls_bio_10a",
    title: "BAB 3 - Sistem Pencernaan & Nutrisi Manusia.pdf",
    rawText:
      "Sistem pencernaan manusia terdiri dari saluran pencernaan yang mencakup mulut, kerongkongan (esofagus), lambung, usus halus, usus besar, dan anus. Enzim ptialin (amilase) di mulut memecah karbohidrat menjadi maltosa. Di lambung, enzim pepsin memecah protein dan asam klorida (HCl) membunuh bakteri pathogen. Usus halus terdiri dari duodenum, jejunum, dan ileum yang berfungsi menyerap sari nutrisi.",
    chunksCount: 18,
    vectorId: "VEC-BIO-301",
    status: "READY",
    uploadedAt: "2026-08-10T10:15:00.000Z",
    summary:
      "Modul lengkap fisiologi organ pencernaan mekanis & kimiawi beserta fungsi enzim spesifik.",
  },
  {
    id: "doc_bio_02",
    classroomId: "cls_bio_10a",
    title: "BAB 4 - Ekosistem, Jaring Makanan & Daur Biogeokimia.pdf",
    rawText:
      "Ekosistem adalah kesatuan fungsional antara komponen biotik (produsen, konsumen, pengurai) dan abiotik (tanah, air, udara, cahaya). Rantai makanan dimulai dari produsen berklorofil dan energi mengalir menurut hukum termodinamika dengan efisiensi rata-rata 10%.",
    chunksCount: 12,
    vectorId: "VEC-BIO-402",
    status: "READY",
    uploadedAt: "2026-08-12T14:30:00.000Z",
    summary:
      "Konsep aliran energi, rantai makanan tingkat trofik, dan daur materi lingkungan.",
  },
  {
    id: "doc_mat_01",
    classroomId: "cls_mat_10a",
    title: "BAB 2 - Logika Proposisi & Aljabar Pecahan.pdf",
    rawText:
      "Operasi pecahan dengan penyebut berbeda memerlukan penentuan Kelipatan Persekutuan Terkecil (KPK). Pada implikasi logika p -> q, nilai kebenaran bernilai salah hanya ketika premis p bernilai benar dan konklusi q bernilai salah.",
    chunksCount: 14,
    vectorId: "VEC-MAT-201",
    status: "READY",
    uploadedAt: "2026-08-08T09:00:00.000Z",
    summary: "Aturan operasi pecahan, KPK, dan tabel kebenaran logika proposisional.",
  },
];

export const MOCK_TASKS: GroundedTask[] = [
  {
    id: "task_bio_pencernaan_quiz",
    classroomId: "cls_bio_10a",
    classroomName: "Biologi Kelas 10-A",
    type: "quiz",
    title: "Kuis Adaptif DDA: Fisiologi Sistem Pencernaan",
    chapter: "BAB 3 - Sistem Pencernaan",
    sourceReference: "Modul Guru BAB 3 Hal 42-56 (VEC-BIO-301)",
    difficultyLevel: "BASIC",
    isPublished: true,
    dueDate: "2026-08-25T23:59:00.000Z",
    contentJson: {
      overview:
        "Kuis interaktif dengan Dynamic Difficulty Adjustment. Soal menyesuaikan akurasi dan waktu berpikir Anda.",
      questions: [
        {
          id: "q1",
          questionText:
            "Enzim apakah yang pertama kali mencerna karbohidrat secara kimiawi saat makanan berada di rongga mulut?",
          options: [
            "Pepsin",
            "Ptialin (Amilase Saliva)",
            "Tripsin",
            "Lipase Pankreas",
          ],
          correctIndex: 1,
          difficulty: "BASIC",
          sourceReference: "BAB 3 Halaman 44 Modul Guru",
          explanation: {
            analogi:
              "Ptialin bekerja seperti gunting pemotong rantai polisakarida panjang menjadi maltosa.",
            visual:
              "Rongga Mulut -> Kelenjar Saliva -> Ptialin -> Amilum menjadi Maltosa.",
            langkah:
              "1. Makanan masuk rongga mulut\n2. Kelenjar ludah mensekresi saliva\n3. Ptialin bekerja pada pH netral 6.8.",
          },
        },
        {
          id: "q2",
          questionText:
            "Asam Klorida (HCl) di dalam lambung memiliki fungsi fisiologis utama yaitu...",
          options: [
            "Menghidrolisis lemak menjadi asam lemak",
            "Membunuh bakteri & mengaktifkan pepsinogen menjadi pepsin",
            "Menyerap air dan garam mineral secara osmosis",
            "Mengemulsikan gumpalan lemak dari makanan",
          ],
          correctIndex: 1,
          difficulty: "MEDIUM",
          sourceReference: "BAB 3 Halaman 48 Modul Guru",
          explanation: {
            analogi:
              "HCl menciptakan lingkungan asam steril untuk mengaktifkan enzim proteolitik.",
            visual:
              "Sel Parietal Lambung -> HCl (pH 1.5) -> Pepsinogen aktif menjadi Pepsin.",
            langkah:
              "1. Sel parietal mensekresi ion H+ dan Cl-\n2. Bakteri patogen dinetralisir\n3. Pepsinogen inaktif teraktivasi.",
          },
        },
        {
          id: "q3",
          questionText:
            "Jika seseorang mengalami gangguan penyerapan nutrisi di usus halus (malabsorpsi), bagian manakah yang paling berperan memperluas bidang penyerapan?",
          options: [
            "Otot sfingter pilorus",
            "Vili dan mikrovili pada dinding epitel ileum",
            "Kelenjar mukosa esofagus",
            "Kantong empedu hepatik",
          ],
          correctIndex: 1,
          difficulty: "CHALLENGING",
          sourceReference: "BAB 3 Halaman 52 Modul Guru",
          explanation: {
            analogi:
              "Vili melipat gandakan luas permukaan serap nutrisi hingga 250 meter persegi.",
            visual:
              "Dinding Usus Halus -> Lipatan Sirkuler -> Vili -> Kapiler Darah & Pembuluh Kil.",
            langkah:
              "1. Kimus masuk ke duodenum dan ileum\n2. Vili menyerap glukosa dan asam amino\n3. Pembuluh kil menyerap asam lemak.",
          },
        },
        {
          id: "q4",
          questionText:
            "Analisis biokimia: Mengapa enzim tripsin disekresikan dalam bentuk inaktif (tripsinogen) oleh pankreas sebelum mencapai duodenum?",
          options: [
            "Agar tidak mengendapkan garam empedu di kantong empedu",
            "Untuk mencegah autodigesti (pencernaan jaringan protein sendiri) pada pankreas",
            "Karena memerlukan suhu dingin untuk diaktifkan",
            "Agar asam lambung dapat dinetralkan terlebih dahulu oleh empedu",
          ],
          correctIndex: 1,
          difficulty: "MASTERY",
          sourceReference: "BAB 3 Halaman 55 Modul Guru",
          explanation: {
            analogi:
              "Enzim proteolitik disimpan inaktif agar organ pankreas tidak mencerna dirinya sendiri.",
            visual:
              "Pankreas -> Tripsinogen (Inaktif) -> Masuk Duodenum -> Enterokinase -> Tripsin Aktif.",
            langkah:
              "1. Pankreas tersusun dari protein\n2. Tripsin aktif berbahaya jika aktif di organ pankreas\n3. Enterokinase di usus halus bertindak sebagai aktivator.",
          },
        },
      ],
    },
    createdAt: "2026-08-14T09:00:00.000Z",
  },
  {
    id: "task_bio_material_adaptive",
    classroomId: "cls_bio_10a",
    classroomName: "Biologi Kelas 10-A",
    type: "material",
    title: "Materi Adaptif: Sistem Pencernaan Multimodalitas",
    chapter: "BAB 3 - Sistem Pencernaan",
    sourceReference: "Modul Guru BAB 3 Hal 42-56 (VEC-BIO-301)",
    difficultyLevel: "BASIC",
    isPublished: true,
    contentJson: {
      overview:
        "Eksplorasi konsep sistem pencernaan dengan format yang beradaptasi sesuai preferensi belajar Anda (Visual, Audio, Kinestetik).",
      audioChapters: [
        {
          title: "Episode 1: Petualangan Menembus Saluran Cerna",
          duration: "05:24",
          transcript:
            "Selamat datang di modul audio EduAdapt. Di episode pertama ini, kita menelaah rongga mulut, fungsi mekanik gigi, dan peran kimiawi enzim ptialin dalam memecah amilum menjadi maltosa.",
        },
        {
          title: "Episode 2: Rahasia Asam Lambung & Enzim Pepsin",
          duration: "06:12",
          transcript:
            "Memasuki lambung dengan keasaman pH 1.5 yang disekresikan sel parietal, mengaktifkan pepsinogen menjadi pepsin untuk mencerna protein.",
        },
        {
          title: "Episode 3: Labirin Penyerapan Sari Makanan di Usus Halus",
          duration: "07:45",
          transcript:
            "Vili dan mikrovili pada dinding usus halus menyerap nutrisi ke dalam pembuluh darah dan limfa secara optimal.",
        },
      ],
      kinestheticSimulation: {
        title: "Simulasi Susun Urutan Organ & Enzim Pencernaan",
        instructions:
          "Pasangkan organ pencernaan dengan enzim pencerna yang tepat ke zona fungsinya.",
        items: [
          { id: "item_ptialin", name: "Enzim Ptialin", targetZone: "zone_mulut" },
          { id: "item_pepsin", name: "Pepsin & HCl", targetZone: "zone_lambung" },
          { id: "item_tripsin", name: "Tripsin & Lipase", targetZone: "zone_duodenum" },
          { id: "item_absorpsi", name: "Vili Penyerapan", targetZone: "zone_ileum" },
        ],
        zones: [
          { id: "zone_mulut", name: "1. Rongga Mulut" },
          { id: "zone_lambung", name: "2. Lambung (Ventrikulus)" },
          { id: "zone_duodenum", name: "3. Usus 12 Jari (Duodenum)" },
          { id: "zone_ileum", name: "4. Usus Penyerapan (Ileum)" },
        ],
      },
    },
    createdAt: "2026-08-13T11:00:00.000Z",
  },
  {
    id: "task_bio_assignment_01",
    classroomId: "cls_bio_10a",
    classroomName: "Biologi Kelas 10-A",
    type: "assignment",
    title: "Tugas Analisis Studi Kasus: Gangguan Penyerapan Nutrisi",
    chapter: "BAB 3 - Sistem Pencernaan",
    sourceReference: "Modul Guru BAB 3 Hal 58 (VEC-BIO-301)",
    difficultyLevel: "MEDIUM",
    isPublished: true,
    dueDate: "2026-08-28T17:00:00.000Z",
    contentJson: {
      instructions:
        "Analisislah kerusakan struktur vili usus halus (penyakit celiac) dan buatlah ringkasan rekomendasi nutrisi pendukung dalam 200-300 kata.",
      maxScore: 100,
    },
    createdAt: "2026-08-15T08:30:00.000Z",
  },
];

export const MOCK_CREDENTIALS: BlockchainCredential[] = [
  {
    id: "cred_ayu_bio_01",
    certificateId: "KOG-2026-BIO-X7A9",
    studentId: "user_ayu_01",
    studentName: "Ayu Lestari",
    classroomId: "cls_bio_10a",
    className: "Biologi Kelas 10-A",
    competencyTitle: "Penguasaan Fisiologi Sistem Pencernaan & Nutrisi",
    score: 95.0,
    blockIndex: 1,
    previousHash:
      "0000000000000000000000000000000000000000000000000000000000000000",
    blockHash:
      "1cfca0ab928b28ddacd32aa9f078d088c16fbfddfaac5cd8b52dc65a92ee6e63",
    transactionId: "0x8eb379df03c48023cf3bc1d1e5e12fe985cd447a",
    verifiedBy: "Universitas Udayana & Riset Fundamental HPF",
    issuedAt: "2026-08-17T08:30:00.000Z",
  },
  {
    id: "cred_budi_mat_01",
    certificateId: "KOG-2026-MAT-K9B2",
    studentId: "user_budi_02",
    studentName: "Budi Pratama",
    classroomId: "cls_mat_10a",
    className: "Matematika Adaptif Kelas 10-A",
    competencyTitle: "Logika Proposisi & Komputasi Aljabar Lanjut",
    score: 100.0,
    blockIndex: 2,
    previousHash:
      "1cfca0ab928b28ddacd32aa9f078d088c16fbfddfaac5cd8b52dc65a92ee6e63",
    blockHash:
      "4aa87ee6f9aadc55c3fa8134769fee60e7e1160eef3efb03c185dd490941616b",
    transactionId: "0x36b076a6bce5de222ba840b505a14ef04ce067c8",
    verifiedBy: "Universitas Udayana & Riset Fundamental HPF",
    issuedAt: "2026-08-18T10:00:00.000Z",
  },
];

export const MOCK_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: "sub_01",
    taskId: "task_bio_assignment_01",
    taskTitle: "Tugas Analisis Studi Kasus: Gangguan Penyerapan Nutrisi",
    studentId: "user_ayu_01",
    studentName: "Ayu Lestari",
    submittedAt: "2026-08-16T14:20:00.000Z",
    content:
      "Penyakit celiac merusak vili pada mukosa usus halus sehingga terjadi atrofi vili. Hal ini mengurangi luas bidang penyerapan nutrisi penting seperti zat besi, kalsium, dan vitamin larut lemak. Solusi utamanya adalah diet bebas gluten seumur hidup dan suplementasi enzim pendukung.",
    attachmentName: "Analisis_Celiac_Ayu_Lestari.pdf",
    status: "Graded",
    grade: 92,
    feedback:
      "Analisis sangat tajam dan berbasis bukti modul guru. Poin mekanisme atrofi vili dijelaskan dengan sangat terstruktur.",
  },
];

export const MOCK_NOTES: ParentTeacherNote[] = [
  {
    id: "note_01",
    senderId: "user_parent_01",
    senderName: "Ibu Ni Wayan Sari",
    receiverId: "user_teacher_01",
    receiverName: "Pak Made Sukadana",
    studentId: "user_ayu_01",
    studentName: "Ayu Lestari",
    message:
      "Selamat pagi Pak Made, Ayu sangat bersemangat belajar Biologi minggu ini menggunakan diagram visual. Apakah ada rekomendasi latihan tambahan untuk persiapan ulangan bab depan?",
    sentAt: "2026-08-18T07:30:00.000Z",
    reply:
      "Selamat pagi Bu Wayan. Ayu menunjukkan akurasi 95% pada pemahaman organ. Saya telah menambahkan 1 modul tantangan ekstra pada jalur belajar personal Ayu.",
    replyAt: "2026-08-18T08:15:00.000Z",
  },
];

export const MOCK_OFFLINE_PACKAGES: OfflinePackage[] = [
  {
    id: "pkg_01",
    title: "Paket Belajar Mandiri: BAB 3 Sistem Pencernaan",
    subject: "Biologi K-10",
    sizeMb: 14.2,
    itemsCount: 6,
    isDownloaded: true,
    syncStatus: "Offline Ready",
  },
  {
    id: "pkg_02",
    title: "Paket Latihan DDA: Logika & Aljabar Pecahan",
    subject: "Matematika K-10",
    sizeMb: 8.5,
    itemsCount: 4,
    isDownloaded: false,
    syncStatus: "Synced",
  },
];
