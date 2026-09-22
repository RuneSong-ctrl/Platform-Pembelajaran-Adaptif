import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiService } from "@/services/apiClient";
import { buildMission, isUnlocked, type Stage } from "@/lib/practiceMission";
import type { Infographic } from "./SourcedInfographic";
import type { SourceRef, Visual } from "./UnitVisual";
import PracticeBoard from "./PracticeBoard";

type Progress = { stages: string[]; completed: string[]; xp: number };
type Published = { units: { id: string; title: string; visual?: Visual | null }[]; infographic?: Infographic | null; sources: { id: string; label: string; page: number | null }[] };
type Props = {
  documentId: string;
  /** Teacher preview: the draft content, every stage open, nothing recorded. */
  preview?: { infographic: Infographic | null; units: Published["units"] };
  sources?: (refs: SourceRef[]) => ReactNode;
  onStageComplete?: (stage: Stage, xp: number) => void;
};
const levelIcon = { mudah: "1", sedang: "2", sulit: "3", bonus: "★" };

export default function PracticeMission({ documentId, preview, sources, onStageComplete }: Props) {
  const base = `/documents/${encodeURIComponent(documentId)}`;
  const [content, setContent] = useState<Published | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [justDone, setJustDone] = useState<string | null>(null);

  useEffect(() => {
    if (preview) return;
    let live = true;
    Promise.all([
      ApiService.authenticatedRequest<Published>(`${base}/learning-units`),
      ApiService.authenticatedRequest<Progress>(`${base}/practice-progress`),
    ]).then(([published, saved]) => {
      if (!live) return;
      setContent(published);
      setProgress(saved);
    }).catch(err => live && setError(err instanceof Error ? err.message : "Misi gagal dimuat."));
    return () => { live = false; };
  }, [base, preview]);

  const stages = useMemo(() => (preview
    ? buildMission(preview.infographic, preview.units)
    : content ? buildMission(content.infographic, content.units) : []), [content, preview]);
  const completed = preview ? [] : progress?.completed ?? [];
  const firstOpen = stages.findIndex(stage => !completed.includes(stage.id));
  const current = stages.find(stage => stage.id === active) ?? stages[firstOpen === -1 ? stages.length - 1 : firstOpen];
  const allDone = stages.length > 0 && stages.every(stage => completed.includes(stage.id));

  const defaultSources = (refs: SourceRef[]) => refs.map((ref, i) => {
    const label = content?.sources.find(source => source.id === ref.segment_id)?.label;
    return <blockquote key={i} className="border-l-2 border-slate-300 pl-3 text-sm text-slate-600 my-1">“{ref.quote}” {label && <span className="block text-xs">{label}</span>}</blockquote>;
  });

  const finish = useCallback(async (stage: Stage, xp: number) => {
    // Pin the finished stage so saving progress does not jump past its explanation.
    setActive(stage.id);
    setJustDone(stage.id);
    if (preview) return;
    try {
      const saved = await ApiService.authenticatedRequest<Progress>(`${base}/practice-progress`, {
        method: "POST", body: JSON.stringify({ stage: stage.id, xp }),
      });
      setProgress(saved);
      onStageComplete?.(stage, xp);
    } catch (err) {
      // e.g. the order was skipped in another tab: show the server's reason and reload the real progress
      setError(err instanceof Error ? err.message : "Progres belum tersimpan.");
      ApiService.authenticatedRequest<Progress>(`${base}/practice-progress`).then(setProgress).catch(() => undefined);
    }
  }, [base, onStageComplete, preview]);

  if (error && !content && !preview) return <p role="alert" className="text-red-700">{error}</p>;
  if (!preview && (!content || !progress)) return <p role="status" className="text-sm text-slate-600">Memuat misi praktik…</p>;
  if (!preview && content && content.units.length === 0) {
    return <p className="text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 p-5">Misi praktik belum tersedia: guru belum menyetujui materi ini.</p>;
  }
  if (stages.length === 0) {
    return <p className="text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 p-5">Belum ada aktivitas praktik untuk materi ini. Materi perlu memuat alur atau peta konsep yang disetujui guru.</p>;
  }

  const index = stages.indexOf(current);
  const nextStage = stages[index + 1];
  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-5" aria-label="Misi praktik">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md bg-amber-100 text-amber-800">✋ Misi praktik</span>
          <h2 className="text-lg sm:text-xl font-black text-[#0F172A] mt-2">{preview ? "Pratinjau misi (semua tahap terbuka)" : "Selesaikan tahap berurutan dari mudah ke sulit"}</h2>
        </div>
        {!preview && <p className="text-sm font-black text-amber-700">⭐ {progress?.xp ?? 0} XP · {completed.length}/{stages.length} tahap</p>}
      </div>

      {/* Stage path: a stage opens only after every earlier stage is finished. */}
      <ol className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]" aria-label="Tahap misi">
        {stages.map((stage, i) => {
          const done = completed.includes(stage.id);
          const open = preview || isUnlocked(stages, completed, i);
          const isCurrent = stage === current;
          return (
            <li key={stage.id}>
              <button type="button" disabled={!open} onClick={() => { setActive(stage.id); setJustDone(null); setError(""); }}
                aria-current={isCurrent ? "step" : undefined}
                className={`w-full h-full text-left rounded-2xl border-2 p-3 transition-colors ${
                  isCurrent ? "border-[#0F172A] bg-slate-50" : done ? "border-emerald-300 bg-emerald-50" : open ? "border-slate-200 bg-white hover:border-slate-400 cursor-pointer" : "border-slate-200 bg-slate-100 opacity-70 cursor-not-allowed"}`}>
                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${done ? "bg-emerald-600" : open ? "bg-[#0F172A]" : "bg-slate-400"}`}>
                    {done ? "✓" : open ? levelIcon[stage.level] : "🔒"}
                  </span>
                  {stage.level}
                </span>
                <span className="block text-sm font-bold text-[#0F172A] mt-1.5 break-words">{stage.title}</span>
                {!open && <span className="block text-[11px] text-slate-500 mt-1">Selesaikan “{stages[i - 1]?.title}” dulu</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

      {allDone && !active && !justDone ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-2">
          <p className="text-2xl">🏆</p>
          <p className="font-black text-emerald-900">Misi selesai! Total {progress?.xp ?? 0} XP.</p>
          <p className="text-sm text-emerald-900">Kamu boleh mengulang tahap mana pun untuk berlatih; XP dihitung dari percobaan pertama.</p>
        </div>
      ) : (
        <>
          <PracticeBoard key={current.id} stage={current} sources={sources ?? defaultSources} onComplete={xp => void finish(current, xp)} />
          {justDone === current.id && nextStage && (
            // Enabled only once the server has recorded this stage, so the next level is never opened early.
            <button type="button" disabled={!preview && !completed.includes(current.id)}
              onClick={() => { setActive(nextStage.id); setJustDone(null); }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 text-white font-black cursor-pointer disabled:opacity-50">
              {!preview && !completed.includes(current.id) ? "Menyimpan progres…" : `Lanjut ke tahap berikutnya: ${nextStage.title} →`}
            </button>
          )}
          {justDone === current.id && !nextStage && !preview && (
            <p className="font-black text-emerald-800">🏆 Semua tahap selesai. Total {progress?.xp ?? 0} XP.</p>
          )}
        </>
      )}
    </section>
  );
}
