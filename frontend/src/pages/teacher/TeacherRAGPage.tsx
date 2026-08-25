import React, { useState, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { audioSynth } from "@/services/audioSynth";
import { ApiService } from "@/services/apiClient";
import {
  UploadCloud,
  Lock,
  FileText,
  Trash2,
  Database,
  Plus,
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "@/components/ui/icons";

export default function TeacherRAGPage() {
  const { documents, uploadDocument, uploadDocumentFile, deleteDocument, classrooms } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(
    classrooms[0]?.id || ""
  );
  const [strictGrounding, setStrictGrounding] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Custom upload form state
  const [customTitle, setCustomTitle] = useState("");
  const [customSummary, setCustomSummary] = useState("");
  const [customRawText, setCustomRawText] = useState("");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState("");
  const [extractError, setExtractError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsExtracting(true);
    setExtractMsg("");
    setExtractError("");
    audioSynth.playClickSound();

    if (file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const res = await ApiService.extractDocumentText(file);
        if (res && res.text && res.text.trim()) {
          if (!customTitle.trim()) {
            setCustomTitle(res.title);
          }
          setCustomRawText(res.text);
          setExtractMsg(`Teks PDF (${res.text.length} karakter) berhasil diekstrak!`);
          audioSynth.playSuccessSound();
        } else {
          setExtractError("File PDF tidak memuat teks digital yang dapat dibaca.");
          audioSynth.playErrorSound();
        }
      } catch (err) {
        setExtractError("Gagal mengekstrak file PDF.");
        audioSynth.playErrorSound();
      } finally {
        setIsExtracting(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          if (!customTitle.trim()) {
            setCustomTitle(
              file.name.replace(/\.[^/.]+$/, "").replace(/[_\-]+/g, " ")
            );
          }
          setCustomRawText(text);
          setExtractMsg(`File ${file.name} (${text.length} karakter) siap disimpan.`);
          audioSynth.playSuccessSound();
        }
        setIsExtracting(false);
      };
      reader.onerror = () => {
        setExtractError("Gagal membaca file dokumen.");
        setIsExtracting(false);
      };
      reader.readAsText(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setExtractMsg("");
    setExtractError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCustomUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    if (!customRawText.trim() && !selectedFile) return;

    setIsUploading(true);
    audioSynth.playClickSound();

    try {
      if (selectedFile) {
        await uploadDocumentFile(
          selectedClassId,
          selectedFile,
          customTitle.trim(),
          customSummary.trim() || customRawText.slice(0, 120) + "..."
        );
      } else {
        await uploadDocument(
          selectedClassId,
          customTitle.trim(),
          customRawText.trim(),
          customSummary.trim() || customRawText.slice(0, 120) + "..."
        );
      }
      audioSynth.playSuccessSound();
      setIsCustomModalOpen(false);
      setSelectedFile(null);
      setCustomTitle("");
      setCustomSummary("");
      setCustomRawText("");
      setExtractMsg("");
      setExtractError("");
    } catch (err) {
      console.error("Upload error", err);
      audioSynth.playErrorSound();
    } finally {
      setIsUploading(false);
    }
  };

  const handlePresetUpload = async (title: string, rawText: string, summary: string) => {
    setIsUploading(true);
    audioSynth.playClickSound();

    try {
      await uploadDocument(selectedClassId, title, rawText, summary);
      audioSynth.playSuccessSound();
    } catch (err) {
      console.error("Preset upload error", err);
      audioSynth.playErrorSound();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Responsive Desktop Sidebar */}
        <TeacherSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-5 space-y-6 sm:space-y-8">
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
                Unggah modul PDF dan silabus ajar. AI hanya menghasilkan materi dan kuis yang ter-grounding 100% dari sumber ini.
              </p>
            </div>

            <button
              onClick={() => {
                audioSynth.playClickSound();
                setIsCustomModalOpen(true);
              }}
              className="clay-btn clay-btn-dark px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Modul Kustom</span>
            </button>
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
            <div className="clay-card clay-white w-14 h-14 rounded-2xl flex items-center justify-center text-[#4B3B7A] mx-auto shadow-2xs">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-black text-[#010105]">
                Unggah Dokumen Silabus / Modul Ajar
              </h3>
              <p className="text-xs text-[#5A5E70] font-medium">
                Sistem akan melakukan ekstraksi teks otomatis, semantic chunking, dan pembobotan embedding vektor ke database backend.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="clay-btn clay-btn-dark px-6 py-3 text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Input Modul / Silabus Baru</span>
              </button>
            </div>
          </div>

          {/* INGESTED DOCUMENTS TABLE */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#010105]">
                  Daftar Modul Terindeks di Database &amp; ChromaDB
                </h2>
                <p className="text-xs text-[#5A5E70]">
                  Dokumen yang aktif menjadi basis data generative AI kuis dan pembelajaran adaptif.
                </p>
              </div>
              <span className="clay-pill clay-mint px-3 py-1 text-xs font-extrabold text-[#1D5E4D]">
                {documents.length} Dokumen Aktif
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="clay-card clay-white p-8 rounded-3xl border border-black/5 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-[#9195A8] mx-auto" />
                <h3 className="text-sm font-bold text-[#1C1E26]">
                  Belum Ada Dokumen Modul Terunggah
                </h3>
                <p className="text-xs text-[#5A5E70] max-w-sm mx-auto">
                  Klik tombol "Unggah Modul Kustom" di atas untuk menambahkan silabus pembelajaran pertama Anda.
                </p>
              </div>
            ) : (
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
            )}
          </section>
        </main>
      </div>

      {/* CUSTOM UPLOAD MODAL */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clay-card clay-white w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-black/10 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EBF6F2] text-[#1D5E4D] flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[#1C1E26]">
                  Unggah Modul / Silabus Pembelajaran
                </h3>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#5A5E70] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomUpload} className="space-y-4">
              {/* Interactive File Dropzone for PDF / TXT / MD */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5E70] block">
                  Unggah Berkas PDF / Dokumen:
                </label>
                
                <div className="p-4 rounded-2xl border-2 border-dashed border-[#1D5E4D]/30 bg-[#EBF6F2]/40 hover:bg-[#EBF6F2]/70 transition-all text-center space-y-2 relative group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="w-10 h-10 rounded-2xl bg-white text-[#1D5E4D] mx-auto flex items-center justify-center shadow-xs">
                    {isExtracting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#1D5E4D]">
                      {isExtracting ? "Mengekstrak Teks dari PDF..." : "Pilih File PDF / Dokumen Modul Ajar"}
                    </p>
                    <p className="text-[10px] text-[#5A5E70] mt-0.5">
                      Mendukung format .pdf, .txt, .md (Teks otomatis diekstrak ke formulir di bawah)
                    </p>
                  </div>
                </div>

                {/* Selected File Feedback Badge */}
                {selectedFile && (
                  <div className="p-2.5 rounded-xl bg-white border border-[#1D5E4D]/20 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#1D5E4D] shrink-0" />
                      <span className="text-xs font-bold text-[#1C1E26] truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-[#5A5E70] font-mono shrink-0">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="p-1 rounded-lg hover:bg-black/5 text-[#5A5E70] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                      title="Hapus file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {extractMsg && (
                  <div className="p-2 rounded-xl bg-[#EBF6F2] text-[#1D5E4D] text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{extractMsg}</span>
                  </div>
                )}

                {extractError && (
                  <div className="p-2 rounded-xl bg-[#FDE8E8] text-[#9B1C1C] text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{extractError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[#5A5E70] block mb-1">
                  Judul Modul / Topik Bab:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 4 - Sistem Ekskresi Ginjal Manusia"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.12)] text-xs font-bold text-[#1C1E26] bg-[#F8F9FD] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5A5E70] block mb-1">
                  Ringkasan Modul (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Penjelasan ringkas materi untuk siswa"
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.12)] text-xs font-bold text-[#1C1E26] bg-[#F8F9FD] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5A5E70] block mb-1">
                  Isi / Teks Modul Pembelajaran (Grounding AI):
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tempelkan isi rangkuman silabus, konsep utama, dan definisi yang akan dijadikan rujukan oleh Asisten AI Tutor dan Generator Kuis DDA..."
                  value={customRawText}
                  onChange={(e) => setCustomRawText(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.12)] text-xs text-[#1C1E26] bg-[#F8F9FD] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomModalOpen(false);
                    handleClearFile();
                  }}
                  className="clay-btn clay-btn-white px-4 py-2.5 rounded-2xl text-xs font-bold text-[#5A5E70] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || isExtracting}
                  className="clay-btn clay-btn-dark px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span>{isUploading ? "Memproses & Vektorisasi..." : "Simpan Dokumen"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
