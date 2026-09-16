import React, { useState, useMemo } from "react";
import { GroundedDocument, FillBlankItem, SortingChallenge, GameConfig } from "@/types";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FlaskConical,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Check,
  ArrowRight,
} from "@/components/ui/icons";

// ============================================================================
// 1. REACTOR DRAGGABLE COMPONENT CARD
// ============================================================================
function DraggableReactorItem({
  comp,
  isSelected,
  onClick,
}: {
  comp: { id: string; label: string; type: string; hint: string };
  isSelected?: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: comp.id,
    data: comp,
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-grab active:cursor-grabbing flex items-center justify-between gap-2 select-none ${
        isSelected
          ? "bg-[#FFF9EE] border-[#785308] ring-2 ring-[#785308] shadow-md scale-102"
          : isDragging
          ? "bg-[#FFF9EE] border-dashed border-[#785308]"
          : "bg-white border-black/10 shadow-2xs hover:shadow-md hover:border-[#785308] hover:bg-[#FFFDF8]"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
        <div className="w-8 h-8 rounded-xl bg-[#FFF4DC] text-[#785308] flex items-center justify-center font-bold text-xs shrink-0">
          ⚗️
        </div>
        <div className="min-w-0">
          <h5 className="text-xs font-black text-[#1C1E26] truncate">{comp.label}</h5>
          <p className="text-[10px] text-[#5A5E70] truncate">{comp.hint}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 pointer-events-none">
        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-black/5 text-[#5A5E70]">
          {comp.type}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 2. REACTOR DROPPABLE SOCKET
// ============================================================================
function DroppableReactorSlot({
  slot,
  index,
  placedComponent,
  onUnplug,
  onClick,
}: {
  slot: { id: string; name: string; description: string };
  index: number;
  placedComponent?: { id: string; label: string; type: string };
  onUnplug: () => void;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: slot,
  });

  const isOccupied = Boolean(placedComponent);

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`p-3.5 rounded-2xl border transition-all duration-200 min-h-[110px] flex flex-col justify-between cursor-pointer select-none ${
        isOccupied
          ? "bg-[#EBF6F2] border-[#9DE1CA] shadow-2xs hover:border-[#1D5E4D]"
          : isOver
          ? "bg-[#FFF4DC] border-2 border-[#785308] ring-4 ring-[#FFE299] shadow-xl scale-104"
          : "bg-white border-dashed border-black/15 hover:border-[#785308]/60 hover:bg-[#FFF9EE]/30"
      }`}
    >
      <div className="flex items-center justify-between pointer-events-none">
        <span className="text-[10px] font-mono font-bold text-[#5A5E70]">
          Soket #{index + 1}
        </span>
        {isOccupied ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#1D5E4D]">
            <Check className="w-3 h-3" />
            <span>Terkunci ✓</span>
          </span>
        ) : isOver ? (
          <span className="text-[10px] font-black text-[#785308] bg-[#FFE299] px-2 py-0.5 rounded-full animate-bounce">
            Lepaskan Di Sini!
          </span>
        ) : (
          <span className="text-[10px] font-bold text-[#785308] bg-[#FFF4DC] px-2 py-0.5 rounded-full">
            Soket Target
          </span>
        )}
      </div>

      <div className="my-1 pointer-events-none">
        <h5 className="text-xs font-extrabold text-[#1C1E26] leading-snug">
          {slot.name}
        </h5>
        <p className="text-[10px] text-[#5A5E70] line-clamp-1">{slot.description}</p>
      </div>

      {isOccupied && placedComponent ? (
        <div className="pt-1.5 border-t border-[#9DE1CA]/50 flex items-center justify-between text-[11px] font-black text-[#1D5E4D]">
          <span className="truncate">{placedComponent.label}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUnplug();
            }}
            className="text-[9px] text-[#BA1A1A] font-bold hover:underline ml-1 cursor-pointer"
          >
            Lepas
          </button>
        </div>
      ) : (
        <div className="pt-1 border-t border-black/5 text-[10px] text-black/40 italic pointer-events-none">
          {isOver ? "Lepaskan komponen sekarang!" : "Tarik komponen ke sini"}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. PROCESS SORTING DRAGGABLE ITEM (DND-KIT SORTABLE)
// ============================================================================
function SortableProcessItem({
  id,
  index,
  text,
}: {
  id: string;
  index: number;
  text: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3.5 sm:p-4 rounded-2xl border border-black/5 bg-[#F8F9FD] hover:bg-white hover:border-black/15 shadow-2xs transition-all duration-150 flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-center gap-3 min-w-0 pointer-events-none">
        <span className="w-7 h-7 rounded-xl bg-white text-[#4B3B7A] font-mono text-xs font-black flex items-center justify-center shrink-0 border border-black/5 shadow-2xs">
          {index + 1}
        </span>
        <p className="text-xs sm:text-sm font-bold text-[#1C1E26] leading-snug">
          {text}
        </p>
      </div>
      <span className="text-xs text-[#5A5E70] shrink-0 font-bold pointer-events-none">
        ⋮⋮ Drag
      </span>
    </div>
  );
}

// ============================================================================
// 4. FILL-IN-THE-BLANK DRAGGABLE WORD PILL
// ============================================================================
function DraggableWordPill({ word, onClick }: { word: string; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `word_${word}`,
    data: { word },
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0 : 1,
    touchAction: "none",
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-2xl bg-white border border-black/10 text-xs sm:text-sm font-black text-[#1C1E26] shadow-2xs hover:bg-[#EBF6F2] hover:text-[#1D5E4D] hover:border-[#9DE1CA] active:scale-95 transition-all cursor-grab active:cursor-grabbing select-none"
    >
      {word}
    </button>
  );
}

// ============================================================================
// 5. FILL-IN-THE-BLANK DROPPABLE BLANK ZONE
// ============================================================================
function DroppableBlankZone({
  placedWord,
  isCorrect,
  onClear,
}: {
  placedWord: string | null;
  isCorrect: boolean | null;
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "fib_blank_drop_zone",
  });

  return (
    <span
      ref={setNodeRef}
      onClick={onClear}
      className={`inline-flex items-center justify-center min-w-[130px] px-4 py-2 mx-1.5 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer select-none ${
        placedWord
          ? isCorrect
            ? "bg-[#D1EBE1] text-[#1D5E4D] border-[#9DE1CA] shadow-2xs"
            : "bg-[#FFF0F0] text-[#BA1A1A] border-[#FFC2C2]"
          : isOver
          ? "bg-[#FFF4DC] border-2 border-[#1D5E4D] ring-4 ring-[#9DE1CA] scale-108 shadow-lg"
          : "bg-white border-dashed border-2 border-[#1D5E4D] text-[#1D5E4D]"
      }`}
    >
      <span className="pointer-events-none">
        {placedWord ? `${placedWord} ✕` : isOver ? "Lepaskan Di Sini!" : "📥 Drop Kata Ke Sini"}
      </span>
    </span>
  );
}

interface KinestheticLearnSectionProps {
  doc: GroundedDocument;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function KinestheticLearnSection({ doc }: KinestheticLearnSectionProps) {
  const [activeSubMode, setActiveSubMode] = useState<"REACTOR" | "SORTING" | "FILL_BLANK">("REACTOR");

  // DND-KIT SENSORS with activation constraint (dist 4px)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

  // Active Drag Overlays
  const [activeDragData, setActiveDragData] = useState<any>(null);

  // =========================================================================
  // 1. FILL-IN-THE-BLANK DATA
  // =========================================================================
  const fibChallenges: FillBlankItem[] = useMemo(() => {
    if (doc.fillBlankJson) {
      try {
        const parsed = JSON.parse(doc.fillBlankJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: item.id || `fib_${idx + 1}`,
            sentence: item.sentence || "Kalimat konsep [BLANK].",
            blankWord: item.blankWord || "Konsep",
            options: Array.isArray(item.options) && item.options.length > 0
              ? item.options
              : [item.blankWord, "Metode", "Struktur", "Faktor"],
            hint: item.hint || `Perhatikan konsep inti dari ${doc.title}.`,
            explanation: item.explanation || `${item.blankWord} adalah kunci utama pada konsep ini.`,
          }));
        }
      } catch (e) {
        console.warn("[KinestheticSection] Error parsing fillBlankJson:", e);
      }
    }

    const text = doc.rawText || doc.summary || "";
    const paras = text.split(/\n\s*\n+/).filter((p: string) => p.length > 30);
    const fallbackList: FillBlankItem[] = [];
    const stopwords = new Set(["yang", "untuk", "dengan", "dalam", "adalah", "pada", "dari", "oleh", "secara", "sebagai", "dapat", "akan", "serta", "karena", "sebuah"]);

    for (let i = 0; i < Math.min(5, paras.length); i++) {
      const p = paras[i];
      const sentences = p.split(/(?<=[.?!])\s+/).filter((s: string) => s.length > 20);
      const targetSentence = sentences[0] || p.slice(0, 100);
      const words = targetSentence.match(/\b[A-Za-z0-9\-]{5,}\b/g) || [];
      const viableWords = words.filter((w: string) => !stopwords.has(w.toLowerCase()));

      if (viableWords.length > 0) {
        const chosenWord = viableWords.reduce((a: string, b: string) => (a.length >= b.length ? a : b));
        const regex = new RegExp(`\\b${chosenWord}\\b`, "i");
        const blankedSentence = targetSentence.replace(regex, "[BLANK]");
        const opts = Array.from(new Set([chosenWord, "Prinsip", "Metode", "Struktur"])).slice(0, 4);
        opts.sort(() => Math.random() - 0.5);

        fallbackList.push({
          id: `fib_fallback_${i + 1}`,
          sentence: blankedSentence,
          blankWord: chosenWord,
          options: opts,
          hint: `Perhatikan konteks bahasan ke-${i + 1} dari modul ${doc.title}.`,
          explanation: `Kata '${chosenWord}' merupakan istilah kunci yang melengkapi pernyataan konsep tersebut.`,
        });
      }
    }

    return fallbackList.length > 0
      ? fallbackList
      : [
          {
            id: "fib_default_1",
            sentence: `Pemahaman mendalam mengenai [BLANK] menjadi fondasi utama dalam menguasai topik ${doc.title}.`,
            blankWord: "Konsep",
            options: ["Konsep", "Opini", "Asumsi", "Mitos"],
            hint: "Landasan dasar pemikiran rasional.",
            explanation: "Konsep adalah fondasi dasar dari setiap disiplin ilmu pengetahuan.",
          },
        ];
  }, [doc.fillBlankJson, doc.rawText, doc.summary, doc.title]);

  const [fibIndex, setFibIndex] = useState(0);
  const [fibPlacedWord, setFibPlacedWord] = useState<string | null>(null);
  const [fibIsCorrect, setFibIsCorrect] = useState<boolean | null>(null);
  const [fibCompletedIds, setFibCompletedIds] = useState<Set<string>>(new Set());

  const currentFib = fibChallenges[fibIndex] || fibChallenges[0];

  const handleFibAttempt = (selectedWord: string) => {
    audioSynth.playClickSound();
    setFibPlacedWord(selectedWord);

    const isMatch = selectedWord.trim().toLowerCase() === currentFib.blankWord.trim().toLowerCase();
    if (isMatch) {
      setFibIsCorrect(true);
      audioSynth.playLevelUpSound();
      const nextCompleted = new Set(fibCompletedIds);
      nextCompleted.add(currentFib.id);
      setFibCompletedIds(nextCompleted);
      if (nextCompleted.size === fibChallenges.length) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    } else {
      setFibIsCorrect(false);
      audioSynth.playErrorSound();
    }
  };

  // =========================================================================
  // 2. REACTOR DATA & LOGIC
  // =========================================================================
  const reactorConfig = useMemo(() => {
    if (doc.gameConfigJson) {
      try {
        const parsed: GameConfig = JSON.parse(doc.gameConfigJson);
        if (parsed.reactorDragDrop && Array.isArray(parsed.reactorDragDrop.slots) && parsed.reactorDragDrop.slots.length >= 3) {
          return parsed.reactorDragDrop;
        }
      } catch (e) {
        console.warn("[KinestheticSection] Error parsing gameConfigJson:", e);
      }
    }

    return {
      reactorTitle: `Reaktor Perakitan Sistem: ${doc.title}`,
      instruction: "Seret (drag) komponen dari panel kiri dan lepaskan (drop) tepat di atas soket reaktor yang sesuai di panel kanan!",
      slots: [
        { id: "slot_1", name: "Soket Substrat Primer", acceptedItemId: "item_1", description: "Menampung bahan baku dasar reaksi" },
        { id: "slot_2", name: "Sisi Aktif Katalisator", acceptedItemId: "item_2", description: "Menurunkan energi aktivasi sistem" },
        { id: "slot_3", name: "Regulator Keseimbangan", acceptedItemId: "item_3", description: "Mengontrol laju dan arah proses" },
        { id: "slot_4", name: "Kofaktor Penggerak Energi", acceptedItemId: "item_4", description: "Menyuplai energi kinetik molekuler" },
        { id: "slot_5", name: "Stabilisator Buffer Lingkungan", acceptedItemId: "item_5", description: "Menjaga pH dan kondisi optimal" },
        { id: "slot_6", name: "Kondensor Produk Akhir", acceptedItemId: "item_6", description: "Menampung hasil sintesis stabil" },
      ],
      components: [
        { id: "item_1", label: `Bahan Baku ${doc.title.slice(0, 16)}`, type: "substrate", hint: "Pasangkan ke soket bahan baku dasar" },
        { id: "item_2", label: "Biokatalis Enzimatis", type: "catalyst", hint: "Pasangkan ke sisi aktif katalisator" },
        { id: "item_3", label: "Regulator Alosterik", type: "regulator", hint: "Pasangkan ke regulator keseimbangan" },
        { id: "item_4", label: "Donor Energi ATP", type: "energy", hint: "Pasangkan ke kofaktor penggerak energi" },
        { id: "item_5", label: "Larutan Buffer", type: "stabilizer", hint: "Pasangkan ke stabilisator buffer" },
        { id: "item_6", label: "Produk Konversi", type: "product", hint: "Pasangkan ke kondensor produk akhir" },
      ],
    };
  }, [doc.gameConfigJson, doc.title]);

  const [reactorPlacedItems, setReactorPlacedItems] = useState<Record<string, string>>({});
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [reactorFeedbackMsg, setReactorFeedbackMsg] = useState<string | null>(null);

  const availableComponents = useMemo(() => {
    const usedItemIds = new Set(Object.values(reactorPlacedItems));
    return reactorConfig.components.filter((c) => !usedItemIds.has(c.id));
  }, [reactorConfig.components, reactorPlacedItems]);

  const handleDropOnSlot = (slotId: string, itemId: string) => {
    const slot = reactorConfig.slots.find((s) => s.id === slotId);
    if (!slot) return;

    if (slot.acceptedItemId === itemId) {
      audioSynth.playLevelUpSound();
      const nextMap = { ...reactorPlacedItems, [slotId]: itemId };
      setReactorPlacedItems(nextMap);
      setSelectedComponentId(null);
      setReactorFeedbackMsg(`Bagus! Komponen berhasil terpasang di ${slot.name}!`);

      if (Object.keys(nextMap).length === reactorConfig.slots.length) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        setReactorFeedbackMsg("Selamat! Seluruh komponen reaktor berhasil dirakit secara presisi 100%!");
      }
    } else {
      audioSynth.playErrorSound();
      setReactorFeedbackMsg(`Kurang tepat. Komponen tersebut tidak cocok untuk ${slot.name}. Coba cek petunjuknya!`);
    }
  };

  const handleResetReactor = () => {
    audioSynth.playClickSound();
    setReactorPlacedItems({});
    setSelectedComponentId(null);
    setReactorFeedbackMsg(null);
  };

  // =========================================================================
  // 3. PROCESS SORTING DATA
  // =========================================================================
  const sortingChallenges: SortingChallenge[] = useMemo(() => {
    if (doc.sortingChallengesJson) {
      try {
        const parsed = JSON.parse(doc.sortingChallengesJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any, idx: number) => ({
            id: s.id || `sort_${idx + 1}`,
            instruction: s.instruction || `Urutkan tahapan konsep ${doc.title} secara runtut!`,
            items: Array.isArray(s.items) ? s.items : ["Tahap 1", "Tahap 2", "Tahap 3", "Tahap 4"],
            correctOrder: Array.isArray(s.correctOrder) ? s.correctOrder : [0, 1, 2, 3],
            hint: s.hint || "Perhatikan alur inisiasi pada tahap awal.",
            explanation: s.explanation || "Urutan ini mencerminkan tahapan logis mekanisme sains materi.",
          }));
        }
      } catch (e) {
        console.warn("[KinestheticSection] Error parsing sortingChallengesJson:", e);
      }
    }

    return [
      {
        id: "sort_1",
        instruction: `Susunlah tahapan inisiasi dan aktivasi materi '${doc.title}' secara kronologis!`,
        items: [
          "1. Pengenalan rangsangan/substrat pada sistem penerima",
          "2. Pengikatan spesifik dan penurunan energi aktivasi",
          "3. Terjadinya reaksi transformasi perantara",
          "4. Pembentukan produk akhir stabil dan pelepasan sistem",
        ],
        correctOrder: [0, 1, 2, 3],
        hint: "Mulailah dari interaksi awal antara bahan baku dan reseptor.",
        explanation: "Proses selalu diawali dengan pengenalan substrat, diikuti pembentukan kompleks transisi, reaksi katalitik, dan diakhiri dengan pelepasan produk.",
      },
      {
        id: "sort_2",
        instruction: "Urutkan tahapan analisis pemecahan masalah ilmiah berdasarkan materi ini!",
        items: [
          "Identifikasi parameter variabel dasar",
          "Perumusan hipotesis sebab-akibat",
          "Pengujian dengan manipulasi variabel terkontrol",
          "Verifikasi hasil dan penarikan kesimpulan ilmiah",
        ],
        correctOrder: [0, 1, 2, 3],
        hint: "Gunakan metode ilmiah dari observasi awal hingga simpulan.",
        explanation: "Metode ilmiah berurutan dari identifikasi masalah, hipotesis, eksperimen, hingga penarikan kesimpulan terverifikasi.",
      },
    ];
  }, [doc.sortingChallengesJson, doc.title]);

  const [sortingIndex, setSortingIndex] = useState(0);
  const currentSorting = sortingChallenges[sortingIndex] || sortingChallenges[0];

  const [currentWorkingOrder, setCurrentWorkingOrder] = useState<number[]>(() => {
    const order = currentSorting.items.map((_, i) => i);
    return order.sort(() => Math.random() - 0.5);
  });

  const [sortingResult, setSortingResult] = useState<boolean | null>(null);
  const [completedSortingIds, setCompletedSortingIds] = useState<Set<string>>(new Set());

  const handleSelectSortingChallenge = (index: number) => {
    audioSynth.playClickSound();
    setSortingIndex(index);
    const ch = sortingChallenges[index] || sortingChallenges[0];
    const order = ch.items.map((_, i) => i);
    setCurrentWorkingOrder(order.sort(() => Math.random() - 0.5));
    setSortingResult(null);
  };

  const handleVerifySorting = () => {
    audioSynth.playClickSound();
    const isExact = currentWorkingOrder.every((val, idx) => val === currentSorting.correctOrder[idx]);

    if (isExact) {
      setSortingResult(true);
      audioSynth.playLevelUpSound();
      confetti({ particleCount: 85, spread: 70, origin: { y: 0.6 } });
      const nextCompleted = new Set(completedSortingIds);
      nextCompleted.add(currentSorting.id);
      setCompletedSortingIds(nextCompleted);
    } else {
      setSortingResult(false);
      audioSynth.playErrorSound();
    }
  };

  // =========================================================================
  // DND-KIT GLOBAL HANDLERS
  // =========================================================================
  const handleDragStart = (event: DragStartEvent) => {
    audioSynth.playClickSound();
    setActiveDragData(event.active.data.current);
  };

  const handleReactorDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragData(null);

    if (over && active) {
      const slotId = String(over.id);
      const itemId = String(active.id);
      handleDropOnSlot(slotId, itemId);
    }
  };

  const handleSortDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragData(null);

    if (over && active.id !== over.id) {
      const oldIndex = currentWorkingOrder.indexOf(Number(active.id));
      const newIndex = currentWorkingOrder.indexOf(Number(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        audioSynth.playClickSound();
        setCurrentWorkingOrder((items) => arrayMove(items, oldIndex, newIndex));
        setSortingResult(null);
      }
    }
  };

  const handleFibDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragData(null);

    if (over && over.id === "fib_blank_drop_zone") {
      const word = active.data.current?.word || String(active.id).replace("word_", "");
      if (word) {
        handleFibAttempt(word);
      }
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* =================================================================== */}
      {/* ⚗️ SUB-MODE 1: REACTOR DRAG & DROP WITH DND-KIT                     */}
      {/* =================================================================== */}
      {activeSubMode === "REACTOR" && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleReactorDragEnd}
        >
          <section className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            {/* Top Toolbar: Sub-Mode Switcher + Quick Status */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-black/5">
              <div className="flex items-center gap-1 p-1 bg-[#F8F9FD] rounded-2xl border border-black/5">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("REACTOR");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#785308] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>⚗️ Reaktor Drag &amp; Drop</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("SORTING");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-[#4B3B7A] hover:bg-[#F4F0FD] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔢 Urutkan Proses</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("FILL_BLANK");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-[#1D5E4D] hover:bg-[#EBF6F2] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🧩 Kalimat Drag &amp; Drop</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#785308] bg-[#FFF9EE] px-2.5 py-1 rounded-xl border border-[#FFE299]">
                  {Object.keys(reactorPlacedItems).length} / {reactorConfig.slots.length} Terpasang
                </span>
                <button
                  type="button"
                  onClick={handleResetReactor}
                  className="px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-[#1C1E26] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Feedback Banner */}
            {reactorFeedbackMsg && (
              <div className="p-3 rounded-2xl bg-[#FFF9EE] border border-[#FFE299] text-xs font-bold text-[#785308] flex items-center gap-2 animate-in fade-in duration-200">
                <Sparkles className="w-4 h-4 text-[#785308] shrink-0" />
                <span>{reactorFeedbackMsg}</span>
              </div>
            )}

            {/* Assembly Arena: Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Components Inventory Pool */}
              <div className="lg:col-span-5 space-y-2.5 bg-[#F8F9FD] p-3.5 rounded-3xl border border-black/5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black text-[#1C1E26] uppercase">
                    Inventori Komponen ({availableComponents.length})
                  </span>
                  <span className="text-[10px] text-[#785308] font-black">
                    🖐️ Drag ke Soket Kanan
                  </span>
                </div>

                {availableComponents.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#1D5E4D]/40 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[#1D5E4D] mx-auto" />
                    <p className="text-xs font-bold text-[#1C1E26]">Seluruh komponen sudah terpasang!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {availableComponents.map((comp) => (
                      <DraggableReactorItem
                        key={comp.id}
                        comp={comp}
                        isSelected={selectedComponentId === comp.id}
                        onClick={() => {
                          if (selectedComponentId === comp.id) {
                            setSelectedComponentId(null);
                            setReactorFeedbackMsg(null);
                          } else {
                            setSelectedComponentId(comp.id);
                            setReactorFeedbackMsg(`Komponen '${comp.label}' dipilih! Seret atau klik soket target di kanan.`);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Reactor Sockets */}
              <div className="lg:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-[#1C1E26] uppercase">
                    Soket Reaktor Target ({reactorConfig.slots.length} Unit)
                  </span>
                  <span className="text-[10px] text-[#5A5E70]">Lepaskan komponen tepat di soket</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {reactorConfig.slots.map((slot, sIdx) => {
                    const placedItemId = reactorPlacedItems[slot.id];
                    const placedComponent = reactorConfig.components.find((c) => c.id === placedItemId);

                    return (
                      <DroppableReactorSlot
                        key={slot.id}
                        slot={slot}
                        index={sIdx}
                        placedComponent={placedComponent}
                        onUnplug={() => {
                          audioSynth.playClickSound();
                          const next = { ...reactorPlacedItems };
                          delete next[slot.id];
                          setReactorPlacedItems(next);
                          setReactorFeedbackMsg("Komponen dilepas dari soket kembali ke inventori.");
                        }}
                        onClick={() => {
                          if (selectedComponentId) {
                            handleDropOnSlot(slot.id, selectedComponentId);
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Animated Drag Overlay */}
          <DragOverlay>
            {activeDragData ? (
              <div className="p-3.5 bg-white border-2 border-[#785308] rounded-2xl shadow-xl flex items-center justify-between gap-2 max-w-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF4DC] text-[#785308] flex items-center justify-center font-bold text-xs shrink-0">
                    ⚗️
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-[#1C1E26] truncate">{activeDragData.label}</h5>
                    <p className="text-[10px] text-[#5A5E70] truncate">{activeDragData.hint}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-black/5 text-[#5A5E70]">
                  {activeDragData.type}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* =================================================================== */}
      {/* 🔢 SUB-MODE 2: PROCESS SORTING WITH DND-KIT SORTABLE                */}
      {/* =================================================================== */}
      {activeSubMode === "SORTING" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleSortDragEnd}
        >
          <section className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            {/* Top Toolbar: Sub-Mode Switcher + Challenge Levels */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-black/5">
              <div className="flex items-center gap-1 p-1 bg-[#F8F9FD] rounded-2xl border border-black/5">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("REACTOR");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-[#785308] hover:bg-[#FFF9EE] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>⚗️ Reaktor Drag &amp; Drop</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("SORTING");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#4B3B7A] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔢 Urutkan Proses</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("FILL_BLANK");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-[#1D5E4D] hover:bg-[#EBF6F2] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🧩 Kalimat Drag &amp; Drop</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#5A5E70] mr-1">Tantangan:</span>
                {sortingChallenges.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSortingChallenge(idx)}
                    className={`w-7 h-7 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      idx === sortingIndex
                        ? "bg-[#4B3B7A] text-white shadow-xs"
                        : completedSortingIds.has(sortingChallenges[idx].id)
                        ? "bg-[#D1EBE1] text-[#1D5E4D]"
                        : "bg-black/5 text-[#5A5E70]"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-[11px] text-[#4B3B7A] font-bold bg-[#F4F0FD] p-2 rounded-2xl border border-[#D0C4F7]">
              🖐️ Tarik (drag) kotak langkah ke atas atau bawah untuk menyusun urutan logis.
            </div>

            {/* Sortable List */}
            <SortableContext
              items={currentWorkingOrder.map(String)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2.5 max-w-2xl mx-auto">
                {currentWorkingOrder.map((origIdx, pos) => (
                  <SortableProcessItem
                    key={String(origIdx)}
                    id={String(origIdx)}
                    index={pos}
                    text={currentSorting.items[origIdx]}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Verification Result Feedback */}
            {sortingResult !== null && (
              <div
                className={`p-3.5 rounded-2xl border max-w-2xl mx-auto space-y-1.5 ${
                  sortingResult
                    ? "bg-[#EBF6F2] border-[#9DE1CA] text-[#124B3D]"
                    : "bg-[#FFF0F0] border-[#FFC2C2] text-[#900B0B]"
                }`}
              >
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                  {sortingResult ? <CheckCircle2 className="w-4 h-4 text-[#1D5E4D]" /> : <XCircle className="w-4 h-4 text-[#BA1A1A]" />}
                  <span>{sortingResult ? "Urutan Tepat & Sempurna!" : "Urutan Belum Tepat. Coba Susun Ulang!"}</span>
                </div>
                <p className="text-xs leading-relaxed font-normal">
                  {sortingResult ? currentSorting.explanation : currentSorting.hint}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleVerifySorting}
                className="clay-btn clay-btn-dark px-6 py-2 rounded-2xl text-xs font-black shadow-xs cursor-pointer"
              >
                Periksa Urutan Langkah
              </button>

              {sortingResult && sortingIndex < sortingChallenges.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleSelectSortingChallenge(sortingIndex + 1)}
                  className="clay-btn clay-btn-white px-5 py-2 rounded-2xl text-xs font-bold text-[#4B3B7A] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Lanjut Tantangan Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>

          {/* Drag Overlay for Sortable Item */}
          <DragOverlay>
            {activeDragData !== null ? (
              <div className="p-3.5 sm:p-4 bg-white border-2 border-[#4B3B7A] rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-[#1C1E26]">
                <span>Langkah Sedang Dipindahkan...</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* =================================================================== */}
      {/* 🧩 SUB-MODE 3: FILL-IN-THE-BLANK WITH DND-KIT                       */}
      {/* =================================================================== */}
      {activeSubMode === "FILL_BLANK" && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleFibDragEnd}
        >
          <section className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            {/* Top Toolbar: Sub-Mode Switcher + Challenge Levels */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-black/5">
              <div className="flex items-center gap-1 p-1 bg-[#F8F9FD] rounded-2xl border border-black/5">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("REACTOR");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-[#785308] hover:bg-[#FFF9EE] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>⚗️ Reaktor Drag &amp; Drop</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("SORTING");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-[#4B3B7A] hover:bg-[#F4F0FD] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔢 Urutkan Proses</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setActiveSubMode("FILL_BLANK");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#1D5E4D] text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>🧩 Kalimat Drag &amp; Drop</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#5A5E70] mr-1">Tantangan:</span>
                {fibChallenges.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      audioSynth.playClickSound();
                      setFibIndex(idx);
                      setFibPlacedWord(null);
                      setFibIsCorrect(null);
                    }}
                    className={`w-7 h-7 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      idx === fibIndex
                        ? "bg-[#1D5E4D] text-white shadow-xs"
                        : fibCompletedIds.has(fibChallenges[idx].id)
                        ? "bg-[#D1EBE1] text-[#1D5E4D]"
                        : "bg-black/5 text-[#5A5E70]"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Sentence Card with Drop Zone */}
            <div className="p-6 sm:p-8 bg-[#F8F9FD] rounded-3xl border border-black/5 text-center space-y-4 max-w-2xl mx-auto">
              <p className="text-base sm:text-lg font-bold text-[#1C1E26] leading-relaxed">
                {currentFib.sentence.split("[BLANK]").map((part, pIdx, arr) => (
                  <React.Fragment key={pIdx}>
                    {part}
                    {pIdx < arr.length - 1 && (
                      <DroppableBlankZone
                        placedWord={fibPlacedWord}
                        isCorrect={fibIsCorrect}
                        onClear={() => {
                          if (fibPlacedWord) {
                            audioSynth.playClickSound();
                            setFibPlacedWord(null);
                            setFibIsCorrect(null);
                          }
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </p>

              {/* Options Pill Pool */}
              <div className="pt-3 space-y-2">
                <span className="text-[11px] text-[#1D5E4D] font-bold block">
                  🖐️ Seret salah satu kata ke kotak kalimat:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {currentFib.options.map((opt, oIdx) => (
                    <DraggableWordPill
                      key={oIdx}
                      word={opt}
                      onClick={() => handleFibAttempt(opt)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback & Explanation */}
            {fibIsCorrect !== null && (
              <div
                className={`p-4 rounded-2xl border max-w-2xl mx-auto space-y-1.5 ${
                  fibIsCorrect
                    ? "bg-[#EBF6F2] border-[#9DE1CA] text-[#124B3D]"
                    : "bg-[#FFF0F0] border-[#FFC2C2] text-[#900B0B]"
                }`}
              >
                <div className="flex items-center gap-2 font-black text-xs">
                  {fibIsCorrect ? <CheckCircle2 className="w-4 h-4 text-[#1D5E4D]" /> : <XCircle className="w-4 h-4 text-[#BA1A1A]" />}
                  <span>{fibIsCorrect ? "Tepat Sekali!" : "Jawaban Kurang Tepat, Coba Seret Opsi Lain!"}</span>
                </div>
                <p className="text-xs leading-relaxed font-normal">
                  {fibIsCorrect ? currentFib.explanation : currentFib.hint}
                </p>
              </div>
            )}

            {/* Next Button */}
            {fibIsCorrect && fibIndex < fibChallenges.length - 1 && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setFibIndex(fibIndex + 1);
                    setFibPlacedWord(null);
                    setFibIsCorrect(null);
                  }}
                  className="clay-btn clay-btn-dark px-6 py-2.5 rounded-2xl text-xs font-black"
                >
                  Lanjut Tantangan #{fibIndex + 2} →
                </button>
              </div>
            )}
          </section>

          {/* Drag Overlay for Word Pill */}
          <DragOverlay>
            {activeDragData ? (
              <div className="px-4 py-2 bg-[#D1EBE1] border-2 border-[#1D5E4D] rounded-2xl shadow-xl text-xs sm:text-sm font-black text-[#1D5E4D]">
                <span>{activeDragData.word}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
