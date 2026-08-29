/**
 * Definisi Type Lengkap EduAdapt
 * Sesuai SPEC.md, PRD.md, dan Final Master Project Context
 */

export type UserRole = "SISWA" | "GURU" | "ORTU";

export type ModalityType = "VISUAL" | "AUDITORI" | "KINESTETIK";

export type DDALevel = "BASIC" | "MEDIUM" | "CHALLENGING" | "MASTERY";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  grade?: number; // 1-12
  // Student Specific
  learningStyle?: ModalityType;
  modalityScores?: {
    visual: number; // 0 - 100% (Initial AI Diagnostic Predisposition)
    audio: number; // 0 - 100%
    practice: number; // 0 - 100%
  };
  learningProgress?: {
    visual: number; // 0 - 100% (Real Ongoing Learning Activity Progress)
    audio: number; // 0 - 100%
    practice: number; // 0 - 100%
    visualCompleted?: number;
    visualTotal?: number;
    audioMinutes?: number;
    audioCompleted?: number;
    practiceCompleted?: number;
    practiceTotal?: number;
  };
  processingSpeed?: "FAST" | "MODERATE" | "DELIBERATE";
  xpTotal?: number;
  streakDays?: number;
  hearts?: number; // 1 - 5
  currentDDALevel?: DDALevel;
  // Parent Specific
  childrenIds?: string[];
  // Teacher Specific
  subjectSpecialization?: string;
}

export interface VisualAnalyticsParams {
  spatialRetentionPct: number;
  scanSpeedSecPerNode: number;
  infographicAccuracyPct: number;
  mindmapExploredCount: number;
  mindmapTotalCount: number;
  visualProgressPct: number;
  statusLabel?: string;
}

export interface AuditoryAnalyticsParams {
  totalListeningMinutes: number;
  targetListeningMinutes: number;
  verbalRetentionPct: number;
  focusStabilityPct: number;
  idealPlaybackSpeed: number;
  sessionsCompleted: number;
  audioProgressPct: number;
  statusLabel?: string;
}

export interface KinestheticAnalyticsParams {
  labAccuracyPct: number;
  trialErrorIterations: number;
  missionSpeedMinutes: number;
  ddaProblemSolvingLevel: string;
  missionsCompleted: number;
  missionsTotal: number;
  practiceProgressPct: number;
  statusLabel?: string;
}

export interface LearningStyleAnalytics {
  studentId: string;
  learningStyle: ModalityType;
  currentDDALevel: string;
  xpTotal: number;
  accuracyAvgPct: number;
  visualParams: VisualAnalyticsParams;
  auditoryParams: AuditoryAnalyticsParams;
  kinestheticParams: KinestheticAnalyticsParams;
  updatedAt?: string;
}

export interface Classroom {
  id: string;
  name: string;
  grade: number;
  subject: string;
  joinCode: string; // e.g. "UDU802"
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  documentsCount: number;
  tasksCount: number;
  createdAt: string;
}

export interface LearningScheduleItem {
  id: string;
  studentId: string;
  day: string; // e.g. "Senin", "Jumat", "Sabtu"
  time: string; // e.g. "16:00 - 16:30"
  duration: string; // e.g. "30 mnt"
  title: string; // e.g. "Bab 3: Enzim & Sistem Pencernaan"
  format: "Visual" | "Audio" | "Praktik" | "Kuis";
  completed: boolean;
}

export interface GroundedDocument {
  id: string;
  classroomId: string;
  title: string;
  fileUrl?: string;
  rawText: string;
  chunksCount: number;
  vectorId: string;
  status: "PROCESSING" | "READY" | "ERROR";
  uploadedAt: string;
  summary?: string;
  podcastScript?: string;
  podcastAudioUrl?: string;
  podcastEpisodesJson?: string;
  mindmapCode?: string;
  visualImageUrl?: string;
  visualNodesJson?: string;
  flashcardsJson?: string;
  karaokeJson?: string;
  gameConfigJson?: string;
  fillBlankJson?: string;
  sortingChallengesJson?: string;
}

export interface PodcastEpisode {
  id: string;
  order: number;
  title: string;
  description: string;
  script: string;
  audioUrl?: string;
  durationSec?: number;
}

export interface SortingChallenge {
  id: string;
  instruction: string;
  items: string[];
  correctOrder: number[];
  hint?: string;
  explanation?: string;
}

export interface ReactFlowNodeData {
  id: string;
  title: string;
  category: string;
  shortDefinition: string;
  detailedExplanation?: string;
  keyPrinciples: string[];
  realWorldAnalogy: string;
  visualMetaphor?: string;
  practicalApplications: string[];
  connections?: string[];
  position?: { x: number; y: number };
  comparisonWithOtherNodes?: {
    targetNode: string;
    differences: string;
    similarities: string;
  }[];
}

export interface FillBlankItem {
  id: string;
  sentence: string; // Kalimat dengan placeholder '[BLANK]'
  blankWord: string; // Kata jawaban yang tepat
  options: string[]; // Pilihan kata (jawaban benar + pengecoh)
  hint?: string;
  explanation?: string;
}

export interface KaraokeSegment {
  id: string;
  startSec: number;
  endSec: number;
  speaker: string;
  role?: "host" | "expert" | string;
  text: string;
}

export interface VisualNodeDetail {
  id: string;
  title: string;
  category: string;
  shortDefinition: string;
  detailedExplanation?: string;
  keyPrinciples: string[];
  realWorldAnalogy: string;
  visualMetaphor?: string;
  connections?: string[];
  position?: { x: number; y: number };
  comparisonWithOtherNodes?: {
    targetNode: string;
    differences: string;
    similarities: string;
  }[];
  practicalApplications: string[];
}

export interface GameCollectible {
  id: string;
  label: string;
  category: "nutrient" | "toxic" | "catalyst" | "concept-correct" | "concept-trap";
  points: number;
  speed: number;
  feedback: string;
  color: string;
}

export interface GameVariable {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  optimalRange: [number, number];
  explanation: string;
}

export interface GameConfig {
  gameTitle: string;
  gameType: "bio-quest" | "reactor-sim" | "universal-quest";
  theme: {
    heroName: string;
    arenaBackground: string;
    heroSprite: string;
    missionObjective: string;
  };
  collectorGame?: {
    playerSpeed: number;
    targetScore: number;
    timeLimitSec: number;
    collectibles: GameCollectible[];
  };
  variableSimulator?: {
    simTitle: string;
    description: string;
    variables: GameVariable[];
    reactionOutputFormulaName: string;
    optimalConditionsSummary: string;
    dynamicObservations: {
      condition: string;
      status: "optimal" | "denatured" | "inactive" | "hyperactive";
      ratePercent: number;
      visualStateColor: string;
      narrativeFeedback: string;
    }[];
  };
  reactorDragDrop?: {
    reactorTitle: string;
    instruction: string;
    slots: {
      id: string;
      name: string;
      acceptedItemId: string;
      description: string;
    }[];
    components: {
      id: string;
      label: string;
      type: string;
      hint: string;
    }[];
  };
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  difficulty: DDALevel;
  sourceReference: string; // e.g. "BAB 3 Hal 45 Modul Guru"
  explanation: {
    analogi: string;
    visual: string;
    langkah: string;
  };
}

export interface GroundedTask {
  id: string;
  classroomId: string;
  classroomName: string;
  type: "material" | "quiz" | "exam" | "assignment";
  title: string;
  chapter?: string;
  sourceReference: string;
  difficultyLevel: DDALevel;
  isPublished: boolean;
  dueDate?: string;
  // Content detail
  contentJson?: {
    overview?: string;
    questions?: QuizQuestion[];
    instructions?: string;
    maxScore?: number;
    visualDiagramSvg?: string;
    audioChapters?: {
      title: string;
      duration: string;
      transcript: string;
      url?: string;
    }[];
    kinestheticSimulation?: {
      title: string;
      instructions: string;
      items: { id: string; name: string; targetZone: string }[];
      zones: { id: string; name: string }[];
    };
  };
  createdAt: string;
}

export interface DDATransition {
  questionIndex: number;
  fromLevel: DDALevel;
  toLevel: DDALevel;
  isCorrect: boolean;
  responseTimeSec: number;
  action: "LEVEL_UP" | "LEVEL_DOWN" | "MAINTAIN" | "OFFER_HINT";
}

export interface StudentProgress {
  id: string;
  studentId: string;
  studentName: string;
  taskId: string;
  taskTitle: string;
  score: number;
  accuracy: number;
  timeSpentSec: number;
  ddaHistory: DDATransition[];
  completedAt: string;
  isPassed: boolean;
}

export interface BlockchainCredential {
  id: string;
  certificateId: string; // "KOG-2026-X7A9"
  studentId: string;
  studentName: string;
  classroomId: string;
  className: string;
  competencyTitle: string;
  score: number;
  blockIndex: number;
  previousHash: string;
  blockHash: string;
  transactionId: string;
  verifiedBy: string; // "Universitas Udayana & Riset Fundamental"
  issuedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  attachmentName?: string;
  status: "Submitted" | "Late" | "Returned" | "Graded";
  grade?: number;
  feedback?: string;
}

export interface ParentTeacherNote {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  studentId: string;
  studentName: string;
  message: string;
  sentAt: string;
  reply?: string;
  replyAt?: string;
}

export interface OfflinePackage {
  id: string;
  title: string;
  subject: string;
  sizeMb: number;
  itemsCount: number;
  isDownloaded: boolean;
  syncStatus: "Synced" | "Waiting to Sync" | "Synchronizing" | "Offline Ready";
}
