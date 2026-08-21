import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Sparkles,
  Award,
  Users,
  ShieldCheck,
} from "@/components/ui/icons";

export default function TeacherSidebar() {
  const location = useLocation();
  const pathname = location.pathname;

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
    <aside className="w-64 bg-white border-r border-[rgba(28,30,38,0.06)] min-h-[calc(100vh-4rem)] p-4 hidden md:flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9195A8] px-3">
            Menu Manajemen Guru
          </span>
          <nav className="mt-2 space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    item.active
                      ? "bg-[#1C1E26] text-white shadow-xs"
                      : "text-[#5A5E70] hover:bg-[#FBF9F4] hover:text-[#010105]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Classroom Quick Selector */}
        <div className="p-3.5 rounded-2xl bg-[#FBF9F4] border border-[rgba(28,30,38,0.06)] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9195A8] block">
            Rombel Aktif
          </span>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1D5E4D]" />
            <span className="text-xs font-bold text-[#010105]">Biologi 10-A (32 Siswa)</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 rounded-2xl bg-[#D1EBE1] border border-[rgba(29,94,77,0.15)] text-[11px] font-bold text-[#1D5E4D] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>RAG Grounding Aktif (Zero Hallucination)</span>
      </div>
    </aside>
  );
}
