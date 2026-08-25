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
} from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

export default function StudentSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { currentUser } = useApp();
  const style = currentUser?.learningStyle;

  const getSidebarGradient = () => {
    if (style === "AUDITORI") return "from-[#B7A9F3]/50 via-[#E3DBF8]/25 to-transparent";
    if (style === "KINESTETIK") return "from-[#F9CF80]/50 via-[#FDF0CD]/25 to-transparent";
    return "from-[#9DE1CA]/60 via-[#D1EBE1]/30 to-transparent";
  };

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
    <aside className="w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white/80 backdrop-blur-md border-r border-[rgba(28,30,38,0.06)] p-3.5 hidden md:flex flex-col justify-between z-20 relative overflow-hidden">
      {/* Subtle Sidebar Top Ambient Gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-44 bg-gradient-to-b ${getSidebarGradient()} pointer-events-none transition-all duration-500`}
        aria-hidden="true"
      />

      <div className="space-y-4 relative z-10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#9195A8] px-3 block mb-2">
            Menu Utama
          </span>
          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => audioSynth.playClickSound()}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    item.active
                      ? "bg-[#1C1E26] text-white shadow-xs"
                      : "text-[#595F72] hover:bg-[#F0EEF6]/70 hover:text-[#1C1E26]"
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

      {/* Subtle Platform Version */}
      <div className="px-3 py-2 text-[10px] font-bold text-[#A5A8B8] border-t border-black/5">
        EduAdapt K-12 Engine v2.4
      </div>
    </aside>
  );
}
