import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import GradeDialog from "@/components/teacher/GradeDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import { ShieldCheck, CheckCircle2, Download, BookOpen } from "@/components/ui/icons";
import type { AssignmentSubmission } from "@/types";

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export default function GradebookPage() {
  const { users, credentials, classrooms, tasks, submissions, mintCredential, currentUser } = useApp();
  const myClasses = classrooms.filter((c) => c.teacherId === currentUser.id);
  const [params, setParams] = useSearchParams();
  const cls = myClasses.find((c) => c.id === params.get("kelas")) || myClasses[0];

  const [grading, setGrading] = useState<AssignmentSubmission | null>(null);
  const [certOpen, setCertOpen] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState<{ issued: number; failed: string[] } | null>(null);

  const students = users
    .filter((u) => u.role === "SISWA" && cls?.studentIds.includes(u.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const classTasks = tasks
    .filter((t) => t.classroomId === cls?.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const taskIds = new Set(classTasks.map((t) => t.id));

  // Latest submission per (student, task).
  const cell = new Map<string, AssignmentSubmission>();
  for (const s of submissions) {
    if (!taskIds.has(s.taskId)) continue;
    const key = `${s.studentId}:${s.taskId}`;
    const prev = cell.get(key);
    if (!prev || new Date(s.submittedAt) > new Date(prev.submittedAt)) cell.set(key, s);
  }
  const studentAvg = (id: string) =>
    avg(classTasks.map((t) => cell.get(`${id}:${t.id}`)?.grade).filter((g): g is number => g != null));
  const taskAvg = (taskId: string) =>
    avg(students.map((s) => cell.get(`${s.id}:${taskId}`)?.grade).filter((g): g is number => g != null));
  const toGrade = [...cell.values()].filter((s) => s.grade == null && students.some((st) => st.id === s.studentId)).length;

  const hasCert = (id: string) => credentials.some((c) => c.studentId === id && c.classroomId === cls?.id && !c.taskId);
  const certReady = students.filter((s) => !hasCert(s.id) && studentAvg(s.id) !== null);

  const issueCertificates = async () => {
    if (!cls) return;
    setMinting(true);
    const result = { issued: 0, failed: [] as string[] };
    for (const st of certReady) {
      try {
        await mintCredential(st.id, cls.id, `Penguasaan Materi ${cls.subject}`, studentAvg(st.id) as number);
        result.issued++;
      } catch (e) {
        result.failed.push(`${st.name}: ${e instanceof Error ? e.message : "gagal"}`);
      }
    }
    setMinting(false);
    setCertOpen(false);
    setMintResult(result);
    if (result.issued > 0) {
      audioSynth.playLevelUpSound();
      confetti({ disableForReducedMotion: true, particleCount: 80, spread: 60 });
    }
  };

  const exportCsv = () => {
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Nama", "Email", ...classTasks.map((t) => t.title), "Rata-rata"],
      ...students.map((s) => [
        s.name,
        s.email,
        ...classTasks.map((t) => cell.get(`${s.id}:${t.id}`)?.grade ?? ""),
        studentAvg(s.id) ?? "",
      ]),
    ];
    const blob = new Blob(["﻿" + rows.map((r) => r.map(q).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Nilai ${cls?.name}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <TeacherSidebar />

        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">Buku Nilai</h1>
                <p className="text-sm text-[#5A5E70] mt-1">
                  {toGrade > 0 ? `${toGrade} tugas menunggu nilai. Klik sel kuning untuk menilai.` : "Nilai semua tugas dan kuis per siswa."}
                </p>
              </div>
              {cls && students.length > 0 && (
                <div className="flex gap-2 self-start sm:self-auto">
                  <button
                    onClick={exportCsv}
                    disabled={classTasks.length === 0}
                    className="clay-btn clay-btn-white px-4 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Unduh (CSV)
                  </button>
                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      setMintResult(null);
                      setCertOpen(true);
                    }}
                    className="clay-btn clay-btn-dark px-4 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" /> Terbitkan sertifikat
                  </button>
                </div>
              )}
            </header>

            {myClasses.length === 0 ? (
              <Empty>
                Belum ada kelas. <Link to="/teacher" className="font-bold underline">Buat kelas di Beranda</Link>.
              </Empty>
            ) : (
              <>
                {myClasses.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pilih kelas">
                    {myClasses.map((c) => (
                      <button
                        key={c.id}
                        role="tab"
                        aria-selected={c.id === cls?.id}
                        onClick={() => setParams({ kelas: c.id }, { replace: true })}
                        className={`clay-pill px-3.5 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                          c.id === cls?.id ? "clay-dark text-white" : "clay-white text-[#5A5E70]"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {mintResult && (
                  <div
                    role="status"
                    className={`clay-card p-4 text-xs font-bold space-y-1 ${
                      mintResult.failed.length ? "bg-[#FDF0EF] text-[#852C28]" : "clay-mint text-[#1D5E4D]"
                    }`}
                  >
                    <p className="flex items-center gap-2 font-black">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> {mintResult.issued} sertifikat terbit.
                    </p>
                    {mintResult.failed.map((f) => (
                      <p key={f} className="pl-6">Gagal: {f}</p>
                    ))}
                  </div>
                )}

                {students.length === 0 ? (
                  <Empty>
                    Belum ada siswa di {cls?.name}. Bagikan kode <b className="font-mono">{cls?.joinCode}</b> ke siswa.
                  </Empty>
                ) : classTasks.length === 0 ? (
                  <Empty>
                    Belum ada tugas atau kuis di {cls?.name}.{" "}
                    <Link to="/teacher/quiz-generator" className="font-bold underline">Buat kuis</Link>.
                  </Empty>
                ) : (
                  <div className="clay-card clay-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[rgba(28,30,38,0.08)] text-[#5A5E70]">
                            <th className="sticky left-0 bg-white z-10 text-left font-black px-4 py-3 min-w-45">Siswa</th>
                            <th className="font-black px-3 py-3 text-center min-w-20">Rata-rata</th>
                            {classTasks.map((t) => (
                              <th key={t.id} className="font-bold px-3 py-3 text-center min-w-27.5 max-w-35 align-bottom">
                                <span className="block truncate text-[#010105]" title={t.title}>{t.title}</span>
                                <span className="block text-mini font-medium text-[#9195A8]">
                                  {t.type === "quiz" ? "Kuis" : "Tugas"}
                                  {t.dueDate && ` · ${new Date(t.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[rgba(28,30,38,0.08)] bg-[#FAFBFE] text-[#5A5E70]">
                            <td className="sticky left-0 bg-[#FAFBFE] z-10 px-4 py-2 font-bold">Rata-rata kelas</td>
                            <td />
                            {classTasks.map((t) => (
                              <td key={t.id} className="px-3 py-2 text-center font-bold">{taskAvg(t.id) ?? "–"}</td>
                            ))}
                          </tr>
                          {students.map((st) => {
                            const a = studentAvg(st.id);
                            return (
                              <tr key={st.id} className="border-b border-[rgba(28,30,38,0.05)] last:border-0">
                                <td className="sticky left-0 bg-white z-10 px-4 py-2.5">
                                  <span className="flex items-center gap-2">
                                    <span className="font-black text-[#010105] truncate">{st.name}</span>
                                    {hasCert(st.id) && (
                                      <span title="Sertifikat kelas sudah terbit">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#1D5E4D] shrink-0" />
                                      </span>
                                    )}
                                  </span>
                                </td>
                                <td className={`px-3 py-2.5 text-center font-black ${a != null && a < 70 ? "text-[#852C28]" : "text-[#010105]"}`}>
                                  {a ?? "–"}
                                </td>
                                {classTasks.map((t) => {
                                  const sub = cell.get(`${st.id}:${t.id}`);
                                  const late = !sub && t.dueDate && new Date(t.dueDate) < new Date();
                                  if (!sub)
                                    return (
                                      <td key={t.id} className={`px-3 py-2.5 text-center ${late ? "text-[#852C28] font-bold" : "text-[#C4C6D0]"}`}>
                                        {late ? "Belum" : "–"}
                                      </td>
                                    );
                                  return (
                                    <td key={t.id} className="px-1.5 py-1.5 text-center">
                                      <button
                                        onClick={() => setGrading(sub)}
                                        title={sub.grade == null ? "Beri nilai" : "Lihat atau ubah nilai"}
                                        className={`w-full rounded-xl px-2 py-1.5 font-black cursor-pointer transition-colors ${
                                          sub.grade == null
                                            ? "clay-butter text-[#785308]"
                                            : sub.grade < 70
                                              ? "text-[#852C28] hover:bg-[#FDF0EF]"
                                              : "text-[#010105] hover:bg-[#F1F2F7]"
                                        }`}
                                      >
                                        {sub.grade ?? "Nilai"}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="px-4 py-2.5 text-mini text-[#9195A8] border-t border-[rgba(28,30,38,0.06)]">
                      Kuning = sudah dikumpulkan, belum dinilai · Merah = di bawah 70 atau lewat batas waktu · Nilai kuis terisi otomatis
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <GradeDialog submission={grading} onClose={() => setGrading(null)} />

      <Dialog open={certOpen} onOpenChange={(o) => !minting && setCertOpen(o)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#010105]">Terbitkan sertifikat {cls?.name}</DialogTitle>
            <DialogDescription className="text-xs text-[#5A5E70]">
              Sertifikat berisi rata-rata nilai siswa dan bisa dicek keasliannya oleh siapa saja lewat halaman verifikasi.
              Setelah terbit, sertifikat tidak bisa diubah atau ditarik.
            </DialogDescription>
          </DialogHeader>
          {certReady.length === 0 ? (
            <p className="text-xs font-bold text-[#5A5E70]">
              Tidak ada siswa yang bisa diberi sertifikat: semua sudah punya, atau belum ada nilai.
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-[rgba(28,30,38,0.06)] text-xs">
              {certReady.map((s) => (
                <li key={s.id} className="flex justify-between py-2">
                  <span className="font-bold text-[#010105]">{s.name}</span>
                  <span className="font-black">{studentAvg(s.id)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setCertOpen(false)}
              disabled={minting}
              className="clay-btn clay-btn-white px-4 py-2 text-xs font-bold text-[#5A5E70] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={issueCertificates}
              disabled={minting || certReady.length === 0}
              className="clay-btn clay-btn-dark px-4 py-2 text-xs font-black cursor-pointer disabled:opacity-50"
            >
              {minting ? "Menerbitkan..." : `Terbitkan untuk ${certReady.length} siswa`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="clay-card clay-white p-8 text-center space-y-2">
      <BookOpen className="w-8 h-8 text-[#9195A8] mx-auto" />
      <p className="text-xs text-[#5A5E70] max-w-sm mx-auto">{children}</p>
    </div>
  );
}
