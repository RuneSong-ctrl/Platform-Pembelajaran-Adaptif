import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { audioSynth } from "@/services/audioSynth";
import {
  BookOpen,
  Layers,
  Calendar,
  GraduationCap,
  Sparkles,
  Award,
  Users,
  Flame,
  Star,
  LogOut,
  RefreshCw,
} from "@/components/ui/icons";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const {
    currentUser,
    logout,
    triggerSync,
    isSyncing,
  } = useApp();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    audioSynth.playClickSound();
    logout();
    navigate("/");
  };

  const isStudent = currentUser?.role === "SISWA";
  const isTeacher = currentUser?.role === "GURU";
  const isParent = currentUser?.role === "ORTU";

  // Active Link Helper
  const isActive = (path: string) => {
    if (path === "/student") {
      return pathname === "/student" || pathname === "/student/learn";
    }
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[rgba(28,30,38,0.08)] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3">
          <Link
            to={isTeacher ? "/teacher" : isParent ? "/parent" : "/student"}
            aria-label="EduAdapt Portal"
            className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-[#1C1E26] rounded-xl group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#1C1E26] text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              E
            </div>
            <span className="font-black text-[#1C1E26] text-lg sm:text-xl tracking-tight">
              EduAdapt
            </span>
          </Link>
        </div>

        {/* Center Navigation Links (Clean Segmented Architecture) */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-1 bg-[#F7F6FA] p-1 rounded-2xl border border-[rgba(28,30,38,0.06)] shadow-inner">
          {/* Siswa Navigation */}
          {isStudent && (
            <>
              <Link
                to="/student"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/student")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#1D5E4D]" />
                <span>Belajar</span>
              </Link>

              <Link
                to="/student/status"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/student/status")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#4B3B7A]" />
                <span>Roadmap</span>
              </Link>

              <Link
                to="/student/schedule"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/student/schedule")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#785308]" />
                <span>Jadwal</span>
              </Link>
            </>
          )}

          {/* Guru Navigation */}
          {isTeacher && (
            <>
              <Link
                to="/teacher"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/teacher")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#1D5E4D]" />
                <span>Kelas</span>
              </Link>

              <Link
                to="/teacher/rag"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/teacher/rag")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#4B3B7A]" />
                <span>RAG Materi</span>
              </Link>

              <Link
                to="/teacher/quiz-generator"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/teacher/quiz-generator")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#785308]" />
                <span>AI Kuis</span>
              </Link>

              <Link
                to="/teacher/gradebook"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/teacher/gradebook")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-[#21518A]" />
                <span>Gradebook</span>
              </Link>
            </>
          )}

          {/* Ortu Navigation */}
          {isParent && (
            <>
              <Link
                to="/parent"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/parent")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#4B3B7A]" />
                <span>Radar Belajar</span>
              </Link>

              <Link
                to="/parent/chat"
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive("/parent/chat")
                    ? "bg-white text-[#1C1E26] shadow-xs font-black scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1D5E4D]" />
                <span>Konsultasi AI</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Section: Cohesive Metrics, User Avatar & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Siswa Stats: Single Unified High-End Capsule */}
          {isStudent && (
            <div className="hidden sm:flex items-center gap-2.5 bg-[#F7F6FA] px-3 py-1.5 rounded-2xl border border-[rgba(28,30,38,0.06)] shadow-inner text-xs font-extrabold text-[#1C1E26]">
              <span className="flex items-center gap-1 text-[#785308]" title="Streak Hari Belajar">
                <Flame className="w-3.5 h-3.5 fill-[#785308] text-[#785308]" />
                <span>{mounted ? (currentUser?.streakDays || 1) : 1}d</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-black/20" />
              <span className="flex items-center gap-1 text-[#1D5E4D]" title="Total XP Terkumpul">
                <Star className="w-3.5 h-3.5 fill-[#1D5E4D] text-[#1D5E4D]" />
                <span>{mounted ? (currentUser?.xpTotal || 0) : 0} XP</span>
              </span>
            </div>
          )}

          {/* Sync Trigger Button */}
          <button
            type="button"
            onClick={() => triggerSync()}
            disabled={isSyncing}
            className="w-8 h-8 rounded-xl bg-[#F7F6FA] hover:bg-[#EAE8F2] border border-black/5 flex items-center justify-center text-[#595F72] hover:text-[#1C1E26] transition-all cursor-pointer"
            title="Sinkronisasi Data"
            aria-label="Sinkronisasi Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#1D5E4D]" : ""}`} />
          </button>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
              <div className="w-8 h-8 rounded-xl bg-[#1C1E26] text-white flex items-center justify-center text-xs font-black shadow-xs">
                {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="hidden lg:block text-left">
                <p className="text-xs font-extrabold text-[#1C1E26] leading-tight truncate max-w-[110px]">
                  {currentUser.name}
                </p>
                <span className="text-[10px] font-bold text-[#595F72] tracking-wider uppercase">
                  {currentUser.role}
                </span>
              </div>

              {/* Refined Ghost Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-8 h-8 rounded-xl hover:bg-[#FCD9D7]/60 text-[#595F72] hover:text-[#852C28] flex items-center justify-center transition-all cursor-pointer"
                title="Keluar dari Akun"
                aria-label="Keluar dari Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
