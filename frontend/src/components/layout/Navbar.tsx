import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import LogoutConfirmDialog from "@/components/common/LogoutConfirmDialog";
import { audioSynth } from "@/services/audioSynth";
import {
  Flame,
  Star,
  LogOut,
  RefreshCw,
} from "@/components/ui/icons";

export default function Navbar() {
  const { currentUser, triggerSync, isSyncing } = useApp();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    audioSynth.playClickSound();
    setConfirmLogout(true);
  };

  const isStudent = currentUser?.role === "SISWA";
  const isTeacher = currentUser?.role === "GURU";
  const isParent = currentUser?.role === "ORTU";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[rgba(28,30,38,0.08)] shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
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

        {/* Right Section: Cohesive Metrics, User Avatar & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Siswa Stats: Single Unified High-End Capsule */}
          {isStudent && (
            <div className="hidden sm:flex items-center gap-2.5 bg-[#F7F6FA] px-3 py-1.5 rounded-2xl border border-[rgba(28,30,38,0.06)] shadow-inner text-xs font-extrabold text-[#1C1E26]">
              <span
                className="flex items-center gap-1 text-[#785308]"
                title="Streak Hari Belajar"
              >
                <Flame className="w-3.5 h-3.5 fill-[#785308] text-[#785308]" />
                <span>{mounted ? currentUser?.streakDays || 1 : 1}d</span>
              </span>
              <span className="w-1 h-1 rounded-full bg-black/20" />
              <span
                className="flex items-center gap-1 text-[#1D5E4D]"
                title="Total XP Terkumpul"
              >
                <Star className="w-3.5 h-3.5 fill-[#1D5E4D] text-[#1D5E4D]" />
                <span>{mounted ? currentUser?.xpTotal || 0 : 0} XP</span>
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
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#1D5E4D]" : ""}`}
            />
          </button>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
              <div className="w-8 h-8 rounded-xl bg-[#1C1E26] text-white flex items-center justify-center text-xs font-black shadow-xs overflow-hidden shrink-0">
                {currentUser.avatar &&
                (currentUser.avatar.startsWith("data:image") ||
                  currentUser.avatar.startsWith("http")) ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {currentUser.avatar ||
                      currentUser.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="hidden lg:block text-left">
                <p className="text-xs font-extrabold text-[#1C1E26] leading-tight truncate max-w-[110px]">
                  {currentUser.name}
                </p>
                <span className="text-mini font-bold text-[#595F72] tracking-wider uppercase">
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
      <LogoutConfirmDialog open={confirmLogout} onOpenChange={setConfirmLogout} />
    </header>
  );
}
