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
          <div className="flex items-center gap-1.5 bg-[#FFF6DF] px-3 py-1 rounded-full border border-[#FEE7B3] shadow-2xs">
            <Flame className="w-4 h-4 fill-[#785308] text-[#785308]" />
            <span className="text-xs font-black text-[#785308]" suppressHydrationWarning>
              {mounted ? (currentUser.streakDays || 5) : 5} Hari
            </span>
          </div>

          {/* XP Pill Badge */}
          <div className="hidden sm:flex items-center gap-1 bg-[#F5F3ED] px-2.5 py-1 rounded-full border border-[rgba(28,30,38,0.06)]">
            <Star className="w-3.5 h-3.5 fill-[#F2C94C] text-[#F2C94C]" />
            <span className="text-[11px] font-extrabold text-[#010105]" suppressHydrationWarning>
              {mounted ? (currentUser.xpTotal || 450) : 450} XP
            </span>
          </div>

          {/* Notification Bell Button */}
          <button
            onClick={() => triggerSync()}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[rgba(28,30,38,0.08)] flex items-center justify-center text-[#010105] relative hover:bg-[#F7F6FA] transition-all cursor-pointer shadow-xs"
            title="Notifikasi & Sinkronisasi"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ba1a1a] rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
