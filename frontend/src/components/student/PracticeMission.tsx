import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, Lock, Star, Trophy } from "@/components/ui/icons";
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
const levelIcon = { mudah: "1", sedang: "2", sulit: "3", bonus: <Star className="w-3.5 h-3.5" /> };

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
    return <blockquote key={i} className="border-l-2 border-[#E6E4EE] pl-3 text-sm text-[#475569] my-1">“{ref.quote}” {label && <span className="block text-xs">{label}</span>}</blockquote>;
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

  if (error && !content && !preview) return <p role="alert" className="text-[#852C28]">{error}</p>;
  if (!preview && (!content || !progress)) return <p role="status" className="text-sm text-[#475569]">Memuat misi praktik…</p>;
  if (!preview && content && content.units.length === 0) {
    return <p className="text-[13px] text-[#475569] bg-[#F7F6FA] rounded-[18px] p-5">Misi praktik belum tersedia: guru belum menyetujui materi ini.</p>;
  }
  if (stages.length === 0) {
    return <p className="text-[13px] text-[#475569] bg-[#F7F6FA] rounded-[18px] p-5">Belum ada aktivitas praktik untuk materi ini. Materi perlu memuat alur atau peta konsep yang disetujui guru.</p>;
  }

  const index = stages.indexOf(current);
  const nextStage = stages[index + 1];
  return (
    <section className="space-y-5" aria-label="Misi praktik">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-mini font-bold uppercase tracking-wider px-2.5 py-1 rounded-[8px] bg-[#FEE7B3] text-[#785308]"><Trophy className="w-3.5 h-3.5" />Challenge</span>
          <h2 className="text-[18px] leading-[26px] font-bold text-[#1C1E26] mt-2">{preview ? "Pratinjau misi (semua tahap terbuka)" : "Selesaikan tahap berurutan dari mudah ke sulit"}</h2>
        </div>
        {!preview && <p className="clay-pill bg-[#FFF6DF] px-3 py-1.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#785308]"><Star className="w-4 h-4" />{progress?.xp ?? 0} XP · {completed.length}/{stages.length} tahap</p>}
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
                className={`w-full h-full text-left rounded-[18px] p-3 transition-colors ${
                  isCurrent ? "clay-butter" : done ? "bg-[#EBF6F2] cursor-pointer" : open ? "clay-white cursor-pointer" : "bg-[#F0EEF6] text-[#595F72] cursor-not-allowed"}`}>
                <span className="flex items-center gap-2 text-mini font-bold uppercase tracking-wider text-[#595F72]">
                  <span className={`w-6 h-6 rounded-[8px] flex items-center justify-center text-mini font-bold ${done ? "bg-[#D1EBE1] text-[#1D5E4D]" : open ? "bg-[#1C1E26] text-white" : "bg-[#E6E4EE] text-[#595F72]"}`}>
                    {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : open ? levelIcon[stage.level] : <Lock className="w-3.5 h-3.5" />}
                  </span>
                  {stage.level}
                </span>
                <span className="block text-[14px] font-semibold text-[#1C1E26] mt-1.5 break-words">{stage.title}</span>
                {!open && <span className="block text-mini text-[#595F72] mt-1">Selesaikan “{stages[i - 1]?.title}” dulu</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {error && <p role="alert" className="text-sm text-[#852C28]">{error}</p>}

      {allDone && !active && !justDone ? (
        <div className="clay-mint rounded-[26px] p-5 text-center space-y-2">
          <span className="mx-auto w-12 h-12 rounded-[14px] bg-white flex items-center justify-center"><Trophy className="w-6 h-6" /></span>
          <p className="font-bold text-[16px]">Misi selesai! Total {progress?.xp ?? 0} XP.</p>
          <p className="text-[13px]">Kamu boleh mengulang tahap mana pun untuk berlatih. XP dihitung dari percobaan pertama.</p>
        </div>
      ) : (
        <>
          <PracticeBoard key={current.id} stage={current} sources={sources ?? defaultSources} onComplete={xp => void finish(current, xp)} />
          {justDone === current.id && nextStage && (
            // Enabled only once the server has recorded this stage, so the next level is never opened early.
            <button type="button" disabled={!preview && !completed.includes(current.id)}
              onClick={() => { setActive(nextStage.id); setJustDone(null); }}
              className="clay-btn clay-btn-dark w-full sm:w-auto px-5 py-3 text-[14px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {!preview && !completed.includes(current.id) ? "Menyimpan progres…" : <>{`Lanjut ke tahap berikutnya: ${nextStage.title}`}<ArrowRight className="w-4 h-4" /></>}
            </button>
          )}
          {justDone === current.id && !nextStage && !preview && (
            <p className="flex items-center gap-2 font-bold text-[#1D5E4D]"><Trophy className="w-5 h-5" />Semua tahap selesai. Total {progress?.xp ?? 0} XP.</p>
          )}
        </>
      )}
    </section>
  );
}
