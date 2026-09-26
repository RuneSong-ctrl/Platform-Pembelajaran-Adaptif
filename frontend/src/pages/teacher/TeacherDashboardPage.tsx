import React, { useEffect, useState } from "react";
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
import { Users, CheckCircle2, Plus, School, ArrowRight, MessageSquare } from "@/components/ui/icons";
import { Link } from "react-router-dom";
import { classTone } from "./TeacherClassPage";
import GradeDialog from "@/components/teacher/GradeDialog";
import MessageThread from "@/components/common/MessageThread";
import { useLiveEvents } from "@/services/liveEvents";
import { ApiService, MessageThreadSummary, utcDate } from "@/services/apiClient";
import type { AssignmentSubmission } from "@/types";

export default function TeacherDashboardPage() {
  const {
    currentUser,
    classrooms,
    createClassroom,
    documents,
    submissions,
  } = useApp();

  const [createClassModalOpen, setCreateClassModalOpen] = useState(false);
  const [classNameInput, setClassNameInput] = useState("");
  const [subjectInput, setSubjectInput] = useState("Biologi");
  const [gradeInput, setGradeInput] = useState(10);

  const [grading, setGrading] = useState<AssignmentSubmission | null>(null);
  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [openThread, setOpenThread] = useState<MessageThreadSummary | null>(null);
  const loadThreads = () => ApiService.getMessageThreads().then(setThreads).catch(() => {});
  useEffect(() => {
    loadThreads();
  }, []);
  useLiveEvents((e) => e.type === "message" && loadThreads());

  const handleCreateClass = () => {
    if (!classNameInput) return;
    audioSynth.playSuccessSound();
    createClassroom(classNameInput, subjectInput, gradeInput);
    setCreateClassModalOpen(false);
    setClassNameInput("");
  };

  const totalStudents = classrooms.reduce((acc, c) => acc + c.studentIds.length, 0);
  const toGrade = submissions.filter((s) => s.grade == null);
  const firstName = (currentUser?.name || "").split(" ")[0];

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <TeacherSidebar />

        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Greeting */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">
                  Halo{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="text-sm text-[#5A5E70] mt-1">
                  {toGrade.length > 0
                    ? `Ada ${toGrade.length} tugas siswa yang menunggu nilai dari Anda.`
                    : "Semua tugas siswa sudah Anda nilai."}
                </p>
              </div>
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setCreateClassModalOpen(true);
                }}
                className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat kelas</span>
              </button>
            </header>

            {/* Quick numbers */}
            <dl className="grid grid-cols-3 gap-3">
              {[
                { label: "Siswa", value: totalStudents },
                { label: "Menunggu nilai", value: toGrade.length },
                { label: "Materi", value: documents.length },
              ].map((m) => (
                <div key={m.label} className="clay-card clay-white px-4 py-3">
                  <dt className="text-xs font-bold text-[#9195A8]">{m.label}</dt>
                  <dd className="text-2xl font-black text-[#010105]">{m.value}</dd>
                </div>
              ))}
            </dl>

            {/* Classes */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-[#010105]">Kelas saya</h2>
              {classrooms.length === 0 ? (
                <div className="clay-card clay-white p-8 text-center space-y-2">
                  <School className="w-8 h-8 text-[#9195A8] mx-auto" />
                  <p className="text-sm font-black text-[#010105]">Belum ada kelas</p>
                  <p className="text-xs text-[#5A5E70]">Buat kelas pertama, lalu bagikan kodenya ke siswa.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classrooms.map((cls, i) => {
                    const tone = classTone(i);
                    return (
                      <Link
                        key={cls.id}
                        to={`/teacher/class/${cls.id}`}
                        onClick={() => audioSynth.playClickSound()}
                        className="clay-card clay-card-hover clay-white overflow-hidden flex flex-col"
                      >
                        <div className={`${tone.card} px-5 py-4 rounded-none`}>
                          <h3 className="text-base font-black text-[#010105] truncate">{cls.name}</h3>
                          <p className={`text-xs font-bold ${tone.text}`}>
                            {cls.subject} · Kelas {cls.grade}
                          </p>
                        </div>
                        <div className="px-5 py-4 flex items-center justify-between text-xs text-[#5A5E70]">
                          <span className="flex items-center gap-1.5 font-bold">
                            <Users className="w-3.5 h-3.5" /> {cls.studentIds.length} siswa
                          </span>
                          <span>
                            Kode <b className="font-mono text-[#010105] tracking-wider">{cls.joinCode}</b>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Work to grade */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#010105]">Perlu dinilai</h2>
                {submissions.length > 0 && (
                  <Link to="/teacher/gradebook" className="text-xs font-bold text-[#5A5E70] hover:text-[#010105] flex items-center gap-1">
                    Buku nilai <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              {toGrade.length === 0 ? (
                <p className="clay-card clay-white px-5 py-4 text-xs text-[#5A5E70] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1D5E4D]" /> Tidak ada tugas yang menunggu. Tugas baru dari siswa akan muncul di sini.
                </p>
              ) : (
                <ul className="clay-card clay-white divide-y divide-[rgba(28,30,38,0.06)]">
                  {toGrade.slice(0, 5).map((sub) => (
                    <li key={sub.id} className="px-5 py-3.5 flex items-center gap-3">
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-black text-[#010105] truncate">{sub.studentName}</span>
                        <span className="block text-xs text-[#5A5E70] truncate">{sub.taskTitle}</span>
                      </span>
                      <button
                        onClick={() => setGrading(sub)}
                        className="clay-btn clay-btn-white px-4 py-1.5 text-xs font-black text-[#1C1E26] cursor-pointer"
                      >
                        Beri nilai
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {toGrade.length > 5 && (
                <p className="text-xs text-[#9195A8]">dan {toGrade.length - 5} tugas lainnya di Buku Nilai.</p>
              )}
            </section>

            {/* Student messages */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-[#010105]">Pesan masuk</h2>
              {threads.length === 0 ? (
                <p className="clay-card clay-white px-5 py-4 text-xs text-[#5A5E70] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#9195A8]" /> Belum ada pesan. Siswa dan orang tua bisa menghubungi Anda dari akun mereka.
                </p>
              ) : (
                <ul className="clay-card clay-white divide-y divide-[rgba(28,30,38,0.06)]">
                  {threads.slice(0, 6).map((t) => (
                    <li key={`${t.classroom_id}:${t.student_id}:${t.parent_id || ""}`}>
                      <button
                        onClick={() => setOpenThread(t)}
                        className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-[#F8F9FD] cursor-pointer"
                      >
                        <span className="w-9 h-9 rounded-full bg-[#E0DAF5] text-[#4B3B7A] font-black text-sm flex items-center justify-center shrink-0">
                          {(t.parent_name || t.student_name).charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-black text-[#010105] truncate">
                            {t.parent_name ? `${t.parent_name} (orang tua ${t.student_name})` : t.student_name}{" "}
                            <span className="font-bold text-xs text-[#9195A8]">· {t.classroom_name}</span>
                          </span>
                          <span className={`block text-xs truncate ${t.unread ? "text-[#010105] font-bold" : "text-[#5A5E70]"}`}>{t.last_text}</span>
                        </span>
                        <span className="text-mini text-[#9195A8] shrink-0">
                          {utcDate(t.last_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                        {t.unread > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#1C1E26] text-white text-mini font-black flex items-center justify-center shrink-0">
                            {t.unread}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* CREATE CLASS MODAL */}
      <Dialog open={createClassModalOpen} onOpenChange={setCreateClassModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#010105]">
              Buat kelas baru
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A5E70]">
              Setelah dibuat, Anda akan mendapat kode untuk dibagikan ke siswa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3">
            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Nama kelas
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
                Mata pelajaran
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
                Kelas (angka)
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
              Buat kelas
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <GradeDialog submission={grading} onClose={() => setGrading(null)} />

      <Dialog open={!!openThread} onOpenChange={(o) => !o && setOpenThread(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
          {openThread && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-black text-[#010105]">{openThread.parent_name || openThread.student_name}</DialogTitle>
                <DialogDescription className="text-xs text-[#5A5E70]">
                  {openThread.parent_name ? `Orang tua ${openThread.student_name} · ` : ""}
                  {openThread.classroom_name} · pesan pribadi
                </DialogDescription>
              </DialogHeader>
              <MessageThread
                classroomId={openThread.classroom_id}
                studentId={openThread.student_id}
                parentId={openThread.parent_id}
                emptyHint="Belum ada pesan."
                onRead={loadThreads}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
