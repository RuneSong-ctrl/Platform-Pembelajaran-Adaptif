"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  User,
  Classroom,
  GroundedDocument,
  GroundedTask,
  BlockchainCredential,
  AssignmentSubmission,
  ParentTeacherNote,
  OfflinePackage,
  DDALevel,
  ModalityType,
  LearningScheduleItem,
} from "@/types";
import {
  MOCK_USERS,
  MOCK_CLASSROOMS,
  MOCK_GROUNDED_DOCUMENTS,
  MOCK_TASKS,
  MOCK_CREDENTIALS,
  MOCK_SUBMISSIONS,
  MOCK_NOTES,
  MOCK_OFFLINE_PACKAGES,
} from "@/services/mockData";
import {
  ApiService,
  normalizeUser,
  normalizeClassroom,
  normalizeDocument,
  normalizeTask,
  normalizeCredential,
  normalizeSchedule,
  normalizeSubmission,
  normalizeNote,
} from "@/services/apiClient";

interface AppContextType {
  // Auth & User Management
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  registerUser: (data: { name: string; email: string; role: "SISWA" | "GURU" | "ORTU"; password?: string; grade?: number; invite_code?: string }) => Promise<{ success: boolean; user?: User; message?: string }>;
  loginWithClassCode: (studentName: string, classCode: string) => { success: boolean; user?: User; message?: string; isNewStudent?: boolean };
  logout: () => void;

  // User & Role Switching
  currentUser: User;
  users: User[];
  switchUser: (userId: string) => void;
  updateCurrentUserProfile: (updates: Partial<User>) => Promise<void>;

  // Classrooms
  classrooms: Classroom[];
  addClassroom: (name: string, grade: number, subject: string) => Classroom;
  createClassroom: (name: string, subject: string, grade?: number) => Classroom;
  joinClassroom: (joinCode: string) => Promise<{ success: boolean; message: string; classroomId?: string }>;

  // Documents & RAG Grounding
  documents: GroundedDocument[];
  uploadDocument: (classroomId: string, title: string, rawText: string, summary?: string) => Promise<GroundedDocument>;
  uploadDocumentFile: (classroomId: string, file: File, title?: string, summary?: string) => Promise<GroundedDocument>;
  deleteDocument: (docId: string) => void;

  // Tasks & Quiz
  tasks: GroundedTask[];
  createTask: (task: Omit<GroundedTask, "id" | "createdAt">) => Promise<GroundedTask>;

  // Submissions
  submissions: AssignmentSubmission[];
  submitAssignment: (taskId: string, content: string, attachmentName?: string) => void;
  gradeSubmission: (submissionId: string, grade: number, feedback: string) => Promise<void>;
  gradeAssignmentSubmission: (submissionId: string, grade: number, feedback: string) => Promise<void>;

  // Blockchain Credentials
  credentials: BlockchainCredential[];
  mintCredential: (studentId: string, classroomId: string, competencyTitle: string, score: number) => Promise<BlockchainCredential>;
  claimQuizCredential: (taskId: string, answers: { question_id: string; selected_index: number | null }[]) => Promise<BlockchainCredential>;
  mintNewCredential: (newCert: BlockchainCredential) => void;

  // Parent Notes & Active Child Focus
  notes: ParentTeacherNote[];
  selectedParentChildId: string;
  setSelectedParentChildId: (id: string) => void;
  sendNote: (receiverId: string, studentId: string, message: string) => string;
  sendParentTeacherNote: (receiverId: string, studentId: string, message: string) => string;
  replyNote: (noteId: string, reply: string) => void;

  // Offline Sync
  offlinePackages: OfflinePackage[];
  toggleDownloadPackage: (id: string) => void;
  triggerSync: () => Promise<void>;
  isSyncing: boolean;

  // Digital Wellbeing
  userMood: "Great" | "Good" | "Okay" | "Tired" | null;
  setUserMood: (mood: "Great" | "Good" | "Okay" | "Tired") => void;
  studyTimeMinutes: number;
  resetStudyTimer: () => void;

  // Learning Schedule Plans
  learningSchedules: LearningScheduleItem[];
  addLearningSchedule: (item: Omit<LearningScheduleItem, "id">) => void;
  deleteLearningSchedule: (id: string) => void;
  toggleLearningSchedule: (id: string) => void;

  // Learning Progress & Activity Tracking
  trackLearningActivity: (type: "visual" | "audio" | "practice", amount?: number, title?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH: "eduadapt_is_authenticated",
  USER: "eduadapt_current_user_id",
  USERS: "eduadapt_users",
  CLASSROOMS: "eduadapt_classrooms",
  DOCS: "eduadapt_documents",
  TASKS: "eduadapt_tasks",
  CREDENTIALS: "eduadapt_credentials",
  SUBMISSIONS: "eduadapt_submissions",
  NOTES: "eduadapt_notes",
  PACKAGES: "eduadapt_packages",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const sessionVersion = useRef(0);
  const activeUserId = useRef("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(ApiService.getToken()));
  useEffect(() => {
    let active = true;
    const version = sessionVersion.current;
    const token = ApiService.getToken();
    const isCurrent = () => active && version === sessionVersion.current && token === ApiService.getToken();
    if (token) {
      ApiService.authenticatedRequest<unknown>("/auth/me").then(async raw => {
        await ApiService.refreshMediaTicket();
        if (!isCurrent()) return;
        const user = normalizeUser(raw);
        activeUserId.current = user.id;
        setUsers(prev => [user, ...prev.filter(item => item.id !== user.id)]);
        setCurrentUserId(user.id);
        localStorage.setItem(STORAGE_KEYS.USER, user.id);
        setIsAuthenticated(true);
      }).catch(() => { if (isCurrent()) { ApiService.setToken(); setIsAuthenticated(false); } })
        .finally(() => { if (active && version === sessionVersion.current) setIsRestoringSession(false); });
    } else {
      setIsRestoringSession(false);
    }
    return () => { active = false; };
  }, []);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [documents, setDocuments] = useState<GroundedDocument[]>([]);
  const [tasks, setTasks] = useState<GroundedTask[]>([]);
  const [credentials, setCredentials] = useState<BlockchainCredential[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [notes, setNotes] = useState<ParentTeacherNote[]>([]);
  const [selectedParentChildId, setSelectedParentChildId] = useState<string>("");
  const [offlinePackages, setOfflinePackages] = useState<OfflinePackage[]>([]);

  const [userMood, setUserMood] = useState<"Great" | "Good" | "Okay" | "Tired" | null>(null);
  const [studyTimeMinutes, setStudyTimeMinutes] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [learningSchedules, setLearningSchedules] = useState<LearningScheduleItem[]>([]);

  const addLearningSchedule = (item: Omit<LearningScheduleItem, "id">) => {
    const newItem: LearningScheduleItem = {
      ...item,
      id: `sch_${Date.now()}`,
    };
    setLearningSchedules((prev) => [newItem, ...prev]);
  };

  const deleteLearningSchedule = (id: string) => {
    setLearningSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const trackLearningActivity = async (
    type: "visual" | "audio" | "practice",
    amount: number = 1,
    title?: string
  ) => {
    if (!currentUser?.id) return;
    try {
      const res = await ApiService.trackLearningActivity(currentUser.id, type, amount, title);
      if (res) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === currentUser.id
              ? {
                  ...u,
                  learningProgress: {
                    visual: res.visual_progress,
                    audio: res.audio_progress,
                    practice: res.practice_progress,
                    visualCompleted: res.visual_completed,
                    visualTotal: res.visual_total,
                    audioMinutes: res.audio_minutes,
                    audioCompleted: res.audio_completed,
                    practiceCompleted: res.practice_completed,
                    practiceTotal: res.practice_total,
                  },
                }
              : u
          )
        );
      }
    } catch (err) {
      console.warn("[AppContext] trackLearningActivity error:", err);

    }
  };

  const toggleLearningSchedule = (id: string) => {
    const targetSchedule = learningSchedules.find((s) => s.id === id);
    const willComplete = targetSchedule ? !targetSchedule.completed : false;

    setLearningSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
    // Persist to backend
    ApiService.toggleSchedule(id).catch(() => {});

    // If completed, dynamically update learning modality activity progress
    if (willComplete && targetSchedule) {
      const formatType =
        targetSchedule.format === "Visual"
          ? "visual"
          : targetSchedule.format === "Audio"
          ? "audio"
          : "practice";
      trackLearningActivity(formatType, 1, targetSchedule.title);
    }
  };

  // Load the signed-in account's own data; nothing is shown before login or carried over after logout.
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      setUsers(previous => previous.filter(user => user.id === activeUserId.current));
      setClassrooms([]);
      setDocuments([]);
      setTasks([]);
      setCredentials([]);
      setLearningSchedules([]);
      setSubmissions([]);
      setNotes([]);
      return;
    }
    const version = sessionVersion.current;
    const fetchBackendData = async () => {
      setIsSyncing(true);
      try {
        const [
          backendUsers,
          backendClassrooms,
          backendDocs,
          backendTasks,
          backendCreds,
          backendSchedules,
          backendSubs,
          backendNotes,
        ] = await Promise.all([
          ApiService.getUsers(),
          ApiService.getClassrooms(),
          ApiService.getDocuments(),
          ApiService.getTasks(),
          ApiService.getCredentials(),
          ApiService.getSchedules(),
          ApiService.getSubmissions(),
          ApiService.getNotes(),
        ]);
        if (version !== sessionVersion.current) return;

        if (backendUsers !== null && backendUsers.length > 0) {
          const normalized = backendUsers.map(normalizeUser);
          setUsers(previous => [
            ...previous.filter(user => user.id === activeUserId.current),
            ...normalized.filter(user => user.id !== activeUserId.current),
          ]);
        }
        if (backendClassrooms !== null) {
          setClassrooms(backendClassrooms.map(normalizeClassroom));
        }
        if (backendDocs !== null) {
          setDocuments(backendDocs.map(normalizeDocument));
        }
        if (backendTasks !== null) {
          setTasks(backendTasks.map(normalizeTask));
        }
        if (backendCreds !== null) {
          setCredentials(backendCreds.map(normalizeCredential));
        }
        if (backendSchedules !== null) {
          setLearningSchedules(backendSchedules.map(normalizeSchedule));
        }
        if (backendSubs !== null) {
          setSubmissions(backendSubs.map(normalizeSubmission));
        }
        if (backendNotes !== null) {
          setNotes(backendNotes.map(normalizeNote));
        }
      } catch (e) {
        console.warn("[AppContext] Backend sync fallback to local state", e);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchBackendData();
  }, [isAuthenticated, currentUserId]);

  // Older builds cached other accounts' records in this browser; never restore them.
  useEffect(() => {
    try {
      [STORAGE_KEYS.CREDENTIALS, STORAGE_KEYS.TASKS, STORAGE_KEYS.DOCS, STORAGE_KEYS.SUBMISSIONS]
        .forEach(key => localStorage.removeItem(key));
    } catch {
      // storage unavailable
    }
  }, []);

  const DEFAULT_EMPTY_USER: User = {
    id: "",
    name: "Pengguna",
    email: "",
    role: "SISWA",
    avatar: "ED",
    grade: 10,
    learningStyle: "VISUAL",
    modalityScores: { visual: 0, audio: 0, practice: 0 },
    processingSpeed: "MODERATE",
    xpTotal: 0,
    streakDays: 0,
    hearts: 5,
    currentDDALevel: "BASIC",
  };

  const currentUser = users.find((u) => u.id === currentUserId) || DEFAULT_EMPTY_USER;

  // Text size and tap-target size follow the student's school level (see globals.css).
  const grade = currentUser.grade ?? 10;
  const jenjang = !currentUser.id || currentUser.role !== "SISWA" ? ""
    : grade <= 3 ? "sd-awal" : grade <= 6 ? "sd" : grade <= 9 ? "smp" : "sma";
  useEffect(() => {
    if (jenjang) document.documentElement.dataset.jenjang = jenjang;
    else delete document.documentElement.dataset.jenjang;
  }, [jenjang]);

  const acceptSession = async (response: { token: string; user: unknown }) => {
    const user = normalizeUser(response.user);
    ApiService.setToken(response.token);
    await ApiService.refreshMediaTicket(); // media links on the first screen need it
    activeUserId.current = user.id;
    setIsRestoringSession(false);
    setUsers(prev => [user, ...prev.filter(item => item.id !== user.id)]);
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER, user.id);
    return { success: true, user };
  };

  const login = async (identifier: string, password?: string) => {
    const version = ++sessionVersion.current;
    try {
      const response = await ApiService.authenticatedRequest<{ token: string; user: unknown }>("/auth/login", {
        method: "POST", body: JSON.stringify({ identifier, password }),
      });
      if (version !== sessionVersion.current) return { success: false, message: "Permintaan sesi sudah dibatalkan." };
      return acceptSession(response);
    } catch (error) {
      if (version !== sessionVersion.current) return { success: false, message: "Permintaan sesi sudah dibatalkan." };
      ApiService.setToken();
      activeUserId.current = "";
      setCurrentUserId("");
      setIsRestoringSession(false);
      setIsAuthenticated(false);
      return { success: false, message: error instanceof Error ? error.message : "Gagal masuk." };
    }
  };

  const registerUser = async (data: {
    name: string; email: string; role: "SISWA" | "GURU" | "ORTU"; password?: string; grade?: number; invite_code?: string;
  }) => {
    const version = ++sessionVersion.current;
    try {
      const response = await ApiService.authenticatedRequest<{ token: string; user: unknown }>("/auth/register", {
        method: "POST", body: JSON.stringify(data),
      });
      if (version !== sessionVersion.current) return { success: false, message: "Permintaan sesi sudah dibatalkan." };
      return acceptSession(response);
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Registrasi gagal." };
    }
  };

  const loginWithClassCode = (_studentName: string, _classCode: string) => ({
    success: false, message: "Masuk atau daftar dengan password dahulu, lalu gabung kelas menggunakan kode dari halaman kelas.",
  });

  const logout = () => {
    sessionVersion.current += 1;
    activeUserId.current = "";
    setIsRestoringSession(false);
    void ApiService.authenticatedRequest("/auth/logout", { method: "POST" }).catch(() => {});
    ApiService.setToken();
    setIsAuthenticated(false);
    setCurrentUserId("");
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const switchUser = (_userId: string) => {
    // Changing identity requires a new authenticated session.
    logout();
  };

  const updateCurrentUserProfile = async (updates: Partial<User>) => {
    const version = sessionVersion.current;
    const userId = currentUser.id;
    if (!isAuthenticated || !userId) throw new Error("Silakan masuk kembali sebelum menyimpan profil.");
    const response = await ApiService.updateUserProfile(userId, {
      name: updates.name, email: updates.email, avatar: updates.avatar, grade: updates.grade,
      learning_style: updates.learningStyle, modality_scores: updates.modalityScores,
      processing_speed: updates.processingSpeed, xp_total: updates.xpTotal,
      streak_days: updates.streakDays, hearts: updates.hearts, current_dda_level: updates.currentDDALevel,
    });
    if (version !== sessionVersion.current || activeUserId.current !== userId) {
      throw new Error("Sesi telah berubah. Masuk kembali untuk memeriksa profil.");
    }
    const user = normalizeUser(response);
    setUsers(previous => previous.map(item => item.id === userId ? user : item));
  };

  const addClassroom = (name: string, grade: number, subject: string): Classroom => {
    const randomCode = `UDU${Math.floor(100 + Math.random() * 900)}`;
    const newClass: Classroom = {
      id: `cls_${Date.now()}`,
      name,
      grade,
      subject,
      joinCode: randomCode,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      studentIds: [],
      documentsCount: 0,
      tasksCount: 0,
      createdAt: new Date().toISOString(),
    };
    setClassrooms((prev) => [newClass, ...prev]);

    // Persist to backend
    ApiService.createClassroom({
      name,
      grade,
      subject,
      teacher_id: currentUser.id,
      teacher_name: currentUser.name,
    })
      .then((res) => {
        // A class the server never saved must not stay on screen: uploads to it would fail.
        setClassrooms((prev) => res
          ? prev.map((c) => (c.id === newClass.id ? normalizeClassroom(res) : c))
          : prev.filter((c) => c.id !== newClass.id));
      });

    return newClass;
  };

  const createClassroom = (name: string, subject: string, grade: number = 10): Classroom => {
    return addClassroom(name, grade, subject);
  };

  // Students only see classes they belong to, so the join code is resolved by the server.
  const joinClassroom = async (joinCode: string): Promise<{ success: boolean; message: string; classroomId?: string }> => {
    try {
      const res = await ApiService.authenticatedRequest<{ message: string; classroom: unknown }>("/classrooms/join", {
        method: "POST",
        body: JSON.stringify({ join_code: joinCode.trim().toUpperCase(), student_id: currentUser.id }),
      });
      const joined = normalizeClassroom(res.classroom);
      setClassrooms((prev) => [joined, ...prev.filter((c) => c.id !== joined.id)]);
      const [docs, classTasks] = await Promise.all([ApiService.getDocuments(), ApiService.getTasks()]);
      if (docs) setDocuments(docs.map(normalizeDocument));
      if (classTasks) setTasks(classTasks.map(normalizeTask));
      return { success: true, message: res.message, classroomId: joined.id };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Gagal bergabung ke kelas." };
    }
  };

  const uploadDocument = async (
    classroomId: string,
    title: string,
    rawText: string,
    summary?: string
  ): Promise<GroundedDocument> => {
    const chunks = Math.max(1, Math.ceil(rawText.length / 400));
    const newDoc: GroundedDocument = {
      id: `doc_${Date.now()}`,
      classroomId,
      title,
      rawText,
      chunksCount: chunks,
      vectorId: `VEC-${Math.floor(100 + Math.random() * 900)}`,
      status: "READY",
      uploadedAt: new Date().toISOString(),
      summary: summary || `Hasil ekstraksi dan semantic chunking (${chunks} potongan vektor) ter-grounding.`,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === classroomId ? { ...c, documentsCount: c.documentsCount + 1 } : c
      )
    );

    try {
      const res = await ApiService.authenticatedRequest<unknown>("/documents/upload", {
        method: "POST",
        body: JSON.stringify({ classroom_id: classroomId, title, raw_text: rawText, summary }),
      });
      const norm = normalizeDocument(res);
      setDocuments(prev => prev.map(d => d.id === newDoc.id ? norm : d));
      return norm;
    } catch (error) {
      setDocuments(prev => prev.filter(d => d.id !== newDoc.id));
      setClassrooms(prev => prev.map(c => c.id === classroomId ? { ...c, documentsCount: Math.max(0, c.documentsCount - 1) } : c));
      throw error;
    }
  };

  const uploadDocumentFile = async (
    classroomId: string,
    file: File,
    title?: string,
    summary?: string
  ): Promise<GroundedDocument> => {
    const cleanTitle =
      title?.trim() ||
      file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_\-]+/g, " ")
        .trim();

    const tempDoc: GroundedDocument = {
      id: `doc_${Date.now()}`,
      classroomId,
      title: cleanTitle,
      rawText: "Sedang memproses dan mengekstrak dokumen...",
      chunksCount: Math.max(1, Math.ceil(file.size / 850)),
      vectorId: `VEC-${Math.floor(100 + Math.random() * 900)}`,
      status: "READY",
      uploadedAt: new Date().toISOString(),
      summary: summary || `Modul ajar: ${cleanTitle} (Sumber: ${file.name})`,
    };

    setDocuments((prev) => [tempDoc, ...prev]);
    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === classroomId ? { ...c, documentsCount: c.documentsCount + 1 } : c
      )
    );

    // Persist to backend with real PDF / text extraction
    try {
      const res = await ApiService.uploadDocumentFile({
        classroom_id: classroomId,
        title: cleanTitle,
        summary: summary || tempDoc.summary,
        file,
      });
      const norm = normalizeDocument(res);
      setDocuments((prev) => prev.map((d) => (d.id === tempDoc.id ? norm : d)));
      return norm;
    } catch (error) {
      setDocuments(prev => prev.filter(d => d.id !== tempDoc.id));
      setClassrooms(prev => prev.map(c => c.id === classroomId ? { ...c, documentsCount: Math.max(0, c.documentsCount - 1) } : c));
      throw error;
    }
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    ApiService.deleteDocument(docId).catch(() => {});
  };

  // Waits for the server so the caller only reports success once the task is really saved.
  const createTask = async (taskData: Omit<GroundedTask, "id" | "createdAt">): Promise<GroundedTask> => {
    const res = await ApiService.createTask({
      classroom_id: taskData.classroomId,
      classroom_name: taskData.classroomName,
      type: taskData.type,
      title: taskData.title,
      chapter: taskData.chapter,
      source_reference: taskData.sourceReference,
      difficulty_level: taskData.difficultyLevel,
      is_published: taskData.isPublished,
      due_date: taskData.dueDate,
      content_json: taskData.contentJson,
    });
    const newTask = normalizeTask(res);
    setTasks((prev) => [newTask, ...prev]);
    setClassrooms((prev) =>
      prev.map((c) => (c.id === taskData.classroomId ? { ...c, tasksCount: c.tasksCount + 1 } : c))
    );
    return newTask;
  };

  const submitAssignment = (taskId: string, content: string, attachmentName?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const newSub: AssignmentSubmission = {
      id: `sub_${Date.now()}`,
      taskId,
      taskTitle: task ? task.title : "Tugas Kelas",
      studentId: currentUser.id,
      studentName: currentUser.name,
      submittedAt: new Date().toISOString(),
      content,
      attachmentName: attachmentName || "Dokumen_Tugas.pdf",
      status: "Submitted",
    };
    setSubmissions((prev) => [newSub, ...prev]);

    // Persist to backend
    ApiService.submitAssignment({
      task_id: taskId,
      task_title: newSub.taskTitle,
      student_id: currentUser.id,
      student_name: currentUser.name,
      content,
      attachment_name: newSub.attachmentName,
    }).catch(() => {});

    // Update practice learning activity progress
    trackLearningActivity("practice", 1, newSub.taskTitle);
  };

  // Waits for the server so a grade the teacher sees is a grade the student gets.
  const gradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    const saved = normalizeSubmission(await ApiService.gradeSubmission(submissionId, grade, feedback));
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? saved : s)));
  };

  const gradeAssignmentSubmission = gradeSubmission;

  // Blocks are only ever created by the backend ledger; a locally made "certificate" would not verify anywhere.
  const addCredential = (raw: any) => {
    const cred = normalizeCredential(raw);
    setCredentials((prev) => [cred, ...prev.filter((c) => c.id !== cred.id)]);
    return cred;
  };

  const mintCredential = async (
    studentId: string,
    classroomId: string,
    competencyTitle: string,
    score: number
  ): Promise<BlockchainCredential> =>
    addCredential(
      await ApiService.mintCredential({
        student_id: studentId,
        classroom_id: classroomId,
        competency_title: competencyTitle,
        score,
      })
    );

  const claimQuizCredential = async (
    taskId: string,
    answers: { question_id: string; selected_index: number | null }[]
  ): Promise<BlockchainCredential> => addCredential(await ApiService.claimCredential({ task_id: taskId, answers }));

  const mintNewCredential = (newCert: BlockchainCredential) => {
    setCredentials((prev) => [newCert, ...prev]);
  };

  const sendNote = (receiverId: string, studentId: string, message: string): string => {
    const receiver = users.find((u) => u.id === receiverId);
    const student = users.find((u) => u.id === studentId);
    const newNoteId = `note_${Date.now()}`;

    const newNote: ParentTeacherNote = {
      id: newNoteId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId,
      receiverName: receiver ? receiver.name : "Penerima",
      studentId,
      studentName: student ? student.name : "Siswa",
      message,
      sentAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);

    // Persist to backend
    ApiService.sendNote({
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      sender_role: currentUser.role,
      receiver_id: receiverId,
      student_id: studentId,
      student_name: student?.name || "Siswa",
      message,
    }).catch(() => {});

    return newNoteId;
  };

  const sendParentTeacherNote = sendNote;

  const replyNote = (noteId: string, reply: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, reply, replyAt: new Date().toISOString() }
          : n
      )
    );

    // Persist to backend
    ApiService.replyNote(noteId, reply).catch(() => {});
  };

  const toggleDownloadPackage = (id: string) => {
    setOfflinePackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id
          ? {
              ...pkg,
              isDownloaded: !pkg.isDownloaded,
              syncStatus: !pkg.isDownloaded ? "Offline Ready" : "Synced",
            }
          : pkg
      )
    );
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      // Background sync with FastAPI backend
      const [backendClassrooms, backendDocs, backendTasks, backendCreds, backendUsers] = await Promise.all([
        ApiService.getClassrooms(),
        ApiService.getDocuments(),
        ApiService.getTasks(),
        ApiService.getCredentials(),
        ApiService.getUsers(),
      ]);

      // null = request failed (keep what we have); an empty list is a real answer and replaces local data.
      if (backendClassrooms) setClassrooms(backendClassrooms.map(normalizeClassroom));
      if (backendDocs) setDocuments(backendDocs.map(normalizeDocument));
      if (backendTasks) setTasks(backendTasks.map(normalizeTask));
      if (backendCreds) setCredentials(backendCreds.map(normalizeCredential));
      if (backendUsers) setUsers(backendUsers.map(normalizeUser));
    } catch {
      // Graceful offline fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setOfflinePackages((prev) =>
      prev.map((pkg) => ({ ...pkg, syncStatus: "Synced" }))
    );
    setIsSyncing(false);
  };

  const resetStudyTimer = () => {
    setStudyTimeMinutes(0);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isRestoringSession,
        login,
        registerUser,
        loginWithClassCode,
        logout,
        currentUser,
        users,
        switchUser,
        updateCurrentUserProfile,
        classrooms,
        addClassroom,
        createClassroom,
        joinClassroom,
        documents,
        uploadDocument,
        uploadDocumentFile,
        deleteDocument,
        tasks,
        createTask,
        submissions,
        submitAssignment,
        gradeSubmission,
        gradeAssignmentSubmission,
        credentials,
        mintCredential,
        claimQuizCredential,
        mintNewCredential,
        notes,
        selectedParentChildId,
        setSelectedParentChildId,
        sendNote,
        sendParentTeacherNote,
        replyNote,

        offlinePackages,
        toggleDownloadPackage,
        triggerSync,
        isSyncing,
        userMood,
        setUserMood,
        studyTimeMinutes,
        resetStudyTimer,
        learningSchedules,
        addLearningSchedule,
        deleteLearningSchedule,
        toggleLearningSchedule,
        trackLearningActivity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
