import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] pb-24">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 pt-6 sm:pt-10">
        {/* VIEW 1: INTRO SCREEN */}
        {!hasStarted && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-[#010105] text-lg">EduFlow</span>
              <Sparkles className="w-5 h-5 text-[#4C635C]" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#010105]">
                Temukan Gaya &amp; Ritme Belajarmu
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] mt-2 font-medium leading-relaxed">
                Kami butuh sedikit informasi untuk menyesuaikan materi belajarmu.
              </p>
            </div>

            {/* 3 Large Assessment Cards */}
            <div className="space-y-4 pt-2">
              {/* Card 1: Speed */}
              <div className="p-5 rounded-3xl bg-white border border-[rgba(28,30,38,0.06)] shadow-[0_6px_20px_rgba(26,28,36,0.04)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#D1EBE1] flex items-center justify-center text-[#1D5E4D] shrink-0">
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#010105]">
                    Uji Kecepatan Pemrosesan
                  </h3>
                  <p className="text-xs text-[#5A5E70] font-medium">
                    Visual Reaction Test
                  </p>
                </div>
              </div>

              {/* Card 2: Pattern */}
              <div className="p-5 rounded-3xl bg-white border border-[rgba(28,30,38,0.06)] shadow-[0_6px_20px_rgba(26,28,36,0.04)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#E0DAF5] flex items-center justify-center text-[#4B3B7A] shrink-0">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#010105]">
                    Uji Pengenalan Pola Logika
                  </h3>
                  <p className="text-xs text-[#5A5E70] font-medium">
                    Logical Pattern Recognition
                  </p>
                </div>
              </div>

              {/* Card 3: Modality */}
              <div className="p-5 rounded-3xl bg-white border border-[rgba(28,30,38,0.06)] shadow-[0_6px_20px_rgba(26,28,36,0.04)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FADFAD] flex items-center justify-center text-[#785308] shrink-0">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#010105]">
                    Kuesioner Preferensi Modalitas
                  </h3>
                  <p className="text-xs text-[#5A5E70] font-medium">
                    Visual, Audio, atau Praktik?
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-4 space-y-3 text-center">
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setHasStarted(true);
                }}
                className="w-full bg-[#1A1C24] text-white py-4 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md cursor-pointer"
              >
                <span>Mulai Analisis AI &amp; Buat Profil Kognitif</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-[#9195A8] font-medium">
                Hasil asesmen dapat berubah seiring aktivitas belajarmu
              </p>
            </div>
          </div>
        )}

        {/* VIEW 2: INTERACTIVE QUESTIONS */}
        {hasStarted && !isCompleted && currentQ && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#5A5E70]">
                Soal {currentIndex + 1} dari {ASSESSMENT_QUESTIONS.length}
              </span>
              <Badge variant="slate" className="text-[10px]">
                {currentQ.title}
              </Badge>
            </div>

            <Card className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-sm space-y-5">
              <h2 className="text-base sm:text-lg font-bold text-[#010105] leading-snug">
                {currentQ.prompt}
              </h2>

              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        audioSynth.playClickSound();
                        setSelectedOption(idx);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-[#1A1C24] text-white border-[#1A1C24] shadow-xs"
                          : "bg-[#FBF9F4] border-[rgba(28,30,38,0.08)] hover:bg-white text-[#010105]"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                        {opt.text}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </Card>

            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className="w-full bg-[#1A1C24] text-white py-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all shadow-sm cursor-pointer"
            >
              <span>{currentIndex < ASSESSMENT_QUESTIONS.length - 1 ? "Soal Berikutnya" : "Lihat Profil Kognitif"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* VIEW 3: COMPLETED SUMMARY */}
        {isCompleted && (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-[#010105]">
                Profil Kognitif Selesai!
              </h2>
              <p className="text-xs text-[#5A5E70] font-medium">
                AI telah memetakan kecenderungan belajarmu secara proporsional.
              </p>
            </div>

            <Card className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-sm space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#9195A8] uppercase">
                  Modalitas Dominan
                </span>
                <Badge variant="mint">{currentUser.learningStyle}</Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#1D5E4D] mb-1">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Visual</span>
                    <span>{currentUser.modalityScores?.visual || 80}%</span>
                  </div>
                  <Progress value={currentUser.modalityScores?.visual || 80} indicatorColor="bg-[#1D5E4D]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#4B3B7A] mb-1">
                    <span className="flex items-center gap-1.5"><Headphones className="w-3.5 h-3.5" /> Auditori</span>
                    <span>{currentUser.modalityScores?.audio || 45}%</span>
                  </div>
                  <Progress value={currentUser.modalityScores?.audio || 45} indicatorColor="bg-[#4B3B7A]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-[#785308] mb-1">
                    <span className="flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Praktik</span>
                    <span>{currentUser.modalityScores?.practice || 55}%</span>
                  </div>
                  <Progress value={currentUser.modalityScores?.practice || 55} indicatorColor="bg-[#785308]" />
                </div>
              </div>
            </Card>

            <button
              onClick={() => navigate("/student")}
              className="w-full bg-[#1A1C24] text-white py-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md cursor-pointer"
            >
              <span>Lanjut ke Beranda Belajar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
