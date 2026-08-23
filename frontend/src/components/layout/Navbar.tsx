import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { audioSynth } from "@/services/audioSynth";
import {
  Bell,
  Layers,
  BookOpen,
  Shield,
  GraduationCap,
  Users,
  Flame,
  Star,
  Eye,
  Headphones,
  FlaskConical,
  Sparkles,
} from "@/components/ui/icons";

export default function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const {
    currentUser,
    switchUser,
    updateCurrentUserProfile,
    triggerSync,
  } = useApp();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isStudentArea = pathname.startsWith("/student") || pathname === "/assessment" || pathname === "/quiz" || pathname === "/passport";
  const activeStyle = currentUser.learningStyle || "VISUAL";

  const handleSwitchModality = (targetUser: string, style: "VISUAL" | "AUDITORI" | "KINESTETIK") => {
    audioSynth.playClickSound();
    switchUser(targetUser);
    updateCurrentUserProfile({ learningStyle: style });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[rgba(28,30,38,0.06)] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            aria-label="EduFlow Adaptive Beranda"
            className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#1C1E26] rounded-xl px-1 py-0.5"
          >
            <span className="font-extrabold text-[#010105] text-lg sm:text-xl tracking-tight">
              EduFlow
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold bg-[#D1EBE1] text-[#1D5E4D] px-2 py-0.5 rounded-full">
              Adaptive
            </span>
          </Link>
        </div>

        {/* Center Desktop Navigation */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-5 lg:gap-6">
          <Link
            to="/student/status"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#1C1E26] ${
              pathname === "/student/status"
                ? "text-[#010105] font-black"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Explore Status</span>
          </Link>
          <Link
            to="/student"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#1C1E26] ${
              pathname.startsWith("/student") && pathname !== "/student/status"
                ? "text-[#010105] font-black"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Belajar</span>
          </Link>
          <Link
            to="/teacher"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#1C1E26] ${
              pathname.startsWith("/teacher")
                ? "text-[#010105] font-black"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Guru</span>
          </Link>
          <Link
            to="/parent"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#1C1E26] ${
              pathname.startsWith("/parent")
                ? "text-[#010105] font-black"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Orang Tua</span>
          </Link>
          <Link
            to="/verify"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 px-2 py-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#1C1E26] ${
              pathname.startsWith("/verify")
                ? "text-[#010105] font-black"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Verify</span>
          </Link>
        </nav>

        {/* Right Section: Quick Modality Switcher (For Student) & Status Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Modality Switcher Chip Selector */}
          {isStudentArea && (
            <div
              className="flex items-center bg-[#F0EEF6] p-1 rounded-full border border-black/5 shadow-2xs"
              role="group"
              aria-label="Pilih Varian Modalitas Dashboard Siswa"
            >
              {/* Visual Button */}
              <button
                type="button"
                onClick={() => handleSwitchModality("user_ayu_01", "VISUAL")}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                  activeStyle === "VISUAL"
                    ? "bg-[#D1EBE1] text-[#1D5E4D] shadow-xs scale-102"
                    : "text-[#5A5E70] hover:text-[#1C1E26]"
                }`}
                title="Beralih ke Siswa Visual (Ayu) - Diagram & Bagan"
                aria-label="Mode Dashboard Visual"
                aria-pressed={activeStyle === "VISUAL"}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Visual</span>
              </button>

              {/* Auditori Button */}
              <button
                type="button"
                onClick={() => handleSwitchModality("user_citra_03", "AUDITORI")}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                  activeStyle === "AUDITORI"
                    ? "bg-[#E3DBF8] text-[#4B3B7A] shadow-xs scale-102"
                    : "text-[#5A5E70] hover:text-[#1C1E26]"
                }`}
                title="Beralih ke Siswa Auditori (Citra) - Podcast & Audio"
                aria-label="Mode Dashboard Auditori"
                aria-pressed={activeStyle === "AUDITORI"}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Audio</span>
              </button>

              {/* Kinestetik Button */}
              <button
                type="button"
                onClick={() => handleSwitchModality("user_budi_02", "KINESTETIK")}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                  activeStyle === "KINESTETIK"
                    ? "bg-[#FEE7B3] text-[#785308] shadow-xs scale-102"
                    : "text-[#5A5E70] hover:text-[#1C1E26]"
                }`}
                title="Beralih ke Siswa Kinestetik (Budi) - Lab Simulasi"
                aria-label="Mode Dashboard Kinestetik"
                aria-pressed={activeStyle === "KINESTETIK"}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Praktik</span>
              </button>
            </div>
          )}

          {/* Streak Pill Badge */}
          <div
            className="clay-pill clay-butter flex items-center gap-1 px-2.5 sm:px-3.5 py-1 text-[#694503]"
            title={`Streak Aktif: ${currentUser.streakDays || 14} Hari Belajar`}
          >
            <Flame className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-[#785308] text-[#785308]" />
            <span className="text-[11px] sm:text-xs font-black" suppressHydrationWarning>
              {mounted ? (currentUser.streakDays || 14) : 14}d
            </span>
          </div>

          {/* XP Pill Badge */}
          <div
            className="hidden sm:flex items-center gap-1 clay-pill clay-white px-3 py-1"
            title={`Total XP Capaian: ${currentUser.xpTotal || 450} XP`}
          >
            <Star className="w-3.5 h-3.5 fill-[#21518A] text-[#21518A]" />
            <span className="text-[11px] font-extrabold text-[#1C1E26]" suppressHydrationWarning>
              {mounted ? (currentUser.xpTotal || 450) : 450} XP
            </span>
          </div>

          {/* Notification Bell Button */}
          <button
            type="button"
            onClick={() => triggerSync()}
            className="clay-btn clay-btn-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#1C1E26] relative focus-visible:ring-2 focus-visible:ring-[#1C1E26] cursor-pointer"
            title="Notifikasi & Sinkronisasi Data"
            aria-label="Notifikasi dan Sinkronisasi Data"
          >
            <Bell className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

