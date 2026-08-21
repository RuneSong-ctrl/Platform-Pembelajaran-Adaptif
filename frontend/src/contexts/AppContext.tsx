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

interface AppContextType {
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

  // Parent Notes
  notes: ParentTeacherNote[];
  sendNote: (receiverId: string, studentId: string, message: string) => void;
  sendParentTeacherNote: (receiverId: string, studentId: string, message: string) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
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
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>("user_ayu_01");
  const [classrooms, setClassrooms] = useState<Classroom[]>(MOCK_CLASSROOMS);
  const [documents, setDocuments] = useState<GroundedDocument[]>(MOCK_GROUNDED_DOCUMENTS);
  const [tasks, setTasks] = useState<GroundedTask[]>(MOCK_TASKS);
  const [credentials, setCredentials] = useState<BlockchainCredential[]>(MOCK_CREDENTIALS);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(MOCK_SUBMISSIONS);
  const [notes, setNotes] = useState<ParentTeacherNote[]>(MOCK_NOTES);
  const [offlinePackages, setOfflinePackages] = useState<OfflinePackage[]>(MOCK_OFFLINE_PACKAGES);

  const [userMood, setUserMood] = useState<"Great" | "Good" | "Okay" | "Tired" | null>(null);
  const [studyTimeMinutes, setStudyTimeMinutes] = useState<number>(35);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const DEFAULT_SCHEDULES: LearningScheduleItem[] = [
    {
      id: "sch_1",
      studentId: "user_ayu_01",
      day: "Jumat",
      time: "16:00 - 16:30",
      duration: "30 mnt",
      title: "Bab 3: Eksplorasi Diagram & Reaksi Enzim",
      format: "Visual",
      completed: true,
    },
    {
      id: "sch_2",
      studentId: "user_ayu_01",
      day: "Sabtu",
      time: "10:00 - 10:45",
      duration: "45 mnt",
      title: "Evaluasi Adaptif Kuis DDA Bab 3",
      format: "Kuis",
      completed: false,
    },
    {
      id: "sch_3",
      studentId: "user_ayu_01",
      day: "Minggu",
      time: "19:00 - 19:30",
      duration: "30 mnt",
      title: "Persiapan Materi Bab 4 Sistem Peredaran Darah",
      format: "Visual",
      completed: false,
    },
  ];

  const [learningSchedules, setLearningSchedules] = useState<LearningScheduleItem[]>(DEFAULT_SCHEDULES);

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

  const toggleLearningSchedule = (id: string) => {
    setLearningSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  // Load from local storage if available
  useEffect(() => {
    try {
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

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

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
      studentIds: ["user_ayu_01", "user_budi_02"],
      documentsCount: 0,
      tasksCount: 0,
      createdAt: new Date().toISOString(),
    };
    setClassrooms((prev) => [newClass, ...prev]);
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
    return newDoc;
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
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
  };

  const gradeSubmission = (submissionId: string, grade: number, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, grade, feedback, status: "Graded" }
          : s
      )
    );
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

  const sendNote = (receiverId: string, studentId: string, message: string) => {
    const receiver = users.find((u) => u.id === receiverId);
    const student = users.find((u) => u.id === studentId);

    const newNote: ParentTeacherNote = {
      id: `note_${Date.now()}`,
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
    await new Promise((resolve) => setTimeout(resolve, 1500));
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
