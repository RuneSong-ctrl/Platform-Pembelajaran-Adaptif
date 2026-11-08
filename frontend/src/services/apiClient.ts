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
  InfographicData,
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
    grade: u.grade ?? undefined,
    learningStyle: ("learning_style" in u ? u.learning_style : u.learningStyle) || undefined,
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
    streakDays: u.streak_days ?? u.streakDays ?? 0,
    hearts: u.hearts ?? 0,
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
    subject: c.subject || "",
    joinCode: c.join_code || c.joinCode || "",
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
    podcastEpisodesJson: d.podcast_episodes_json || d.podcastEpisodesJson || "",
    mindmapCode: d.mindmap_code || d.mindmapCode || "",
    visualImageUrl: d.visual_image_url || d.visualImageUrl || "",
    visualNodesJson: d.visual_nodes_json || d.visualNodesJson || "",
    flashcardsJson: d.flashcards_json || d.flashcardsJson || "",
    karaokeJson: d.karaoke_json || d.karaokeJson || "",
    gameConfigJson: d.game_config_json || d.gameConfigJson || "",
    fillBlankJson: d.fill_blank_json || d.fillBlankJson || "",
    sortingChallengesJson: d.sorting_challenges_json || d.sortingChallengesJson || "",
    infographicDataJson: d.infographic_data_json || d.infographicDataJson || "",
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
    examLabel: t.exam_label || t.examLabel || undefined,
    opensAt: t.opens_at || t.opensAt || undefined,
    closesAt: t.closes_at || t.closesAt || undefined,
    timeLimitMinutes: t.time_limit_minutes ?? t.timeLimitMinutes ?? undefined,
    maxAttempts: t.max_attempts ?? t.maxAttempts ?? undefined,
    attachments: t.attachments || [],
  };
}

const SUBMISSION_STATUS: Record<string, AssignmentSubmission["status"]> = {
  IN_PROGRESS: "InProgress",
  SUBMITTED: "Submitted",
  GRADED: "Graded",
};

export function normalizeCredential(c: any): BlockchainCredential {
  if (!c) return {} as BlockchainCredential;
  return {
    id: c.id,
    certificateId: c.certificate_id || c.certificateId || "",
    studentId: c.student_id || c.studentId || "",
    taskId: c.task_id ?? c.taskId ?? null,
    studentName: c.student_name || c.studentName || "Siswa",
    classroomId: c.classroom_id || c.classroomId || "",
    className: c.classroom_name || c.className || "Kelas Sains",
    competencyTitle: c.competency_title || c.competencyTitle || "Kompetensi Pembelajaran",
    score: c.score ?? 0,
    blockIndex: c.block_index ?? c.blockIndex ?? 1,
    previousHash: c.previous_hash || c.previousHash || "0000000000000000000000000000000000000000000000000000000000000000",
    blockHash: c.block_hash || c.blockHash || "",
    transactionId: c.transaction_id || c.transactionId || "",
    verifiedBy: c.verified_by || c.verifiedBy || `EduAdapt · ${c.classroom_name || c.className || "Kelas"}`,
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
    attachmentName: sub.attachment_name || sub.attachmentName || undefined,
    grade: sub.grade ?? undefined,
    feedback: sub.feedback || undefined,
    status: SUBMISSION_STATUS[sub.status] || sub.status || "Submitted",
    attachments: sub.attachments || [],
    answers: sub.answers || undefined,
    essayScores: sub.essay_scores || sub.essayScores || undefined,
    startedAt: sub.started_at || sub.startedAt || undefined,
    isLate: Boolean(sub.is_late ?? sub.isLate),
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

/** <audio>, <img> and <iframe> cannot send the Authorization header, so backend media links carry the token. */
// Short-lived, read-only pass for URLs that cannot carry an Authorization header (<img>, <audio>, PDF, EventSource).
// The login token itself never goes into a URL.
const TOKEN_KEY = "eduadapt_token";
/** One-line message the login page shows after the app signed the user out on its own. */
export const SESSION_NOTICE_KEY = "eduadapt_session_notice";

// The token used to live in sessionStorage, which iOS wipes whenever the home-screen app is closed.
try {
  const legacy = sessionStorage.getItem(TOKEN_KEY);
  if (legacy && !localStorage.getItem(TOKEN_KEY)) localStorage.setItem(TOKEN_KEY, legacy);
  sessionStorage.removeItem(TOKEN_KEY);
} catch {
  // storage blocked (private mode): the user simply logs in again
}

export interface TaskPayload {
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
  exam_label?: string | null;
  opens_at?: string | null;
  closes_at?: string | null;
  time_limit_minutes?: number | null;
}

export interface ExamQuestion {
  id: string;
  kind: "mcq" | "essay";
  questionText: string;
  options: string[] | null;
  points: number;
}

export interface ExamSession {
  submission_id: string;
  status: string;
  started_at: string;
  deadline: string | null;
  server_now: string;
  questions: ExamQuestion[];
  answers: Record<string, number | string>;
}

/** Turns a failed response into a sentence for the user: never a bare status code or a validation dump. */
const failMessage = (status: number, body: any, fallback: string) =>
  typeof body?.detail === "string" ? body.detail
  : status === 413 ? "File terlalu besar."
  : status === 422 ? "Data yang dikirim belum lengkap atau tidak valid."
  : status === 429 ? "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi."
  : status >= 500 ? "Server sedang bermasalah. Coba lagi sebentar lagi."
  : fallback;

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

let sessionExpiredHandler: (() => void) | null = null;
/** AppContext registers this; it runs when the server rejects the token that is currently stored. */
export const onSessionExpired = (handler: (() => void) | null) => {
  sessionExpiredHandler = handler;
};

let mediaTicket = "";
let ticketTimer: ReturnType<typeof setInterval> | undefined;
export const getMediaTicket = () => mediaTicket;

export function mediaUrl(url: string): string {
  if (!url || /^(blob:|data:)/.test(url)) return url;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const full = /^https?:\/\//.test(url) ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
  if (!mediaTicket || !full.startsWith(origin)) return full; // never hand the ticket to another host
  const [base, hash] = full.split("#");
  return `${base}${base.includes("?") ? "&" : "?"}t=${encodeURIComponent(mediaTicket)}${hash ? `#${hash}` : ""}`;
}

export interface RosterStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  learning_style?: string | null;
  level?: string | null;
  xp_total: number;
  streak_days: number;
  progress: number;
  tasks_total: number;
  tasks_submitted: number;
  average_grade: number | null;
  last_active: string;
  alerts: string[];
}

export interface Announcement {
  id: string;
  classroom_id: string;
  author_name: string;
  text: string;
  created_at: string;
}
export interface DirectMessage {
  id: string;
  sender_name: string;
  text: string;
  created_at: string;
  mine: boolean;
  read: boolean;
}
export interface MessageThreadSummary {
  classroom_id: string;
  classroom_name: string;
  student_id: string;
  student_name: string;
  teacher_name: string;
  parent_id: string | null;
  parent_name: string | null;
  unread: number;
  last_text: string;
  last_at: string;
}

/** Backend timestamps are naive UTC; mark them as UTC before parsing. */
export const utcDate = (iso: string) => new Date(/Z|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");

export class ApiService {
  static getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null; // storage blocked: behave as signed out
    }
  }
  static setToken(token?: string) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // storage blocked: the session lasts only while the page stays open
    }
    if (!token) {
      mediaTicket = "";
      clearInterval(ticketTimer);
    }
  }

  /** Fetches a media ticket (valid 2 h) and keeps it fresh every 60 min while signed in. */
  static async refreshMediaTicket() {
    try {
      mediaTicket = (await this.authenticatedRequest<{ ticket: string }>("/auth/media-ticket")).ticket;
    } catch {
      return; // media links fall back to failing closed; the next refresh retries
    }
    clearInterval(ticketTimer);
    ticketTimer = setInterval(() => void this.refreshMediaTicket(), 60 * 60 * 1000);
  }
  /** A 401 for a token that is still the stored one means the session ended on the server. */
  private static checkExpired(sentToken: string | null, status: number) {
    if (status === 401 && sentToken && sentToken === this.getToken()) sessionExpiredHandler?.();
  }
  static async authenticatedRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const sentToken = this.getToken();
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sentToken || ""}`, ...options?.headers },
      });
    } catch {
      throw new ApiError("Server tidak dapat dihubungi. Pastikan backend berjalan.");
    }
    if (!response.ok) {
      this.checkExpired(sentToken, response.status);
      const body = await response.json().catch(() => ({}));
      throw new ApiError(failMessage(response.status, body, "Permintaan gagal. Coba lagi."), response.status);
    }
    return response.json();
  }
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const sentToken = this.getToken();
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(sentToken ? { Authorization: `Bearer ${sentToken}` } : {}),
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        this.checkExpired(sentToken, response.status);
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
    return this.authenticatedRequest<any>(`/users/${userId}`, {
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
  /** Server-side check of one quiz answer; the first answer to a question is final for this attempt. */
  static async answerQuiz(taskId: string, questionId: string, selectedIndex: number | null) {
    return this.authenticatedRequest<{ correct: boolean; correct_index: number; selected_index: number | null; langkah?: string }>(
      `/tasks/${encodeURIComponent(taskId)}/answer`,
      { method: "POST", body: JSON.stringify({ question_id: questionId, selected_index: selectedIndex }) },
    );
  }

  static async createParentCode() {
    return this.authenticatedRequest<{ code: string; expires_at: string }>("/family/parent-code", { method: "POST" });
  }

  static async linkChild(code: string) {
    return this.authenticatedRequest<{ id: string; name: string; already_linked: boolean }>("/family/children", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  static async getAnnouncements(classroomId?: string) {
    const q = classroomId ? `?classroom_id=${encodeURIComponent(classroomId)}` : "";
    return this.authenticatedRequest<Announcement[]>(`/announcements${q}`);
  }

  static async postAnnouncement(classroomId: string, text: string) {
    return this.authenticatedRequest<Announcement>("/announcements", {
      method: "POST",
      body: JSON.stringify({ classroom_id: classroomId, text }),
    });
  }

  static async deleteAnnouncement(id: string) {
    return this.authenticatedRequest<{ deleted: boolean }>(`/announcements/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  static async getMessageThreads() {
    return this.authenticatedRequest<MessageThreadSummary[]>("/messages/threads");
  }

  static async getMessages(classroomId: string, studentId?: string, parentId?: string) {
    const q = new URLSearchParams({
      classroom_id: classroomId,
      ...(studentId ? { student_id: studentId } : {}),
      ...(parentId ? { parent_id: parentId } : {}),
    });
    return this.authenticatedRequest<DirectMessage[]>(`/messages?${q}`);
  }

  static async sendMessage(classroomId: string, text: string, studentId?: string, parentId?: string) {
    return this.authenticatedRequest<DirectMessage>("/messages", {
      method: "POST",
      body: JSON.stringify({ classroom_id: classroomId, student_id: studentId, parent_id: parentId, text }),
    });
  }

  static async getClassRoster(classroomId: string) {
    return this.authenticatedRequest<RosterStudent[]>(`/classrooms/${classroomId}/students`);
  }

  static async resetClassCode(classroomId: string) {
    return this.authenticatedRequest<{ join_code: string }>(`/classrooms/${classroomId}/reset-code`, { method: "POST" });
  }

  static async removeStudent(classroomId: string, studentId: string) {
    return this.authenticatedRequest<{ success: boolean }>(`/classrooms/${classroomId}/students/${studentId}`, { method: "DELETE" });
  }

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
        headers: { Authorization: `Bearer ${this.getToken() || ""}` },
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

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/documents/upload-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.getToken() || ""}` },
        body: formData,
      });
    } catch {
      throw new Error("Server tidak dapat dihubungi. Pastikan backend berjalan.");
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(failMessage(response.status, body, "Unggah gagal. Coba lagi."));
    }
    return (await response.json()) as any;
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

  static async fetchPodcastEpisodes(documentId: string) {
    return this.request<any[]>(`/documents/${documentId}/podcast-episodes`);
  }

  static async getInfographic(documentId: string): Promise<InfographicData | null> {
    return this.request<InfographicData>(`/documents/${documentId}/infographic`);
  }

  // --- TASKS & AI QUIZ ---
  static async getTasks(classroomId?: string) {
    const query = classroomId ? `?classroom_id=${classroomId}` : "";
    return this.request<any[]>(`/tasks${query}`);
  }

  /** multipart/form-data request: the browser sets the boundary, so no Content-Type header here. */
  private static async sendForm<T>(endpoint: string, form: FormData, method = "POST"): Promise<T> {
    const sentToken = this.getToken();
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: { Authorization: `Bearer ${sentToken || ""}` },
        body: form,
      });
    } catch {
      throw new ApiError("Server tidak dapat dihubungi. Periksa koneksimu.");
    }
    if (!response.ok) {
      this.checkExpired(sentToken, response.status);
      const body = await response.json().catch(() => ({}));
      throw new ApiError(failMessage(response.status, body, "Unggah gagal. Coba lagi."), response.status);
    }
    return response.json();
  }

  static async createTask(data: TaskPayload) {
    return this.authenticatedRequest<any>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
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
    return this.authenticatedRequest<any>("/credentials/mint", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /** Student claims a quiz credential; the server grades the answers. Throws with the server's reason on failure. */
  static async claimCredential(data: {
    task_id: string;
    answers: { question_id: string; selected_index: number | null }[];
  }) {
    return this.authenticatedRequest<any>("/credentials/claim", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async verifyCredential(query: string, simulateScore?: number) {
    const sim = simulateScore !== undefined ? `?simulate_score=${simulateScore}` : "";
    return this.request<{
      is_valid: boolean;
      is_tampered: boolean;
      computed_hash: string;
      recorded_hash: string;
      certificate: any | null;
      tamper_reason?: string | null;
    }>(`/credentials/verify/${encodeURIComponent(query)}${sim}`);
  }

  // --- SCHEDULES ---
  static async getSchedules(studentId?: string) {
    const query = studentId ? `?student_id=${studentId}` : "";
    return this.request<any[]>(`/schedules${query}`);
  }

  static async createSchedule(data: {
    student_id?: string;
    day: string;
    time: string;
    duration: string;
    title: string;
    format: string;
    completed?: boolean;
  }) {
    return this.authenticatedRequest<any>("/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async toggleSchedule(scheduleId: string) {
    return this.request<any>(`/schedules/${scheduleId}/toggle`, {
      method: "PATCH",
    });
  }

  static async deleteSchedule(scheduleId: string) {
    return this.authenticatedRequest<{ success: boolean; message: string }>(`/schedules/${scheduleId}`, {
      method: "DELETE",
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

  static async updateTask(taskId: string, data: Partial<TaskPayload>) {
    return this.authenticatedRequest<any>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async deleteTask(taskId: string) {
    return this.authenticatedRequest<{ deleted: boolean }>(`/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
  }

  static async uploadTaskAttachments(taskId: string, files: File[]) {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return this.sendForm<any>(`/tasks/${encodeURIComponent(taskId)}/attachments`, form);
  }

  static async deleteTaskAttachment(taskId: string, fileId: string) {
    return this.authenticatedRequest<any>(`/tasks/${encodeURIComponent(taskId)}/attachments/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    });
  }

  /** Hands in (or re-hands in) an assignment: text plus kept and new files. */
  static async submitAssignment(data: { task_id: string; content: string; keep_file_ids: string[]; files: File[] }) {
    const form = new FormData();
    form.append("task_id", data.task_id);
    form.append("content", data.content);
    form.append("keep_files", JSON.stringify(data.keep_file_ids));
    data.files.forEach((f) => form.append("files", f));
    return this.sendForm<any>("/submissions", form);
  }

  static async gradeSubmission(submissionId: string, data: { grade?: number; essay_scores?: Record<string, number>; feedback: string }) {
    return this.authenticatedRequest<any>(`/submissions/${submissionId}/grade`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // --- TIMED EXAMS ---
  static async startExam(taskId: string) {
    return this.authenticatedRequest<ExamSession>(`/tasks/${encodeURIComponent(taskId)}/start`, { method: "POST" });
  }

  static async saveExamProgress(taskId: string, answers: Record<string, number | string>) {
    return this.authenticatedRequest<{ saved: boolean; deadline: string | null }>(`/tasks/${encodeURIComponent(taskId)}/progress`, {
      method: "PUT",
      body: JSON.stringify({ answers }),
    });
  }

  static async submitExam(taskId: string, answers: Record<string, number | string>) {
    return this.authenticatedRequest<any>(`/tasks/${encodeURIComponent(taskId)}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
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
    conversation_id?: string;
  }) {
    return this.request<{
      text: string;
      citation: string;
      is_grounded: boolean;
      cached: boolean;
      model: string;
      conversation_id?: string;
    }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async listAIConversations() {
    return this.request<{ id: string; title: string; classroom_id?: string | null; document_id?: string | null; updated_at: string }[]>("/ai/conversations");
  }

  static async getAIConversation(id: string) {
    return this.request<{
      id: string;
      title: string;
      classroom_id?: string | null;
      document_id?: string | null;
      messages: { sender: "ai" | "user"; text: string; citation?: string; timestamp: string }[];
    }>(`/ai/conversations/${encodeURIComponent(id)}`);
  }

  static async deleteAIConversation(id: string) {
    return this.request<{ deleted: boolean }>(`/ai/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  static async generateQuizAI(data: {
    document_id: string;
    topic: string;
    difficulty?: string;
    num_questions?: number;
  }) {
    return this.authenticatedRequest<{ questions: any[]; cached: boolean }>("/ai/generate-quiz", {
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
          Authorization: `Bearer ${this.getToken() || ""}`,
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

