import logging
from sqlalchemy.orm import Session
from app.models import (
    User,
    Classroom,
    GroundedDocument,
    GroundedTask,
    BlockchainCredential,
    LearningSchedule,
    ParentTeacherNote,
)
from app.services.blockchain_service import generate_block_hash, generate_transaction_id

logger = logging.getLogger(__name__)

def seed_initial_data(db: Session):
    # Check if data already exists
    if db.query(User).first():
        return

    logger.info("Seeding initial EduAdapt database records...")

    # 1. Users
    users = [
        User(
            id="user_ayu_01",
            name="Ayu Lestari",
            email="ayu@student.eduadapt.id",
            role="SISWA",
            avatar="AL",
            grade=10,
            learning_style="VISUAL",
            modality_scores={"visual": 82, "audio": 45, "practice": 55},
            processing_speed="MODERATE",
            xp_total=450,
            streak_days=14,
            hearts=5,
            current_dda_level="MEDIUM",
        ),
        User(
            id="user_budi_02",
            name="Budi Pratama",
            email="budi@student.eduadapt.id",
            role="SISWA",
            avatar="BP",
            grade=10,
            learning_style="KINESTETIK",
            modality_scores={"visual": 40, "audio": 35, "practice": 90},
            processing_speed="FAST",
            xp_total=720,
            streak_days=21,
            hearts=4,
            current_dda_level="CHALLENGING",
        ),
        User(
            id="user_citra_03",
            name="Citra Dewi",
            email="citra@student.eduadapt.id",
            role="SISWA",
            avatar="CD",
            grade=10,
            learning_style="AUDITORI",
            modality_scores={"visual": 48, "audio": 88, "practice": 42},
            processing_speed="MODERATE",
            xp_total=310,
            streak_days=7,
            hearts=3,
            current_dda_level="BASIC",
        ),
        User(
            id="user_teacher_01",
            name="I Made Sukadana, S.Pd., M.Ed.",
            email="sukadana@guru.eduadapt.id",
            role="GURU",
            avatar="MS",
            subject_specialization="Biologi & Sains K-12",
        ),
        User(
            id="user_parent_01",
            name="Ibu Ni Wayan Sari",
            email="wayan.sari@parent.id",
            role="ORTU",
            avatar="WS",
            children_ids=["user_ayu_01"],
        ),
    ]
    db.add_all(users)

    # 2. Classroom
    classroom = Classroom(
        id="cls_bio_10a",
        name="Biologi & Sains Kelas 10-A",
        grade=10,
        subject="Biologi",
        join_code="UDU802",
        teacher_id="user_teacher_01",
        teacher_name="I Made Sukadana, S.Pd.",
        student_ids=["user_ayu_01", "user_budi_02", "user_citra_03"],
        documents_count=4,
        tasks_count=6,
    )
    db.add(classroom)

    # 3. Documents
    doc = GroundedDocument(
        id="doc_bio_bab3",
        classroom_id="cls_bio_10a",
        title="Modul Ajar Bab 3: Fisiologi Sistem Pencernaan & Enzim",
        raw_text="Saluran pencernaan manusia terdiri dari rongga mulut, esofagus, lambung, duodenum, jejunum, ileum, dan usus besar. Enzim ptialin bekerja di mulut pada pH netral. Di lambung, HCl mengaktifkan pepsinogen menjadi pepsin untuk mencerna protein. Di usus halus (duodenum), enzim tripsin dan lipase pankreas menguraikan polipeptida dan lemak.",
        chunks_count=4,
        vector_id="vec_bio_bab3_qdrant_772",
        status="READY",
        summary="Modul lengkap fisiologi organ pencernaan dan aktivitas biokimiawi enzimatis tubuh.",
    )
    db.add(doc)

    # 4. Tasks
    task_quiz = GroundedTask(
        id="task_quiz_bab3",
        classroom_id="cls_bio_10a",
        classroom_name="Biologi & Sains Kelas 10-A",
        type="quiz",
        title="Kuis Adaptif DDA Bab 3: Sistem Pencernaan",
        chapter="Bab 3",
        source_reference="BAB 3 Hal. 15-45 Modul Guru",
        difficulty_level="MEDIUM",
        is_published=True,
        content_json={
            "overview": "Uji kompetensi adaptif berbasis akurasi dan kecepatan berpikir.",
            "questions": [
                {
                    "id": "q1",
                    "questionText": "Enzim apakah yang disekresikan oleh kelenjar saliva untuk memecah amilum menjadi maltosa?",
                    "options": ["Ptialin (Amilase Saliva)", "Pepsin", "Lipase", "Tripsin"],
                    "correctIndex": 0,
                    "difficulty": "BASIC",
                    "sourceReference": "Modul Hal 12",
                    "explanation": {
                        "analogi": "Gunting pertama pemotong rantai pati di mulut.",
                        "visual": "Bagan Mulut ➔ Ptialin ➔ Maltosa.",
                        "langkah": "1. Makanan masuk ➔ 2. Saliva membasahi ➔ 3. Ptialin mencerna amilum."
                    }
                },
                {
                    "id": "q2",
                    "questionText": "Asam klorida (HCl) di dalam lambung berfungsi penting untuk...",
                    "options": ["Mengaktifkan pepsinogen menjadi pepsin aktif", "Memecah glikogen", "Menyerap lemak", "Mengendapkan kasein"],
                    "correctIndex": 0,
                    "difficulty": "MEDIUM",
                    "sourceReference": "Modul Hal 24",
                    "explanation": {
                        "analogi": "Aktivator pekerja pemecah protein.",
                        "visual": "Lambung ➔ HCl ➔ Pepsin aktif.",
                        "langkah": "1. Makanan tiba ➔ 2. HCl disekresi ➔ 3. Protein diurai."
                    }
                }
            ]
        }
    )
    db.add(task_quiz)

    # 5. Blockchain Credential
    genesis_prev = "0000000000000000000000000000000000000000000000000000000000000000"
    issued_at = "2026-08-15T10:30:00.000Z"
    block_hash = generate_block_hash(1, genesis_prev, "user_ayu_01", "KOG-2026-X7A9", 94.5, issued_at)
    tx_id = generate_transaction_id(block_hash, "KOG-2026-X7A9")

    credential = BlockchainCredential(
        id="cred_01",
        certificate_id="KOG-2026-X7A9",
        student_id="user_ayu_01",
        student_name="Ayu Lestari",
        classroom_id="cls_bio_10a",
        classroom_name="Biologi & Sains Kelas 10-A",
        competency_title="Penguasaan Fisiologi Sistem Organ K-12",
        score=94.5,
        block_index=1,
        previous_hash=genesis_prev,
        block_hash=block_hash,
        transaction_id=tx_id,
        issued_at=issued_at,
        qr_verification_url=f"http://localhost:5173/verify?cert=KOG-2026-X7A9&hash={block_hash}",
        is_verified=True,
    )
    db.add(credential)

    # 6. Schedules
    schedules = [
        LearningSchedule(
            id="sch_01",
            student_id="user_ayu_01",
            day="Senin",
            time="16:00 - 16:30",
            duration="30 mnt",
            title="Bab 3: Organ & Enzim Pencernaan",
            format="Visual",
            completed=True,
        ),
        LearningSchedule(
            id="sch_02",
            student_id="user_ayu_01",
            day="Jumat",
            time="15:30 - 16:00",
            duration="30 mnt",
            title="Kuis DDA: Evaluasi Bagan Bab 3",
            format="Kuis",
            completed=False,
        ),
    ]
    db.add_all(schedules)

    db.commit()
    logger.info("Initial EduAdapt database seed completed successfully.")
