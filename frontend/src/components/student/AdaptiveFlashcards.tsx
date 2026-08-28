import React, { useState } from "react";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Award,
} from "@/components/ui/icons";

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  conceptTag?: string;
}

interface AdaptiveFlashcardsProps {
  cards: FlashcardItem[];
  topicTitle: string;
}

export default function AdaptiveFlashcards({ cards, topicTitle }: AdaptiveFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);

  const currentCard = cards[currentIndex] || cards[0];
  const isCurrentMastered = currentCard ? masteredIds.has(currentCard.id) : false;

  const handleFlip = () => {
    audioSynth.playClickSound();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    audioSynth.playClickSound();
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    audioSynth.playClickSound();
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleMarkMastered = (cardId: string) => {
    audioSynth.playClickSound();
    const nextSet = new Set(masteredIds);
    if (nextSet.has(cardId)) {
      nextSet.delete(cardId);
    } else {
      nextSet.add(cardId);
      audioSynth.playLevelUpSound();
      if (nextSet.size === cards.length) {
        confetti({ particleCount: 80, spread: 70 });
      }
    }
    setMasteredIds(nextSet);
  };

  const handleReset = () => {
    audioSynth.playClickSound();
    setMasteredIds(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  if (!cards || cards.length === 0) {
    return null;
  }

  const progressPct = Math.round((masteredIds.size / cards.length) * 100);

  return (
    <div className="clay-card clay-butter p-5 sm:p-6 space-y-4 text-[#4A3205] rounded-3xl">
      {/* Top Header & Mastery Progress */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#785308]/15 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#785308]/80 block">
            Arena Kinestetik • Flashcard Interaktif
          </span>
          <h3 className="text-sm sm:text-base font-black text-[#2C1D02] mt-0.5">
            {topicTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#785308]/20 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-[#785308]" />
            <span className="text-xs font-black text-[#785308]">
              {masteredIds.size} / {cards.length} Dikuasai ({progressPct}%)
            </span>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-white/60 hover:bg-white text-[#785308] cursor-pointer transition-all"
            title="Reset Penguasaan Kartu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full bg-[#785308] transition-all duration-300 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* 3D Flashcard Container - Strict Fixed Proportion (Never stretches downward) */}
      <div className="max-w-xl mx-auto w-full relative h-64 sm:h-72 perspective-1000 select-none">
        <div
          onClick={handleFlip}
          className={`w-full h-full duration-500 transform-style-3d cursor-pointer relative rounded-3xl transition-transform ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT FACE (Pertanyaan / Konsep) */}
          <div
            className="absolute inset-0 backface-hidden clay-card bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#785308]/20 flex flex-col justify-between shadow-xs overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFF3D6] text-[#785308]">
                Kartu {currentIndex + 1} dari {cards.length}
              </span>
              {currentCard.conceptTag && (
                <span className="text-[10px] font-bold text-[#5A5E70] bg-black/5 px-2 py-0.5 rounded-md">
                  {currentCard.conceptTag}
                </span>
              )}
            </div>

            {/* Scrollable text area if content is long, preserving fixed card dimensions */}
            <div className="my-auto text-center space-y-2 max-h-[140px] overflow-y-auto px-2">
              <p className="text-xs sm:text-sm font-black text-[#1C1E26] leading-relaxed">
                {currentCard.question}
              </p>
              {showHint && currentCard.hint && (
                <p className="text-[11px] text-[#785308] bg-[#FFF9EE] p-2 rounded-xl border border-[#785308]/20 animate-in fade-in">
                  💡 Petunjuk: {currentCard.hint}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-[#5A5E70] shrink-0 border-t border-black/5">
              {currentCard.hint ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    audioSynth.playClickSound();
                    setShowHint(!showHint);
                  }}
                  className="inline-flex items-center gap-1 font-bold text-[#785308] hover:underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? "Tutup Hint" : "Lihat Hint"}</span>
                </button>
              ) : (
                <span />
              )}
              <span className="font-bold text-[#785308]/80 text-[11px]">
                Klik untuk membalik kartu ➔
              </span>
            </div>
          </div>

          {/* BACK FACE (Jawaban / Pembahasan) */}
          <div
            className="absolute inset-0 backface-hidden clay-card clay-mint p-5 sm:p-6 rounded-3xl border-2 border-[#1D5E4D]/30 flex flex-col justify-between shadow-xs rotate-y-180 overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 text-[#1D5E4D]">
                Jawaban &amp; Penjelasan
              </span>
              <Sparkles className="w-4 h-4 text-[#1D5E4D]" />
            </div>

            {/* Scrollable text area if answer is detailed */}
            <div className="my-auto text-center space-y-2 max-h-[140px] overflow-y-auto px-2">
              <p className="text-xs sm:text-sm font-semibold text-[#082921] leading-relaxed">
                {currentCard.answer}
              </p>
            </div>

            <div className="text-center text-[11px] font-bold text-[#1D5E4D]/80 shrink-0 border-t border-[#1D5E4D]/15 pt-2">
              Klik kartu untuk kembali ke soal ↺
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls & Mastery Toggle */}
      <div className="max-w-xl mx-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="clay-pill clay-white p-2 text-[#785308] hover:text-black cursor-pointer shadow-2xs"
            title="Kartu Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-black text-[#785308]">
            {currentIndex + 1} / {cards.length}
          </span>
          <button
            onClick={handleNext}
            className="clay-pill clay-white p-2 text-[#785308] hover:text-black cursor-pointer shadow-2xs"
            title="Kartu Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => handleMarkMastered(currentCard.id)}
          className={`clay-btn px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
            isCurrentMastered
              ? "bg-[#D1EBE1] text-[#1D5E4D] border-2 border-[#1D5E4D]"
              : "clay-btn-white text-[#785308] border border-[#785308]/20"
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${isCurrentMastered ? "fill-current" : ""}`} />
          <span>{isCurrentMastered ? "Sudah Dikuasai" : "Tandai Paham"}</span>
        </button>
      </div>
    </div>
  );
}
