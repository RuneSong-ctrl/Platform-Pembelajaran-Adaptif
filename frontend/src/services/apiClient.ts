/**
 * EduAdapt API Client
 * Penghubung Frontend React ke Backend FastAPI (Python 3 & MySQL/SQLite)
 */

import {
  User,
  Classroom,
  GroundedDocument,
  GroundedTask,
  BlockchainCredential,
  AssignmentSubmission,
  ParentTeacherNote,
  LearningScheduleItem,
} from "@/types";

export const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:8000/api/v1";

// --- NORMALIZERS (Snake_case Backend to CamelCase Frontend) ---
export function normalizeUser(u: any): User {
  if (!u) return {} as User;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar || u.role?.slice(0, 2) || "ED",
    grade: u.grade ?? 10,
    learningStyle: u.learning_style || u.learningStyle || "VISUAL",
    modalityScores: u.modality_scores || u.modalityScores || { visual: 0, audio: 0, practice: 0 },
    learningProgress: u.learning_progress || u.learningProgress || {
      visual: 0,
      audio: 0,
      practice: 0,
      visualCompleted: 0,
      visualTotal: 0,
      audioMinutes: 0,
      audioCompleted: 0,
      practiceCompleted: 0,
      practiceTotal: 0,
    },
    processingSpeed: u.processing_speed || u.processingSpeed || "MODERATE",
    xpTotal: u.xp_total ?? u.xpTotal ?? 0,
    streakDays: u.streak_days ?? u.streakDays ?? 1,
    hearts: u.hearts ?? 5,
    currentDDALevel: u.current_dda_level || u.currentDDALevel || "BASIC",
    childrenIds: u.children_ids || u.childrenIds || [],
    subjectSpecialization: u.subject_specialization || u.subjectSpecialization,
  };
}

export function normalizeClassroom(c: any): Classroom {
  if (!c) return {} as Classroom;
  return {
    id: c.id,
    name: c.name,
    grade: c.grade ?? 10,
    subject: c.subject || "Sains",
    joinCode: c.join_code || c.joinCode || "UDU000",
    teacherId: c.teacher_id || c.teacherId || "",
    teacherName: c.teacher_name || c.teacherName || "Guru Pengajar",
    studentIds: c.student_ids || c.studentIds || [],
    documentsCount: c.documents_count ?? c.documentsCount ?? 0,
    tasksCount: c.tasks_count ?? c.tasksCount ?? 0,
    createdAt: c.created_at || c.createdAt || new Date().toISOString(),
  };
}

export function normalizeDocument(d: any): GroundedDocument {
  if (!d) return {} as GroundedDocument;
  return {
    id: d.id,
    classroomId: d.classroom_id || d.classroomId || "",
    title: d.title || "Dokumen Modul",
    fileUrl: d.file_url || d.fileUrl || "#",
    rawText: d.raw_text || d.rawText || "",
    chunksCount: d.chunks_count ?? d.chunksCount ?? 1,
    vectorId: d.vector_id || d.vectorId || "",
    status: d.status || "READY",
    uploadedAt: d.uploaded_at || d.uploadedAt || new Date().toISOString(),
    summary: d.summary || "",
    podcastScript: d.podcast_script || d.podcastScript || "",
    podcastAudioUrl: d.podcast_audio_url || d.podcastAudioUrl || "",
    mindmapCode: d.mindmap_code || d.mindmapCode || "",
    visualImageUrl: d.visual_image_url || d.visualImageUrl || "",
    visualNodesJson: d.visual_nodes_json || d.visualNodesJson || "",
    flashcardsJson: d.flashcards_json || d.flashcardsJson || "",
    karaokeJson: d.karaoke_json || d.karaokeJson || "",
    gameConfigJson: d.game_config_json || d.gameConfigJson || "",
    fillBlankJson: d.fill_blank_json || d.fillBlankJson || "",
  };
}

export function normalizeTask(t: any): GroundedTask {
  if (!t) return {} as GroundedTask;
  return {
    id: t.id,
    classroomId: t.classroom_id || t.classroomId || "",
    classroomName: t.classroom_name || t.classroomName || "",
    type: t.type || "quiz",
    title: t.title || "Tugas Adaptif",
    chapter: t.chapter || "",
    sourceReference: t.source_reference || t.sourceReference || "",
    difficultyLevel: t.difficulty_level || t.difficultyLevel || "MEDIUM",
    isPublished: t.is_published ?? t.isPublished ?? true,
    dueDate: t.due_date || t.dueDate,
    contentJson: t.content_json || t.contentJson || {},
    createdAt: t.created_at || t.createdAt || new Date().toISOString(),
  };
}

export function normalizeCredential(c: any): BlockchainCredential {
  if (!c) return {} as BlockchainCredential;
  return {
    id: c.id,
    certificateId: c.certificate_id || c.certificateId || "",
    studentId: c.student_id || c.studentId || "",
    studentName: c.student_name || c.studentName || "Siswa",
    classroomId: c.classroom_id || c.classroomId || "",
    className: c.classroom_name || c.className || "Kelas Sains",
    competencyTitle: c.competency_title || c.competencyTitle || "Kompetensi Pembelajaran",
    score: c.score ?? 100,
    blockIndex: c.block_index ?? c.blockIndex ?? 1,
    previousHash: c.previous_hash || c.previousHash || "0000000000000000000000000000000000000000000000000000000000000000",
    blockHash: c.block_hash || c.blockHash || "",
    transactionId: c.transaction_id || c.transactionId || "",
    verifiedBy: c.verified_by || c.verifiedBy || "Universitas Udayana & Riset Fundamental HPF",
    issuedAt: c.issued_at || c.issuedAt || new Date().toISOString(),
  };
}

export function normalizeSchedule(s: any): LearningScheduleItem {
  if (!s) return {} as LearningScheduleItem;
  return {
    id: s.id,
    studentId: s.student_id || s.studentId || "",
    day: s.day || "Senin",
    time: s.time || "16:00 - 16:30",
    duration: s.duration || "30 mnt",
    title: s.title || "Materi Belajar",
    format: s.format || "Visual",
    completed: s.completed ?? false,
  };
}

export function normalizeSubmission(sub: any): AssignmentSubmission {
  if (!sub) return {} as AssignmentSubmission;
  return {
    id: sub.id,
    taskId: sub.task_id || sub.taskId || "",
    taskTitle: sub.task_title || sub.taskTitle || "Tugas",
    studentId: sub.student_id || sub.studentId || "",
    studentName: sub.student_name || sub.studentName || "Siswa",
    submittedAt: sub.submitted_at || sub.submittedAt || new Date().toISOString(),
    content: sub.content || "",
    attachmentName: sub.attachment_name || sub.attachmentName || "Tugas.pdf",
    grade: sub.grade,
    feedback: sub.feedback,
    status: sub.status || "Submitted",
  };
}

export function normalizeNote(n: any): ParentTeacherNote {
  if (!n) return {} as ParentTeacherNote;
  return {
    id: n.id,
    senderId: n.sender_id || n.senderId || "",
    senderName: n.sender_name || n.senderName || "Pengirim",
    receiverId: n.receiver_id || n.receiverId || "",
    receiverName: n.receiver_name || n.receiverName || "Penerima",
    studentId: n.student_id || n.studentId || "",
    studentName: n.student_name || n.studentName || "Siswa",
    message: n.message || "",
    sentAt: n.created_at || n.sentAt || new Date().toISOString(),
    reply: n.reply,
    replyAt: n.replied_at || n.replyAt,
  };
}

export class ApiService {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        console.warn(`[API] Request failed (${response.status}): ${url}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (err) {
      console.warn(`[API] Backend unreachable at ${API_BASE_URL}${endpoint}. Running on local state.`, err);
      return null;
    }
  }

  // --- AUTH & USERS ---
  static async login(identifier: string, password?: string) {
    return this.request<{ success: boolean; message: string; token?: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  }

  static async registerUser(data: {
    name: string;
    email: string;
    role: string;
    password?: string;
    grade?: number;
    subject_specialization?: string;
  }) {
    return this.request<{ success: boolean; message: string; token?: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async getUsers() {
    return this.request<any[]>("/users");
  }

  static async createUser(data: any) {
    return this.request<any>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateUserProfile(userId: string, updates: any) {
    return this.request<any>(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  // --- CLASSROOMS ---
  static async getClassrooms() {
    return this.request<any[]>("/classrooms");
  }

  static async createClassroom(data: {
    name: string;
    grade: number;
    subject: string;
    teacher_id: string;
    teacher_name: string;
  }) {
    return this.request<any>("/classrooms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async joinClassroom(joinCode: string, studentId: string) {
    return this.request<any>("/classrooms/join", {
      method: "POST",
      body: JSON.stringify({ join_code: joinCode, student_id: studentId }),
    });
  }

  // --- DOCUMENTS & RAG ---
  static async getDocuments(classroomId?: string) {
    const query = classroomId ? `?classroom_id=${classroomId}` : "";
    return this.request<any[]>(`/documents${query}`);
  }

  static async extractDocumentText(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/extract-text`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as {
        success: boolean;
        filename: string;
        title: string;
        text: string;
        length: number;
      };
    } catch (err) {
      console.warn("[API] extractDocumentText error", err);
      return null;
    }
  }

  static async uploadDocumentFile(data: {
    classroom_id: string;
    title?: string;
    summary?: string;
    file: File;
  }) {
    const formData = new FormData();
    formData.append("classroom_id", data.classroom_id);
    if (data.title) formData.append("title", data.title);
    if (data.summary) formData.append("summary", data.summary);
    formData.append("file", data.file);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload-file`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as any;
    } catch (err) {
      console.warn("[API] uploadDocumentFile error", err);
      return null;
    }
  }

  static async uploadDocument(data: {
    classroom_id: string;
    title: string;
    raw_text: string;
    summary?: string;
    file_url?: string;
  }) {
    return this.request<any>("/documents/upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async deleteDocument(documentId: string) {
    return this.request<any>(`/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  static async generateDocumentAssets(documentId: string) {
    return this.request<any>(`/documents/${documentId}/generate-assets`, {
      method: "POST",
    });
  }

  // --- TASKS & AI QUIZ ---
  static async getTasks(classroomId?: string) {
    const query = classroomId ? `?classroom_id=${classroomId}` : "";
    return this.request<any[]>(`/tasks${query}`);
  }

  static async createTask(data: {
    classroom_id: string;
    classroom_name?: string;
    type?: string;
    title: string;
    chapter?: string;
    source_reference?: string;
    difficulty_level?: string;
    is_published?: boolean;
    due_date?: string;
    content_json?: any;
  }) {
    return this.request<any>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async generateAiQuiz(classroomId: string, chapterTitle: string, difficulty = "MEDIUM") {
    return this.request<any>("/tasks/generate-quiz", {
      method: "POST",
      body: JSON.stringify({
        classroom_id: classroomId,
        chapter_title: chapterTitle,
        difficulty_level: difficulty,
        num_questions: 4,
      }),
    });
  }

  // --- DDA ENGINE ---
  static async evaluateDDA(payload: {
    current_level: string;
    consecutive_correct: number;
    consecutive_incorrect: number;
    total_correct: number;
    total_answered: number;
    is_correct: boolean;
    response_time_sec: number;
    question_index: number;
  }) {
    return this.request<any>("/dda/evaluate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // --- INITIAL ASSESSMENT ---
  static async submitAssessment(studentId: string, answers: any[]) {
    return this.request<any>("/assessment/submit", {
      method: "POST",
      body: JSON.stringify({
        student_id: studentId,
        answers: answers,
      }),
    });
  }

  // --- BLOCKCHAIN CREDENTIALS ---
  static async getCredentials(studentId?: string) {
    const query = studentId ? `?student_id=${studentId}` : "";
    return this.request<any[]>(`/credentials${query}`);
  }

  static async mintCredential(data: {
    student_id: string;
    classroom_id: string;
    competency_title: string;
    score: number;
  }) {
    return this.request<any>("/credentials/mint", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async verifyCredential(query: string) {
    return this.request<any>(`/credentials/verify/${encodeURIComponent(query)}`);
  }

  // --- SCHEDULES ---
  static async getSchedules(studentId?: string) {
    const query = studentId ? `?student_id=${studentId}` : "";
    return this.request<any[]>(`/schedules${query}`);
  }

  static async toggleSchedule(scheduleId: string) {
    return this.request<any>(`/schedules/${scheduleId}/toggle`, {
      method: "PATCH",
    });
  }

  // --- SUBMISSIONS ---
  static async getSubmissions(taskId?: string, studentId?: string) {
    const params = new URLSearchParams();
    if (taskId) params.append("task_id", taskId);
    if (studentId) params.append("student_id", studentId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<any[]>(`/submissions${query}`);
  }

  static async submitAssignment(data: {
    task_id: string;
    task_title: string;
    student_id: string;
    student_name: string;
    content: string;
    attachment_name?: string;
  }) {
    return this.request<any>("/submissions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async gradeSubmission(submissionId: string, grade: number, feedback: string) {
    return this.request<any>(`/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify({ grade, feedback }),
    });
  }

  // --- PARENT-TEACHER NOTES ---
  static async getNotes(userId?: string, studentId?: string) {
    const params = new URLSearchParams();
    if (userId) params.append("user_id", userId);
    if (studentId) params.append("student_id", studentId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<any[]>(`/notes${query}`);
  }

  static async sendNote(data: {
    sender_id: string;
    sender_name: string;
    sender_role: string;
    receiver_id: string;
    student_id: string;
    student_name: string;
    message: string;
  }) {
    return this.request<any>("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async replyNote(noteId: string, reply: string) {
    return this.request<any>(`/notes/${noteId}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    });
  }

  // --- GEMINI AI & RAG INTELLIGENCE ---
  static async chatWithAI(data: {
    message: string;
    history?: { sender: string; text: string }[];
    classroom_id?: string;
    document_id?: string;
    learning_style?: string;
    student_name?: string;
    student_id?: string;
  }) {
    return this.request<{
      text: string;
      citation: string;
      is_grounded: boolean;
      cached: boolean;
      model: string;
    }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async generateQuizAI(data: {
    document_id: string;
    topic: string;
    difficulty?: string;
    num_questions?: number;
  }) {
    return this.request<{ questions: any[]; cached: boolean }>("/ai/generate-quiz", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async generateDiagramAI(concept: string) {
    return this.request<{ type: string; code: string; title: string; cached: boolean }>("/ai/diagram", {
      method: "POST",
      body: JSON.stringify({ concept }),
    });
  }

  static async generateTTS(data: { text: string; voice?: string; model?: string }): Promise<Blob | null> {
    try {
      const url = `${API_BASE_URL}/ai/tts`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        console.warn(`[API] TTS Request failed (${response.status})`);
        return null;
      }
      return await response.blob();
    } catch (err) {
      console.warn(`[API] TTS generation error:`, err);
      return null;
    }
  }

  static async generateImageAI(data: { prompt: string; size?: string; model?: string }) {
    return this.request<{ created: number; data: { b64_json?: string; url?: string }[] }>("/ai/generate-image", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async generateEmbeddingsAI(texts: string[], model?: string) {
    return this.request<{ data: { embedding: number[] }[] }>("/ai/embeddings", {
      method: "POST",
      body: JSON.stringify({ texts, model }),
    });
  }

  // --- LEARNING PROGRESS & METHOD TRACKING ---
  static async getLearningProgress(userId: string) {
    return this.request<{
      student_id: string;
      visual_progress: number;
      audio_progress: number;
      practice_progress: number;
      visual_completed: number;
      visual_total: number;
      audio_minutes: number;
      audio_completed: number;
      practice_completed: number;
      practice_total: number;
      overall_progress: number;
      details: Record<string, any>;
    }>(`/users/${userId}/progress`);
  }

  static async getStyleAnalytics(userId: string) {
    return this.request<{
      student_id: string;
      learning_style: "VISUAL" | "AUDITORI" | "KINESTETIK";
      current_dda_level: string;
      xp_total: number;
      accuracy_avg_pct: number;
      visual_params: any;
      auditory_params: any;
      kinesthetic_params: any;
      updated_at?: string;
    }>(`/users/${userId}/style-analytics`);
  }

  static async trackLearningActivity(
    userId: string,
    modalityType: "visual" | "audio" | "practice",
    incrementAmount: number = 1,
    activityTitle?: string
  ) {
    return this.request<any>(`/users/${userId}/progress`, {
      method: "PATCH",
      body: JSON.stringify({
        modality_type: modalityType,
        increment_amount: incrementAmount,
        activity_title: activityTitle,
      }),
    });
  }
}

