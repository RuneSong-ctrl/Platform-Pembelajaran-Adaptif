import React, { useState, useMemo } from "react";
import { GroundedDocument } from "@/types";
import { API_BASE_URL } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  Eye,
  Sparkles,
  Layers,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronDown,
  Award,
  FlaskConical,
  Brain,
  ShieldCheck,
  Flame,
  Check,
  BookOpen,
} from "@/components/ui/icons";

interface RichInfographicStudioProps {
  doc: GroundedDocument;
}

export default function RichInfographicStudio({ doc }: RichInfographicStudioProps) {
  // Parse Infographic data from JSON or construct robust fallback
  const data = useMemo(() => {
    if (doc.infographicDataJson) {
      try {
        const parsed = JSON.parse(doc.infographicDataJson);
        if (parsed && (parsed.tahap_1_fondasi || parsed.core_concept || parsed.roadmap_journey)) {
          return parsed;
        }
      } catch (e) {
        console.warn("[RichInfographicStudio] Error parsing infographicDataJson:", e);
      }
    }

    const paras = (doc.rawText || doc.summary || "").split("\n\n").filter((p) => p.trim().length > 30);
    const p1 = paras[0] || doc.summary || `Pemahaman fundamental materi ${doc.title}.`;
    const p2 = paras[1] || "Mekanisme interaksi komponen dan dinamika sistem.";
    const p3 = paras[2] || "Regulasi ilmiah dan kaidah baku yang mengontrol kestabilan proses.";
    const p4 = paras[3] || "Penerapan aplikatif nyata untuk memecahkan persoalan dunia nyata.";

    return {
      doc_title: doc.title,
      subtitle: `Pemetaan 4-Tahap Alur Konseptual & Analisis Wawasan ${doc.title}`,
      category_badge: "INFOGRAFIS 4-TAHAP KURIKULUM ADAPTIF",
      tahap_1_fondasi: {
        title: "Tahap 1: Fondasi & Konsep Inti",
        definition: p1.slice(0, 220),
        big_idea: `Prinsip fundamental ${doc.title} yang menopang pemahaman ilmiah terstruktur.`,
        key_pillars: [
          { name: "Terminologi Ilmiah", desc: "Karakteristik variabel pokok dan definisi dasar konsep." },
          { name: "Dinamika Sistemik", desc: "Hubungan fungsional antara unsur-unsur pembangun materi." },
          { name: "Hukum Keseimbangan", desc: "Kaidah baku yang mempertahankan kestabilan proses." },
        ],
      },
      tahap_2_mekanisme: {
        title: "Tahap 2: Alur Mekanisme & Dinamika 4-Langkah",
        steps: [
          { step_num: 1, title: "1. Inisiasi & Variabel Awal", desc: p1.slice(0, 110), badge: "Langkah 1" },
          { step_num: 2, title: "2. Interaksi Antar-Komponen", desc: p2.slice(0, 110), badge: "Langkah 2" },
          { step_num: 3, title: "3. Transformasi & Regulasi", desc: p3.slice(0, 110), badge: "Langkah 3" },
          { step_num: 4, title: "4. Luaran & Keseimbangan", desc: p4.slice(0, 110), badge: "Langkah 4" },
        ],
      },
      tahap_3_parameter: {
        title: "Tahap 3: Parameter Kunci & Kaidah Ilmiah",
        metrics: [
          { label: "Tingkat Akurasi Model Teori", value_pct: 86.5, explanation: "Kesesuaian kaidah baku dengan observasi ilmiah." },
          { label: "Efisiensi Siklus & Reaksi", value_pct: 74.0, explanation: "Optimalisasi sumber daya dan dinamika sistem." },
          { label: "Daya Tahan & Toleransi Variabel", value_pct: 61.5, explanation: "Kemampuan sistem mempertahankan kesetimbangan." },
        ],
      },
      tahap_4_aplikasi: {
        title: "Tahap 4: Analogi Nyata & Studi Kasus Terapan",
        analogy_title: "Analogi Cara Kerja",
        analogy_desc: `Bagaikan sistem presisi di mana setiap komponen bekerja selaras untuk menghasilkan luaran terencana pada modul ${doc.title}.`,
        case_study_title: "Penerapan Sains & Teknologi",
        case_study_desc: "Implementasi nyata konsep dalam pemecahan masalah teknologi modern dan fenomena alam sehari-hari.",
      },
      key_takeaway: `Penguasaan materi ${doc.title} memberikan landasan berpikir kritis dalam menganalisis fenomena sains dan penerapannya di dunia nyata.`,
    };
  }, [doc.infographicDataJson, doc.rawText, doc.summary, doc.title]);

  // Extract structured zones with fallback mappings
  const t1 = data.tahap_1_fondasi || data.core_concept || {
    title: "Tahap 1: Fondasi & Konsep Inti",
    definition: doc.summary || "Definisi materi terstruktur.",
    big_idea: "Gagasan pokok pembelajaran adaptif.",
    key_pillars: [
      { name: "Fondasi Awal", desc: "Prinsip dasar materi" },
      { name: "Interaksi", desc: "Dinamika proses sistem" },
      { name: "Keseimbangan", desc: "Hasil terukur" },
    ],
  };

  const t2_steps: any[] = data.tahap_2_mekanisme?.steps || data.mechanism_flow?.steps || data.roadmap_journey || [
    { step_num: 1, title: "1. Inisiasi & Variabel Awal", desc: "Tahap awal proses", badge: "Langkah 1" },
    { step_num: 2, title: "2. Interaksi Antar-Komponen", desc: "Perubahan variabel sistem", badge: "Langkah 2" },
    { step_num: 3, title: "3. Transformasi & Regulasi", desc: "Pengendalian keseimbangan", badge: "Langkah 3" },
    { step_num: 4, title: "4. Luaran & Keseimbangan", desc: "Keluaran sistem stabil", badge: "Langkah 4" },
  ];

  const t3_metrics: any[] = data.tahap_3_parameter?.metrics || data.metrics_breakdown || [
    { label: "Tingkat Akurasi Model", value_pct: 88, explanation: "Kesesuaian kaidah dasar dengan prinsip kurikulum." },
    { label: "Efisiensi Siklus & Dinamika", value_pct: 74, explanation: "Optimalisasi hubungan fungsi antar komponen." },
    { label: "Sensitivitas & Faktor Pembatas", value_pct: 62, explanation: "Pengaruh variabel luar terhadap kestabilan." },
  ];

  const t4 = data.tahap_4_aplikasi || data.case_study_analogy || {
    title: "Tahap 4: Analogi Nyata & Studi Kasus Terapan",
    analogy_title: "Analogi Kehidupan Nyata",
    analogy_desc: "Analogi konkret untuk memudahkan pemahaman materi.",
    case_study_title: "Studi Kasus & Penerapan Praktis",
    case_study_desc: "Penerapan nyata di bidang sains dan industri modern.",
  };

  const takeaway = data.key_takeaway || `Penguasaan materi ${doc.title} melatih nalar kritis dan pemahaman holistik.`;

  // Resolusi URL berkas gambar poster SVG
  const resolvePosterUrl = (): string => {
    const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${cleanBase}/api/v1/documents/${doc.id}/visual-image`;
  };

  const posterSrc = resolvePosterUrl();

  // State Viewer & Expandable
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"STAGES" | "POSTER">("STAGES");

  // Expandable steps state (default: first step open)
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 0: true });
  // Gamified completed steps
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStepExpand = (index: number) => {
    audioSynth.playClickSound();
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleMarkComplete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowComplete = !completedSteps[index];
    setCompletedSteps((prev) => ({ ...prev, [index]: isNowComplete }));

    if (isNowComplete) {
      audioSynth.playSuccessSound();
      try {
        confetti({ disableForReducedMotion: true, 
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#0284C7", "#10B981", "#8B5CF6", "#F59E0B"],
        });
      } catch (err) {
        // Safe fallback
      }
    } else {
      audioSynth.playClickSound();
    }
  };

  // Zoom Helpers
  const handleZoomIn = () => {
    audioSynth.playClickSound();
    setZoomLevel((prev) => Math.min(prev + 20, 180));
  };

  const handleZoomOut = () => {
    audioSynth.playClickSound();
    setZoomLevel((prev) => Math.max(prev - 20, 60));
  };

  const handleZoomReset = () => {
    audioSynth.playClickSound();
    setZoomLevel(100);
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalSteps = t2_steps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const pillarIcons = [Brain, Flame, ShieldCheck];
  const stepColors = [
    { border: "border-sky-500", bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-500/30", badge: "bg-sky-500 text-white" },
    { border: "border-teal-500", bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-500/30", badge: "bg-teal-500 text-white" },
    { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-500/30", badge: "bg-amber-500 text-white" },
    { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-500/30", badge: "bg-purple-500 text-white" },
  ];

  return (
    <div className="space-y-6">
      {/* 🧭 TOP CONTROLS & MODE SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#1C1E26]">
              Studio Infografis 4-Tahap Interaktif
            </h3>
            <p className="text-mini text-[#5A5E70]">
              Eksplorasi tahapan alur konsep yang dapat di-expand, wawasan metrik terukur, dan poster HD terpadu.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-2xl border border-black/5">
            <button
              type="button"
              onClick={() => {
                audioSynth.playClickSound();
                setViewMode("STAGES");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 ${
                viewMode === "STAGES"
                  ? "bg-[#0284C7] text-white shadow-xs"
                  : "text-[#0284C7] hover:bg-[#E0F2FE]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tahap Interaktif</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioSynth.playClickSound();
                setViewMode("POSTER");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 ${
                viewMode === "POSTER"
                  ? "bg-[#0284C7] text-white shadow-xs"
                  : "text-[#0284C7] hover:bg-[#E0F2FE]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Poster SVG HD</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => {
              audioSynth.playClickSound();
              setIsFullscreenOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Layar Penuh</span>
          </button>

          {/* Download SVG */}
          <a
            href={posterSrc}
            download={`${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Infografis_EduAdapt.svg`}
            target="_blank"
            rel="noreferrer"
            onClick={() => audioSynth.playSuccessSound()}
            className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#0284C7] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh SVG</span>
          </a>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TAMPILAN TAHAP INTERAKTIF & EXPANDABLE ACCORDION       */}
      {/* ========================================================= */}
      {viewMode === "STAGES" && (
        <div className="space-y-6">
          {/* 🏷️ HEADER BANNER & GAMIFIED PROGRESS */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-mini font-black uppercase tracking-wider px-3 py-1 rounded-md bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                ✦ {data.category_badge || "INFOGRAFIS 4-TAHAP KURIKULUM ADAPTIF"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] mt-2">
                {data.doc_title || doc.title}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                {data.subtitle || `Pemetaan Konseptual & Analisis Wawasan ${doc.title}`}
              </p>
            </div>

            {/* Progress Counter */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3.5 min-w-[210px]">
              <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-black text-sm shrink-0">
                {progressPct}%
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-mini font-bold text-slate-700 mb-1">
                  <span>Progres Pemahaman</span>
                  <span className="text-[#0284C7] font-black">{completedCount}/{totalSteps} Tahap</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    style={{ width: `${progressPct}%` }}
                    className="h-full rounded-full bg-[#0284C7] transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 💡 TAHAP 1: FONDASI & KONSEP INTI (EXPANDABLE BENTO) */}
          <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7]">
                💡 {t1.title || "Tahap 1: Fondasi & Konsep Inti"}
              </span>
              <span className="text-mini font-bold text-slate-400">Fondasi Teoretis</span>
            </div>

            {/* Big Idea Banner */}
            {t1.big_idea && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-mini font-black uppercase tracking-wider text-emerald-700 block">
                    Gagasan Pokok Utama
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-emerald-950 leading-relaxed mt-0.5">
                    {t1.big_idea}
                  </p>
                </div>
              </div>
            )}

            {/* Definition Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-mini font-black uppercase text-slate-400 tracking-wider block mb-1">
                Definisi Ilmiah Presisi
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {t1.definition}
              </p>
            </div>

            {/* 3 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {(t1.key_pillars || []).map((pillar: any, idx: number) => {
                const IconComp = pillarIcons[idx % pillarIcons.length];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-1.5 hover:border-[#0284C7] transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-[#0F172A] truncate">
                        {pillar.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ⚡ TAHAP 2: ALUR MEKANISME DENGAN KARTU TAHAPAN EXPANDABLE */}
          <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                  ⚡ {data.tahap_2_mekanisme?.title || "Tahap 2: Alur Mekanisme & Dinamika 4-Langkah"}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Klik kartu tahap mana saja untuk membuka/menutup penjelasan terperinci, analogi, dan menandai pemahaman.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    const allOpen: Record<number, boolean> = {};
                    t2_steps.forEach((_, i) => (allOpen[i] = true));
                    setExpandedSteps(allOpen);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Buka Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setExpandedSteps({});
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Tutup Semua
                </button>
              </div>
            </div>

            {/* Sequential Step Cards Accordion */}
            <div className="space-y-3 pt-1">
              {t2_steps.map((st: any, idx: number) => {
                const isOpen = !!expandedSteps[idx];
                const isDone = !!completedSteps[idx];
                const style = stepColors[idx % stepColors.length];

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? `bg-white ${style.border} shadow-md ring-2 ${style.ring}`
                        : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    {/* Header Row (Clickable) */}
                    <div
                      onClick={() => toggleStepExpand(idx)}
                      className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Step Number Circle */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                            isDone
                              ? "bg-emerald-500 text-white shadow-xs"
                              : `${style.bg} ${style.text}`
                          }`}
                        >
                          {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : st.step_num || idx + 1}
                        </div>

                        {/* Step Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-mini font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {st.badge || `Langkah ${idx + 1}`}
                            </span>
                            {isDone && (
                              <span className="text-mini font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Tuntas Dipelajari</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm sm:text-base font-black text-[#0F172A] mt-0.5 truncate">
                            {st.title}
                          </h4>
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Mark Complete Button */}
                        <button
                          type="button"
                          onClick={(e) => handleMarkComplete(idx, e)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isDone
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isDone ? "Dipahami" : "Tandai Paham"}</span>
                        </button>

                        {/* Expand Chevron */}
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Body */}
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-3.5 animate-fade-in bg-slate-50/40">
                        {/* Main Step Description */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-1">
                          <span className="text-mini font-black uppercase tracking-wider text-slate-400 block">
                            Uraian Dinamika & Mekanisme Proses
                          </span>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                            {st.desc}
                          </p>
                        </div>

                        {/* Extra Context Pills */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1">
                            <span className="font-black text-teal-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              <span>Fokus Pembelajaran Tahap Ini</span>
                            </span>
                            <p className="text-teal-950 text-[11.5px] leading-relaxed">
                              Perhatikan keterkaitan antara input variabel awal dan perubahan energi/kondisi yang terjadi pada tahap ini.
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 space-y-1">
                            <span className="font-black text-sky-900 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                              <span>Kaidah Ilmiah Terkait</span>
                            </span>
                            <p className="text-sky-950 text-[11.5px] leading-relaxed">
                              Hukum kekekalan dan kesetimbangan deterministik mengontrol transisi ke tahap berikutnya.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 📊 TAHAP 3 & TAHAP 4: EDITORIAL 2-COLUMN BENTO GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TAHAP 3: PARAMETER KUNCI & KAIDAH ILMIAH */}
            <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                  📊 {data.tahap_3_parameter?.title || "Tahap 3: Parameter Kunci & Kaidah Ilmiah"}
                </span>
                <span className="text-mini font-bold text-slate-400">Analisis Metrik</span>
              </div>

              <p className="text-xs text-slate-500">
                Kaidah baku, ambang batas variabel, dan metrik stabilitas sistemik terukur.
              </p>

              <div className="space-y-3.5 pt-1">
                {t3_metrics.map((mb: any, idx: number) => {
                  const barColor = idx === 0 ? "bg-sky-600" : idx === 1 ? "bg-emerald-600" : "bg-amber-600";
                  const textColor = idx === 0 ? "text-sky-600" : idx === 1 ? "text-emerald-600" : "text-amber-600";
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#0F172A]">{mb.label}</span>
                        <span className={`font-mono font-black text-sm ${textColor}`}>{mb.value_pct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          style={{ width: `${mb.value_pct}%` }}
                          className={`h-full rounded-full ${barColor} transition-all duration-500`}
                        />
                      </div>
                      {mb.explanation && (
                        <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">{mb.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* TAHAP 4: ANALOGI NYATA & STUDI KASUS TERAPAN */}
            <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  🌐 {t4.title || "Tahap 4: Analogi Nyata & Studi Kasus Terapan"}
                </span>
                <span className="text-mini font-bold text-slate-400">Konkretisasi</span>
              </div>

              <p className="text-xs text-slate-500">
                Konkretisasi konsep melalui analogi nyata dan aplikasi dunia modern.
              </p>

              <div className="space-y-3.5 pt-1">
                {/* Analogy Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2 text-purple-900">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs sm:text-sm font-black">{t4.analogy_title || "Analogi Kehidupan Nyata"}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {t4.analogy_desc}
                  </p>
                </div>

                {/* Case Study Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900">
                    <FlaskConical className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs sm:text-sm font-black">{t4.case_study_title || "Penerapan Sains & Teknologi"}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {t4.case_study_desc}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* 💡 KESIMPULAN KUNCI BANNER */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0F172A] text-white flex items-start gap-4 shadow-md">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-mini font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                Prinsip Aplikatif Terintegrasi
              </span>
              <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed font-medium">
                {takeaway}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAMPILAN POSTER VEKTOR SVG HD                          */}
      {/* ========================================================= */}
      {viewMode === "POSTER" && (
        <div className="clay-card bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                Vektor Lossless SVG (1200 x 1380 px)
              </span>
              <span className="text-mini font-black uppercase px-2 py-0.5 rounded-md bg-[#E0F2FE] text-[#0284C7]">
                HD Clean Layout
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-[#F8F9FD] rounded-xl border border-black/5 p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                className="p-1.5 hover:bg-white rounded-lg text-[#5A5E70] disabled:opacity-40 cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="px-2 py-1 text-mini font-mono font-bold text-[#0284C7] hover:bg-white rounded-lg cursor-pointer"
                title="Reset"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 180}
                className="p-1.5 hover:bg-white rounded-lg text-[#5A5E70] disabled:opacity-40 cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative w-full rounded-2xl overflow-auto bg-[#F1F5F9] border border-black/10 shadow-inner flex items-center justify-center p-3 sm:p-6 min-h-[500px] max-h-[750px]">
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease-out",
                width: "100%",
                maxWidth: "1000px",
              }}
              className="flex items-center justify-center"
            >
              <img
                src={posterSrc}
                alt={`Poster Infografis ${doc.title}`}
                className="w-full h-auto object-contain rounded-xl shadow-lg border border-black/5 bg-white"
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL FULLSCREEN HD POSTER                            */}
      {/* ========================================================= */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h2 className="text-sm sm:text-base font-black truncate">{doc.title} — Infografis 4-Tahap HD</h2>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={posterSrc}
                download={`${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Infografis_EduAdapt.svg`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>

              <button
                onClick={() => setIsFullscreenOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-900/50">
            <img
              src={posterSrc}
              alt={`Infografis Fullscreen ${doc.title}`}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
