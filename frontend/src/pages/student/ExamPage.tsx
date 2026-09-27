import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { ApiService, type ExamSession, utcDate } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import { formatWhen, taskKindLabel } from "@/lib/tasks";
import { ArrowLeft, Clock, Timer, CheckCircle2, AlertCircle, Loader2, Lock } from "@/components/ui/icons";

type Answers = Record<string, number | string>;

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};

export default function ExamPage() {
  const { taskId = "" } = useParams();
  const { tasks, submissions, currentUser, recordSubmission, triggerSync } = useApp();
  const task = tasks.find((t) => t.id === taskId && t.type === "exam");
  const mySub = submissions.find((s) => s.taskId === taskId && s.studentId === currentUser.id);

  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [offset, setOffset] = useState(0); // server clock minus this phone's clock
  const [now, setNow] = useState(Date.now());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"start" | "submit" | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const submitting = useRef(false);

  const begin = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const s = await ApiService.startExam(taskId);
      setOffset(utcDate(s.server_now).getTime() - Date.now());
      setSession(s);
      setAnswers(s.answers || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ujian belum bisa dibuka.");
      void triggerSync();
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }, [taskId, triggerSync]);

  // Reopening the page during an exam continues it with the same clock.
  useEffect(() => {
    if (!session && mySub?.status === "InProgress" && !busy) void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySub?.status]);

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  const finish = useCallback(async (auto: boolean) => {
    if (!session || submitting.current) return;
    submitting.current = true;
    clearTimeout(saveTimer.current);
    setBusy(true);
    try {
      recordSubmission(await ApiService.submitExam(taskId, answers));
      audioSynth.playSuccessSound();
    } catch (e) {
      // Time already closed on the server: its copy (with the autosaved answers) is the final one.
      if (!auto) setError(e instanceof Error ? e.message : "Gagal mengirim.");
      await triggerSync();
    } finally {
      setSession(null);
      setBusy(false);
      setConfirm(null);
      submitting.current = false;
    }
  }, [session, taskId, answers, recordSubmission, triggerSync]);

  const deadline = session?.deadline ? utcDate(session.deadline).getTime() : null;
  const remaining = deadline ? deadline - (now + offset) : null;
  useEffect(() => {
    if (session && remaining !== null && remaining <= 0) void finish(true);
  }, [session, remaining, finish]);

  const answer = (qid: string, value: number | string) => {
    const next = { ...answers, [qid]: value };
    setAnswers(next);
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      ApiService.saveExamProgress(taskId, next)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 800);
  };

  if (!task) {
    return (
      <Shell>
        <p className="text-sm text-[#5A5E70]">Ujian tidak ditemukan. <Link to="/student/class" className="font-bold underline">Kembali ke kelas</Link></p>
      </Shell>
    );
  }

  const opensAt = task.opensAt ? utcDate(task.opensAt) : null;
  const closesAt = task.closesAt ? utcDate(task.closesAt) : null;
  const notOpen = Boolean(opensAt && opensAt.getTime() > Date.now());
  const closed = Boolean(closesAt && closesAt.getTime() <= Date.now());
  const info = task.contentJson || {};
  const back = `/student/class/${task.classroomId}`;

  // ---- Running ----
  if (session) {
    const answered = session.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
    const low = remaining !== null && remaining < 5 * 60 * 1000;
    return (
      <Shell hideNav>
        <div className="sticky top-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 pt-1 pb-3 bg-[#F8F9FD]">
          <div className={`clay-card p-3 flex items-center gap-3 ${low ? "clay-coral" : "clay-white"}`}>
            <Timer className={`w-5 h-5 shrink-0 ${low ? "text-[#852C28]" : "text-[#4B3B7A]"}`} />
            <span className={`text-xl font-black tabular-nums ${low ? "text-[#852C28]" : "text-[#1C1E26]"}`} role="timer" aria-live="off">
              {remaining !== null ? clock(remaining) : "--:--"}
            </span>
            <span className="text-mini font-bold text-[#5A5E70]">{answered}/{session.questions.length} terjawab</span>
            <span className="ml-auto text-mini font-bold text-[#5A5E70]" aria-live="polite">
              {saveState === "saving" ? "Menyimpan…" : saveState === "saved" ? "Tersimpan" : saveState === "error" ? "Gagal simpan, coba lagi" : ""}
            </span>
          </div>
        </div>

        <h1 className="text-lg font-black text-[#1C1E26]">{task.title}</h1>

        {session.questions.map((q, i) => (
          <section key={q.id} className="clay-card clay-white p-4 space-y-3" aria-labelledby={`q-${q.id}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#1C1E26]">Soal {i + 1}</span>
              <span className="text-mini font-bold text-[#9195A8]">{q.points} poin</span>
            </div>
            <p id={`q-${q.id}`} className="text-sm text-[#1C1E26] leading-relaxed whitespace-pre-wrap">{q.questionText}</p>
            {q.kind === "mcq" ? (
              <div className="space-y-2" role="radiogroup" aria-labelledby={`q-${q.id}`}>
                {(q.options || []).map((opt, n) => {
                  const chosen = answers[q.id] === n;
                  return (
                    <button key={n} type="button" role="radio" aria-checked={chosen} onClick={() => answer(q.id, n)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 cursor-pointer border-2 ${chosen ? "border-[#4B3B7A] bg-[#F0EEF6]" : "border-transparent bg-[#F7F6FA]"}`}>
                      <span className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${chosen ? "bg-[#4B3B7A] text-white" : "bg-white text-[#5A5E70]"}`}>
                        {String.fromCharCode(65 + n)}
                      </span>
                      <span className="text-sm text-[#1C1E26]">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea aria-label={`Jawaban soal ${i + 1}`} value={(answers[q.id] as string) || ""} onChange={(e) => answer(q.id, e.target.value)}
                maxLength={5000} placeholder="Tulis jawabanmu"
                className="w-full min-h-32 p-3 rounded-2xl bg-[#F7F6FA] border border-black/5 max-md:text-base md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B3B7A]/20" />
            )}
          </section>
        ))}

        {error && <p role="alert" className="text-xs font-bold text-[#852C28]">{error}</p>}
        <button type="button" onClick={() => setConfirm("submit")} disabled={busy}
          className="clay-btn clay-btn-dark w-full py-3.5 text-sm font-black cursor-pointer disabled:opacity-50">
          Kirim jawaban
        </button>

        {confirm === "submit" && (
          <ConfirmSheet
            title="Kirim jawaban sekarang?"
            body={`${answered} dari ${session.questions.length} soal terjawab. Setelah dikirim, jawaban tidak bisa diubah.`}
            action="Kirim"
            busy={busy}
            onCancel={() => setConfirm(null)}
            onConfirm={() => finish(false)}
          />
        )}
      </Shell>
    );
  }

  // ---- Intro or finished ----
  return (
    <Shell>
      <Link to={back} className="self-start inline-flex items-center gap-1.5 clay-pill clay-white px-3 py-1.5 text-xs font-bold text-[#5A5E70]">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke kelas
      </Link>

      <section className="clay-card clay-white p-5 space-y-4">
        <div>
          <span className="clay-pill clay-coral px-2.5 py-0.5 text-mini font-extrabold text-[#852C28]">{taskKindLabel(task)}</span>
          <h1 className="text-xl font-black text-[#1C1E26] mt-2">{task.title}</h1>
        </div>
        {info.instructions && <p className="text-sm text-[#1C1E26] leading-relaxed whitespace-pre-wrap">{info.instructions}</p>}
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-[#F7F6FA]"><dt className="text-[#5A5E70] font-bold">Durasi</dt><dd className="font-black text-[#1C1E26]">{task.timeLimitMinutes} menit</dd></div>
          <div className="p-3 rounded-2xl bg-[#F7F6FA]"><dt className="text-[#5A5E70] font-bold">Soal</dt><dd className="font-black text-[#1C1E26]">{info.question_count ?? "-"} soal · {info.total_points ?? "-"} poin</dd></div>
          <div className="p-3 rounded-2xl bg-[#F7F6FA] col-span-2"><dt className="text-[#5A5E70] font-bold">Waktu</dt><dd className="font-black text-[#1C1E26]">{formatWhen(opensAt)} – {formatWhen(closesAt)}</dd></div>
        </dl>
      </section>

      {mySub && mySub.status !== "InProgress" ? (
        <section className="clay-card clay-mint p-5 space-y-1">
          <p className="text-sm font-black text-[#1D5E4D] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Jawaban sudah terkirim</p>
          {mySub.status === "Graded" ? (
            <p className="text-3xl font-black text-[#1C1E26]">{mySub.grade}</p>
          ) : (
            <p className="text-sm text-[#1C1E26]">{mySub.content} Nilai akhir muncul setelah guru menilai soal esai.</p>
          )}
          {mySub.feedback && <p className="text-sm text-[#1C1E26] whitespace-pre-wrap">{mySub.feedback}</p>}
        </section>
      ) : (
        <section className="clay-card clay-white p-5 space-y-3">
          <p className="text-xs font-bold text-[#785308] flex items-start gap-1.5">
            <Lock className="w-4 h-4 shrink-0" /> Hanya bisa dikerjakan sekali. Waktu mulai berjalan saat kamu menekan Mulai, dan jawaban terkirim otomatis saat waktu habis.
          </p>
          {error && <p role="alert" className="text-xs font-bold text-[#852C28] flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
          <button type="button" disabled={notOpen || closed || busy} onClick={() => setConfirm("start")}
            className="clay-btn clay-btn-dark w-full py-3.5 text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            {notOpen ? `Dibuka ${formatWhen(opensAt)}` : closed ? "Ujian sudah ditutup" : "Mulai ujian"}
          </button>
        </section>
      )}

      {confirm === "start" && (
        <ConfirmSheet
          title="Mulai ujian sekarang?"
          body={`Waktu ${task.timeLimitMinutes} menit langsung berjalan dan tidak bisa dijeda.`}
          action="Mulai"
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={begin}
        />
      )}
    </Shell>
  );
}

function ConfirmSheet({ title, body, action, busy, onCancel, onConfirm }: {
  title: string; body: string; action: string; busy: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/30 flex items-end md:items-center justify-center md:p-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="clay-card clay-white w-full md:max-w-sm rounded-b-none md:rounded-[28px] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5 space-y-3">
        <h2 className="text-base font-black text-[#1C1E26]">{title}</h2>
        <p className="text-sm text-[#5A5E70]">{body}</p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 clay-pill bg-[#F0EEF6] py-2.5 text-sm font-extrabold text-[#4B3B7A] cursor-pointer">Batal</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="flex-1 clay-btn clay-btn-dark py-2.5 text-sm font-black cursor-pointer disabled:opacity-50">
            {busy ? "Memproses…" : action}
          </button>
        </div>
      </div>
    </div>
  );
}

function Shell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  return (
    <div className="app-shell bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden w-full min-h-0">
        <StudentSidebar />
        <main className={`flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-4 ${hideNav ? "pb-[calc(2rem+env(safe-area-inset-bottom))]" : "app-main md:pb-8"}`}>
          <div className="max-w-2xl mx-auto flex flex-col gap-4">{children}</div>
        </main>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
