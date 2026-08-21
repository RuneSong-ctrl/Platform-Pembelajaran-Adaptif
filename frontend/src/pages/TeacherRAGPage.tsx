import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { audioSynth } from "@/services/audioSynth";
import {
  UploadCloud,
  Lock,
  FileText,
  Trash2,
  Database,
  ShieldCheck,
  CheckCircle2,
} from "@/components/ui/icons";

export default function TeacherRAGPage() {
  const { documents, uploadDocument, deleteDocument, classrooms } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>("cls_bio_10a");
  const [strictGrounding, setStrictGrounding] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = (fileName: string, text: string) => {
    setIsUploading(true);
    audioSynth.playClickSound();

    setTimeout(() => {
      uploadDocument(
        selectedClassId,
        fileName,
        text,
        "Ekstraksi modul PDF kurikulum resmi."
      );
      setIsUploading(false);
      audioSynth.playSuccessSound();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col">
      <Navbar />

      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        {/* Responsive Desktop Sidebar */}
        <TeacherSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-x-hidden space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="clay-pill clay-lavender px-3 py-0.5 text-xs font-extrabold text-[#4B3B7A]">
                  ChromaDB Vector Store
                </span>
                <span className="clay-pill clay-mint px-3 py-0.5 text-xs font-bold text-[#1D5E4D]">
                  Zero Hallucination Guard
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">
                Knowledge Base &amp; RAG Ingestion Center
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-1">
                Unggah modul PDF dan buku ajar. AI hanya menghasilkan materi dan kuis yang ter-grounding 100% dari sumber ini.
              </p>
            </div>
          </div>

          {/* STRICT GROUNDING TOGGLE & CLASS SELECTOR */}
          <div className="clay-card clay-white p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#5A5E70] block">Rombongan Belajar Target:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="mt-1.5 p-2.5 rounded-2xl border border-[rgba(28,30,38,0.1)] text-xs font-bold text-[#010105] bg-[#F8F9FD] focus:outline-none cursor-pointer"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.joinCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Strict Grounding Switch */}
              <div className="clay-card clay-lavender p-4 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-white text-[#4B3B7A] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#4B3B7A]">
                    Strict School Grounding Lock
                  </h4>
                  <p className="text-[10px] text-[#4B3B7A]/80 font-medium">
                    AI dilarang mengambil informasi di luar dokumen modul yang diunggah
                  </p>
                </div>
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    setStrictGrounding(!strictGrounding);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ml-2 cursor-pointer ${
                    strictGrounding ? "bg-[#4B3B7A]" : "bg-[#c7c6cb]"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      strictGrounding ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* UPLOAD SIMULATION DROPZONE */}
          <div className="clay-card p-8 bg-[#FAF8FD] border-2 border-dashed border-[#E0DAF5] rounded-3xl text-center space-y-4">
            <div className="clay-card clay-white w-14 h-14 rounded-2xl flex items-center justify-center text-[#4B3B7A] mx-auto">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-black text-[#010105]">
                Unggah Dokumen PDF Modul Ajar
              </h3>
              <p className="text-xs text-[#5A5E70] font-medium">
                Sistem akan melakukan ekstraksi teks otomatis, semantic chunking, dan pembobotan embedding vektor.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() =>
                  handleSimulateUpload(
                    "BAB 5 - Sistem Sirkulasi & Jantung.pdf",
                    "Jantung manusia terdiri dari empat ruang: atrium dekstra, atrium sinistra, ventrikel dekstra, dan ventrikel sinistra..."
                  )
                }
                disabled={isUploading}
                className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>{isUploading ? "Memproses Chunking..." : "Simulasi Upload: Modul Bab 5 Sirkulasi.pdf"}</span>
              </button>
            </div>
          </div>

          {/* INGESTED DOCUMENTS TABLE */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#010105]">
                  Daftar Modul Terindeks di ChromaDB
                </h2>
                <p className="text-xs text-[#5A5E70]">
                  Dokumen yang aktif menjadi basis data generative AI kuis dan pembelajaran.
                </p>
              </div>
              <span className="clay-pill clay-mint px-3 py-1 text-xs font-extrabold text-[#1D5E4D]">
                {documents.length} Dokumen Aktif
              </span>
            </div>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="clay-card clay-card-hover clay-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="clay-card clay-mint w-11 h-11 rounded-2xl flex items-center justify-center text-[#1D5E4D] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="clay-pill clay-mint text-[10px] font-extrabold px-2.5 py-0.5 text-[#1D5E4D]">
                          {doc.status}
                        </span>
                        <span className="clay-pill clay-dark text-[10px] font-mono font-bold px-2 py-0.5">
                          {doc.vectorId}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-[#010105]">{doc.title}</h4>
                      <p className="text-xs text-[#5A5E70] mt-0.5">{doc.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="clay-pill bg-[#F8F9FD] px-3 py-1 text-xs font-bold text-[#5A5E70]">
                      {doc.chunksCount} Semantic Chunks
                    </span>
                    <button
                      onClick={() => {
                        audioSynth.playClickSound();
                        deleteDocument(doc.id);
                      }}
                      className="clay-btn clay-btn-white w-9 h-9 rounded-xl text-[#ba1a1a] flex items-center justify-center cursor-pointer"
                      title="Hapus Modul"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
