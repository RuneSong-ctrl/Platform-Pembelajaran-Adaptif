import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { ApiService, mediaUrl } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import {
  FILE_ACCEPT, MAX_FILES, fileProblem, formatFileSize, fromLocalInput, toLocalInput,
} from "@/lib/tasks";
import type { FileRef, GroundedTask } from "@/types";
import {
  ArrowLeft, Plus, Trash2, Sparkles, UploadCloud, FileText, X, Loader2, AlertCircle, CheckCircle2,
} from "@/components/ui/icons";

type Kind = "assignment" | "quiz" | "exam";
type ExamLabel = "UTS" | "UAS" | "Ulangan";

interface EditorQuestion {
  id: string;
  kind: "mcq" | "essay";
  questionText: string;
  options: string[];
  correctIndex: number;
  points: number;
  extra?: Record<string, unknown>; // AI fields (difficulty, explanation, ...) kept as they are
}

const KINDS: { value: Kind; label: string }[] = [
  { value: "assignment", label: "Tugas" },
  { value: "quiz", label: "Kuis" },
  { value: "exam", label: "Ujian" },
];
const newId = () => `q_${Math.random().toString(36).slice(2, 10)}`;
const blank = (kind: "mcq" | "essay"): EditorQuestion => ({
  id: newId(), kind, questionText: "", options: kind === "mcq" ? ["", "", "", ""] : [], correctIndex: 0, points: kind === "essay" ? 10 : 1,
});
const fromTask = (task: GroundedTask): EditorQuestion[] =>
  (task.contentJson?.questions || []).map((q) => {
    const { id, kind, questionText, options, correctIndex, points, ...extra } = q;
    return { id, kind: kind || "mcq", questionText, options: options || [], correctIndex: correctIndex ?? 0, points: points ?? 1, extra };
  });

const field = "w-full px-3.5 py-2.5 rounded-2xl bg-[#F7F6FA] border border-[rgba(28,30,38,0.08)] max-md:text-base md:text-sm text-[#1C1E26] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4B3B7A]/20";
const label = "block text-xs font-extrabold text-[#1C1E26] mb-1.5";

export default function TaskComposerPage() {
  const { classId: classParam, taskId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { classrooms, documents, tasks, currentUser, createTask, updateTask, addTaskAttachments, removeTaskAttachment } = useApp();

  const editing = taskId ? tasks.find((t) => t.id === taskId) : undefined;
  // Opened from the sidebar there is no class in the URL: the teacher picks one of their classes here.
  const myClasses = classrooms.filter((c) => c.teacherId === currentUser.id);
  const [pickedClassId, setPickedClassId] = useState("");
  const classId = editing?.classroomId || classParam || pickedClassId || myClasses[0]?.id || "";
  const cls = myClasses.find((c) => c.id === classId);
  const classDocs = documents.filter((d) => d.classroomId === classId);

  const [kind, setKind] = useState<Kind>(() => {
    const q = params.get("type");
    return q === "quiz" || q === "exam" ? q : "assignment";
  });
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [closes, setCloses] = useState("");
  const [opens, setOpens] = useState("");
  const [minutes, setMinutes] = useState(90);
  const [examLabel, setExamLabel] = useState<ExamLabel>("UTS");
  const [questions, setQuestions] = useState<EditorQuestion[]>([]);
  const [savedFiles, setSavedFiles] = useState<FileRef[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [aiDocId, setAiDocId] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const loaded = useRef(false);

  // Editing: fill the form once the task is in memory.
  useEffect(() => {
    if (!editing || loaded.current) return;
    loaded.current = true;
    setKind(editing.type === "quiz" || editing.type === "exam" ? editing.type : "assignment");
    setTitle(editing.title);
    setInstructions(editing.contentJson?.instructions || "");
    setCloses(toLocalInput(editing.closesAt || editing.dueDate));
    setOpens(toLocalInput(editing.opensAt));
    setMinutes(editing.timeLimitMinutes || 90);
    setExamLabel((editing.examLabel as ExamLabel) || "UTS");
    setQuestions(fromTask(editing));
    setSavedFiles(editing.attachments || []);
  }, [editing]);

  const hasQuestions = kind !== "assignment";
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const update = (i: number, patch: Partial<EditorQuestion>) =>
    setQuestions((qs) => qs.map((q, n) => (n === i ? { ...q, ...patch } : q)));

  const problems: string[] = [];
  if (!title.trim()) problems.push("Judul belum diisi.");
  if (hasQuestions && questions.length === 0) problems.push("Tambahkan minimal satu soal.");
  questions.forEach((q, i) => {
    if (!q.questionText.trim()) problems.push(`Soal ${i + 1}: pertanyaan kosong.`);
    if (q.kind === "mcq" && (q.options.length < 2 || q.options.some((o) => !o.trim()))) problems.push(`Soal ${i + 1}: lengkapi pilihan jawaban.`);
    if (!(q.points > 0 && q.points <= 100)) problems.push(`Soal ${i + 1}: poin 1–100.`);
  });
  if (kind === "exam") {
    if (!opens || !closes) problems.push("Isi waktu buka dan tutup ujian.");
    else if (new Date(closes) <= new Date(opens)) problems.push("Waktu tutup harus setelah waktu buka.");
    if (!(minutes >= 1 && minutes <= 600)) problems.push("Durasi 1–600 menit.");
  }

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const bad = files.map(fileProblem).find(Boolean);
    if (bad) return setFileError(bad);
    if (savedFiles.length + pendingFiles.length + files.length > MAX_FILES) return setFileError(`Maksimal ${MAX_FILES} file.`);
    setFileError("");
    if (editing) {
      addTaskAttachments(editing.id, files).then((t) => setSavedFiles(t.attachments || [])).catch((e) => setFileError(e.message));
    } else {
      setPendingFiles((prev) => [...prev, ...files]);
    }
  };
  const dropSaved = (f: FileRef) => {
    if (!editing) return;
    removeTaskAttachment(editing.id, f.id).then((t) => setSavedFiles(t.attachments || [])).catch((e) => setFileError(e.message));
  };

  const generate = async () => {
    const doc = classDocs.find((d) => d.id === aiDocId) || classDocs[0];
    if (!doc) return;
    setAiBusy(true);
    setError("");
    try {
      const res = await ApiService.generateQuizAI({ document_id: doc.id, topic: doc.title, difficulty: "MEDIUM", num_questions: aiCount });
      const made: EditorQuestion[] = res.questions.map((q: any) => {
        const { questionText, options, correctIndex, ...extra } = q;
        return { id: newId(), kind: "mcq", questionText, options: [...options], correctIndex, points: 1, extra };
      });
      setQuestions((qs) => [...qs, ...made]);
      audioSynth.playSuccessSound();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Soal AI belum berhasil dibuat.");
    } finally {
      setAiBusy(false);
    }
  };

  const save = async () => {
    if (!cls || problems.length || saving) return;
    setSaving(true);
    setError("");
    const content = {
      instructions: instructions.trim(),
      ...(hasQuestions && {
        questions: questions.map((q) => ({
          // Quiz pages expect these fields on every question; AI questions bring their own.
          difficulty: "MEDIUM",
          sourceReference: title.trim(),
          explanation: { analogi: "", visual: "", langkah: "" },
          ...q.extra,
          id: q.id,
          kind: q.kind,
          questionText: q.questionText.trim(),
          points: Number(q.points),
          ...(q.kind === "mcq" ? { options: q.options.map((o) => o.trim()), correctIndex: q.correctIndex } : {}),
        })),
      }),
    };
    const schedule = {
      closes_at: fromLocalInput(closes),
      ...(kind === "exam" && { opens_at: fromLocalInput(opens), time_limit_minutes: minutes, exam_label: examLabel }),
    };
    try {
      if (editing) {
        await updateTask(editing.id, { title: title.trim(), content_json: content, ...schedule });
      } else {
        const created = await createTask({
          classroomId: cls.id,
          classroomName: cls.name,
          type: kind,
          title: title.trim(),
          sourceReference: "Dibuat guru",
          difficultyLevel: "MEDIUM",
          isPublished: true,
          contentJson: content as GroundedTask["contentJson"],
          closesAt: schedule.closes_at || undefined,
          opensAt: kind === "exam" ? schedule.opens_at || undefined : undefined,
          timeLimitMinutes: kind === "exam" ? minutes : undefined,
          examLabel: kind === "exam" ? examLabel : undefined,
        });
        if (pendingFiles.length) await addTaskAttachments(created.id, pendingFiles);
      }
      audioSynth.playSuccessSound();
      navigate(`/teacher/class/${cls.id}?tab=tugas`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan. Coba lagi.");
      audioSynth.playErrorSound();
    } finally {
      setSaving(false);
    }
  };

  if (taskId && !editing) {
    return <Shell><p role="status" className="text-sm text-[#5A5E70]">Memuat tugas…</p></Shell>;
  }
  if (!cls) {
    return (
      <Shell>
        <p className="text-sm text-[#5A5E70]">Kelas tidak ditemukan. <Link to="/teacher" className="font-bold underline">Kembali</Link></p>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link to={`/teacher/class/${cls.id}?tab=tugas`} className="self-start inline-flex items-center gap-1.5 clay-pill clay-white px-3 py-1.5 text-xs font-bold text-[#5A5E70]">
        <ArrowLeft className="w-3.5 h-3.5" /> {cls.name}
      </Link>

      <h1 className="text-xl sm:text-2xl font-black text-[#1C1E26]">{editing ? "Edit" : "Buat"} {KINDS.find((k) => k.value === kind)?.label}</h1>

      {!editing && !classParam && myClasses.length > 1 && (
        <label className="block">
          <span className={label}>Untuk kelas</span>
          <select value={cls.id} onChange={(e) => setPickedClassId(e.target.value)} className={field}>
            {myClasses.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.subject}</option>)}
          </select>
        </label>
      )}

      {!editing && (
        <div className="grid grid-cols-3 gap-1 clay-pill bg-[#F0EEF6] p-1" role="tablist" aria-label="Jenis">
          {KINDS.map((k) => (
            <button key={k.value} type="button" role="tab" aria-selected={kind === k.value}
              onClick={() => { setKind(k.value); if (k.value !== "exam") setQuestions((qs) => qs.filter((q) => q.kind === "mcq")); }}
              className={`py-2 rounded-full text-xs font-extrabold cursor-pointer ${kind === k.value ? "bg-[#1C1E26] text-white" : "text-[#4B3B7A]"}`}>
              {k.label}
            </button>
          ))}
        </div>
      )}

      <section className="clay-card clay-white p-4 sm:p-5 space-y-4">
        <div>
          <label className={label} htmlFor="t-title">Judul</label>
          <input id="t-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255}
            placeholder={kind === "exam" ? "Contoh: UTS Biologi Semester 1" : kind === "quiz" ? "Contoh: Kuis Sel Hewan" : "Contoh: Laporan Praktikum Fotosintesis"} />
        </div>
        <div>
          <label className={label} htmlFor="t-inst">Instruksi</label>
          <textarea id="t-inst" className={`${field} min-h-24`} value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Apa yang harus dikerjakan siswa?" />
        </div>

        {kind === "exam" ? (
          <>
            <div>
              <span className={label}>Jenis ujian</span>
              <div className="flex gap-2">
                {(["UTS", "UAS", "Ulangan"] as ExamLabel[]).map((l) => (
                  <button key={l} type="button" onClick={() => setExamLabel(l)} aria-pressed={examLabel === l}
                    className={`clay-pill px-4 py-1.5 text-xs font-extrabold cursor-pointer ${examLabel === l ? "clay-dark text-white" : "bg-[#F0EEF6] text-[#4B3B7A]"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className={label} htmlFor="t-open">Dibuka</label><input id="t-open" type="datetime-local" className={field} value={opens} onChange={(e) => setOpens(e.target.value)} /></div>
              <div><label className={label} htmlFor="t-close">Ditutup</label><input id="t-close" type="datetime-local" className={field} value={closes} onChange={(e) => setCloses(e.target.value)} /></div>
              <div><label className={label} htmlFor="t-min">Durasi (menit)</label><input id="t-min" type="number" min={1} max={600} className={field} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} /></div>
            </div>
            <p className="text-mini font-bold text-[#785308] clay-pill clay-butter px-3 py-1.5 inline-block">Satu kali kerja · waktu berjalan sejak siswa menekan Mulai</p>
          </>
        ) : (
          <div className="max-w-xs">
            <label className={label} htmlFor="t-due">Tenggat {kind === "quiz" && "(opsional)"}</label>
            <input id="t-due" type="datetime-local" className={field} value={closes} onChange={(e) => setCloses(e.target.value)} />
          </div>
        )}
      </section>

      <section className="clay-card clay-white p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#1C1E26]">Lampiran</h2>
          <span className="text-mini font-bold text-[#9195A8]">PDF, gambar, Word · maks 10 MB · {MAX_FILES} file</span>
        </div>
        <ul className="space-y-2">
          {savedFiles.map((f) => (
            <li key={f.id} className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#F7F6FA]">
              <FileText className="w-4 h-4 text-[#4B3B7A] shrink-0" />
              <a href={mediaUrl(f.path)} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-xs font-bold text-[#1C1E26] truncate underline-offset-2 hover:underline">{f.name}</a>
              <span className="text-mini text-[#9195A8]">{formatFileSize(f.size)}</span>
              <button type="button" aria-label={`Hapus ${f.name}`} onClick={() => dropSaved(f)} className="p-1.5 rounded-lg text-[#852C28] hover:bg-[#FCD9D7] cursor-pointer"><X className="w-4 h-4" /></button>
            </li>
          ))}
          {pendingFiles.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#F7F6FA]">
              <FileText className="w-4 h-4 text-[#4B3B7A] shrink-0" />
              <span className="flex-1 min-w-0 text-xs font-bold text-[#1C1E26] truncate">{f.name}</span>
              <span className="text-mini text-[#9195A8]">{formatFileSize(f.size)}</span>
              <button type="button" aria-label={`Hapus ${f.name}`} onClick={() => setPendingFiles((p) => p.filter((_, n) => n !== i))} className="p-1.5 rounded-lg text-[#852C28] hover:bg-[#FCD9D7] cursor-pointer"><X className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
        {savedFiles.length + pendingFiles.length < MAX_FILES && (
          <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-[#E3DBF8] text-xs font-bold text-[#4B3B7A] cursor-pointer hover:bg-[#F8F6FD]">
            <UploadCloud className="w-4 h-4" /> Tambah file
            <input type="file" multiple accept={FILE_ACCEPT} className="sr-only" onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        {fileError && <p role="alert" className="text-xs font-bold text-[#852C28]">{fileError}</p>}
      </section>

      {hasQuestions && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#1C1E26]">Soal ({questions.length}) · {totalPoints} poin</h2>
          </div>

          {classDocs.length > 0 && (
            <div className="clay-card clay-lavender p-3.5 flex flex-wrap items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4B3B7A] shrink-0" />
              <span className="text-xs font-extrabold text-[#3C2D68]">Bantu AI dari materi</span>
              <select aria-label="Materi untuk soal AI" value={aiDocId || classDocs[0]?.id} onChange={(e) => setAiDocId(e.target.value)}
                className="flex-1 min-w-40 px-3 py-2 rounded-xl bg-white text-xs font-bold text-[#1C1E26] border-0 max-md:text-base">
                {classDocs.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
              <select aria-label="Jumlah soal AI" value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-white text-xs font-bold text-[#1C1E26] border-0 max-md:text-base">
                {[3, 5, 10, 15].map((n) => <option key={n} value={n}>{n} soal</option>)}
              </select>
              <button type="button" onClick={generate} disabled={aiBusy} className="clay-btn clay-btn-dark px-3.5 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {aiBusy ? "Membuat…" : "Tambah soal AI"}
              </button>
            </div>
          )}

          {questions.map((q, i) => (
            <div key={q.id} className="clay-card clay-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#1C1E26]">Soal {i + 1}</span>
                <span className={`clay-pill px-2.5 py-0.5 text-mini font-extrabold ${q.kind === "essay" ? "clay-butter text-[#785308]" : "clay-sky text-[#21518A]"}`}>
                  {q.kind === "essay" ? "Esai" : "Pilihan ganda"}
                </span>
                <label className="ml-auto flex items-center gap-1.5 text-mini font-bold text-[#5A5E70]">
                  Poin
                  <input type="number" min={1} max={100} value={q.points} onChange={(e) => update(i, { points: Number(e.target.value) })}
                    className="w-16 px-2 py-1 rounded-lg bg-[#F7F6FA] border border-black/5 max-md:text-base md:text-xs font-bold text-center" />
                </label>
                <button type="button" aria-label={`Hapus soal ${i + 1}`} onClick={() => setQuestions((qs) => qs.filter((_, n) => n !== i))}
                  className="p-1.5 rounded-lg text-[#852C28] hover:bg-[#FCD9D7] cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea aria-label={`Pertanyaan soal ${i + 1}`} className={`${field} min-h-16`} value={q.questionText}
                onChange={(e) => update(i, { questionText: e.target.value })} placeholder="Tulis pertanyaannya" />
              {q.kind === "mcq" && (
                <div className="space-y-2">
                  {q.options.map((opt, n) => (
                    <div key={n} className="flex items-center gap-2">
                      <button type="button" onClick={() => update(i, { correctIndex: n })} aria-pressed={q.correctIndex === n}
                        aria-label={`Jadikan pilihan ${String.fromCharCode(65 + n)} kunci jawaban`}
                        className={`w-8 h-8 shrink-0 rounded-full text-xs font-black flex items-center justify-center cursor-pointer ${q.correctIndex === n ? "bg-[#1D5E4D] text-white" : "bg-[#F0EEF6] text-[#5A5E70]"}`}>
                        {q.correctIndex === n ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + n)}
                      </button>
                      <input aria-label={`Pilihan ${String.fromCharCode(65 + n)}`} className={field} value={opt}
                        onChange={(e) => update(i, { options: q.options.map((o, m) => (m === n ? e.target.value : o)) })} />
                      {q.options.length > 2 && (
                        <button type="button" aria-label={`Hapus pilihan ${String.fromCharCode(65 + n)}`}
                          onClick={() => update(i, { options: q.options.filter((_, m) => m !== n), correctIndex: q.correctIndex === n ? 0 : q.correctIndex > n ? q.correctIndex - 1 : q.correctIndex })}
                          className="p-1.5 rounded-lg text-[#9195A8] hover:text-[#852C28] cursor-pointer"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button type="button" onClick={() => update(i, { options: [...q.options, ""] })} className="text-xs font-bold text-[#4B3B7A] cursor-pointer">+ Pilihan</button>
                  )}
                  <p className="text-mini text-[#5A5E70]">Ketuk huruf untuk memilih kunci jawaban.</p>
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setQuestions((qs) => [...qs, blank("mcq")])} className="clay-pill clay-white px-4 py-2 text-xs font-extrabold text-[#21518A] flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Soal pilihan ganda
            </button>
            {kind === "exam" && (
              <button type="button" onClick={() => setQuestions((qs) => [...qs, blank("essay")])} className="clay-pill clay-white px-4 py-2 text-xs font-extrabold text-[#785308] flex items-center gap-1.5 cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Soal esai
              </button>
            )}
          </div>
        </section>
      )}

      <div className="clay-card clay-white p-4 space-y-3">
        {problems.length > 0 && (
          <ul className="text-xs font-bold text-[#785308] space-y-0.5">
            {problems.slice(0, 4).map((p) => <li key={p} className="flex gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{p}</li>)}
            {problems.length > 4 && <li>…dan {problems.length - 4} lagi</li>}
          </ul>
        )}
        {error && <p role="alert" className="text-xs font-bold text-[#852C28]">{error}</p>}
        <button type="button" onClick={save} disabled={problems.length > 0 || saving}
          className="clay-btn clay-btn-dark w-full py-3 text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {editing ? "Simpan perubahan" : `Terbitkan ${KINDS.find((k) => k.value === kind)?.label}`}
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden w-full min-h-0">
        <TeacherSidebar />
        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-5 app-main md:pb-8">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
