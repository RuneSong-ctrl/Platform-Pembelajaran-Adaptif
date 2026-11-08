import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import PullToRefresh from "@/components/common/PullToRefresh";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import AnnouncementFeed from "@/components/common/AnnouncementFeed";
import MessageThread from "@/components/common/MessageThread";
import AssignmentSheet from "@/components/student/AssignmentSheet";
import { formatWhen, taskDeadline, taskKindLabel } from "@/lib/tasks";
import { utcDate } from "@/services/apiClient";
import type { GroundedTask } from "@/types";
import {
  ArrowLeft,
  School,
  BookOpen,
  FileText,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Users,
  Bell,
  Loader2,
} from "@/components/ui/icons";

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const {
    currentUser,
    classrooms,
    documents,
    tasks,
    submissions,
    users,
    isSyncing,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"beranda" | "materi" | "tugas" | "anggota">("beranda");

  const [openTask, setOpenTask] = useState<GroundedTask | null>(null);

  // Robust classroom matching (number vs string ID, or join code)
  const classroom = classrooms.find(
    (c) =>
      String(c.id) === String(classId) ||
      (classId && c.joinCode?.toUpperCase() === classId.toUpperCase())
  );

  // Filter materials for this classroom
  const classDocuments = documents.filter(
    (d) =>
      String(d.classroomId) === String(classId) ||
      (classroom && String(d.classroomId) === String(classroom.id))
  );

  // Filter tasks for this classroom
  const classTasks = tasks.filter(
    (t) =>
      String(t.classroomId) === String(classId) ||
      (classroom && String(t.classroomId) === String(classroom.id))
  );

  // Class students
  const classStudents = users
    ? users.filter(
        (u) =>
          classroom?.studentIds?.map((id) => String(id)).includes(String(u.id)) &&
          u.role === "SISWA"
      )
    : [];

  const mySubmission = (taskId: string) =>
    submissions.find((s) => String(s.taskId) === String(taskId) && String(s.studentId) === String(currentUser?.id));

  // One line of status per task, in the student's words.
  const statusOf = (task: GroundedTask) => {
    const sub = mySubmission(task.id);
    const due = taskDeadline(task);
    if (sub?.status === "Graded") return { text: `Nilai ${sub.grade}`, tone: "bg-[#EBF6F2] text-[#1D5E4D]" };
    if (sub?.status === "InProgress") return { text: "Sedang dikerjakan", tone: "bg-[#FFF6DF] text-[#785308]" };
    if (sub) return { text: task.type === "exam" ? "Menunggu nilai" : sub.isLate ? "Terlambat" : "Dikumpulkan", tone: sub.isLate ? "bg-[#FDF0EF] text-[#852C28]" : "bg-[#EBF6F2] text-[#1D5E4D]" };
    if (due && due.getTime() < Date.now()) return { text: task.type === "exam" ? "Ditutup" : "Lewat tenggat", tone: "bg-[#FDF0EF] text-[#852C28]" };
    return { text: "Belum", tone: "bg-black/5 text-[#5A5E70]" };
  };

  // Loading State while backend syncs
  if (!classroom && isSyncing) {
    return (
      <div className="app-shell bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 overflow-hidden w-full">
          <StudentSidebar />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="clay-card bg-white p-8 rounded-3xl text-center space-y-3 shadow-xs max-w-xs">
              <Loader2 className="w-8 h-8 animate-spin text-[#4B3B7A] mx-auto" />
              <p className="text-xs font-bold text-[#5A5E70]">Memuat data ruang kelas...</p>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  // 404 State if classroom not found
  if (!classroom) {
    return (
      <div className="app-shell bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 overflow-hidden w-full">
          <StudentSidebar />
          <main className="flex-1 overflow-y-auto flex items-center justify-center p-6 app-main md:pb-8">
            <PullToRefresh />
            <div className="clay-card bg-white p-8 rounded-3xl text-center space-y-4 max-w-sm w-full shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#FCD9D7] text-[#852C28] flex items-center justify-center mx-auto">
                <School className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-[#1C1E26]">Kelas Tidak Ditemukan</h2>
              <p className="text-xs text-[#5A5E70]">
                Kelas dengan ID ini tidak terdaftar atau kamu belum bergabung.
              </p>
              <Link
                to="/student/class"
                onClick={() => audioSynth.playClickSound()}
                className="clay-btn clay-btn-dark px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar Kelas</span>
              </Link>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-5 min-w-0 flex flex-col gap-4 app-main md:pb-8">
          <PullToRefresh />
          {/* Top Header & Back Button */}
          <div className="flex items-center justify-between">
            <Link
              to="/student/class"
              onClick={() => audioSynth.playClickSound()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-2xs text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Semua Kelas</span>
            </Link>

            <span className="text-mini font-mono font-black px-3 py-1 rounded-full bg-white border border-[rgba(28,30,38,0.08)] text-[#4B3B7A] shadow-2xs">
              KODE: {classroom.joinCode}
            </span>
          </div>

          {/* ========================================================= */}
          {/* BANNER HEADER KELAS (VIBRANT & PROPORTIONAL)              */}
          {/* ========================================================= */}
          <div className="relative clay-card clay-lavender overflow-hidden p-5 sm:p-7 min-h-[135px] flex flex-col justify-between">
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/35 pointer-events-none" />
            <div className="absolute right-6 -bottom-6 w-32 h-32 rounded-full bg-[#FEE7B3]/50 pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-[#4B3B7A] text-mini font-extrabold tracking-wide border border-white">
                  Kelas {classroom.grade}-A
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D] text-mini font-extrabold border border-white">
                  {classroom.subject}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-[#1C1E26]">
                {classroom.name}
              </h1>
            </div>

            <div className="relative z-10 pt-3 border-t border-[#4B3B7A]/15 flex items-center justify-between text-xs text-[#4B3B7A] font-medium">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#785308]" />
                <span className="font-bold">Pengajar: {classroom.teacherName}</span>
              </span>

              <span className="text-mini text-[#4B3B7A]/70 hidden sm:inline-block font-mono">
                {classDocuments.length} Modul • {classTasks.length} Aktivitas
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB SWITCHER (4 Tab: Beranda, Materi, Tugas, Anggota)     */}
          {/* ========================================================= */}
          <div className="grid grid-cols-4 gap-1 clay-white rounded-2xl p-1.5">
            {[
              { key: "beranda", label: "Beranda", icon: Bell },
              { key: "materi", label: `Materi (${classDocuments.length})`, icon: BookOpen },
              { key: "tugas", label: `Tugas (${classTasks.length})`, icon: FileText },
              { key: "anggota", label: "Anggota", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveTab(tab.key as any);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-3 rounded-xl text-mini sm:text-xs font-black transition-all cursor-pointer truncate ${
                    isActive
                      ? "bg-[#1C1E26] text-white shadow-xs"
                      : "text-[#5A5E70] hover:bg-[#F0EEF6]/70 hover:text-[#1C1E26]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* TAB CONTENT: 1. BERANDA (Feed / Pengumuman)              */}
          {/* ========================================================= */}
          {activeTab === "beranda" && (
            <div className="space-y-5">
              <div className="space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8] px-1">Pengumuman</h2>
                <AnnouncementFeed classroomId={classroom.id} />
              </div>

              <div className="space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8] px-1">
                  Tanya {classroom.teacherName}
                </h2>
                <div className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-black/5 shadow-2xs">
                  <MessageThread
                    classroomId={classroom.id}
                    emptyHint="Ada yang belum jelas? Kirim pesan ke guru. Hanya kamu dan guru yang bisa membaca percakapan ini."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB CONTENT: 2. MATERI (Daftar Modul Guru)                */}
          {/* ========================================================= */}
          {activeTab === "materi" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8]">
                  Modul Materi Kurikulum ({classDocuments.length})
                </h2>
                <span className="text-mini font-bold text-[#5A5E70]">
                  Klik modul untuk membaca
                </span>
              </div>

              {classDocuments.length === 0 ? (
                <div className="clay-card bg-white p-8 rounded-3xl border border-black/5 text-center space-y-2 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-[#1C1E26]">Belum Ada Modul</h3>
                  <p className="text-xs text-[#5A5E70] max-w-xs mx-auto">
                    Guru belum mengunggah dokumen materi di kelas ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {classDocuments.map((doc, idx) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        audioSynth.playClickSound();
                        navigate(`/student/class/${classroom.id}/materi/${doc.id}`);
                      }}
                      className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-black/5 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md hover:border-[#4B3B7A]/30 transition-all group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-mini font-black px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
                              BAB {idx + 1}
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate group-hover:text-[#4B3B7A] transition-colors">
                            {doc.title}
                          </h3>
                          <p className="text-mini text-[#5A5E70] font-medium truncate mt-0.5">
                            {doc.summary ? doc.summary.slice(0, 90) + "..." : "Klik untuk membaca dokumen modul materi"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl bg-[#F0EEF6] text-xs font-black text-[#4B3B7A] group-hover:bg-[#4B3B7A] group-hover:text-white transition-all">
                        <span className="hidden sm:inline">Buka Materi</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB CONTENT: 3. TUGAS & QUIZ                             */}
          {/* ========================================================= */}
          {activeTab === "tugas" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8]">
                  Penugasan &amp; Kuis ({classTasks.length})
                </h2>
              </div>

              {classTasks.length === 0 ? (
                <div className="clay-card bg-white p-8 rounded-3xl border border-black/5 text-center space-y-2 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF6DF] text-[#785308] flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-[#1C1E26]">Belum Ada Tugas / Kuis</h3>
                  <p className="text-xs text-[#5A5E70] max-w-xs mx-auto">
                    Tidak ada tugas atau kuis aktif saat ini untuk kelas ini.
                  </p>
                </div>
              ) : (
                <div className="clay-card divide-y divide-[rgba(28,30,38,0.05)] overflow-hidden">
                  {classTasks.map((task) => {
                    const status = statusOf(task);
                    const due = taskDeadline(task);
                    const opens = task.type === "exam" && task.opensAt ? utcDate(task.opensAt) : null;
                    const Icon = task.type === "assignment" ? FileText : Sparkles;
                    const open = () => {
                      audioSynth.playClickSound();
                      if (task.type === "quiz") navigate(`/quiz?taskId=${task.id}`);
                      else if (task.type === "exam") navigate(`/student/exam/${task.id}`);
                      else setOpenTask(task);
                    };

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={open}
                        className="w-full text-left p-4 flex items-center gap-3 hover:bg-[#F8F9FD] transition-colors cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          task.type === "exam" ? "bg-[#FDF0EF] text-[#852C28]" : task.type === "quiz" ? "bg-[#D2E5FA] text-[#21518A]" : "bg-[#EBF6F2] text-[#1D5E4D]"
                        }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-mini font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/5 text-[#5A5E70]">{taskKindLabel(task)}</span>
                          <h4 className="text-sm font-black text-[#1C1E26] truncate mt-0.5">{task.title}</h4>
                          {(due || opens) && (
                            <p className="text-mini text-[#5A5E70] truncate">
                              {task.type === "exam" && opens ? `${formatWhen(opens)} – ${formatWhen(due)}` : `Tenggat ${formatWhen(due)}`}
                            </p>
                          )}
                        </div>
                        <span className={`text-mini font-bold px-2.5 py-1 rounded-full shrink-0 ${status.tone}`}>{status.text}</span>
                        <ChevronRight className="w-4 h-4 text-[#9195A8] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB CONTENT: 4. ANGGOTA (Guru & Daftar Siswa)             */}
          {/* ========================================================= */}
          {activeTab === "anggota" && (
            <div className="space-y-4">
              {/* Guru Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8] px-1">
                  Pengajar
                </h3>
                <div className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-black/5 flex items-center gap-3.5 shadow-2xs">
                  <div className="w-11 h-11 rounded-2xl bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center font-black text-sm shadow-2xs">
                    {classroom.teacherName?.charAt(0) || "G"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-[#1C1E26] block truncate">
                      {classroom.teacherName}
                    </span>
                    <span className="text-mini text-[#4B3B7A] font-bold flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3 h-3" />
                      Guru Mata Pelajaran
                    </span>
                  </div>
                </div>
              </div>

              {/* Siswa Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8]">
                    Teman Sekelas ({classroom.studentIds?.length || 0})
                  </h3>
                </div>

                <div className="clay-card divide-y divide-[rgba(28,30,38,0.05)] overflow-hidden">
                  {classStudents.length > 0 ? (
                    classStudents.map((st) => (
                      <div key={st.id} className="p-3.5 sm:p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center text-xs font-black">
                          {st.name?.charAt(0) || "S"}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#1C1E26] block truncate">
                            {st.name} {String(st.id) === String(currentUser?.id) && "(Kamu)"}
                          </span>
                          <span className="text-mini text-[#5A5E70]">
                            Gaya Belajar: {st.learningStyle || "Belum tes"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 text-center text-xs text-[#5A5E70]">
                      {classroom.studentIds?.length || 0} siswa terdaftar di kelas ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {openTask && (
        <AssignmentSheet task={openTask} submission={mySubmission(openTask.id)} onClose={() => setOpenTask(null)} />
      )}

      <BottomNav />
    </div>
  );
}
