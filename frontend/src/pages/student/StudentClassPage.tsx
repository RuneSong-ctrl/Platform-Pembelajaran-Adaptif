import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { audioSynth } from "@/services/audioSynth";
import {
  Plus,
  FileText,
  UploadCloud,
  School,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Layers,
} from "@/components/ui/icons";

export default function StudentClassPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    classrooms,
    joinClassroom,
    tasks,
    submitAssignment,
    submissions,
  } = useApp();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinMessage, setJoinMessage] = useState<{ success: boolean; message: string } | null>(null);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState("");

  const studentClasses = classrooms.filter((c) =>
    c.studentIds.includes(currentUser.id)
  );

  const handleJoin = () => {
    if (!joinCodeInput) return;
    audioSynth.playClickSound();
    const res = joinClassroom(joinCodeInput);
    setJoinMessage(res);
    if (res.success) {
      audioSynth.playSuccessSound();
      setTimeout(() => {
        setJoinModalOpen(false);
        setJoinCodeInput("");
        setJoinMessage(null);
      }, 1200);
    } else {
      audioSynth.playErrorSound();
    }
  };

  const handleOpenSubmit = (task: any) => {
    audioSynth.playClickSound();
    setActiveTask(task);
    setSubmissionText("");
    setSubmitModalOpen(true);
  };

  const handleSendSubmission = () => {
    if (!activeTask || !submissionText) return;
    audioSynth.playSuccessSound();
    submitAssignment(activeTask.id, submissionText, "Tugas_Catatan_Mandiri.pdf");
    setSubmitModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col pb-24 md:pb-8">
      <Navbar />

      <div className="flex flex-1">
        <StudentSidebar />

        <main className="flex-1 w-full max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5">
        {/* Top Header & Back Action */}
        <div className="flex items-center justify-between">
          <Link
            to="/student"
            onClick={() => audioSynth.playClickSound()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-2xs text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Beranda</span>
          </Link>

          <button
            onClick={() => {
              audioSynth.playClickSound();
              setJoinModalOpen(true);
            }}
            className="clay-btn clay-btn-dark px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gabung Kelas</span>
          </button>
        </div>

        {/* Page Title */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
              Rombel &amp; Aktivitas
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#010105]">
            Ruang Kelas Belajar
          </h1>
          <p className="text-xs text-[#5A5E70] font-medium mt-0.5">
            Daftar kelas terdaftar dan overview tugas aktif dari guru.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 1. DAFTAR KELAS (List Kelas Besar & Jelas)               */}
        {/* ========================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8]">
              Kelas Terdaftar ({studentClasses.length})
            </h2>
          </div>

          <div className="space-y-3">
            {studentClasses.map((cls, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={cls.id}
                  className={`clay-card p-4 sm:p-5 text-[#1C1E26] space-y-3.5 transition-all ${
                    isFirst ? "clay-lavender border-[#4B3B7A]/20" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                          isFirst ? "bg-white text-[#4B3B7A]" : "clay-card clay-sky text-[#21518A]"
                        }`}
                      >
                        <School className="w-6 h-6" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-white/90 text-[#4B3B7A] text-[10px] font-extrabold font-mono border border-[rgba(28,30,38,0.06)]">
                            KODE: {cls.joinCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D] text-[10px] font-extrabold">
                            Kelas {cls.grade}-A
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-black text-[#010105] truncate">
                          {cls.name}
                        </h3>
                        <p className="text-xs text-[#5A5E70] font-medium flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Pengajar: {cls.teacherName}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Class Meta Metrics Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 text-center text-xs">
                    <div className="bg-white/70 p-2 rounded-xl border border-[rgba(28,30,38,0.04)]">
                      <span className="font-black text-[#010105] block">
                        {cls.documentsCount || 4} Modul
                      </span>
                      <span className="text-[10px] text-[#5A5E70] font-medium">
                        Grounding RAG
                      </span>
                    </div>

                    <div className="bg-white/70 p-2 rounded-xl border border-[rgba(28,30,38,0.04)]">
                      <span className="font-black text-[#010105] block">
                        {cls.tasksCount || 6} Aktivitas
                      </span>
                      <span className="text-[10px] text-[#5A5E70] font-medium">
                        Tugas &amp; Kuis
                      </span>
                    </div>
                  </div>

                  {/* Direct Shortcut to Class Material */}
                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      navigate("/student/learn");
                    }}
                    className="clay-btn clay-btn-white w-full py-2.5 px-3 rounded-xl text-xs font-black text-[#1C1E26] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer hover:bg-white"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Buka Materi Kurikulum Kelas</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. OVERVIEW TUGAS & KUIS (List Kecil Shortcut)            */}
        {/* ========================================================= */}
        <section className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9195A8] block">
                Ringkasan Tugas
              </span>
              <h3 className="text-sm font-extrabold text-[#010105]">
                Overview Kuis &amp; Penugasan
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#5A5E70]">
              {tasks.length} Total Aktivitas
            </span>
          </div>

          {/* Compact Mini List Rows */}
          <div className="bg-white rounded-2xl border border-[rgba(28,30,38,0.07)] shadow-xs divide-y divide-[rgba(28,30,38,0.05)] overflow-hidden">
            {tasks.map((task) => {
              const mySub = submissions.find(
                (s) => s.taskId === task.id && s.studentId === currentUser.id
              );
              const isQuiz = task.type === "quiz" || task.type === "exam";

              return (
                <div
                  key={task.id}
                  className="p-3 flex items-center justify-between gap-2.5 hover:bg-[#F8F9FD] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        isQuiz
                          ? "bg-[#FFF6DF] text-[#785308]"
                          : "bg-[#FDF0EF] text-[#852C28]"
                      }`}
                    >
                      {isQuiz ? (
                        <Sparkles className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase text-[#9195A8]">
                          {task.type}
                        </span>
                        <span className="text-[9px] text-[#5A5E70] font-medium">
                          • {task.sourceReference || "Bab 3"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#010105] truncate">
                        {task.title}
                      </h4>
                    </div>
                  </div>

                  {/* Status & Mini Action Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {mySub ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EBF6F2] text-[#1D5E4D] hidden sm:inline-block">
                        {mySub.status === "Graded" ? `Nilai: ${mySub.grade}` : "Dikumpul"}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FDF0EF] text-[#852C28] hidden sm:inline-block">
                        Belum
                      </span>
                    )}

                    {isQuiz ? (
                      <button
                        onClick={() => {
                          audioSynth.playClickSound();
                          navigate("/quiz");
                        }}
                        className="clay-btn clay-btn-dark px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs cursor-pointer"
                      >
                        Mulai
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenSubmit(task)}
                        className="clay-btn clay-btn-white px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#1C1E26] shadow-2xs cursor-pointer border border-[rgba(28,30,38,0.08)]"
                      >
                        {mySub ? "Revisi" : "Kumpul"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>

      {/* JOIN CLASS MODAL */}
      <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
        <DialogContent className="max-w-sm p-6 bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#010105]">
              Gabung Kelas Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A5E70]">
              Masukkan 6-digit kode kelas dari guru (misal: UDU802 atau MAT714).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-3">
            <div>
              <Input
                placeholder="CONTOH: UDU802"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="font-mono text-center tracking-widest text-base font-black uppercase rounded-2xl h-11"
                maxLength={6}
              />
            </div>
            {joinMessage && (
              <p
                className={`text-xs font-bold text-center ${
                  joinMessage.success ? "text-[#1D5E4D]" : "text-[#852C28]"
                }`}
              >
                {joinMessage.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setJoinModalOpen(false)}
              className="clay-btn clay-btn-white px-4 py-2 rounded-xl text-xs font-bold text-[#5A5E70] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleJoin}
              className="clay-btn clay-btn-dark px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              Gabung Sekarang
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUBMIT ASSIGNMENT MODAL */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl">
          {activeTask && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-black text-[#010105]">
                  Kumpulkan: {activeTask.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#5A5E70]">
                  {activeTask.contentJson?.instructions}
                </DialogDescription>
              </DialogHeader>

              <div>
                <label className="block text-xs font-bold text-[#010105] mb-1">
                  Teks Jawaban / Analisis Mandiri
                </label>
                <textarea
                  rows={4}
                  placeholder="Ketik uraian jawaban tugasmu di sini..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.1)] bg-[#F8F9FD] text-xs font-medium text-[#010105] focus:outline-none focus:ring-2 focus:ring-[#010105] placeholder:text-[#9195A8]"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#F0EEF6] flex items-center justify-between text-xs font-medium text-[#5A5E70]">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <UploadCloud className="w-3.5 h-3.5 text-[#010105]" />
                  Lampiran Catatan
                </span>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-md">
                  Tugas_Catatan_Mandiri.pdf
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setSubmitModalOpen(false)}
                  className="clay-btn clay-btn-white px-4 py-2 rounded-xl text-xs font-bold text-[#5A5E70] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSendSubmission}
                  disabled={!submissionText}
                  className={`clay-btn px-4 py-2 rounded-xl text-xs font-bold ${
                    submissionText
                      ? "clay-btn-dark text-white cursor-pointer"
                      : "bg-[#E4E2DD] text-[#9195A8] cursor-not-allowed"
                  }`}
                >
                  Kirim ke Guru
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
