import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import { ApiService } from "@/services/apiClient";
import type { LearningStyleAnalytics } from "@/types";
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
  School,
  Bot,
} from "@/components/ui/icons";

export default function StudentHomePage() {
  const navigate = useNavigate();
  const {
    currentUser,
    learningSchedules,
    toggleLearningSchedule,
    tasks,
    documents,
    submissions,
    classrooms,
    credentials,
    trackLearningActivity,
  } = useApp();

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState<boolean>(false);
  const [styleData, setStyleData] = useState<LearningStyleAnalytics | null>(null);

  const style = currentUser?.learningStyle || "VISUAL";
  const userGrade = currentUser?.grade ? `Kelas ${currentUser.grade}` : "Kelas 10";

  // Dynamic backend synchronization for style analytics
  const fetchStyleAnalytics = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await ApiService.getStyleAnalytics(currentUser.id);
      if (res) {
        setStyleData({
          studentId: res.student_id,
          learningStyle: res.learning_style,
          currentDDALevel: res.current_dda_level,
          xpTotal: res.xp_total,
          accuracyAvgPct: res.accuracy_avg_pct,
          visualParams: {
            spatialRetentionPct: res.visual_params.spatial_retention_pct,
            scanSpeedSecPerNode: res.visual_params.scan_speed_sec_per_node,
            infographicAccuracyPct: res.visual_params.infographic_accuracy_pct,
            mindmapExploredCount: res.visual_params.mindmap_explored_count,
            mindmapTotalCount: res.visual_params.mindmap_total_count,
            visualProgressPct: res.visual_params.visual_progress_pct,
            statusLabel: res.visual_params.status_label,
          },
          auditoryParams: {
            totalListeningMinutes: res.auditory_params.total_listening_minutes,
            targetListeningMinutes: res.auditory_params.target_listening_minutes,
            verbalRetentionPct: res.auditory_params.verbal_retention_pct,
            focusStabilityPct: res.auditory_params.focus_stability_pct,
            idealPlaybackSpeed: res.auditory_params.ideal_playback_speed,
            sessionsCompleted: res.auditory_params.sessions_completed,
            audioProgressPct: res.auditory_params.audio_progress_pct,
            statusLabel: res.auditory_params.status_label,
          },
          kinestheticParams: {
            labAccuracyPct: res.kinesthetic_params.lab_accuracy_pct,
            trialErrorIterations: res.kinesthetic_params.trial_error_iterations,
            missionSpeedMinutes: res.kinesthetic_params.mission_speed_minutes,
            ddaProblemSolvingLevel: res.kinesthetic_params.dda_problem_solving_level,
            missionsCompleted: res.kinesthetic_params.missions_completed,
            missionsTotal: res.kinesthetic_params.missions_total,
            practiceProgressPct: res.kinesthetic_params.practice_progress_pct,
            statusLabel: res.kinesthetic_params.status_label,
          },
          updatedAt: res.updated_at,
        });
      }
    } catch (e) {
      console.warn("Using local context fallback for style analytics", e);
    }
  };

  useEffect(() => {
    fetchStyleAnalytics();
  }, [currentUser?.id, currentUser?.learningProgress]);

  // Dynamic active learning topic from student's enrolled classrooms
  const myClassrooms = classrooms.filter(
    (c) => Boolean(currentUser?.id && c.studentIds?.includes(currentUser.id))
  );
  const myTasks = tasks.filter(
    (t) => myClassrooms.some((c) => c.id === t.classroomId)
  );
  const activeTask = myTasks[0];
  const activeDoc = documents.find((d) => myClassrooms.some((c) => c.id === d.classroomId));
  const hasActiveContent = Boolean(activeTask || activeDoc);
  const currentChapterTitle =
    activeTask?.title ||
    activeTask?.chapter ||
    activeDoc?.title ||
    "Belum ada modul aktif dari guru";

  // Student's dynamic schedules strictly for current user
  const studentSchedules = learningSchedules.filter(
    (s) => s.studentId === currentUser?.id
  );

  // Dynamic Real-Time 7-Day Calendar (Senin - Minggu)
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() + mondayOffset);

  const dayMetadata = [
    { day: "Sen", fullDay: "Senin" },
    { day: "Sel", fullDay: "Selasa" },
    { day: "Rab", fullDay: "Rabu" },
    { day: "Kam", fullDay: "Kamis" },
    { day: "Jum", fullDay: "Jumat" },
    { day: "Sab", fullDay: "Sabtu" },
    { day: "Min", fullDay: "Minggu" },
  ];

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysOfWeek = dayMetadata.map((meta, index) => {
    const itemDate = new Date(mondayDate);
    itemDate.setDate(mondayDate.getDate() + index);
    const dateNum = itemDate.getDate();
    const monthName = monthNames[itemDate.getMonth()];
    const isToday =
      itemDate.getDate() === now.getDate() &&
      itemDate.getMonth() === now.getMonth() &&
      itemDate.getFullYear() === now.getFullYear();

    return {
      day: meta.day,
      fullDay: meta.fullDay,
      date: String(dateNum),
      monthName,
      isToday,
      completed: studentSchedules.some((s) => s.day === meta.fullDay && s.completed),
    };
  });

  const todayIndex = daysOfWeek.findIndex((d) => d.isToday);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(
    todayIndex !== -1 ? todayIndex : 0
  );

  // Dynamic style configuration
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
          topBgGradient: "from-[#C4B2F5]/70 via-[#E3DBF8]/40 to-transparent",
          calendarCard: {
            cardBg: "bg-[#EFEAFB]",
            cardBorder: "border-[#D8CDF8]/80",
            textColor: "text-[#2D2152]",
            subTextColor: "text-[#4B3B7A]",
            iconBox: "bg-white text-[#4B3B7A]",
            targetBadge: "clay-pill bg-white text-[#2D2152]",
            chevronBtn: "bg-white/70 hover:bg-white text-[#4B3B7A]",
            completedPill: "bg-white/60 hover:bg-white/80 text-[#4B3B7A]",
            completedDayLabel: "text-[#4B3B7A]",
            completedDateLabel: "text-[#2D2152]",
            checkBadge: "bg-[#4B3B7A] text-white",
            activePill: "bg-white text-[#2D2152] shadow-[0_8px_20px_rgba(75,59,122,0.18)]",
            activeDayLabel: "text-[#2D2152]",
            activeDateLabel: "text-[#2D2152]",
            activeDot: "bg-[#4B3B7A]",
            upcomingPill: "bg-white/35 hover:bg-white/50 text-[#A595CE]",
            upcomingDayLabel: "text-[#A595CE]",
            upcomingDateLabel: "text-[#A595CE]",
            upcomingDot: "bg-[#D1C6EB]",
            progressBar: "bg-[#4B3B7A]",
            innerCardBg: "bg-white/90 border border-white",
            missionTag1: "bg-[#E3DBF8] text-[#4B3B7A]",
            missionTag2: "bg-[#D1EBE1] text-[#1D5E4D]",
            missionTitle: "text-[#2D2152]",
          },
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
          topBgGradient: "from-[#FCD678]/70 via-[#FEE7B3]/40 to-transparent",
          calendarCard: {
            cardBg: "bg-[#FFF4DC]",
            cardBorder: "border-[#FCE0A2]/80",
            textColor: "text-[#4A3205]",
            subTextColor: "text-[#785308]",
            iconBox: "bg-white text-[#785308]",
            targetBadge: "clay-pill bg-white text-[#4A3205]",
            chevronBtn: "bg-white/70 hover:bg-white text-[#785308]",
            completedPill: "bg-white/60 hover:bg-white/80 text-[#785308]",
            completedDayLabel: "text-[#785308]",
            completedDateLabel: "text-[#4A3205]",
            checkBadge: "bg-[#785308] text-white",
            activePill: "bg-white text-[#4A3205] shadow-[0_8px_20px_rgba(120,83,8,0.18)]",
            activeDayLabel: "text-[#4A3205]",
            activeDateLabel: "text-[#4A3205]",
            activeDot: "bg-[#785308]",
            upcomingPill: "bg-white/35 hover:bg-white/50 text-[#C9A96E]",
            upcomingDayLabel: "text-[#C9A96E]",
            upcomingDateLabel: "text-[#C9A96E]",
            upcomingDot: "bg-[#EAD4AB]",
            progressBar: "bg-[#785308]",
            innerCardBg: "bg-white/90 border border-white",
            missionTag1: "bg-[#FEE7B3] text-[#785308]",
            missionTag2: "bg-[#D1EBE1] text-[#1D5E4D]",
            missionTitle: "text-[#4A3205]",
          },
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
          topBgGradient: "from-[#9DE1CA]/70 via-[#D1EBE1]/40 to-transparent",
          calendarCard: {
            cardBg: "bg-[#E6F5EE]",
            cardBorder: "border-[#C7EAD9]/80",
            textColor: "text-[#0E3D31]",
            subTextColor: "text-[#1D5E4D]",
            iconBox: "bg-white text-[#1D5E4D]",
            targetBadge: "clay-pill bg-white text-[#0E3D31]",
            chevronBtn: "bg-white/70 hover:bg-white text-[#1D5E4D]",
            completedPill: "bg-white/60 hover:bg-white/80 text-[#1D5E4D]",
            completedDayLabel: "text-[#1D5E4D]",
            completedDateLabel: "text-[#0E3D31]",
            checkBadge: "bg-[#1D5E4D] text-white",
            activePill: "bg-white text-[#0E3D31] shadow-[0_8px_20px_rgba(29,94,77,0.18)]",
            activeDayLabel: "text-[#0E3D31]",
            activeDateLabel: "text-[#0E3D31]",
            activeDot: "bg-[#1D5E4D]",
            upcomingPill: "bg-white/35 hover:bg-white/50 text-[#88B8A9]",
            upcomingDayLabel: "text-[#88B8A9]",
            upcomingDateLabel: "text-[#88B8A9]",
            upcomingDot: "bg-[#B3DCD0]",
            progressBar: "bg-[#1D5E4D]",
            innerCardBg: "bg-white/90 border border-white",
            missionTag1: "bg-[#D1EBE1] text-[#1D5E4D]",
            missionTag2: "bg-[#E3DBF8] text-[#4B3B7A]",
            missionTitle: "text-[#0E3D31]",
          },
        };
    }
  };

  const styleConfig = getStyleConfig();
  const HeroIconComponent = styleConfig.HeroIcon;
  const cal = styleConfig.calendarCard;

  // Web Speech Audio Synthesizer Handler
  const handleToggleSpeak = () => {
    audioSynth.playClickSound();
    if ("speechSynthesis" in window) {
      if (isSpeakingSummary) {
        window.speechSynthesis.cancel();
        setIsSpeakingSummary(false);
      } else {
        const text = hasActiveContent
          ? `Ringkasan Pembelajaran: ${currentChapterTitle}. Materi ini telah dioptimasi khusus untuk gaya belajar ${styleConfig.modalityLabel}. Silakan pelajari konsep kunci dan selesaikan tantangan adaptif.`
          : `Selamat datang di EduAdapt. Belum ada materi aktif yang diunggah oleh guru di kelasmu. Kamu bisa mulai dengan berdiskusi bersama Asisten AI Tutor atau meminta kode kelas dari gurumu.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "id-ID";
        utterance.onend = () => setIsSpeakingSummary(false);
        utterance.onerror = () => setIsSpeakingSummary(false);
        setIsSpeakingSummary(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const selectedDayObj = daysOfWeek[selectedDayIdx];
  const activeDaySchedule = studentSchedules.find(
    (s) => s.day === selectedDayObj.fullDay
  );

  // Dynamic Real-Time Learning Method / Activity Progress
  // Disesuaikan dengan modalitas aktif & data riil database (documents, tasks, submissions, schedules)
  const lp = currentUser?.learningProgress;
  const visualDoneSchedules = studentSchedules.filter((s) => s.format === "Visual" && s.completed).length;
  const audioDoneSchedules = studentSchedules.filter((s) => s.format === "Audio" && s.completed).length;
  const practiceDoneSchedules = studentSchedules.filter((s) => (s.format === "Praktik" || s.format === "Kuis") && s.completed).length;

  const totalClassDocs = documents.length > 0 ? documents.length : 6;
  const totalClassTasks = tasks.length > 0 ? tasks.length : 5;

  const visualTotal = Math.max(lp?.visualTotal || 0, totalClassDocs, 4);
  const visualCompleted = Math.min(visualTotal, lp?.visualCompleted ?? (visualDoneSchedules + (hasActiveContent ? 1 : 0)));
  const visualProgress = lp?.visual !== undefined ? lp.visual : Math.round((visualCompleted / visualTotal) * 100);

  const audioMinutes = lp?.audioMinutes ?? Math.max(audioDoneSchedules * 15, isPlayingAudio ? 5 : 0);
  const audioCompleted = lp?.audioCompleted ?? audioDoneSchedules;
  const audioTargetMinutes = 45;
  const audioProgress = lp?.audio !== undefined ? lp.audio : Math.min(100, Math.round((audioMinutes / audioTargetMinutes) * 100));

  const practiceTotal = Math.max(lp?.practiceTotal || 0, totalClassTasks, 4);
  const practiceCompleted = Math.min(practiceTotal, lp?.practiceCompleted ?? (submissions.length + practiceDoneSchedules + (credentials.length > 0 ? 1 : 0)));
  const practiceProgress = lp?.practice !== undefined ? lp.practice : Math.round((practiceCompleted / practiceTotal) * 100);

  // Dynamic Modality Accuracy from actual credentials & submissions
  const currentModalityAccuracy =
    credentials.length > 0
      ? Math.round(credentials.reduce((acc, c) => acc + (c.score || 0), 0) / credentials.length)
      : (currentUser?.currentDDALevel === "MASTERY" ? 95 : currentUser?.currentDDALevel === "CHALLENGING" ? 85 : currentUser?.currentDDALevel === "MEDIUM" ? 75 : 65);

  const completedSchedulesCount = studentSchedules.filter((s) => s.completed).length;
  const totalSchedulesCount = studentSchedules.length;
  const scheduleProgressPercent = totalSchedulesCount > 0 ? Math.round((completedSchedulesCount / totalSchedulesCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col pb-24 md:pb-8 relative overflow-hidden">
      {/* Dynamic Ambient Top Gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-[420px] bg-gradient-to-b ${styleConfig.topBgGradient} pointer-events-none transition-all duration-500`}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="flex flex-1 relative z-10 w-full">
        {/* Clean Desktop Sidebar */}
        <StudentSidebar />

        {/* Responsive Bento Grid Dashboard */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT MAIN STREAM (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
              {/* 1. HERO LEARNING OVERVIEW (Dynamic Tactile) */}
              <section className={`${styleConfig.heroClass} p-5 sm:p-6 relative overflow-hidden`}>
                <div className="flex items-start justify-between gap-3 relative z-10">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="clay-pill clay-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1C1E26]">
                        {userGrade}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold ${styleConfig.heroBadgeBg}`}>
                        Modalitas {styleConfig.modalityLabel}
                      </span>
                    </div>
                    <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${styleConfig.heroTitleColor}`}>
                      {currentUser?.name || "Siswa EduAdapt"}
                    </h1>
                    <p className={`text-xs ${styleConfig.heroSubColor} font-bold mt-0.5`}>
                      {hasActiveContent ? `Target: ${currentChapterTitle}` : "Belum ada target modul aktif dari guru"}
                    </p>
                  </div>

                  <div className={`w-11 h-11 ${styleConfig.heroIconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                    <HeroIconComponent className="w-6 h-6" />
                  </div>
                </div>

                {/* 3 Real Metrics from Backend */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-black/10 relative z-10">
                  <div className="clay-pill clay-white p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-[#785308] font-black text-xs">
                      <Flame className="w-3.5 h-3.5 fill-[#785308]" />
                      <span>{currentUser?.streakDays || 0} Hari</span>
                    </div>
                    <span className={`text-[9px] ${styleConfig.heroSubColor} font-extrabold block mt-0.5`}>Streak Aktif</span>
                  </div>

                  <div className="clay-pill clay-white p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-[#1D5E4D] font-black text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{currentModalityAccuracy}%</span>
                    </div>
                    <span className={`text-[9px] ${styleConfig.heroSubColor} font-extrabold block mt-0.5`}>Akurasi DDA</span>
                  </div>

                  <div className="clay-pill clay-white p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-[#21518A] font-black text-xs">
                      <Star className="w-3.5 h-3.5 fill-[#21518A]" />
                      <span>{currentUser?.xpTotal || 0} XP</span>
                    </div>
                    <span className={`text-[9px] ${styleConfig.heroSubColor} font-extrabold block mt-0.5`}>Total XP</span>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="mt-3.5 relative z-10">
                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      if (hasActiveContent) {
                        navigate("/student/learn");
                      } else {
                        navigate("/student/class");
                      }
                    }}
                    className={`clay-btn clay-btn-white w-full py-2.5 px-4 text-xs font-black ${styleConfig.btnColor} flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98`}
                  >
                    <span>{hasActiveContent ? "Lanjutkan Eksplorasi Materi Adaptif" : "Gabung ke Ruang Kelas Guru"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>

              {/* 2. DYNAMIC WEEKLY SCHEDULE & TARGET HUB */}
              <section className={`clay-card ${cal.cardBg} ${cal.textColor} p-4 sm:p-5 rounded-[28px] border ${cal.cardBorder} space-y-3.5 shadow-xs`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${cal.iconBox} flex items-center justify-center shadow-xs shrink-0`}>
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className={`text-xs sm:text-sm font-black ${cal.textColor} truncate tracking-tight`}>
                        Jadwal Belajar Pekanan
                      </h2>
                      <p className={`text-[10px] sm:text-[11px] ${cal.subTextColor} font-bold truncate`}>
                        {totalSchedulesCount > 0
                          ? `${completedSchedulesCount} dari ${totalSchedulesCount} Misi Selesai`
                          : "Belum ada agenda belajar terjadwal di database"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`${cal.targetBadge} text-[11px] sm:text-xs font-black px-3 py-1 shadow-2xs`}>
                      {scheduleProgressPercent}% Target
                    </span>
                    <Link
                      to="/student/schedule"
                      onClick={() => audioSynth.playClickSound()}
                      className={`p-1.5 rounded-xl ${cal.chevronBtn} transition-transform hover:scale-105 shrink-0 shadow-2xs`}
                      title="Buka Halaman Jadwal Penuh"
                      aria-label="Buka Halaman Jadwal Penuh"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* 7-Day Interactive Selector */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 items-end" role="group" aria-label="Pilih Hari Jadwal">
                  {daysOfWeek.map((item, idx) => {
                    const isSelected = selectedDayIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          audioSynth.playClickSound();
                          setSelectedDayIdx(idx);
                        }}
                        aria-pressed={isSelected}
                        className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? `${cal.activePill} rounded-2xl py-3 sm:py-3.5 scale-105 z-10 -my-1`
                            : item.completed
                            ? `${cal.completedPill} rounded-2xl py-2 sm:py-2.5 shadow-2xs`
                            : `${cal.upcomingPill} rounded-2xl py-2 sm:py-2.5`
                        }`}
                      >
                        <span
                          className={`text-[9px] sm:text-[10px] uppercase font-black tracking-wide ${
                            isSelected
                              ? cal.activeDayLabel
                              : item.completed
                              ? cal.completedDayLabel
                              : cal.upcomingDayLabel
                          }`}
                        >
                          {item.day}
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-black mt-0.5 ${
                            isSelected
                              ? `${cal.activeDateLabel} text-sm sm:text-base`
                              : item.completed
                              ? cal.completedDateLabel
                              : cal.upcomingDateLabel
                          }`}
                        >
                          {item.date}
                        </span>

                        <div className="mt-1 flex items-center justify-center min-h-[16px]">
                          {item.completed ? (
                            <div className={`w-4 h-4 rounded-full ${cal.checkBadge} flex items-center justify-center shadow-2xs`}>
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          ) : isSelected ? (
                            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${cal.activeDot} shadow-xs`}></div>
                          ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${cal.upcomingDot}`}></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Selected Day Schedule Card */}
                <div className={`clay-card p-3 sm:p-3.5 ${cal.innerCardBg} flex items-center justify-between gap-3 shadow-xs rounded-2xl`}>
                  {activeDaySchedule ? (
                    <div className="flex items-center gap-3 min-w-0 w-full justify-between">
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
                            <span className={`clay-pill ${cal.missionTag1} text-[9px] font-extrabold px-2 py-0.5`}>
                              {activeDaySchedule.day} • {activeDaySchedule.time}
                            </span>
                            <span className={`clay-pill ${cal.missionTag2} text-[9px] font-bold px-2 py-0.5`}>
                              {activeDaySchedule.format}
                            </span>
                          </div>
                          <h4
                            className={`text-xs font-bold truncate ${
                              activeDaySchedule.completed
                                ? "line-through text-[#9195A8]"
                                : cal.missionTitle
                            }`}
                          >
                            {activeDaySchedule.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          audioSynth.playClickSound();
                          navigate("/student/schedule");
                        }}
                        className="text-[10px] font-bold text-[#595F72] hover:text-[#1C1E26] underline shrink-0 cursor-pointer"
                      >
                        Detail
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="text-xs">
                        <span className={`font-bold ${cal.textColor} block`}>
                          {selectedDayObj.fullDay}, {selectedDayObj.date} {selectedDayObj.monthName}
                        </span>
                        <span className={`text-[10px] ${cal.subTextColor}`}>
                          Belum ada jadwal khusus hari ini
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          audioSynth.playClickSound();
                          navigate("/student/schedule");
                        }}
                        className={`clay-pill bg-white ${cal.subTextColor} text-[10px] font-black px-2.5 py-1 flex items-center gap-1 shadow-2xs hover:scale-105 transition-transform shrink-0 cursor-pointer`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* 3. MODALITY-SPECIFIC CONTENT OR CLEAN EMPTY STATE */}
              {!hasActiveContent ? (
                <section className="clay-card clay-white p-6 rounded-3xl border border-black/5 text-center space-y-3.5 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#F0EEF6] text-[#595F72] flex items-center justify-center mx-auto shadow-2xs">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#1C1E26]">Belum Ada Modul atau Tugas Aktif</h3>
                    <p className="text-xs text-[#595F72] mt-1 max-w-md mx-auto leading-relaxed">
                      Guru di kelasmu belum mengunggah modul pembelajaran atau materi RAG. Kamu dapat bergabung ke kelas guru menggunakan kode kelas atau mulai berdiskusi mandiri bersama AI Tutor.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <Link
                      to="/student/class"
                      onClick={() => audioSynth.playClickSound()}
                      className="clay-btn clay-btn-dark px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <School className="w-3.5 h-3.5" />
                      <span>Gabung Ruang Kelas</span>
                    </Link>
                    <Link
                      to="/student/ai"
                      onClick={() => audioSynth.playClickSound()}
                      className="clay-btn clay-btn-white px-4 py-2.5 rounded-xl text-xs font-bold text-[#1C1E26] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Bot className="w-3.5 h-3.5 text-[#4B3B7A]" />
                      <span>Tanya AI Tutor</span>
                    </Link>
                  </div>
                </section>
              ) : (
                <>
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
                          Buka Semua Modul
                        </Link>
                      </div>

                      {/* Visual Card: Active Chapter */}
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
                                Modul Adaptif
                              </span>
                              <span className="text-[10px] text-[#9195A8] font-semibold flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> 20 mnt
                              </span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-black text-[#010105] group-hover:text-[#1D5E4D] transition-colors mt-0.5">
                              {currentChapterTitle}
                            </h3>
                            <p className="text-[11px] text-[#5A5E70] font-medium">
                              Materi pelajaran aktif yang telah dikalibrasi untuk gaya belajar visualmu.
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
                              Evaluasi Adaptif Pemahaman Visual
                            </h3>
                            <p className="text-[11px] text-[#785308] font-medium">
                              Tantangan adaptif dengan penyesuaian tingkat kesulitan dinamis.
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
                          Audio Podcast Aktif
                        </span>
                      </div>

                      <div className="clay-card clay-lavender p-4 sm:p-5 text-[#2D2152] space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B3B7A]/80 block">
                              Audio Pembelajaran Adaptif
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-[#1E143D] mt-0.5">
                              {currentChapterTitle}
                            </h3>
                            <p className="text-[11px] text-[#4B3B7A] font-medium">
                              Penjelasan konsep materi via suara narasi terarah.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              audioSynth.playClickSound();
                              setIsPlayingAudio(!isPlayingAudio);
                            }}
                            className="clay-btn clay-btn-white w-12 h-12 rounded-full flex items-center justify-center text-[#4B3B7A] shrink-0 cursor-pointer"
                            title={isPlayingAudio ? "Jeda Audio" : "Putar Audio"}
                          >
                            {isPlayingAudio ? (
                              <Pause className="w-6 h-6 fill-current" />
                            ) : (
                              <Play className="w-6 h-6 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="pt-2 border-t border-[#4B3B7A]/15 flex items-center justify-between gap-2">
                          <button
                            type="button"
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
                            <span>Buka Modul Lengkap</span>
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
                              Evaluasi Adaptif Berbasis Audio
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

                      <div className="clay-card clay-butter p-4 sm:p-5 text-[#4A3205] space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#785308]/80 block">
                              Tantangan Simulasi Interaktif
                            </span>
                            <h3 className="text-sm sm:text-base font-black text-[#2C1D02] mt-0.5">
                              {currentChapterTitle}
                            </h3>
                            <p className="text-[11px] text-[#785308] font-medium">
                              Eksperimen studi kasus mandiri dengan interaksi langsung.
                            </p>
                          </div>

                          <div className="clay-card clay-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                            <FlaskConical className="w-6 h-6 text-[#785308]" />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#785308]/15">
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
                              Pemecahan masalah berbasis skenario praktis dinamis.
                            </p>
                          </div>
                        </div>

                        <button className="clay-btn clay-btn-dark px-4 py-2 rounded-xl text-xs font-black shrink-0">
                          Mulai
                        </button>
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            {/* RIGHT SIDEBAR STREAM (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
              {/* 4. DEDICATED COGNITIVE ANALYTICS PER ACTIVE LEARNING STYLE */}
              <section className={`clay-card p-5 sm:p-6 space-y-4 shadow-xs ${
                style === "KINESTETIK"
                  ? "bg-[#FFFBF0] text-[#4A3205] border border-[#FEE7B3]"
                  : style === "VISUAL"
                  ? "bg-[#F4FAF7] text-[#082921] border border-[#D1EBE1]"
                  : "bg-[#F8F6FD] text-[#1E143D] border border-[#E3DBF8]"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        style === "KINESTETIK"
                          ? "bg-[#FEE7B3] text-[#785308]"
                          : style === "VISUAL"
                          ? "bg-[#D1EBE1] text-[#1D5E4D]"
                          : "bg-[#E3DBF8] text-[#4B3B7A]"
                      }`}>
                        Analitik Gaya Belajar Utama
                      </span>
                      <span className="bg-white/80 text-[10px] font-black px-2 py-0.5 rounded-full border border-black/5">
                        Level: {currentUser?.currentDDALevel || "BASIC"}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black leading-tight">
                      {style === "KINESTETIK"
                        ? "Analitik Modalitas Kinestetik"
                        : style === "VISUAL"
                        ? "Analitik Modalitas Visual"
                        : "Analitik Modalitas Auditori"}
                    </h3>
                    <p className="text-[11px] font-medium opacity-80 mt-0.5">
                      {style === "KINESTETIK"
                        ? "Parameter penguasaan kognitif berbasis simulasi lab & tantangan hands-on."
                        : style === "VISUAL"
                        ? "Parameter penguasaan kognitif berbasis diagram alir & infografis."
                        : "Parameter penguasaan kognitif berbasis podcast materi & narasi suara."}
                    </p>
                  </div>

                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                    style === "KINESTETIK"
                      ? "bg-[#FEE7B3] text-[#785308]"
                      : style === "VISUAL"
                      ? "bg-[#D1EBE1] text-[#1D5E4D]"
                      : "bg-[#E3DBF8] text-[#4B3B7A]"
                  }`}>
                    {style === "KINESTETIK" && <FlaskConical className="w-5 h-5" />}
                    {style === "VISUAL" && <Eye className="w-5 h-5" />}
                    {style === "AUDITORI" && <Headphones className="w-5 h-5" />}
                  </div>
                </div>

                {/* Primary Progress Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-black/5 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>
                      {style === "KINESTETIK"
                        ? "Progres Misi & Eksperimen Lab"
                        : style === "VISUAL"
                        ? "Progres Modul Bagan & Peta Konsep"
                        : "Progres Durasi Mendengar Audio"}
                    </span>
                    <span className="font-black">
                      {style === "KINESTETIK"
                        ? `${practiceProgress}% (${practiceCompleted}/${practiceTotal} Misi)`
                        : style === "VISUAL"
                        ? `${visualProgress}% (${visualCompleted}/${visualTotal} Modul)`
                        : `${audioProgress}% (${audioMinutes} / 45 mnt)`}
                    </span>
                  </div>
                  <div className="w-full bg-[#F0EEF6] h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        style === "KINESTETIK"
                          ? "bg-[#785308]"
                          : style === "VISUAL"
                          ? "bg-[#1D5E4D]"
                          : "bg-[#4B3B7A]"
                      }`}
                      style={{
                        width: `${
                          style === "KINESTETIK"
                            ? Math.max(10, practiceProgress)
                            : style === "VISUAL"
                            ? Math.max(10, visualProgress)
                            : Math.max(10, audioProgress)
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* 4 Dedicated Parameter Metric Chips */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {style === "KINESTETIK" && (
                    <>
                      <div className="bg-white p-2.5 rounded-xl border border-[#FEE7B3]">
                        <span className="text-[10px] text-[#785308] font-bold block">Akurasi Lab Hands-on</span>
                        <span className="text-sm font-black text-[#010105]">{styleData?.kinestheticParams.labAccuracyPct ?? currentModalityAccuracy}% Presisi</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#FEE7B3]">
                        <span className="text-[10px] text-[#785308] font-bold block">Efisiensi Trial-Error</span>
                        <span className="text-sm font-black text-[#785308]">{styleData?.kinestheticParams.trialErrorIterations ?? 1.4} Iterasi/Kasus</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#FEE7B3]">
                        <span className="text-[10px] text-[#785308] font-bold block">Kecepatan Misi</span>
                        <span className="text-sm font-black text-[#010105]">{styleData?.kinestheticParams.missionSpeedMinutes ?? 3.2} Menit/Misi</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#FEE7B3]">
                        <span className="text-[10px] text-[#785308] font-bold block">Problem Solving DDA</span>
                        <span className="text-sm font-black text-[#1D5E4D]">Level: {styleData?.kinestheticParams.ddaProblemSolvingLevel ?? (currentUser?.currentDDALevel || "BASIC")}</span>
                      </div>
                    </>
                  )}

                  {style === "VISUAL" && (
                    <>
                      <div className="bg-white p-2.5 rounded-xl border border-[#D1EBE1]">
                        <span className="text-[10px] text-[#1D5E4D] font-bold block">Retensi Pola Spasial</span>
                        <span className="text-sm font-black text-[#1D5E4D]">{styleData?.visualParams.spatialRetentionPct ?? currentModalityAccuracy}% Indeks</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#D1EBE1]">
                        <span className="text-[10px] text-[#1D5E4D] font-bold block">Kecepatan Pindai</span>
                        <span className="text-sm font-black text-[#010105]">{styleData?.visualParams.scanSpeedSecPerNode ?? 1.5} Detik/Node</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#D1EBE1]">
                        <span className="text-[10px] text-[#1D5E4D] font-bold block">Pemahaman Infografis</span>
                        <span className="text-sm font-black text-[#010105]">{styleData?.visualParams.infographicAccuracyPct ?? 92}% Akurat</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#D1EBE1]">
                        <span className="text-[10px] text-[#1D5E4D] font-bold block">Eksplorasi Mindmap</span>
                        <span className="text-sm font-black text-[#1D5E4D]">{visualCompleted} dari {visualTotal} Bagan</span>
                      </div>
                    </>
                  )}

                  {style === "AUDITORI" && (
                    <>
                      <div className="bg-white p-2.5 rounded-xl border border-[#E3DBF8]">
                        <span className="text-[10px] text-[#4B3B7A] font-bold block">Total Waktu Dengar</span>
                        <span className="text-sm font-black text-[#4B3B7A]">{styleData?.auditoryParams.totalListeningMinutes ?? audioMinutes} Menit</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#E3DBF8]">
                        <span className="text-[10px] text-[#4B3B7A] font-bold block">Retensi Narasi</span>
                        <span className="text-sm font-black text-[#010105]">{styleData?.auditoryParams.verbalRetentionPct ?? currentModalityAccuracy}% Daya Ingat</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#E3DBF8]">
                        <span className="text-[10px] text-[#4B3B7A] font-bold block">Stabilitas Fokus</span>
                        <span className="text-sm font-black text-[#1D5E4D]">{styleData?.auditoryParams.focusStabilityPct ?? 90}% Optimal</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#E3DBF8]">
                        <span className="text-[10px] text-[#4B3B7A] font-bold block">Tempo Putar Ideal</span>
                        <span className="text-sm font-black text-[#4B3B7A]">{styleData?.auditoryParams.idealPlaybackSpeed ?? 1.25}x Normal</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Interactive Modality Action */}
                {style === "KINESTETIK" && (
                  <button
                    onClick={async () => {
                      audioSynth.playSuccessSound();
                      await trackLearningActivity("practice", 1, "Simulasi Lab Cepat dari Beranda");
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#785308] text-white text-xs font-black hover:bg-[#5E4006] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+ Jalankan Simulasi Lab Praktik</span>
                  </button>
                )}

                {style === "VISUAL" && (
                  <button
                    onClick={async () => {
                      audioSynth.playClickSound();
                      await trackLearningActivity("visual", 1, "Membaca Bagan Diagram dari Beranda");
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#1D5E4D] text-white text-xs font-black hover:bg-[#154639] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>+ Buka Diagram Peta Konsep</span>
                  </button>
                )}

                {style === "AUDITORI" && (
                  <button
                    onClick={handleToggleSpeak}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#4B3B7A] text-white text-xs font-black hover:bg-[#3B2D62] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isSpeakingSummary ? "Hentikan Narasi Audio" : "Putar Ringkasan Audio Beranda"}</span>
                  </button>
                )}

                <Link
                  to="/student/status"
                  onClick={() => audioSynth.playClickSound()}
                  className="w-full py-2 px-3 rounded-xl bg-white text-center text-xs font-extrabold text-[#5A5E70] hover:text-[#010105] border border-black/5 hover:bg-black/5 transition-all flex items-center justify-center gap-1 cursor-pointer block"
                >
                  <span>Buka Analitik Gaya Belajar Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </section>

              {/* 5. LEARNING PATHWAY (Stepping Stones 3D Map) */}
              <section className="clay-card clay-white p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9195A8] block">
                      Peta Jalur Belajar
                    </span>
                    <h2 className="text-sm sm:text-base font-black text-[#010105]">
                      Jalur Petualangan Belajar
                    </h2>
                  </div>
                  <span className="clay-pill clay-mint px-3 py-1 text-[#1D5E4D] text-[10px] font-extrabold shadow-2xs">
                    Level {currentUser?.currentDDALevel || "Aktif"}
                  </span>
                </div>

                {/* Stepping Stones Vertical Journey */}
                <div className="py-2 flex flex-col items-center gap-4 relative">
                  {/* Step 1 - Asesmen / Eksplorasi Awal */}
                  <div className="flex items-center gap-4 w-full max-w-xs justify-start">
                    <div
                      onClick={() => {
                        audioSynth.playSuccessSound();
                        navigate("/assessment");
                      }}
                      className="clay-stone-node clay-mint shrink-0 cursor-pointer"
                      title="Langkah 1: Asesmen Diagnostik Kognitif"
                    >
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] font-bold text-[#1D5E4D] uppercase block">
                        Langkah 1 • Terkalibrasi
                      </span>
                      <p className="text-xs font-extrabold text-[#010105]">
                        Profil Kognitif &amp; Modalitas
                      </p>
                    </div>
                  </div>

                  {/* Step 2 - Current Active (Pulsing) */}
                  <div className="flex items-center gap-4 w-full max-w-xs justify-end">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#4B3B7A] uppercase block">
                        Langkah 2 • Tantangan Aktif
                      </span>
                      <p className="text-xs font-extrabold text-[#010105]">
                        {hasActiveContent ? "Kuis Adaptif Bab Aktif" : "Eksplorasi AI Tutor"}
                      </p>
                    </div>
                    <div
                      onClick={() => {
                        audioSynth.playLevelUpSound();
                        if (hasActiveContent) {
                          navigate("/quiz");
                        } else {
                          navigate("/student/ai");
                        }
                      }}
                      className="clay-stone-node clay-lavender shrink-0 ring-4 ring-[#E3DBF8] ring-offset-2 animate-soft-pulse cursor-pointer"
                      title="Langkah 2: Uji Kemampuan Adaptif (Tantangan Aktif)"
                    >
                      <Sparkles className="w-6 h-6" />
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
                        Uji Kompetensi Lanjutan
                      </p>
                    </div>
                  </div>

                  {/* Final Evaluation Boss Card */}
                  <div className="flex items-center gap-4 w-full max-w-xs justify-center pt-2">
                    <div
                      onClick={() => {
                        audioSynth.playClickSound();
                        navigate("/passport");
                      }}
                      className="clay-card clay-dark p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:scale-102 active:scale-98 transition-transform border border-white/20 w-full shadow-xs"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-[#FEE7B3]" />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-extrabold text-[#FEE7B3] uppercase block">
                          Target Akhir Modul
                        </span>
                        <p className="text-xs font-bold text-white">
                          Verifikasi Paspor Kompetensi
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
