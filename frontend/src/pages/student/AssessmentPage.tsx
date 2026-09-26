import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  Sparkles,
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

// Kuesioner gaya belajar VAK: tiap situasi punya satu pilihan per modalitas, bobot sama (10 poin).
const vak = (id: number, title: string, prompt: string, [visual, auditori, kinestetik]: [string, string, string]): AssessmentQuestion => ({
  id,
  type: "MODALITY",
  title,
  prompt,
  options: [
    { text: visual, modalityBias: "VISUAL", visualScore: 10, audioScore: 0, practiceScore: 0 },
    { text: auditori, modalityBias: "AUDITORI", visualScore: 0, audioScore: 10, practiceScore: 0 },
    { text: kinestetik, modalityBias: "KINESTETIK", visualScore: 0, audioScore: 0, practiceScore: 10 },
  ],
});

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  vak(1, "Memahami Materi Baru", "Saat guru menjelaskan materi yang belum pernah kamu pelajari, apa yang paling membantumu cepat paham?", [
    "Melihat gambar, diagram, atau bagan yang ditunjukkan guru.",
    "Mendengarkan penjelasan guru dengan saksama, lalu bertanya jika belum jelas.",
    "Langsung mencoba contoh soal atau praktik sambil dijelaskan.",
  ]),
  vak(2, "Persiapan Ujian", "Ketika belajar untuk ulangan atau ujian, cara apa yang paling sering kamu lakukan?", [
    "Membaca ulang catatan, memberi warna/stabilo, atau membuat peta konsep.",
    "Membaca materi dengan suara keras atau berdiskusi dengan teman.",
    "Mengerjakan banyak latihan soal atau menulis ulang rangkuman sendiri.",
  ]),
  vak(3, "Menggunakan Hal Baru", "Kamu baru mendapat aplikasi atau alat yang belum pernah dipakai. Bagaimana kamu mempelajarinya?", [
    "Melihat gambar panduan atau menonton video tutorial.",
    "Meminta seseorang menjelaskan cara memakainya.",
    "Langsung mencoba-coba sendiri sampai bisa.",
  ]),
  vak(4, "Mengingat Informasi", "Bagaimana kamu biasanya mengingat informasi penting, misalnya rumus atau istilah?", [
    "Membayangkan tulisan atau letaknya di buku/papan tulis.",
    "Mengucapkannya berulang-ulang atau membuat lagu/jembatan keledai.",
    "Menuliskannya berkali-kali atau mempraktikkannya langsung.",
  ]),
  vak(5, "Memberi Petunjuk", "Temanmu bertanya arah menuju rumahmu. Apa yang kamu lakukan?", [
    "Menggambar denah atau mengirim peta lokasi.",
    "Menjelaskan rutenya secara lisan, belok kiri-kanan dan patokannya.",
    "Mengajaknya berangkat bersama atau menunjukkan jalannya langsung.",
  ]),
  vak(6, "Menjelaskan ke Teman", "Saat menjelaskan suatu konsep kepada teman, kamu cenderung:", [
    "Membuat coretan, sketsa, atau gambar agar mudah dipahami.",
    "Menjelaskan dengan kata-kata dan contoh cerita.",
    "Memperagakan atau memakai benda di sekitar sebagai contoh.",
  ]),
  vak(7, "Konsentrasi Belajar", "Hal apa yang paling mengganggu konsentrasimu saat belajar?", [
    "Meja berantakan atau banyak gerakan di sekitarku.",
    "Suara bising atau orang mengobrol di dekatku.",
    "Harus duduk diam terlalu lama tanpa bergerak.",
  ]),
  vak(8, "Mengingat Pengalaman", "Saat mengingat kegiatan sekolah yang berkesan, apa yang paling mudah kamu ingat?", [
    "Suasana, tempat, dan wajah orang-orang di sana.",
    "Percakapan, suara, atau musik yang terdengar saat itu.",
    "Kegiatan yang kamu lakukan dan rasanya saat melakukannya.",
  ]),
  vak(9, "Kegiatan Kelas Favorit", "Kegiatan kelas mana yang paling kamu sukai?", [
    "Presentasi dengan slide, video, atau infografis.",
    "Diskusi kelompok, tanya jawab, atau mendengarkan cerita guru.",
    "Eksperimen, praktikum, permainan, atau proyek membuat sesuatu.",
  ]),
  vak(10, "Waktu Luang", "Di waktu luang, kegiatan apa yang paling kamu nikmati?", [
    "Menonton film, membaca komik, atau menggambar.",
    "Mendengarkan musik, podcast, atau mengobrol dengan teman.",
    "Berolahraga, bermain game, atau membuat kerajinan tangan.",
  ]),
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [startTime, setStartTime] = useState<number>(Date.now());
  const responseTimesRef = useRef<number[]>([]);

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex, hasStarted]);

  const currentQ = ASSESSMENT_QUESTIONS[currentIndex];

  const handleNext = async () => {
    if (selectedOption === null || isSaving) return;

    audioSynth.playClickSound();

    const timeSpent = (Date.now() - startTime) / 1000;
    responseTimesRef.current.push(timeSpent);

    const chosen = currentQ.options[selectedOption];
    const newV = visualTotal + chosen.visualScore;
    const newA = audioTotal + chosen.audioScore;
    const newP = practiceTotal + chosen.practiceScore;

    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setVisualTotal(newV);
      setAudioTotal(newA);
      setPracticeTotal(newP);
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

      setIsSaving(true);
      setSaveError("");
      try {
        await updateCurrentUserProfile({
          learningStyle: dominant,
          modalityScores: { visual: vPct, audio: aPct, practice: pPct },
        });
        setIsCompleted(true);
        audioSynth.playLevelUpSound();
        confetti({ disableForReducedMotion: true, particleCount: 80, spread: 70 });
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Hasil belum tersimpan. Silakan coba lagi.");
      } finally { setIsSaving(false); }
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
    setSaveError("");
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
            <div className="flex items-center justify-between pb-1 border-b border-black/5">
              <span className="text-mini font-black uppercase tracking-wider text-[#595F72]">
                Asesmen Diagnostik Awal
              </span>
              <span className="text-xs font-black text-[#1C1E26] tracking-tight">
                EduAdapt Adaptive
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
              {/* Card 1: Visual (Mint Clay) */}
              <div className="clay-card clay-mint p-4 sm:p-5 flex items-center gap-3.5 transition-transform hover:scale-[1.01]">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-[#1D5E4D] flex items-center justify-center shadow-xs shrink-0">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#0E3D31]">
                    Gaya Visual
                  </h3>
                  <p className="text-mini sm:text-xs text-[#1D5E4D] font-bold mt-0.5">
                    Belajar lewat gambar, diagram, dan video
                  </p>
                </div>
              </div>

              {/* Card 2: Auditori (Lavender Clay) */}
              <div className="clay-card clay-lavender p-4 sm:p-5 flex items-center gap-3.5 transition-transform hover:scale-[1.01]">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-[#4B3B7A] flex items-center justify-center shadow-xs shrink-0">
                  <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#2D2152]">
                    Gaya Auditori
                  </h3>
                  <p className="text-mini sm:text-xs text-[#4B3B7A] font-bold mt-0.5">
                    Belajar lewat penjelasan lisan dan diskusi
                  </p>
                </div>
              </div>

              {/* Card 3: Kinestetik (Butter Clay) */}
              <div className="clay-card clay-butter p-4 sm:p-5 flex items-center gap-3.5 transition-transform hover:scale-[1.01]">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white text-[#785308] flex items-center justify-center shadow-xs shrink-0">
                  <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#4A3205]">
                    Gaya Kinestetik
                  </h3>
                  <p className="text-mini sm:text-xs text-[#785308] font-bold mt-0.5">
                    Belajar lewat praktik, gerak, dan mencoba langsung
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
              <p className="text-mini text-[#9195A8] font-semibold">
                Estimasi waktu pengerjaan: 2–3 menit (10 soal) • Hasil dapat dikalibrasi ulang kapan saja
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
                <span className="clay-pill clay-lavender text-mini font-extrabold text-[#4B3B7A] px-2.5 py-1 shadow-2xs shrink-0">
                  Soal {currentIndex + 1} dari {ASSESSMENT_QUESTIONS.length}
                </span>
                <span className="text-mini font-bold text-[#5A5E70] truncate">
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
              <div className="space-y-2.5" role="radiogroup" aria-label={`Pilihan Jawaban Soal ${currentIndex + 1}`}>
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        audioSynth.playClickSound();
                        setSelectedOption(idx);
                      }}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl transition-all flex items-center justify-between gap-3 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1C1E26] ${
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

            {saveError && (
              <p role="alert" className="text-xs font-bold text-[#852C28] bg-[#FCD9D7] rounded-xl px-3 py-2">
                {saveError} Tekan tombol di bawah untuk mencoba lagi.
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleNext()}
                disabled={selectedOption === null || isSaving}
                aria-label={
                  currentIndex < ASSESSMENT_QUESTIONS.length - 1
                    ? "Lanjut ke Soal Berikutnya"
                    : "Selesaikan dan Lihat Profil Kognitif AI"
                }
                className={`clay-btn flex-1 py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[#1C1E26] ${
                  selectedOption !== null && !isSaving
                    ? "clay-btn-dark text-white shadow-md active:scale-98 cursor-pointer"
                    : "bg-[#E4E2DD] text-[#9195A8] cursor-not-allowed"
                }`}
              >
                <span>
                  {isSaving
                    ? "Menyimpan profil…"
                    : currentIndex < ASSESSMENT_QUESTIONS.length - 1
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
              <span className="clay-pill clay-mint text-mini font-extrabold text-[#1D5E4D] px-3 py-1 inline-flex items-center gap-1.5 shadow-2xs">
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
                  <span className="text-mini font-bold text-[#9195A8] uppercase tracking-wider block">
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
