import React, { useState, useMemo } from "react";
import { GroundedDocument, FillBlankItem } from "@/types";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  FlaskConical,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Award,
  ChevronRight,
  ChevronLeft,
  Flame,
  Layers,
  HelpCircle,
} from "@/components/ui/icons";

interface KinestheticLearnSectionProps {
  doc: GroundedDocument;
}

export default function KinestheticLearnSection({ doc }: KinestheticLearnSectionProps) {
  // 1. Ekstrak atau bangun daftar tantangan Fill-in-the-Blank
  const challenges: FillBlankItem[] = useMemo(() => {
    // 1.A Cek dari doc.fillBlankJson yang di-generate backend
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

    // 1.B Smart Programmatic Fallback: Ekstrak dari teks materi guru
    const text = doc.rawText || doc.summary || "";
    const clean = text.replace(/\r/g, "").trim();
    const paras = clean.split(/\n\s*\n+/).filter((p) => p.length > 30);
    const fallbackList: FillBlankItem[] = [];
    const stopwords = new Set([
      "yang", "untuk", "dengan", "dalam", "adalah", "pada", "dari", "oleh", "secara", "sebagai",
      "dapat", "akan", "serta", "karena", "sebuah", "suatu", "antara", "tersebut", "merupakan",
    ]);

    for (let i = 0; i < Math.min(5, paras.length); i++) {
      const p = paras[i];
      const sentences = p.split(/(?<=[.?!])\s+/).filter((s) => s.length > 25);
      const targetSentence = sentences[0] || p.slice(0, 100);

      // Cari kata-kata penting (panjang kata >= 5, bukan stopword)
      const words = targetSentence.match(/\b[A-Za-z0-9\-]{5,}\b/g) || [];
      const viableWords = words.filter((w) => !stopwords.has(w.toLowerCase()));

      if (viableWords.length > 0) {
        const chosenWord = viableWords.reduce((a, b) => (a.length >= b.length ? a : b));
        const regex = new RegExp(`\\b${chosenWord}\\b`, "i");
        const blankedSentence = targetSentence.replace(regex, "[BLANK]");

        const generalDistractors = ["Prinsip", "Metode", "Struktur", "Analisis", "Faktor", "Sistem"];
        const opts = Array.from(
          new Set([
            chosenWord,
            ...generalDistractors.filter((d) => d.toLowerCase() !== chosenWord.toLowerCase()),
          ])
        ).slice(0, 4);

        // Shuffle options
        opts.sort(() => Math.random() - 0.5);

        fallbackList.push({
          id: `fib_fallback_${i + 1}`,
          sentence: blankedSentence,
          blankWord: chosenWord,
          options: opts,
          hint: `Perhatikan konteks bahasan ke-${i + 1} dari modul ${doc.title}.`,
          explanation: `Kata '${chosenWord}' merupakan istilah kunci yang melengkapi pernyataan konsep tersebut secara akurat.`,
        });
      }
    }

    if (fallbackList.length > 0) return fallbackList;

    // Fallback universal mutlak
    return [
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

  // State Game / Latihan Kinestetik
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placedWord, setPlacedWord] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const currentChallenge = challenges[currentIndex] || challenges[0];

  // Reset per challenge jika index berganti
  const handleSelectChallenge = (index: number) => {
    audioSynth.playClickSound();
    setCurrentIndex(index);
    setPlacedWord(null);
    setIsCorrect(null);
    setShowHint(false);
  };

  // Handler Verifikasi Jawaban Kata
  const handleAttemptWord = (selectedWord: string) => {
    audioSynth.playClickSound();
    setPlacedWord(selectedWord);

    const isMatch = selectedWord.trim().toLowerCase() === currentChallenge.blankWord.trim().toLowerCase();

    if (isMatch) {
      setIsCorrect(true);
      audioSynth.playLevelUpSound();
      const nextCompleted = new Set(completedIds);
      if (!nextCompleted.has(currentChallenge.id)) {
        nextCompleted.add(currentChallenge.id);
        setCompletedIds(nextCompleted);
        setScore((s) => s + 25);
        setStreak((st) => st + 1);
      }

      if (nextCompleted.size === challenges.length) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      setIsCorrect(false);
      audioSynth.playErrorSound();
      setStreak(0);
    }
  };

  // HTML5 Drag Event Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, word: string) => {
    audioSynth.playClickSound();
    e.dataTransfer.setData("text/plain", word);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const droppedWord = e.dataTransfer.getData("text/plain");
    if (droppedWord) {
      handleAttemptWord(droppedWord);
    }
  };

  const handleNextChallenge = () => {
    audioSynth.playClickSound();
    if (currentIndex < challenges.length - 1) {
      handleSelectChallenge(currentIndex + 1);
    } else {
      // Loop kembali atau pemicu selesai
      handleSelectChallenge(0);
    }
  };

  const handleResetChallenge = () => {
    audioSynth.playClickSound();
    setPlacedWord(null);
    setIsCorrect(null);
    setShowHint(false);
  };

  // Pemecahan kalimat di sekitar [BLANK]
  const sentenceParts = useMemo(() => {
    const raw = currentChallenge.sentence || "Konsep [BLANK].";
    const parts = raw.split("[BLANK]");
    return {
      before: parts[0] || "",
      after: parts[1] || "",
    };
  }, [currentChallenge.sentence]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* ✋ KINESTHETIC ARENA: DRAG & DROP FILL-IN-THE-BLANK (UNIVERSAL)          */}
      {/* ========================================================================= */}
      <section className="clay-card clay-butter p-5 sm:p-7 text-[#4A3205] space-y-6 rounded-3xl shadow-sm border border-[#785308]/15 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#785308]/10 blur-3xl pointer-events-none" />

        {/* Top Header & Score Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#785308]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-2xs flex items-center justify-center text-xl">
              ✋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#785308] text-white text-[10px] font-extrabold uppercase tracking-wide shadow-2xs">
                  Praktik Kinestetik Gerakan Tangan
                </span>
                <span className="text-xs font-bold text-[#785308]/80">
                  Tantangan {currentIndex + 1} dari {challenges.length}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#2C1D02] mt-0.5">
                Universal Drag & Drop: Rangkai Konsep
              </h2>
            </div>
          </div>

          {/* XP Score & Streak Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#785308]/20 shadow-2xs">
              <Award className="w-4 h-4 text-[#785308]" />
              <span className="text-xs font-black text-[#785308]">{score} XP</span>
            </div>

            {streak > 1 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF1D6] border border-[#785308]/30 shadow-2xs animate-bounce [animation-duration:2s]">
                <Flame className="w-4 h-4 text-orange-600 fill-current" />
                <span className="text-xs font-black text-[#785308]">{streak}x Streak!</span>
              </div>
            )}
          </div>
        </div>

        {/* Challenge Stepper Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {challenges.map((c, idx) => {
            const isDone = completedIds.has(c.id);
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectChallenge(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                  isCurrent
                    ? "bg-[#785308] text-white shadow-xs scale-102"
                    : isDone
                    ? "bg-[#D1EBE1] text-[#1D5E4D]"
                    : "bg-white/80 text-[#785308] hover:bg-white"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>#{idx + 1}</span>}
                <span>Konsep {idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Main Interactive Sentence Box with Drop Zone Slot */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/95 border border-[#785308]/20 shadow-xs space-y-6">
          <div className="flex items-center justify-between text-xs text-[#5A5E70]">
            <span className="font-extrabold uppercase tracking-wider text-[#785308]">
              Instruksi Praktik:
            </span>
            <span>💡 Seret kata ke kotak rumpang, atau ketuk pilihan kata di bawah</span>
          </div>

          {/* The Sentence with Interactive Drop Slot */}
          <div className="text-sm sm:text-base md:text-lg font-semibold text-[#1C1E26] leading-loose flex flex-wrap items-center gap-2.5">
            <span>{sentenceParts.before}</span>

            {/* DROP ZONE SLOT */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (placedWord) handleResetChallenge();
              }}
              className={`inline-flex items-center justify-center min-w-[150px] sm:min-w-[180px] h-12 px-4 rounded-2xl border-2 transition-all cursor-pointer select-none text-sm font-black shadow-inner ${
                isCorrect === true
                  ? "bg-[#EBF6F2] border-[#1D5E4D] text-[#1D5E4D] scale-105 shadow-xs ring-4 ring-[#1D5E4D]/15"
                  : isCorrect === false
                  ? "bg-[#FDECEC] border-[#BA1A1A] text-[#BA1A1A] animate-shake"
                  : isDraggingOver
                  ? "bg-[#FFF9EE] border-[#785308] scale-105 border-dashed ring-4 ring-[#785308]/20"
                  : "bg-[#F8F9FD] border-dashed border-[#785308]/40 hover:border-[#785308] text-[#785308]/60"
              }`}
            >
              {placedWord ? (
                <div className="flex items-center gap-1.5">
                  {isCorrect === true && <CheckCircle2 className="w-4 h-4 text-[#1D5E4D]" />}
                  {isCorrect === false && <XCircle className="w-4 h-4 text-[#BA1A1A]" />}
                  <span>{placedWord}</span>
                </div>
              ) : (
                <span className="text-xs font-bold opacity-75">
                  {isDraggingOver ? "Lepaskan Kata di Sini" : "[ TARIK KATA KE SINI ]"}
                </span>
              )}
            </div>

            <span>{sentenceParts.after}</span>
          </div>

          {/* Feedback Banner & Explanation */}
          {isCorrect !== null && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed space-y-1.5 animate-in fade-in duration-200 ${
                isCorrect
                  ? "bg-[#EBF6F2] border-[#1D5E4D]/30 text-[#124B3D]"
                  : "bg-[#FDECEC] border-[#BA1A1A]/30 text-[#6B0F0F]"
              }`}
            >
              <div className="flex items-center gap-2 font-black">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#1D5E4D]" />
                    <span>Luar Biasa! Pasangan Konsep Sangat Tepat!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-[#BA1A1A]" />
                    <span>Belum Tepat. Coba seret kata alternatif lainnya!</span>
                  </>
                )}
              </div>
              <p className="font-medium text-black/80">{currentChallenge.explanation}</p>
            </div>
          )}

          {/* Draggable Word Bank */}
          <div className="space-y-2 pt-2 border-t border-[#785308]/15">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#785308] block">
              Pilihan Kata Kunci (Bank Kata Draggable):
            </span>

            <div className="flex flex-wrap items-center gap-2.5">
              {currentChallenge.options.map((word, wIdx) => {
                const isSelected = placedWord === word;
                return (
                  <div
                    key={wIdx}
                    draggable={!isCorrect}
                    onDragStart={(e) => handleDragStart(e, word)}
                    onClick={() => {
                      if (!isCorrect) handleAttemptWord(word);
                    }}
                    className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm select-none transition-all cursor-grab active:cursor-grabbing shadow-xs flex items-center gap-2 border ${
                      isSelected
                        ? isCorrect
                          ? "bg-[#1D5E4D] text-white border-[#1D5E4D] opacity-60"
                          : "bg-[#BA1A1A] text-white border-[#BA1A1A]"
                        : "bg-white text-[#4A3205] border-[#785308]/20 hover:border-[#785308] hover:bg-[#FFF9EE] hover:scale-102"
                    }`}
                  >
                    <span className="opacity-50 text-[10px]">⠿</span>
                    <span>{word}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar (Hint, Reset, Next Challenge) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#785308]/15">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setShowHint(!showHint);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#785308]/20 text-[#785308] hover:bg-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? "Sembunyikan Petunjuk" : "Butuh Petunjuk?"}</span>
              </button>

              {placedWord && !isCorrect && (
                <button
                  type="button"
                  onClick={handleResetChallenge}
                  className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#785308]/20 text-[#785308] hover:bg-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ulangi Kata</span>
                </button>
              )}
            </div>

            {isCorrect && (
              <button
                type="button"
                onClick={handleNextChallenge}
                className="px-5 py-2.5 rounded-xl bg-[#785308] text-white hover:bg-[#5C3F06] text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs transition-all animate-bounce [animation-duration:2.5s]"
              >
                <span>Tantangan Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Hint Dropdown Box */}
          {showHint && (
            <div className="p-3.5 rounded-2xl bg-[#FFF9EE] border border-[#785308]/20 text-xs text-[#4A3205] flex items-center gap-2 animate-in fade-in">
              <Lightbulb className="w-4 h-4 text-[#785308] shrink-0" />
              <span><strong>Petunjuk:</strong> {currentChallenge.hint}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
