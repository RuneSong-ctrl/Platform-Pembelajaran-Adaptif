import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import { audioSynth } from "@/services/audioSynth";
import {
  Brain,
  Clock,
  MessageSquare,
  Sparkles,
  Calendar,
  Check,
  Flame,
  ArrowRight,
} from "@/components/ui/icons";

export default function ParentPortalPage() {
  const {
    users,
    notes,
    learningSchedules,
    selectedParentChildId,
    setSelectedParentChildId,
  } = useApp();

  const [mobileTab, setMobileTab] = useState<"overview" | "consultation">("overview");

  const studentChildren = users.filter((u) => u.role === "SISWA");
  const selectedChild =
    studentChildren.find((u) => u.id === selectedParentChildId) || studentChildren[0] || users[0];

  // Notes related to this child
  const childNotes = notes
    .filter((n) => n.studentId === selectedChild.id)
    .slice()
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  const latestNote = childNotes[0];

  const childSchedules = learningSchedules.filter(
    (s) => s.studentId === selectedChild.id
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] pb-16 relative overflow-hidden">
      {/* Soft Ambient Modality Top Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#E3DBF8]/50 via-[#D1EBE1]/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <Navbar />
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-8 space-y-5 sm:space-y-7 relative z-10">
        {/* 1. TOP HEADER & CHILD SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="clay-pill clay-mint px-2.5 py-0.5 text-[11px] font-extrabold text-[#1D5E4D] shadow-2xs">
                Portal Orang Tua
              </span>
              <span className="clay-pill clay-lavender px-2.5 py-0.5 text-[11px] font-bold text-[#4B3B7A] shadow-2xs">
                Laporan Perkembangan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1C1E26] tracking-tight">
              Perkembangan Belajar &amp; Kognitif Anak
            </h1>
            <p className="text-xs text-[#5A5E70] font-medium mt-0.5">
              Pantau kemajuan kurikulum adaptif, kebiasaan belajar mandiri, dan konsultasi dengan wali kelas.
            </p>
          </div>

          {/* Child Switcher Pills (Scales gracefully for 1, 2, 3, or more children) */}
          <div className="clay-card clay-white p-1.5 flex items-center gap-1.5 self-start sm:self-auto shadow-2xs rounded-2xl border border-white max-w-full overflow-x-auto no-scrollbar">
            {studentChildren.map((child) => {
              const isSelected = selectedChild.id === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => {
                    audioSynth.playClickSound();
                    setSelectedParentChildId(child.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? "clay-btn clay-btn-dark text-white shadow-xs scale-102"
                      : "text-[#5A5E70] hover:text-[#1C1E26]"
                  }`}
                >
                  {child.name} (Kelas {child.grade || 10}-A)
                </button>
              );
            })}
          </div>
        </div>


        {/* 2. AI NARRATIVE PROGRESS SUMMARY (Clay Mint Hero Card) */}
        <div className="clay-card clay-mint p-4 sm:p-6 space-y-3 rounded-[28px] border border-white/80 shadow-[0_12px_28px_rgba(29,94,77,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#1D5E4D] flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5 text-[#1D5E4D]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0E3D31]">
                  Ringkasan Naratif AI untuk Orang Tua
                </h3>
                <span className="text-[11px] text-[#1D5E4D] font-bold">
                  Siswa: {selectedChild.name} • Kelas 10-A
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="clay-pill bg-white text-[10px] font-black text-[#1D5E4D] px-3 py-1 flex items-center gap-1 shadow-2xs">
                <Flame className="w-3.5 h-3.5 fill-[#1D5E4D]" />
                <span>{selectedChild.streakDays || 14} Hari Aktif</span>
              </span>
              <span className="clay-pill bg-white text-[10px] font-black text-[#21518A] px-3 py-1 shadow-2xs">
                {selectedChild.xpTotal || 450} XP
              </span>
            </div>
          </div>

          <p className="text-xs text-[#082921] font-medium leading-relaxed bg-white/70 p-3 sm:p-4 rounded-2xl border border-white">
            Minggu ini, <strong>{selectedChild.name}</strong> menunjukkan penguasaan sangat baik pada topik <em>Fisiologi Sistem Pencernaan &amp; Enzim</em> dengan akurasi kuis adaptif DDA <strong>82%</strong> dan modalitas dominan <strong>Visual ({selectedChild.modalityScores?.visual || 80}%)</strong>. Rekomendasi: Berikan apresiasi atas konsistensi belajar mandiri selama {selectedChild.streakDays || 14} hari berturut-turut.
          </p>
        </div>

        {/* 3. SEGMENTED SLIDER CONTROL (Mobile Only) */}
        <div className="grid grid-cols-2 gap-1 bg-[#ECE9F2] p-1.5 rounded-2xl w-full max-w-xs mx-auto md:hidden shadow-inner">
          <button
            onClick={() => {
              audioSynth.playClickSound();
              setMobileTab("overview");
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === "overview"
                ? "bg-white text-[#1C1E26] shadow-xs font-black"
                : "text-[#5A5E70] hover:text-[#1C1E26]"
            }`}
          >
            <Brain className="w-3.5 h-3.5 shrink-0" />
            <span>Penguasaan</span>
          </button>

          <button
            onClick={() => {
              audioSynth.playClickSound();
              setMobileTab("consultation");
            }}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === "consultation"
                ? "bg-[#1C1E26] text-white shadow-xs font-black"
                : "text-[#4B3B7A] font-extrabold"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Konsultasi</span>
          </button>
        </div>

        {/* 4. MAIN CONTENT: 2-COLUMN GRID ON DESKTOP, MODERN TABBED ON MOBILE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
          {/* LEFT SECTION (7 cols on desktop): TOPIC MASTERY & DIGITAL WELLBEING */}
          <div
            className={`lg:col-span-7 space-y-5 ${
              mobileTab !== "overview" ? "hidden md:block" : ""
            }`}
          >
            {/* Topic Mastery Progress (Clay Card) */}
            <div className="clay-card clay-white rounded-[28px] p-5 sm:p-6 border border-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#1C1E26] flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#4B3B7A]" />
                    <span>Penguasaan Topik Kurikulum Adaptif</span>
                  </h3>
                  <p className="text-[11px] text-[#5A5E70] mt-0.5">
                    Progres pemahaman per materi berdasarkan evaluasi DDA real-time.
                  </p>
                </div>
                <span className="clay-pill clay-lavender text-[9px] font-extrabold px-2.5 py-1 text-[#4B3B7A] shadow-2xs">
                  Biologi 10
                </span>
              </div>

              <div className="space-y-3.5 pt-1">
                <div className="p-3 rounded-2xl bg-[#E6F5EE] border border-[#C7EAD9]/80 shadow-2xs">
                  <div className="flex justify-between text-xs font-black text-[#0E3D31] mb-1.5">
                    <span>Biologi: Sistem Pencernaan &amp; Reaksi Enzim</span>
                    <span className="text-[#1D5E4D]">95% (Mastery)</span>
                  </div>
                  <div className="w-full bg-white/70 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                    <div className="bg-[#1D5E4D] h-full rounded-full w-[95%] transition-all duration-500 shadow-xs"></div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#EFEAFB] border border-[#D8CDF8]/80 shadow-2xs">
                  <div className="flex justify-between text-xs font-black text-[#2D2152] mb-1.5">
                    <span>Biologi: Ekosistem &amp; Daur Energi</span>
                    <span className="text-[#4B3B7A]">78% (Challenging)</span>
                  </div>
                  <div className="w-full bg-white/70 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                    <div className="bg-[#4B3B7A] h-full rounded-full w-[78%] transition-all duration-500 shadow-xs"></div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#FFF4DC] border border-[#FCE0A2]/80 shadow-2xs">
                  <div className="flex justify-between text-xs font-black text-[#4A3205] mb-1.5">
                    <span>Matematika: Aljabar &amp; Statistik Dasar</span>
                    <span className="text-[#785308]">65% (Perlu Penguatan)</span>
                  </div>
                  <div className="w-full bg-white/70 h-2.5 rounded-full overflow-hidden shadow-inner p-0.5">
                    <div className="bg-[#785308] h-full rounded-full w-[65%] transition-all duration-500 shadow-xs"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Wellbeing Tracker (Clay Card) */}
            <div className="clay-card clay-white rounded-[28px] p-5 sm:p-6 border border-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#1C1E26] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1D5E4D]" />
                    <span>Pola Waktu Belajar &amp; Istirahat (Digital Wellbeing)</span>
                  </h3>
                  <p className="text-[11px] text-[#5A5E70] mt-0.5">
                    Monitoring screen time edukatif vs waktu jeda istirahat siswa.
                  </p>
                </div>
                <span className="clay-pill clay-mint text-[9px] font-extrabold px-2.5 py-1 text-[#1D5E4D] shadow-2xs">
                  Optimal
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="clay-pill bg-[#F8F9FD] p-3.5 space-y-0.5 border border-white">
                  <span className="text-[10px] text-[#5A5E70] font-bold block">Waktu Belajar</span>
                  <span className="text-xl font-black text-[#1C1E26] block">42 Menit</span>
                  <span className="text-[9px] text-[#1D5E4D] font-bold block">Sesuai Panduan</span>
                </div>
                <div className="clay-pill bg-[#F8F9FD] p-3.5 space-y-0.5 border border-white">
                  <span className="text-[10px] text-[#5A5E70] font-bold block">Status Layar</span>
                  <span className="text-xl font-black text-[#1D5E4D] block">Seimbang</span>
                  <span className="text-[9px] text-[#5A5E70] font-bold block">Jeda 10 Mnt Terpenuhi</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION (5 cols on desktop): KONSULTASI WALI KELAS DIRECT CTA & JADWAL */}
          <div
            className={`lg:col-span-5 space-y-5 ${
              mobileTab !== "consultation" ? "hidden md:block" : ""
            }`}
          >
            {/* 1. KONSULTASI WALI KELAS DIRECT CTA CARD (Clay Lavender) */}
            <div className="clay-card clay-lavender rounded-[28px] p-5 border border-[#E3DBF8] shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white text-[#4B3B7A] font-black text-sm flex items-center justify-center shrink-0 shadow-xs border border-white">
                    GW
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-[#2D2152] truncate">
                        Bpk. Gunawan, M.Pd.
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online"></span>
                    </div>
                    <p className="text-[11px] text-[#4B3B7A] font-bold truncate">
                      Wali Kelas 10-A • Konsultasi Terbuka
                    </p>
                  </div>
                </div>

                <span className="clay-pill clay-mint text-[#1D5E4D] text-[10px] font-black px-2.5 py-1 shadow-2xs shrink-0">
                  Online
                </span>
              </div>

              {/* Latest message preview if any */}
              {latestNote && (
                <div className="p-3.5 rounded-2xl bg-white/80 border border-white text-xs space-y-1 shadow-2xs">
                  <span className="text-[9px] font-extrabold text-[#4B3B7A] uppercase tracking-wider block">
                    Pesan Terakhir ({selectedChild.name})
                  </span>
                  <p className="text-[#1C1E26] font-medium line-clamp-2 leading-relaxed">
                    "{latestNote.reply || latestNote.message}"
                  </p>
                </div>
              )}

              {/* Direct Link to Dedicated Chat */}
              <Link
                to={`/parent/chat?childId=${selectedChild.id}`}
                onClick={() => audioSynth.playClickSound()}
                className="clay-btn clay-btn-dark w-full py-3.5 px-4 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Buka Ruang Konsultasi Chat (Layar Penuh)</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>

            </div>

            {/* 2. LEARNING SCHEDULE PLAN CREATED BY CHILD (Clay Card) */}
            <div className="clay-card clay-white rounded-[28px] p-5 border border-white shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#1C1E26] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#4B3B7A]" />
                    <span>Jadwal Mandiri Anak</span>
                  </h3>
                  <p className="text-[10px] text-[#5A5E70] mt-0.5">
                    Disusun sendiri oleh {selectedChild.name}.
                  </p>
                </div>
                <span className="clay-pill clay-lavender text-[9px] font-extrabold px-2.5 py-1 text-[#4B3B7A] shadow-2xs">
                  {childSchedules.filter((s) => s.completed).length}/{childSchedules.length} Tuntas
                </span>
              </div>

              <div className="space-y-2.5">
                {childSchedules.map((sch) => (
                  <div
                    key={sch.id}
                    className={`p-3.5 rounded-2xl border space-y-1.5 transition-all ${
                      sch.completed
                        ? "bg-[#F8F9FD] border-[rgba(28,30,38,0.04)] opacity-75"
                        : "bg-white border-white shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="clay-pill clay-lavender text-[9px] font-extrabold px-2 py-0.5 text-[#4B3B7A]">
                        {sch.day} • {sch.time}
                      </span>
                      {sch.completed ? (
                        <span className="clay-pill clay-mint text-[8px] font-extrabold text-[#1D5E4D] px-2 py-0.5 flex items-center gap-0.5 shadow-2xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Selesai
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#9195A8]">
                          Aktif
                        </span>
                      )}
                    </div>
                    <h4 className={`text-xs font-bold ${sch.completed ? "line-through text-[#9195A8]" : "text-[#1C1E26]"}`}>
                      {sch.title}
                    </h4>
                    <span className="text-[10px] text-[#5A5E70] block font-medium">
                      {sch.format} ({sch.duration})
                    </span>
                  </div>
                ))}

                {childSchedules.length === 0 && (
                  <div className="p-4 rounded-2xl bg-[#F8F9FD] text-center text-xs text-[#5A5E70]">
                    Siswa belum menyusun jadwal belajar mandiri minggu ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
