import React, { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { audioSynth } from "@/services/audioSynth";
import { mediaUrl, utcDate } from "@/services/apiClient";
import { formatFileSize, formatWhen, taskKindLabel } from "@/lib/tasks";
import type { AssignmentSubmission } from "@/types";
import { FileText, CheckCircle2, XCircle } from "@/components/ui/icons";

/**
 * Assignments: the student's text and files, graded 0–100.
 * Exams: every answer next to its question; multiple choice is already scored, the teacher gives points per essay.
 */
export default function GradeDialog({ submission, onClose }: { submission: AssignmentSubmission | null; onClose: () => void }) {
  const { gradeAssignmentSubmission, tasks } = useApp();
  const task = submission ? tasks.find((t) => t.id === submission.taskId) : undefined;
  const isExam = task?.type === "exam";
  const questions = task?.contentJson?.questions || [];
  const essays = questions.filter((q) => q.kind === "essay");

  const [score, setScore] = useState("");
  const [essayPoints, setEssayPoints] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setScore(submission?.grade != null ? String(submission.grade) : "");
    setEssayPoints(Object.fromEntries(Object.entries(submission?.essayScores || {}).map(([k, v]) => [k, String(v)])));
    setFeedback(submission?.feedback || "");
    setError("");
  }, [submission]);

  const value = Number(score);
  const essaysValid = essays.every((q) => {
    const raw = essayPoints[q.id];
    const n = Number(raw);
    return raw !== undefined && raw.trim() !== "" && n >= 0 && n <= (q.points ?? 1);
  });
  const valid = isExam ? essaysValid : score.trim() !== "" && value >= 0 && value <= 100;

  // Preview of the grade the server will compute.
  const total = questions.reduce((sum, q) => sum + (q.points ?? 1), 0);
  const mcqPoints = questions
    .filter((q) => (q.kind || "mcq") === "mcq" && submission?.answers?.[q.id] === q.correctIndex)
    .reduce((sum, q) => sum + (q.points ?? 1), 0);
  const essayTotal = essays.reduce((sum, q) => sum + (Number(essayPoints[q.id]) || 0), 0);
  const preview = total ? Math.round(((mcqPoints + essayTotal) / total) * 1000) / 10 : 0;

  const save = async () => {
    if (!submission || !valid) return;
    setSaving(true);
    setError("");
    try {
      await gradeAssignmentSubmission(
        submission.id,
        isExam ? { essayScores: Object.fromEntries(essays.map((q) => [q.id, Number(essayPoints[q.id])])) } : { grade: value },
        feedback.trim(),
      );
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
              <DialogTitle className="text-base font-black text-[#1C1E26]">{submission.studentName}</DialogTitle>
              <DialogDescription className="text-xs text-[#5A5E70]">
                {task ? `${taskKindLabel(task)} · ` : ""}{submission.taskTitle} · dikumpulkan {formatWhen(utcDate(submission.submittedAt))}
                {submission.isLate && <span className="font-extrabold text-[#852C28]"> · terlambat</span>}
              </DialogDescription>
            </DialogHeader>

            {isExam ? (
              <div className="space-y-3">
                {questions.map((q, i) => {
                  const given = submission.answers?.[q.id];
                  if ((q.kind || "mcq") === "mcq") {
                    const right = given === q.correctIndex;
                    return (
                      <div key={q.id} className="p-3 rounded-2xl bg-[#F8F9FD] space-y-1">
                        <p className="text-xs font-bold text-[#1C1E26]">{i + 1}. {q.questionText}</p>
                        <p className={`text-xs font-bold flex items-center gap-1 ${right ? "text-[#1D5E4D]" : "text-[#852C28]"}`}>
                          {right ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {given === undefined ? "Tidak dijawab" : q.options[given as number]}
                          {!right && <span className="text-[#5A5E70] font-medium"> · kunci: {q.options[q.correctIndex]}</span>}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div key={q.id} className="p-3 rounded-2xl bg-[#FFFBF0] space-y-2">
                      <p className="text-xs font-bold text-[#1C1E26]">{i + 1}. {q.questionText}</p>
                      <p className="text-xs text-[#1C1E26] whitespace-pre-wrap">{(given as string) || <span className="text-[#9195A8]">Tidak dijawab</span>}</p>
                      <label className="flex items-center gap-2 text-xs font-bold text-[#785308]">
                        Poin (0–{q.points ?? 1})
                        <Input type="number" min={0} max={q.points ?? 1} value={essayPoints[q.id] ?? ""}
                          onChange={(e) => setEssayPoints((p) => ({ ...p, [q.id]: e.target.value }))}
                          className="rounded-xl text-xs font-bold bg-white w-24" />
                      </label>
                    </div>
                  );
                })}
                <p className="text-xs font-black text-[#1C1E26]">Perkiraan nilai akhir: {essaysValid ? preview : "–"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="block text-xs font-bold text-[#1C1E26]">Jawaban siswa</span>
                <div className="max-h-48 overflow-y-auto p-3 rounded-2xl bg-[#F8F9FD] text-xs text-[#1C1E26] whitespace-pre-wrap leading-relaxed">
                  {submission.content || <span className="text-[#9195A8]">Tidak ada teks jawaban.</span>}
                </div>
                {(submission.attachments || []).map((f) => (
                  <a key={f.id} href={mediaUrl(f.path)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#F7F6FA] hover:bg-[#F0EEF6]">
                    <FileText className="w-4 h-4 text-[#1D5E4D] shrink-0" />
                    <span className="flex-1 min-w-0 text-xs font-bold text-[#1C1E26] truncate">{f.name}</span>
                    <span className="text-mini text-[#9195A8]">{formatFileSize(f.size)}</span>
                  </a>
                ))}
                <label className="block pt-1">
                  <span className="block text-xs font-bold text-[#1C1E26] mb-1">Nilai (0–100)</span>
                  <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)}
                    className="rounded-xl text-xs font-medium bg-[#F8F9FD] w-32" autoFocus />
                </label>
              </div>
            )}

            <label className="block">
              <span className="block text-xs font-bold text-[#1C1E26] mb-1">Catatan untuk siswa (opsional)</span>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.1)] max-md:text-base md:text-xs font-medium bg-[#F8F9FD] focus:outline-none"
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
