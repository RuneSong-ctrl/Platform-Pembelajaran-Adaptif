import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
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
  Users,
  Database,
  CheckCircle2,
  TrendingUp,
  Plus,
  School,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Award,
} from "@/components/ui/icons";

export default function TeacherDashboardPage() {
  const {
    classrooms,
    createClassroom,
    documents,
    submissions,
    gradeAssignmentSubmission,
  } = useApp();

  const [createClassModalOpen, setCreateClassModalOpen] = useState(false);
  const [classNameInput, setClassNameInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("Biologi");
  const [gradeInput, setGradeInput] = useState(10);

  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState(90);
  const [gradeFeedback, setGradeFeedback] = useState("");

  const handleCreateClass = () => {
    if (!classNameInput) return;
    audioSynth.playSuccessSound();
    createClassroom(classNameInput, subjectInput, gradeInput);
    setCreateClassModalOpen(false);
    setClassNameInput("");
  };

  const handleOpenGrade = (sub: any) => {
    setActiveSubmission(sub);
    setGradeScore(sub.grade || 85);
    setGradeFeedback(sub.feedback || "Analisis konsep sangat mendalam dan akurat.");
    setGradingModalOpen(true);
  };

  const handleSaveGrade = () => {
    if (!activeSubmission) return;
    audioSynth.playSuccessSound();
    gradeAssignmentSubmission(activeSubmission.id, Number(gradeScore), gradeFeedback);
    setGradingModalOpen(false);
  };

  const totalStudents = classrooms.reduce((acc, c) => acc + c.studentIds.length, 0);

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        {/* Responsive Desktop Sidebar for Teacher */}
        <TeacherSidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="clay-pill clay-mint px-3 py-0.5 text-xs font-extrabold text-[#1D5E4D]">
                  Command Center Pengajar
                </span>
                <span className="clay-pill clay-lavender px-3 py-0.5 text-xs font-bold text-[#4B3B7A]">
                  Tahun Ajaran 2026/2027
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">
                Ringkasan Kelas &amp; Analitik Pembelajaran
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-1">
                Kelola rombongan belajar, ekstraksi materi buku ajar guru, dan evaluasi hasil belajar siswa secara adaptif.
              </p>
            </div>

            <button
              onClick={() => {
                audioSynth.playClickSound();
                setCreateClassModalOpen(true);
              }}
              className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Rombel Baru</span>
            </button>
          </div>

          {/* 4 KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="clay-card clay-card-hover clay-white p-5 space-y-2">
              <div className="flex justify-between items-center text-[#5A5E70]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9195A8]">
                  Total Siswa Aktif
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#010105]">{totalStudents}</p>
              <span className="clay-pill clay-mint text-[10px] font-extrabold px-2.5 py-0.5 text-[#1D5E4D] inline-block">
                {classrooms.length} Rombel Terhubung
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-2">
              <div className="flex justify-between items-center text-[#5A5E70]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9195A8]">
                  Dokumen RAG Terindeks
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#E0DAF5] text-[#4B3B7A] flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#010105]">{documents.length}</p>
              <span className="clay-pill clay-lavender text-[10px] font-extrabold px-2.5 py-0.5 text-[#4B3B7A] inline-block">
                {documents.reduce((acc, d) => acc + (d.chunksCount || 1), 0)} Vektor Tersemat
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-2">
              <div className="flex justify-between items-center text-[#5A5E70]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9195A8]">
                  Tugas Perlu Dinilai
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#FEE7B3] text-[#785308] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#010105]">{submissions.length}</p>
              <span className="clay-pill clay-butter text-[10px] font-extrabold px-2.5 py-0.5 text-[#785308] inline-block">
                {submissions.filter((s) => !s.grade).length} Menunggu Review
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-2">
              <div className="flex justify-between items-center text-[#5A5E70]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9195A8]">
                  Total Tugas &amp; Kuis
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#D4E8FC] text-[#21518A] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#010105]">
                {classrooms.reduce((acc, c) => acc + (c.tasksCount || 0), 0)}
              </p>
              <span className="clay-pill clay-sky text-[10px] font-extrabold px-2.5 py-0.5 text-[#21518A] inline-block">
                Diterbitkan Guru
              </span>
            </div>
          </div>

          {/* CLASSROOMS LIST */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#010105]">
                  Daftar Rombel &amp; Kode Akses Siswa
                </h2>
                <p className="text-xs text-[#5A5E70]">
                  Gunakan kode gabung untuk menambahkan siswa ke rombel yang sesuai.
                </p>
              </div>
              <span className="clay-pill clay-white text-xs font-bold text-[#5A5E70] px-3 py-1">
                {classrooms.length} Rombel Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {classrooms.map((cls) => (
                <div
                  key={cls.id}
                  className="clay-card clay-card-hover clay-white p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3.5">
                      <div className="clay-card clay-lavender w-12 h-12 rounded-2xl flex items-center justify-center text-[#4B3B7A] shrink-0">
                        <School className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-[#010105]">{cls.name}</h3>
                        <p className="text-xs text-[#5A5E70] font-medium">
                          Mata Pelajaran: {cls.subject} (Kelas {cls.grade})
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#9195A8] font-bold block uppercase">
                        Kode Gabung
                      </span>
                      <span className="clay-pill clay-dark px-3 py-1 font-mono text-xs font-black tracking-widest inline-block mt-0.5">
                        {cls.joinCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs font-bold text-[#5A5E70]">
                    <div className="clay-pill bg-[#F8F9FD] p-2.5 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#1D5E4D]" />
                      <span>{cls.studentIds.length} Siswa Terdaftar</span>
                    </div>
                    <div className="clay-pill bg-[#F8F9FD] p-2.5 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#4B3B7A]" />
                      <span>{cls.documentsCount || 0} Modul Terindeks</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RECENT SUBMISSIONS & LIVE GRADING TABLE */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#010105]">
                  Pengumpulan Tugas &amp; Penilaian Siswa
                </h2>
                <p className="text-xs text-[#5A5E70]">
                  Verifikasi jawaban uraian dan berikan umpan balik adaptif langsung ke siswa.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="clay-card clay-card-hover clay-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`clay-pill text-[10px] font-extrabold px-2.5 py-0.5 ${
                          sub.status === "Graded"
                            ? "clay-mint text-[#1D5E4D]"
                            : "clay-butter text-[#785308]"
                        }`}
                      >
                        {sub.status === "Graded"
                          ? `Sudah Dinilai (${sub.grade}/100)`
                          : "Menunggu Penilaian"}
                      </span>
                      <span className="text-xs font-extrabold text-[#010105]">
                        {sub.studentName}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-[#010105]">
                      {sub.taskTitle}
                    </h4>
                    <p className="text-xs text-[#5A5E70]">
                      Lampiran: <span className="font-semibold text-[#1C1E26]">{sub.attachmentName}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenGrade(sub)}
                    className="clay-btn clay-btn-white px-4 py-2 text-xs font-black text-[#1C1E26] shrink-0 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{sub.status === "Graded" ? "Edit Nilai & Catatan" : "Beri Nilai & Feedback"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* CREATE CLASS MODAL */}
      <Dialog open={createClassModalOpen} onOpenChange={setCreateClassModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#010105]">
              Buat Rombel Kelas Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A5E70]">
              Tambahkan rombongan belajar baru untuk mengelola materi dan penugasan siswa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3">
            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Nama Rombel
              </label>
              <Input
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
                placeholder="Contoh: Biologi 10-C"
                className="rounded-xl text-xs font-medium bg-[#F8F9FD]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Mata Pelajaran
              </label>
              <Input
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="Biologi"
                className="rounded-xl text-xs font-medium bg-[#F8F9FD]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Tingkat Kelas
              </label>
              <Input
                type="number"
                value={gradeInput}
                onChange={(e) => setGradeInput(Number(e.target.value))}
                className="rounded-xl text-xs font-medium bg-[#F8F9FD]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setCreateClassModalOpen(false)}
              className="clay-btn clay-btn-white px-4 py-2 text-xs font-bold text-[#5A5E70] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleCreateClass}
              disabled={!classNameInput.trim()}
              className="clay-btn clay-btn-dark px-4 py-2 text-xs font-black text-white cursor-pointer"
            >
              Simpan Rombel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GRADING MODAL */}
      <Dialog open={gradingModalOpen} onOpenChange={setGradingModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#010105]">
              Penilaian &amp; Umpan Balik Guru
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A5E70]">
              Siswa: {activeSubmission?.studentName} • Tugas: {activeSubmission?.taskTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3">
            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Nilai Angka (Skala 0 - 100)
              </label>
              <Input
                type="number"
                value={gradeScore}
                onChange={(e) => setGradeScore(Number(e.target.value))}
                className="rounded-xl text-xs font-medium bg-[#F8F9FD]"
                min={0}
                max={100}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Umpan Balik &amp; Saran Pengayaan
              </label>
              <textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.1)] text-xs font-medium bg-[#F8F9FD] focus:outline-none"
                placeholder="Tuliskan apresiasi dan bagian materi yang perlu diperdalam siswa..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setGradingModalOpen(false)}
              className="clay-btn clay-btn-white px-4 py-2 text-xs font-bold text-[#5A5E70] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveGrade}
              className="clay-btn clay-btn-dark px-4 py-2 text-xs font-black text-white cursor-pointer"
            >
              Simpan &amp; Rilis Nilai
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
