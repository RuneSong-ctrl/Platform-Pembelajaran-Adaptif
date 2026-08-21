import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { audioSynth } from "@/services/audioSynth";
import {
  ArrowLeft,
  Check,
  Trophy,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  BookOpen,
  Eye,
  Headphones,
  FlaskConical,
  Award,
  CheckCircle2,
  Volume2,
  Layers,
} from "@/components/ui/icons";

export default function LearningPathwayStatusPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [timeFilter, setTimeFilter] = useState<"Weekly" | "Monthly" | "Yearly">("Weekly");

  const style = currentUser.learningStyle || "VISUAL";

  // Dynamic metrics per time filter
  const getFilterData = () => {
    switch (timeFilter) {
      case "Monthly":
        return {
          achieved: 48,
          score: 850,
          studyHours: "14.5 Jam",
          accuracy: "86%",
          xpGained: "+1,250 XP",
        };
      case "Yearly":
        return {
          achieved: 156,
          score: 3200,
          studyHours: "58.2 Jam",
          accuracy: "89%",
          xpGained: "+4,800 XP",
        };
      case "Weekly":
      default:
        return {
          achieved: 12,
          score: 200,
          studyHours: "3.5 Jam",
          accuracy: "82%",
          xpGained: "+350 XP",
        };
    }
  };

  const data = getFilterData();

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] pb-32 overflow-x-hidden">
      <Navbar />

      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 sm:pt-4 flex flex-col gap-4 sm:gap-5">
        {/* Top Header & Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/student"
            onClick={() => audioSynth.playClickSound()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-2xs text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Beranda Siswa</span>
          </Link>

          <span className="px-3 py-1 rounded-full bg-[#D1EBE1] text-[#1D5E4D] text-[10px] font-extrabold shadow-2xs">
            Laporan Analitik Adaptif
          </span>
        </div>

        {/* Page Title */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
              Learning Pathway Analytics
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D]">
              Gaya: {style === "AUDITORI" ? "Auditori" : style === "KINESTETIK" ? "Kinestetik" : "Visual"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#010105]">
            Status Jalur Belajar &amp; Analitik
          </h1>
          <p className="text-xs text-[#5A5E70] font-medium mt-0.5">
            Laporan evaluasi komprehensif penguasaan kompetensi kognitif {currentUser.name}.
          </p>
        </div>

        {/* Segmented Time Filter Switcher */}
        <section className="flex justify-center">
          <div className="bg-[#F0EEF6] p-1 rounded-full flex gap-1 shadow-2xs">
            {(["Weekly", "Monthly", "Yearly"] as const).map((filter) => {
              const label = filter === "Weekly" ? "Mingguan" : filter === "Monthly" ? "Bulanan" : "Tahunan";
              return (
                <button
                  key={filter}
                  onClick={() => {
                    audioSynth.playClickSound();
                    setTimeFilter(filter);
                  }}
                  className={`px-5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                    timeFilter === filter
                      ? "bg-[#1C1E26] text-white shadow-xs"
                      : "text-[#5A5E70] hover:text-[#1C1E26]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Top 2 Metric Cards */}
        <section className="grid grid-cols-2 gap-3">
          {/* Card 1: Achieved (Mint) */}
          <div className="clay-card clay-mint p-4 text-[#124B3D] flex flex-col justify-between h-32 relative">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-[#1D5E4D]">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#1D5E4D]/80" />
            </div>
            <div>
              <span className="text-[10px] text-[#1D5E4D] font-extrabold uppercase block">
                Kompetensi Tuntas
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#082921] leading-none">
                {data.achieved}
              </span>
            </div>
          </div>

          {/* Card 2: Learning Score (Butter) */}
          <div className="clay-card clay-butter p-4 text-[#4A3205] flex flex-col justify-between h-32 relative">
            <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center text-[#785308]">
                <Trophy className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#785308]/80" />
            </div>
            <div>
              <span className="text-[10px] text-[#785308] font-extrabold uppercase block">
                Skor Penguasaan
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#2C1D02] leading-none">
                {data.score}
              </span>
            </div>
          </div>
        </section>

        {/* Arc Progress Gauge Meter Card */}
        <section className="clay-card p-5 sm:p-6 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9195A8] block">
                Evaluasi Dinamis
              </span>
              <h3 className="text-sm font-extrabold text-[#010105]">
                Tingkat Akurasi &amp; Kapasitas Kognitif
              </h3>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#EBF6F2] text-[#1D5E4D]">
              {data.accuracy} Akurat
            </span>
          </div>

          <div className="flex flex-col items-center justify-center pt-3 pb-1">
            <div className="relative w-48 h-24 overflow-hidden mb-1">
              <div className="w-48 h-48 rounded-full border-[18px] border-[#E3DBF8] border-b-transparent border-l-transparent -rotate-45" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <span className="text-3xl font-black text-[#010105] tracking-tight">
                  {data.score}
                </span>
                <span className="text-[10px] font-black text-[#5A5E70] tracking-widest uppercase">
                  SCORE DDA
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(28,30,38,0.06)] text-center text-xs">
            <div className="bg-[#F8F9FD] p-2.5 rounded-xl border border-[rgba(28,30,38,0.04)]">
              <span className="text-xs font-black text-[#010105] block">
                {data.studyHours}
              </span>
              <span className="text-[10px] text-[#5A5E70] font-medium">
                Waktu Eksplorasi
              </span>
            </div>

            <div className="bg-[#F8F9FD] p-2.5 rounded-xl border border-[rgba(28,30,38,0.04)]">
              <span className="text-xs font-black text-[#1D5E4D] block">
                {data.xpGained}
              </span>
              <span className="text-[10px] text-[#5A5E70] font-medium">
                Perolehan XP
              </span>
            </div>
          </div>
        </section>

        {/* MODALITY-SPECIFIC ANALYTICS DIAGRAM / VISUALIZATION */}
        {style === "VISUAL" && (
          <section className="clay-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D1EBE1] flex items-center justify-center text-[#1D5E4D]">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105]">
                    Diagram Distribusi Penguasaan Visual
                  </h3>
                  <span className="text-[10px] text-[#5A5E70]">
                    Evaluasi pemahaman peta konsep &amp; infografis
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D]">
                Visual Score: 92%
              </span>
            </div>

            {/* Visual Bar Distribution Chart */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1D5E4D]"></span>
                    Bagan Anatomi Saluran Cerna
                  </span>
                  <span className="text-[#1D5E4D]">94% (Sangat Baik)</span>
                </div>
                <div className="w-full bg-[#EBF6F2] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#1D5E4D] h-full rounded-full w-[94%] transition-all duration-500"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#21518A]"></span>
                    Peta Visual Reaksi Enzimatis
                  </span>
                  <span className="text-[#21518A]">88% (Baik)</span>
                </div>
                <div className="w-full bg-[#EBF6F2] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#21518A] h-full rounded-full w-[88%] transition-all duration-500"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4B3B7A]"></span>
                    Diagram Penyerapan Vili Ileum
                  </span>
                  <span className="text-[#4B3B7A]">76% (Perlu Penguatan)</span>
                </div>
                <div className="w-full bg-[#EBF6F2] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#4B3B7A] h-full rounded-full w-[76%] transition-all duration-500"></div>
                </div>
              </div>
            </div>

            {/* Visual Metric Highlights */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(28,30,38,0.06)] text-[11px]">
              <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-[rgba(28,30,38,0.04)]">
                <span className="text-[#5A5E70] block">Retensi Pola Spasial</span>
                <span className="font-extrabold text-[#010105] text-xs">92% Indeks Visual</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-[rgba(28,30,38,0.04)]">
                <span className="text-[#5A5E70] block">Kecepatan Pindai Diagram</span>
                <span className="font-extrabold text-[#1D5E4D] text-xs">1.8 Detik / Node</span>
              </div>
            </div>
          </section>
        )}

        {style === "AUDITORI" && (
          <section className="clay-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E3DBF8] flex items-center justify-center text-[#4B3B7A]">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105]">
                    Analitik Audio &amp; Retensi Suara
                  </h3>
                  <span className="text-[10px] text-[#5A5E70]">
                    Evaluasi podcast materi &amp; kebiasaan mendengarkan
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
                Audio Score: 88%
              </span>
            </div>

            {/* Audio Waveform Spectrum Simulation */}
            <div className="p-4 rounded-2xl bg-[#2D2152] text-white space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#FEE7B3]" />
                  Spektrum Frekuensi Belajar Podcast
                </span>
                <span className="text-[#E3DBF8] text-[10px]">3 Episode Selesai</span>
              </div>

              {/* Dynamic Waveform Bars */}
              <div className="flex items-end justify-between gap-1 h-12 pt-2">
                {[40, 65, 85, 95, 70, 50, 80, 90, 60, 75, 90, 85, 55, 70, 95, 80, 65, 45, 60, 75].map((h, i) => (
                  <div
                    key={i}
                    className="w-full bg-[#E3DBF8] rounded-t-sm transition-all duration-300"
                    style={{ height: `${h}%`, opacity: h > 70 ? 1 : 0.6 }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Audio Breakdown Metrics */}
            <div className="space-y-2.5 pt-1">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Retensi Narasi Podcast Bab 3</span>
                  <span className="text-[#4B3B7A]">91% (Sangat Tinggi)</span>
                </div>
                <div className="w-full bg-[#F2EFFC] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#4B3B7A] h-full rounded-full w-[91%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Pemahaman Ringkasan Suara (TTS)</span>
                  <span className="text-[#4B3B7A]">85% (Baik)</span>
                </div>
                <div className="w-full bg-[#F2EFFC] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#4B3B7A] h-full rounded-full w-[85%]"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(28,30,38,0.06)] text-[11px]">
              <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-[rgba(28,30,38,0.04)]">
                <span className="text-[#5A5E70] block">Total Durasi Dengar</span>
                <span className="font-extrabold text-[#4B3B7A] text-xs">48.5 Menit</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-[rgba(28,30,38,0.04)]">
                <span className="text-[#5A5E70] block">Efektivitas Audio</span>
                <span className="font-extrabold text-[#1D5E4D] text-xs">Tinggi (+18% Recall)</span>
              </div>
            </div>
          </section>
        )}

        {style === "KINESTETIK" && (
          <section className="clay-card p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FEE7B3] flex items-center justify-center text-[#785308]">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105]">
                    Analitik Ketepatan Lab &amp; Simulasi
                  </h3>
                  <span className="text-[10px] text-[#5A5E70]">
                    Evaluasi kecepatan eksperimen &amp; trial-and-error
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FEE7B3] text-[#785308]">
                Lab Score: 90%
              </span>
            </div>

            {/* Lab Simulation Accuracy Breakdown */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Akurasi Pasang Molekul Enzim-Substrat</span>
                  <span className="text-[#785308]">95% (Akurat)</span>
                </div>
                <div className="w-full bg-[#FFF9EE] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#785308] h-full rounded-full w-[95%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Penyelesaian Studi Kasus Lab Virtual</span>
                  <span className="text-[#785308]">86% (Mandiri)</span>
                </div>
                <div className="w-full bg-[#FFF9EE] h-3 rounded-full overflow-hidden">
                  <div className="bg-[#785308] h-full rounded-full w-[86%]"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(28,30,38,0.06)] text-[11px]">
              <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-[rgba(28,30,38,0.04)]">
                <span className="text-[#5A5E70] block">Rata-rata Waktu Misi</span>
                <span className="font-extrabold text-[#010105] text-xs">3.4 Menit / Lab</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F9FD] border border-[rgba(28,30,38,0.04)]">
                <span className="text-[#5A5E70] block">Indeks Interaktif</span>
                <span className="font-extrabold text-[#785308] text-xs">96% Sangat Aktif</span>
              </div>
            </div>
          </section>
        )}

        {/* Summary Note for Parents & Students */}
        <section className="clay-card clay-lavender p-4 text-[#2D2152] flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#4B3B7A] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <h4 className="font-extrabold text-[#1E143D]">Sinkronisasi AI EduAdapt</h4>
            <p className="text-[11px] text-[#4B3B7A] mt-0.5">
              Data analitik penguasaan materi ini diperbarui secara otomatis setiap kali kamu menyelesaikan kuis adaptif DDA, eksplorasi diagram, atau simulasi lab mandiri.
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
