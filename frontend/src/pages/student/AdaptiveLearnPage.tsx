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
} from "@/components/ui/icons";

export default function AdaptiveLearnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, documents, classrooms } = useApp();

  const formatParam = searchParams.get("format");
  const docParam = searchParams.get("doc");

  // Tab Modalitas Belajar Terpadu
  const [currentTab, setCurrentTab] = useState<"VISUAL" | "AUDITORI" | "KINESTETIK">(
    formatParam?.toUpperCase() === "AUDITORI" || formatParam?.toLowerCase() === "audio"
      ? "AUDITORI"
      : formatParam?.toUpperCase() === "KINESTETIK" || formatParam?.toLowerCase() === "kinestetik"
      ? "KINESTETIK"
      : currentUser?.learningStyle || "VISUAL"
  );

  useEffect(() => {
    if (formatParam) {
      const up = formatParam.toUpperCase();
      if (up === "AUDITORI" || up === "AUDIO") {
        setCurrentTab("AUDITORI");
      } else if (up === "KINESTETIK" || up === "PRACTICE") {
        setCurrentTab("KINESTETIK");
      } else if (up === "VISUAL") {
        setCurrentTab("VISUAL");
      }
    }
  }, [formatParam]);

  // 1. Multi-Classroom Filtering & Selection
  const myClassrooms = classrooms.filter((c) =>
    Boolean(currentUser?.id && c.studentIds?.includes(currentUser.id))
  );
  const effectiveClassrooms = myClassrooms.length > 0 ? myClassrooms : classrooms;

  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(
    effectiveClassrooms[0]?.id || ""
  );

  useEffect(() => {
    if (!selectedClassroomId && effectiveClassrooms[0]?.id) {
      setSelectedClassroomId(effectiveClassrooms[0].id);
    }
  }, [effectiveClassrooms, selectedClassroomId]);

  // Dokumen modul yang tersedia di kelas terpilih
  const classroomDocs = documents.filter((d) => d.classroomId === selectedClassroomId);
  const availableDocs = classroomDocs.length > 0 ? classroomDocs : documents;

  const [selectedDocId, setSelectedDocId] = useState<string>(availableDocs[0]?.id || "");

  useEffect(() => {
    if (docParam) {
      const matchDoc = documents.find((d) => d.id === docParam);
      if (matchDoc) {
        setSelectedDocId(matchDoc.id);
        if (matchDoc.classroomId) setSelectedClassroomId(matchDoc.classroomId);
        return;
      }
    }
    if (availableDocs.length > 0) {
      const found = availableDocs.find((d) => d.id === selectedDocId);
      if (!found) {
        setSelectedDocId(availableDocs[0].id);
      }
    }
  }, [availableDocs, selectedDocId, docParam, documents]);

  const activeDoc =
    availableDocs.find((d) => d.id === selectedDocId) || availableDocs[0] || documents[0];
  const activeClassroom =
    classrooms.find((c) => c.id === activeDoc?.classroomId) ||
    classrooms.find((c) => c.id === selectedClassroomId) ||
    effectiveClassrooms[0];

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-5 min-w-0 flex flex-col gap-5 pb-36 md:pb-12">
          {/* Top Bar: Back Link & 3-Modality Switcher */}
          <div className="flex items-center justify-between">
            <Link
              to="/student"
              onClick={() => audioSynth.playClickSound()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-2xs text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Beranda Siswa</span>
            </Link>

            {/* 3-Mode Adaptive Modality Switcher (Visual, Auditori, Kinestetik) */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-full border border-[rgba(28,30,38,0.08)] shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setCurrentTab("VISUAL");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTab === "VISUAL"
                    ? "bg-[#1D5E4D] text-white shadow-xs scale-102"
                    : "text-[#1D5E4D] hover:bg-[#EBF6F2]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visual</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setCurrentTab("AUDITORI");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTab === "AUDITORI"
                    ? "bg-[#4B3B7A] text-white shadow-xs scale-102"
                    : "text-[#4B3B7A] hover:bg-[#F4F0FD]"
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Auditori</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setCurrentTab("KINESTETIK");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentTab === "KINESTETIK"
                    ? "bg-[#785308] text-white shadow-xs scale-102"
                    : "text-[#785308] hover:bg-[#FFF9EE]"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Kinestetik</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 🌟 CLASSROOM & MULTI-CLASS SWITCHER BAR                   */}
          {/* ========================================================= */}
          <section className="clay-card bg-white p-3.5 sm:p-4 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-[#4B3B7A]" />
                <span className="text-xs font-extrabold text-[#1C1E26]">Pilih Kelas Materi:</span>
              </div>
              <span className="text-[10px] font-bold text-[#5A5E70]">
                {effectiveClassrooms.length} Kelas Diikuti
              </span>
            </div>

            {/* Classroom Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {effectiveClassrooms.map((cls) => {
                const isSelected = cls.id === selectedClassroomId;
                return (
                  <button
                    key={cls.id}
                    onClick={() => {
                      audioSynth.playClickSound();
                      setSelectedClassroomId(cls.id);
                    }}
                    className={`px-3.5 py-1.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#1C1E26] text-white shadow-xs"
                        : "bg-[#F0EEF6] text-[#4B3B7A] hover:bg-[#E3DBF8]"
                    }`}
                  >
                    <span>{cls.name}</span>
                    <span className="text-[10px] opacity-70 font-mono">({cls.subject})</span>
                  </button>
                );
              })}
            </div>

            {/* Document Switcher if Classroom has multiple documents */}
            {availableDocs.length > 1 && (
              <div className="pt-2 border-t border-black/5 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-[#5A5E70] uppercase shrink-0">
                  Modul Ajar:
                </span>
                {availableDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      audioSynth.playClickSound();
                      setSelectedDocId(doc.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                      doc.id === activeDoc?.id
                        ? "bg-[#D1EBE1] text-[#1D5E4D] font-extrabold"
                        : "bg-black/5 text-[#5A5E70] hover:bg-black/10"
                    }`}
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
            )}
          </section>

          {!activeDoc ? (
            /* EMPTY STATE */
            <div className="clay-card clay-white p-8 sm:p-12 rounded-3xl border border-black/5 text-center space-y-4 shadow-xs my-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF6F2] text-[#1D5E4D] flex items-center justify-center mx-auto shadow-2xs">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h2 className="text-lg sm:text-xl font-black text-[#1C1E26]">
                  Belum Ada Materi Terunggah di Kelas Ini
                </h2>
                <p className="text-xs sm:text-sm text-[#595F72] leading-relaxed">
                  Guru di kelas ini belum mengunggah modul ajar. Kamu dapat memilih kelas lain di atas atau mulai berdiskusi mandiri bersama Asisten AI Tutor.
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
            /* ACTIVE MATERIAL VIEW */
            <>
              {/* Header Topic Meta */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-[#1C1E26] border border-[rgba(28,30,38,0.08)]">
                    {activeClassroom?.name || "Kelas Adaptif"}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#5A5E70]">
                    {activeDoc.vectorId || "VEC-DOC"}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#010105]">
                  {activeDoc.title}
                </h1>
                <p className="text-xs text-[#5A5E70] font-medium mt-0.5 leading-relaxed">
                  {activeDoc.summary || "Materi kurikulum ter-grounding disajikan eksklusif sesuai profil kognitifmu."}
                </p>
              </div>

              {/* 👁️ 1. MODE VISUAL */}
              {currentTab === "VISUAL" && (
                <VisualLearnSection doc={activeDoc} />
              )}

              {/* 🎧 2. MODE AUDITORI */}
              {currentTab === "AUDITORI" && (
                <AuditoryLearnSection
                  doc={activeDoc}
                  classroomName={activeClassroom?.name}
                />
              )}

              {/* ✋ 3. MODE KINESTETIK */}
              {currentTab === "KINESTETIK" && (
                <KinestheticLearnSection doc={activeDoc} />
              )}

              {/* Action Button to Adaptive Quiz */}
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  navigate("/quiz");
                }}
                className="clay-btn clay-btn-dark w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2"
              >
                <span>Uji Pemahaman di Kuis Adaptif DDA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
