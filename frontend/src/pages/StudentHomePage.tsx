import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { audioSynth } from "@/services/audioSynth";
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
  Layers,
} from "@/components/ui/icons";

import StudentSidebar from "@/components/layout/StudentSidebar";

export default function StudentHomePage() {
  const navigate = useNavigate();
  const {
    currentUser,
    switchUser,
    learningSchedules,
    toggleLearningSchedule,
  } = useApp();

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(4); // Default: Friday (Jum)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState<boolean>(false);

  // Ensure student persona is active if visited directly
  useEffect(() => {
    if (currentUser.role !== "SISWA") {
      switchUser("user_ayu_01");
    }
  }, [currentUser.role, switchUser]);

  const daysOfWeek = [
    { day: "Sen", fullDay: "Senin", date: "17", completed: true },
    { day: "Sel", fullDay: "Selasa", date: "18", completed: true },
    { day: "Rab", fullDay: "Rabu", date: "19", completed: true },
    { day: "Kam", fullDay: "Kamis", date: "20", completed: true },
    { day: "Jum", fullDay: "Jumat", date: "21", completed: false, isToday: true },
    { day: "Sab", fullDay: "Sabtu", date: "22", completed: false },
    { day: "Min", fullDay: "Minggu", date: "23", completed: false },
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
          heroBadgeBg: "clay-pill clay-white text-[#4B3B7A]",
          heroIconBg: "clay-pill clay-white text-[#4B3B7A]",
          HeroIcon: Headphones,
          modalityLabel: "Auditori",
          btnColor: "text-[#3C2D68]",
        };
      case "KINESTETIK":
        return {
          heroClass: "clay-card clay-butter text-[#4A3205]",
          heroTitleColor: "text-[#2C1D02]",
          heroSubColor: "text-[#785308]",
          heroBadgeBg: "clay-pill clay-white text-[#785308]",
          heroIconBg: "clay-pill clay-white text-[#785308]",
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
          heroBadgeBg: "clay-pill clay-white text-[#1D5E4D]",
          heroIconBg: "clay-pill clay-white text-[#1D5E4D]",
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

  // Student's schedules
  const studentSchedules = learningSchedules.filter(
    (s) => s.studentId === currentUser.id
  );

  const selectedDayObj = daysOfWeek[selectedDayIdx];
  const activeDaySchedule = studentSchedules.find(
    (s) => s.day === selectedDayObj.fullDay
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col pb-24 md:pb-8 overflow-x-hidden">
      <Navbar />

      <div className="flex flex-1">
        {/* Desktop Student Sidebar */}
        <StudentSidebar />

        {/* Responsive auto-fit main stream */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            {/* LEFT MAIN STREAM (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
            {/* 1. HERO LEARNING OVERVIEW (Clay Tactile) */}
            <section className={`${styleConfig.heroClass} p-5 sm:p-6 relative overflow-hidden`}>
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="clay-pill clay-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1C1E26]">
                      Kelas 10-A
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold ${styleConfig.heroBadgeBg}`}>
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

                <div className={`w-11 h-11 ${styleConfig.heroIconBg} flex items-center justify-center shrink-0`}>
                  <HeroIconComponent className="w-6 h-6" />
                </div>
              </div>

              {/* 3 Metrics Mini Grid in Clay Pills */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-black/10 relative z-10">
                <div className="clay-pill clay-white p-2.5 text-center flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1 text-[#785308] font-black text-xs">
                    <Flame className="w-3.5 h-3.5 fill-[#785308]" />
                    <span>{currentUser.streakDays || 14} Hari</span>
                  </div>
                  <span className={`text-[9px] ${styleConfig.heroSubColor} font-bold block mt-0.5`}>Streak</span>
                </div>

                <div className="clay-pill clay-white p-2.5 text-center flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1 text-[#1D5E4D] font-black text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>82%</span>
                  </div>
                  <span className={`text-[9px] ${styleConfig.heroSubColor} font-bold block mt-0.5`}>Akurasi DDA</span>
                </div>

                <div className="clay-pill clay-white p-2.5 text-center flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1 text-[#21518A] font-black text-xs">
                    <Star className="w-3.5 h-3.5 fill-[#21518A]" />
                    <span>{currentUser.xpTotal || 450} XP</span>
                  </div>
                  <span className={`text-[9px] ${styleConfig.heroSubColor} font-bold block mt-0.5`}>Total XP</span>
                </div>
              </div>

              {/* Direct Continue Button */}
              <div className="mt-3.5 relative z-10">
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    navigate("/student/learn");
                  }}
                  className={`clay-btn clay-btn-white w-full py-2.5 px-4 text-xs font-black ${styleConfig.btnColor} flex items-center justify-center gap-1.5 cursor-pointer`}
                >
                  <span>Lanjutkan Eksplorasi Materi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* 2. UNIFIED WEEKLY SCHEDULE & TARGET HUB (Claymorphic) */}
            <section className="clay-card clay-white p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="clay-card clay-lavender w-8 h-8 rounded-xl flex items-center justify-center text-[#4B3B7A] shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-black text-[#010105] truncate">
                      Pekan Belajar &amp; Komitmen Mandiri
                    </h2>
                    <span className="text-[10px] text-[#5A5E70] block">
                      Agustus 2026 • Minggu 3
                    </span>
                  </div>
                </div>

                <Link
                  to="/student/schedule"
                  onClick={() => audioSynth.playClickSound()}
                  className="clay-pill clay-lavender text-[10px] font-extrabold text-[#4B3B7A] px-3 py-1.5 flex items-center gap-1 transition-transform hover:scale-105 shrink-0 whitespace-nowrap"
                >
                  <span>Kelola Penuh</span>
                  <ChevronRight className="w-3 h-3 shrink-0" />
                </Link>
              </div>

              {/* 7-Day Clay Selector */}
              <div className="grid grid-cols-7 gap-1">
                {daysOfWeek.map((item, idx) => {
                  const isSelected = selectedDayIdx === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        audioSynth.playClickSound();
                        setSelectedDayIdx(idx);
                      }}
                      className={`flex flex-col items-center justify-center py-2 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? "clay-btn clay-btn-dark text-white font-bold scale-105"
                          : item.completed
                          ? "clay-pill clay-mint text-[#1D5E4D] font-semibold"
                          : "clay-pill bg-[#F8F9FD] text-[#9195A8] hover:bg-[#F2EFFC]"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider">{item.day}</span>
                      <span className="text-xs font-black mt-0.5">{item.date}</span>
                      <div className="mt-1">
                        {item.completed ? (
                          <Check className="w-2.5 h-2.5 text-[#1D5E4D] stroke-[3]" />
                        ) : item.isToday ? (
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#D1EBE1]" : "bg-[#1C1E26]"}`}></div>
                        ) : (
                          <div className="w-1 h-1 rounded-full bg-[#C7C6CB]"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Selected Day Mission in Clay Card */}
              <div className="clay-card p-3.5 bg-[#FCFBFE] border border-[#E3DBF8]/70 flex items-center justify-between gap-3">
                {activeDaySchedule ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => {
                        audioSynth.playClickSound();
                        toggleLearningSchedule(activeDaySchedule.id);
                      }}
                      className={`clay-checkbox shrink-0 ${
                        activeDaySchedule.completed ? "clay-checkbox-checked" : ""
                      }`}
                      title={activeDaySchedule.completed ? "Tandai Belum Selesai" : "Tandai Selesai"}
                    >
                      {activeDaySchedule.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="clay-pill clay-lavender text-[9px] font-extrabold px-2 py-0.2 text-[#4B3B7A]">
                          {activeDaySchedule.day} • {activeDaySchedule.time}
                        </span>
                        <span className="clay-pill clay-mint text-[9px] font-bold px-2 py-0.2 text-[#1D5E4D]">
                          {activeDaySchedule.format}
                        </span>
                      </div>
                      <h4 className={`text-xs font-bold truncate ${activeDaySchedule.completed ? "line-through text-[#9195A8]" : "text-[#010105]"}`}>
                        {activeDaySchedule.title}
                      </h4>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-xs">
                      <span className="font-bold text-[#010105] block">
                        {selectedDayObj.fullDay}, {selectedDayObj.date} Agustus
                      </span>
                      <span className="text-[10px] text-[#9195A8]">
                        Belajar mandiri fleksibel (Eksplorasi modul bebas)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        audioSynth.playClickSound();
                        navigate("/student/schedule");
                      }}
                      className="clay-btn clay-btn-white px-3 py-1 text-[#4B3B7A] text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Atur</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 3. MODALITY-SPECIFIC CONTENT (Tactile Clay Cards) */}
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
                    Buka Semua
                  </Link>
                </div>

                {/* Featured Visual Card: Diagram Organ */}
                <div
                  onClick={() => {
                    audioSynth.playClickSound();
                    navigate("/student/learn");
                  }}
                  className="clay-card clay-card-hover p-4 flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="clay-card clay-mint w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Eye className="w-6 h-6 text-[#124B3D]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="clay-pill clay-mint text-[10px] font-extrabold px-2 py-0.5 text-[#1D5E4D]">
                          Diagram Interaktif
                        </span>
                        <span className="text-[10px] text-[#9195A8] font-semibold flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> 20 mnt
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-[#010105] group-hover:text-[#1D5E4D] transition-colors mt-0.5">
                        Bab 3: Fisiologi Sistem Pencernaan
                      </h3>
                      <p className="text-[11px] text-[#5A5E70] font-medium">
                        Diagram anatomi saluran cerna &amp; struktur vili ileum.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="clay-pill clay-mint text-[10px] font-extrabold text-[#1D5E4D] px-2.5 py-1 hidden sm:inline-block">
                      65% Selesai
                    </span>
                    <div className="clay-btn clay-btn-white w-8 h-8 rounded-full flex items-center justify-center text-[#010105]">
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
                    <div className="clay-card clay-sky w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Layers className="w-6 h-6 text-[#21518A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="clay-pill clay-sky text-[10px] font-extrabold px-2 py-0.5 text-[#21518A]">
                          Peta Infografis
                        </span>
                        <span className="text-[10px] text-[#9195A8] font-semibold flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> 10 mnt
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-[#010105] group-hover:text-[#21518A] transition-colors mt-0.5">
                        Bagan Alur Reaksi Enzimatis
                      </h3>
                      <p className="text-[11px] text-[#5A5E70] font-medium">
                        Infografis peruraian amilum, pepsin, dan lipase.
                      </p>
                    </div>
                  </div>

                  <div className="clay-btn clay-btn-white w-8 h-8 rounded-full flex items-center justify-center text-[#010105] shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Visual DDA Quiz Banner */}
                <div
                  onClick={() => {
                    audioSynth.playClickSound();
                    navigate("/quiz");
                  }}
                  className="clay-card clay-card-hover clay-butter p-4 flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="clay-card clay-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-[#694503]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="clay-pill clay-white text-[10px] font-extrabold px-2 py-0.5 text-[#785308]">
                          Kuis DDA Visual
                        </span>
                        <span className="text-[10px] text-[#785308] font-bold">
                          +50 XP Capaian
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-[#4A3205] mt-0.5">
                        Evaluasi Adaptif Diagram Bab 3
                      </h3>
                      <p className="text-[11px] text-[#785308] font-medium">
                        4 Soal pemahaman bagan dengan penyesuaian dinamis.
                      </p>
                    </div>
                  </div>

                  <button className="clay-btn clay-btn-dark px-4 py-2 rounded-xl text-xs font-black shrink-0">
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
                  <span className="clay-pill clay-lavender text-[11px] font-bold text-[#4B3B7A] px-2.5 py-0.5">
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
                      className="clay-btn clay-btn-white w-12 h-12 rounded-full flex items-center justify-center text-[#4B3B7A] shrink-0 cursor-pointer"
                      title={isPlayingAudio ? "Jeda" : "Putar"}
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Audio Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-white/70 h-2.5 rounded-full overflow-hidden shadow-inner">
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
                      className="clay-btn clay-btn-white py-1.5 px-3 text-[11px] font-bold text-[#4B3B7A] flex items-center gap-1.5 cursor-pointer"
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
                  className="clay-card clay-card-hover clay-butter p-4 flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="clay-card clay-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-[#694503]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="clay-pill clay-white text-[10px] font-extrabold px-2 py-0.5 text-[#785308]">
                          Kuis DDA Audio
                        </span>
                        <span className="text-[10px] text-[#785308] font-bold">
                          +50 XP Capaian
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-[#4A3205] mt-0.5">
                        Evaluasi Adaptif Berbasis Podcast
                      </h3>
                      <p className="text-[11px] text-[#785308] font-medium">
                        Uji pemahaman narasi audio yang telah didengarkan.
                      </p>
                    </div>
                  </div>

                  <button className="clay-btn clay-btn-dark px-4 py-2 rounded-xl text-xs font-black shrink-0">
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
                  <span className="clay-pill clay-butter text-[11px] font-bold text-[#785308] px-2.5 py-0.5">
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

                    <div className="clay-card clay-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <FlaskConical className="w-6 h-6 text-[#785308]" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#785308]/15 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        audioSynth.playClickSound();
                        navigate("/student/learn");
                      }}
                      className="clay-btn clay-btn-dark py-2.5 px-4 text-xs font-black w-full flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="clay-card clay-card-hover clay-butter p-4 flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="clay-card clay-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-[#694503]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="clay-pill clay-white text-[10px] font-extrabold px-2 py-0.5 text-[#785308]">
                          Kuis DDA Praktik
                        </span>
                        <span className="text-[10px] text-[#785308] font-bold">
                          +50 XP Capaian
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-[#4A3205] mt-0.5">
                        Evaluasi Adaptif Studi Kasus Lab
                      </h3>
                      <p className="text-[11px] text-[#785308] font-medium">
                        Soal pemecahan masalah berdasarkan hasil simulasi organ.
                      </p>
                    </div>
                  </div>

                  <button className="clay-btn clay-btn-dark px-4 py-2 rounded-xl text-xs font-black shrink-0">
                    Mulai
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR STREAM (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
            {/* 4. CREATIVE ANALYTICS & DIAGRAM CENTERPIECE */}
            <section className="clay-card clay-sky p-5 sm:p-6 text-[#153A66] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="clay-pill clay-white text-[10px] font-extrabold px-2.5 py-0.5 text-[#21518A]">
                      Analitik Kognitif DDA
                    </span>
                    <span className="clay-pill clay-mint text-[10px] font-bold text-[#1D5E4D] px-2.5 py-0.5">
                      Level 2 Aktif
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#102C4C]">
                    Status Jalur Belajar &amp; Penguasaan
                  </h3>
                  <p className="text-[11px] text-[#21518A] font-medium mt-0.5">
                    Pemetaan kapasitas kompetensi adaptif berbasis generative AI.
                  </p>
                </div>

                <div className="clay-pill clay-white w-11 h-11 text-[#21518A] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* DIAGRAM VISUALIZATION (Clay Embedded) */}
              {style === "VISUAL" && (
                <div className="clay-card clay-white p-4 text-[#1C1E26] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#102C4C] flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#1D5E4D]" />
                      Distribusi Pemahaman Visual
                    </span>
                    <span className="clay-pill clay-mint text-[10px] font-extrabold text-[#1D5E4D] px-2 py-0.5">
                      92% Retensi
                    </span>
                  </div>

                  {/* Graphical Visual Bars with Clay Insets */}
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-[#102C4C] mb-1">
                        <span>Bagan Anatomi Saluran Cerna</span>
                        <span className="text-[#1D5E4D]">94%</span>
                      </div>
                      <div className="w-full bg-[#EBF6F2] h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-[#1D5E4D] h-full rounded-full w-[94%] transition-all duration-500"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-[#102C4C] mb-1">
                        <span>Peta Konsep Reaksi Enzim</span>
                        <span className="text-[#21518A]">88%</span>
                      </div>
                      <div className="w-full bg-[#EBF6F2] h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-[#21518A] h-full rounded-full w-[88%] transition-all duration-500"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-[#102C4C] mb-1">
                        <span>Diagram Vili Usus Halus</span>
                        <span className="text-[#4B3B7A]">76%</span>
                      </div>
                      <div className="w-full bg-[#EBF6F2] h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-[#4B3B7A] h-full rounded-full w-[76%] transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>

                  {/* 2 Micro KPI Chips in Clay Pills */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 text-center text-xs">
                    <div className="clay-pill bg-[#F8F9FD] p-2">
                      <span className="text-sm font-black text-[#102C4C] block">200 Score</span>
                      <span className="text-[9px] text-[#21518A] font-bold">Skor DDA</span>
                    </div>
                    <div className="clay-pill bg-[#F8F9FD] p-2">
                      <span className="text-sm font-black text-[#102C4C] block">12 Tuntas</span>
                      <span className="text-[9px] text-[#21518A] font-bold">Kompetensi</span>
                    </div>
                  </div>
                </div>
              )}

              {style === "AUDITORI" && (
                <div className="clay-card clay-white p-4 text-[#1C1E26] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#102C4C] flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-[#4B3B7A]" />
                      Spektrum Frekuensi &amp; Retensi Audio
                    </span>
                    <span className="clay-pill clay-lavender text-[10px] font-extrabold text-[#4B3B7A] px-2 py-0.5">
                      48.5 Mnt Dengar
                    </span>
                  </div>

                  {/* Animated Waveform Visualizer */}
                  <div className="clay-card clay-dark p-3 rounded-xl flex items-end justify-between gap-1 h-12">
                    {[35, 60, 80, 95, 65, 45, 85, 90, 70, 50, 75, 90, 60, 80, 95, 70, 55, 40, 65, 80].map((val, i) => (
                      <div
                        key={i}
                        className="w-full bg-[#E3DBF8] rounded-t-sm"
                        style={{ height: `${val}%` }}
                      ></div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs">
                    <div className="clay-pill bg-[#F8F9FD] p-2">
                      <span className="text-sm font-black text-[#4B3B7A] block">91% Recall</span>
                      <span className="text-[9px] text-[#5A5E70] font-bold">Retensi Podcast</span>
                    </div>
                    <div className="clay-pill bg-[#F8F9FD] p-2">
                      <span className="text-sm font-black text-[#1D5E4D] block">3 Episode</span>
                      <span className="text-[9px] text-[#5A5E70] font-bold">Audio Selesai</span>
                    </div>
                  </div>
                </div>
              )}

              {style === "KINESTETIK" && (
                <div className="clay-card clay-white p-4 text-[#1C1E26] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#102C4C] flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-[#785308]" />
                      Akurasi Lab &amp; Presisi Simulasi
                    </span>
                    <span className="clay-pill clay-butter text-[10px] font-extrabold text-[#785308] px-2 py-0.5">
                      95% Akurat
                    </span>
                  </div>

                  {/* Progress Radial Meter */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-[#102C4C] mb-1">
                        <span>Pasang Molekul Enzim</span>
                        <span className="text-[#785308]">95% (Tinggi)</span>
                      </div>
                      <div className="w-full bg-[#FFF6DF] h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-[#785308] h-full rounded-full w-[95%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-[#102C4C] mb-1">
                        <span>Studi Kasus Lab Mandiri</span>
                        <span className="text-[#785308]">86% (Mandiri)</span>
                      </div>
                      <div className="w-full bg-[#FFF6DF] h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-[#785308] h-full rounded-full w-[86%]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs">
                    <div className="clay-pill bg-[#F8F9FD] p-2">
                      <span className="text-sm font-black text-[#785308] block">3.4 Mnt</span>
                      <span className="text-[9px] text-[#5A5E70] font-bold">Waktu Misi</span>
                    </div>
                    <div className="clay-pill bg-[#F8F9FD] p-2">
                      <span className="text-sm font-black text-[#1D5E4D] block">96% Indeks</span>
                      <span className="text-[9px] text-[#5A5E70] font-bold">Interaktif</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Link to Full Analytics */}
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  navigate("/student/status");
                }}
                className="clay-btn clay-btn-white w-full py-2.5 px-4 rounded-2xl text-xs font-black text-[#21518A] flex items-center justify-between cursor-pointer"
              >
                <span>Buka Laporan Status &amp; Analitik Lengkap</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </section>

            {/* 5. LEARNING PATHWAY (Stepping Stones 3D Map) */}
            <section className="clay-card clay-white p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9195A8] block">
                    Peta Kompetensi Kurikulum
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-[#010105]">
                    Jalur Petualangan Belajar
                  </h2>
                </div>
                <span className="clay-pill clay-mint px-3 py-1 text-[#1D5E4D] text-[10px] font-extrabold">
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
                    className="clay-card clay-dark p-4 rounded-3xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-transform border border-white/20 w-full"
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
          </div>
        </div>
      </main>
    </div>

    <BottomNav />
  </div>
  );
}
