import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import {
  Bell,
  Layers,
  BookOpen,
  Shield,
  GraduationCap,
  Users,
  Flame,
  Star,
} from "@/components/ui/icons";

export default function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const {
    currentUser,
    triggerSync,
  } = useApp();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[rgba(28,30,38,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#010105] text-lg sm:text-xl tracking-tight">
              EduFlow
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold bg-[#D1EBE1] text-[#1D5E4D] px-2 py-0.5 rounded-full">
              Adaptive
            </span>
          </Link>
        </div>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/student/status"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 ${
              pathname === "/student/status"
                ? "text-[#010105]"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Explore Status</span>
          </Link>
          <Link
            to="/student"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 ${
              pathname.startsWith("/student") && pathname !== "/student/status"
                ? "text-[#010105]"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Learn</span>
          </Link>
          <Link
            to="/teacher"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 ${
              pathname.startsWith("/teacher")
                ? "text-[#010105]"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Guru</span>
          </Link>
          <Link
            to="/parent"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 ${
              pathname.startsWith("/parent")
                ? "text-[#010105]"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Orang Tua</span>
          </Link>
          <Link
            to="/verify"
            className={`text-xs font-bold transition-all flex items-center gap-1.5 ${
              pathname.startsWith("/verify")
                ? "text-[#010105]"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Verify</span>
          </Link>
        </nav>

        {/* Right Status Indicators (Streak + XP + Notification only, profile removed) */}
        <div className="flex items-center gap-2">
          {/* Streak Pill Badge */}
          <div className="clay-pill clay-butter flex items-center gap-1.5 px-3.5 py-1 text-[#694503]">
            <Flame className="w-4 h-4 fill-[#785308] text-[#785308]" />
            <span className="text-xs font-black" suppressHydrationWarning>
              {mounted ? (currentUser.streakDays || 14) : 14} Hari
            </span>
          </div>

          {/* XP Pill Badge */}
          <div className="hidden sm:flex items-center gap-1 clay-pill clay-white px-3 py-1">
            <Star className="w-3.5 h-3.5 fill-[#21518A] text-[#21518A]" />
            <span className="text-[11px] font-extrabold text-[#1C1E26]" suppressHydrationWarning>
              {mounted ? (currentUser.xpTotal || 450) : 450} XP
            </span>
          </div>

          {/* Notification Bell Button */}
          <button
            onClick={() => triggerSync()}
            className="clay-btn clay-btn-white w-9 h-9 rounded-full flex items-center justify-center text-[#1C1E26] relative"
            title="Notifikasi & Sinkronisasi"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
