import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Timer,
  Brain,
  Sliders,
  ArrowRight,
  CheckCircle2,
  Eye,
  Headphones,
  FlaskConical,
  RotateCcw,
} from "@/components/ui/icons";

interface AssessmentQuestion {
  id: number;
  type: "SPEED" | "PATTERN" | "MODALITY";
  title: string;
  prompt: string;
  options: {
    text: string;
    modalityBias: "VISUAL" | "AUDITORI" | "KINESTETIK";
    visualScore: number;
    audioScore: number;
    practiceScore: number;
  }[];
}

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    type: "MODALITY",
    title: "Kuesioner Preferensi Modalitas",
    prompt: "Ketika guru menjelaskan materi baru yang belum pernah kamu ketahui, apa yang paling membantumu memahami lebih cepat?",
    options: [
      {
        text: "Melihat diagram alur terstruktur, bagan konsep, atau infografis visual.",
        modalityBias: "VISUAL",
        visualScore: 30,
        audioScore: 5,
        practiceScore: 5,
      },
      {
        text: "Mendengarkan penjelasan lisan, analogi cerita suara, atau podcast materi.",
        modalityBias: "AUDITORI",
        visualScore: 5,
        audioScore: 30,
        practiceScore: 5,
      },
      {
        text: "Langsung mencoba simulasi interaktif, membongkar studi kasus, atau membuat sketsa praktis.",
        modalityBias: "KINESTETIK",
        visualScore: 5,
        audioScore: 5,
        practiceScore: 30,
      },
    ],
  },
  {
    id: 2,
    type: "PATTERN",
    title: "Uji Pengenalan Pola Logika",
    prompt: "Perhatikan deret pola logika: [Bentuk A, Bentuk B, Bentuk C, Bentuk A, Bentuk B, ...]. Komponen manakah berikutnya?",
    options: [
      {
        text: "Bentuk C (Mengulang siklus periodik 3-komponen).",
        modalityBias: "VISUAL",
        visualScore: 25,
        audioScore: 10,
        practiceScore: 15,
      },
      {
        text: "Bentuk A ganda.",
        modalityBias: "AUDITORI",
        visualScore: 5,
        audioScore: 10,
        practiceScore: 10,
      },
      {
        text: "Bentuk B ekstra.",
        modalityBias: "KINESTETIK",
        visualScore: 5,
        audioScore: 5,
        practiceScore: 15,
      },
    ],
  },
  {
    id: 3,
    type: "SPEED",
    title: "Uji Kecepatan Pemrosesan",
    prompt: "Ketika menemui soal menantang yang membutuhkan penalaran multi-langkah, kamu lebih menyukai:",
    options: [
      {
        text: "Membaca kembali rangkuman visual dan diagram langkah pengerjaan.",
        modalityBias: "VISUAL",
        visualScore: 25,
        audioScore: 10,
        practiceScore: 10,
      },
      {
        text: "Mendengarkan petunjuk tutor bertahap via audio.",
        modalityBias: "AUDITORI",
        visualScore: 10,
        audioScore: 25,
        practiceScore: 10,
      },
      {
        text: "Melakukan simulasi uji-coba langsung dengan variabel interaktif.",
        modalityBias: "KINESTETIK",
        visualScore: 10,
        audioScore: 10,
        practiceScore: 25,
      },
    ],
  },
];

export default function AssessmentPage() {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUserProfile } = useApp();

  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const [visualTotal, setVisualTotal] = useState(10);
  const [audioTotal, setAudioTotal] = useState(10);
  const [practiceTotal, setPracticeTotal] = useState(10);

  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const responseTimesRef = useRef<number[]>([]);

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex, hasStarted]);

  const currentQ = ASSESSMENT_QUESTIONS[currentIndex];

  const handleNext = () => {
    if (selectedOption === null) return;

    audioSynth.playClickSound();

    const timeSpent = (Date.now() - startTime) / 1000;
    responseTimesRef.current.push(timeSpent);

    const chosen = currentQ.options[selectedOption];
    const newV = visualTotal + chosen.visualScore;
    const newA = audioTotal + chosen.audioScore;
    const newP = practiceTotal + chosen.practiceScore;

    setVisualTotal(newV);
    setAudioTotal(newA);
    setPracticeTotal(newP);

    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
    } else {
      const sum = newV + newA + newP;
      const vPct = Math.round((newV / sum) * 100);
      const aPct = Math.round((newA / sum) * 100);
      const pPct = 100 - (vPct + aPct);

      let dominant: "VISUAL" | "AUDITORI" | "KINESTETIK" = "VISUAL";
      if (newA > newV && newA > newP) dominant = "AUDITORI";
      else if (newP > newV && newP > newA) dominant = "KINESTETIK";

      updateCurrentUserProfile({
        learningStyle: dominant,
        modalityScores: {
          visual: vPct,
          audio: aPct,
          practice: pPct,
        },
      });

      audioSynth.playLevelUpSound();
      confetti({ particleCount: 80, spread: 70 });
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    audioSynth.playClickSound();
    setCurrentIndex(0);
    setSelectedOption(null);
    setVisualTotal(10);
    setAudioTotal(10);
    setPracticeTotal(10);
    setIsCompleted(false);
    setHasStarted(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] pb-24 relative overflow-hidden select-none">
      {/* Soft Ambient Modality Top Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#E3DBF8]/60 via-[#D1EBE1]/35 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <Navbar />
      </div>

      <main className="max-w-xl mx-auto px-4 pt-6 sm:pt-8 relative z-10">
        {/* VIEW 1: INTRO SCREEN (CLAYMORPHIC) */}
        {!hasStarted && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="clay-pill clay-lavender text-[10px] font-extrabold text-[#4B3B7A] px-3 py-1 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Diagnostic AI Assessment</span>
              </span>
              <span className="text-xs font-black text-[#1C1E26] tracking-tight">
                EduFlow Adaptive
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C1E26] leading-tight">
                Temukan Gaya &amp; Ritme Belajarmu
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] mt-1.5 font-medium leading-relaxed">
                Asesmen ini mengkalibrasi materi pelajaran, format media, dan tingkat kesulitan soal otomatis sesuai kecenderungan kognitifmu.
              </p>
            </div>

            {/* 3 Rich Claymorphic Dimension Cards */}
            <div className="space-y-3 pt-1">
              {/* Card 1: Speed (Mint Clay) */}
              <div className="clay-card clay-mint p-4 sm:p-5 flex items-center gap-3.5 transition-transform hover:scale-[1.01]">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-[#1D5E4D] flex items-center justify-center shadow-xs shrink-0">
                  <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#0E3D31]">
                    Uji Kecepatan Pemrosesan
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#1D5E4D] font-bold mt-0.5">
                    Visual Reaction &amp; Dynamic Pacing
                  </p>
                </div>
              </div>

              {/* Card 2: Pattern (Lavender Clay) */}
              <div className="clay-card clay-lavender p-4 sm:p-5 flex items-center gap-3.5 transition-transform hover:scale-[1.01]">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-[#4B3B7A] flex items-center justify-center shadow-xs shrink-0">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#2D2152]">
                    Uji Pengenalan Pola Logika
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#4B3B7A] font-bold mt-0.5">
                    Logical Pattern Recognition &amp; Schema
                  </p>
                </div>
              </div>

              {/* Card 3: Modality (Butter Clay) */}
              <div className="clay-card clay-butter p-4 sm:p-5 flex items-center gap-3.5 transition-transform hover:scale-[1.01]">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-[#785308] flex items-center justify-center shadow-xs shrink-0">
                  <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#4A3205]">
                    Kuesioner Preferensi Modalitas
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#785308] font-bold mt-0.5">
                    Visual, Auditori, atau Praktik Kinestetik
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Start Action */}
            <div className="pt-3 space-y-2.5 text-center">
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setHasStarted(true);
                }}
                className="clay-btn clay-btn-dark w-full py-3.5 sm:py-4 px-6 rounded-2xl text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
              >
                <span>Mulai Asesmen &amp; Kalibrasi Profil AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-[#9195A8] font-semibold">
                Estimasi waktu pengerjaan: 1–2 menit • Hasil dapat dikalibrasi ulang kapan saja
              </p>
            </div>
          </div>
        )}

        {/* VIEW 2: INTERACTIVE QUESTIONS (CLAYMORPHIC) */}
        {hasStarted && !isCompleted && currentQ && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header Steps Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="clay-pill clay-lavender text-[10px] font-extrabold text-[#4B3B7A] px-2.5 py-1 shadow-2xs shrink-0">
                  Soal {currentIndex + 1} dari {ASSESSMENT_QUESTIONS.length}
                </span>
                <span className="text-[11px] font-bold text-[#5A5E70] truncate">
                  {currentQ.title}
                </span>
              </div>

              {/* Mini Step Track */}
              <div className="w-20 sm:w-28 bg-white/70 h-2 rounded-full p-0.5 shadow-inner shrink-0 border border-white">
                <div
                  className="bg-[#1C1E26] h-full rounded-full transition-all duration-300 shadow-xs"
                  style={{
                    width: `${((currentIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Box Card */}
            <div className="clay-card clay-white p-5 sm:p-6 rounded-[28px] border border-white shadow-sm space-y-4">
              <h2 className="text-sm sm:text-base font-black text-[#1C1E26] leading-relaxed">
                {currentQ.prompt}
              </h2>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        audioSynth.playClickSound();
                        setSelectedOption(idx);
                      }}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl transition-all flex items-center justify-between gap-3 text-left cursor-pointer ${
                        isSelected
                          ? "clay-btn clay-btn-dark text-white font-bold shadow-md scale-101"
                          : "clay-card bg-[#F8F9FD] border-white/80 hover:bg-[#F2EFFC] text-[#1C1E26]"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                        {opt.text}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className={`clay-btn flex-1 py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                  selectedOption !== null
                    ? "clay-btn-dark text-white shadow-md active:scale-98 cursor-pointer"
                    : "bg-[#E4E2DD] text-[#9195A8] cursor-not-allowed"
                }`}
              >
                <span>
                  {currentIndex < ASSESSMENT_QUESTIONS.length - 1
                    ? "Soal Berikutnya"
                    : "Lihat Profil Kognitif"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: COMPLETED SUMMARY (CLAYMORPHIC) */}
        {isCompleted && (
          <div className="space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <span className="clay-pill clay-mint text-[10px] font-extrabold text-[#1D5E4D] px-3 py-1 inline-flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisis AI Berhasil</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1C1E26] mt-1.5">
                Profil Kognitif Selesai!
              </h2>
              <p className="text-xs text-[#5A5E70] font-medium max-w-sm mx-auto">
                AI telah memetakan kecenderungan sensorik dan merekomendasikan format materi terbaik untukmu.
              </p>
            </div>

            <div className="clay-card clay-white p-5 sm:p-6 rounded-[28px] border border-white shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-black/5">
                <div>
                  <span className="text-[10px] font-bold text-[#9195A8] uppercase tracking-wider block">
                    Modalitas Dominan
                  </span>
                  <h3 className="text-base font-black text-[#1C1E26]">
                    Gaya Belajar {currentUser.learningStyle}
                  </h3>
                </div>
                <span className="clay-pill px-3 py-1.5 text-xs font-black text-white bg-[#1C1E26] shadow-xs">
                  {currentUser.learningStyle}
                </span>
              </div>

              {/* 3 Modality Progress Bars in Clay Tints */}
              <div className="space-y-3">
                {/* Visual */}
                <div className="p-3 rounded-2xl bg-[#E6F5EE] border border-[#C7EAD9]/80 shadow-2xs">
                  <div className="flex justify-between text-xs font-black text-[#0E3D31] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#1D5E4D]" />
                      Visual (Diagram &amp; Bagan)
                    </span>
                    <span>{currentUser.modalityScores?.visual || 80}%</span>
                  </div>
                  <div className="w-full bg-white/70 h-2.5 rounded-full p-0.5 shadow-inner">
                    <div
                      className="bg-[#1D5E4D] h-full rounded-full transition-all duration-700 shadow-xs"
                      style={{ width: `${currentUser.modalityScores?.visual || 80}%` }}
                    />
                  </div>
                </div>

                {/* Auditori */}
                <div className="p-3 rounded-2xl bg-[#EFEAFB] border border-[#D8CDF8]/80 shadow-2xs">
                  <div className="flex justify-between text-xs font-black text-[#2D2152] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-[#4B3B7A]" />
                      Auditori (Podcast &amp; Suara)
                    </span>
                    <span>{currentUser.modalityScores?.audio || 45}%</span>
                  </div>
                  <div className="w-full bg-white/70 h-2.5 rounded-full p-0.5 shadow-inner">
                    <div
                      className="bg-[#4B3B7A] h-full rounded-full transition-all duration-700 shadow-xs"
                      style={{ width: `${currentUser.modalityScores?.audio || 45}%` }}
                    />
                  </div>
                </div>

                {/* Praktik Kinestetik */}
                <div className="p-3 rounded-2xl bg-[#FFF4DC] border border-[#FCE0A2]/80 shadow-2xs">
                  <div className="flex justify-between text-xs font-black text-[#4A3205] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-[#785308]" />
                      Kinestetik (Simulasi Praktik)
                    </span>
                    <span>{currentUser.modalityScores?.practice || 55}%</span>
                  </div>
                  <div className="w-full bg-white/70 h-2.5 rounded-full p-0.5 shadow-inner">
                    <div
                      className="bg-[#785308] h-full rounded-full transition-all duration-700 shadow-xs"
                      style={{ width: `${currentUser.modalityScores?.practice || 55}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  navigate("/student");
                }}
                className="clay-btn clay-btn-dark w-full py-3.5 sm:py-4 px-6 rounded-2xl text-xs sm:text-sm font-black text-white flex items-center justify-center gap-2 shadow-md active:scale-98 cursor-pointer"
              >
                <span>Lanjut ke Beranda Belajar</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleRestart}
                className="clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi Asesmen</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
