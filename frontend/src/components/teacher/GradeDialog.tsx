import React, { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { audioSynth } from "@/services/audioSynth";
import type { AssignmentSubmission } from "@/types";

/** Shows the student's answer and saves a 0–100 grade with an optional note. */
export default function GradeDialog({ submission, onClose }: { submission: AssignmentSubmission | null; onClose: () => void }) {
  const { gradeAssignmentSubmission } = useApp();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setScore(submission?.grade != null ? String(submission.grade) : "");
    setFeedback(submission?.feedback || "");
    setError("");
  }, [submission]);

  const value = Number(score);
  const valid = score.trim() !== "" && value >= 0 && value <= 100;

  const save = async () => {
    if (!submission || !valid) return;
    setSaving(true);
    setError("");
    try {
      await gradeAssignmentSubmission(submission.id, value, feedback.trim());
      audioSynth.playSuccessSound();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nilai gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!submission} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
        {submission && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-black text-[#010105]">{submission.studentName}</DialogTitle>
              <DialogDescription className="text-xs text-[#5A5E70]">
                {submission.taskTitle} · dikumpulkan {new Date(submission.submittedAt).toLocaleDateString("id-ID")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1">
              <span className="block text-xs font-bold text-[#010105]">Jawaban siswa</span>
              <div className="max-h-48 overflow-y-auto p-3 rounded-2xl bg-[#F8F9FD] text-xs text-[#1C1E26] whitespace-pre-wrap leading-relaxed">
                {submission.content || <span className="text-[#9195A8]">Tidak ada teks jawaban.</span>}
              </div>
              {submission.attachmentName && (
                <p className="text-mini text-[#5A5E70]">Lampiran: {submission.attachmentName}</p>
              )}
            </div>

            <label className="block">
              <span className="block text-xs font-bold text-[#010105] mb-1">Nilai (0–100)</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="rounded-xl text-xs font-medium bg-[#F8F9FD] w-32"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="block text-xs font-bold text-[#010105] mb-1">Catatan untuk siswa (opsional)</span>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.1)] text-xs font-medium bg-[#F8F9FD] focus:outline-none"
                placeholder="Contoh: Jawabanmu sudah tepat. Coba pelajari lagi bagian akhir bab."
              />
            </label>

            {error && <p role="alert" className="text-xs font-bold text-[#852C28]">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onClose} className="clay-btn clay-btn-white px-4 py-2 text-xs font-bold text-[#5A5E70] cursor-pointer">
                Batal
              </button>
              <button
                onClick={save}
                disabled={!valid || saving}
                className="clay-btn clay-btn-dark px-4 py-2 text-xs font-black text-white cursor-pointer disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan nilai"}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
