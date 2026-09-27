import { utcDate } from "@/services/apiClient";
import type { GroundedTask } from "@/types";

/** Badge text for a task: Tugas, Kuis, or the exam label (UTS/UAS/Ulangan). */
export const taskKindLabel = (task: Pick<GroundedTask, "type" | "examLabel">) =>
  task.type === "exam" ? task.examLabel || "Ujian" : task.type === "quiz" ? "Kuis" : "Tugas";

/** Deadline of a task: new tasks use closesAt, older ones kept a free-text dueDate. */
export const taskDeadline = (task: GroundedTask): Date | null => {
  const raw = task.closesAt || task.dueDate;
  if (!raw) return null;
  const d = utcDate(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatWhen = (date: Date | null) =>
  date
    ? date.toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

/** <input type="datetime-local"> works in local time without a zone. */
export const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = utcDate(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Mirrors the server rules (backend/app/services/upload_rules.py) so problems show before uploading.
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.docx";
export const fileProblem = (file: File) => {
  if (!/\.(pdf|jpe?g|png|webp|docx)$/i.test(file.name)) return `${file.name}: hanya PDF, JPG, PNG, WEBP, atau DOCX.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name}: ukuran melebihi 10 MB.`;
  if (file.size === 0) return `${file.name}: file kosong.`;
  return "";
};
