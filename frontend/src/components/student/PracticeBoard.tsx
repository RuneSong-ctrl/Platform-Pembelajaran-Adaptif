import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { audioSynth } from "@/services/audioSynth";
import { shuffled, stageXp, type Card, type Stage } from "@/lib/practiceMission";
import type { SourceRef } from "./UnitVisual";

type Slot = { id: string; expected: Card; groupIndex: number; order: number };
type Props = { stage: Stage; sources: (refs: SourceRef[]) => ReactNode; onComplete: (xp: number) => void };
const POOL = "pool";
const levelStyle = {
  mudah: "bg-emerald-100 text-emerald-800", sedang: "bg-sky-100 text-sky-800",
  sulit: "bg-purple-100 text-purple-800", bonus: "bg-amber-100 text-amber-800",
};

function slotsFor(stage: Stage): Slot[] {
  if (stage.kind === "sequence") return stage.items.map((card, i) => ({ id: `slot-${i}`, expected: card, groupIndex: 0, order: i }));
  return stage.groups.flatMap((group, g) => group.slots.map((card, i) => ({ id: `slot-${card.id}`, expected: card, groupIndex: g, order: i })));
}

const firstSentence = (text: string) => text.split(/(?<=[.!?])\s/)[0] || text;

export default function PracticeBoard({ stage, sources, onComplete }: Props) {
  const slots = useMemo(() => slotsFor(stage), [stage]);
  const cards = useMemo(() => shuffled(slots.map(slot => slot.expected)), [slots]);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [hints, setHints] = useState(0);
  const [hintSlot, setHintSlot] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const reported = useRef(false);
  const done = locked.size === slots.length;
  const cardById = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);
  const pool = cards.filter(card => !Object.values(placed).includes(card.id));
  const sensors = useSensors(
    // A small move is needed before dragging starts, so a tap stays a tap (tap-to-place still works).
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      audioSynth.playSuccessSound();
      onComplete(stageXp(wrongChecks, hints));
    }
  }, [done, hints, onComplete, wrongChecks]);

  const place = (cardId: string, slotId: string) => {
    if (locked.has(slotId)) return;
    setPlaced(previous => {
      const next = Object.fromEntries(Object.entries(previous).filter(([, card]) => card !== cardId));
      next[slotId] = cardId; // any card already there goes back to the pool
      return next;
    });
    setWrong(previous => { const next = new Set(previous); next.delete(slotId); return next; });
    setSelected(null);
    setMessage("");
    audioSynth.playClickSound();
  };
  const unplace = (slotId: string) => {
    if (locked.has(slotId)) return;
    setPlaced(previous => Object.fromEntries(Object.entries(previous).filter(([slot]) => slot !== slotId)));
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const target = String(over.id);
    if (target === POOL) {
      const slot = Object.entries(placed).find(([, card]) => card === String(active.id))?.[0];
      if (slot) unplace(slot);
    } else place(String(active.id), target);
  };
  const tapSlot = (slotId: string) => {
    if (selected) place(selected, slotId);
    else if (placed[slotId]) unplace(slotId);
  };

  const check = () => {
    const nextLocked = new Set(locked);
    const nextWrong = new Set<string>();
    const nextPlaced = { ...placed };
    for (const slot of slots) {
      const card = placed[slot.id];
      if (!card || locked.has(slot.id)) continue;
      if (card === slot.expected.id) nextLocked.add(slot.id);
      else { nextWrong.add(slot.id); delete nextPlaced[slot.id]; }
    }
    const right = nextLocked.size - locked.size;
    setLocked(nextLocked);
    setWrong(nextWrong);
    setPlaced(nextPlaced);
    setHintSlot(null);
    if (nextWrong.size) {
      setWrongChecks(count => count + 1);
      audioSynth.playErrorSound();
      setMessage(`${right} tepat, ${nextWrong.size} belum tepat. Kartu yang salah kembali ke tumpukan — coba lagi.`);
    } else if (nextLocked.size < slots.length) {
      setMessage(`${right} tepat. Lanjutkan kartu berikutnya.`);
    }
  };
  const hint = () => {
    const target = slots.find(slot => !locked.has(slot.id));
    if (!target) return;
    setHints(count => count + 1);
    setHintSlot(target.id);
    audioSynth.playClickSound();
  };
  const reset = () => {
    setPlaced(Object.fromEntries(Object.entries(placed).filter(([slot]) => locked.has(slot))));
    setWrong(new Set());
    setSelected(null);
    setMessage("");
  };
  const allFilled = slots.every(slot => placed[slot.id]);

  const slotView = (slot: Slot, prefix?: ReactNode) => (
    <DropSlot key={slot.id} id={slot.id} disabled={locked.has(slot.id)} onTap={() => tapSlot(slot.id)}
      state={locked.has(slot.id) ? "locked" : wrong.has(slot.id) ? "wrong" : placed[slot.id] ? "filled" : "empty"}
      prefix={prefix} label={placed[slot.id] ? cardById.get(placed[slot.id])?.label : undefined}
      hint={hintSlot === slot.id ? firstSentence(slot.expected.detail) : undefined} armed={Boolean(selected)} />
  );

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${levelStyle[stage.level]}`}>Level {stage.level}</span>
            <h3 className="text-lg font-black text-[#0F172A] mt-2 break-words">{stage.title}</h3>
            <p className="text-sm text-slate-600">{stage.instruction} Seret kartu, atau ketuk kartu lalu ketuk tempatnya.</p>
          </div>
          <p className="text-xs font-bold text-slate-500" aria-live="polite">{locked.size}/{slots.length} tepat · percobaan salah {wrongChecks} · petunjuk {hints}</p>
        </div>

        {!done && (
          <PoolArea>
            {pool.length === 0 ? <p className="text-sm text-slate-500">Semua kartu sudah diletakkan. Tekan "Periksa".</p>
              : pool.map(card => <DragCard key={card.id} card={card} selected={selected === card.id}
                onTap={() => { audioSynth.playClickSound(); setSelected(current => (current === card.id ? null : card.id)); }} />)}
          </PoolArea>
        )}

        {stage.kind === "sequence" ? (
          <ol className="space-y-2" aria-label="Urutan jawaban">
            {slots.map(slot => (
              <li key={slot.id} className="flex items-stretch gap-3">
                <span className="w-9 h-9 shrink-0 rounded-full bg-[#0F766E] text-white font-black flex items-center justify-center mt-1">{slot.order + 1}</span>
                <div className="flex-1 min-w-0">{slotView(slot)}</div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-fit max-w-full rounded-2xl bg-[#0F172A] text-white font-black px-5 py-3 text-center break-words">{stage.root.label}</div>
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
              {stage.groups.map((group, g) => {
                const parentSlot = slots.find(slot => slot.expected.id === group.parent.id);
                const parentKnown = !group.parentIsSlot || (parentSlot && locked.has(parentSlot.id));
                return (
                  <div key={group.parent.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                    {stage.id !== "map-branches" && (
                      <p className="text-sm font-black text-[#0F172A] break-words border-b border-slate-200 pb-2">
                        {parentKnown ? group.parent.label : "Induk: isi dulu kotaknya"}
                      </p>
                    )}
                    {slots.filter(slot => slot.groupIndex === g).map(slot => slotView(slot))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {message && <p role="status" className={`text-sm font-semibold ${wrong.size ? "text-red-700" : "text-emerald-700"}`}>{message}</p>}

        {!done ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={check} disabled={!allFilled}
              className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-sm font-black disabled:opacity-40 cursor-pointer">Periksa</button>
            <button type="button" onClick={hint} className="px-4 py-2.5 rounded-xl bg-amber-100 text-amber-900 text-sm font-bold cursor-pointer">Petunjuk (−5 XP)</button>
            <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold cursor-pointer">Atur ulang</button>
          </div>
        ) : (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3" aria-label="Pembahasan">
            <p className="font-black text-emerald-900">Tahap selesai! +{stageXp(wrongChecks, hints)} XP</p>
            <p className="text-sm text-emerald-900">Pembahasan — baca kembali kenapa setiap kartu berada di tempatnya:</p>
            <ul className="space-y-2">
              {slots.map(slot => (
                <li key={slot.id} className="rounded-xl bg-white border border-emerald-100 p-3">
                  <p className="font-bold text-[#0F172A] break-words">{stage.kind === "sequence" ? `${slot.order + 1}. ` : ""}{slot.expected.label}</p>
                  {slot.expected.detail && <p className="text-sm text-slate-700 mt-1 break-words">{slot.expected.detail}</p>}
                  {slot.expected.example && <p className="text-sm text-amber-800 mt-1 break-words">Contoh: {slot.expected.example}</p>}
                  <details><summary className="cursor-pointer text-xs font-bold text-slate-500 py-1">Sumber</summary>{sources(slot.expected.source_refs)}</details>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </DndContext>
  );
}

function PoolArea({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL });
  return (
    <div ref={setNodeRef} aria-label="Tumpukan kartu"
      className={`flex flex-wrap gap-2 rounded-2xl border-2 border-dashed p-3 min-h-[64px] ${isOver ? "border-sky-400 bg-sky-50" : "border-slate-300 bg-white"}`}>
      {children}
    </div>
  );
}

function DragCard({ card, selected, onTap }: { card: Card; selected: boolean; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  return (
    <button ref={setNodeRef} type="button" {...attributes} {...listeners} onClick={onTap} aria-pressed={selected}
      style={{ transform: CSS.Translate.toString(transform), touchAction: "none" }}
      className={`px-3 py-2 rounded-xl text-sm font-bold border-2 shadow-xs cursor-grab text-left break-words max-w-full ${
        isDragging ? "opacity-70 z-10 relative shadow-lg" : ""} ${selected ? "border-[#0284C7] bg-sky-50 text-[#0369A1]" : "border-slate-200 bg-white text-[#0F172A]"}`}>
      {card.label}
    </button>
  );
}

function DropSlot({ id, state, label, hint, prefix, disabled, armed, onTap }: {
  id: string; state: "empty" | "filled" | "locked" | "wrong"; label?: string; hint?: string; prefix?: ReactNode;
  disabled: boolean; armed: boolean; onTap: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  const tone = {
    empty: "border-dashed border-slate-300 bg-white text-slate-400",
    filled: "border-solid border-sky-300 bg-sky-50 text-[#0F172A]",
    locked: "border-solid border-emerald-400 bg-emerald-50 text-emerald-900",
    wrong: "border-dashed border-red-400 bg-red-50 text-red-700",
  }[state];
  return (
    <button ref={setNodeRef} type="button" onClick={onTap} disabled={disabled}
      aria-label={state === "locked" ? `Tepat: ${label}` : label ? `Terisi: ${label}. Ketuk untuk mengembalikan` : "Tempat kosong"}
      className={`w-full min-h-[48px] rounded-xl border-2 px-3 py-2 text-sm text-left font-semibold break-words transition-colors ${tone} ${
        isOver || (armed && state !== "locked") ? "ring-2 ring-sky-300" : ""}`}>
      {prefix}
      {state === "locked" && "✓ "}
      {label ?? (state === "wrong" ? "✗ Belum tepat — coba kartu lain" : "Letakkan kartu di sini")}
      {hint && <span className="block text-xs font-medium text-amber-800 mt-1">Petunjuk: {hint}</span>}
    </button>
  );
}
