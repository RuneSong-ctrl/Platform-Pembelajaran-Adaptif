import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Sparkles,
  Award,
  Users,
  ShieldCheck,
  MoreVertical,
  X,
  BookOpen,
} from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

export default function TeacherSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const links = [
    {
      href: "/teacher",
      label: "Command Center",
      icon: LayoutDashboard,
      active: pathname === "/teacher",
    },
    {
      href: "/teacher/rag",
      label: "Knowledge Base RAG",
      icon: Database,
      active: pathname === "/teacher/rag",
    },
    {
      href: "/teacher/quiz-generator",
      label: "AI Quiz Studio",
      icon: Sparkles,
      active: pathname === "/teacher/quiz-generator",
    },
    {
      href: "/teacher/gradebook",
      label: "Buku Nilai & Analytics",
      icon: Award,
      active: pathname === "/teacher/gradebook",
    },
  ];

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (sticky top-16, fixed h-[calc(100vh-4rem)], w-64) */}
      <aside className="hidden md:flex w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white/80 backdrop-blur-md border-r border-[rgba(28,30,38,0.06)] p-4 flex-col justify-between shadow-2xs z-20">
        <div className="space-y-6">
          {/* Header Title */}
          <div className="px-3 pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9195A8]">
              Portal Pengajar
            </span>
            <h2 className="text-sm font-black text-[#010105]">
              Menu Pengajar
            </h2>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
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
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Classroom Active Info */}
          <div className="clay-card clay-white p-3.5 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9195A8] block">
              Rombel Aktif
            </span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-[#010105] truncate">
                Biologi 10-A (32 Siswa)
              </span>
            </div>
          </div>
        </div>

        {/* Footer Grounding Badge */}
        <div className="clay-pill clay-mint p-3 text-[11px] font-extrabold text-[#1D5E4D] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="truncate">RAG Grounding Aktif</span>
        </div>
      </aside>

      {/* 2. MOBILE RESPONSIVE 3-DOTS ACTION BUTTON (Strictly md:hidden, does NOT take screen space) */}
      <div className="md:hidden fixed bottom-5 right-5 z-50" ref={menuRef}>
        <button
          onClick={() => {
            audioSynth.playClickSound();
            setMobileMenuOpen(!mobileMenuOpen);
          }}
          className="clay-btn clay-btn-dark w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer"
          title="Menu Cepat Guru (Titik 3)"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <MoreVertical className="w-5 h-5" />
          )}
        </button>

        {/* Mobile Popup Sheet */}
        {mobileMenuOpen && (
          <div className="absolute bottom-14 right-0 w-64 bg-white rounded-3xl p-3.5 shadow-2xl border-2 border-white space-y-2 animate-in fade-in slide-in-from-bottom-3 z-50">
            <div className="px-2 py-1 border-b border-black/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9195A8]">
                Menu Guru
              </span>
              <span className="clay-pill clay-mint text-[9px] font-extrabold text-[#1D5E4D] px-2 py-0.5">
                Biologi 10-A
              </span>
            </div>

            <nav className="space-y-1">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      audioSynth.playClickSound();
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                      item.active
                        ? "clay-btn clay-btn-dark text-white font-black"
                        : "text-[#1C1E26] hover:bg-[#F8F9FD]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="clay-pill clay-mint p-2 text-[10px] font-extrabold text-[#1D5E4D] flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>RAG Grounding Verified</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
