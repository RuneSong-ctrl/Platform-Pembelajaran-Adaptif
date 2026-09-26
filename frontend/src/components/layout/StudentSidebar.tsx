import React, { useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
} from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

export default function StudentSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { currentUser } = useApp();
  const style = currentUser?.learningStyle;
  // Remembered per browser so it stays collapsed across page navigation.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("studentSidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });
  const toggleCollapsed = () => {
    audioSynth.playClickSound();
    setCollapsed((v) => {
      try {
        localStorage.setItem("studentSidebarCollapsed", v ? "0" : "1");
      } catch {
        // storage blocked: collapse still works until next page
      }
      return !v;
    });
  };

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
      href: "/student/class",
      label: "Ruang Kelas",
      icon: School,
      active: pathname.startsWith("/student/class"),
    },
    {
      href: "/student/ai",
      label: "Asisten AI Tutor",
      icon: Bot,
      active: pathname.startsWith("/student/ai"),
    },
    {
      href: "/student/learn",
      label: "Materi Adaptif",
      icon: Layers,
      active: pathname.startsWith("/student/learn"),
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
      active: pathname.startsWith("/student/profile") || pathname.startsWith("/passport"),
    },
  ];

  return (
    <aside className={`${collapsed ? "w-[76px]" : "w-64"} shrink-0 h-full overflow-y-auto overflow-x-hidden bg-white/80 backdrop-blur-md border-r border-[rgba(28,30,38,0.06)] p-3.5 hidden md:flex flex-col justify-between z-20 relative transition-[width] duration-200 ease-out`}>
      {/* Subtle Sidebar Top Ambient Gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-44 bg-gradient-to-b ${getSidebarGradient()} pointer-events-none transition-all duration-500`}
        aria-hidden="true"
      />

      <div className="space-y-4 relative z-10">
        <div>
          <div className={`flex items-center mb-2 ${collapsed ? "justify-center" : "justify-between"}`}>
            {!collapsed && (
              <span className="text-mini font-black uppercase tracking-wider text-[#9195A8] px-3 whitespace-nowrap">
                Menu Utama
              </span>
            )}
          <button
            onClick={toggleCollapsed}
            className="w-10 h-10 shrink-0 rounded-xl text-[#595F72] hover:bg-[#F0EEF6] hover:text-[#1C1E26] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B7A]/40"
            aria-label={collapsed ? "Perlebar menu" : "Ciutkan menu"}
            aria-expanded={!collapsed}
            title={collapsed ? "Perlebar menu" : "Ciutkan menu"}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          </div>
          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => audioSynth.playClickSound()}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={item.active ? "page" : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl whitespace-nowrap text-xs font-extrabold transition-all cursor-pointer ${
                    item.active
                      ? "bg-[#1C1E26] text-white shadow-xs"
                      : "text-[#595F72] hover:bg-[#F0EEF6]/70 hover:text-[#1C1E26]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Subtle Platform Version */}
      {!collapsed && (
        <div className="relative z-10 px-3 py-2 text-mini font-bold text-[#A5A8B8] border-t border-black/5 whitespace-nowrap truncate">
          EduAdapt K-12 Engine v2.4
        </div>
      )}
    </aside>
  );
}
