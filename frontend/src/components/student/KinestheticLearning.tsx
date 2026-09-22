import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { ArrowRight, CheckCircle2, Cog, Gamepad2, Puzzle, Trophy } from "@/components/ui/icons";
import { ApiService } from "@/services/apiClient";
import type { Infographic } from "./SourcedInfographic";
import type { SourceRef, Visual } from "./UnitVisual";
import BongkarBoard from "./kinesthetic/BongkarBoard";
import GearBoard from "./kinesthetic/GearBoard";
import PracticeMission from "./PracticeMission";

// Kinesthetic adaptive material. "Games" is how the student learns the approved summary with their hands
// (instead of reading the PDF); "Challenge" is the drag-and-drop quiz that trains memory afterwards.
type Units = { id: string; title: string; visual?: Visual | null }[];
type Published = { units: Units; infographic?: Infographic | null };
type Props = {
  documentId: string;
  /** Teacher preview: the draft content, nothing recorded. */
  preview?: { infographic: Infographic | null; units: Units };
  sources?: (refs: SourceRef[]) => ReactNode;
  onActivity?: (title: string) => void;
};
type Menu = "games" | "challenge";
type Game = "bongkar" | "gear";
type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

export default function KinestheticLearning({ documentId, preview, sources, onActivity }: Props) {
  const [menu, setMenu] = useState<Menu>("games");
  const [challengeOpened, setChallengeOpened] = useState(false);
  const [content, setContent] = useState<Published | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (preview) return;
    let live = true;
    ApiService.authenticatedRequest<Published>(`/documents/${encodeURIComponent(documentId)}/learning-units`)
      .then(published => live && setContent(published))
      .catch(err => live && setError(err instanceof Error ? err.message : "Materi gagal dimuat."));
    return () => { live = false; };
  }, [documentId, preview]);

  const open = (next: Menu) => {
    setMenu(next);
    if (next === "challenge") setChallengeOpened(true);
  };
  const info = preview ? preview.infographic : content?.infographic ?? null;
  const approved = preview ? true : Boolean(content && content.units.length > 0);
  const menus: { id: Menu; icon: Icon; label: string; hint: string }[] = [
    { id: "games", icon: Gamepad2, label: "Games", hint: "Pelajari materi dengan tanganmu" },
    { id: "challenge", icon: Trophy, label: "Challenge", hint: "Uji ingatanmu, level demi level" },
  ];

  return (
    <section className="clay-card p-4 sm:p-6 space-y-5" aria-label="Materi kinestetik">
      <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Menu kinestetik">
        {menus.map(m => (
          <button key={m.id} type="button" role="tab" id={`kin-tab-${m.id}`} aria-selected={menu === m.id} aria-controls={`kin-panel-${m.id}`} onClick={() => open(m.id)}
            className={`clay-btn ${menu === m.id ? "clay-btn-butter" : "clay-btn-white"} rounded-[20px] p-3 sm:p-4 flex items-center gap-3 text-left`}>
            <span className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center text-[#785308] ${menu === m.id ? "bg-white" : "bg-[#FFF6DF]"}`}>
              <m.icon className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-extrabold text-[#1C1E26]">{m.label}</span>
              <span className="block text-[11px] font-semibold text-[#475569] leading-snug">{m.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Games stays mounted while the student peeks at Challenge, so a half-built map is not lost. */}
      <div id="kin-panel-games" role="tabpanel" aria-labelledby="kin-tab-games" hidden={menu !== "games"}>
        {error && !preview ? <p role="alert" className="text-sm text-[#852C28]">{error}</p>
          : !preview && !content ? <p role="status" className="text-sm text-[#475569]">Memuat materi…</p>
          : !approved ? <p className="text-sm text-[#475569]">Games belum tersedia: guru belum menyetujui materi ini.</p>
          : <Games key={documentId} info={info} onDone={onActivity} onChallenge={() => open("challenge")} />}
      </div>

      {challengeOpened && (
        <div id="kin-panel-challenge" role="tabpanel" aria-labelledby="kin-tab-challenge" hidden={menu !== "challenge"}>
          <PracticeMission documentId={documentId} preview={preview} sources={sources}
            onStageComplete={stage => onActivity?.(stage.title)} />
        </div>
      )}
    </section>
  );
}

function Games({ info, onDone, onChallenge }: { info: Infographic | null; onDone?: (title: string) => void; onChallenge: () => void }) {
  const diagram = info?.diagram ?? null;
  const hasMap = Boolean(diagram && diagram.nodes.some(node => node.parent));
  const hasFlow = (info?.flow_steps.length ?? 0) >= 2;
  const [game, setGame] = useState<Game>(hasMap ? "bongkar" : "gear");
  const [selected, setSelected] = useState<string | null>(null);
  const [map, setMap] = useState({ found: 1, total: 1, whole: false });
  const [flow, setFlow] = useState(0);
  const reported = useRef(new Set<Game>());

  const report = useCallback((which: Game, title: string) => {
    if (reported.current.has(which)) return;
    reported.current.add(which);
    onDone?.(title);
  }, [onDone]);
  const onMap = useCallback((found: number, total: number, whole: boolean) => {
    setMap({ found, total, whole });
    if (whole) report("bongkar", "Bongkar konsep");
  }, [report]);
  const onFlow = useCallback((done: number, total: number) => {
    setFlow(done);
    if (total > 0 && done === total) report("gear", "Roda gigi proses");
  }, [report]);

  if (!info || (!hasMap && !hasFlow)) {
    return (
      <div className="text-sm text-[#475569] space-y-2">
        <p>Materi ini belum punya peta konsep atau alur proses untuk dimainkan.</p>
        <button type="button" onClick={onChallenge} className="clay-btn clay-btn-white px-4 py-2 text-sm font-bold inline-flex items-center gap-2">Coba Challenge <ArrowRight className="w-4 h-4" /></button>
      </div>
    );
  }

  const games: { id: Game; icon: Icon; label: string; verb: string; available: boolean; progress: string; done: boolean }[] = [
    { id: "bongkar", icon: Puzzle, label: "Bongkar konsep", available: hasMap, done: map.whole,
      verb: "Tarik bola sampai pecah jadi bagian-bagiannya, lalu ketuk bagian mana pun untuk membuka infonya. Dorong bagian kembali ke induknya untuk memasang lagi.",
      progress: map.whole ? "Utuh lagi" : `${map.found}/${map.total} bagian ditemukan` },
    { id: "gear", icon: Cog, label: "Roda gigi proses", available: hasFlow, done: hasFlow && flow === info.flow_steps.length,
      verb: "Putar engkolnya. Setiap putaran menghidupkan roda gigi langkah berikutnya; putar balik untuk mundur.",
      progress: `${flow}/${info.flow_steps.length} langkah` },
  ];
  const current = games.find(g => g.id === game)!;
  const allDone = games.filter(g => g.available).every(g => g.done);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 p-1.5 rounded-[20px] bg-[#F0EEF6]" role="group" aria-label="Pilih game">
        {games.map(g => (
          <button key={g.id} type="button" disabled={!g.available} onClick={() => setGame(g.id)} aria-pressed={game === g.id}
            className={`flex-1 min-w-[9rem] rounded-[16px] px-3 py-2 flex items-center gap-2.5 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${game === g.id ? "clay-white" : "hover:bg-[#ECE9F4]"}`}>
            <span className={`w-8 h-8 shrink-0 rounded-[10px] flex items-center justify-center ${game === g.id ? "bg-[#FEE7B3] text-[#785308]" : "bg-white text-[#595F72]"}`}>
              <g.icon className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-[#1C1E26]">{g.label}</span>
              <span className="block text-[11px] font-semibold text-[#595F72]">{g.available ? g.progress : "Tidak ada di materi ini"}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="text-[13px] leading-[18px] font-medium text-[#475569]">{current.verb}</p>

      {game === "bongkar" && hasMap && diagram && (
        <div className="space-y-2">
          <BongkarBoard diagram={diagram} selected={selected} onSelect={setSelected} onProgress={onMap} />
          {map.found === map.total && !map.whole && (
            <p className="text-[13px] font-semibold text-[#1D5E4D] flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />Semua bagian sudah ditemukan. Sekarang pasang kembali: dorong bagian-bagian ke induknya sampai utuh jadi satu.</p>
          )}
          {map.whole && <p className="text-[13px] font-semibold text-[#1D5E4D] flex items-start gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />Utuh lagi. Kamu sudah membongkar dan memasang seluruh isi materi ini.</p>}
        </div>
      )}
      {game === "gear" && hasFlow && (
        <div>
          {info.flow_title && <p className="text-[10px] font-bold uppercase tracking-wider text-[#595F72] mb-2">{info.flow_title}</p>}
          <GearBoard steps={info.flow_steps} onProgress={onFlow} />
        </div>
      )}

      {allDone && (
        <div className="clay-butter rounded-[26px] p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-3 font-bold text-[14px]">
            <span className="w-10 h-10 shrink-0 rounded-[12px] bg-white flex items-center justify-center"><Trophy className="w-5 h-5" strokeWidth={2.2} /></span>
            Semua games selesai. Siap menguji ingatanmu?
          </p>
          <button type="button" onClick={onChallenge} className="clay-btn clay-btn-dark px-4 py-2.5 text-sm font-bold inline-flex items-center gap-2">Mulai Challenge <ArrowRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}
