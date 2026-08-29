import React from "react";
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
} from "@/components/ui/icons";

export default function AdaptiveLearnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, documents, classrooms } = useApp();

  const docParam = searchParams.get("doc");

  // 1. Modalitas Belajar Terkunci Murni Sesuai Profil Siswa
  const studentStyle: "VISUAL" | "AUDITORI" | "KINESTETIK" =
    currentUser?.learningStyle === "KINESTETIK"
      ? "KINESTETIK"
      : currentUser?.learningStyle === "AUDITORI"
      ? "AUDITORI"
      : "VISUAL";

  // 2. Pemilihan Kelas & Dokumen Materi Otomatis
  const myClassrooms = classrooms.filter((c) =>
    Boolean(currentUser?.id && c.studentIds?.includes(currentUser.id))
  );
  const effectiveClassrooms = myClassrooms.length > 0 ? myClassrooms : classrooms;
  const primaryClassroom = effectiveClassrooms[0];

  const classroomDocs = documents.filter((d) => d.classroomId === primaryClassroom?.id);
  const availableDocs = classroomDocs.length > 0 ? classroomDocs : documents;

  const activeDoc =
    (docParam ? documents.find((d) => d.id === docParam) : null) ||
    availableDocs[0] ||
    documents[0];

  const activeClassroom =
    classrooms.find((c) => c.id === activeDoc?.classroomId) || primaryClassroom;

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden w-full max-w-full [touch-action:pan-y]">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full max-w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-4 min-w-0 flex flex-col gap-3 sm:gap-4 pb-36 md:pb-12">
          {/* Top Bar Ringkas: Navigasi, Judul Materi & Modalitas dalam 1 Baris Elegan */}
          <div className="flex items-center justify-between gap-3 w-full bg-white px-3.5 py-2.5 rounded-2xl border border-black/5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                to="/student"
                onClick={() => audioSynth.playClickSound()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate">
                  {activeDoc?.title || "Modul Pembelajaran"}
                </h1>
                <span className="text-[10px] text-[#5A5E70] font-medium block truncate">
                  {activeClassroom?.name || "Kelas Adaptif"}
                </span>
              </div>
            </div>

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

          {!activeDoc ? (
            /* EMPTY STATE */
            <div className="clay-card clay-white p-8 sm:p-12 rounded-3xl border border-black/5 text-center space-y-4 shadow-xs my-auto w-full">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF6F2] text-[#1D5E4D] flex items-center justify-center mx-auto shadow-2xs">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h2 className="text-lg sm:text-xl font-black text-[#1C1E26]">
                  Belum Ada Materi Terunggah
                </h2>
                <p className="text-xs sm:text-sm text-[#595F72] leading-relaxed">
                  Guru belum mengunggah modul di kelas ini.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Link
                  to="/student/class"
                  onClick={() => audioSynth.playClickSound()}
                  className="clay-btn clay-btn-dark px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <School className="w-4 h-4" />
                  <span>Cek Ruang Kelas</span>
                </Link>
                <Link
                  to="/student/ai"
                  onClick={() => audioSynth.playClickSound()}
                  className="clay-btn clay-btn-white px-5 py-2.5 rounded-2xl text-xs font-bold text-[#1C1E26] flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Bot className="w-4 h-4 text-[#4B3B7A]" />
                  <span>Tanya Asisten AI Tutor</span>
                </Link>
              </div>
            </div>
          ) : (
            /* LANGSUNG FOKUS KE KONTEN SIMULASI ADAPTIF */
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
                className="clay-btn clay-btn-dark w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
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
