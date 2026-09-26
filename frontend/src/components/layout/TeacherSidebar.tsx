import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Sparkles,
  Award,
  MoreVertical,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

export default function TeacherSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Remembered per browser so it stays collapsed across page navigation.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("teacherSidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });
  const toggleCollapsed = () => {
    audioSynth.playClickSound();
    setCollapsed((v) => {
      try {
        localStorage.setItem("teacherSidebarCollapsed", v ? "0" : "1");
      } catch {
        // storage blocked: collapse still works until next page
      }
      return !v;
    });
  };

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
      label: "Beranda",
      icon: LayoutDashboard,
      active: pathname === "/teacher",
    },
    {
      href: "/teacher/rag",
      label: "Materi Ajar",
      icon: Database,
      active: pathname === "/teacher/rag",
    },
    {
      href: "/teacher/quiz-generator",
      label: "Studio Kuis AI",
      icon: Sparkles,
      active: pathname === "/teacher/quiz-generator",
    },
    {
      href: "/teacher/gradebook",
      label: "Buku Nilai",
      icon: Award,
      active: pathname === "/teacher/gradebook",
    },
  ];

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (collapsible to an icon rail) */}
      <aside
        className={`hidden md:flex ${collapsed ? "w-[76px]" : "w-64"} shrink-0 h-full overflow-y-auto overflow-x-hidden bg-white/80 backdrop-blur-md border-r border-[rgba(28,30,38,0.06)] p-3.5 flex-col shadow-2xs z-20 transition-[width] duration-200 ease-out`}
      >
        <div className={`flex items-center mb-3 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <span className="px-3 text-mini font-black uppercase tracking-wider text-[#9195A8] whitespace-nowrap">
              Menu Pengajar
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl whitespace-nowrap text-xs font-extrabold transition-all ${
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
      </aside>

      {/* 2. MOBILE RESPONSIVE 3-DOTS ACTION BUTTON (Strictly md:hidden, does NOT take screen space) */}
      <div className="md:hidden fixed bottom-5 right-5 z-50" ref={menuRef}>
        <button
          onClick={() => {
            audioSynth.playClickSound();
            setMobileMenuOpen(!mobileMenuOpen);
          }}
          className="clay-btn clay-btn-dark w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer"
          title="Menu Pengajar"
          aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={mobileMenuOpen}
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
            <div className="px-2 py-1 border-b border-black/5">
              <span className="text-mini font-black uppercase tracking-wider text-[#9195A8]">
                Menu Pengajar
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

          </div>
        )}
      </div>
    </>
  );
}
