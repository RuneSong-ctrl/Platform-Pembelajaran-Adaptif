import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import { MOCK_CLASS_ANNOUNCEMENTS } from "@/services/mockData";
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
  UploadCloud,
  X,
  Layers,
  CheckCircle2,
  Clock,
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
    submitAssignment,
    users,
    isSyncing,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"beranda" | "materi" | "tugas" | "anggota">("beranda");

  // Submit modal state for assignments
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [submissionText, setSubmissionText] = useState("");

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

  // Filter announcements for this classroom (from mock data)
  const classAnnouncements = MOCK_CLASS_ANNOUNCEMENTS.filter(
    (a) =>
      String(a.classroomId) === String(classId) ||
      (classroom && String(a.classroomId) === String(classroom.id)) ||
      a.classroomId === "class-bio-10" // fallback for rich demo preview
  );

  // Class students
  const classStudents = users
    ? users.filter(
        (u) =>
          classroom?.studentIds?.map((id) => String(id)).includes(String(u.id)) &&
          u.role === "SISWA"
      )
    : [];

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

  // Loading State while backend syncs
  if (!classroom && isSyncing) {
    return (
      <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
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
      <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 overflow-hidden w-full">
          <StudentSidebar />
          <main className="flex-1 overflow-y-auto flex items-center justify-center p-6 pb-24 md:pb-8">
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
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-5 min-w-0 flex flex-col gap-4 pb-28 md:pb-8">
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

            <span className="text-[11px] font-mono font-black px-3 py-1 rounded-full bg-white border border-[rgba(28,30,38,0.08)] text-[#4B3B7A] shadow-2xs">
              KODE: {classroom.joinCode}
            </span>
          </div>

          {/* ========================================================= */}
          {/* BANNER HEADER KELAS (VIBRANT & PROPORTIONAL)              */}
          {/* ========================================================= */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#452B87] via-[#5C3FA6] to-[#25134A] p-5 sm:p-7 text-white shadow-md border border-white/10 min-h-[135px] flex flex-col justify-between">
            {/* Soft Ambient Overlay */}
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute right-6 -bottom-6 w-32 h-32 rounded-full bg-[#FFE299]/15 blur-xl pointer-events-none" />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold tracking-wide border border-white/15">
                  Kelas {classroom.grade}-A
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#D1EBE1]/25 backdrop-blur-md text-[#D1EBE1] text-[10px] font-extrabold border border-[#D1EBE1]/20">
                  {classroom.subject}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
                {classroom.name}
              </h1>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/90 font-medium">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#FFE299]" />
                <span className="font-bold">Pengajar: {classroom.teacherName}</span>
              </span>

              <span className="text-[10px] text-white/70 hidden sm:inline-block font-mono">
                {classDocuments.length} Modul • {classTasks.length} Aktivitas
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TAB SWITCHER (4 Tab: Beranda, Materi, Tugas, Anggota)     */}
          {/* ========================================================= */}
          <div className="grid grid-cols-4 gap-1 bg-white rounded-2xl p-1.5 border border-[rgba(28,30,38,0.06)] shadow-2xs">
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
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer truncate ${
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
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8]">
                  Aktivitas &amp; Pengumuman Kelas
                </h2>
              </div>

              {classAnnouncements.length === 0 ? (
                <div className="clay-card bg-white p-8 rounded-3xl border border-black/5 text-center space-y-2 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#F0EEF6] text-[#5A5E70] flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-[#1C1E26]">Belum Ada Pengumuman</h3>
                  <p className="text-xs text-[#5A5E70] max-w-xs mx-auto">
                    Guru belum memposting pengumuman terbaru di kelas ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classAnnouncements.map((ann) => (
                    <div
                      key={ann.id}
                      className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-black/5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center text-sm font-black shadow-2xs shrink-0">
                          {ann.authorName?.charAt(0) || "G"}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-black text-[#1C1E26] block truncate">
                            {ann.authorName}
                          </span>
                          <span className="text-[10px] text-[#5A5E70] font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-[#9195A8]" />
                            {new Date(ann.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm leading-relaxed text-[#1C1E26] font-normal">
                        {ann.content}
                      </p>

                      {ann.referenceTitle && (
                        <div className="pt-2 border-t border-black/5">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F0EEF6] text-[11px] font-bold text-[#4B3B7A]">
                            <Layers className="w-3.5 h-3.5" />
                            <span>Terkait: {ann.referenceTitle}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                <span className="text-[10px] font-bold text-[#5A5E70]">
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
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
                              BAB {idx + 1}
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate group-hover:text-[#4B3B7A] transition-colors">
                            {doc.title}
                          </h3>
                          <p className="text-[10px] text-[#5A5E70] font-medium truncate mt-0.5">
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
                <div className="bg-white rounded-3xl border border-[rgba(28,30,38,0.07)] shadow-xs divide-y divide-[rgba(28,30,38,0.05)] overflow-hidden">
                  {classTasks.map((task) => {
                    const mySub = submissions.find(
                      (s) => String(s.taskId) === String(task.id) && String(s.studentId) === String(currentUser?.id)
                    );
                    const isQuiz = task.type === "quiz" || task.type === "exam";

                    return (
                      <div
                        key={task.id}
                        className="p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-[#F8F9FD] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                              isQuiz
                                ? "bg-[#FFF6DF] text-[#785308]"
                                : "bg-[#FDF0EF] text-[#852C28]"
                            }`}
                          >
                            {isQuiz ? (
                              <Sparkles className="w-4.5 h-4.5" />
                            ) : (
                              <FileText className="w-4.5 h-4.5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/5 text-[#5A5E70]">
                                {task.type}
                              </span>
                              {task.sourceReference && (
                                <span className="text-[10px] text-[#5A5E70] font-medium truncate">
                                  • {task.sourceReference}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-black text-[#010105] truncate mt-0.5">
                              {task.title}
                            </h4>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {mySub ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EBF6F2] text-[#1D5E4D]">
                              {mySub.status === "Graded" ? `Nilai: ${mySub.grade}` : "Dikumpul"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FDF0EF] text-[#852C28] hidden sm:inline-block">
                              Belum
                            </span>
                          )}

                          {isQuiz ? (
                            <button
                              onClick={() => {
                                audioSynth.playClickSound();
                                navigate("/quiz");
                              }}
                              className="clay-btn clay-btn-dark px-3.5 py-1.5 rounded-xl text-xs font-black shadow-2xs cursor-pointer"
                            >
                              Mulai
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSubmit(task)}
                              className="clay-btn clay-btn-white px-3.5 py-1.5 rounded-xl text-xs font-black text-[#1C1E26] shadow-2xs cursor-pointer border border-[rgba(28,30,38,0.08)]"
                            >
                              {mySub ? "Revisi" : "Kumpul"}
                            </button>
                          )}
                        </div>
                      </div>
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
                    <span className="text-[10px] text-[#4B3B7A] font-bold flex items-center gap-1 mt-0.5">
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

                <div className="bg-white rounded-3xl border border-[rgba(28,30,38,0.07)] shadow-xs divide-y divide-[rgba(28,30,38,0.05)] overflow-hidden">
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
                          <span className="text-[10px] text-[#5A5E70]">
                            Gaya Belajar: {st.learningStyle || "Belum Asesmen"}
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

      {/* INSTANT CLAY SUBMIT ASSIGNMENT MODAL */}
      {submitModalOpen && activeTask && (
        <div
          className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4"
          onClick={() => setSubmitModalOpen(false)}
        >
          <div
            className="clay-card bg-white rounded-[28px] p-5 sm:p-6 border border-white max-w-sm sm:max-w-md w-full shadow-[0_12px_28px_rgba(28,30,38,0.08),inset_2px_2px_4px_#fff,inset_-2px_-2px_5px_rgba(0,0,0,0.03)] flex flex-col gap-3.5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSubmitModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[#5A5E70] clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-base font-black text-[#1C1E26]">
                Kumpulkan: {activeTask.title}
              </h3>
              <p className="text-xs text-[#5A5E70] mt-0.5">
                {activeTask.contentJson?.instructions || "Uraikan jawaban tugasmu di bawah ini."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1E26] mb-1">
                Teks Jawaban / Analisis Mandiri
              </label>
              <div className="p-1 rounded-2xl bg-[#F7F6FA] border border-white shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.04)]">
                <textarea
                  rows={4}
                  placeholder="Ketik uraian jawaban tugasmu di sini..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full p-2.5 bg-transparent border-0 outline-none text-xs font-medium text-[#1C1E26] placeholder:text-[#9195A8] resize-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F0EEF6] flex items-center justify-between text-xs font-medium text-[#5A5E70] border border-white">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B3B7A]">
                <UploadCloud className="w-3.5 h-3.5 text-[#4B3B7A]" />
                Lampiran Catatan
              </span>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-md text-[#1C1E26] shadow-2xs">
                Tugas_Catatan_Mandiri.pdf
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] px-4 py-2 text-xs font-extrabold cursor-pointer transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleSendSubmission}
                disabled={!submissionText}
                className={`clay-btn px-4 py-2 text-xs font-extrabold ${
                  submissionText
                    ? "clay-btn-dark text-white cursor-pointer shadow-sm active:scale-95"
                    : "bg-[#E4E2DD] text-[#9195A8] cursor-not-allowed"
                }`}
              >
                Kirim ke Guru
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
