"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  generateBlockHash,
  generateTransactionId,
  GENESIS_BLOCK_HASH,
} from "@/services/blockchainVault";
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
  login: (identifier: string, password?: string) => { success: boolean; user?: User; message?: string };
  registerUser: (data: { name: string; email: string; role: "SISWA" | "GURU" | "ORTU"; password?: string; grade?: number }) => { success: boolean; user?: User; message?: string };
  loginWithClassCode: (studentName: string, classCode: string) => { success: boolean; user?: User; message?: string; isNewStudent?: boolean };
  logout: () => void;

  // User & Role Switching
  currentUser: User;
  users: User[];
  switchUser: (userId: string) => void;
  updateCurrentUserProfile: (updates: Partial<User>) => void;

  // Classrooms
  classrooms: Classroom[];
  addClassroom: (name: string, grade: number, subject: string) => Classroom;
  createClassroom: (name: string, subject: string, grade?: number) => Classroom;
  joinClassroom: (joinCode: string) => { success: boolean; message: string };

  // Documents & RAG Grounding
  documents: GroundedDocument[];
  uploadDocument: (classroomId: string, title: string, rawText: string, summary?: string) => Promise<GroundedDocument>;
  uploadDocumentFile: (classroomId: string, file: File, title?: string, summary?: string) => Promise<GroundedDocument>;
  deleteDocument: (docId: string) => void;

  // Tasks & Quiz
  tasks: GroundedTask[];
  createTask: (task: Omit<GroundedTask, "id" | "createdAt">) => GroundedTask;

  // Submissions
  submissions: AssignmentSubmission[];
  submitAssignment: (taskId: string, content: string, attachmentName?: string) => void;
  gradeSubmission: (submissionId: string, grade: number, feedback: string) => void;
  gradeAssignmentSubmission: (submissionId: string, grade: number, feedback: string) => void;

  // Blockchain Credentials
  credentials: BlockchainCredential[];
  mintCredential: (studentId: string, classroomId: string, competencyTitle: string, score: number) => Promise<BlockchainCredential>;
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
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER) || "";
    } catch {
      return "";
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === "true";
    } catch {
      return false;
    }
  });
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
      // Local optimistic update
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== currentUser.id) return u;
          const curProg = { ...(u.learningProgress || { visual: 0, audio: 0, practice: 0 }) };
          if (type === "visual") curProg.visual = Math.min(100, (curProg.visual || 0) + 15);
          if (type === "audio") curProg.audio = Math.min(100, (curProg.audio || 0) + 20);
          if (type === "practice") curProg.practice = Math.min(100, (curProg.practice || 0) + 20);
          return { ...u, learningProgress: curProg };
        })
      );
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

  // Auto-sync with FastAPI backend on mount
  useEffect(() => {
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

        if (backendUsers !== null && backendUsers.length > 0) {
          const normalized = backendUsers.map(normalizeUser);
          setUsers(normalized);

          // Preserve active user if stored in localStorage, otherwise pick the first user
          const storedUid = localStorage.getItem(STORAGE_KEYS.USER);
          if (storedUid && normalized.some((u) => u.id === storedUid)) {
            setCurrentUserId(storedUid);
          } else if (storedUid && !normalized.some((u) => u.id === storedUid)) {
            // keep currentUserId as is
          } else if (!storedUid && normalized.length > 0) {
            setCurrentUserId(normalized[0].id);
          }
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
  }, []);

  // Load from local storage if available
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (savedAuth === "true") setIsAuthenticated(true);

      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) setCurrentUserId(savedUser);

      const savedCreds = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (savedCreds) setCredentials(JSON.parse(savedCreds));

      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (savedTasks) setTasks(JSON.parse(savedTasks));

      const savedDocs = localStorage.getItem(STORAGE_KEYS.DOCS);
      if (savedDocs) setDocuments(JSON.parse(savedDocs));

      const savedSubs = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (savedSubs) setSubmissions(JSON.parse(savedSubs));
    } catch {
      // safe fallback
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

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || DEFAULT_EMPTY_USER;

  const login = (identifier: string, password?: string): { success: boolean; user?: User; message?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, message: "Harap masukkan email, NISN, atau NIP." };
    }

    // Find matching user by email, id, or partial name
    const foundUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId ||
        u.name.toLowerCase().includes(cleanId)
    );

    if (!foundUser) {
      return { success: false, message: "Akun tidak terdaftar. Periksa kembali kredensial Anda." };
    }

    setCurrentUserId(foundUser.id);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, "true");
      localStorage.setItem(STORAGE_KEYS.USER, foundUser.id);
    } catch {
      // safe fallback
    }

    // Background sync to backend
    ApiService.login(cleanId, password).catch(() => {});

    return { success: true, user: foundUser };
  };

  const registerUser = (data: {
    name: string;
    email: string;
    role: "SISWA" | "GURU" | "ORTU";
    password?: string;
    grade?: number;
  }): { success: boolean; user?: User; message?: string } => {
    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();

    if (!cleanName) {
      return { success: false, message: "Harap masukkan nama lengkap Anda." };
    }
    if (!cleanEmail) {
      return { success: false, message: "Harap masukkan alamat email Anda." };
    }

    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: "Email ini sudah terdaftar. Silakan langsung masuk." };
    }

    const initials = cleanName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newUser: User = {
      id: `user_${data.role.toLowerCase()}_${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      role: data.role,
      avatar: initials || data.role.slice(0, 2),
      grade: data.role === "SISWA" ? (data.grade || 10) : undefined,
      learningStyle: undefined,
      xpTotal: data.role === "SISWA" ? 100 : 0,
      streakDays: 1,
      hearts: 5,
      currentDDALevel: "BASIC",
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUserId(newUser.id);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, "true");
      localStorage.setItem(STORAGE_KEYS.USER, newUser.id);
    } catch {
      // safe fallback
    }

    // Background sync to backend FastAPI / Database
    ApiService.registerUser({
      name: cleanName,
      email: cleanEmail,
      role: data.role,
      password: data.password,
      grade: data.grade,
    }).then((res) => {
      if (res && res.user) {
        const backendUser = normalizeUser(res.user);
        setUsers((prev) => [backendUser, ...prev.filter((u) => u.id !== newUser.id && u.id !== backendUser.id)]);
        setCurrentUserId(backendUser.id);
        try {
          localStorage.setItem(STORAGE_KEYS.USER, backendUser.id);
        } catch {}
      }
    }).catch(() => {});

    return { success: true, user: newUser };
  };

  const loginWithClassCode = (
    studentName: string,
    classCode: string
  ): { success: boolean; user?: User; message?: string; isNewStudent?: boolean } => {
    const cleanName = studentName.trim();
    const cleanCode = classCode.trim().toUpperCase();

    if (!cleanName) {
      return { success: false, message: "Harap masukkan nama lengkap siswa." };
    }
    if (!cleanCode) {
      return { success: false, message: "Harap masukkan 6 digit kode kelas." };
    }

    const targetClass = classrooms.find((c) => c.joinCode.toUpperCase() === cleanCode);
    if (!targetClass) {
      return { success: false, message: "Kode kelas tidak ditemukan. Minta kode 6-digit dari guru Anda." };
    }

    // Check if student with same name exists, else create new
    let studentUser = users.find(
      (u) => u.role === "SISWA" && u.name.toLowerCase() === cleanName.toLowerCase()
    );
    let isNew = false;

    if (!studentUser) {
      isNew = true;
      const initials = cleanName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      studentUser = {
        id: `user_siswa_${Date.now().toString(36)}`,
        name: cleanName,
        email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "")}@student.eduadapt.id`,
        role: "SISWA",
        avatar: initials || "ST",
        grade: targetClass.grade || 10,
        learningStyle: undefined, // Needs initial assessment!
        xpTotal: 100,
        streakDays: 1,
        hearts: 5,
        currentDDALevel: "BASIC",
      };
      setUsers((prev) => [studentUser!, ...prev]);

      // Persist new student user to backend database
      ApiService.createUser({
        id: studentUser.id,
        name: studentUser.name,
        email: studentUser.email,
        role: "SISWA",
        avatar: studentUser.avatar,
        grade: studentUser.grade,
        learning_style: "VISUAL",
        xp_total: 100,
        streak_days: 1,
        hearts: 5,
        current_dda_level: "BASIC",
      }).catch(() => {});
    }

    // Add to classroom if not already in
    if (!targetClass.studentIds.includes(studentUser.id)) {
      setClassrooms((prev) =>
        prev.map((c) =>
          c.id === targetClass.id
            ? { ...c, studentIds: [...c.studentIds, studentUser!.id] }
            : c
        )
      );
      ApiService.joinClassroom(cleanCode, studentUser.id).catch(() => {});
    }

    setCurrentUserId(studentUser.id);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, "true");
      localStorage.setItem(STORAGE_KEYS.USER, studentUser.id);
    } catch {
      // safe fallback
    }

    return { success: true, user: studentUser, isNewStudent: isNew || !studentUser.learningStyle };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      // safe fallback
    }
  };

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, userId);
    } catch {
      // safe fallback
    }
  };

  const updateCurrentUserProfile = (updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );

    // Persist profile changes directly to backend database
    if (currentUser.id) {
      ApiService.updateUserProfile(currentUser.id, {
        name: updates.name,
        email: updates.email,
        avatar: updates.avatar,
        grade: updates.grade,
        learning_style: updates.learningStyle,
        modality_scores: updates.modalityScores,
        processing_speed: updates.processingSpeed,
        xp_total: updates.xpTotal,
        streak_days: updates.streakDays,
        hearts: updates.hearts,
        current_dda_level: updates.currentDDALevel,
      }).catch((err) => {
        console.warn("[AppContext] Profile update backend sync error", err);
      });
    }
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
        if (res) {
          const norm = normalizeClassroom(res);
          setClassrooms((prev) => prev.map((c) => (c.id === newClass.id ? norm : c)));
        }
      })
      .catch(() => {});

    return newClass;
  };

  const createClassroom = (name: string, subject: string, grade: number = 10): Classroom => {
    return addClassroom(name, grade, subject);
  };

  const joinClassroom = (joinCode: string): { success: boolean; message: string } => {
    const target = classrooms.find(
      (c) => c.joinCode.toUpperCase() === joinCode.trim().toUpperCase()
    );
    if (!target) {
      return { success: false, message: "Kode kelas tidak ditemukan. Pastikan 6-karakter benar." };
    }
    if (target.studentIds.includes(currentUser.id)) {
      return { success: false, message: "Anda sudah terdaftar di dalam kelas ini." };
    }
    const updated = { ...target, studentIds: [...target.studentIds, currentUser.id] };
    setClassrooms((prev) => prev.map((c) => (c.id === target.id ? updated : c)));

    // Persist to backend
    ApiService.joinClassroom(joinCode, currentUser.id).catch(() => {});

    return { success: true, message: `Berhasil bergabung ke kelas ${target.name}!` };
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

    // Persist to backend
    try {
      const res = await ApiService.uploadDocument({
        classroom_id: classroomId,
        title,
        raw_text: rawText,
        summary: summary || newDoc.summary,
      });
      if (res) {
        const norm = normalizeDocument(res);
        setDocuments((prev) => prev.map((d) => (d.id === newDoc.id ? norm : d)));
        return norm;
      }
    } catch {
      // offline fallback
    }

    return newDoc;
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
      chunksCount: 1,
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
      if (res) {
        const norm = normalizeDocument(res);
        setDocuments((prev) => prev.map((d) => (d.id === tempDoc.id ? norm : d)));
        return norm;
      }
    } catch (err) {
      console.warn("[AppContext] uploadDocumentFile error", err);
    }

    return tempDoc;
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    ApiService.deleteDocument(docId).catch(() => {});
  };

  const createTask = (taskData: Omit<GroundedTask, "id" | "createdAt">): GroundedTask => {
    const newTask: GroundedTask = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === taskData.classroomId ? { ...c, tasksCount: c.tasksCount + 1 } : c
      )
    );

    // Persist to backend
    ApiService.createTask({
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
    })
      .then((res) => {
        if (res) {
          const norm = normalizeTask(res);
          setTasks((prev) => prev.map((t) => (t.id === newTask.id ? norm : t)));
        }
      })
      .catch(() => {});

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

  const gradeSubmission = (submissionId: string, grade: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, grade, feedback, status: "Graded" }
          : s
      )
    );

    // Persist to backend
    ApiService.gradeSubmission(submissionId, grade, feedback).catch(() => {});
  };

  const gradeAssignmentSubmission = gradeSubmission;

  const mintCredential = async (
    studentId: string,
    classroomId: string,
    competencyTitle: string,
    score: number
  ): Promise<BlockchainCredential> => {
    const student = users.find((u) => u.id === studentId);
    const cls = classrooms.find((c) => c.id === classroomId);

    const blockIndex = credentials.length + 1;
    const previousHash =
      credentials.length > 0
        ? credentials[credentials.length - 1].blockHash
        : GENESIS_BLOCK_HASH;

    const certCode = `KOG-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const blockHash = await generateBlockHash(
      blockIndex,
      previousHash,
      studentId,
      certCode,
      score,
      timestamp
    );

    const transactionId = await generateTransactionId(blockHash, certCode);

    const newCert: BlockchainCredential = {
      id: `cred_${Date.now()}`,
      certificateId: certCode,
      studentId,
      studentName: student ? student.name : "Siswa EduAdapt",
      classroomId,
      className: cls ? cls.name : "Kelas Adaptif",
      competencyTitle,
      score,
      blockIndex,
      previousHash,
      blockHash,
      transactionId,
      verifiedBy: "Universitas Udayana & Riset Fundamental HPF",
      issuedAt: timestamp,
    };

    setCredentials((prev) => {
      const updated = [newCert, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updated));
      } catch {
        // safe
      }
      return updated;
    });

    // Persist to backend
    try {
      const res = await ApiService.mintCredential({
        student_id: studentId,
        classroom_id: classroomId,
        competency_title: competencyTitle,
        score,
      });
      if (res) {
        const norm = normalizeCredential(res);
        setCredentials((prev) => prev.map((c) => (c.id === newCert.id ? norm : c)));
        return norm;
      }
    } catch {
      // safe fallback
    }

    return newCert;
  };

  const mintNewCredential = (newCert: BlockchainCredential) => {
    setCredentials((prev) => {
      const updated = [newCert, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updated));
      } catch {
        // safe
      }
      return updated;
    });
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
      const [backendClassrooms, backendDocs, backendTasks, backendCreds] = await Promise.all([
        ApiService.getClassrooms(),
        ApiService.getDocuments(),
        ApiService.getTasks(),
        ApiService.getCredentials(),
      ]);

      if (backendClassrooms && backendClassrooms.length > 0) {
        setClassrooms(backendClassrooms);
      }
      if (backendDocs && backendDocs.length > 0) {
        setDocuments(backendDocs);
      }
      if (backendTasks && backendTasks.length > 0) {
        setTasks(backendTasks);
      }
      if (backendCreds && backendCreds.length > 0) {
        setCredentials(backendCreds);
      }
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
