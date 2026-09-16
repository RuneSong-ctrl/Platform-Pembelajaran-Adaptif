import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import { ApiService, normalizeDocument } from "@/services/apiClient";
import type { GroundedDocument } from "@/types";
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  ArrowRight,
  School,
  FileText,
  Clock,
  ChevronDown,
  Layers,
  Loader2,
  ExternalLink,
  Download,
} from "@/components/ui/icons";

export default function ClassMaterialReaderPage() {
  const { classId, docId } = useParams<{ classId: string; docId: string }>();
  const navigate = useNavigate();
  const { documents, classrooms, isSyncing } = useApp();

  const [localDoc, setLocalDoc] = useState<GroundedDocument | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf");
  const [pdfLoadError, setPdfLoadError] = useState(false);

  // 1. Find document with robust string comparison
  const docFromContext = documents.find((d) => String(d.id) === String(docId));
  const doc = docFromContext || localDoc;

  // 2. Find classroom with robust matching or fallback
  const classroom =
    classrooms.find(
      (c) =>
        String(c.id) === String(classId) ||
        (classId && c.joinCode?.toUpperCase() === classId.toUpperCase())
    ) ||
    (doc ? classrooms.find((c) => String(c.id) === String(doc.classroomId)) : undefined) ||
    classrooms[0];

  // 3. Fallback direct fetch if not found in context on fresh reload
  useEffect(() => {
    if (!doc && docId) {
      setIsLoadingDoc(true);
      ApiService.getDocuments(classId)
        .then((res) => {
          if (res && res.length > 0) {
            const found = res.find((d: any) => String(d.id) === String(docId));
            if (found) {
              setLocalDoc(normalizeDocument(found));
            }
          }
        })
        .catch((err) => {
          console.warn("[ClassMaterialReaderPage] Direct fetch error:", err);
        })
        .finally(() => {
          setIsLoadingDoc(false);
        });
    }
  }, [doc, docId, classId]);

  // Loading state while syncing or fetching
  if (!doc && (isSyncing || isLoadingDoc)) {
    return (
      <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 overflow-hidden w-full">
          <StudentSidebar />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="clay-card bg-white p-8 rounded-3xl text-center space-y-3 shadow-xs max-w-xs">
              <Loader2 className="w-8 h-8 animate-spin text-[#4B3B7A] mx-auto" />
              <p className="text-xs font-bold text-[#5A5E70]">Memuat dokumen materi...</p>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  // 404 state only when document is confirmed absent
  if (!doc) {
    return (
      <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 overflow-hidden w-full">
          <StudentSidebar />
          <main className="flex-1 overflow-y-auto flex items-center justify-center p-6 pb-24 md:pb-8">
            <div className="clay-card bg-white p-8 rounded-3xl text-center space-y-4 max-w-sm w-full shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#FCD9D7] text-[#852C28] flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-[#1C1E26]">Materi Tidak Ditemukan</h2>
              <p className="text-xs text-[#5A5E70]">
                Dokumen modul pembelajaran ini tidak ditemukan atau telah diperbarui.
              </p>
              <Link
                to={classId ? `/student/class/${classId}` : "/student/class"}
                onClick={() => audioSynth.playClickSound()}
                className="clay-btn clay-btn-dark px-4 py-2.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Kelas</span>
              </Link>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  /** Resolves a fully qualified PDF URL guaranteed to serve the file */
  const resolvePdfUrl = (docObj: GroundedDocument): string => {
    const backendBase = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
    const origin = backendBase.replace(/\/api\/v1\/?$/, "");

    if (docObj.fileUrl && docObj.fileUrl.startsWith("/uploads/")) {
      return `${origin}${docObj.fileUrl}`;
    }
    if (
      docObj.fileUrl &&
      (docObj.fileUrl.startsWith("http://") || docObj.fileUrl.startsWith("https://"))
    ) {
      return docObj.fileUrl;
    }
    // Guaranteed fallback endpoint with auto-generation on FastAPI backend
    return `${origin}/api/v1/documents/${docObj.id}/pdf`;
  };

  const pdfUrl = resolvePdfUrl(doc);
  const hasRawText = Boolean(doc.rawText && doc.rawText.trim().length > 0);
  const targetClassId = classId || classroom?.id || doc.classroomId;

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-5 min-w-0 flex flex-col gap-4 pb-28 md:pb-10">
          {/* Top Header & Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to={`/student/class/${targetClassId}`}
              onClick={() => audioSynth.playClickSound()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-2xs text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Kembali ke Kelas</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-[#E3DBF8] text-[#4B3B7A] shadow-2xs">
                Dokumen Modul Kelas
              </span>
            </div>
          </div>

          {/* Material Header Card */}
          <div className="clay-card bg-white p-5 sm:p-7 rounded-3xl border border-black/5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D] text-[10px] font-extrabold">
                {classroom?.name || "Kelas Belajar"}
              </span>
              <span className="text-[10px] text-[#5A5E70] font-bold">
                {classroom?.subject || "Kurikulum"} • Kelas {classroom?.grade || "10"}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-[#010105] leading-snug">
              {doc.title}
            </h1>

            <div className="flex items-center gap-3 text-[10px] text-[#5A5E70] font-medium pt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#9195A8]" />
                Diupload: {new Date(doc.uploadedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {classroom?.teacherName && (
                <>
                  <span>•</span>
                  <span>Pengajar: {classroom.teacherName}</span>
                </>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* FORMAT SELECTOR TABS (Dokumen PDF vs Teks Terformat)     */}
          {/* ========================================================= */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex bg-white rounded-2xl p-1 border border-[rgba(28,30,38,0.06)] shadow-2xs">
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setViewMode("pdf");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === "pdf"
                    ? "bg-[#1C1E26] text-white shadow-xs"
                    : "text-[#5A5E70] hover:text-[#1C1E26]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dokumen PDF Guru</span>
              </button>

              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setViewMode("text");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === "text"
                    ? "bg-[#1C1E26] text-white shadow-xs"
                    : "text-[#5A5E70] hover:text-[#1C1E26]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Teks Digital Terformat</span>
              </button>
            </div>

            {/* Quick Actions (Open in Tab / Download) */}
            <div className="flex items-center gap-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[rgba(28,30,38,0.08)] text-xs font-bold text-[#4B3B7A] hover:bg-[#F0EEF6] transition-all shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka PDF di Tab Baru</span>
              </a>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CONTENT VIEWER (Dokumen Asli / Teks Terformat)            */}
          {/* ========================================================= */}
          {viewMode === "pdf" && !pdfLoadError ? (
            <div className="space-y-3">
              {/* Embedded PDF Viewer */}
              <div className="clay-card bg-white p-0 overflow-hidden rounded-3xl border border-black/5 shadow-xs">
                <div className="bg-[#F0EEF6] px-4 sm:px-5 py-3 border-b border-black/5 flex items-center justify-between text-xs font-black text-[#4B3B7A]">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Dokumen Asli Guru (PDF Viewer)</span>
                  </span>
                  <span className="text-[10px] text-[#5A5E70] font-normal hidden sm:inline">
                    Gunakan scroll &amp; zoom internal untuk membaca
                  </span>
                </div>
                <iframe
                  src={pdfUrl}
                  title={doc.title}
                  onError={() => setPdfLoadError(true)}
                  className="w-full min-h-[65vh] sm:min-h-[78vh] border-0 bg-[#525659]"
                />
              </div>

              {/* Optional Collapsible Text Fallback */}
              {hasRawText && (
                <details className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-black/5 shadow-2xs group">
                  <summary className="text-xs font-black text-[#5A5E70] cursor-pointer flex items-center justify-between list-none">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#4B3B7A]" />
                      <span>Tampilkan Versi Teks Digital (Jika PDF Tidak Terbaca)</span>
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 pt-3 border-t border-black/5 space-y-2.5 text-xs sm:text-sm text-[#1C1E26] leading-relaxed font-normal">
                    {doc.rawText.split("\n").map((p, i) =>
                      p.trim() ? (
                        <p key={i}>{p}</p>
                      ) : (
                        <div key={i} className="h-1.5" />
                      )
                    )}
                  </div>
                </details>
              )}
            </div>
          ) : (
            /* Formatted Digital Text Reader */
            <div className="clay-card bg-white p-5 sm:p-8 rounded-3xl border border-black/5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 text-xs font-bold text-[#5A5E70]">
                <span className="flex items-center gap-1.5 text-[#1D5E4D]">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-black">Naskah Bacaan Lengkap</span>
                </span>
                <span className="text-[10px] bg-[#F0EEF6] text-[#4B3B7A] px-2.5 py-0.5 rounded-full font-bold">
                  Format Teks Digital
                </span>
              </div>

              {hasRawText ? (
                <div className="space-y-3.5 text-xs sm:text-sm text-[#1C1E26] leading-relaxed max-w-4xl">
                  {doc.rawText.split("\n").map((paragraph, idx) =>
                    paragraph.trim() ? (
                      <p key={idx} className="font-normal text-[#1C1E26]">
                        {paragraph}
                      </p>
                    ) : (
                      <div key={idx} className="h-2" />
                    )
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#5A5E70]">
                  {doc.summary || "Belum ada konten teks rinci untuk materi ini."}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* CTA BAR: DIRECT LAUNCH TO ADAPTIVE LEARNING (STATIC IN-FLOW) */}
          {/* ========================================================= */}
          <div className="pt-3 pb-2">
            <div className="clay-card bg-[#1C1E26] text-white p-5 sm:p-6 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFE299] block">
                  Belajar Lebih Dalam
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  Ingin Mempelajari Materi Ini dengan Gaya Belajarmu?
                </h3>
                <p className="text-xs text-white/70">
                  Akses simulasi interaktif kinestetik, podcast audio naratif, atau peta konsep visual di Halaman Belajar Adaptif.
                </p>
              </div>

              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  navigate(`/student/learn?class=${targetClassId}&doc=${doc.id}`);
                }}
                className="clay-btn bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 w-full sm:w-auto active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#FFE299]" />
                <span>Pelajari Secara Adaptif</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
