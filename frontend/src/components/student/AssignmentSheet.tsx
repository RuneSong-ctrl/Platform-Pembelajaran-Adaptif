import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/contexts/AppContext";
import { mediaUrl } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import { FILE_ACCEPT, MAX_FILES, fileProblem, formatFileSize, formatWhen, taskDeadline } from "@/lib/tasks";
import type { AssignmentSubmission, FileRef, GroundedTask } from "@/types";
import { X, FileText, UploadCloud, Loader2, CheckCircle2, AlertCircle, Clock } from "@/components/ui/icons";

/**
 * An assignment as the student sees it: instructions, the teacher's files, and the hand-in form.
 * Rendered on <body> so the app header and bottom nav never cover it; a bottom sheet on phones.
 */
export default function AssignmentSheet({ task, submission, onClose }: {
  task: GroundedTask;
  submission?: AssignmentSubmission;
  onClose: () => void;
}) {
  const { submitAssignment } = useApp();
  const [text, setText] = useState(submission?.content || "");
  const [kept, setKept] = useState<FileRef[]>(submission?.attachments || []);
  const [added, setAdded] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const graded = submission?.status === "Graded";
  const due = taskDeadline(task);
  const overdue = Boolean(due && due.getTime() < Date.now());
  const canSend = !graded && !sending && (text.trim() || kept.length || added.length);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const bad = files.map(fileProblem).find(Boolean);
    if (bad) return setError(bad);
    if (kept.length + added.length + files.length > MAX_FILES) return setError(`Maksimal ${MAX_FILES} file.`);
    setError("");
    setAdded((prev) => [...prev, ...files]);
  };

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setError("");
    try {
      await submitAssignment(task.id, text.trim(), added, kept.map((f) => f.id));
      audioSynth.playSuccessSound();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim. Coba lagi.");
      audioSynth.playErrorSound();
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black/30 flex items-end md:items-center justify-center md:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
        onClick={(e) => e.stopPropagation()}
        className="clay-card clay-white w-full md:max-w-lg max-h-[92dvh] overflow-y-auto rounded-b-none md:rounded-[28px] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <span className="clay-pill clay-mint px-2.5 py-0.5 text-mini font-extrabold text-[#1D5E4D]">Tugas</span>
            <h2 className="text-lg font-black text-[#1C1E26] mt-1.5 break-words">{task.title}</h2>
            {due && (
              <p className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${overdue && !submission ? "text-[#852C28]" : "text-[#5A5E70]"}`}>
                <Clock className="w-3.5 h-3.5" /> Tenggat {formatWhen(due)}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="p-2 rounded-xl bg-[#F0EEF6] text-[#5A5E70] cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {task.contentJson?.instructions && (
          <p className="text-sm text-[#1C1E26] leading-relaxed whitespace-pre-wrap">{task.contentJson.instructions}</p>
        )}

        {(task.attachments || []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-[#5A5E70]">Lampiran dari guru</p>
            {task.attachments!.map((f) => (
              <a key={f.id} href={mediaUrl(f.path)} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#F7F6FA] hover:bg-[#F0EEF6]">
                <FileText className="w-4 h-4 text-[#4B3B7A] shrink-0" />
                <span className="flex-1 min-w-0 text-xs font-bold text-[#1C1E26] truncate">{f.name}</span>
                <span className="text-mini text-[#9195A8]">{formatFileSize(f.size)}</span>
              </a>
            ))}
          </div>
        )}

        {graded && (
          <div className="clay-card clay-mint p-4">
            <p className="text-xs font-extrabold text-[#1D5E4D] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Sudah dinilai</p>
            <p className="text-3xl font-black text-[#1C1E26] mt-1">{submission?.grade}</p>
            {submission?.feedback && <p className="text-sm text-[#1C1E26] mt-1 whitespace-pre-wrap">{submission.feedback}</p>}
          </div>
        )}

        <div className="space-y-3 border-t border-black/5 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-[#1C1E26]">Jawabanmu</p>
            {submission && (
              <span className={`text-mini font-extrabold ${submission.isLate ? "text-[#852C28]" : "text-[#1D5E4D]"}`}>
                {submission.isLate ? "Dikumpulkan terlambat" : "Sudah dikumpulkan"}
              </span>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            readOnly={graded}
            placeholder="Tulis jawaban atau catatan untuk guru (opsional jika melampirkan file)"
            className="w-full min-h-28 p-3 rounded-2xl bg-[#F7F6FA] border border-black/5 max-md:text-base md:text-sm text-[#1C1E26] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B3B7A]/20"
          />

          <ul className="space-y-2">
            {kept.map((f) => (
              <li key={f.id} className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#F7F6FA]">
                <FileText className="w-4 h-4 text-[#1D5E4D] shrink-0" />
                <a href={mediaUrl(f.path)} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-xs font-bold text-[#1C1E26] truncate hover:underline">{f.name}</a>
                {!graded && (
                  <button type="button" aria-label={`Hapus ${f.name}`} onClick={() => setKept((k) => k.filter((x) => x.id !== f.id))}
                    className="p-1.5 rounded-lg text-[#852C28] hover:bg-[#FCD9D7] cursor-pointer"><X className="w-4 h-4" /></button>
                )}
              </li>
            ))}
            {added.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#F7F6FA]">
                <FileText className="w-4 h-4 text-[#4B3B7A] shrink-0" />
                <span className="flex-1 min-w-0 text-xs font-bold text-[#1C1E26] truncate">{f.name}</span>
                <span className="text-mini text-[#9195A8]">{formatFileSize(f.size)}</span>
                <button type="button" aria-label={`Hapus ${f.name}`} onClick={() => setAdded((a) => a.filter((_, n) => n !== i))}
                  className="p-1.5 rounded-lg text-[#852C28] hover:bg-[#FCD9D7] cursor-pointer"><X className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>

          {!graded && kept.length + added.length < MAX_FILES && (
            <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-[#D1EBE1] text-xs font-bold text-[#1D5E4D] cursor-pointer hover:bg-[#F4FAF7]">
              <UploadCloud className="w-4 h-4" /> Lampirkan file atau foto
              <input type="file" multiple accept={FILE_ACCEPT} className="sr-only" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
            </label>
          )}
          {!graded && <p className="text-mini text-[#9195A8] text-center">PDF, JPG, PNG, WEBP, DOCX · maks 10 MB · {MAX_FILES} file</p>}

          {error && <p role="alert" className="text-xs font-bold text-[#852C28] flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}

          {!graded && (
            <button type="button" onClick={send} disabled={!canSend}
              className="clay-btn clay-btn-dark w-full py-3 text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              {sending ? "Mengirim…" : submission ? "Kumpulkan ulang" : overdue ? "Kumpulkan (terlambat)" : "Kumpulkan"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
