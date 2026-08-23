/**
 * EduAdapt API Client
 * Penghubung Frontend React ke Backend FastAPI (Python 3 & MySQL)
 */

const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:8000/api/v1";

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
      console.warn(`[API] Backend unreachable at ${API_BASE_URL}${endpoint}. Running on local resilient state.`, err);
      return null;
    }
  }

  // --- USERS & PROFILES ---
  static async getUsers() {
    return this.request<any[]>("/users");
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

  static async createClassroom(data: any) {
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

  static async uploadDocument(data: any) {
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

  // --- TASKS & AI QUIZ ---
  static async getTasks(classroomId?: string) {
    const query = classroomId ? `?classroom_id=${classroomId}` : "";
    return this.request<any[]>(`/tasks${query}`);
  }

  static async createTask(data: any) {
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
}
