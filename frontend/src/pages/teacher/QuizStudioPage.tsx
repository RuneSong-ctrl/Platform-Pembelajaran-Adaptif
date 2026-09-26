import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { Input } from "@/components/ui/input";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import { ApiService } from "@/services/apiClient";
import type { DDALevel, QuizQuestion } from "@/types";
import { CheckCircle2, BookOpen, Plus, Trash2, AlertCircle, RefreshCw } from "@/components/ui/icons";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  difficulty?: string;
  sourceReference?: string;
  explanation?: unknown;
}

const LEVELS = [
  { value: "MIXED", label: "Campuran" },
  { value: "BASIC", label: "Dasar" },
  { value: "MEDIUM", label: "Menengah" },
  { value: "CHALLENGING", label: "Lanjut" },
  { value: "MASTERY", label: "Mahir" },
];
const levelLabel = (v?: string) => LEVELS.find((l) => l.value === v)?.label;

const inWeek = () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const blankQuestion = (): Question => ({
  id: `q_${Math.random().toString(36).slice(2, 10)}`,
  questionText: "",
  options: ["", "", "", ""],
  correctIndex: 0,
});

const selectCls =
  "w-full p-2.5 rounded-2xl border border-[rgba(28,30,38,0.1)] text-xs font-bold text-[#010105] bg-[#F8F9FD] focus:outline-none cursor-pointer";

export default function QuizStudioPage() {
  const { documents, classrooms, createTask, currentUser } = useApp();
  const myClasses = classrooms.filter((c) => c.teacherId === currentUser.id);

  const [classId, setClassId] = useState(myClasses[0]?.id || "");
  const cls = myClasses.find((c) => c.id === classId) || myClasses[0];
  const classDocs = documents.filter((d) => d.classroomId === cls?.id);
  const [docId, setDocId] = useState("");
  const doc = classDocs.find((d) => d.id === docId) || classDocs[0];

  const [title, setTitle] = useState("");
  const [focus, setFocus] = useState("");
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState("MIXED");
  const [dueDate, setDueDate] = useState(inWeek());

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState<{ classId: string; className: string } | null>(null);

  const quizTitle = title.trim() || (doc ? `Kuis: ${doc.title}` : "");

  const generate = async () => {
    if (!doc) return;
    if (questions.length > 0 && !window.confirm("Soal yang sekarang akan diganti. Lanjutkan?")) return;
    audioSynth.playClickSound();
    setIsGenerating(true);
    setError("");
    setPublished(null);
    try {
      const res = await ApiService.generateQuizAI({
        document_id: doc.id,
        topic: focus.trim() || doc.title,
        difficulty: level === "MIXED" ? "MEDIUM" : level,
        num_questions: count,
      });
      setQuestions(
        res.questions.map((q: any) => ({
          ...q,
          options: [...q.options],
          difficulty: level === "MIXED" ? q.difficulty : level,
        })),
      );
      audioSynth.playSuccessSound();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Soal belum berhasil dibuat. Coba lagi.");
      audioSynth.playErrorSound();
    } finally {
      setIsGenerating(false);
    }
  };

  const update = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, n) => (n === i ? { ...q, ...patch } : q)));

  const problems = questions.flatMap((q, i) =>
    !q.questionText.trim() || q.options.some((o) => !o.trim()) ? [i + 1] : [],
  );
  const canPublish = !!cls && !!doc && questions.length > 0 && problems.length === 0 && !!quizTitle && !isPublishing;

  const publish = async () => {
    if (!canPublish || !cls || !doc) return;
    setIsPublishing(true);
    setError("");
    try {
      await createTask({
        classroomId: cls.id,
        classroomName: cls.name,
        type: "quiz",
        title: quizTitle,
        chapter: doc.title,
        sourceReference: doc.title,
        difficultyLevel: (level === "MIXED" ? "MEDIUM" : level) as DDALevel,
        isPublished: true,
        dueDate: dueDate ? new Date(dueDate + "T23:59:00").toISOString() : undefined,
        contentJson: {
          overview: `Kuis dari materi "${doc.title}".`,
          questions: questions.map((q) => ({
            ...q,
            questionText: q.questionText.trim(),
            options: q.options.map((o) => o.trim()),
            // Hand-written questions get the same fields the student quiz expects.
            difficulty: (q.difficulty || (level === "MIXED" ? "MEDIUM" : level)) as DDALevel,
            sourceReference: q.sourceReference || doc.title,
            explanation: (q.explanation as QuizQuestion["explanation"]) || { analogi: "", visual: "", langkah: "" },
          })),
        },
      });
      audioSynth.playLevelUpSound();
      confetti({ disableForReducedMotion: true, particleCount: 80, spread: 60 });
      setPublished({ classId: cls.id, className: cls.name });
      setQuestions([]);
      setTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kuis gagal dikirim. Coba lagi.");
      audioSynth.playErrorSound();
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <TeacherSidebar />

        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <header>
              <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">Buat Kuis</h1>
              <p className="text-sm text-[#5A5E70] mt-1">
                Soal dibuat dari materi yang Anda unggah. Periksa dan ubah dulu, lalu kirim ke kelas.
              </p>
            </header>

            {myClasses.length === 0 ? (
              <Empty title="Belum ada kelas" to="/teacher" cta="Buat kelas di Beranda">
                Kuis selalu dikirim ke salah satu kelas Anda.
              </Empty>
            ) : (
              <>
                {published && (
                  <div className="clay-card clay-mint p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#1D5E4D] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Kuis terkirim ke {published.className}.
                    </p>
                    <Link to={`/teacher/class/${published.classId}`} className="text-xs font-black text-[#1D5E4D] underline">
                      Lihat kelas
                    </Link>
                  </div>
                )}

                {/* Step 1: settings */}
                <section className="clay-card clay-white p-5 sm:p-6 space-y-4">
                  <h2 className="text-sm font-black text-[#010105]">1. Pilih materi</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Kelas">
                      <select
                        value={cls?.id || ""}
                        onChange={(e) => {
                          setClassId(e.target.value);
                          setDocId("");
                        }}
                        className={selectCls}
                      >
                        {myClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Materi">
                      <select
                        value={doc?.id || ""}
                        onChange={(e) => setDocId(e.target.value)}
                        disabled={classDocs.length === 0}
                        className={selectCls}
                      >
                        {classDocs.length === 0 && <option value="">Belum ada materi di kelas ini</option>}
                        {classDocs.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {classDocs.length === 0 ? (
                    <p className="text-xs text-[#5A5E70] flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 shrink-0 mt-px" />
                      <span>
                        Unggah materi untuk kelas ini dulu di{" "}
                        <Link to={`/teacher/rag?kelas=${cls?.id}`} className="font-bold underline">
                          Materi Ajar
                        </Link>
                        .
                      </span>
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Jumlah soal">
                          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className={selectCls}>
                            {[5, 10, 15, 20].map((n) => (
                              <option key={n} value={n}>
                                {n} soal
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Tingkat kesulitan">
                          <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectCls}>
                            {LEVELS.map((l) => (
                              <option key={l.value} value={l.value}>
                                {l.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Fokus bahasan (opsional)">
                          <Input
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            placeholder="Contoh: fungsi ginjal"
                            className="text-xs bg-[#F8F9FD] rounded-2xl"
                          />
                        </Field>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={generate}
                          disabled={isGenerating}
                          className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isGenerating && <RefreshCw className="w-4 h-4 animate-spin" />}
                          {isGenerating ? "Sedang membuat soal..." : questions.length ? "Buat ulang soal" : "Buat soal"}
                        </button>
                      </div>
                    </>
                  )}
                </section>

                {error && (
                  <p role="alert" className="p-3 rounded-2xl bg-[#FDE8E8] text-[#9B1C1C] text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </p>
                )}

                {/* Step 2: review and edit */}
                {questions.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-black text-[#010105]">2. Periksa soal ({questions.length})</h2>
                        <p className="text-xs text-[#5A5E70]">
                          Klik teks untuk mengubah. Pilih lingkaran di kiri jawaban untuk menandai jawaban benar.
                        </p>
                      </div>
                    </div>

                    {questions.map((q, i) => (
                      <article key={q.id} className="clay-card clay-white p-5 sm:p-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-[#1C1E26] text-white flex items-center justify-center text-xs font-black shrink-0">
                            {i + 1}
                          </span>
                          {levelLabel(q.difficulty) && (
                            <span className="clay-pill clay-lavender text-mini font-extrabold px-2.5 py-0.5 text-[#4B3B7A]">
                              {levelLabel(q.difficulty)}
                            </span>
                          )}
                          <button
                            onClick={() => setQuestions((qs) => qs.filter((_, n) => n !== i))}
                            className="ml-auto p-2 rounded-xl text-[#9195A8] hover:text-[#ba1a1a] hover:bg-[#FDE8E8] cursor-pointer"
                            aria-label={`Hapus soal ${i + 1}`}
                            title="Hapus soal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          value={q.questionText}
                          onChange={(e) => update(i, { questionText: e.target.value })}
                          rows={2}
                          placeholder="Tulis pertanyaan"
                          aria-label={`Pertanyaan ${i + 1}`}
                          className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.08)] text-sm font-black text-[#010105] bg-[#F8F9FD] focus:outline-none focus:border-[#4B3B7A] leading-relaxed"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label={`Jawaban benar soal ${i + 1}`}>
                          {q.options.map((opt, o) => {
                            const right = o === q.correctIndex;
                            return (
                              <div
                                key={o}
                                className={`flex items-center gap-2 p-2 rounded-2xl border ${
                                  right ? "clay-mint border-[#1D5E4D]" : "bg-[#F8F9FD] border-[rgba(28,30,38,0.06)]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={right}
                                  onChange={() => update(i, { correctIndex: o })}
                                  aria-label={`Jawaban ${String.fromCharCode(65 + o)} benar`}
                                  className="accent-[#1D5E4D] w-4 h-4 cursor-pointer shrink-0"
                                />
                                <span className="text-xs font-black text-[#5A5E70]">{String.fromCharCode(65 + o)}.</span>
                                <input
                                  value={opt}
                                  onChange={(e) =>
                                    update(i, { options: q.options.map((x, n) => (n === o ? e.target.value : x)) })
                                  }
                                  placeholder="Pilihan jawaban"
                                  className={`flex-1 min-w-0 bg-transparent text-xs font-bold focus:outline-none ${
                                    right ? "text-[#1D5E4D]" : "text-[#1C1E26]"
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                        {q.sourceReference && <p className="text-mini text-[#9195A8]">Sumber: {q.sourceReference}</p>}
                      </article>
                    ))}

                    <button
                      onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
                      className="w-full p-3 rounded-2xl border-2 border-dashed border-[rgba(28,30,38,0.12)] text-xs font-black text-[#5A5E70] hover:bg-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Tambah soal sendiri
                    </button>

                    {/* Step 3: send */}
                    <section className="clay-card clay-white p-5 sm:p-6 space-y-4">
                      <h2 className="text-sm font-black text-[#010105]">3. Kirim ke kelas</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Judul kuis">
                          <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={doc ? `Kuis: ${doc.title}` : "Judul kuis"}
                            className="text-xs bg-[#F8F9FD] rounded-2xl"
                          />
                        </Field>
                        <Field label="Batas pengerjaan">
                          <Input
                            type="date"
                            value={dueDate}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="text-xs bg-[#F8F9FD] rounded-2xl"
                          />
                        </Field>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <p className={`text-xs font-medium ${problems.length ? "text-[#852C28]" : "text-[#5A5E70]"}`}>
                          {problems.length
                            ? `Lengkapi soal nomor ${problems.join(", ")} dulu (pertanyaan dan semua pilihan harus terisi).`
                            : `Siswa di ${cls?.name} akan langsung melihat kuis ini.`}
                        </p>
                        <button
                          onClick={publish}
                          disabled={!canPublish}
                          className="clay-btn clay-btn-dark px-6 py-3 text-xs font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isPublishing ? "Mengirim..." : `Kirim ke ${cls?.name}`}
                        </button>
                      </div>
                    </section>
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-[#010105] mb-1">{label}</span>
      {children}
    </label>
  );
}

function Empty({ title, to, cta, children }: { title: string; to: string; cta: string; children: React.ReactNode }) {
  return (
    <div className="clay-card clay-white p-8 sm:p-12 text-center space-y-3">
      <BookOpen className="w-8 h-8 text-[#9195A8] mx-auto" />
      <h2 className="text-base font-black text-[#010105]">{title}</h2>
      <p className="text-xs text-[#5A5E70] max-w-sm mx-auto">{children}</p>
      <Link to={to} className="clay-btn clay-btn-dark px-5 py-2.5 rounded-2xl text-xs font-black inline-flex">
        {cta}
      </Link>
    </div>
  );
}
