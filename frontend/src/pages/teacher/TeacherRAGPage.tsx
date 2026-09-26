import React, { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { audioSynth } from "@/services/audioSynth";
import LearningUnits from "@/components/student/LearningUnits";
import { UploadCloud, Lock, FileText, Trash2, Plus, X, BookOpen, AlertCircle, ChevronDown } from "@/components/ui/icons";

const STATUS: Record<string, { label: string; tone: string }> = {
  READY: { label: "Siap", tone: "clay-mint text-[#1D5E4D]" },
  PROCESSING: { label: "Sedang diproses", tone: "clay-butter text-[#785308]" },
  ERROR: { label: "Gagal diproses", tone: "clay-coral text-[#852C28]" },
};

export default function TeacherRAGPage() {
  const { documents, uploadDocument, uploadDocumentFile, deleteDocument, classrooms, currentUser } = useApp();
  const myClasses = classrooms.filter((c) => c.teacherId === currentUser.id);
  const [params, setParams] = useSearchParams();
  const filter = params.get("kelas") || "";
  const setFilter = (id: string) => setParams(id ? { kelas: id } : {}, { replace: true });

  const [reviewId, setReviewId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Upload form
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "teks">("file");
  const [targetClassId, setTargetClassId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myDocs = documents.filter((d) => myClasses.some((c) => c.id === d.classroomId));
  const shown = filter ? myDocs.filter((d) => d.classroomId === filter) : myDocs;
  const className = (id: string) => myClasses.find((c) => c.id === id)?.name || "";

  const openUpload = () => {
    audioSynth.playClickSound();
    setTargetClassId(filter || myClasses[0]?.id || "");
    setError("");
    setModalOpen(true);
  };

  const resetForm = () => {
    setModalOpen(false);
    setFile(null);
    setTitle("");
    setSummary("");
    setRawText("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setError("");
    if (!title.trim()) setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " "));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClassId || !title.trim()) return;
    if (mode === "file" ? !file : !rawText.trim()) return;
    setIsUploading(true);
    setError("");
    try {
      if (mode === "file" && file) {
        await uploadDocumentFile(targetClassId, file, title.trim(), summary.trim() || undefined);
      } else {
        await uploadDocument(targetClassId, title.trim(), rawText.trim(), summary.trim() || rawText.trim().slice(0, 120));
      }
      audioSynth.playSuccessSound();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unggah gagal. Coba lagi.");
      audioSynth.playErrorSound();
    } finally {
      setIsUploading(false);
    }
  };

  const canSubmit = !!targetClassId && !!title.trim() && (mode === "file" ? !!file : !!rawText.trim()) && !isUploading;

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <TeacherSidebar />

        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">Materi Ajar</h1>
                <p className="text-sm text-[#5A5E70] mt-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  Materi hanya bisa dibuka oleh siswa di kelas tujuannya.
                </p>
              </div>
              {myClasses.length > 0 && (
                <button
                  onClick={openUpload}
                  className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Unggah materi</span>
                </button>
              )}
            </header>

            {myClasses.length === 0 ? (
              <Empty title="Buat kelas dulu">
                Materi selalu diunggah ke salah satu kelas. <Link to="/teacher" className="font-bold underline">Buat kelas di Beranda</Link>.
              </Empty>
            ) : (
              <>
                {/* Class filter */}
                {myClasses.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Pilih kelas">
                    {[{ id: "", name: "Semua kelas" }, ...myClasses].map((c) => (
                      <button
                        key={c.id}
                        role="tab"
                        aria-selected={filter === c.id}
                        onClick={() => setFilter(c.id)}
                        className={`clay-pill px-3.5 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                          filter === c.id ? "clay-dark text-white" : "clay-white text-[#5A5E70]"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}

                {shown.length === 0 ? (
                  <Empty title="Belum ada materi">
                    Unggah PDF atau tempel teks materi. Setelah itu Anda bisa meninjau isinya sebelum siswa melihat.
                  </Empty>
                ) : (
                  <ul className="space-y-3">
                    {shown.map((doc) => {
                      const status = STATUS[doc.status] || STATUS.READY;
                      const open = reviewId === doc.id;
                      return (
                        <li key={doc.id} className="clay-card clay-white overflow-hidden">
                          <div className="p-4 sm:p-5 flex items-center gap-3.5">
                            <div className="clay-card clay-mint w-10 h-10 rounded-2xl flex items-center justify-center text-[#1D5E4D] shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-black text-[#010105] truncate">{doc.title}</h3>
                              <p className="text-xs text-[#5A5E70] truncate">
                                {className(doc.classroomId)} · {new Date(doc.uploadedAt).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                            <span className={`clay-pill ${status.tone} text-mini font-extrabold px-2.5 py-0.5 hidden sm:inline-block`}>
                              {status.label}
                            </span>
                            <button
                              onClick={() => {
                                audioSynth.playClickSound();
                                setReviewId(open ? null : doc.id);
                              }}
                              aria-expanded={open}
                              className="clay-btn clay-btn-white px-3.5 py-2 text-xs font-black flex items-center gap-1 cursor-pointer"
                            >
                              {open ? "Tutup" : "Tinjau"}
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                            </button>
                            {confirmDeleteId === doc.id ? (
                              <span className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    audioSynth.playClickSound();
                                    deleteDocument(doc.id);
                                    setConfirmDeleteId(null);
                                    if (open) setReviewId(null);
                                  }}
                                  className="clay-btn clay-btn-coral px-3 py-2 text-xs font-black cursor-pointer"
                                >
                                  Hapus
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs font-bold text-[#5A5E70] px-1 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(doc.id)}
                                className="clay-btn clay-btn-white w-9 h-9 rounded-xl text-[#ba1a1a] flex items-center justify-center cursor-pointer shrink-0"
                                title="Hapus materi"
                                aria-label={`Hapus ${doc.title}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {open && (
                            <div className="border-t border-[rgba(28,30,38,0.06)] p-4 sm:p-5 bg-[#FAFBFE]">
                              <p className="text-xs text-[#5A5E70] mb-3">
                                Periksa isi yang dibuat dari materi ini. Siswa baru bisa melihatnya setelah Anda menyetujui.
                              </p>
                              <LearningUnits key={doc.id} documentId={doc.id} teacher />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Upload modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="clay-card clay-white w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-black/10 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1C1E26]">Unggah materi</h3>
              <button
                onClick={resetForm}
                aria-label="Tutup"
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#5A5E70] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <Field label="Untuk kelas">
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.12)] text-xs font-bold text-[#1C1E26] bg-[#F8F9FD] focus:outline-none cursor-pointer"
                >
                  {myClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Source: file or pasted text */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#F1F2F7]">
                {(["file", "teks"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-2 rounded-xl text-xs font-black cursor-pointer ${
                      mode === m ? "bg-white text-[#010105] shadow-xs" : "text-[#5A5E70]"
                    }`}
                  >
                    {m === "file" ? "Dari file" : "Tulis / tempel teks"}
                  </button>
                ))}
              </div>

              {mode === "file" ? (
                <div>
                  <label className="p-5 rounded-2xl border-2 border-dashed border-[#1D5E4D]/30 bg-[#EBF6F2]/40 hover:bg-[#EBF6F2]/70 transition-colors text-center block cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                      className="sr-only"
                    />
                    <UploadCloud className="w-6 h-6 text-[#1D5E4D] mx-auto mb-1.5" />
                    <span className="block text-xs font-black text-[#1D5E4D]">
                      {file ? file.name : "Pilih file PDF atau teks"}
                    </span>
                    <span className="block text-mini text-[#5A5E70] mt-0.5">
                      {file ? `${(file.size / 1024).toFixed(0)} KB · klik untuk ganti` : "PDF, TXT, atau MD · maksimal 20 MB"}
                    </span>
                  </label>
                  <p className="text-mini text-[#9195A8] mt-1.5">PDF hasil scan (foto) tidak bisa dibaca. Pakai PDF yang teksnya bisa diblok.</p>
                </div>
              ) : (
                <Field label="Isi materi">
                  <textarea
                    rows={6}
                    placeholder="Tempel isi materi di sini: penjelasan, definisi, dan contoh."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.12)] text-xs text-[#1C1E26] bg-[#F8F9FD] focus:outline-none leading-relaxed"
                  />
                </Field>
              )}

              <Field label="Judul materi">
                <input
                  type="text"
                  placeholder="Contoh: Bab 4 – Sistem Ekskresi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.12)] text-xs font-bold text-[#1C1E26] bg-[#F8F9FD] focus:outline-none"
                />
              </Field>

              <Field label="Keterangan singkat (opsional)">
                <input
                  type="text"
                  placeholder="Satu kalimat tentang isi materi"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.12)] text-xs text-[#1C1E26] bg-[#F8F9FD] focus:outline-none"
                />
              </Field>

              {error && (
                <p role="alert" className="p-2.5 rounded-xl bg-[#FDE8E8] text-[#9B1C1C] text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="clay-btn clay-btn-white px-4 py-2.5 rounded-2xl text-xs font-bold text-[#5A5E70] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="clay-btn clay-btn-dark px-5 py-2.5 rounded-2xl text-xs font-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Mengunggah..." : "Unggah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[#5A5E70] block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="clay-card clay-white p-8 text-center space-y-2">
      <BookOpen className="w-8 h-8 text-[#9195A8] mx-auto" />
      <h3 className="text-sm font-black text-[#010105]">{title}</h3>
      <p className="text-xs text-[#5A5E70] max-w-sm mx-auto">{children}</p>
    </div>
  );
}
