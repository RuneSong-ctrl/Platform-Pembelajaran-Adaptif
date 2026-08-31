import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import VisualLearnSection from "@/components/student/VisualLearnSection";
import AuditoryLearnSection from "@/components/student/AuditoryLearnSection";
import KinestheticLearnSection from "@/components/student/KinestheticLearnSection";
import {
  Eye,
  Headphones,
  FlaskConical,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  School,
  Bot,
  ChevronRight,
  Sparkles,
  Layers,
  GraduationCap,
} from "@/components/ui/icons";

export default function AdaptiveLearnPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, documents, classrooms } = useApp();

  const docParam = searchParams.get("doc");
  const classParam = searchParams.get("class");

  const [selectedClassId, setSelectedClassId] = useState<string | null>(classParam);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docParam);

  // Sync state if URL params change
  useEffect(() => {
    if (classParam) setSelectedClassId(classParam);
    if (docParam) setSelectedDocId(docParam);
  }, [classParam, docParam]);

  // 1. Modalitas Belajar Terkunci Murni Sesuai Profil Siswa
  const studentStyle: "VISUAL" | "AUDITORI" | "KINESTETIK" =
    currentUser?.learningStyle === "KINESTETIK"
      ? "KINESTETIK"
      : currentUser?.learningStyle === "AUDITORI"
      ? "AUDITORI"
      : "VISUAL";

  // 2. Data Kelas & Dokumen
  const myClassrooms = classrooms.filter((c) =>
    Boolean(currentUser?.id && c.studentIds?.map((id) => String(id)).includes(String(currentUser.id)))
  );
  const effectiveClassrooms = myClassrooms.length > 0 ? myClassrooms : classrooms;

  const currentClassroom =
    classrooms.find((c) => String(c.id) === String(selectedClassId)) || effectiveClassrooms[0];

  const selectedClassDocs = selectedClassId
    ? documents.filter((d) => String(d.classroomId) === String(selectedClassId))
    : [];

  const activeDoc = selectedDocId
    ? documents.find((d) => String(d.id) === String(selectedDocId)) || null
    : docParam
    ? documents.find((d) => String(d.id) === String(docParam)) || null
    : null;

  const activeClassroom = activeDoc
    ? classrooms.find((c) => String(c.id) === String(activeDoc.classroomId)) || currentClassroom
    : currentClassroom;

  const isDirectMode = Boolean(classParam && docParam);

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden w-full max-w-full [touch-action:pan-y]">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full max-w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-4 min-w-0 flex flex-col gap-3 sm:gap-4 pb-36 md:pb-12">
          {/* ========================================================= */}
          {/* TOP BAR: Navigasi, Breadcrumb & Modalitas                  */}
          {/* ========================================================= */}
          <div className="flex items-center justify-between gap-3 w-full bg-white px-3.5 py-2.5 rounded-2xl border border-black/5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {activeDoc ? (
                isDirectMode ? (
                  <Link
                    to={`/student/class/${classParam}/materi/${docParam}`}
                    onClick={() => audioSynth.playClickSound()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Naskah Bacaan</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      setSelectedDocId(null);
                      setSearchParams({});
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ganti Materi</span>
                  </button>
                )
              ) : selectedClassId ? (
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    setSelectedClassId(null);
                    setSearchParams({});
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Pilih Kelas</span>
                </button>
              ) : (
                <Link
                  to="/student"
                  onClick={() => audioSynth.playClickSound()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Beranda</span>
                </Link>
              )}

              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate">
                  {activeDoc?.title || (selectedClassId ? currentClassroom?.name : "Pusat Materi Adaptif")}
                </h1>
                <span className="text-[10px] text-[#5A5E70] font-medium block truncate">
                  {activeDoc
                    ? activeClassroom?.name || "Modul Adaptif"
                    : selectedClassId
                    ? "Pilih materi untuk dipelajari"
                    : "Pilih kelas untuk memulai"}
                </span>
              </div>
            </div>

            {/* Gaya Belajar Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shrink-0 border ${
                studentStyle === "KINESTETIK"
                  ? "bg-[#FFF4DC] text-[#785308] border-[#FFE299]"
                  : studentStyle === "AUDITORI"
                  ? "bg-[#E3DBF8] text-[#4B3B7A] border-[#D0C4F7]"
                  : "bg-[#D1EBE1] text-[#1D5E4D] border-[#9DE1CA]"
              }`}
            >
              {studentStyle === "KINESTETIK" && <FlaskConical className="w-3.5 h-3.5" />}
              {studentStyle === "AUDITORI" && <Headphones className="w-3.5 h-3.5" />}
              {studentStyle === "VISUAL" && <Eye className="w-3.5 h-3.5" />}
              <span>{studentStyle}</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* STEP 1: PILIH KELAS (Jika Belum Pilih Kelas & Materi)      */}
          {/* ========================================================= */}
          {!selectedClassId && !activeDoc && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
                    Langkah 1 dari 2
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#010105]">
                  Pilih Ruang Kelas
                </h2>
                <p className="text-xs text-[#5A5E70]">
                  Pilih kelas untuk mengakses kurikulum materi yang telah disesuaikan dengan gaya belajarmu.
                </p>
              </div>

              {effectiveClassrooms.length === 0 ? (
                <div className="clay-card bg-white p-8 rounded-3xl text-center space-y-3 shadow-xs">
                  <School className="w-10 h-10 text-[#5A5E70] mx-auto" />
                  <h3 className="text-sm font-black">Belum Ada Kelas</h3>
                  <p className="text-xs text-[#5A5E70]">
                    Kamu belum bergabung ke dalam kelas manapun.
                  </p>
                  <Link
                    to="/student/class"
                    onClick={() => audioSynth.playClickSound()}
                    className="clay-btn clay-btn-dark px-4 py-2 text-xs font-bold inline-block"
                  >
                    Gabung Kelas
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {effectiveClassrooms.map((cls) => {
                    const docCount = documents.filter((d) => d.classroomId === cls.id).length;
                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          audioSynth.playClickSound();
                          setSelectedClassId(cls.id);
                        }}
                        className="clay-card bg-white p-4 sm:p-5 rounded-2xl border border-black/5 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md hover:border-[#4B3B7A]/30 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            <School className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D] text-[10px] font-extrabold">
                                Kelas {cls.grade}-A
                              </span>
                              <span className="text-[10px] text-[#5A5E70] font-mono">
                                {docCount} Modul
                              </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate">
                              {cls.name}
                            </h3>
                            <p className="text-[10px] text-[#5A5E70] font-medium truncate flex items-center gap-1 mt-0.5">
                              <GraduationCap className="w-3 h-3" />
                              <span>{cls.teacherName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-full bg-black/5 text-[#5A5E70] group-hover:text-[#4B3B7A] group-hover:translate-x-0.5 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: PILIH MATERI (Kelas Sudah Dipilih, Belum Materi)  */}
          {/* ========================================================= */}
          {selectedClassId && !activeDoc && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D]">
                    Langkah 2 dari 2
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#010105]">
                  Pilih Modul Pembelajaran
                </h2>
                <p className="text-xs text-[#5A5E70]">
                  Kelas: <span className="font-bold text-[#1C1E26]">{currentClassroom?.name}</span> — pilih topik materi yang ingin kamu kuasai.
                </p>
              </div>

              {selectedClassDocs.length === 0 ? (
                <div className="clay-card bg-white p-8 rounded-3xl text-center space-y-3 shadow-xs">
                  <BookOpen className="w-10 h-10 text-[#5A5E70] mx-auto" />
                  <h3 className="text-sm font-black text-[#1C1E26]">Belum Ada Modul di Kelas Ini</h3>
                  <p className="text-xs text-[#5A5E70]">
                    Guru belum mengunggah materi modul untuk kelas {currentClassroom?.name}.
                  </p>
                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      setSelectedClassId(null);
                    }}
                    className="clay-btn clay-btn-white px-4 py-2 text-xs font-bold border border-black/10 inline-block cursor-pointer"
                  >
                    Pilih Kelas Lain
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedClassDocs.map((doc, idx) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        audioSynth.playClickSound();
                        setSelectedDocId(doc.id);
                      }}
                      className="clay-card bg-white p-4 rounded-2xl border border-black/5 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md hover:border-[#4B3B7A]/30 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#E3DBF8] text-[#4B3B7A]">
                              BAB {idx + 1}
                            </span>
                            <span className="text-[10px] font-extrabold text-[#1D5E4D] bg-[#D1EBE1] px-1.5 py-0.5 rounded">
                              Mode {studentStyle} Siap
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate">
                            {doc.title}
                          </h3>
                          <p className="text-[10px] text-[#5A5E70] font-medium truncate mt-0.5">
                            {doc.summary || "Klik untuk memulai pengalaman belajar multimodal"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-[#4B3B7A] group-hover:translate-x-0.5 transition-transform">
                        <span className="hidden sm:inline">Mulai</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3 / DIRECT: RENDER MATERI ADAPTIF AKTIF              */}
          {/* ========================================================= */}
          {activeDoc && (
            <div className="space-y-4 w-full max-w-full min-w-0">
              {/* 👁️ SISWA VISUAL */}
              {studentStyle === "VISUAL" && (
                <VisualLearnSection doc={activeDoc} />
              )}

              {/* 🎧 SISWA AUDITORI */}
              {studentStyle === "AUDITORI" && (
                <AuditoryLearnSection
                  doc={activeDoc}
                  classroomName={activeClassroom?.name}
                />
              )}

              {/* ✋ SISWA KINESTETIK */}
              {studentStyle === "KINESTETIK" && (
                <KinestheticLearnSection doc={activeDoc} />
              )}

              {/* Action Button to Adaptive Quiz */}
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  navigate("/quiz");
                }}
                className="clay-btn clay-btn-dark w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#FFE299]" />
                <span>Uji Pemahaman di Kuis Adaptif DDA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
