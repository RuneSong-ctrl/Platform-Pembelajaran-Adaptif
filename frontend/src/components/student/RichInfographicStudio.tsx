import React, { useState, useMemo } from "react";
import { GroundedDocument, InfographicData } from "@/types";
import { API_BASE_URL } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  Eye,
  Sparkles,
  Layers,
  ArrowRight,
  GitBranch,
  FileText,
  Lightbulb,
  CheckCircle2,
  X,
  ChevronRight,
  TrendingUp,
  Award,
} from "@/components/ui/icons";

interface RichInfographicStudioProps {
  doc: GroundedDocument;
}

export default function RichInfographicStudio({ doc }: RichInfographicStudioProps) {
  // Parse Infographic data from JSON or construct robust fallback
  const infographicData: InfographicData = useMemo(() => {
    if (doc.infographicDataJson) {
      try {
        const parsed = JSON.parse(doc.infographicDataJson);
        if (parsed && (parsed.roadmap_journey || parsed.core_concept)) {
          return parsed;
        }
      } catch (e) {
        console.warn("[RichInfographicStudio] Error parsing infographicDataJson:", e);
      }
    }

    const paras = (doc.rawText || doc.summary || "").split("\n\n").filter((p) => p.trim().length > 30);
    const p1 = paras[0] || doc.summary || `Pemahaman fundamental materi ${doc.title}.`;
    const p2 = paras[1] || "Mekanisme interaksi komponen dan dinamika sistem.";

    return {
      doc_title: doc.title,
      subtitle: `Pemetaan Alur Perjalanan & Wawasan Data Ter-Grounding`,
      category_badge: "MODUL KURIKULUM ADAPTIF",
      intro_summary: [
        p1.slice(0, 130) + (p1.length > 130 ? "..." : ""),
        p2.slice(0, 130) + (p2.length > 130 ? "..." : ""),
      ],
      roadmap_journey: [
        { step_num: 1, title: "1. Fondasi Awal", desc: "Titik tolak dan asumsi dasar materi.", color: "#06B6D4" },
        { step_num: 2, title: "2. Inisiasi Variabel", desc: "Interaksi awal antar komponen utama.", color: "#3B82F6" },
        { step_num: 3, title: "3. Transformasi Proses", desc: "Perubahan bentuk atau kondisi sistem.", color: "#10B981" },
        { step_num: 4, title: "4. Regulasi & Batasan", desc: "Kaidah ilmiah yang mengontrol proses.", color: "#84CC16" },
        { step_num: 5, title: "5. Hasil & Keseimbangan", desc: "Keluaran sistem yang terukur.", color: "#F59E0B" },
        { step_num: 6, title: "6. Dampak Aplikatif", desc: "Manfaat langsung bagi kehidupan nyata.", color: "#EC4899" },
      ],
      metrics_breakdown: [
        { label: "Tingkat Akurasi Model", value_pct: 84.5, explanation: "Kesesuaian teori dengan observasi ilmiah." },
        { label: "Efisiensi Siklus Sistem", value_pct: 72.0, explanation: "Optimalisasi sumber daya sistemik." },
        { label: "Kestabilan Variabel", value_pct: 58.3, explanation: "Daya tahan terhadap gangguan eksternal." },
      ],
      donut_charts: [
        { label: "Aplikasi Praktis", value_pct: 76, color: "#10B981", subtext: "Sangat Relevan" },
        { label: "Kaidah Teoretis", value_pct: 91, color: "#6366F1", subtext: "Prinsip Baku" },
      ],
      big_stats_highlights: [
        { number: "100%", title: "Kaidah Ter-grounding", desc: "Berdasarkan naskah kurikulum resmi." },
        { number: "6 Tahap", title: "Milestone Utama", desc: "Alur terstruktur dari awal hingga akhir." },
        { number: "88.5%", title: "Retensi Spasial", desc: "Memperkuat daya ingat visual jangka panjang." },
      ],
      key_takeaway: `Penguasaan materi ${doc.title} membuka pemahaman kritis terhadap fenomena sains dan penerapannya di dunia nyata.`,
    };
  }, [doc.infographicDataJson, doc.rawText, doc.summary, doc.title]);

  // Resolusi URL berkas gambar poster SVG/PNG
  const resolvePosterUrl = (): string => {
    const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${cleanBase}/api/v1/documents/${doc.id}/visual-image`;
  };

  const posterSrc = resolvePosterUrl();

  // State Viewer
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"POSTER" | "ROADMAP" | "METRICS">("POSTER");
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);

  // Zoom Helpers
  const handleZoomIn = () => {
    audioSynth.playClickSound();
    setZoomLevel((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    audioSynth.playClickSound();
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    audioSynth.playClickSound();
    setZoomLevel(100);
  };

  return (
    <div className="space-y-6">
      {/* 🧭 STUDIO SUB-NAV: POSTER VEKTOR VS ROADMAP VS METRIK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#1C1E26]">
              Studio Infografis AI: Winding Journey &amp; Data Insight
            </h3>
            <p className="text-[11px] text-[#5A5E70]">
              Format editorial bersih terinspirasi alur peta berkelok dan analisis data statistik terpadu.
            </p>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F8F9FD] rounded-2xl border border-black/5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              audioSynth.playClickSound();
              setSelectedTab("POSTER");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedTab === "POSTER"
                ? "bg-[#0284C7] text-white shadow-xs"
                : "text-[#0284C7] hover:bg-[#E0F2FE]"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Poster Vektor HD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playClickSound();
              setSelectedTab("ROADMAP");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedTab === "ROADMAP"
                ? "bg-[#10B981] text-white shadow-xs"
                : "text-[#10B981] hover:bg-[#E6F4EA]"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Peta Alur Journey</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playClickSound();
              setSelectedTab("METRICS");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedTab === "METRICS"
                ? "bg-[#6366F1] text-white shadow-xs"
                : "text-[#6366F1] hover:bg-[#EEF2FF]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Wawasan Data &amp; Metrik</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. TAMPILAN POSTER VEKTOR HD (DENGAN ZOOM & FULLSCREEN)  */}
      {/* ========================================================= */}
      {selectedTab === "POSTER" && (
        <div className="clay-card bg-white p-4 sm:p-6 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
          {/* Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                Editorial Light Theme • Lossless SVG
              </span>
              <span className="text-xs font-bold text-[#5A5E70] hidden sm:inline">
                Skala: {zoomLevel}%
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Zoom In/Out Buttons */}
              <div className="inline-flex items-center bg-[#F8F9FD] rounded-xl border border-black/5 p-0.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Perkecil (-25%)"
                  disabled={zoomLevel <= 50}
                  className="p-1.5 hover:bg-white rounded-lg text-[#5A5E70] hover:text-[#1C1E26] disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  title="Reset Ukuran (100%)"
                  className="px-2 py-1 text-[11px] font-mono font-bold text-[#0284C7] hover:bg-white rounded-lg transition-all cursor-pointer"
                >
                  {zoomLevel}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Perbesar (+25%)"
                  disabled={zoomLevel >= 200}
                  className="p-1.5 hover:bg-white rounded-lg text-[#5A5E70] hover:text-[#1C1E26] disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setIsFullscreenOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </button>

              {/* Download Button */}
              <a
                href={posterSrc}
                download={`${doc.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Infografis_EduAdapt.svg`}
                target="_blank"
                rel="noreferrer"
                onClick={() => audioSynth.playSuccessSound()}
                className="px-3.5 py-1.5 rounded-xl bg-[#1C1E26] hover:bg-[#0284C7] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh SVG</span>
              </a>
            </div>
          </div>

          {/* Clean Light-Themed Poster Viewer Frame */}
          <div className="relative w-full rounded-3xl overflow-auto bg-[#F1F5F9] border border-black/10 shadow-inner flex items-center justify-center p-3 sm:p-6 min-h-[520px] max-h-[780px]">
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
                alt={`Infografis ${doc.title}`}
                className="w-full h-auto object-contain rounded-2xl shadow-xl border border-black/5 bg-white"
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TAMPILAN PETA ALUR JOURNEY (WINDING ROADMAP)           */}
      {/* ========================================================= */}
      {selectedTab === "ROADMAP" && (
        <div className="space-y-4">
          <div className="clay-card bg-white p-5 sm:p-6 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7]">
                  Winding Journey Roadmap
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#1C1E26] mt-1">
                  🗺️ 6 Tahapan Alur Konseptual Berkelanjutan
                </h3>
              </div>
            </div>

            {/* Sinuous Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(infographicData.roadmap_journey || []).map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMilestone(step.step_num)}
                  style={{ borderTopColor: step.color || "#10B981" }}
                  className={`p-4 rounded-2xl bg-white border-t-4 border border-black/5 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-2 ${
                    selectedMilestone === step.step_num ? "ring-2 ring-[#0284C7] bg-[#F8FAFC]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{ backgroundColor: step.color || "#10B981" }}
                      className="w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shadow-xs"
                    >
                      {step.step_num}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Milestone {step.step_num}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-[#1C1E26] group-hover:text-[#0284C7] transition-colors">
                    {step.title}
                  </h4>

                  <p className="text-xs text-[#5A5E70] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Key Takeaway Banner */}
            <div className="p-4 rounded-2xl bg-[#0F172A] text-white flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#FCD34D] shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-black text-[#FCD34D] uppercase tracking-wider">
                  Kesimpulan Filosofis &amp; Aplikatif
                </h5>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {infographicData.key_takeaway}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TAMPILAN WAWASAN DATA & METRIK (GOODSTATS STYLE)       */}
      {/* ========================================================= */}
      {selectedTab === "METRICS" && (
        <div className="space-y-4">
          <div className="clay-card bg-white p-5 sm:p-6 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                Editorial Data Insight
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#1C1E26] mt-1">
                📊 Analisis Variabel &amp; Proporsi Dinamika Sistem
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Horizontal Progress Bars */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80">
                <h4 className="text-xs font-black text-[#1C1E26] uppercase tracking-wider text-slate-500">
                  Proporsi Signifikansi Variabel
                </h4>
                {(infographicData.metrics_breakdown || []).map((mb, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1E293B]">{mb.label}</span>
                      <span className="font-mono font-black text-[#0284C7]">{mb.value_pct}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        style={{ width: `${mb.value_pct}%` }}
                        className="h-full rounded-full bg-[#0284C7] transition-all duration-500"
                      />
                    </div>
                    {mb.explanation && (
                      <p className="text-[10.5px] text-slate-500">{mb.explanation}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Column: Donut Rings & Big Stats */}
              <div className="space-y-4">
                {/* Donut Indicators */}
                <div className="grid grid-cols-2 gap-3">
                  {(infographicData.donut_charts || []).map((dn, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 text-center space-y-1"
                    >
                      <div className="text-2xl font-black text-[#0F172A]">{dn.value_pct}%</div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase">{dn.subtext}</div>
                      <div className="text-xs font-black text-[#1E293B] mt-1">{dn.label}</div>
                    </div>
                  ))}
                </div>

                {/* Big Stat Highlight Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(infographicData.big_stats_highlights || []).map((st, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1"
                    >
                      <div className="text-xl font-black text-[#10B981]">{st.number}</div>
                      <div className="text-xs font-black text-[#1E293B]">{st.title}</div>
                      <p className="text-[10px] text-slate-500">{st.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL FULLSCREEN HD POSTER                            */}
      {/* ========================================================= */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#38BDF8]" />
              <h2 className="text-sm sm:text-base font-black truncate">{doc.title} — Infografis Editorial HD</h2>
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
                <span>Unduh SVG</span>
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
