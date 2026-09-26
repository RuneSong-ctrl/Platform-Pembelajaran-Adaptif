import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import ParentShell from "@/components/parent/ParentShell";
import { ApiService, Announcement, utcDate } from "@/services/apiClient";
import { AlertCircle, Bell, CheckCircle2, MessageSquare, School, Clock } from "@/components/ui/icons";
import type { AssignmentSubmission, User } from "@/types";

const shortDate = (d: string | Date) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

export default function ParentPortalPage() {
  return <ParentShell title="Ringkasan">{(child) => <ChildOverview key={child.id} child={child} />}</ParentShell>;
}

function ChildOverview({ child }: { child: User }) {
  const { classrooms, tasks, submissions } = useApp();
  const [progress, setProgress] = useState<number | null>(null);
  const [news, setNews] = useState<Announcement[]>([]);

  const classes = classrooms.filter((c) => c.studentIds.includes(child.id));
  const classIds = new Set(classes.map((c) => c.id));
  const classTasks = tasks.filter((t) => classIds.has(t.classroomId));

  // Latest submission per task.
  const byTask = new Map<string, AssignmentSubmission>();
  for (const s of submissions) {
    if (s.studentId !== child.id) continue;
    const prev = byTask.get(s.taskId);
    if (!prev || new Date(s.submittedAt) > new Date(prev.submittedAt)) byTask.set(s.taskId, s);
  }
  const graded = [...byTask.values()].filter((s) => s.grade != null).sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
  const average = graded.length ? Math.round(graded.reduce((a, s) => a + (s.grade as number), 0) / graded.length) : null;
  const now = Date.now();
  const late = classTasks.filter((t) => !byTask.has(t.id) && t.dueDate && new Date(t.dueDate).getTime() < now);
  const upcoming = classTasks
    .filter((t) => !byTask.has(t.id) && (!t.dueDate || new Date(t.dueDate).getTime() >= now))
    .sort((a, b) => +new Date(a.dueDate || 8.64e15) - +new Date(b.dueDate || 8.64e15));
  const low = graded.filter((s) => (s.grade as number) < 70);

  useEffect(() => {
    ApiService.getLearningProgress(child.id).then((p) => setProgress(p?.overall_progress ?? null));
    ApiService.getAnnouncements()
      .then((a) => setNews(a.filter((x) => classIds.has(x.classroom_id)).slice(0, 3)))
      .catch(() => setNews([]));
    // classIds is derived from child; refetch when the child changes (component is keyed by child).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child.id]);

  if (classes.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#5A5E70]">
          {child.name} belum bergabung ke kelas mana pun. Setelah guru membagikan kode kelas dan {child.name.split(" ")[0]} bergabung,
          nilai dan tugasnya akan muncul di sini.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key numbers */}
      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Rata-rata nilai" value={average ?? "–"} warn={average != null && average < 70} />
        <Stat label="Tugas dikumpulkan" value={`${byTask.size}/${classTasks.length}`} />
        <Stat label="Progres belajar" value={progress == null ? "–" : `${progress}%`} />
      </dl>

      {/* Needs attention: only shown when there is something */}
      {(late.length > 0 || low.length > 0) && (
        <section className="clay-card clay-coral p-4 sm:p-5 space-y-2">
          <h2 className="text-sm font-black text-[#852C28] flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Perlu perhatian
          </h2>
          <ul className="space-y-1 text-xs text-[#852C28]">
            {late.map((t) => (
              <li key={t.id}>
                <b>{t.title}</b> belum dikumpulkan (batas {shortDate(t.dueDate as string)})
              </li>
            ))}
            {low.map((s) => (
              <li key={s.id}>
                Nilai <b>{s.taskTitle}</b>: {s.grade}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent grades */}
        <section className="space-y-3">
          <h2 className="text-base font-black text-[#010105]">Nilai terbaru</h2>
          {graded.length === 0 ? (
            <Card>
              <p className="text-xs text-[#5A5E70]">Belum ada tugas yang dinilai.</p>
            </Card>
          ) : (
            <ul className="clay-card clay-white divide-y divide-[rgba(28,30,38,0.06)]">
              {graded.slice(0, 5).map((s) => (
                <li key={s.id} className="px-4 sm:px-5 py-3 space-y-0.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#010105] truncate">{s.taskTitle}</span>
                    <span className={`text-sm font-black shrink-0 ${(s.grade as number) < 70 ? "text-[#852C28]" : "text-[#1D5E4D]"}`}>
                      {s.grade}
                    </span>
                  </div>
                  {s.feedback && <p className="text-xs text-[#5A5E70] line-clamp-2">Catatan guru: {s.feedback}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming work */}
        <section className="space-y-3">
          <h2 className="text-base font-black text-[#010105]">Tugas yang belum dikerjakan</h2>
          {upcoming.length === 0 ? (
            <Card>
              <p className="text-xs text-[#5A5E70] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1D5E4D]" /> Tidak ada tugas yang menunggu.
              </p>
            </Card>
          ) : (
            <ul className="clay-card clay-white divide-y divide-[rgba(28,30,38,0.06)]">
              {upcoming.slice(0, 5).map((t) => (
                <li key={t.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[#010105] truncate">{t.title}</span>
                    <span className="block text-mini text-[#9195A8]">{t.type === "quiz" ? "Kuis" : "Tugas"} · {t.classroomName}</span>
                  </span>
                  {t.dueDate && (
                    <span className="text-xs text-[#5A5E70] flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" /> {shortDate(t.dueDate)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Announcements */}
      {news.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-black text-[#010105] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#4B3B7A]" /> Pengumuman kelas
          </h2>
          <ul className="space-y-2">
            {news.map((a) => (
              <li key={a.id} className="clay-card clay-white p-4">
                <span className="block text-mini font-bold text-[#9195A8]">
                  {classes.find((c) => c.id === a.classroom_id)?.name} · {a.author_name} · {shortDate(utcDate(a.created_at))}
                </span>
                <p className="text-sm text-[#1C1E26] whitespace-pre-wrap wrap-anywhere mt-1">{a.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Classes and teachers */}
      <section className="space-y-3">
        <h2 className="text-base font-black text-[#010105]">Kelas {child.name.split(" ")[0]}</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {classes.map((c) => (
            <li key={c.id} className="clay-card clay-white p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl clay-lavender text-[#4B3B7A] flex items-center justify-center shrink-0">
                <School className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-black text-[#010105] truncate">{c.name}</span>
                <span className="block text-xs text-[#5A5E70] truncate">{c.teacherName}</span>
              </span>
              <Link
                to={`/parent/chat?kelas=${c.id}`}
                className="clay-btn clay-btn-white p-2.5 shrink-0"
                aria-label={`Kirim pesan ke ${c.teacherName}`}
                title="Kirim pesan ke guru"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="clay-card clay-white p-5">{children}</div>;
}

function Stat({ label, value, warn = false }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className="clay-card clay-white px-3 sm:px-4 py-3">
      <dt className="text-mini sm:text-xs font-bold text-[#9195A8]">{label}</dt>
      <dd className={`text-xl sm:text-2xl font-black ${warn ? "text-[#852C28]" : "text-[#010105]"}`}>{value}</dd>
    </div>
  );
}
