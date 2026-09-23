import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Check, CheckCircle2, Lightbulb, RotateCcw, X } from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";
import { shuffled, stageXp, type Card, type Stage } from "@/lib/practiceMission";
import type { SourceRef } from "./UnitVisual";

type Slot = { id: string; expected: Card; groupIndex: number; order: number };
type Props = { stage: Stage; sources: (refs: SourceRef[]) => ReactNode; onComplete: (xp: number) => void };
const POOL = "pool";
const levelStyle = {
  mudah: "bg-[#D1EBE1] text-[#1D5E4D]", sedang: "bg-[#D2E5FA] text-[#21518A]",
  sulit: "bg-[#E3DBF8] text-[#4B3B7A]", bonus: "bg-[#FEE7B3] text-[#785308]",
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
      setMessage(`${right} tepat, ${nextWrong.size} belum tepat. Kartu yang salah kembali ke tumpukan, coba lagi.`);
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
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[8px] ${levelStyle[stage.level]}`}>Level {stage.level}</span>
            <h3 className="text-[18px] leading-[26px] font-bold text-[#1C1E26] mt-2 break-words">{stage.title}</h3>
            <p className="text-[13px] leading-[18px] text-[#475569]">{stage.instruction} Seret kartu, atau ketuk kartu lalu ketuk tempatnya.</p>
          </div>
          <p className="text-[11px] font-semibold text-[#595F72]" aria-live="polite">{locked.size}/{slots.length} tepat · percobaan salah {wrongChecks} · petunjuk {hints}</p>
        </div>

        {!done && (
          <PoolArea>
            {pool.length === 0 ? <p className="text-sm text-[#595F72]">Semua kartu sudah diletakkan. Tekan "Periksa".</p>
              : pool.map(card => <DragCard key={card.id} card={card} selected={selected === card.id}
                onTap={() => { audioSynth.playClickSound(); setSelected(current => (current === card.id ? null : card.id)); }} />)}
          </PoolArea>
        )}

        {stage.kind === "sequence" ? (
          <ol className="space-y-2" aria-label="Urutan jawaban">
            {slots.map(slot => (
              <li key={slot.id} className="flex items-stretch gap-3">
                <span className="w-9 h-9 shrink-0 rounded-[12px] clay-butter font-bold flex items-center justify-center mt-1">{slot.order + 1}</span>
                <div className="flex-1 min-w-0">{slotView(slot)}</div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-fit max-w-full rounded-[18px] clay-dark font-bold px-5 py-3 text-center break-words">{stage.root.label}</div>
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
              {stage.groups.map((group, g) => {
                const parentSlot = slots.find(slot => slot.expected.id === group.parent.id);
                const parentKnown = !group.parentIsSlot || (parentSlot && locked.has(parentSlot.id));
                return (
                  <div key={group.parent.id} className="rounded-[18px] bg-[#F7F6FA] border border-[#E6E4EE] p-3 space-y-2">
                    {stage.id !== "map-branches" && (
                      <p className="text-[14px] font-semibold text-[#1C1E26] break-words border-b border-[#E6E4EE] pb-2">
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

        {message && <p role="status" className={`text-sm font-semibold ${wrong.size ? "text-[#852C28]" : "text-[#1D5E4D]"}`}>{message}</p>}

        {!done ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={check} disabled={!allFilled}
              className="clay-btn clay-btn-dark px-4 py-2.5 text-[13px] font-bold inline-flex items-center gap-2 disabled:opacity-40"><Check className="w-4 h-4" />Periksa</button>
            <button type="button" onClick={hint} className="clay-btn clay-btn-butter px-4 py-2.5 text-[13px] font-bold inline-flex items-center gap-2"><Lightbulb className="w-4 h-4" />Petunjuk (−5 XP)</button>
            <button type="button" onClick={reset} className="clay-btn clay-btn-white px-4 py-2.5 text-[13px] font-bold inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" />Atur ulang</button>
          </div>
        ) : (
          <section className="clay-mint rounded-[26px] p-4 space-y-3" aria-label="Pembahasan">
            <p className="flex items-center gap-2 font-bold text-[16px]"><CheckCircle2 className="w-5 h-5" />Tahap selesai! +{stageXp(wrongChecks, hints)} XP</p>
            <p className="text-[13px]">Pembahasan: baca kembali kenapa setiap kartu berada di tempatnya.</p>
            <ul className="space-y-2">
              {slots.map(slot => (
                <li key={slot.id} className="rounded-[18px] bg-white p-3">
                  <p className="font-bold text-[#1C1E26] break-words">{stage.kind === "sequence" ? `${slot.order + 1}. ` : ""}{slot.expected.label}</p>
                  {slot.expected.detail && <p className="text-[13px] leading-[19px] text-[#475569] mt-1 break-words">{slot.expected.detail}</p>}
                  {slot.expected.example && <p className="text-[13px] text-[#785308] bg-[#FFF6DF] rounded-[12px] px-3 py-1.5 mt-1.5 break-words">Contoh: {slot.expected.example}</p>}
                  <details><summary className="cursor-pointer text-xs font-bold text-[#595F72] py-1">Sumber</summary>{sources(slot.expected.source_refs)}</details>
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
      className={`flex flex-wrap gap-2 rounded-[18px] border-2 border-dashed p-3 min-h-[64px] ${isOver ? "border-[#21518A]/50 bg-[#EDF4FD]" : "border-[#E6E4EE] bg-[#F7F6FA]"}`}>
      {children}
    </div>
  );
}

function DragCard({ card, selected, onTap }: { card: Card; selected: boolean; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  return (
    <button ref={setNodeRef} type="button" {...attributes} {...listeners} onClick={onTap} aria-pressed={selected}
      style={{ transform: CSS.Translate.toString(transform), touchAction: "none" }}
      className={`px-3 py-2 rounded-[14px] text-[13px] font-semibold cursor-grab text-left break-words max-w-full ${
        isDragging ? "z-10 relative" : ""} ${selected ? "clay-sky ring-2 ring-[#21518A]/40" : "clay-white"}`}>
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
    empty: "border-dashed border-[#E6E4EE] bg-white text-[#9195A8]",
    filled: "border-solid border-[#21518A]/25 bg-[#EDF4FD] text-[#1C1E26]",
    locked: "border-solid border-[#1D5E4D]/50 bg-[#EBF6F2] text-[#1D5E4D]",
    wrong: "border-dashed border-[#852C28]/50 bg-[#FDF0EF] text-[#852C28]",
  }[state];
  return (
    <button ref={setNodeRef} type="button" onClick={onTap} disabled={disabled}
      aria-label={state === "locked" ? `Tepat: ${label}` : label ? `Terisi: ${label}. Ketuk untuk mengembalikan` : "Tempat kosong"}
      className={`w-full min-h-[48px] rounded-[14px] border-2 px-3 py-2 text-[13px] text-left font-semibold break-words transition-colors ${tone} ${
        isOver || (armed && state !== "locked") ? "ring-2 ring-[#21518A]/35" : ""}`}>
      {prefix}
      {state === "locked" && <Check className="inline w-4 h-4 mr-1 -mt-0.5" strokeWidth={3} />}
      {state === "wrong" && !label && <X className="inline w-4 h-4 mr-1 -mt-0.5" strokeWidth={3} />}
      {label ?? (state === "wrong" ? "Belum tepat, coba kartu lain" : "Letakkan kartu di sini")}
      {hint && <span className="block text-xs font-medium text-[#785308] mt-1">Petunjuk: {hint}</span>}
    </button>
  );
}
