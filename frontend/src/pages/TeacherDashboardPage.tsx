import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { audioSynth } from "@/services/audioSynth";
import {
  Users,
  Database,
  CheckCircle2,
  TrendingUp,
  Plus,
  School,
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
    setGradeFeedback(sub.feedback || "Analisis sangat baik.");
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
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19]">
      <Navbar />

      <div className="flex">
        <TeacherSidebar />

        <main className="flex-1 p-6 sm:p-10 max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="mint" className="text-xs">
                  Command Center Pengajar
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-[#010105]">
                Ringkasan Kelas &amp; Analitik RAG
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-0.5">
                Kelola rombongan belajar, ekstraksi materi buku ajar guru, dan evaluasi hasil belajar siswa.
              </p>
            </div>

            <Button
              onClick={() => setCreateClassModalOpen(true)}
              variant="primary"
              className="font-bold shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Buat Kelas Baru
            </Button>
          </div>

          {/* 4 KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[#5A5E70]">
                <span className="text-xs font-bold uppercase">Total Siswa Aktif</span>
                <Users className="w-4 h-4 text-[#1D5E4D]" />
              </div>
              <p className="text-3xl font-extrabold text-[#010105]">{totalStudents}</p>
              <span className="text-[11px] font-semibold text-[#1D5E4D]">2 Rombongan Belajar</span>
            </Card>

            <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[#5A5E70]">
                <span className="text-xs font-bold uppercase">Dokumen RAG Terindeks</span>
                <Database className="w-4 h-4 text-[#4B3B7A]" />
              </div>
              <p className="text-3xl font-extrabold text-[#010105]">{documents.length}</p>
              <span className="text-[11px] font-semibold text-[#4B3B7A]">44 Vektor Tersemat</span>
            </Card>

            <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[#5A5E70]">
                <span className="text-xs font-bold uppercase">Tugas Masuk</span>
                <CheckCircle2 className="w-4 h-4 text-[#785308]" />
              </div>
              <p className="text-3xl font-extrabold text-[#010105]">{submissions.length}</p>
              <span className="text-[11px] font-semibold text-[#785308]">Perlu Review</span>
            </Card>

            <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-2">
              <div className="flex justify-between items-center text-[#5A5E70]">
                <span className="text-xs font-bold uppercase">Rata-rata Akurasi</span>
                <TrendingUp className="w-4 h-4 text-[#21518A]" />
              </div>
              <p className="text-3xl font-extrabold text-[#010105]">88.5%</p>
              <span className="text-[11px] font-semibold text-[#21518A]">Tingkat DDA: Stabil</span>
            </Card>
          </div>

          {/* CLASSROOMS LIST */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#010105]">
              Daftar Rombel &amp; Kode Akses Siswa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {classrooms.map((cls) => (
                <Card key={cls.id} className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#E0DAF5] text-[#4B3B7A] flex items-center justify-center">
                        <School className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#010105]">{cls.name}</h3>
                        <p className="text-xs text-[#5A5E70] font-medium">Mata Pelajaran: {cls.subject}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#9195A8] font-bold block uppercase">Kode Gabung</span>
                      <Badge variant="slate" className="font-mono text-xs font-bold">
                        {cls.joinCode}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold text-[#5A5E70]">
                    <div className="p-2.5 rounded-2xl bg-[#FBF9F4]">
                      <span>{cls.studentIds.length} Siswa Terdaftar</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-[#FBF9F4]">
                      <span>{cls.documentsCount || 4} Modul Grounding</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* RECENT SUBMISSIONS & GRADING */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#010105]">
              Pengumpulan Tugas &amp; Catatan Siswa
            </h2>

            <div className="space-y-3">
              {submissions.map((sub) => (
                <Card
                  key={sub.id}
                  className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={sub.status === "Graded" ? "mint" : "butter"}
                        className="text-[10px]"
                      >
                        {sub.status === "Graded" ? `Sudah Dinilai (${sub.grade}/100)` : "Menunggu Penilaian"}
                      </Badge>
                      <span className="text-xs font-bold text-[#010105]">{sub.studentName}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#010105]">{sub.taskTitle}</h4>
                    <p className="text-xs text-[#5A5E70] mt-1 line-clamp-1">
                      Lampiran: {sub.attachmentName}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleOpenGrade(sub)}
                    variant="outline"
                    size="sm"
                    className="font-bold text-xs shrink-0 self-end sm:self-auto"
                  >
                    {sub.status === "Graded" ? "Edit Nilai & Umpan Balik" : "Beri Nilai & Feedback"}
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* CREATE CLASS MODAL */}
      <Dialog open={createClassModalOpen} onOpenChange={setCreateClassModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#010105]">
              Buat Rombel Kelas Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">Nama Rombel</label>
              <Input
                placeholder="Contoh: Biologi Kelas 10-B"
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">Mata Pelajaran</label>
              <Input
                placeholder="Contoh: Biologi"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setCreateClassModalOpen(false)} variant="ghost" size="sm">
              Batal
            </Button>
            <Button onClick={handleCreateClass} variant="primary" size="default" className="font-bold">
              Buat Kelas
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GRADING MODAL */}
      <Dialog open={gradingModalOpen} onOpenChange={setGradingModalOpen}>
        <DialogContent className="max-w-lg p-6 sm:p-8 bg-white rounded-3xl">
          {activeSubmission && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-[#010105]">
                  Penilaian: {activeSubmission.studentName}
                </DialogTitle>
              </DialogHeader>

              <div className="p-4 rounded-2xl bg-[#FBF9F4] text-xs font-medium text-[#5A5E70] leading-relaxed">
                <span className="font-bold text-[#010105] block mb-1">Jawaban Siswa:</span>
                {activeSubmission.content}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010105] mb-1">
                  Skor Nilai (0 - 100)
                </label>
                <Input
                  type="number"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  min={0}
                  max={100}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010105] mb-1">
                  Umpan Balik Guru (Feedback)
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.1)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#010105]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setGradingModalOpen(false)} variant="ghost">
                  Batal
                </Button>
                <Button onClick={handleSaveGrade} variant="primary" className="font-bold">
                  Simpan Nilai &amp; Kirim Feedback
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
