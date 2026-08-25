# **Arsitektur Sistem Pembelajaran Adaptif Berbasis AI dan RAG: Integrasi Modalitas Belajar Dinamis dan Teori Kognitif pada Level K-12**

## **1\. Executive Summary & Theoretical Foundations**

Pengembangan platform pembelajaran adaptif pada jenjang K-12 yang mampu merespons karakteristik individual siswa mensyaratkan fondasi kognitif yang kokoh dan berorientasi pada bukti empiris1. Secara historis, penerapan modalitas belajar (Visual, Auditory, Kinesthetic — VAK/VARK) dalam dunia pendidikan kerap terjebak dalam praktik keliru yang dikenal sebagai pelabelan statis (*static labeling*)2. Pendekatan esensialis ini mengasumsikan bahwa setiap peserta didik memiliki gaya belajar bawaan yang bersifat permanen dan harus dipenuhi secara eksklusif melalui instruksi yang sejenis2. Laporan riset ini menyajikan paradigma arsitektural baru bagi *AI Adaptive Engine* dengan mengintegrasikan prinsip kognitif teruji dan teknologi *Generative AI* serta *Retrieval-Augmented Generation* (RAG)1.

### **Dekonstruksi Neuromitos Gaya Belajar dan Paradigma Dynamic Preference Scoring**

Kajian meta-analisis mendalam oleh Pashler et al. (2008) membongkar kelemahan fundamental dari "hipotesis pencocokan" (*meshing hypothesis*)3. Hipotesis tersebut mengklaim bahwa tingkat pemahaman siswa akan meningkat secara signifikan jika metode pengajaran disesuaikan secara kaku dengan "gaya belajar" dominan mereka2. Penelitian psikologi kognitif menunjukkan tidak adanya bukti metodologis yang sah untuk mendukung pengkategorian statis tersebut2. Sebaliknya, memetakan siswa ke dalam kategori tunggal yang permanen justru menimbulkan dampak destruktif terhadap pola pikir pembelajaran (*learning mindset*)2. Pelabelan statis memicu pembatasan potensi diri (*self-limiting beliefs*), menurunkan motivasi siswa untuk melatih modalitas pemrosesan kognitif lain, serta mengabaikan kenyataan bahwa domain materi pelajaran itu sendiri yang secara intrinsik menentukan bentuk representasi terbaiknya2. Sebagai contoh, konsep ilmu spasial seperti Geometri atau Biologi Molekuler menuntut pemrosesan visual terlepas dari preferensi individu, sementara pemahaman tata bahasa atau analisis wacana membutuhkan pemrosesan verbal-auditori2.  
Sebagai alternatif ilmiah yang valid, platform ini menerapkan paradigma *Dynamic Preference Scoring*1. Dalam pendekatan ini, modalitas tidak dipandang sebagai *trait* biologis yang kaku, melainkan sebagai *probabilitas preferensi dinamis* yang berfluktuasi berdasarkan konteks materi, tingkat kesulitan, beban kognitif, dan respons perilaku siswa secara real-time1. Profil modalitas siswa direpresentasikan sebagai vektor probabilitas multimodal berdimensi kontinu:  
![][image1]  
Melalui pemodelan stokastik ini, seorang siswa dapat menunjukkan kecenderungan ![][image2] Visual dan ![][image3] Kinestetik saat mempelajari konsep abstrak Biologi Molekuler, namun bergeser menjadi ![][image4] Kinestetik dan ![][image5] Auditori saat melakukan eksperimen laboratorium Fisika1. Model ini memberikan kelenturan bagi sistem untuk menyajikan kombinasi materi yang paling efektif tanpa pernah mengunci identitas belajar siswa1.

### **Integrasi Teori Beban Kognitif dan Dual-Coding Theory**

Pembentukan representasi adaptif berbasis AI diselaraskan dengan dua pilar utama psikologi kognitif modern:  
Teori Beban Kognitif (*Cognitive Load Theory* \- Sweller) menekankan bahwa memori kerja (*working memory*) manusia memiliki kapasitas pemrosesan yang sangat terbatas7. Penyampaian informasi yang tidak terstruktur atau terlalu kompleks dapat memicu keterbebanan kognitif (*cognitive overload*), yang menghambat perpindahan informasi ke memori jangka panjang7. *AI Adaptive Engine* memanfaatkan skor preferensi modalitas untuk mengoptimalkan *germane load* (pemrosesan konstruktif untuk pembentukan skema) sekaligus meminimalkan *extraneous load* (beban akibat format penyampaian yang buruk) melalui penyesuaian format konten yang tepat sasaran1.  
Teori Penyandian Ganda (*Dual-Coding Theory* \- Paivio) menyatakan bahwa otak manusia memproses informasi melalui dua saluran independen namun saling melengkapi: saluran visual-spasial dan saluran verbal-linguistik7. Integrasi stimulus visual yang terstruktur (seperti diagram atau infografis) dengan penjelas verbal/auditori yang sejajar akan mengaktifkan kedua saluran memori secara simultan7. Penyandian ganda ini terbukti memperkuat jejak memori (*memory trace*) dan meningkatkan retensi informasi secara signifikan7. Oleh karena itu, *AI Adaptive Engine* tidak mengisolasi modalitas secara tunggal, melainkan memprioritaskan satu saluran utama sebagai pengantar primer sambil tetap menyediakan penopang (*scaffolding*) dari saluran sekunder secara proporsional1.

## **2\. Taxonomy & Behavioral Indicators**

Untuk menghindari ketergantungan pada survei mandiri (*self-assessment survey*) yang cenderung subjektif dan tidak akurat, sistem mengombinasikan asesmen kemampuan awal (*Initial Ability Assessment*) dengan ekstraksi data telemetri interaksi siswa secara implisit dan kontinu1. Data perilaku ini ditangkap oleh antarmuka aplikasi dan diproses oleh mesin analitikan untuk menghitung perubahan skor preferensi secara terukur1.

### **Definisi Operasional Pemrosesan Kognitif**

Pemrosesan *Visual-Oriented* didefinisikan sebagai kecenderungan kognitif siswa dalam mengorganisasi dan memahami informasi melalui pemetaan spasial, orientasi bentuk, hirarki visual, asosiasi warna, serta hubungan diagramatik1.  
Pemrosesan *Audio-Oriented* didefinisikan sebagai kecenderungan kognitif siswa dalam mencerna informasi melalui struktur fonologis, pemrosesan auditori sekuensial, ritme naratif, pengulangan verbal, dan penjelasan berbasis dialog atau naskah lisan1.  
Pemrosesan *Kinesthetic/Practice-Oriented* didefinisikan sebagai kecenderungan kognitif siswa dalam menginternalisasi konsep melalui manipulasi langsung, eksperimentasi berbasis aksi-reaksi, koreksi kesalahan secara mandiri (*trial-and-error*), serta pemecahan masalah berbasis tugas interaktif1.

### **Indikator Perilaku Telemetri Siswa**

Data telemetri yang dikumpulkan oleh platform mencakup berbagai metrik interaksi implisit yang mencerminkan keterlibatan kognitif siswa terhadap bentuk representasi tertentu1. Tabel berikut menyajikan taksonomi indikator perilaku beserta metrik kinerjanya:

| Modalitas Belajar | Indikator Telemetri Implisit (Interaksi Digital) | Respons Waktu & Pola Navigasi | Metrik Kinerja Kuis & Latihan |
| :---- | :---- | :---- | :---- |
| **Visual-Oriented** | Frekuensi pembesaran (*zoom-in*) pada elemen diagram; durasi penelusuran (*hover*) pada infografis; interaksi aktif dengan *node* SVG interaktif; pemilihan modul visual dibanding teks saat diberikan pilihan bebas1. | *Dwell time* yang relatif tinggi pada halaman ber-diagram; kecepatan membaca teks skrip lebih tinggi dibanding mendengarkan audio; tingkat penggunaan fitur *fullscreen image* yang dominan1. | Akurasi jawaban yang lebih tinggi pada soal-soal berbasis penalaran spasial, rekognisi pola visual, dan pemetaan hubungan konsep1. |
| **Audio-Oriented** | Inisiasi pemutaran fitur *Text-to-Speech* (TTS) atau audio narasi; penyesuaian kecepatan pemutaran (*playback speed* 1.25x/1.5x); pengaktifan sorotan transkrip (*transcript syncing*)1. | Waktu pemutaran audio linier yang konsisten dengan durasi trek; penurunan frekuensi klik fisik saat audio berlangsung; pemutaran ulang (*replay*) pada segmen penjelasan audio spesifik1. | Akurasi jawaban tinggi pada soal pemahaman naratif, analisis retoris, kesimpulan dialog, dan pertanyaan yang disajikan secara lisan1. |
| **Kinesthetic / Practice** | Inisiasi cepat tombol "Mulai Latihan" atau "Simulasi"; frekuensi aktivitas *drag-and-drop*; perubahan variabel pada *virtual lab*; tingkat interaksi tinggi pada skenario bercabang1. | *Response time* yang sangat singkat pada aksi awal; toleransi kesalahan awal yang tinggi (*high initial error rate*) diikuti interaksi koreksi yang cepat; *dwell time* rendah pada teks teori murni1. | Peningkatan akurasi kuis secara signifikan setelah melakukan manipulasi variabel/simulasi dibandingkan setelah membaca atau mendengarkan penjelasan1. |

## **3\. Comparative Blueprint (Representasi Konten Digital)**

Untuk mempertahankan *academic integrity* dan memastikan bahwa seluruh siswa mendapatkan cakupan kurikulum yang setara, satu dokumen sumber materi ajar dari guru (seperti topik **"Sistem Pencernaan Manusia"** pada level K-12) diproses oleh RAG dan ditransformasikan menjadi tiga spesifikasi representasi digital1.

                                  \[ Teacher Material PDF \]  
                                             │  
                                             ▼  
                                  \[ RAG Ingestion & Chunking \]  
                                             │  
                                             ▼  
                                 \[ AI Adaptive Engine \]  
                                             │  
               ┌─────────────────────────────┼─────────────────────────────┐  
               │                             │                             │  
               ▼                             ▼                             ▼  
   \[ Visual Representation \]    \[ Audio Representation \]    \[ Kinesthetic Representation \]  
   \- Interactive SVG Diagram    \- Audio Podcast Script      \- Simulation State Machine  
   \- Concept Mind Map           \- TTS with SSML Tags        \- Drag-and-Drop Canvas  
   \- Infographic Cards          \- Transcript Karaoke Sync   \- Virtual Lab Experiment

Tabel berikut menguraikan perbandingan spesifikasi teknis dari ketiga bentuk representasi konten digital tersebut:

| Dimensi Spesifikasi | Visual-Oriented Representation | Audio-Oriented Representation | Kinesthetic/Practice Representation |
| :---- | :---- | :---- | :---- |
| **Bentuk Struktur Konten** | Peta konsep hirarkis (*Mind Map*), diagram alur kerja SVG interaktif, dan kartu komparasi visual1. | Playlist naratif episotik berbasis bab (*chapterized podcast*) dan skrip terstruktur untuk *Text-to-Speech*1. | Simulasi laboratorium virtual berbasis *state machine*, skenario pemecahan masalah bercabang, dan misi praktis1. |
| **Arsitektur Layout UI** | Grid visual dominan: Diagram utama di area atas, kartu infografis interaktif, teks penjelas pendek dalam format *callout*1. | Antarmuka berfokus pada pemutar media: *Audio player* profesional, *waveform visualizer*, serta transkrip terinterkoneksi (*karaoke sync*)1. | Ruang kerja berbasis aksi: *Canvas* interaktif penuh (![][image2] area layar), panel kontrol variabel, serta instruksi langkah dalam format *floating widget*1. |
| **Spesifikasi Aset Digital** | Vektor SVG interaktif dengan *node expansion*, grafik vektor rasio tinggi, skema warna berbasis kodifikasi fungsi organ1. | File audio HQ (Opus/AAC 64kbps) dengan suara TTS natural, dilengkapi aturan prosodi (penekanan dan jeda) yang disesuaikan untuk siswa K-121. | *Canvas* HTML5/WebGL interaktif, elemen *drag-and-drop* ber-fisika (*snap-to-target*), dan mesin simulasi aksi-reaksi1. |
| **Mekanisme Interaktivitas** | Klik untuk memperluas rincian organ; sakelar filter visual (misal: "Tampilkan Hanya Enzim"); *hover tooltips* penjelas1. | Kendali pemutaran media; pengubah kecepatan audio; navigasi teks-ke-audio (mengetuk kata pada transkrip melompat ke audio terkait)1. | Operasi *drag-and-drop* bolus makanan; penyesuaian slider pH lambung untuk mengamati laju reaksi enzim; perakitan urutan organ pencernaan1. |
| **Asesmen Formatif (In-line)** | *Visual Drag-Labeling*: Memasangkan nama organ dan fungsinya pada diagram anatomi kosong1. | *Audio Prompt Quiz*: Mendengarkan skenario klinis pencernaan dan memilih jawaban berdasarkan analisis naratif1. | *Simulation Task*: Menyelesaikan tantangan "Menyembuhkan Pasien Virtual" yang mengalami gangguan pencernaan melalui penyesuaian enzim1. |
| **Mitigasi Beban Kognitif** | Pencegahan *visual clutter* melalui teknik *progressive disclosure* (informasi rinci hanya muncul saat diinteraksi)7. | Pencegahan *transient information effect* dengan menyediakan tombol pemutaran ulang 5 detik dan transkrip terikat7. | Pencegahan *split-attention effect* dengan menempatkan petunjuk instruksi secara berdampingan di titik aksi7. |

## **4\. AI & RAG Technical Pipeline Recommendations**

Pipeline RAG dirancang untuk menjamin *factual grounding* sehingga LLM tidak menghasilkan informasi yang menyimpang dari dokumen asli yang diunggah oleh guru1.

### **Strategi Ingesti Data dan Segmentasi Dokumen (Chunking)**

Proses ekstraksi materi guru diawali dengan pembacaan dokumen baku (PDF/DOCX) yang dilanjutkan dengan beberapa tahapan spesifik:  
Pertama, *Semantic Boundary Chunking* digunakan untuk memotong dokumen berdasarkan batas makna logis (seperti bab, sub-bab, atau tujuan pembelajaran), bukan berdasarkan pemotongan karakter kaku1. Metode ini menjaga keutuhan konsep akademik1.  
Kedua, *Parent-Child Document Retrieval* diterapkan dengan menyimpan *child chunks* berukuran kecil (200-300 token) untuk kebutuhan pencocokan vektor presisi tinggi pada pencarian database, sementara *parent chunk* berukuran lebih besar (800-1500 token) dikembalikan ke konteks LLM untuk menjamin kelengkapan instruksional1.  
Ketiga, *Metadata Enrichment* menambahkan atribut rinci pada setiap potongan data, meliputi Subject, Grade\_Level, Concept\_ID, Cognitive\_Taxonomy\_Level (Bloom/Marzano), serta Academic\_Core\_Keywords8.

### **Prompt Engineering & Meta-Prompting Strategies**

Transformasi materi terstruktur dilakukan melalui strategi *Meta-Prompting*. LLM diinstruksikan oleh *System Prompt* yang mewajibkan keluaran berformat JSON terstruktur sesuai skema spesifik tiap modalitas1.

#### **Template System Prompt untuk Integrasi RAG dan Transmutasi Modalitas**

YOU ARE AN EXPERT K-12 ADAPTIVE PEDAGOGY AI ENGINE. YOUR TASK IS TO TRANSFORM THE PROVIDED TEACHER GROUNDING TEXT INTO A SPECIFICALLY FORMATTED ADAPTIVE CONTENT REPRESENTATION.  
CRITICAL CONSTRAINTS:

> 1. STRICT ACADEMIC GROUNDING: USE ONLY INFORMATION PRESENT IN THE PROVIDED CONTEXT. DO NOT INTRODUCE EXTERNAL FACTS.  
> 2. TARGET MODALITY: {TARGET\_MODALITY} (Visual | Audio | Kinesthetic)  
> 3. TARGET GRADE LEVEL: {GRADE\_LEVEL}

## **CONTEXT FROM TEACHER SOURCE:**

## **{RAG\_RETRIEVED\_PARENT\_CHUNK}**

FORMAT REQUIREMENTS BASED ON MODALITY:

> * IF VISUAL: OUTPUT A VALID JSON CONTAINING A CONCEPT MAP STRUCTURE (NODES, EDGES, METADATA) AND INFOGRAPHIC HIGHLIGHTS.  
> * IF AUDIO: OUTPUT A VALID JSON CONTAINING AN ENGAGING SCRIPT WITH SPEECH MARKS, PAUSE TIMINGS, AND TRANSCRIPT HIGHLIGHTS OPTIMIZED FOR TTS.  
> * IF KINESTHETIC: OUTPUT A VALID JSON CONTAINING STEP-BY-STEP SIMULATION LOGIC, DRAG-DROP STATE MACHINES, AND EXPERIMENTAL VARIABLES.

PRODUCE ONLY VALID JSON MATCHING THE SCHEMA FOR {TARGET\_MODALITY}.

#### **JSON Schema Output: Visual Representation (Node-Graph Diagram)**

JSON  
{  
  "modality": "Visual",  
  "topic\_id": "BIO\_DIGESTION\_01",  
  "visual\_element": {  
    "type": "interactive\_flowchart",  
    "nodes": \[  
      {  
        "id": "node\_1",  
        "label": "Mulut (Oral Cavity)",  
        "shape": "rounded\_rectangle",  
        "color\_code": "\#3B82F6",  
        "annotation": "Pencernaan Mekanis (Gigi) & Kimiawi (Enzim Amilase)"  
      },  
      {  
        "id": "node\_2",  
        "label": "Lambung (Stomach)",  
        "shape": "rounded\_rectangle",  
        "color\_code": "\#EF4444",  
        "annotation": "Pencernaan Kimiawi (Pepsin, HCl) & Mekanis (Peristaltik)"  
      }  
    \],  
    "edges": \[  
      {  
        "source": "node\_1",  
        "target": "node\_2",  
        "label": "Bolus bergerak melalui Kerongkongan (Esofagus)",  
        "style": "animated\_arrow"  
      }  
    \]  
  },  
  "summary\_infographic\_cards": \[  
    {  
      "title": "Perbedaan Enzim Utama",  
      "visual\_comparison": \[  
        {"item": "Amilase", "location": "Mulut", "target": "Karbohidrat"},  
        {"item": "Pepsin", "location": "Lambung", "target": "Protein"}  
      \]  
    }  
  \]  
}

#### **JSON Schema Output: Audio Representation (TTS Script & Synchronization)**

JSON  
{  
  "modality": "Audio",  
  "topic\_id": "BIO\_DIGESTION\_01",  
  "audio\_playlist": \[  
    {  
      "chapter\_id": "ch\_1",  
      "title": "Petualangan Makanan: Dari Mulut ke Lambung",  
      "estimated\_duration\_seconds": 180,  
      "script\_segments": \[  
        {  
          "speaker": "Narrator",  
          "text": "Bayangkan kamu sedang mengunyah sepotong roti. Di dalam mulutmu, proses ajaib dimulai\!",  
          "ssml\_tags": "\<break time='500ms'/\>\<prosody rate='medium' pitch='+2st'\>",  
          "transcript\_sync\_marker": "marker\_01"  
        },  
        {  
          "speaker": "Narrator",  
          "text": "Enzim amilase dalam air liur segera memecah zat tepung menjadi gula sederhana.",  
          "ssml\_tags": "\<emphasis level='strong'\>Enzim amilase\</emphasis\> \<break time='300ms'/\>",  
          "transcript\_sync\_marker": "marker\_02"  
        }  
      \]  
    }  
  \]  
}

#### **JSON Schema Output: Kinesthetic Representation (Interactive State Machine)**

JSON  
{  
  "modality": "Kinesthetic",  
  "topic\_id": "BIO\_DIGESTION\_01",  
  "simulation\_engine": {  
    "activity\_type": "drag\_and\_drop\_experiment",  
    "canvas\_background": "human\_digestive\_system\_silhouette",  
    "draggable\_items": \[  
      {"id": "item\_karbo", "label": "Karbohidrat (Roti)", "type": "substrate"},  
      {"id": "item\_enzim\_pepsin", "label": "Enzim Pepsin", "type": "catalyst"}  
    \],  
    "drop\_zones": \[  
      {"id": "zone\_mulut", "accepted\_types": \["item\_karbo"\], "target\_organ": "Mulut"},  
      {"id": "zone\_lambung", "accepted\_types": \["item\_enzim\_pepsin"\], "target\_organ": "Lambung"}  
    \],  
    "interaction\_rules": \[  
      {  
        "if\_dropped": {"item": "item\_karbo", "zone": "zone\_mulut"},  
        "then\_trigger": {  
          "animation": "breakdown\_particles",  
          "feedback\_message": "Tepat\! Karbohidrat mulai dicerna di mulut oleh amilase.",  
          "score\_delta": 10  
        }  
      }  
    \]  
  }  
}

### **Parameter Evaluasi Konten Adaptif**

Sebelum konten generatif disajikan kepada siswa, pipeline validasi otomatis mengevaluasi output berdasarkan tiga matriks utama:  
*Factual Faithfulness Score (RAG Triad Evaluation)* mengukur tingkat kemiripan makna (*semantic similarity*) antara klaim pada konten generatif dengan konteks sumber materi guru1. Ambang batas minimal yang ditetapkan adalah ![][image6] untuk mencegah timbulnya halusinasi informasi1.  
*Modality Conformity Index* menilai sejauh mana struktur output memenuhi elemen interaktif modalitas target, memastikan bahwa skema JSON memuat seluruh kunci atribut wajib seperti *nodes* untuk visual, *SSML tags* untuk audio, atau *state machines* untuk kinestetik1.  
*Cognitive Appropriateness Score* mengevaluasi indeks keterbacaan teks (*Flesch-Kincaid Grade Level*) untuk menjamin bahwa kompleksitas bahasa yang dihasilkan sesuai dengan tingkat usia dan jenjang K-121.

### **Continuous Adaptation Loop (Pembaruan Profil Stokastik)**

Profil modalitas siswa diperbarui secara berkala tanpa perubahan drastis melalui pemodelan *Bayesian Knowledge Tracing* (BKT) yang dipadukan dengan alokasi *Multi-Armed Bandit* (MAB) / *Thompson Sampling*6. Setiap modalitas ![][image7] diwakili oleh distribusi probabilitas Beta ![][image8]11.  
Ketika siswa berinteraksi dengan materi ber-modalitas ![][image9] dan menyelesaikan tugas formatif, sistem menghitung **Skor Keberhasilan Interaksi (![][image10])**:  
![][image11]  
Dimana bobot ditetapkan sebesar ![][image12], ![][image13], dan ![][image14]. Nilai ![][image15] berkisar antara ![][image16] hingga ![][image17], ![][image18] mencerminkan efisiensi waktu pemecahan masalah, dan ![][image19] memberikan bobot tambahan jika siswa secara mandiri memilih format materi tersebut1.  
Jika ![][image20] (dikategorikan sebagai interaksi positif), parameter distribusi diperbarui melalui persamaan:  
![][image21]  
![][image22]  
Nilai probabilitas preferensi dinamis ![][image23] pada siklus berikutnya diambil dari ekspektasi matematis distribusi Beta11:  
![][image24]  
Model pembaruan stokastik ini menjamin bahwa profil modalitas beradaptasi secara berangsur-angsur, stabil terhadap fluktuasi sementara, dan secara objektif mencerminkan pola belajar siswa seiring waktu1.

## **5\. Practical Implementation Guidelines & Pitfalls to Avoid**

Implementasi platform pembelajaran adaptif yang efektif memerlukan keseimbangan antara kecanggihan algoritma AI, ketersediaan infrastruktur teknis, serta prinsip antarmuka yang ramah pengguna1.

### **Panduan Praktis Perancangan Sistem Adaptif**

Tabel berikut merangkum panduan utama mengenai hal-hal yang direkomendasikan (*Do's*) serta hal-hal yang harus dihindari (*Don'ts*) dalam pengembangan platform:

| Kategori | Praktik Terbaik yang Direkomendasikan (Do's) | Kesalahan Fatal yang Harus Dihindari (Don'ts) |
| :---- | :---- | :---- |
| **Pedagogi & Profiling** | Penerapan *Dynamic Preference Scoring* berbasis probabilitas kontinu yang terus diperbarui berdasarkan data interaksi1. | Pelabelan statis absolut seperti menampilkan ucapan *"Kamu adalah Visual Learner"* yang mengunci identitas belajar siswa1. |
| **Penyajian Konten** | Penyediaan *multimodal fallback* (seperti transkrip teks pada audio) untuk mendukung penyandian ganda1. | Mengisolasi saluran sensori secara total dengan menghilangkan akses teks bagi siswa yang cenderung kinestetik2. |
| **Otonomi Siswa** | Pemberian agensi penuh melalui antarmuka *Modality Switcher* agar siswa dapat mengganti format materi secara bebas1. | Memaksa atau mengunci format konten tertentu tanpa memberikan opsi bagi siswa untuk beralih format1. |
| **Grounding Akademik** | Pengikatan seluruh luaran AI pada dokumen materi guru melalui RAG guna menjaga kebenaran substansi1. | Membiarkan LLM menghasilkan penjelasan akademik secara bebas tanpa adanya konteks rujukan terverifikasi1. |
| **Interaksi UI/UX** | Penyesuaian tata letak antarmuka secara halus (*subtle adaptation*) untuk menonjolkan rekomendasi materi1. | Mengubah pola navigasi utama aplikasi secara mendadak yang dapat membingungkan fokus belajar siswa1. |

### **Pola Interaksi UI/UX dan Modality Switcher**

Sistem menerapkan pola interaksi dua tingkat untuk menjaga keseimbangan antara rekomendasi cerdas AI dan otonomi siswa (*student agency*)1:  
Pada tingkat rekomendasi (*AI Recommendation Highlight*), antarmuka dashboard memperlihatkan prioritas visual pada format konten yang memiliki bobot preferensi tertinggi1. Komponen ini ditampilkan secara intuitif melalui kualifikasi ringan, seperti label *"Direkomendasikan berdasarkan pola belajarmu: Visual Diagram"*1.  
Pada tingkat kendali (*Modality Switcher*), antarmuka menyediakan tombol navigasi terintegrasi di bagian atas setiap modul pembelajaran1. Tombol ini memungkinkan siswa beralih bentuk representasi materi secara langsung kapan saja1:

> * Opsi Visual: \[ 👁️ Visual Diagram \]  
> * Opsi Audio: \[ 🎧 Audio Podcast \]  
> * Opsi Kinestetik: \[ 🎮 Simulasi Interaktif \]

Peralihan manual yang dilakukan oleh siswa direkam oleh sistem sebagai masukan positif (![][image25]) yang memperbarui nilai probabilitas preferensi pada siklus berikutnya, memberikan informasi kepada AI bahwa siswa membutuhkan perspektif modalitas yang berbeda untuk memahami konsep tersebut1.

### **Arsitektur Sinkronisasi Offline-First (Offline-First Sync)**

Untuk menanggulangi keterbatasan konektivitas internet pada berbagai sekolah K-12 di daerah terpencil, platform menerapkan arsitektur *Offline-First Sync Compatibility*1:  
Proses diawali dengan *Predictive Local Caching*. Saat perangkat terhubung ke jaringan, sistem mengunduh paket pembelajaran personal (*Personalized Offline Package*) yang mencakup aset SVG terkompresi, file audio Opus bitrate rendah, serta pustaka JavaScript untuk simulasi interaktif offline1. Seluruh data disimpankan pada penyimpanan lokal browser menggunakan **Dexie.js** sebagai *wrapper* **IndexedDB**14.  
Selama masa tidak terhubung ke jaringan (*offline*), seluruh metrik interaksi siswa (termasuk waktu respons, frekuensi peralihan modalitas, dan akurasi kuis) disimpan secara aman dalam antrean lokal (*Sync Queue*)1.  
Ketika koneksi internet kembali tersedia, sistem menjalankan *Delta Synchronization Protocol* untuk mengirimkan akumulasi data telemetri yang terkompresi (\< 50KB) ke server1. *AI Adaptive Engine* di server kemudian memproses antrean data tersebut secara kolektif, memperbarui parameter distribusi Beta (![][image26]), dan mengembalikan jalur belajar yang telah diperbarui untuk sesi pembelajaran berikutnya1.

## **6\. Kesimpulan**

Penerapan modalitas belajar dalam sistem pembelajaran adaptif berbasis AI dan RAG untuk level K-12 memerlukan pergeseran paradigma dari pelabelan statis yang kaku menuju pemodelan preferensi dinamis berbasis probabilitas1. Integrasi teori beban kognitif dan penyandian ganda memastikan bahwa adaptasi representasi konten tidak mengisolasi saluran sensori, melainkan mengoptimalkan pemrosesan memori kerja siswa1. Melalui arsitektur RAG yang terikat pada materi guru, pemodelan stokastik Bayesian/MAB, antarmuka yang memberikan agensi penuh kepada siswa, serta dukungan sinkronisasi offline-first, platform ini mampu menyajikan pengalaman belajar yang personal, inklusif, dan teruji secara akademis1.

#### **Karya yang dikutip**

> 1. Final Master Project Context — Adaptive AI & Blockchain Learning Platform.md  
> 2. Learning Styles as a Myth | Poorvu Center for Teaching and Learning \- Yale University, [https://poorvucenter.yale.edu/teaching/teaching-resource-library/learning-styles-as-a-myth](https://poorvucenter.yale.edu/teaching/teaching-resource-library/learning-styles-as-a-myth)  
> 3. The Learning Styles Myth is Thriving in Higher Education \- Frontiers, [https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.01908/full](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.01908/full)  
> 4. The learning styles myth (based on Pashler et al., 2008; Nancekivell et al., 2020), [https://mirjamglessmer.com/2021/06/25/the-learning-styles-myth-based-on-pashler-et-al-2008-nancekivell-et-al-2020/](https://mirjamglessmer.com/2021/06/25/the-learning-styles-myth-based-on-pashler-et-al-2008-nancekivell-et-al-2020/)  
> 5. (PDF) Learning Styles: Concepts and Evidence \- ResearchGate, [https://www.researchgate.net/publication/233600402\_Learning\_Styles\_Concepts\_and\_Evidence](https://www.researchgate.net/publication/233600402_Learning_Styles_Concepts_and_Evidence)  
> 6. Integrating Bayesian Knowledge Tracing and Human Plausible Reasoning in an Adaptive Augmented Reality System for Spatial Skill Development \- MDPI, [https://www.mdpi.com/2078-2489/16/6/429](https://www.mdpi.com/2078-2489/16/6/429)  
> 7. (PDF) Dual Coding Theory and Education \- ResearchGate, [https://www.researchgate.net/publication/225249172\_Dual\_Coding\_Theory\_and\_Education](https://www.researchgate.net/publication/225249172_Dual_Coding_Theory_and_Education)  
> 8. Bayesian Knowledge Tracing for Navigation through Marzano's Taxonomy. | International Journal of Interactive Multimedia and Artificial Intelligence \- UNIR, [https://revistas.unir.net/index.php/ijimai/article/view/695](https://revistas.unir.net/index.php/ijimai/article/view/695)  
> 9. Bayesian Knowledge Tracing for Navigation through Marzano's Taxonomy \- International Journal of Interactive Multimedia and Artificial Intelligence, [https://www.ijimai.org/index.php/ijimai/article/download/695/804/1193](https://www.ijimai.org/index.php/ijimai/article/download/695/804/1193)  
> 10. Multi-armed Bandit Algorithms for Adaptive Learning: A Survey \- ResearchGate, [https://www.researchgate.net/publication/352332265\_Multi-armed\_Bandit\_Algorithms\_for\_Adaptive\_Learning\_A\_Survey](https://www.researchgate.net/publication/352332265_Multi-armed_Bandit_Algorithms_for_Adaptive_Learning_A_Survey)  
> 11. Dynamic Pricing with Multi-Armed Bandits: Learning by Doing \- Medium, [https://medium.com/data-science/dynamic-pricing-with-multi-armed-bandit-learning-by-doing-3e4550ed02ac](https://medium.com/data-science/dynamic-pricing-with-multi-armed-bandit-learning-by-doing-3e4550ed02ac)  
> 12. Multi-Armed Bandit Problem and Its Applications in Intelligent Tutoring Systems., [https://warwick.ac.uk/fac/cross\_fac/complexity/study/emmcs/outcomes/studentprojects/minhquannguyen.pdf](https://warwick.ac.uk/fac/cross_fac/complexity/study/emmcs/outcomes/studentprojects/minhquannguyen.pdf)  
> 13. Time-dependant Bayesian knowledge tracing—Robots that model user skills over time \- PMC, [https://pmc.ncbi.nlm.nih.gov/articles/PMC10925631/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10925631/)  
> 14. Nyatet-Duwit-PWA/Perancangan\_Nyatet\_Duwit.md at main \- GitHub, [https://github.com/Amerta1090/Nyatet-Duwit-PWA/blob/main/Perancangan\_Nyatet\_Duwit.md](https://github.com/Amerta1090/Nyatet-Duwit-PWA/blob/main/Perancangan_Nyatet_Duwit.md)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAVCAYAAADID4fUAAABYklEQVR4Xu2U0XHCQAxEr4a0QA20kBZogRbSAh1QAp2kAzpIAykg8cNeZ73WAZnkD96MBiOfpZVOd609eQA2g70N9pIvgsX7/WBbd9zgdbIKAp+mZ4R8DXb4eX2Bb8+TzXy0cTHO98IQKViL4ec3xZB4Z/8/2yjKYyvfonAc10wiCK4qgWfeuxCSVP9JqA7iy+4s22JQhfYNISRMCOj+ngjBvJRbf0xHGxf7x6o6SRGs8+8o0JOy/i5oVXaHrlQiWJt+1pKYGJoPipL/JiwmqA8XaD6SSgQ+EjKkopyDHrSTAMlvRFR4Z9Ulvis7w4tK8V9E5Bx4kX7aZgiYZx9yAEVvYAVb4l3gtLmo3Pb5GFYi7j2iTjUHuifE6mpXaysRLO7NSuWHPGHADLiIVS7ui54IQKRPvERntdC9lNp4bQuPd4FqV3sUEJikGIkq2LocRkcnkBjVRfkv0MmeQKFinsx8Az9Uee+x4NUeAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAZCAYAAABdEVzWAAABi0lEQVR4Xu3V4U3DUAwEYGZgBWZgBVZgBVZgBTZgBEZgAzZgAxZgAMhX5SrXeq8pP5BAyklWE+fZPtuX9Opqx47/h9vFPhe7W+x9sZfTx0d47uwmrhd7XOxp/b05fXyEc4qxh/YM3hb7WK+dRVK+kEBI7Nd6fxbpUoAkEo8Cc+5+NROpXWtGXJ1SciLs/Gu53oRk7Ln5JAgk5/NbwZfJmYZ7Uw/qNcjZfVOEWA3oxHTIp3hFPXcJsYsmFUhY9ZKV1OmE/IgYA5oaNRTIe5HgOwTpsCeHLWLVT1fi6TFENPmjaVXQGOGz/saNCJzzuzdBMKlKMl+AXmMTAhRLYpgRmPkrquDlzNvpt2twE6anYLqcEYh/9t3runK2ykSd/qYf4WD9VEC0lo62iM0w0mr12c7s3+FwmAbq6iLe+LLe3gDfSCsmRat9kp2YxqfrdNiXPDD6UUGaQDaIXkZQfLQi8ZXY7K/tgKxNERMRXAkECEewzETqlCv6CoPUivb6pn4VlxRCqq95x44dfxbfHMuPchc7+IMAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAZCAYAAABdEVzWAAABj0lEQVR4Xu2VUVHFMBREowELaMACFrCABSzgAAlIwAEOcPAMIAByeN2yXRISZviAmZyZO23T5GazuWlLWSz+H1c1Xmtc13ip8Xh8vcN7+k5zX+O5xkO+2Lgo58mI23gHjD1t9/RF5F35FIEgxr5tz1MghrjZriRx5AbvCRzxVV+W84TuEvcIQzD9n+x+CC6RkKtgMCFITh+uDm1yjoVkHr8HcmZbF1wgIdYLnHA3WCF90kXatIAZYVNOCZKNBtCnJ0z1wsJcKHhetvpHBS9hSsLW4KIzEubt1BXiyCEhlMBo8V9Qcj9lbIFvQ0vAd+08qzRwykXSjtDWqT5A4nRI9aLkPQG9dscLnnw6nVyzBg+Q2OsCspB7AtSOKy2yrnIuPkt50neyM0iYBo2E9ci8ORfb2fs7fGxjbiUf0JM9k4Ck+UegrVUrOMX4dDKFZS0f0AfWLWVwHm1qwhegemnB+NYWMd6F9X5tOziBOESy0nQQEKqCVT//KDu5hUImqPaYp5fj15mZCFG5zYvF4s/yDjq9jyqSvrzAAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACYAAAAZCAYAAABdEVzWAAABeUlEQVR4Xu3VcVHFMAzH8WrAAhqwgAUsYAELOEACEnCAAxxg4AmAfWB5LwvtscH7A+72vcttS9v01yS9tbaz8/+4muww2fVkL5M9LoePGDd3ExeTvVbnjDGbsdsyhud2WmsukXftJIIga9/m7008tP7CyMbNbDKST33ZPtflLHknjGDzn9L7JpzW5lWY4HyeGb7InGz4vj8NL95BVPWtQrYsrsKckM/mGT7zsUbY5kxBYH3RE+Z7JCzmWpuFIgtR6s0N72SyhZ8Iy359JYaWCCFaYHO2LNZbTozfCkNkHzKVRfIT2rvVC5wkBz6HsExueKLidnrWHjziNK6+wGG50eOUIwHhF6dH7Stzcw9qn3rTP7BRBO9ZBPlO2IgsAlWYco7+Dl/olVIAvrggAV+vV2RK39ZMVmFKOSxnoP4yImBkJ5dBiTVxEP3Sw+a9ElmfhY1+bQt6Zc1BiIyGZQ4QN69SSxhYJ270HqGjGGdnzUZE1TLv7Oz8Wd4BaYWOwwGP/AsAAAAASUVORK5CYII=>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAZCAYAAAC2JufVAAABUElEQVR4Xu2VUZECMRBEowELaDgLWMACFrBwDpCAExzgAAMIgH0cDb3DJJsq6v7yqlJcQk/SmRlypQwG/89mGj9xsQPilmJX5a3rYjuNyzROz09GL7/lL45xLXVjfCcd+9d0DzB0m8bR1vi750YYOtucbGTG0K1tzv6Z7gWGcB9hHcMt0PhhcHiui32Yi6ib0TJFYIuYYWAvzx5Zyg6PuhkEEBipmXXQxGwx39mcNtBe0lG2qJvRMpXd0KGHuK20NT061yxV4CtToExoZHuBa1q6BzVBjyn1C2WhPLVMoKNUS7oXLVNLPZU1qsqpPXmTog5z0qXUDmc9/rIc+iS7jMpJFtRLLV0KjxgjwhqbiuxmZME1oMdYD2PtP4R0KeoLHjlf89t5MztZNrmM94oOd/MYjroP9LpihEPi4aAGdWheNieGWDTZQVGn8g4Gg0GLO2M9jKqoTJyIAAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIUAAAAaCAYAAACZ6p+qAAADGUlEQVR4Xu2ZDW0eMQyGD0MpDMMolMIojEIpjMEgFEIZjMEYjEABdPeofSXLci7Oz7X9enmkqPqSXM5xXju+bdsWi8VisVgsrsv3vb3s7ffevrmxj+TX3p595zvyY29P26tv7tzYl+ff3n76zu3VGb4x1+LHceIMECeCYM1eJHbfHsycRzfGMx7mEDCX4sjxHI4OO4oW+hgjqmdmGUXokW1ZaoJFfBz6vR94g/4/vvOzwoGQ4jgQ21qpOR6HlJxC1P31nROwETyK1vGiZU+8p8bNiAJls1GMtYKwqTFLzfFEWOlupz9KuSNoDzNF4a89bI6uzIibEAUbQhRROu+h5njEVpoz+65lTxLgTFHYjIAYvEiOmCIKDEDtWoz0qrSuu5J+RYT6MrB2zxVxRO3d7IM59s7l8FocmwGxIwiJHR/VbKuBAHR1qD7S7yxTRCGly5k2TSnqqAV8XwbrtBnIxiM0x9s87CiHDRT9rtlWgyBCvNjOX4miJcPpS2jI70pVbNBXvKoFLCqqMvj1RiAycVSpXrBgnzKUIrol2jL4gnWGKLQ/1sZerZnZs4VnWGNIGOAdx4JSqtC3dDYVIwoi96hlwC5dW5moYZ4yQ9bWFpR5bFNk92KvDkvPuhLTUC2nw7aQwqQ4oasjczDgo2mUKHNF2EjJCi+L0rOHTMt7ew+hlIHl85avJuYP71sbsugArACkWgzEWHtvRzB/2DiDslcN5tAy3/WtEIVR8cw+Rw6jlBFUcGb3wvunBGP0T7RyrFW+NS6bLZjvU+II3s4I2W6L5hpKudEzyjj4KRI6vxXR/LXj6i8dqgJMNvOs9Tm/lUUyvmT+cFEtJfqF6POFIgpUIdQCjkRE3pk9ZEXh91MDMbC3KAvYQ1Oz+DE7rkI3sqf2/x3RuMZKTBEF8HJ/F3rFCvpb7jdAeIgCMflNtpJ5hkOsRVQEz0WiGGXaQSV4z3d9GjKi6IWMdgas2yPSHi4rirMcHNUTMyjVE2fAHi4nCq4hNh1dbSO0XolZsHO2rSVUv9S+Cr8sZIuzMsYtUqoBF4vFYrE4m/9vcSMBxZ6n9QAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHcAAAAaCAYAAACNU8MOAAADeUlEQVR4Xu2YgW0UMRBFtwZaoAZaoAVaoAVaoANKoAQ6oAM6oIEUAPd0+dLnx+P1rTfRcfKTLF286/F4vmfszbYtFovFYrFYvOTp0j5k5x3y/tK+Pjd+z8Cap2z82WnTE5zAu+0arHsHH39f2pdL+75dY/fpnzdu49ul/dqu6z8MgzFCcxCVCRD5czwbgfFHxiX48D+AoC4E8UTso2CL8dPr//ncWiiLb4UdXNkchYAdmfutycQA+mZ9R+BZG68ibs/mKJS2H9l5Z3zcXq6TqkXMzvA9bd9MT4g9cauLDmMqm8A4AlOd6TzDBhXgnqG65PFDKT3rEshZTiwOgwiUEYyoycF0HHjXnffyqRsjf3Nm5O2RSwbP9LdKT87Drqe/ulDoPqDLFr74JjwjsCPoXFUSEJfpi5DBOojvYRDXhaARPN3+0lEW4Qd962yoMhcRXVzQRnAYmzYdF1Z4Fk1fRAZpBT7jM0srjsPsleW8MNCXpYLx3leJC/mJoF3vIHb2CcbnZgCE1Zyt569BVhxgbjL4LKo4DtETVyVXZc7PQi/jNM/wPXFZvDKtJW6rD1R+W2VXvhHc1vOzqe4Lle9HqeI4RE9cnZ/KSgUwMzdxcSU+SMwsyxkMxmYfaHwL+Zbl+rVoZS3gQ1a7GSpthuiJq++1FCNLK+Q7sqlzHMjYFEfick4p4ypxqRitfpC4Cf3yDT8kCrb8sncrrfMW8EFz6IKpDc5vVTje2UsS3q206aIJKWN5W5YjLpJQ4D1D8gIhwYD3tYj8uMd5Cc4ziSsRW5uIm7SXXWwzh44QbGocdnjXb/fMo8zSN2miNVbZyTji5v7hB/P48aTjy+fwf+tio1dpmL8Vg10kQK9Vi8MhnCQIOJjiMk6fBb7DWRRj6NdYnGeufI++tAu6nTNeTZuHfmxjFyQoGwLy00tzJ/K/CjzP8Zd5tB5+Z7yYT7ESvk7m7omX/9Z8UwhqVdZwqrrYqDqI1gJcpIQ504b3pz0yCCSmfCZ4yuLEj5PEP7t6MQDE983lGwBf0lenWv9DcMbiXCCvJIgioXOTQDW3SvIImkObPCsRQvNOaxP1Nt5DwMKr7B9FWQNekhGJcpkBF1lihUryCFQM3whksYMd+jJ7c1M8LLO710tmBougtkpqvucgWO+cdNJ+zlXNw4aoNtfDUQVhsVgsFot75i91oDgoG8GTSAAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAaCAYAAAC6nQw6AAAArUlEQVR4Xu2SbQ3CQBBETwMW0IAFLKAFCzhAQiXgAAc4wAACyr52h0wXGv7DvWTSZPb2666tdTq/zBDah8bQNXQKbTKGd0xfXNp8fsE29MgASciRdzCPRmgB3ZiILwl0c/CIOzr/EaYiiQkF6+FpTdiltwrBe/FY51Y8VvpaqK5wTjk0UyGK+t1N1LXk+Vp6EBpSpDaZCvjzgpIqrMp91ulfeGfx9q8ka37nP3kCjt0sn95FTCcAAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAAA6ElEQVR4Xu2TbRHCMAyGqwELaJgFLGABC1jAARKQgAMc4AADEwB5tmaXK2kvvcG/PXe5bWmbj3dpShu/ZBC7ZDtk31lst+wIchcbxW5iV/POswsyP8X2he+V5iRhaO1dOjO0ynoY9GkF60KDeSLbtkNwAJEJqIZOXe1ZVDdrJCgrCyfgIDNFVRqQ0bDgKxMsoJfHKc0HH+VCC4bT45i+K6PqJrVgBCGYjgbfJKgGZKNmt2OByNwG9aER77Tujc+EXmYO8ueoEo1qM9fUj0wKLRCcNry/hY8kVO2td0EHXHpbwCpWV7TxBz5IuzetjhWWUgAAAABJRU5ErkJggg==>

[image11]: <data:image/png;base64,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I2gREZG3AtG29Vjwp7B6x0mkwtpAtImIiLwdPBrdet9K5Apc8RUBERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERH5+vp/NOunCB1xGYQAAAAASUVORK5CYII=>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE0AAAAaCAYAAADygtH/AAABvklEQVR4Xu2X4VHDMAyFPQMrMAMrsAIrdAVWYANGYAQ2YAM26AIdAPKR6hDvpNj5EWiDvjtdGje25ZdnJWmtKIqiKHbCYYrnKV6nuJX/lniY4sad0/fRne8WFn1qs3D37vcIH+egj/1+/3HFDrlr80I9CEfbi7RH4Mync6xx6FXDllTRwFzTA7H+HW8tFmdz0djD1AUG8EWQdibG7rYNRhLJYA7GGg3m7JHllLUrrJHAsRypbSPzfiUI1AAvmk7M/yOJZFCcccaa6KE5Glm7YoYBjsc2C7eIL35c7M+Z1CfOoFEiQ3dmIzJxsnZFc89qZEjkIs7NhcAE/nHMdlZhfxt7VVBGRMME+sS0Nfl1p+jkkavYutwJzxrRSFDrVi96MLfmCSOiYRTdisOiWZH3A9BJxcBlauc1ovH2rTVrKXiH6mGL9HBzdD0RzKHXROOlHNv3xbjMniRWJCPBYI1oW4H7vTNMDK3PmitrO7jzyDyL0AHhGJQjitPZ2vzgHk3kL7DPKMSzvPUGmwlwu4c2+ypgLVynda4Ld8x36tWWSxANEMk+h/wHeA9zG/1U0M24FNGuBsSKakVRFEVR7JdPJ5+pTl6Oh0sAAAAASUVORK5CYII=>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE0AAAAaCAYAAADygtH/AAAB40lEQVR4Xu2XjU3EMAxGMwMrMAMrsAIr3AqswAaMwAhswAZscAvcAJCn6lN9IakdpIKu8pOso21+7C+OE0pJkiRJkoNwqvZa7b3affNti7tqz2Xpy+9M35uGwC9lEe7R/B2Btm9laX+u9lXt5arFAXkoS6AWhOMdYmyhdmSZ4Lkd73AQcC/ISPAS3GZWpN/N81H6QUaDt9uYehbtVz7LUhdQnGJo3zMAaaxVCQ04gDkYK2rM6THyafS+B/Noq7II+OlCB6AGWNHaifkedaQHq4pTM+bR+ihG73uwxZnrXIIHiD1iOUnss5QXrEDrSDQj9mIkzuj9FghGH3ZYiF4W8awsBMTRgEyg00m14D9goXtz/0Y00MESSoR28l5W6RIIXCLtdzLSqwWI29YtzzyYt/UTIqKx8Pa6AdR1+rl3NRV5hBM43NYUskwrwHeEE7T1btNP5WfN2jI7/ggFaVHm23h6KFFsVmk8fHU5l3VyMgaBGFTZYwVrYSLPwT0hW2xWInivPmM2Edg5VpzpGwIdEI5B+ZUQendam16Bs7QbCfoX6N8oxJPfrT9KgjaDEIhv6oeNYh2CCHaFvNqCoMpGr6btCSIRODbjB7EiEv34nek7jbawHHULZ7KentaSJEmS5Ph8A24LsPa7t+96AAAAAElFTkSuQmCC>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE0AAAAaCAYAAADygtH/AAABzklEQVR4Xu2XDU0EMRCFqwELaMACFrBwFrCAAyQgAQc4wMEZQAD0y/LCZOjPlIS97GW+ZHJHb3c6fX2dXUpJkiRJkivhVOO5xmuNW/fbiJsaj2W7j8+Vew8NC/8om3D35nsErn2p8VTj8zui9x6Wu7It1IJwjCHGCJxJWN7L73xXB4tuLVKuGfFWtmsQXshxduzq0MI9EdEQnONp+5hEw61DsCR9gRtohnZcCXQMZoWMYA5yRSOy272aeuMzziV4n1SlB1jR/MT8HkrYgQaLM1Zihq9R9MZHUB/34L4h1preqiSwheMUX0jUEf9FT5ze+AjWT4TX03IRf9uzTTKOrL5rR1pi7gU1tOZeFQ1zsI4l/OQtITi6ekT7R72/tgUu9n1rFjNYbGvuFdEwjMwgpm6TAPYsU7DvKSS2ybQzDyVWINf5njUK3tJn6GlnYXP8enpgAj0IlzmXn8lJQCImVTIvmKBoFudfEveEua0rEbzVnwlrhJMZ9xECQRCOpHwiBhNrjAl66N+YS6H5EU91+w2WCXC7YF1erCXRBDtmd6jXW/TOJSjAF7onzI1gxJ+O2h7QPHEhXNpphwE36tjS0yRgEoAe0Tq+SZIkyQH4AnX7rd+QDsxzAAAAAElFTkSuQmCC>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFMAAAAZCAYAAABNcRIKAAACEUlEQVR4Xu2XYVHFMBCEqwELaMACFrCABSzgAAlIwAEOcICBJwD6TWeHZSdJ0z6GX/fNZGjummbvckkey1IURVH8BQ9re0tjcY7XtX2t7SYdxXEuy5bMx3QUx6AqVZlVnVdCVXJmKplVnSchiSQTlMyPH3eT22Wr5Je1PYdPYOdCS//9si2W27GhI23+Hn9zkbGhg3nuwuf09DKGedREyzaFqhIQq4S2QAw+v/Xpv1tfZ69APH0J8x0gCDZt4IvLnO5nThUByO/JmtHLc77Ds+dlGhfEWdkKSshH8IKJn6yPnyoQJPFz+X0Ot+YY2UgQVURyBM/e1yIxl5jRqwLyPKA/d9QUHjhohV2AwD46AlRheys6SlzLNrPdeCe/sadX5G6i34p/iM6pbD0R2H2LJApoL/gMes/W+h6VKj3E0UvmSK9QESiBeTZPkVUp9DMpV2dP3H8lE11Uj2/Xa5IJ7EiOjdFF1kVnTA98WZ29H/Z5TnkfCMjHZNCtREAvmdo9jl+ezMeYGb1OS8MQLgI+rolyJRDhwfGsd1qHNd/zM5IF4B2/cHJRdIN6nwA1H2NdAxXoOuVzG+MVE8/4ZvQ6WohpXGRrsPta7zBeweuvg1hVDn4Smf9RESh2/DT6SjAtNaYGUKL8G7L5Lb+n12Es3yhO4gvti1AcRP89AUnNC7c4AIlUMnu/bIoD+AVbFEXhfANR6vjlmA5BbAAAAABJRU5ErkJggg==>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAA9klEQVR4Xu2UbQ0CMQyGqwELaMACFrCABSzgAAlIwAEOcICBEwB7GE1Kb+/ufpM9SXO3d/3Yumxmg4HgWOxW7FRsm+Z6bKzGXK3mYNyEiUexqdjeajH+17Cz6kv84ft9/ngESPyyGhS1NbsiKea74CsLUeScRav6EvjQhQjje9I+9ArlJJmWD+PmInuFOFyFJ1SFZq3vFWrpzlKhrMuESndUQqXLhEp3VEKly4RLZ8R1aCXsntElaTitubTEclEj/sLMwJkbHSGYJ8WJr0ektUjGzU4wkVvAhYtb93ZgES8eX4a8mBn0nLPqPowCOkBsbuNg8O+8AYMAUBuFKd7DAAAAAElFTkSuQmCC>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAxklEQVR4Xu2UWw3DMAxFg6EUhqEUSmEURmEUymAQBqEMymAMRmAANh+1llxnjhQpX1uOdJXGcXPzUJxSp1PgvKuGQXQV3UWXvR9ySpvBWzS7sRKj6CV6pO1/2uchw8DkiKRaIyZFugva0MhSa0T+5GL0VxfLaGVEvEiNkU4YGXHvIS2NfPzAfxvxhr5N2PyOgHxfSagOi4tlREY8RB40VcBC/s3F6GOWwRGwXd0yq+GbuKJjyKLmtjL4xTSF4+Mk/DF2Or/OB2kkQal01UuLAAAAAElFTkSuQmCC>

[image18]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIcAAAAZCAYAAAAbiz05AAADaUlEQVR4Xu2Yi5FTMQxFUwMtUAMt0AIt0AIt0AElUAId0AEdbAMUADm7OcPlorwkDwayg8+MZ2PZliVZ/rw9HBaLxWKxWCz+Hp83yvtjefWj62Lg9eEpTteWl0/DHiG2b6J+d2AwifDtWD6e6hR+P5zk6dDiZz4dnmJEydhR/3osH059vkQfICkcd9dgMEayCxocxcl1gsywsdhEvYGIJ20tMznenerPOjngWTjxjyAxprhNyeEp/axYybGfc3GZkoOrpGV3z1ZycFxOjgpjuFPR0VcPwfAe9uEG9LPOX+ocs7ZP5MOv7cRG56KNOvreHsuL6Ce0cV3yHqA/9cS58Kt9as7FZYoZupgTmCNjAumH9faDv9TpM/kGGatL9l/E5MAQFGvgw0k+GeEDKxeKYPj67nEmmdBGnfdMosw7nH7M1a98+qR+H9Wpz4ehCwI9H31yEZmrfULHrV8VU3Ik2K7uRBl2iX5gW/o8zTGtSc9xEyZHfq2YGGlkorFJHpu0d9Z2f/r0aeG87FrQtoYFz7H2y8VXpk3Y07rSZnbk1D4twiWuGTP5piyTQFn3bRn2d4y1fzdOnhmXmT2dHMhzR0KeDvz1U24aD/Tp5OhXPDom5wjEViKck1lnfCfvtMv0qeWX6HkntpJjkrFxkraL+bbWZBdTcsg5J5H3wiYkRP6vhNJH+qQDG+yfvxvbtFkfMjhTcoBJYPF0PDfXHqZ5m61EmGStr+3ld8fzt7mUHG0sIOssTfK08LhrPZMzmRBeAz0O7OdbRB9S3xTUPC16LhP5T9DzTmwlwiRrfR0b7N9ak11sJUc/PJk8F62PZo++PgKh70PGtzNeIy6y10zj1SD64FslZQbVZEi8k2nzCG6faJv82WJazGYrESZZ63MNZMv+XTCQgLog1FOZhrmIBInJWRjkueAY51ja8jE7PQbbOb9gOonQQ5JIJwzz6gNjmQuZr3xtNjkyeIzLhfeUsw96aL8mwMbOhHMcJb+2IONue/qB7JwfxElf7CsZA9D+XThBF8lPTgzP7MUoDKEg789IA29bXyHoJelyfPcR9NBO4XcmiwlsQdckw151ULf0TvO05C99Wexr6Bhmab+m9snmSZaJYRHXxL632H9XTEFbLB5ZybH4hbz/uXr6Pl4sFovFYrFY/Ad8B5TJuyBvCRJoAAAAAElFTkSuQmCC>

[image19]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJ8AAAAZCAYAAAAv8vwlAAAEN0lEQVR4Xu2ZC40UQRRFWwMW0IAFLGABC1jAARKQgAMc4AADCIA5mT1w8/K6p6p3yJKhTlLZ7ur6vG99ZrdtsVgsFovFYvE/8e5Svl/K16e/Py7l1dPz22h3xPvt2v/npXws3+DTdv1GYVzG70AW5mcs/jIWbUflOOL1dh1/b+5Z0OnbdtVpVr4321XHvfLlUj78bv2gEDQY73PUYUgCZMaotCNQ9oLPsQzAzrDKIrTHuTNJcATBzPg49h4gr0k1Kx+JgJ0MXp6zHCXyw4BDMEBlNvikMxhj6HDGZU6Mn7AadbLMrsBH5MqbMDbOPssZO4kJ20GCdvZ8GFCO7O04Y9TOWGbzETphT5ZZOWYgMf7F4AMT5iFxJejOQaxCs0Z9bvDVVUlm5ZiBeVfwvQAqV7c7YGusQYmRDSYOzZUMPvrTnvMkhee63QoXAWXpxlUOLx+W+t7VqQfPbGWc1YS51D/7J+rsJaB+z+DTNugzwlHwKVuex8UzIztF6gPqqh94pw2yV/szB7LS1m/U2V+9RDuo46ieLUz0ffvjeAsTVCPXldBDcZLBJzrkFkeyJJ6FOCMKRqCvYEje09heDuoq19UJOjOfKFPqoywZBMw94hiDz1suxUtI6pPwLcfGT/TJpFVX6vWjF7q60HgRS98qg3qaCAnyjfj1EITTCFlSSAVPMECtq46B0eADLxhVloQ2XT3vmTDVeRiXNjXQujrQJglj4qx0VNef9xGdnYPxsmBvnZs68a0GD+CLlEFdU07rqk4uItnWOnUw4RMCfETHIVglUJplXiHNeoVJaF/rUmCZCT5hbOQwK3P1AVbDnNtEsB2ZmisjzAafSXCLTufZ4OswyTLY0BunV/SFq5+6Js8JPvviE2xdt+9TVKeKK52CdkJ3dI4YCT7kuCVLJVcgnjNYeK5nx9ngm9G5brH3CD6oMnT2lfx27+ATt2MLvjlNl0VQt7bnrAIjwcf3W7JUvMi45XjO8exYGQk+jKkcnaM6quPgbwWf//XpyGA4E3wZSDX48IGrHc/uNHV3mYIBuhXH1cbJ67Iu1ejZR0aD70iWvf4a03MRQYdBqpwwEnyZBBq4bjG0yRtoJ/c9gq8uAOBxol4Gq0xngi/l9bhjXSenyX4ahamGchtLJQmCvFV5o/RZ5TiX8Gwd79btoXKUnHPP2OJ8QhB0q15eqviewUmdGYwjcgXAoeicP0PQn3d/kqC/PyVZR5+0QwV5tA39ec6CDMxTb9HgfNqE9mmj1NXxqMM22pg6sW3uPG6v6mqb9APfup+BhsHYGIzJeLakwROFog0Ke9bJ4LF0dXvQVlkc34zMA3eF7+kcZK6rEBgkFsYW+jtPZ0yM7HeeDVzlq+PWuprYUOXpio6v0DeDAz9k4HRjd3VCQJkE+j59xzOFeubSN5kAi8VisVgsFovFYrFYLBaLl+EX/0gck8XbqQQAAAAASUVORK5CYII=>

[image20]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFMAAAAaCAYAAADL5WCkAAACTElEQVR4Xu2YYVEEMQyFqwELaMACFrCABSzgAAlIwAEOcIABBMB+s/eGkEu7Ta8/boZ+Mzt3t7Rp+vqa7lLKYrFYLGbxbK7FIHfb9bFdL2UX8nW7Hk+f1wL5kN/Tdt26v/VA3/ey97cQizmjgXgo5+26IMhXORfu+3RdAzdlzxFB38z3HuiLiAiGSMyTe+K+/M4VQxGb773x/0DHaBUYnMBZSGLEOTVYbL+oEuAIRKQd7QW/bRlTLDSQ4MMQKApAYFyQRYswS1C2ZyRcdM8jt1mYa+TMKRAoEo1B7IpmINnPsscdjSHkLo93XARtWIwW08W0V1Q/LwVhcchIHVJeHu61njpYUBmFsflNex9LYqquIv7w/Jmgiq69ZkPSJJwVtJbPkZj2YLElhxyso9XO5sXvYUGBQq8t5YPPhDFwam/8S8X0JYw+to7iWH8Aa0z7uNSEyUQHD7AqPtHuwAfIoQhqD4Ia2jWengWPBNdWlzuZl6+9EpM8u6BhTUzqxlGiI5B0xpWg3eKxgtRoiSlzSDjrzrSYNK6J6V3DQH4rZEA8uTFLdGhQA/29iJqY9vm5JabvG6IEfUJM2p/mtNXJmIFYiNe9ug3YKdaFxPQvFJGb5Gq5UG9S1iiqofZet5DAIAiGMzVhEmYgH4RBEKZXTD2CEH9WnZUI5CghfWy9CtrdpldJ9eXTP8QDuaIDbfhM7ULbGKGYvBwYIfF7IJnethkQjxzJt5ZnDVytvjUUPyVkFoKr1mUnsXDoBGYLLCbA6TnrHxeLxWKx+If8AMAB0UwofUdOAAAAAElFTkSuQmCC>

[image21]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA3CAYAAACxQxY4AAADjklEQVR4Xu3d4Y3TMBgG4JuBFZiBFViBFViBFdiAERiBDdiADViAASCv7j7JstxcmubaJDyPZJX2eqnt++FXn53y9AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGfzbmrfp/Z3aj9fHj9M7XP7JgAAHuf31H5N7ePL8wS4Py8NAIAN/Jjal/7Fhb5O7VP/4tPz66m0AQCwgWxjJmCtkSpaKmq9XC+VNwBgp94/PS/Ya6s2e5azWRlbzmeNgsoRrQ1smYtU0bIdmr95K3NzlvkBgNPJ9lqqLgkACQLtwfMs8EeWYJKqUVWP2jNaRx7b2sAWmYeEtgpu2R4V1ABgp+qgeR9cspAnxCW45fFeEkCWttcqgTlMn3H0QSR3RtbvvnaNPbslsEWF9ApuaX3FDQDYgSzao0PmtYD31bYjqSpSr6qICXJHDii3BraSYFtz1V+vD7sAwANUMOvV66M7Ca+VRX+ra12jtvt6FVC2Olw/quLNSShKCB7N+zW2Cmwl1/vWvXbkQAsAp3Ep1FwKcmskqC0NNf2251x7bTszn9kHkKit0q0qh6P5W+LW+V0T2Pqt79aRq6kAcGoJDVmoe6PAlsU8ISnBK4/1hatz4SkVmpwZSzWr3j+nD2Vz7dJnlvR/FGgqsLVyrYyv7pStylL+fSnEJPzkWtlWXjK2Xt+Ha60JbHNz1n7VR91VCwDsQKpDbXBI8EgQSKuqWHvTQZ39iraCdSnURN537+3QSABptz3TxzxPEKmxtaGknYe2zwmcl9xyd+UjAlv9TwZ9wExf2nFmTKPqJADwAFmYK6BVy2KeCksFnjaM9aGmKlFzi3uFo3vLGNL/GlcCSfU3fUpYzXvSt77q1ga9uS3Pfty5Tl8JrNa7d2Crv2n6nM+ueclYR5W3dg4AgINIOGi/w6wqMhV28jg6pF6hZvSzvUhwqUpiAlyF1BrzqIJYN1NEX7Fa4tbAlv6OgtYW8ret72cDAA5kLtSkGpOfjapVS7YWHy39rfCT/la4rMpcjTvP66xXjbPfNl7q1sD2llXLCqnXVPAAgB2Yu8NwrnqWYPOW4WIL7dj6vvbjTpCpilr/3jNZUzUEAA5kLsAdXbZ4zxzUAID/xFkD21nHBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB78w+S6dsVSiyc4QAAAABJRU5ErkJggg==>

[image22]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA3CAYAAACxQxY4AAAEj0lEQVR4Xu3djW3jNhgGYM/QFTrDrdAVukJX6Ard4EboCN2gG3SDW+AGaPMi9wEsQVqKnFih/TyAkFj+kSgK4OuPsn25AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPKhfX5Yv/crF/HJ5bQcAPKWfXpY/X5a/fyy//f/uZSWg/HN5bdP3H7efUfozfTyS9T/3K+/o28vyb/P36+W1z2bnYPowwQ0Ank4GyN+b2xk4Vx8UM7AnBJS/Lq+h7dnkOKQ/Z3KM/uhX3knCWbZdYTLnXPoo+3stROYxswAKAA9pVMnIgJmK28r6EJLb14LLZ5bQdTRsps2jPs7xqDDXH6t7SHvyRmFk69xL0Fu1LwHgkLYKVTIYthW31aQ601dgUmFbdZBP5enovud5/bFonRXYavpzZBQwW1tVQwB4KO2UVE2BJqitfmF3VW4S3Oq6tVR0rk2zfWZHA1uetxXGzgxsR9pUcl3iqv0JAG+SYFPVinZZWcJnwllNm9Wy8gcOjga2BLGtatXZgS19lernW/sn+7z6GwsA2CUDZS9B554fOEhFL4PvnuXa1F7J/o+mc1e+UP1oYEsVaqsvzwps6Ytst3+zMJsm7e2pHgLAQxgFmwpHq6qqYS9hYCu8fKRbwuItgW3LWYGtZFozVcA2tLVGfRk5JlsfTgCA5c0CRF3Xdqu9lZL3Ngsp7xHY8hpvnYbLsUywuGXbjxTYqqLaqza27cw5OnpTEQIbAE9hFjy+Xeb37ZWBdu9rvPeU6CgMpIqTILDn+dccfY3s01mBbWu79w5smYYfba/amPNvD1OiADyFUQWsDwZt0Mj/Ve3IFNYsCGR9Hrf3p5D6UHZt2ROWRoN41lU1pgb6moqrx9c1VaNPHmZdnpcwMWv3NXndI88rfb/staeyd+/AlmsJR9vLOdPvy7U+n1XqAOBhZBDsB8eEkvbnm+ongPK4+qRhQl4FmoSX2YA5+0LUj5aQmDa0IaX/gta0K/vdfhFt+zUgs2D0lqph76zAVuF0JPfV61Ylbk/AvlVNe7ZBrD/3IpW49Mts2jP7PAtzAPAQEjwy4GVAzJL/+09RZhCdBZvIoDsKMBUGz5BAWaGt2jcKLLkvgSCyvxVI89zZvue+0fGZLa2zAlv2d3YdWwWndpk99j0lgNUvN2R7WbLttrKZ/a7wPDrH4ugvPwDAMhJk9gSIDJg1DdqHmQo8vYSmCnazwfYj7A2KFX6qmtNODScEpL2jY1NtGk2Zbrk1sFXAOSJtrUC6mvTNqIqW9Xv6GgCWtnfw74NNpkFLex1bW8nJ3zy2rmO7l2xrFiJbW1XDul6tble1rALCbIrumlsDW4yCyx7pj7bfVpHzrq4z7KX/2qANAA+pqmZb2mpS/m9DQ3+9Uxtk+vvuIcFrz3avtaOm4lptu46GprMl9Ky476P+rGsrAYADjlSePru6Tu0RJNCuGNpa2f8Vq4UAwAfqq20AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwHr+A9KPHNAoEJ0QAAAAAElFTkSuQmCC>

[image23]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaCAYAAACtv5zzAAAA60lEQVR4Xu2TbQ0CMQyGpwELaDgLWMACFrBwDpCABBzgAAcYQAD04fYmzdblkt0PErInadJ1t35fSoPB4H+4muxN3iYPk0O270zu+qgXnLxMprQEQPdg466bk8nN5JwWZ+gebNxt5pnqbFWVWraJqD1kXtq6idrDgGd3JiAzQ7CrMnTdNSEAbZIDtomzYNMIiF3f8OaS75kl5xBWlFbgBKfSfUaahwZ+zGfeAoEIHsIjtQdHrVL9EuDQV4iuair0H6zhZ0Qw2gLMQMGq5LT/DGwtiByCbw/tIkC5JF8YnKRZYkCZDMGq7Ae/5wMf5j7IgDdywgAAAABJRU5ErkJggg==>

[image24]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABFCAYAAAD3qbryAAAE9UlEQVR4Xu3d4XHrVBAGUNdAC9RAC7RAC7RAC3RACZRAB3RABzRAAZBvkh2WnWtbUWIHW+fMaCJLtqLn/Hjf7N57dToBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM/tx5ft55ft23kCAICv9c3L9tvL9uvpNbD9fXoNbwAA/A/8dXoNaN+1YwlrOVb7AAB8oQSzVNa679+Ox+/9BAAA9/XT6TWYpSU65fgfL9sP8wQAAPeT8WoJZSuryhsAAHeW8WmrlmdNPEhrtGSMW7VKaxZpD3X1GQCAsxIYsvWQ8VkSUG55/a80Jxzk35cZowlyaYdWu/SX078t1NI/K7ABwMHkP/8Ehi1bWVWKPlt+R+7t2SSQJqjNsWw51tdky4zSBLdS+/lcwloCHQBwEGnVVcUmW1W3aksbrs4Vge328n3XJIRU1mo/f69qlZqkAAAHkxDw5zz4pqpwRWC7vT5BIW3Tku8kf6d+DAA4iD6ofUpI6AFBYLu93jKdj6/K63kMAHhy1RLtIaG3QDO+qk8AmIEt53q4yviqj4atowc2AID/SDiaa4TNUNbNc/lsKnAZU9XHvmW81V4CGwDAm1rvqx5Gni0B7NKSGj2wVSjLz4ytmlW6vaFrS2DrAXHL1pfUAAB4GAkysx06w9pcgqIHtgpVWXaiL0MRue6sxm21JbABABzCXLIjZmCbrc0ZwmptsB7sPrpemMAGAPBmFdi61SKvM7ClNTmvkZBX64XtsSWwaYkCAIeQUDUnHERCWi2aO83Als/39yUY9YpbzRrN6v11LOPdqoU6rxdbAhsAwFNL5awqY5nhWUt31JZAVeemGbCqSldhLAEu4azk/blOrln6BIV5vRDYAIDDq5B1bZvj2WIGrLwvIS0hLOdSmZtt1HPPxowe7orA9nEVvgGAA1oFtmvPtewVuLRIaz/hLkEvx/p4N4Ftv4wf7G3uCtIAwIH0//wTsnoYO+fcszGr8jZbrwLbfr3dHPku8zcCAA6kAttsn241Z2vO13H0wLa3lZnq2pRQvGo7AwBPLBWchKm9oeKSVOxy7fodR7X3u13N+E2YPvJ3CQA8sYSctGrzM6En4+3K3vXlttoT2DKOMPdby6zUdq1dDQDwkObachXaqlJ160H8ewJbxgJm8ka2aiknZK5azgAADy2Bp68ZV6piVUHolvYEtnPj1N4zvhAA4CEkrPV14kqOJ/wkGH1WS3RO3Li2XTJn2pZrnwMAeCipbCXgrMZ91fIYq3OfbU+FbfWZuSYbAMDDq8C2slrPLIEoxxPi+uO30jZNUFpV6rZYha9L8vtXn8m91VIfuZfcUz0nNvebc3Xvgh0A8DBq8H5J+zNhJiGnAlv2Mysz78uxen9CU9+fAW+rVfi6JPecsNhbtfndfaxdJh/k3vokhLynXlv6AwB4KAkyqU7VM1Ijlai8rvBWeps0gajv3yuw5Z4SuDK+Lvede06gnOY4t3NPoAAAeCq97dlnaiaspeW4p3L1nqU4Esy2LDOSa/YAmdcV6nKfOZeguAp6AAAPq4eeGYiq8vbeatl7zRbuObPi16uBqa6l2paf95hUAQBwNz3cZL+PIcvr91TK9jq3/tqUe+v3O5cmma8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4Cv8A/dOUl3l8OaqAAAAAElFTkSuQmCC>

[image25]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMUAAAAaCAYAAAAHUJgKAAAE9klEQVR4Xu2ZC3EkNxRFG0MoBMNSCIVQWAqhEAaBEAhhEAZhsAQWQOJT9infunnyjMc93p9OlWp61Grp/aWeOY7NZrPZbDabzWaz+X75+aH9/tR+eer77fn2VTAHz/LZ/HQ8zsf8XL+EckzzfE18OB71vaTP5hvkj4f27/EYiFx/emgfn/quhWcZ7zwJwfP5of11PN5n/gmC6+/jUQbm4BmuaWfA+i3brfx5POtrEXkNPrtqyLr5QhjMJEGic14DwT8lBcFNsMNL8zKGsUKS/HOsx78W10bOpOW9FuYhwW9JCsjEEndU7MD9zRcAhxiwyWt3CpmSgr5LgWNy9rNwVnBMRzsT+Vaw3SXdVuTuOrHyzebOYHiqcUPFWjnrJabAviYpPMJNR6Vfu+NEDMxb2UnxHaJT+vgEHdxCtV29XN6aFAZIHp+kq/uZsN4qKAVdV/LfKylWR1FBpnvaZcIfFuDUtVGGc6hK5wuV1VLeo1IoR7c+dwMV26OML88dxOlIDKjj0WPlYOEsnTJ4rs4ExBm+Z2BHfzXTliQ3zTEmu8dBmo7NoOSalgGujtrCBEJOQS9kZG1k0Z6ropHk+qxLY270ok1zoEeu3zsdc6g7MqmPO38GdSelfeiUcUdcIo/4g8hpaHxQcOmXSq5PXXyBL4wayJa7B4YgKNJRncTA9w7+qW9FBq+tEw/H0p+O4nsevUjgPhY6Xwa+fRPtj1VSdABfu3tMSUljXVpX49X7D2OziHWwi+t0X49D9ow79Os47O9vggVUFmEMPDM5BUTZVML/Aa6FIJkq/gqcTZLqfD6V1SqeGJzJyvDd9xLMm47tNcAkFq4zSajeGbzgXNckBUnV9yb7ExyZjPb1uIlV8AJxkbsU+GtVwzz5Y4TzTkWh/TCtPyUFYzJJ7/Keh9K5S1h1U+iszFwrCOPy2QkU4Jk2QtOBIzpA4/BpQHVLWodVX4M9ei7BKf18Vk2uDWLk5nqyjwFwTVKo76WKyP2W7YykAO/po9VY5+nvLfvkh2nOTgroImUxPxWclhO7VacxM9O5Z0WaFJ7o7XdiNY9B1klxiZXhu6/h/moMek/3SBbk1C6+45AYk9N06CopsJfPWRS62jbvkRTOvxr7HkkBFB8SlHt9lD6F3hon4bKKpwCTcrfS53XBMKzjtjwdnyYm2aa+hvtTdQfuTUFOP/KRHGAgrxymjVdJkcHAepNPIP32Hkmh7thnGtu2OzspuN/H8LbjKfSZ13O8C01/WFEVUYrKODn9FjRKGwt52qjIli91HtG8zkTieupbwVqM6yQ1OFdwr+04nXc9bvV4d2htm3ZAXuZTbmzOeL4zn/ZofeljHq5XfuKeQa7fbejMup+O/wcjvk/5TQBBhtzleD79wJp5gmAN+pUzf3TRjpNfLu2gN+GLNcGg8AijMTwSTEwBeyushcGYj8a6GI7ryaEGL58+C1n1bFPfCuZjXRyhfgbsS7bgfjp5NVa5W460O+u1ziYT9xhnoPR8K321T9Pjuk2yCHJkyyLQMiBn92Xiqz/NGGA+xwKf2NX7jO1kPQ0zOBcws5s0rg45Q7CcgwrU1XJi+hXmrXw8noOAuZEBeSZbJC3HKpAu0fMk99D3reC3M/wvOR82TH3t55P+Sz55N8hOhXE32Wx+aDzaUFHvun1tNt8SbF15ftxsNpvNZrPZbDabzeaH5T/dhUyBaPLCrQAAAABJRU5ErkJggg==>

[image26]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAAAaCAYAAAAEy1RnAAABzElEQVR4Xu2WbW3DMBCGjWEUiqEURmEUSqEUymAQBmEMxmAMRmAAVj+KXun69hx1+egPy49kpamd+75LShkMBoPncqnrva6zb/TIS12fdZ3qeqvrq67DzYkOwcmYXYLwEe6746dMTka4JxDdQh87lHnXfZ317ne5z/5qVD5EVPyVaXIC/8e9vZAOShz9XH/LDv2Mw0QSJREpJvLsv95u70LmHIFw21ZDNhHqCrnnf3qMADyDTA9B39xpBFJCDs6qxDbvpwQy6oEHKmwXp7PXgZzeXGEDHM7mBlN7cxtUwo6c9oDo9UH2uepZypDfS6uCisrmhmaL4IwmfBywsiWb/ncg1EsYQep1hhjC+BxU+REIneeqKQ9ZVlQx2Z5Aj7cZ56NsHDuW6RxX4DkWPNz/PCyFOBNfEdFxnJOiKJhgxOjKgIiGojsVUdawgZVlXvr5LhfIVbax5SGnBQJdCUiR8MESM5HdR7xVIgoc8llzbRK/zrBFzxLcLOirwXBFGsNiANTf7LvRZCObzpANsBY+fyRTySAAWfJWQYnKSM865YXD7gQB4LnWkGkFIyOWNkgXstExV2mL8XL3e88wqF9b/MfpVuAA3XP7g8GgM67k4X0DJnGALgAAAABJRU5ErkJggg==>