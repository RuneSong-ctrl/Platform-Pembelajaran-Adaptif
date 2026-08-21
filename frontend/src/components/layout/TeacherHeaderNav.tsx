import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Sparkles,
  Award,
  MoreVertical,
  Users,
  ShieldCheck,
  Plus,
  BookOpen,
  CheckCircle2,
} from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

export default function TeacherHeaderNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
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
    <div className="bg-white border-b border-[rgba(28,30,38,0.06)] px-4 sm:px-6 lg:px-10 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Horizontal Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => audioSynth.playClickSound()}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  item.active
                    ? "clay-btn clay-btn-dark text-white font-black shadow-xs"
                    : "clay-pill clay-white text-[#5A5E70] hover:text-[#010105]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right 3-Dots Quick Action Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => {
              audioSynth.playClickSound();
              setMenuOpen(!menuOpen);
            }}
            className="clay-btn clay-btn-white w-8 h-8 rounded-full flex items-center justify-center text-[#5A5E70] hover:text-[#010105] cursor-pointer"
            title="Menu Tindakan Cepat Guru"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* 3-Dots Dropdown Popup Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl p-3 shadow-2xl border-2 border-white z-50 animate-in fade-in zoom-in-95 space-y-2">
              <div className="px-2 py-1 border-b border-black/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#9195A8] block">
                  Rombel Aktif
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-lg bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-[#010105]">
                    Biologi 10-A (32 Siswa)
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  to="/teacher/rag"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-2xl text-xs font-bold text-[#1C1E26] hover:bg-[#F8F9FD] transition-colors"
                >
                  <Database className="w-4 h-4 text-[#4B3B7A]" />
                  <span>Kelola Modul RAG</span>
                </Link>

                <Link
                  to="/teacher/quiz-generator"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-2xl text-xs font-bold text-[#1C1E26] hover:bg-[#F8F9FD] transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#694503]" />
                  <span>Generate Kuis Baru</span>
                </Link>

                <Link
                  to="/teacher/gradebook"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-2xl text-xs font-bold text-[#1C1E26] hover:bg-[#F8F9FD] transition-colors"
                >
                  <Award className="w-4 h-4 text-[#1D5E4D]" />
                  <span>Buku Nilai &amp; Minting</span>
                </Link>

                <Link
                  to="/student"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-2xl text-xs font-bold text-[#1C1E26] hover:bg-[#F8F9FD] transition-colors border-t border-black/5 pt-2"
                >
                  <BookOpen className="w-4 h-4 text-[#21518A]" />
                  <span>Lihat Tampilan Siswa</span>
                </Link>
              </div>

              <div className="clay-pill clay-mint p-2 text-[10px] font-extrabold text-[#1D5E4D] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>RAG Grounding Aktif</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
