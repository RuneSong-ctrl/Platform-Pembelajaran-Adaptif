import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Layers,
  Bot,
  School,
  UserCircle,
} from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="fixed bottom-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-full px-4 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4 shadow-[0_12px_32px_rgba(28,30,38,0.14)] border border-[rgba(28,30,38,0.08)] max-w-sm sm:max-w-md w-full relative">
        {/* Tab 1: Home */}
        <Link
          to="/student"
          onClick={() => audioSynth.playClickSound()}
          className={`flex flex-col items-center justify-center p-1 transition-all rounded-2xl flex-1 ${
            pathname === "/student"
              ? "text-[#1C1E26] scale-105 font-extrabold"
              : "text-[#9195A8] hover:text-[#1C1E26]"
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              pathname === "/student" ? "bg-[#E3DBF8] text-[#4B3B7A]" : ""
            }`}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </Link>

        {/* Tab 2: Materi */}
        <Link
          to="/student/learn"
          onClick={() => audioSynth.playClickSound()}
          className={`flex flex-col items-center justify-center p-1 transition-all rounded-2xl flex-1 ${
            pathname.startsWith("/student/learn")
              ? "text-[#1C1E26] scale-105 font-extrabold"
              : "text-[#9195A8] hover:text-[#1C1E26]"
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              pathname.startsWith("/student/learn") ? "bg-[#D1EBE1] text-[#1D5E4D]" : ""
            }`}
          >
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Materi</span>
        </Link>

        {/* Center Raised Floating 3D AI Assistant Button */}
        <div className="relative -top-4 px-1">
          <Link
            to="/student/ai"
            onClick={() => audioSynth.playClickSound()}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shadow-[0_10px_22px_rgba(59,130,246,0.4)] border-2 border-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white ${
              pathname.startsWith("/student/ai") ? "ring-3 ring-[#3B82F6]/50" : ""
            }`}
            title="Asisten Belajar AI"
          >
            <Bot className="w-6 h-6 stroke-[2.3] transition-transform duration-200" />
          </Link>
        </div>

        {/* Tab 3: Kelas */}
        <Link
          to="/student/class"
          onClick={() => audioSynth.playClickSound()}
          className={`flex flex-col items-center justify-center p-1 transition-all rounded-2xl flex-1 ${
            pathname.startsWith("/student/class")
              ? "text-[#1C1E26] scale-105 font-extrabold"
              : "text-[#9195A8] hover:text-[#1C1E26]"
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              pathname.startsWith("/student/class") ? "bg-[#FEE7B3] text-[#785308]" : ""
            }`}
          >
            <School className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Kelas</span>
        </Link>

        {/* Tab 4: Profil */}
        <Link
          to="/student/profile"
          onClick={() => audioSynth.playClickSound()}
          className={`flex flex-col items-center justify-center p-1 transition-all rounded-2xl flex-1 ${
            pathname.startsWith("/student/profile")
              ? "text-[#1C1E26] scale-105 font-extrabold"
              : "text-[#9195A8] hover:text-[#1C1E26]"
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-colors ${
              pathname.startsWith("/student/profile") ? "bg-[#FCD9D7] text-[#852C28]" : ""
            }`}
          >
            <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-bold mt-0.5">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
