import { levelLabel } from "@/lib/utils";
import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  Flame,
  Award,
  Sparkles,
} from "@/components/ui/icons";

export default function GradebookPage() {
  const { users, credentials, classrooms, tasks, submissions, mintCredential } = useApp();

  const [isBatchMinting, setIsBatchMinting] = useState(false);
  const [mintSummary, setMintSummary] = useState<{ issued: number; skipped: number; failed: string[] } | null>(null);

  const students = users.filter((u) => u.role === "SISWA");
  const basicCount = students.filter((s) => s.currentDDALevel === "BASIC").length;
  const mediumCount = students.filter((s) => s.currentDDALevel === "MEDIUM").length;
  const challengingCount = students.filter((s) => s.currentDDALevel === "CHALLENGING").length;
  const masteryCount = students.filter((s) => s.currentDDALevel === "MASTERY").length;
  const primaryClass = classrooms[0];

  // Credential score = average of the student's graded work in this class. No grades, no credential.
  const classTaskIds = new Set(tasks.filter((t) => t.classroomId === primaryClass?.id).map((t) => t.id));
  const averageGrade = (studentId: string): number | null => {
    const grades = submissions
      .filter((s) => s.studentId === studentId && classTaskIds.has(s.taskId) && s.grade != null)
      .map((s) => s.grade as number);
    return grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10 : null;
  };
  const hasClassCert = (studentId: string) =>
    credentials.some((c) => c.studentId === studentId && c.classroomId === primaryClass?.id);

  const handleBatchMint = async () => {
    if (!primaryClass) return;
    setIsBatchMinting(true);
    setMintSummary(null);
    audioSynth.playClickSound();

    const summary = { issued: 0, skipped: 0, failed: [] as string[] };
    // Only students actually enrolled in the class; the ledger rejects anyone else.
    for (const st of students.filter((s) => primaryClass.studentIds?.includes(s.id))) {
      if (hasClassCert(st.id)) continue;
      const score = averageGrade(st.id);
      if (score === null) {
        summary.skipped++;
        continue;
      }
      try {
        await mintCredential(st.id, primaryClass.id, `Penguasaan Materi ${primaryClass.subject}`, score);
        summary.issued++;
      } catch (err) {
        summary.failed.push(`${st.name}: ${err instanceof Error ? err.message : "gagal"}`);
      }
    }

    setIsBatchMinting(false);
    setMintSummary(summary);
    if (summary.issued > 0) {
      audioSynth.playLevelUpSound();
      confetti({ disableForReducedMotion: true, particleCount: 90, spread: 70 });
    }
  };

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        {/* Responsive Desktop Sidebar */}
        <TeacherSidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="clay-pill clay-mint px-3 py-0.5 text-xs font-extrabold text-[#1D5E4D]">
                  Buku Nilai &amp; Analitik DDA
                </span>
                <span className="clay-pill clay-lavender px-3 py-0.5 text-xs font-bold text-[#4B3B7A]">
                  Ledger Sertifikat
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">
                Gradebook &amp; Live Classroom Analytics
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-1">
                Pantau sebaran tingkat penguasaan kompetensi DDA seluruh siswa, deteksi dini siswa butuh bimbingan, dan terbitkan kredensial blockchain massal.
              </p>
            </div>

            <button
              onClick={handleBatchMint}
              disabled={isBatchMinting || !primaryClass}
              title="Menerbitkan sertifikat untuk siswa yang sudah punya nilai tugas di kelas ini"
              className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isBatchMinting ? "Menerbitkan..." : "Terbitkan Sertifikat Kelas"}</span>
            </button>
          </div>

          {mintSummary && (
            <div
              role="status"
              className={`clay-card p-4 space-y-1 text-xs font-bold ${
                mintSummary.failed.length ? "bg-[#FDF0EF] text-[#852C28]" : "clay-mint text-[#1D5E4D]"
              }`}
            >
              <p className="flex items-center gap-2 font-black">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {mintSummary.issued} sertifikat terbit di {primaryClass?.name || "kelas"}
                {mintSummary.skipped > 0 && ` · ${mintSummary.skipped} siswa dilewati karena belum ada nilai`}
              </p>
              {mintSummary.failed.map((f) => (
                <p key={f} className="pl-6">Gagal: {f}</p>
              ))}
            </div>
          )}

          {/* DDA DISTRIBUTION CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="clay-card clay-card-hover clay-white p-5 space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase tracking-wider">
                Basic Level
              </span>
              <p className="text-2xl font-black text-[#010105]">{basicCount} Siswa</p>
              <span className="clay-pill clay-coral text-mini text-[#7A2420] font-bold px-2 py-0.5 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Perlu Bimbingan
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase tracking-wider">
                Medium Level
              </span>
              <p className="text-2xl font-black text-[#010105]">{mediumCount} Siswa</p>
              <span className="clay-pill clay-butter text-mini text-[#694503] font-bold px-2 py-0.5 inline-block">
                Progres Stabil
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase tracking-wider">
                Challenging Level
              </span>
              <p className="text-2xl font-black text-[#010105]">{challengingCount} Siswa</p>
              <span className="clay-pill clay-lavender text-mini text-[#4B3B7A] font-bold px-2 py-0.5 inline-block">
                Akselerasi Baik
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase tracking-wider">
                Mastery Level
              </span>
              <p className="text-2xl font-black text-[#010105]">{masteryCount} Siswa</p>
              <span className="clay-pill clay-mint text-mini text-[#1D5E4D] font-bold px-2 py-0.5 inline-block">
                Siap Pengayaan
              </span>
            </div>
          </section>

          {/* STUDENT GRADEBOOK TABLE */}
          <div className="clay-card clay-white p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-[#010105]">
                  Daftar Nilai &amp; Profil Kognitif Siswa
                </h2>
                <p className="text-xs text-[#5A5E70]">
                  Pemetaan modalitas belajar dan histori penguasaan topik DDA.
                </p>
              </div>
              <span className="clay-pill clay-lavender px-3 py-1 text-xs font-extrabold text-[#4B3B7A]">
                {primaryClass?.name || `${students.length} Siswa Terdaftar`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-[rgba(28,30,38,0.06)] text-[#9195A8] uppercase text-mini font-black">
                    <th className="pb-3">Nama Siswa</th>
                    <th className="pb-3">Modalitas Dominan</th>
                    <th className="pb-3">Level DDA</th>
                    <th className="pb-3">XP &amp; Streak</th>
                    <th className="pb-3">Status Kredensial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(28,30,38,0.06)]">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#9195A8] font-medium">
                        Belum ada siswa yang mendaftar atau bergabung ke kelas. Berikan kode kelas kepada siswa untuk mulai memantau analitik DDA live.
                      </td>
                    </tr>
                  ) : (
                    students.map((st) => {
                      const hasCert = hasClassCert(st.id);
                      const avg = averageGrade(st.id);

                      return (
                        <tr key={st.id} className="hover:bg-[#F8F9FD] transition-colors">
                          <td className="py-4 font-black text-[#010105] flex items-center gap-3">
                            <div className="clay-card clay-lavender w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-[#4B3B7A] shrink-0 overflow-hidden">
                              {st.avatar && (st.avatar.startsWith("data:image") || st.avatar.startsWith("http")) ? (
                                <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{st.avatar || st.name.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <span>{st.name}</span>
                          </td>

                        <td className="py-4">
                          <span
                            className={`clay-pill text-mini font-extrabold px-2.5 py-0.5 ${
                              st.learningStyle === "VISUAL"
                                ? "clay-mint text-[#1D5E4D]"
                                : st.learningStyle === "AUDITORI"
                                ? "clay-lavender text-[#4B3B7A]"
                                : "clay-butter text-[#785308]"
                            }`}
                          >
                            {st.learningStyle}
                          </span>
                        </td>

                        <td className="py-4">
                          <span
                            className={`clay-pill text-mini font-extrabold px-2.5 py-0.5 ${
                              st.currentDDALevel === "CHALLENGING"
                                ? "clay-lavender text-[#4B3B7A]"
                                : st.currentDDALevel === "BASIC"
                                ? "clay-coral text-[#7A2420]"
                                : "clay-mint text-[#1D5E4D]"
                            }`}
                          >
                            {levelLabel(st.currentDDALevel)}
                          </span>
                        </td>

                        <td className="py-4 font-bold text-[#5A5E70]">
                          {st.xpTotal} XP • {st.streakDays} Hari
                        </td>

                        <td className="py-4">
                          {hasCert ? (
                            <span className="clay-pill clay-mint text-mini font-extrabold px-2.5 py-0.5 text-[#1D5E4D] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sudah terbit
                            </span>
                          ) : avg === null ? (
                            <span className="clay-pill clay-white text-mini font-extrabold px-2.5 py-0.5 text-[#9195A8] inline-block">
                              Belum ada nilai
                            </span>
                          ) : (
                            <span className="clay-pill clay-butter text-mini font-extrabold px-2.5 py-0.5 text-[#785308] inline-block">
                              Siap terbit · rata-rata {avg}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
