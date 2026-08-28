import React, { useState, useEffect, useRef, useMemo } from "react";
import { GroundedDocument } from "@/types";
import AdaptiveFlashcards, { FlashcardItem } from "@/components/student/AdaptiveFlashcards";
import { ApiService } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import mermaid from "mermaid";
import {
  Eye,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  GitBranch,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  ImageIcon,
  Loader2,
  ExternalLink,
} from "@/components/ui/icons";

interface VisualLearnSectionProps {
  doc: GroundedDocument;
}

interface StoryboardFrame {
  id: number;
  stageBadge: string;
  title: string;
  summaryPoint: string;
  detailedText: string;
  icon: string;
  accentColor: string;
}

// Inisialisasi mermaid satu kali untuk diagram konsep pelengkap
mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
  themeVariables: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "13px",
    primaryColor: "#EBF6F2",
    primaryTextColor: "#124B3D",
    primaryBorderColor: "#9DE1CA",
    lineColor: "#1D5E4D",
    secondaryColor: "#E3DBF8",
    tertiaryColor: "#FFF4DC",
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
});

export default function VisualLearnSection({ doc }: VisualLearnSectionProps) {
  // 1. Ekstrak paragraf materi substantif
  const docParagraphs = useMemo(() => {
    if (!doc.rawText) return [];
    const clean = doc.rawText.replace(/\r/g, "").trim();
    const blocks = clean.split(/\n\s*\n+/).map((b) => b.trim()).filter((b) => b.length > 35);
    if (blocks.length >= 3) return blocks;

    // Fallback: pecah berdasarkan kalimat utuh
    const sentences = clean.split(/(?<=[.?!])\s+/).filter((s) => s.length > 20);
    const chunks: string[] = [];
    let cur = "";
    for (const s of sentences) {
      if ((cur + " " + s).length > 450) {
        if (cur) chunks.push(cur.trim());
        cur = s;
      } else {
        cur = cur ? cur + " " + s : s;
      }
    }
    if (cur) chunks.push(cur.trim());
    return chunks.length > 0 ? chunks : [doc.summary || doc.title];
  }, [doc.rawText, doc.summary, doc.title]);

  // 2. Bangun Rangkaian Storyboard Frames (Tontonan Visual Bertahap)
  const storyboardFrames: StoryboardFrame[] = useMemo(() => {
    const defaultIcons = ["🎯", "🔬", "⚡", "🌍", "🏆"];
    const badges = [
      "Orientasi & Premis Utama",
      "Fondasi & Definisi Pokok",
      "Mekanisme & Cara Kerja",
      "Dampak & Studi Kasus",
      "Sintesis & Solusi Nyata",
    ];

    if (docParagraphs.length === 0) {
      return [
        {
          id: 1,
          stageBadge: "Pengantar Materi",
          title: doc.title,
          summaryPoint: doc.summary || "Materi pembelajaran visual.",
          detailedText: doc.rawText || "Belum ada detail teks materi.",
          icon: "📚",
          accentColor: "#1D5E4D",
        },
      ];
    }

    return docParagraphs.slice(0, 5).map((para, idx) => {
      const sentences = para.split(/(?<=[.?!])\s+/);
      const headline = sentences[0] || `Pilar Konsep ${idx + 1}`;
      const restText = sentences.slice(1).join(" ") || para;

      return {
        id: idx + 1,
        stageBadge: badges[idx] || `Babak Konsep ${idx + 1}`,
        title: headline.length > 70 ? `${headline.slice(0, 68)}...` : headline,
        summaryPoint: sentences[1] || sentences[0] || para.slice(0, 120),
        detailedText: restText.length > 15 ? restText : para,
        icon: defaultIcons[idx % defaultIcons.length],
        accentColor: ["#1D5E4D", "#4B3B7A", "#785308", "#1E588F", "#823A1E"][idx % 5],
      };
    });
  }, [docParagraphs, doc.title, doc.summary, doc.rawText]);

  // State Storyboard
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isExpandedDetail, setIsExpandedDetail] = useState(false);
  const activeFrame = storyboardFrames[activeFrameIndex] || storyboardFrames[0];

  // Auto-play Storyboard timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setActiveFrameIndex((prev) => (prev + 1) % storyboardFrames.length);
        setIsExpandedDetail(false);
      }, 7000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoPlaying, storyboardFrames.length]);

  const handlePrevFrame = () => {
    audioSynth.playClickSound();
    setActiveFrameIndex((prev) => (prev - 1 + storyboardFrames.length) % storyboardFrames.length);
    setIsExpandedDetail(false);
  };

  const handleNextFrame = () => {
    audioSynth.playClickSound();
    setActiveFrameIndex((prev) => (prev + 1) % storyboardFrames.length);
    setIsExpandedDetail(false);
  };

  // 3. Flashcards Data (Kartu Konsep yang Bisa Diklik & Dibalik)
  const flashcardItems: FlashcardItem[] = useMemo(() => {
    if (doc.flashcardsJson) {
      try {
        const parsed = JSON.parse(doc.flashcardsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn("[VisualSection] Error parsing flashcardsJson:", e);
      }
    }
    // Fallback dari paragraf
    return docParagraphs.slice(0, 4).map((p, idx) => {
      const parts = p.split(/[.?!]\s+/);
      return {
        id: `fc_${idx + 1}`,
        question: `Apa konsep inti dari:\n"${(parts[0] || p).slice(0, 80)}..."?`,
        answer: (parts.slice(1, 3).join(". ") || parts[0] || p).slice(0, 200),
        hint: `Perhatikan kata kunci pada pembahasan babak ke-${idx + 1}.`,
        conceptTag: `KONSEP 0${idx + 1}`,
      };
    });
  }, [doc.flashcardsJson, docParagraphs]);

  // 4. Pelengkap: Mermaid Mindmap SVG Render & AI Image Studio
  const [activeSupplementaryTab, setActiveSupplementaryTab] = useState<"none" | "mindmap" | "ai-image">("none");
  const [mindmapSvg, setMindmapSvg] = useState<string | null>(null);
  const [isRenderingMindmap, setIsRenderingMindmap] = useState(false);
  const [mindmapZoom, setMindmapZoom] = useState(1.0);
  const mindmapContainerRef = useRef<HTMLDivElement | null>(null);

  // AI Image generation on-demand state
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(doc.visualImageUrl || null);

  useEffect(() => {
    if (doc.visualImageUrl) {
      setCustomImageUrl(doc.visualImageUrl);
    }
  }, [doc.visualImageUrl]);

  const handleGenerateAiImage = async () => {
    audioSynth.playClickSound();
    setIsGeneratingImage(true);
    try {
      const prompt = `Educational visual textbook illustration for: ${doc.title}. High definition, clear scientific infographic diagrams, clean typography, vibrant modern educational palette.`;
      const res = await ApiService.generateImageAI({ prompt, size: "1024x1024" });
      if (res?.data?.[0]) {
        const item = res.data[0];
        const newSrc = item.b64_json ? `data:image/png;base64,${item.b64_json}` : item.url;
        if (newSrc) {
          setCustomImageUrl(newSrc);
          audioSynth.playSuccessSound();
        }
      }
    } catch (err) {
      console.warn("[VisualSection] AI image generation notice:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRenderMindmap = async () => {
    if (mindmapSvg) return;
    setIsRenderingMindmap(true);
    try {
      let code = doc.mindmapCode;
      if (!code) {
        code = `graph TD\n  Root["📌 ${doc.title.slice(0, 30)}"] --> A["Pilar Konsep Utama"]\n  Root --> B["Mekanisme & Dinamika"]\n  Root --> C["Penerapan Nyata"]\n  A --> D["Definisi Acuan"]\n  B --> E["Alur Reaksi / Kasus"]\n  C --> F["Evaluasi Mandiri"]`;
      }
      const uniqueId = `mm_svg_${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, code);
      setMindmapSvg(svg);
    } catch (err) {
      console.warn("[VisualSection] Mindmap render error:", err);
    } finally {
      setIsRenderingMindmap(false);
    }
  };

  const handleToggleSupplementary = (tab: "mindmap" | "ai-image") => {
    audioSynth.playClickSound();
    if (activeSupplementaryTab === tab) {
      setActiveSupplementaryTab("none");
    } else {
      setActiveSupplementaryTab(tab);
      if (tab === "mindmap") {
        handleRenderMindmap();
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 🎬 1. STORYBOARD INTERAKTIF (TONTONAN VISUAL UTAMA)                      */}
      {/* ========================================================================= */}
      <section className="clay-card clay-mint p-5 sm:p-7 rounded-3xl text-[#124B3D] space-y-5 shadow-sm border border-[#1D5E4D]/15 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#1D5E4D]/10 blur-3xl pointer-events-none" />

        {/* Storyboard Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1D5E4D]/15 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-2xs flex items-center justify-center text-xl">
              {activeFrame.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1D5E4D] text-white text-[10px] font-extrabold uppercase tracking-wide shadow-2xs">
                  {activeFrame.stageBadge}
                </span>
                <span className="text-xs font-bold text-[#1D5E4D]/80">
                  Babak {activeFrameIndex + 1} dari {storyboardFrames.length}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#082921] mt-0.5">
                Tontonan Narasi Konseptual
              </h2>
            </div>
          </div>

          {/* Auto-Play Toggle & Frame Counter */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                audioSynth.playClickSound();
                setIsAutoPlaying(!isAutoPlaying);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                isAutoPlaying
                  ? "bg-[#1D5E4D] text-white shadow-xs scale-102"
                  : "bg-white/80 text-[#1D5E4D] hover:bg-white"
              }`}
              title={isAutoPlaying ? "Hentikan Pemutaran Otomatis" : "Mulai Pemutaran Otomatis Tontonan"}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Jeda Putar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Auto-Play Tontonan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Cinema Card Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Visual Cover Graphic Hero (Lg: 5 Cols) */}
          <div className="lg:col-span-5 relative group rounded-2xl overflow-hidden shadow-md bg-white border border-[#1D5E4D]/20 min-h-[220px] max-h-[280px] flex items-center justify-center">
            {customImageUrl ? (
              <img
                src={customImageUrl}
                alt={doc.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#EBF6F2] text-[#1D5E4D] flex items-center justify-center mx-auto shadow-2xs text-2xl">
                  {activeFrame.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-[#082921]">Ilustrasi Konsep Ajar</h4>
                  <p className="text-[11px] text-[#124B3D]/80 max-w-[200px] mx-auto">
                    Visualisasi ter-grounding topik {doc.title}.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isGeneratingImage}
                  onClick={handleGenerateAiImage}
                  className="px-3 py-1.5 rounded-xl bg-[#1D5E4D] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-2xs hover:bg-[#154639] transition-all disabled:opacity-50"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Melukis AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Buat Ilustrasi AI</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-[#9DE1CA]" />
              <span>Frame {activeFrameIndex + 1} / {storyboardFrames.length}</span>
            </div>
          </div>

          {/* Narrative Story Details (Lg: 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-[#082921] leading-snug">
                {activeFrame.title}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#124B3D] leading-relaxed bg-white/70 p-3.5 rounded-2xl border border-[#1D5E4D]/15 shadow-2xs">
                {activeFrame.summaryPoint}
              </p>
            </div>

            {/* Expandable In-Depth Explanation */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setIsExpandedDetail(!isExpandedDetail);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black text-[#1D5E4D] hover:underline cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isExpandedDetail ? "Tutup Penjelasan Detail" : "Buka Penjelasan Detail Babak"}</span>
              </button>

              {isExpandedDetail && (
                <div className="p-4 rounded-2xl bg-white text-xs sm:text-sm font-medium text-[#1C1E26] leading-relaxed border border-[#1D5E4D]/20 shadow-xs animate-in fade-in duration-200">
                  <p>{activeFrame.detailedText}</p>
                </div>
              )}
            </div>

            {/* Bottom Nav Buttons for Storyboard */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1D5E4D]/15">
              <div className="flex items-center gap-1.5">
                {storyboardFrames.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => {
                      audioSynth.playClickSound();
                      setActiveFrameIndex(dotIdx);
                      setIsExpandedDetail(false);
                    }}
                    className={`h-2.5 rounded-full transition-all cursor-pointer ${
                      dotIdx === activeFrameIndex
                        ? "w-7 bg-[#1D5E4D]"
                        : "w-2.5 bg-[#1D5E4D]/30 hover:bg-[#1D5E4D]/50"
                    }`}
                    title={`Lompat ke Babak ${dotIdx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevFrame}
                  className="p-2 rounded-xl bg-white/90 text-[#1D5E4D] hover:bg-white shadow-2xs transition-all cursor-pointer"
                  title="Babak Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleNextFrame}
                  className="px-4 py-2 rounded-xl bg-[#1D5E4D] text-white hover:bg-[#154639] text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  title="Babak Selanjutnya"
                >
                  <span>Lanjut</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🃏 2. KARTU KONSEP INTERAKTIF (FLASHCARDS BISA DIKLIK / FLIP)             */}
      {/* ========================================================================= */}
      <section className="space-y-2">
        <AdaptiveFlashcards cards={flashcardItems} topicTitle={doc.title} />
      </section>

      {/* ========================================================================= */}
      {/* 🧩 3. PELENGKAP VISUAL (MINDMAP MERMAID & AI STUDIO ACCORDION)            */}
      {/* ========================================================================= */}
      <section className="clay-card clay-white p-5 rounded-3xl border border-black/5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1D5E4D]" />
            <h3 className="text-xs sm:text-sm font-black text-[#1C1E26]">
              Alat Visualisasi Pelengkap (Opsional)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleSupplementary("mindmap")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                activeSupplementaryTab === "mindmap"
                  ? "bg-[#1D5E4D] text-white shadow-xs"
                  : "bg-[#EBF6F2] text-[#1D5E4D] hover:bg-[#D8EFE7]"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Peta Konsep Mindmap</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleSupplementary("ai-image")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                activeSupplementaryTab === "ai-image"
                  ? "bg-[#4B3B7A] text-white shadow-xs"
                  : "bg-[#F4F0FD] text-[#4B3B7A] hover:bg-[#EBE4FA]"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Studio Gambar AI</span>
            </button>
          </div>
        </div>

        {/* View Pelengkap: Mindmap SVG */}
        {activeSupplementaryTab === "mindmap" && (
          <div className="p-4 rounded-2xl bg-[#FAF9FC] border border-black/5 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#1D5E4D]">Bagan Relasi Konseptual</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMindmapZoom((z) => Math.max(0.6, z - 0.2))}
                  className="p-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 text-[#1C1E26] cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold px-1.5">{Math.round(mindmapZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setMindmapZoom((z) => Math.min(2.0, z + 0.2))}
                  className="p-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 text-[#1C1E26] cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMindmapZoom(1.0)}
                  className="p-1.5 rounded-lg bg-white border border-black/10 hover:bg-black/5 text-[#1C1E26] cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isRenderingMindmap ? (
              <div className="p-12 text-center text-xs text-[#5A5E70] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#1D5E4D]" />
                <span>Merender diagram alur konsep...</span>
              </div>
            ) : mindmapSvg ? (
              <div
                ref={mindmapContainerRef}
                className="overflow-auto max-h-[420px] p-4 bg-white rounded-xl border border-black/5 shadow-2xs flex justify-center"
              >
                <div
                  style={{ transform: `scale(${mindmapZoom})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}
                  dangerouslySetInnerHTML={{ __html: mindmapSvg }}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#5A5E70]">
                Diagram konsep belum tersedia.
              </div>
            )}
          </div>
        )}

        {/* View Pelengkap: AI Image Studio */}
        {activeSupplementaryTab === "ai-image" && (
          <div className="p-4 rounded-2xl bg-[#FAF9FC] border border-black/5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-[#1C1E26]">EduAdapt AI Image Studio</h4>
                <p className="text-[11px] text-[#5A5E70]">
                  Hasilkan ilustrasi infografis resolusi tinggi yang disesuaikan secara otomatis dengan konteks kurikulum modul ini.
                </p>
              </div>

              <button
                type="button"
                disabled={isGeneratingImage}
                onClick={handleGenerateAiImage}
                className="px-4 py-2 rounded-xl bg-[#4B3B7A] text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs hover:bg-[#392C60] transition-all disabled:opacity-50 shrink-0"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghasilkan Ilustrasi...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Ilustrasi Baru</span>
                  </>
                )}
              </button>
            </div>

            {customImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-black/10 max-h-[350px] shadow-xs">
                <img src={customImageUrl} alt={doc.title} className="w-full h-full object-contain bg-black/5" />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
