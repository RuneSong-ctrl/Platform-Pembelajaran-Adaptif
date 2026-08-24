import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { audioSynth } from "@/services/audioSynth";
import {
  createInitialDDAState,
  evaluateDDAAnswer,
  DDAState,
} from "@/services/ddaEngine";
import {
  generateBlockHash,
  generateTransactionId,
  GENESIS_BLOCK_HASH,
} from "@/services/blockchainVault";
import { BlockchainCredential } from "@/types";
import confetti from "canvas-confetti";
import {
  Flame,
  Timer,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "@/components/ui/icons";

export default function AdaptiveQuizPage() {
  const navigate = useNavigate();
  const { currentUser, tasks, classrooms, credentials, mintCredential } = useApp();

  const myClassrooms = classrooms.filter((c) =>
    Boolean(currentUser?.id && c.studentIds?.includes(currentUser.id))
  );
  const quizTask =
    tasks.find((t) => myClassrooms.some((c) => c.id === t.classroomId) && t.type === "quiz") ||
    tasks.find((t) => t.type === "quiz") ||
    tasks[0];
  const allQuestions = quizTask?.contentJson?.questions || [];

  const [ddaState, setDdaState] = useState<DDAState>(createInitialDDAState("BASIC"));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  const [hintModalOpen, setHintModalOpen] = useState(false);
  const [activeHintTab, setActiveHintTab] = useState<"analogi" | "visual" | "langkah">("analogi");

  const [mintedCertId, setMintedCertId] = useState<string | null>(null);

  const activeQuestion =
    allQuestions.find((q) => q.difficulty === ddaState.currentLevel) ||
    allQuestions[currentQuestionIndex % (allQuestions.length || 1)];

  // Start question timer
  useEffect(() => {
    if (isQuizFinished || isAnswerSubmitted || allQuestions.length === 0) return;

    setSecondsLeft(30);
    questionStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(null, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, isQuizFinished, isAnswerSubmitted, ddaState.currentLevel, allQuestions.length]);

  const handleAnswer = (optionIdx: number | null, isTimeout = false) => {
    if (isAnswerSubmitted || !activeQuestion) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const timeSpent = (Date.now() - questionStartTimeRef.current) / 1000;

    const isCorrect =
      !isTimeout && optionIdx !== null && optionIdx === activeQuestion.correctIndex;

    setSelectedOption(optionIdx);
    setIsAnswerSubmitted(true);

    if (isCorrect) {
      audioSynth.playSuccessSound();
    } else {
      audioSynth.playErrorSound();
    }

    const { nextState, transition } = evaluateDDAAnswer(
      ddaState,
      isCorrect,
      timeSpent,
      currentQuestionIndex
    );

    setDdaState(nextState);

    if (transition.action === "LEVEL_UP") {
      audioSynth.playLevelUpSound();
    }
  };

  const handleNextQuestion = () => {
    audioSynth.playClickSound();

    if (ddaState.history.length >= Math.min(4, allQuestions.length)) {
      finishQuiz();
    } else {
      setIsAnswerSubmitted(false);
      setSelectedOption(null);
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const finishQuiz = async () => {
    setIsQuizFinished(true);
    const accuracy =
      ddaState.totalAnswered > 0
        ? Math.round((ddaState.totalCorrect / ddaState.totalAnswered) * 100)
        : 0;

    if (accuracy >= 50) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const score = Math.max(accuracy, 85);
      const targetClassId = quizTask?.classroomId || myClassrooms[0]?.id || "cls_bio_10a";
      const competencyTitle = `Penguasaan ${quizTask?.chapter || quizTask?.title || "Materi Pembelajaran"} (Level ${ddaState.currentLevel})`;

      try {
        const newCert = await mintCredential(currentUser.id, targetClassId, competencyTitle, score);
        setMintedCertId(newCert.certificateId);
      } catch (err) {
        console.warn("Mint credential offline fallback", err);
      }
    }
  };

  const streak = ddaState.consecutiveCorrect;

  if (allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] pb-24">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/student"
              onClick={() => audioSynth.playClickSound()}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-[0_4px_12px_rgba(28,30,38,0.04)] text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] hover:bg-[#F2EFFC] transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          <div className="clay-card clay-white p-8 sm:p-12 rounded-3xl border border-black/5 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#FFF4DC] text-[#785308] flex items-center justify-center mx-auto shadow-2xs">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-[#1C1E26]">
                Belum Ada Kuis Aktif dari Guru
              </h2>
              <p className="text-xs sm:text-sm text-[#595F72] leading-relaxed">
                Guru di kelasmu belum menerbitkan kuis adaptif DDA untuk modul ini. Guru dapat menyusun kuis otomatis menggunakan AI Generator Studio di Portal Guru.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Link
                to="/student/class"
                onClick={() => audioSynth.playClickSound()}
                className="clay-btn clay-btn-dark px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Cek Ruang Kelas</span>
              </Link>
              <Link
                to="/student/ai"
                onClick={() => audioSynth.playClickSound()}
                className="clay-btn clay-btn-white px-5 py-2.5 rounded-2xl text-xs font-bold text-[#1C1E26] flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Diskusi Bersama AI Tutor</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] pb-24">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-5">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/student"
            onClick={() => audioSynth.playClickSound()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-[0_4px_12px_rgba(28,30,38,0.04)] text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] hover:bg-[#F2EFFC] transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="text-[11px] font-bold text-[#5A5E70] uppercase tracking-wider">
            Sesi Kuis Adaptif
          </span>
        </div>

        {!isQuizFinished ? (
          <>
            {/* DDA Live HUD Status */}
            <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-white border border-[rgba(28,30,38,0.06)] shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5A5E70]">Tingkat Kesulitan:</span>
                <Badge
                  variant={
                    ddaState.currentLevel === "MASTERY"
                      ? "mint"
                      : ddaState.currentLevel === "CHALLENGING"
                      ? "lavender"
                      : ddaState.currentLevel === "MEDIUM"
                      ? "butter"
                      : "slate"
                  }
                  className="font-bold text-xs"
                >
                  {ddaState.currentLevel}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1 text-[#1D5E4D]">
                  <Flame className="w-4 h-4 fill-[#1D5E4D]" />
                  <span>{streak} Streak</span>
                </div>

                <div className="flex items-center gap-1 text-[#5A5E70]">
                  <Timer className="w-4 h-4" />
                  <span className={secondsLeft <= 5 ? "text-[#ba1a1a] font-bold" : ""}>
                    {secondsLeft}s
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-[#9195A8]">
                <span>Pertanyaan {ddaState.history.length + 1} dari 4</span>
                <span>{quizTask?.title || "Kuis Evaluasi Adaptif DDA"}</span>
              </div>
              <Progress value={((ddaState.history.length + 1) / 4) * 100} indicatorColor="bg-[#1C1E26]" />
            </div>

            {/* Question Card */}
            <Card className="p-6 sm:p-8 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-6">
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-base sm:text-lg font-bold text-[#010105] leading-snug">
                  {activeQuestion?.questionText}
                </h2>
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    setHintModalOpen(true);
                  }}
                  className="p-2.5 rounded-2xl bg-[#F0EEE9] hover:bg-[#E0DAF5] text-[#010105] transition-colors shrink-0 cursor-pointer"
                  title="Minta Petunjuk AI Companion"
                >
                  <Lightbulb className="w-5 h-5 text-[#785308]" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {activeQuestion?.options.map((opt: string, idx: number) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === activeQuestion.correctIndex;

                  let styleClass = "bg-[#FBF9F4] border-[rgba(28,30,38,0.08)] hover:bg-white text-[#010105]";

                  if (isAnswerSubmitted) {
                    if (isCorrectAnswer) {
                      styleClass = "bg-[#D1EBE1] border-[#1D5E4D] text-[#1D5E4D] font-bold";
                    } else if (isSelected && !isCorrectAnswer) {
                      styleClass = "bg-[#FCD9D7] border-[#ba1a1a] text-[#ba1a1a] font-bold";
                    }
                  } else if (isSelected) {
                    styleClass = "bg-[#1C1E26] text-white border-[#1C1E26]";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleAnswer(idx)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${styleClass}`}
                    >
                      <span>{opt}</span>
                      {isAnswerSubmitted && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-[#1D5E4D] shrink-0 ml-2" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submission Feedback */}
              {isAnswerSubmitted && (
                <div className="pt-4 border-t border-[rgba(28,30,38,0.06)] space-y-4 animate-in fade-in">
                  <div
                    className={`p-4 rounded-2xl text-xs font-semibold ${
                      selectedOption === activeQuestion.correctIndex
                        ? "bg-[#D1EBE1] text-[#1D5E4D]"
                        : "bg-[#FCD9D7] text-[#ba1a1a]"
                    }`}
                  >
                    <p className="font-bold mb-1">
                      {selectedOption === activeQuestion.correctIndex
                        ? "Jawaban Tepat"
                        : "Jawaban Kurang Tepat"}
                    </p>
                    <p className="opacity-90">{activeQuestion.explanation?.langkah}</p>
                  </div>

                  <Button
                    onClick={handleNextQuestion}
                    variant="primary"
                    size="lg"
                    className="w-full font-bold shadow-md"
                  >
                    {ddaState.history.length >= 3 ? "Selesaikan Kuis" : "Lanjut Soal Berikutnya"}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              )}
            </Card>
          </>
        ) : (
          /* RESULT SCREEN */
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-[#D1EBE1] flex items-center justify-center text-3xl mx-auto shadow-xs">
                <Sparkles className="w-8 h-8 text-[#1D5E4D]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#010105]">
                Kuis DDA Selesai
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] font-medium">
                Performa kognitif dan akurasimu telah dievaluasi oleh sistem DDA.
              </p>
            </div>

            <Card className="p-6 sm:p-8 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-[#FBF9F4]">
                  <span className="text-xs text-[#5A5E70] font-bold block">Akurasi Soal</span>
                  <span className="text-2xl font-extrabold text-[#010105] mt-1 block">
                    {ddaState.totalAnswered > 0
                      ? Math.round((ddaState.totalCorrect / ddaState.totalAnswered) * 100)
                      : 100}
                    %
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#FBF9F4]">
                  <span className="text-xs text-[#5A5E70] font-bold block">Tingkat Capaian</span>
                  <span className="text-2xl font-extrabold text-[#1D5E4D] mt-1 block">
                    {ddaState.currentLevel}
                  </span>
                </div>
              </div>

              {mintedCertId && (
                <div className="p-4 rounded-2xl bg-[#D1EBE1] border border-[rgba(29,94,77,0.2)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-[#1D5E4D] shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-[#1D5E4D]">
                        Kredensial Kompetensi Berhasil Diterbitkan
                      </h4>
                      <p className="text-[11px] text-[#5A5E70]">
                        ID: {mintedCertId} • Terkunci di Paspor Blockchain
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("/passport")}
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold shrink-0"
                  >
                    Buka Paspor
                  </Button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => navigate("/student")}
                  variant="outline"
                  className="flex-1 font-bold"
                >
                  Kembali ke Beranda
                </Button>
                <Button
                  onClick={() => navigate("/student/learn")}
                  variant="primary"
                  className="flex-1 font-bold"
                >
                  Eksplorasi Modul
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* AI COMPANION HINT MODAL */}
      <Dialog open={hintModalOpen} onOpenChange={setHintModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#010105] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#785308]" /> Petunjuk AI Companion
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-1.5 p-1 bg-[#F0EEE9] rounded-full my-3">
            <button
              onClick={() => setActiveHintTab("analogi")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeHintTab === "analogi" ? "bg-white text-[#010105] shadow-xs" : "text-[#5A5E70]"
              }`}
            >
              Analogi
            </button>
            <button
              onClick={() => setActiveHintTab("visual")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeHintTab === "visual" ? "bg-white text-[#010105] shadow-xs" : "text-[#5A5E70]"
              }`}
            >
              Alur Visual
            </button>
            <button
              onClick={() => setActiveHintTab("langkah")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeHintTab === "langkah" ? "bg-white text-[#010105] shadow-xs" : "text-[#5A5E70]"
              }`}
            >
              Langkah
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#FBF9F4] text-xs font-medium text-[#010105] leading-relaxed">
            {activeQuestion?.explanation?.[activeHintTab] || "Petunjuk tidak tersedia untuk soal ini."}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setHintModalOpen(false)} variant="primary" size="sm">
              Tutup Petunjuk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
