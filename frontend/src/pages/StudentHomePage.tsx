import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { audioSynth } from "@/services/audioSynth";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Eye,
  Headphones,
  FlaskConical,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Flame,
  Star,
  Check,
  Lock,
  Award,
  Play,
  Pause,
  Volume2,
  Calendar,
  Clock,
  BookOpen,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
} from "@/components/ui/icons";

export default function StudentHomePage() {
  const navigate = useNavigate();
  const {
    currentUser,
    switchUser,
    learningSchedules,
    addLearningSchedule,
    deleteLearningSchedule,
    toggleLearningSchedule,
  } = useApp();

  const [selectedDay, setSelectedDay] = useState<number>(4); // Default: Friday (Jum)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState<boolean>(false);

  // Ensure student persona is active if visited directly
  useEffect(() => {
    if (currentUser.role !== "SISWA") {
      switchUser("user_ayu_01");
    }
  }, [currentUser.role, switchUser]);

  const daysOfWeek = [
    { day: "Sen", date: "17", completed: true },
    { day: "Sel", date: "18", completed: true },
    { day: "Rab", date: "19", completed: true },
    { day: "Kam", date: "20", completed: true },
    { day: "Jum", date: "21", completed: false, isToday: true },
    { day: "Sab", date: "22", completed: false },
    { day: "Min", date: "23", completed: false },
  ];

  const style = currentUser.learningStyle || "VISUAL";

  // Configuration based on active student learning style
  const getStyleConfig = () => {
    switch (style) {
      case "AUDITORI":
        return {
          heroClass: "clay-card clay-lavender text-[#2D2152]",
          heroTitleColor: "text-[#1E143D]",
          heroSubColor: "text-[#4B3B7A]",
          heroBadgeBg: "bg-[#E3DBF8] text-[#4B3B7A]",
          heroIconBg: "bg-white/80 text-[#4B3B7A]",
          HeroIcon: Headphones,
          modalityLabel: "Auditori",
          btnColor: "text-[#3C2D68]",
        };
      case "KINESTETIK":
        return {
          heroClass: "clay-card clay-butter text-[#4A3205]",
          heroTitleColor: "text-[#2C1D02]",
          heroSubColor: "text-[#785308]",
          heroBadgeBg: "bg-[#FEE7B3] text-[#785308]",
          heroIconBg: "bg-white/80 text-[#785308]",
          HeroIcon: FlaskConical,
          modalityLabel: "Kinestetik",
          btnColor: "text-[#694503]",
        };
      case "VISUAL":
      default:
        return {
          heroClass: "clay-card clay-mint text-[#0E3D31]",
          heroTitleColor: "text-[#082921]",
          heroSubColor: "text-[#1D5E4D]",
          heroBadgeBg: "bg-[#D1EBE1] text-[#1D5E4D]",
          heroIconBg: "bg-white/80 text-[#1D5E4D]",
          HeroIcon: Eye,
          modalityLabel: "Visual",
          btnColor: "text-[#124B3D]",
        };
    }
  };

  const styleConfig = getStyleConfig();
  const HeroIconComponent = styleConfig.HeroIcon;

  // Audio Speech Synthesis Handler
  const handleToggleSpeak = () => {
    audioSynth.playClickSound();
    if ("speechSynthesis" in window) {
      if (isSpeakingSummary) {
        window.speechSynthesis.cancel();
        setIsSpeakingSummary(false);
      } else {
        const text =
          "Ringkasan Bab 3: Sistem pencernaan manusia memproses nutrisi secara mekanik dan kimiawi, dimulai dari mulut dengan bantuan enzim ptialin hingga lambung dan usus halus.";
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "id-ID";
        utterance.onend = () => setIsSpeakingSummary(false);
        utterance.onerror = () => setIsSpeakingSummary(false);
        setIsSpeakingSummary(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Filter schedules for current student
  const studentSchedules = learningSchedules.filter(
    (s) => s.studentId === currentUser.id
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] pb-32 overflow-x-hidden">
      <Navbar />

      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 sm:pt-5 flex flex-col gap-4 sm:gap-5">
        {/* 1. HERO LEARNING OVERVIEW (Adaptive Color per Modality) */}
        <section className={`${styleConfig.heroClass} p-5 sm:p-6 relative overflow-hidden`}>
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/70 text-[#1C1E26] text-[10px] font-extrabold uppercase tracking-wide">
                  Kelas 10-A
                </span>
                <span className={`px-2.5 py-0.5 rounded-full ${styleConfig.heroBadgeBg} text-[10px] font-extrabold`}>
                  Modalitas {styleConfig.modalityLabel}
                </span>
              </div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${styleConfig.heroTitleColor}`}>
                {currentUser.name}
              </h1>
              <p className={`text-xs ${styleConfig.heroSubColor} font-medium mt-0.5`}>
                Target: Bab 3 Sistem Pencernaan &amp; Enzim
              </p>
            </div>

            <div className={`w-10 h-10 rounded-2xl ${styleConfig.heroIconBg} flex items-center justify-center shrink-0 shadow-xs`}>
              <HeroIconComponent className="w-5 h-5" />
            </div>
          </div>

          {/* 3 Metrics Mini Grid (Streak, Akurasi DDA, XP Total) */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-black/10 relative z-10">
            <div className="bg-white/60 p-2.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-[#785308] font-black text-xs">
                <Flame className="w-3.5 h-3.5 fill-[#785308]" />
                <span>{currentUser.streakDays || 5} Hari</span>
              </div>
              <span className={`text-[10px] ${styleConfig.heroSubColor} font-bold block mt-0.5`}>Streak</span>
            </div>

            <div className="bg-white/60 p-2.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-[#1D5E4D] font-black text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>82%</span>
              </div>
              <span className={`text-[10px] ${styleConfig.heroSubColor} font-bold block mt-0.5`}>Akurasi DDA</span>
            </div>

            <div className="bg-white/60 p-2.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-[#21518A] font-black text-xs">
                <Star className="w-3.5 h-3.5 fill-[#21518A]" />
                <span>{currentUser.xpTotal || 450} XP</span>
              </div>
              <span className={`text-[10px] ${styleConfig.heroSubColor} font-bold block mt-0.5`}>Total XP</span>
            </div>
          </div>

          {/* Direct Continue Button */}
          <div className="mt-3.5 relative z-10">
            <button
              onClick={() => {
                audioSynth.playClickSound();
                navigate("/student/learn");
              }}
              className={`clay-btn clay-btn-white w-full py-2.5 px-4 text-xs font-black ${styleConfig.btnColor} flex items-center justify-center gap-1.5 shadow-xs`}
            >
              <span>Lanjutkan Eksplorasi Materi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 2. COMPACT WEEKLY TRACKER */}
        <section className="bg-white rounded-2xl p-3.5 border border-[rgba(28,30,38,0.06)] shadow-xs">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5A5E70]" />
              <span className="text-xs font-extrabold text-[#010105]">
                Agustus 2026 • Minggu 3
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#1D5E4D] bg-[#EBF6F2] px-2 py-0.5 rounded-full">
              2/3 Selesai
            </span>
          </div>

          {/* Slim 7-Day Row */}
          <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map((item, idx) => {
              const isSelected = selectedDay === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    audioSynth.playClickSound();
                    setSelectedDay(idx);
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1C1E26] text-white font-bold"
                      : item.completed
                      ? "bg-[#F2EFFC] text-[#4B3B7A] font-semibold"
                      : "bg-[#F8F9FD] text-[#9195A8] hover:bg-[#F2EFFC]"
                  }`}
                >
                  <span className="text-[9px] uppercase">{item.day}</span>
                  <span className="text-[11px] font-bold mt-0.5">{item.date}</span>
                  <div className="mt-0.5">
                    {item.completed ? (
                      <Check className="w-2.5 h-2.5 text-[#1D5E4D] stroke-[3]" />
                    ) : item.isToday ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1C1E26]"></div>
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-[#C7C6CB]"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. LEARNING SCHEDULE OVERVIEW (Concise & Clean) */}
        <section className="bg-white rounded-2xl p-4 border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#4B3B7A]" />
              <h2 className="text-xs sm:text-sm font-extrabold text-[#010105]">
                Agenda Belajar Terdekat
              </h2>
            </div>

            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EBF6F2] text-[#1D5E4D]">
              {studentSchedules.filter((s) => s.completed).length}/{studentSchedules.length} Selesai
            </span>
          </div>

          {/* 1 or 2 Next Items */}
          <div className="space-y-2">
            {studentSchedules.slice(0, 2).map((sch) => (
              <div
                key={sch.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                  sch.completed
                    ? "bg-[#F8F9FD] border-[rgba(28,30,38,0.05)] opacity-70"
                    : "bg-[#FCFBFE] border-[#E3DBF8]/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      toggleLearningSchedule(sch.id);
                    }}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      sch.completed
                        ? "bg-[#1D5E4D] text-white"
                        : "border-2 border-[#C7C6CB] hover:border-[#1D5E4D] bg-white"
                    }`}
                  >
                    {sch.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#E3DBF8] text-[#4B3B7A]">
                        {sch.day}
                      </span>
                      <span className="text-[10px] text-[#5A5E70] font-semibold flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {sch.time}
                      </span>
                    </div>
                    <p className={`text-xs font-bold truncate mt-0.5 ${sch.completed ? "line-through text-[#9195A8]" : "text-[#010105]"}`}>
                      {sch.title}
                    </p>
                  </div>
                </div>

                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D] shrink-0 hidden sm:inline-block">
                  {sch.format}
                </span>
              </div>
            ))}
          </div>

          {/* Button to Full Schedule Page */}
          <button
            onClick={() => {
              audioSynth.playClickSound();
              navigate("/student/schedule");
            }}
            className="clay-btn clay-btn-white w-full py-2 px-3 rounded-xl text-xs font-bold text-[#4B3B7A] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer border border-[#E3DBF8]/60"
          >
            <span>Buka Kalender &amp; Kelola Jadwal Penuh</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        </section>

        {/* 4. EXPLORE STATUS & ANALYTICS OVERVIEW CARD */}
        <section className="clay-card clay-sky p-4 sm:p-5 text-[#153A66] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/80 text-[#21518A]">
                  Laporan &amp; Analitik
                </span>
                <span className="text-[10px] font-bold text-[#1D5E4D] bg-[#D1EBE1] px-2 py-0.5 rounded-full">
                  Level 2 Aktif
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-[#102C4C]">
                Status Jalur Belajar &amp; Penguasaan
              </h3>
              <p className="text-[11px] text-[#21518A] font-medium mt-0.5">
                Rekap penguasaan kompetensi kognitif siswa &amp; analitik mingguan.
              </p>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-white/80 text-[#21518A] flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#21518A]/15 text-center text-xs">
            <div className="bg-white/70 p-2.5 rounded-xl">
              <span className="text-sm font-black text-[#102C4C] block">
                200 Score
              </span>
              <span className="text-[10px] text-[#21518A] font-semibold">
                Skor Kompetensi
              </span>
            </div>

            <div className="bg-white/70 p-2.5 rounded-xl">
              <span className="text-sm font-black text-[#102C4C] block">
                12 Selesai
              </span>
              <span className="text-[10px] text-[#21518A] font-semibold">
                Capaian Modul
              </span>
            </div>
          </div>

          {/* Shortcut Button to Full Status Page */}
          <button
            onClick={() => {
              audioSynth.playClickSound();
              navigate("/student/status");
            }}
            className="clay-btn clay-btn-white w-full py-2.5 px-3 rounded-xl text-xs font-black text-[#21518A] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer hover:bg-white"
          >
            <span>Buka Laporan Status &amp; Analitik Lengkap</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </section>

        {/* 5. MODALITY-SPECIFIC CONTENT (Conditional Content exclusively per style) */}
        {style === "VISUAL" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#1D5E4D]" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#010105]">
                  Rencana Belajar Visual Hari Ini
                </h2>
              </div>
              <Link
                to="/student/learn"
                className="text-[11px] font-bold text-[#1D5E4D] hover:underline"
              >
                Buka Materi
              </Link>
            </div>

            {/* Visual Card 1: Diagram Organ */}
            <div
              onClick={() => {
                audioSynth.playClickSound();
                navigate("/student/learn");
              }}
              className="clay-card clay-card-hover p-4 flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="clay-card clay-mint w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5 text-[#124B3D]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D]">
                      Diagram Anatomi
                    </span>
                    <span className="text-[10px] text-[#9195A8] font-semibold flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> 20 mnt
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105] group-hover:text-[#1D5E4D] transition-colors mt-0.5">
                    Bab 3: Fisiologi Sistem Pencernaan
                  </h3>
                  <p className="text-[11px] text-[#5A5E70] font-medium">
                    Diagram interaktif organ saluran cerna &amp; vili ileum.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-extrabold text-[#1D5E4D] bg-[#EBF6F2] px-2.5 py-1 rounded-full hidden sm:inline-block">
                  65% Selesai
                </span>
                <div className="w-8 h-8 rounded-full bg-[#F4F6FA] group-hover:bg-[#D1EBE1] flex items-center justify-center text-[#010105] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Visual Card 2: Infografis Enzim */}
            <div
              onClick={() => {
                audioSynth.playClickSound();
                navigate("/student/learn");
              }}
              className="clay-card clay-card-hover p-4 flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="clay-card clay-mint w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[#124B3D]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D]">
                      Infografis Reaksi
                    </span>
                    <span className="text-[10px] text-[#9195A8] font-semibold flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> 10 mnt
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105] group-hover:text-[#1D5E4D] transition-colors mt-0.5">
                    Peta Visual Reaksi Enzimatis
                  </h3>
                  <p className="text-[11px] text-[#5A5E70] font-medium">
                    Bagan peruraian amilum, pepsin lambung, &amp; lipase.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#F4F6FA] group-hover:bg-[#D1EBE1] flex items-center justify-center text-[#010105] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Visual DDA Quiz Banner */}
            <div
              onClick={() => {
                audioSynth.playClickSound();
                navigate("/quiz");
              }}
              className="clay-card clay-card-hover p-4 flex items-center justify-between gap-3 cursor-pointer group bg-gradient-to-r from-white to-[#FFF9EE]"
            >
              <div className="flex items-center gap-3.5">
                <div className="clay-card clay-butter w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#694503]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FEE7B3] text-[#785308]">
                      Kuis DDA Visual
                    </span>
                    <span className="text-[10px] text-[#785308] font-bold">
                      +50 XP Capaian
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105] group-hover:text-[#785308] transition-colors mt-0.5">
                    Evaluasi Adaptif Diagram Bab 3
                  </h3>
                  <p className="text-[11px] text-[#5A5E70] font-medium">
                    4 Soal pemahaman bagan dengan penyesuaian tingkat dinamis.
                  </p>
                </div>
              </div>

              <button className="clay-btn clay-btn-dark px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                Mulai
              </button>
            </div>
          </section>
        )}

        {style === "AUDITORI" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-[#4B3B7A]" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#010105]">
                  Audio Studio &amp; Podcast Belajar
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#4B3B7A] bg-[#E3DBF8] px-2 py-0.5 rounded-full">
                3 Episode Siap
              </span>
            </div>

            {/* Now Playing Podcast Widget */}
            <div className="clay-card clay-lavender p-4 sm:p-5 text-[#2D2152] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B3B7A]/80 block">
                    Now Playing • Podcast Ep. 1
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-[#1E143D] mt-0.5">
                    Petualangan Menembus Saluran Cerna
                  </h3>
                  <p className="text-[11px] text-[#4B3B7A] font-medium">
                    Narasi peran mekanik rongga mulut &amp; enzim ptialin.
                  </p>
                </div>

                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    setIsPlayingAudio(!isPlayingAudio);
                  }}
                  className="clay-btn clay-btn-white w-11 h-11 rounded-full flex items-center justify-center text-[#4B3B7A] shrink-0 shadow-xs cursor-pointer"
                  title={isPlayingAudio ? "Jeda" : "Putar"}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* Audio Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#4B3B7A] h-full rounded-full transition-all duration-300"
                    style={{ width: isPlayingAudio ? "65%" : "35%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#4B3B7A] font-bold">
                  <span>{isPlayingAudio ? "03:28" : "01:54"}</span>
                  <span>05:24</span>
                </div>
              </div>

              {/* Text to Speech Trigger */}
              <div className="pt-2 border-t border-[#4B3B7A]/15 flex items-center justify-between gap-2">
                <button
                  onClick={handleToggleSpeak}
                  className="clay-btn clay-btn-white py-1.5 px-3 text-[11px] font-bold text-[#4B3B7A] flex items-center gap-1.5 shadow-2xs"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeakingSummary ? "Hentikan Suara" : "Bacakan Ringkasan Teks"}</span>
                </button>

                <Link
                  to="/student/learn"
                  className="text-[11px] font-bold text-[#4B3B7A] hover:underline flex items-center gap-1"
                >
                  <span>Buka Player Penuh</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Audio DDA Quiz Banner */}
            <div
              onClick={() => {
                audioSynth.playClickSound();
                navigate("/quiz");
              }}
              className="clay-card clay-card-hover p-4 flex items-center justify-between gap-3 cursor-pointer group bg-gradient-to-r from-white to-[#FFF9EE]"
            >
              <div className="flex items-center gap-3.5">
                <div className="clay-card clay-butter w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#694503]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FEE7B3] text-[#785308]">
                      Kuis DDA Audio
                    </span>
                    <span className="text-[10px] text-[#785308] font-bold">
                      +50 XP Capaian
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105] group-hover:text-[#785308] transition-colors mt-0.5">
                    Evaluasi Adaptif Berbasis Podcast
                  </h3>
                  <p className="text-[11px] text-[#5A5E70] font-medium">
                    Uji pemahaman narasi audio yang telah didengarkan.
                  </p>
                </div>
              </div>

              <button className="clay-btn clay-btn-dark px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                Mulai
              </button>
            </div>
          </section>
        )}

        {style === "KINESTETIK" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-[#785308]" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#010105]">
                  Lab Virtual &amp; Misi Praktik
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#785308] bg-[#FEE7B3] px-2 py-0.5 rounded-full">
                Hands-on Active
              </span>
            </div>

            {/* Active Challenge Card */}
            <div className="clay-card clay-butter p-4 sm:p-5 text-[#4A3205] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#785308]/80 block">
                    Tantangan Simulasi Interaktif
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-[#2C1D02] mt-0.5">
                    Pasangkan Enzim ke Organ yang Tepat
                  </h3>
                  <p className="text-[11px] text-[#785308] font-medium">
                    Drag-and-drop molekul ptialin, pepsin, dan lipase ke zona organ.
                  </p>
                </div>

                <div className="clay-card clay-white w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
                  <FlaskConical className="w-5 h-5 text-[#785308]" />
                </div>
              </div>

              <div className="pt-2 border-t border-[#785308]/15 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    navigate("/student/learn");
                  }}
                  className="clay-btn clay-btn-dark py-2 px-4 text-xs font-black w-full flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Lanjutkan Lab Interaktif</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Kinesthetic DDA Quiz Banner */}
            <div
              onClick={() => {
                audioSynth.playClickSound();
                navigate("/quiz");
              }}
              className="clay-card clay-card-hover p-4 flex items-center justify-between gap-3 cursor-pointer group bg-gradient-to-r from-white to-[#FFF9EE]"
            >
              <div className="flex items-center gap-3.5">
                <div className="clay-card clay-butter w-11 h-11 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#694503]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FEE7B3] text-[#785308]">
                      Kuis DDA Praktik
                    </span>
                    <span className="text-[10px] text-[#785308] font-bold">
                      +50 XP Capaian
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105] group-hover:text-[#785308] transition-colors mt-0.5">
                    Evaluasi Adaptif Studi Kasus Lab
                  </h3>
                  <p className="text-[11px] text-[#5A5E70] font-medium">
                    Soal pemecahan masalah berdasarkan hasil simulasi organ.
                  </p>
                </div>
              </div>

              <button className="clay-btn clay-btn-dark px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                Mulai
              </button>
            </div>
          </section>
        )}

        {/* 6. LEARNING PATHWAY (Stepping Stones 3D Map) */}
        <section className="clay-card p-5 sm:p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9195A8] block">
                Peta Kompetensi Kurikulum
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-[#010105]">
                Jalur Petualangan Belajar
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#D1EBE1] text-[#1D5E4D] text-[10px] font-extrabold">
              Level 2 Aktif
            </span>
          </div>

          {/* Stepping Stones Vertical Journey */}
          <div className="py-2 flex flex-col items-center gap-4 relative">
            {/* Step 1 - Completed */}
            <div className="flex items-center gap-4 w-full max-w-xs justify-start">
              <div
                onClick={() => {
                  audioSynth.playSuccessSound();
                  navigate("/student/learn");
                }}
                className="clay-stone-node clay-mint shrink-0 cursor-pointer"
                title="Bab 3.1: Pengenalan Organ (Selesai)"
              >
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-[#1D5E4D] uppercase block">
                  Langkah 1 • Selesai
                </span>
                <p className="text-xs font-extrabold text-[#010105]">
                  Organ &amp; Rongga Mulut
                </p>
              </div>
            </div>

            {/* Step 2 - Current Active (Pulsing) */}
            <div className="flex items-center gap-4 w-full max-w-xs justify-end">
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#4B3B7A] uppercase block">
                  Langkah 2 • Sedang Berjalan
                </span>
                <p className="text-xs font-extrabold text-[#010105]">
                  Ventrikulus &amp; Enzim Pepsin
                </p>
              </div>
              <div
                onClick={() => {
                  audioSynth.playLevelUpSound();
                  navigate("/quiz");
                }}
                className="clay-stone-node clay-lavender shrink-0 ring-4 ring-[#E3DBF8] ring-offset-2 animate-soft-pulse cursor-pointer"
                title="Bab 3.2: Reaksi Enzimatis Lambung (Tantangan Aktif)"
              >
                <Sparkles className="w-7 h-7" />
              </div>
            </div>

            {/* Step 3 - Locked */}
            <div className="flex items-center gap-4 w-full max-w-xs justify-start opacity-60">
              <div className="clay-stone-node bg-[#E4E2DD] text-[#5A5E70] border border-[rgba(28,30,38,0.1)] shrink-0 cursor-not-allowed">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-[#9195A8] uppercase block">
                  Langkah 3 • Terkunci
                </span>
                <p className="text-xs font-bold text-[#5A5E70]">
                  Usus Halus &amp; Penyerapan Vili
                </p>
              </div>
            </div>

            {/* Boss Challenge: Final Evaluation */}
            <div className="flex items-center gap-4 w-full max-w-xs justify-center pt-2">
              <div
                onClick={() => {
                  audioSynth.playClickSound();
                  navigate("/quiz");
                }}
                className="clay-card clay-dark p-3.5 rounded-3xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-transform border border-white/20 w-full"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[#FEE7B3]" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-extrabold text-[#FEE7B3] uppercase block">
                    Target Akhir Bab 3
                  </span>
                  <p className="text-xs font-bold text-white">
                    Evaluasi Akhir &amp; Penguasaan Materi
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/60 ml-auto" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
