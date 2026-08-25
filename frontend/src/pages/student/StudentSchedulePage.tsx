import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Check,
  Eye,
  Headphones,
  FlaskConical,
  Sparkles,
  Volume2,
  BookOpen,
  Layers,
  X,
} from "@/components/ui/icons";


export default function StudentSchedulePage() {
  const navigate = useNavigate();
  const {
    currentUser,
    learningSchedules,
    addLearningSchedule,
    deleteLearningSchedule,
    toggleLearningSchedule,
  } = useApp();

  const style = currentUser.learningStyle || "VISUAL";

  // Filter state
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("Semua");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");

  // Modal State
  const currentDayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()];
  const [modalOpen, setModalOpen] = useState(false);
  const [day, setDay] = useState(currentDayName);
  const [time, setTime] = useState("16:00 - 16:30");
  const [duration, setDuration] = useState("30 mnt");
  const [title, setTitle] = useState("");
  const [specificFormat, setSpecificFormat] = useState(
    style === "AUDITORI"
      ? "Podcast Pembelajaran"
      : style === "KINESTETIK"
      ? "Lab Simulasi Interaktif"
      : "Diagram & Bagan Interaktif"
  );

  // Modality-specific format options
  const getFormatOptions = () => {
    switch (style) {
      case "AUDITORI":
        return [
          { id: "Podcast Pembelajaran", label: "Podcast Pembelajaran", icon: Headphones, formatType: "Audio" as const },
          { id: "Rangkuman Suara (TTS)", label: "Rangkuman Suara (TTS)", icon: Volume2, formatType: "Audio" as const },
          { id: "Kuis Evaluasi Audio DDA", label: "Kuis Evaluasi Audio DDA", icon: Sparkles, formatType: "Kuis" as const },
        ];
      case "KINESTETIK":
        return [
          { id: "Lab Simulasi Interaktif", label: "Lab Simulasi Interaktif", icon: FlaskConical, formatType: "Praktik" as const },
          { id: "Eksperimen Kasus Mandiri", label: "Eksperimen Kasus Mandiri", icon: BookOpen, formatType: "Praktik" as const },
          { id: "Kuis Evaluasi Praktik DDA", label: "Kuis Evaluasi Praktik DDA", icon: Sparkles, formatType: "Kuis" as const },
        ];
      case "VISUAL":
      default:
        return [
          { id: "Diagram & Bagan Interaktif", label: "Diagram & Bagan Interaktif", icon: Eye, formatType: "Visual" as const },
          { id: "Infografis & Video Visual", label: "Infografis & Video Visual", icon: Layers, formatType: "Visual" as const },
          { id: "Kuis Evaluasi Visual DDA", label: "Kuis Evaluasi Visual DDA", icon: Sparkles, formatType: "Kuis" as const },
        ];
    }
  };

  const formatOptions = getFormatOptions();

  const handleSave = () => {
    if (!title.trim()) return;
    audioSynth.playSuccessSound();

    const matchedOption = formatOptions.find((o) => o.id === specificFormat);

    addLearningSchedule({
      studentId: currentUser.id,
      day,
      time,
      duration,
      title: title.trim(),
      format: matchedOption?.formatType || "Visual",
      completed: false,
    });

    setTitle("");
    setModalOpen(false);
  };

  const studentSchedules = learningSchedules.filter(
    (s) => s.studentId === currentUser.id
  );

  const filteredSchedules = studentSchedules.filter((sch) => {
    if (selectedDayFilter !== "Semua" && sch.day !== selectedDayFilter) return false;
    if (statusFilter === "active" && sch.completed) return false;
    if (statusFilter === "completed" && !sch.completed) return false;
    return true;
  });

  const completedCount = studentSchedules.filter((s) => s.completed).length;

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col pb-24 md:pb-8">
      <Navbar />

      <div className="flex flex-1 w-full">
        <StudentSidebar />

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 min-w-0 flex flex-col gap-5">
        {/* Top Back Navigation & Add Button */}
        <div className="flex items-center justify-between">
          <Link
            to="/student"
            onClick={() => audioSynth.playClickSound()}
            className="clay-pill clay-white inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Beranda</span>
          </Link>

          <button
            onClick={() => {
              audioSynth.playClickSound();
              setModalOpen(true);
            }}
            className="clay-btn clay-btn-dark px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Jadwal</span>
          </button>
        </div>

        {/* Page Title & Progress Overview */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="clay-pill clay-lavender text-[10px] font-extrabold px-3 py-0.5 text-[#4B3B7A]">
              Self-Regulated Learning
            </span>
            <span className="clay-pill clay-mint text-[10px] font-bold text-[#1D5E4D] px-3 py-0.5">
              {completedCount}/{studentSchedules.length} Selesai
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#010105]">
            Jadwal Belajar Mandiri
          </h1>
          <p className="text-xs text-[#5A5E70] font-medium mt-0.5">
            Rencanakan komitmen belajarmu dengan format materi terkhusus gaya belajarmu.
          </p>
        </div>

        {/* Day Selector Strip in Clay Pills (Expanded, No Cut-off) */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {["Semua", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((d) => (
            <button
              key={d}
              onClick={() => {
                audioSynth.playClickSound();
                setSelectedDayFilter(d);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedDayFilter === d
                  ? "clay-btn clay-btn-dark text-white font-bold shadow-xs"
                  : "clay-pill clay-white text-[#5A5E70] hover:text-[#010105]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8]">
            Daftar Target ({filteredSchedules.length})
          </span>

          <div className="clay-pill bg-[#F0EEF6] p-1 flex items-center gap-1 text-[10px] font-bold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                statusFilter === "all" ? "clay-btn clay-btn-dark text-white" : "text-[#5A5E70]"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                statusFilter === "active" ? "clay-btn clay-btn-dark text-white" : "text-[#5A5E70]"
              }`}
            >
              Belum
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                statusFilter === "completed" ? "clay-btn clay-btn-dark text-white" : "text-[#5A5E70]"
              }`}
            >
              Selesai
            </button>
          </div>
        </div>

        {/* Schedule Items List */}
        <div className="space-y-3">
          {filteredSchedules.map((sch) => (
            <div
              key={sch.id}
              className={`clay-card clay-card-hover p-4 sm:p-5 flex items-start justify-between gap-3 ${
                sch.completed
                  ? "bg-[#F8F9FD] opacity-70"
                  : "clay-white"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* 3D Tactile Clay Checkbox */}
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    toggleLearningSchedule(sch.id);
                  }}
                  className={`clay-checkbox shrink-0 mt-0.5 ${
                    sch.completed ? "clay-checkbox-checked" : ""
                  }`}
                  title={sch.completed ? "Tandai Belum Selesai" : "Tandai Selesai"}
                >
                  {sch.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="clay-pill clay-lavender text-[9px] font-extrabold px-2.5 py-0.5 text-[#4B3B7A]">
                      {sch.day}
                    </span>
                    <span className="text-[10px] text-[#5A5E70] font-semibold flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {sch.time} ({sch.duration})
                    </span>
                    <span className="clay-pill clay-mint text-[9px] font-extrabold px-2.5 py-0.5 text-[#1D5E4D]">
                      {sch.format}
                    </span>
                  </div>

                  <h3 className={`text-xs sm:text-sm font-black ${sch.completed ? "line-through text-[#9195A8]" : "text-[#010105]"}`}>
                    {sch.title}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    deleteLearningSchedule(sch.id);
                  }}
                  className="clay-btn clay-btn-white w-8 h-8 rounded-xl text-[#9195A8] hover:text-[#ba1a1a] flex items-center justify-center transition-colors cursor-pointer"
                  title="Hapus Jadwal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredSchedules.length === 0 && (
            <div className="clay-card clay-white p-8 text-center text-xs text-[#5A5E70] space-y-1">
              <p className="font-bold">Tidak ada jadwal belajar pada kategori ini.</p>
              <p className="text-[11px] text-[#9195A8]">Klik tombol Tambah Jadwal untuk menyusun target belajarmu.</p>
            </div>
          )}
        </div>
      </main>
    </div>

      {/* INSTANT CLAY CREATE SCHEDULE MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="clay-card bg-white rounded-[26px] p-5 sm:p-6 border border-white max-w-xs sm:max-w-md w-full shadow-[0_12px_28px_rgba(28,30,38,0.08),inset_2px_2px_4px_#fff,inset_-2px_-2px_5px_rgba(0,0,0,0.03)] flex flex-col gap-3 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[#5A5E70] clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-base font-black text-[#1C1E26]">
                Buat Rencana Belajar Baru
              </h3>
              <p className="text-xs text-[#5A5E70] mt-0.5">
                Pilih format terkhusus gaya belajar {style === "AUDITORI" ? "Auditori" : style === "KINESTETIK" ? "Kinestetik" : "Visual"} kamu.
              </p>
            </div>

            <div className="space-y-3 my-1">
              {/* Day Selector */}
              <div>
                <label className="block text-xs font-bold text-[#1C1E26] mb-1">
                  Pilih Hari Belajar
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDay(d)}
                      className={`py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                        day === d
                          ? "clay-btn clay-btn-dark text-white font-bold scale-102"
                          : "clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#5A5E70] hover:text-[#1C1E26]"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time & Duration */}
              <div>
                <label className="block text-xs font-bold text-[#1C1E26] mb-1">
                  Waktu &amp; Durasi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1 rounded-2xl bg-[#F7F6FA] border border-white shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.04)]">
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="Misal: 16:00 - 16:30"
                      className="w-full rounded-xl text-xs font-medium bg-transparent border-0 outline-none px-2 py-1.5 text-[#1C1E26]"
                    />
                  </div>
                  <div className="p-1 rounded-2xl bg-[#F7F6FA] border border-white shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.04)]">
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Misal: 30 mnt"
                      className="w-full rounded-xl text-xs font-medium bg-transparent border-0 outline-none px-2 py-1.5 text-[#1C1E26]"
                    />
                  </div>
                </div>
              </div>

              {/* Topic Title */}
              <div>
                <label className="block text-xs font-bold text-[#1C1E26] mb-1">
                  Topik / Materi Target
                </label>
                <div className="p-1 rounded-2xl bg-[#F7F6FA] border border-white shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.04)]">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Belajar Modul & Latihan Mandiri"
                    className="w-full rounded-xl text-xs font-medium bg-transparent border-0 outline-none px-2 py-1.5 text-[#1C1E26]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Format Khusus per Modalitas */}
              <div>
                <label className="block text-xs font-bold text-[#1C1E26] mb-1">
                  Format Khusus Pembelajaran
                </label>
                <div className="space-y-1.5">
                  {formatOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = specificFormat === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSpecificFormat(opt.id)}
                        className={`w-full p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? "clay-btn clay-btn-dark text-white font-bold"
                            : "clay-card bg-[#FCFBFE] border-white text-[#1C1E26] hover:scale-[1.01]"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? "clay-pill bg-white/20 text-white" : "clay-pill clay-lavender text-[#4B3B7A]"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-extrabold truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
              <button
                onClick={() => setModalOpen(false)}
                className="clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] px-4 py-2 text-xs font-extrabold cursor-pointer transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className={`clay-btn px-4 py-2 text-xs font-extrabold ${
                  title.trim()
                    ? "clay-btn-dark text-white cursor-pointer shadow-sm active:scale-95"
                    : "bg-[#E4E2DD] text-[#9195A8] cursor-not-allowed"
                }`}
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>

  );
}
