import {
  User,
  Classroom,
  GroundedDocument,
  GroundedTask,
  BlockchainCredential,
  AssignmentSubmission,
  ParentTeacherNote,
  OfflinePackage,
  ClassAnnouncement,
} from "@/types";

export const MOCK_USERS: User[] = [];
export const MOCK_CLASSROOMS: Classroom[] = [];
export const MOCK_GROUNDED_DOCUMENTS: GroundedDocument[] = [];
export const MOCK_TASKS: GroundedTask[] = [];
export const MOCK_CREDENTIALS: BlockchainCredential[] = [];
export const MOCK_SUBMISSIONS: AssignmentSubmission[] = [];
export const MOCK_NOTES: ParentTeacherNote[] = [];
export const MOCK_OFFLINE_PACKAGES: OfflinePackage[] = [];

export const MOCK_CLASS_ANNOUNCEMENTS: ClassAnnouncement[] = [
  {
    id: "ann-1",
    classroomId: "class-bio-10",
    authorId: "guru-1",
    authorName: "Bu Sari Dewi",
    content: "Selamat datang di kelas Biologi semester ganjil! Pastikan kalian sudah membaca silabus yang telah dibagikan.",
    createdAt: "2026-08-25T08:00:00Z",
    type: "announcement",
  },
  {
    id: "ann-2",
    classroomId: "class-bio-10",
    authorId: "guru-1",
    authorName: "Bu Sari Dewi",
    content: "Materi baru telah diupload: Sistem Pencernaan Manusia. Silakan dipelajari sebelum pertemuan berikutnya.",
    createdAt: "2026-08-27T10:30:00Z",
    type: "material_posted",
    referenceId: "doc-1",
    referenceTitle: "Sistem Pencernaan Manusia",
  },
  {
    id: "ann-3",
    classroomId: "class-bio-10",
    authorId: "guru-1",
    authorName: "Bu Sari Dewi",
    content: "Quiz BAB 2 telah dipublish. Deadline pengerjaan: Jumat, 5 September 2026.",
    createdAt: "2026-08-30T14:00:00Z",
    type: "task_posted",
    referenceId: "task-quiz-1",
    referenceTitle: "Quiz BAB 2 - Enzim & Metabolisme",
  },
];
