import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import {
  BookOpen,
  Layers,
  Bot,
  School,
  Calendar,
  TrendingUp,
  User,
  Flame,
  Star,
  Sparkles,
  Eye,
  Headphones,
  FlaskConical,
} from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

export default function StudentSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { currentUser } = useApp();

  const style = currentUser.learningStyle || "VISUAL";

  const links = [
    {
      href: "/student",
      label: "Beranda Belajar",
      icon: BookOpen,
      active: pathname === "/student",
    },
    {
      href: "/student/learn",
      label: "Materi Adaptif",
      icon: Layers,
      active: pathname.startsWith("/student/learn"),
    },
    {
      href: "/student/ai",
      label: "Asisten AI Tutor",
      icon: Bot,
      active: pathname.startsWith("/student/ai"),
    },
    {
      href: "/student/class",
      label: "Ruang Kelas",
      icon: School,
      active: pathname.startsWith("/student/class"),
    },
    {
      href: "/student/schedule",
      label: "Jadwal Mandiri",
      icon: Calendar,
      active: pathname.startsWith("/student/schedule"),
    },
    {
      href: "/student/status",
      label: "Status & Analitik",
      icon: TrendingUp,
      active: pathname.startsWith("/student/status"),
    },
    {
      href: "/student/profile",
      label: "Profil & Paspor",
      icon: User,
      active: pathname.startsWith("/student/profile"),
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[rgba(28,30,38,0.06)] min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col justify-between shrink-0 shadow-2xs">
      <div className="space-y-6">
        {/* Student Profile Quick Card */}
        <div className="clay-card clay-white p-3.5 space-y-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                style === "AUDITORI"
                  ? "clay-card clay-lavender text-[#4B3B7A]"
                  : style === "KINESTETIK"
                  ? "clay-card clay-butter text-[#785308]"
                  : "clay-card clay-mint text-[#1D5E4D]"
              }`}
            >
              {style === "AUDITORI" ? (
                <Headphones className="w-5 h-5" />
              ) : style === "KINESTETIK" ? (
                <FlaskConical className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9195A8] block">
                Modalitas {style.charAt(0) + style.slice(1).toLowerCase()}
              </span>
              <h3 className="text-xs font-black text-[#010105] truncate">
                {currentUser.name}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 text-center">
            <div className="clay-pill clay-butter px-2 py-1 flex items-center justify-center gap-1 text-[#694503]">
              <Flame className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-black">{currentUser.streakDays || 14} Hari</span>
            </div>
            <div className="clay-pill clay-sky px-2 py-1 flex items-center justify-center gap-1 text-[#174272]">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-black">{currentUser.xpTotal || 450} XP</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#9195A8] px-3">
            Navigasi Siswa
          </span>
          <nav className="mt-2 space-y-1.5">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => audioSynth.playClickSound()}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    item.active
                      ? "clay-btn clay-btn-dark text-white font-black shadow-xs"
                      : "text-[#5A5E70] hover:bg-[#F8F9FD] hover:text-[#010105]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Level Info */}
      <div className="clay-pill clay-mint p-3 text-[11px] font-extrabold text-[#1D5E4D] flex items-center gap-2">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>Level 2 DDA Adaptif Aktif</span>
      </div>
    </aside>
  );
}
