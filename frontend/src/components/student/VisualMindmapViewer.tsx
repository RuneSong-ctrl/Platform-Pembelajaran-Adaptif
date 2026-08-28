import React, { useState, useEffect, useRef, useMemo } from "react";
import { ApiService } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import mermaid from "mermaid";
import { VisualNodeDetail } from "@/types";
import {
  Sparkles,
  Eye,
  ImageIcon,
  Maximize2,
  X,
  Video,
  Loader2,
  RefreshCw,
  GitBranch,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
} from "@/components/ui/icons";

interface VisualMindmapViewerProps {
  topic: string;
  summary: string;
  rawText?: string;
  mindmapCode?: string;
  visualImageUrl?: string;
  visualNodesJson?: string;
}

// Initialize Mermaid once with high-contrast, accessible educational color palette
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

export default function VisualMindmapViewer({
  topic,
  summary,
  rawText,
  mindmapCode,
  visualImageUrl,
  visualNodesJson,
}: VisualMindmapViewerProps) {
  // State for AI Image Generation (EduAdapt AI Studio)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageB64, setGeneratedImageB64] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // State for AI Mindmap Diagram (Mermaid SVG Render)
  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState<string | null>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [showDiagramModal, setShowDiagramModal] = useState(false);

  // Interactive Node Comparison Cards & Storyboard State
  const [selectedNodeDetail, setSelectedNodeDetail] = useState<VisualNodeDetail | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [activeStoryboardStep, setActiveStoryboardStep] = useState(0);

  const diagramContainerRef = useRef<HTMLDivElement | null>(null);
  const modalDiagramRef = useRef<HTMLDivElement | null>(null);

  // Parse or construct rich visual node details
  const visualNodes: VisualNodeDetail[] = useMemo(() => {
    if (visualNodesJson) {
      try {
        const parsed = JSON.parse(visualNodesJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn("[VisualMindmap] Error parsing visualNodesJson:", e);
      }
    }
    // Fallback structured nodes
    return [
      {
        id: "node_1",
        title: `Fondasi Teori ${topic}`,
        category: "Fondasi Konseptual",
        shortDefinition: summary || `Prinsip fundamental penyusun konsep ${topic}.`,
        keyPrinciples: [
          "Definisi dan batasan terminologi resmi",
          "Komponen statis dan parameter acuan",
          "Kondisi prasyarat sistem",
        ],
        realWorldAnalogy: "Bagaikan fondasi beton kokoh yang menopang seluruh struktur pencakar langit.",
        comparisonWithOtherNodes: [
          {
            targetNode: "Mekanisme Dinamis",
            differences: "Bersifat statis sebagai landasan acuan, bukan proses yang bergerak.",
            similarities: "Keduanya terikat pada aksioma hukum sains yang sama.",
          },
        ],
        practicalApplications: ["Identifikasi variabel awal", "Penentuan parameter standar"],
      },
      {
        id: "node_2",
        title: "Mekanisme & Dinamika Reaksi",
        category: "Dinamika Proses",
        shortDefinition: "Cara kerja aktif bagaimana antar-variabel saling berinteraksi, bertransformasi, dan mengalir.",
        keyPrinciples: [
          "Hukum aksi-reaksi timbal balik",
          "Kinetika laju dan energi aktivasi",
          "Faktor katalisator dan inhibitor",
        ],
        realWorldAnalogy: "Bagaikan gir-gir mesin jam tangan mekanis yang berputar serentak mengatur waktu.",
        comparisonWithOtherNodes: [
          {
            targetNode: "Fondasi Teori",
            differences: "Bekerja secara kinetik dan responsif terhadap perubahan variabel lingkungan.",
            similarities: "Membutuhkan kestabilan fondasi untuk beroperasi sempurna.",
          },
        ],
        practicalApplications: ["Pengendalian laju eksperimen", "Optimasi efisiensi konversi sistem"],
      },
      {
        id: "node_3",
        title: "Penerapan & Sintesis Solusi",
        category: "Aplikasi Terapan",
        shortDefinition: "Implementasi konkret konsep dalam teknologi, pemecahan masalah nyata, dan kehidupan sehari-hari.",
        keyPrinciples: [
          "Efisiensi energi dan sumber daya",
          "Mitigasi efek samping dan batasan sistem",
          "Integrasi multi-disiplin ilmu",
        ],
        realWorldAnalogy: "Bagaikan mobil listrik mutakhir yang memadukan aerodinamika, kimia baterai, dan kecerdasan komputasi.",
        comparisonWithOtherNodes: [
          {
            targetNode: "Mekanisme & Dinamika",
            differences: "Fokus pada produk luaran (output), bukan tahapan intermediate reaksi.",
            similarities: "Hasil mutlak ditentukan oleh ketepatan mekanisme.",
          },
        ],
        practicalApplications: ["Inovasi teknologi industri", "Solusi mitigasi tantangan global"],
      },
    ];
  }, [visualNodesJson, topic, summary]);

  // Helper: Sanitize & clean Mermaid code from LLM
  const sanitizeMermaidCode = (rawCode: string): string => {
    let clean = rawCode
      .replace(/```mermaid/gi, "")
      .replace(/```/g, "")
      .trim();

    if (!clean.startsWith("graph") && !clean.startsWith("flowchart") && !clean.startsWith("mindmap")) {
      clean = `graph TD\n${clean}`;
    }

    clean = clean.replace(/\[\s*([^[\]]+)\s*\]/g, (match, p1) => {
      const safe = p1.replace(/["'()]/g, "").trim();
      return `["${safe}"]`;
    });

    return clean;
  };

  // Render Mermaid code to real SVG
  const renderMermaidToSvg = async (code: string) => {
    const cleanCode = sanitizeMermaidCode(code);
    const uniqueId = `mermaid_diag_${Date.now()}`;
    try {
      const { svg } = await mermaid.render(uniqueId, cleanCode);
      setDiagramSvg(svg);
      setDiagramError(null);
    } catch (err: any) {
      console.warn("[Mermaid] Render parse error, trying fallback flowchart:", err);
      const fallbackCode = `graph TD
  Root["${topic.slice(0, 30)}"] --> P1["Pilar Konsep 1"]
  Root --> P2["Pilar Konsep 2"]
  Root --> P3["Aplikasi & Implikasi"]
  P1 --> D1["Dasar Pemahaman"]
  P2 --> D2["Mekanisme Inti"]
  P3 --> D3["Evaluasi Mandiri"]`;
      try {
        const { svg: fallbackSvg } = await mermaid.render(`mermaid_fb_${Date.now()}`, fallbackCode);
        setDiagramSvg(fallbackSvg);
        setDiagramError(null);
      } catch (fbErr) {
        setDiagramError("Gagal merender diagram visual.");
      }
    }
  };

  // Attach interactive click handlers and hover effects to Mermaid SVG nodes
  const attachNodeListeners = (container: HTMLDivElement | null) => {
    if (!container) return;
    const nodes = container.querySelectorAll("g.node");
    nodes.forEach((nodeEl, idx) => {
      const nodeHtmlEl = nodeEl as HTMLElement;
      nodeHtmlEl.style.cursor = "pointer";
      nodeHtmlEl.style.transition = "transform 0.15s ease, filter 0.15s ease";

      const onMouseEnter = () => {
        nodeHtmlEl.style.transform = "scale(1.04)";
        nodeHtmlEl.style.filter = "drop-shadow(0 6px 12px rgba(29, 94, 77, 0.4))";
      };
      const onMouseLeave = () => {
        nodeHtmlEl.style.transform = "scale(1)";
        nodeHtmlEl.style.filter = "none";
      };
      const onClick = () => {
        audioSynth.playClickSound();
        const nodeText = nodeHtmlEl.textContent?.trim() || "";
        const matched =
          visualNodes.find(
            (vn) =>
              nodeText.toLowerCase().includes(vn.title.toLowerCase()) ||
              vn.title.toLowerCase().includes(nodeText.toLowerCase())
          ) || visualNodes[idx % visualNodes.length];

        setSelectedNodeDetail(matched);
        setShowNodeModal(true);
      };

      nodeHtmlEl.addEventListener("mouseenter", onMouseEnter);
      nodeHtmlEl.addEventListener("mouseleave", onMouseLeave);
      nodeHtmlEl.addEventListener("click", onClick);
    });
  };

  useEffect(() => {
    if (diagramSvg) {
      attachNodeListeners(diagramContainerRef.current);
    }
  }, [diagramSvg, visualNodes]);

  useEffect(() => {
    if (showDiagramModal && diagramSvg) {
      setTimeout(() => attachNodeListeners(modalDiagramRef.current), 100);
    }
  }, [showDiagramModal, diagramSvg, visualNodes]);

  // Trigger EduAdapt AI Image Generation
  const handleGenerateImage = async () => {
    audioSynth.playClickSound();
    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const prompt = `Educational scientific diagram and concept illustration of: ${topic}. Clean educational infographic, labelled components, modern science illustration aesthetic.`;
      const res = await ApiService.generateImageAI({ prompt, size: "1024x1024" });
      if (res && res.data && res.data[0]) {
        const item = res.data[0];
        if (item.b64_json) {
          setGeneratedImageB64(`data:image/png;base64,${item.b64_json}`);
        } else if (item.url) {
          setGeneratedImageB64(item.url);
        }
        audioSynth.playSuccessSound();
      } else {
        setImageError("Tidak dapat memuat gambar dari EduAdapt AI Studio.");
      }
    } catch (err: any) {
      setImageError("Gagal menghubungi gateway AI gambar.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Trigger AI Diagram Generation & Render immediately to SVG
  const handleGenerateDiagram = async () => {
    audioSynth.playClickSound();
    setIsGeneratingDiagram(true);
    setDiagramError(null);

    try {
      const res = await ApiService.generateDiagramAI(topic);
      if (res && res.code) {
        await renderMermaidToSvg(res.code);
        audioSynth.playSuccessSound();
      } else {
        const initialCode = `graph TD
  A["📌 ${topic.slice(0, 30)}"] --> B["Intisari Materi"]
  A --> C["Komponen Kunci"]
  B --> D["Prinsip & Mekanisme"]
  C --> E["Penerapan Konsep"]`;
        await renderMermaidToSvg(initialCode);
        audioSynth.playSuccessSound();
      }
    } catch (err) {
      setDiagramError("Gagal memproses diagram visual.");
    } finally {
      setIsGeneratingDiagram(false);
    }
  };

  // Pre-load visual image if provided from pre-generated classroom asset
  useEffect(() => {
    if (visualImageUrl) {
      setGeneratedImageB64(visualImageUrl);
    }
  }, [visualImageUrl]);

  // Auto-render pre-generated mindmap code, or fallback to clean initial concept diagram
  useEffect(() => {
    if (mindmapCode) {
      renderMermaidToSvg(mindmapCode);
    } else if (!diagramSvg && topic) {
      const defaultDiagram = `graph TD
  Main["📘 ${topic.slice(0, 35)}"] --> Sub1["1. Konsep Dasar"]
  Main --> Sub2["2. Struktur & Fungsi"]
  Main --> Sub3["3. Analisis & Evaluasi"]
  Sub1 --> Detail1["Pemahaman Premis"]
  Sub2 --> Detail2["Hubungan Antar-Elemen"]
  Sub3 --> Detail3["Refleksi Pembelajaran"]`;
      renderMermaidToSvg(defaultDiagram);
    }
  }, [mindmapCode, topic]);

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. VISUAL PETA KONSEP & DIAGRAM ALUR INTERAKTIF SVG      */}
      {/* ========================================================= */}
      <section className="clay-card p-5 sm:p-6 bg-white space-y-4 rounded-3xl border border-black/5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EBF6F2] text-[#1D5E4D] flex items-center justify-center shadow-2xs">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1D5E4D] block">
                  Graf Konsep Interaktif • SVG / Mermaid
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#1D5E4D] text-white text-[9px] font-extrabold animate-pulse">
                  Klik Simpul Node
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-[#1C1E26] mt-0.5">
                Diagram Hubungan Konsep Materi
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Zoom Controls */}
            {diagramSvg && (
              <div className="flex items-center gap-1 bg-[#F4F0FD] p-1 rounded-xl">
                <button
                  onClick={() => setZoomScale((prev) => Math.max(0.7, prev - 0.15))}
                  className="p-1 rounded-lg hover:bg-white text-[#4B3B7A] cursor-pointer"
                  title="Perkecil Diagram"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-[#4B3B7A] px-1">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((prev) => Math.min(1.6, prev + 0.15))}
                  className="p-1 rounded-lg hover:bg-white text-[#4B3B7A] cursor-pointer"
                  title="Perbesar Diagram"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomScale(1.0)}
                  className="p-1 rounded-lg hover:bg-white text-[#4B3B7A] cursor-pointer"
                  title="Reset Ukuran"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowDiagramModal(true)}
                  className="p-1 rounded-lg hover:bg-white text-[#4B3B7A] cursor-pointer ml-0.5"
                  title="Layar Penuh"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Regenerate Button */}
            <button
              onClick={handleGenerateDiagram}
              disabled={isGeneratingDiagram}
              className="clay-btn clay-btn-dark px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isGeneratingDiagram ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyusun...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Diagram AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tip Interaktif */}
        <div className="bg-[#EBF6F2]/60 px-4 py-2 rounded-2xl border border-[#9DE1CA]/40 flex items-center justify-between text-xs text-[#124B3D] font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              <strong>Tip Visual:</strong> Setiap simpul (node) pada diagram di bawah dapat diklik untuk membuka{" "}
              <em>Kartu Komparasi Visual & Analogi Mendalam</em>.
            </span>
          </div>
        </div>

        {/* DIAGRAM CANVAS AREA */}
        <div className="relative rounded-2xl bg-[#FAFBFD] border border-black/5 overflow-hidden min-h-[300px] sm:min-h-[360px] flex items-center justify-center p-4 shadow-inner">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#1D5E4D 0.75px, transparent 0.75px)",
              backgroundSize: "16px 16px",
            }}
          />

          {diagramSvg ? (
            <div
              ref={diagramContainerRef}
              className="w-full flex items-center justify-center transition-transform duration-200 overflow-x-auto p-2 cursor-crosshair"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: "center center" }}
              dangerouslySetInnerHTML={{ __html: diagramSvg }}
            />
          ) : isGeneratingDiagram ? (
            <div className="text-center space-y-2 relative z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#1D5E4D] mx-auto" />
              <p className="text-xs font-bold text-[#1D5E4D]">Menyusun relasi konsep visual via AI...</p>
            </div>
          ) : (
            <div className="text-center space-y-2 relative z-10">
              <GitBranch className="w-8 h-8 text-[#5A5E70] mx-auto opacity-50" />
              <p className="text-xs text-[#5A5E70]">Diagram belum dibuat. Klik tombol "Generate Diagram AI" di atas.</p>
            </div>
          )}
        </div>

        {diagramError && (
          <p className="text-xs text-[#BA1A1A] bg-[#FCD9D7] p-2.5 rounded-xl font-medium">⚠️ {diagramError}</p>
        )}
      </section>

      {/* ========================================================= */}
      {/* 2. VISUAL STORYBOARD PLAYER (LINIMASA TAHAP KONSEP)       */}
      {/* ========================================================= */}
      <section className="clay-card clay-mint p-5 sm:p-6 text-[#124B3D] space-y-5 rounded-3xl shadow-sm border border-[#1D5E4D]/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1D5E4D]/15 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white text-[#1D5E4D] flex items-center justify-center shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1D5E4D]/80 block">
                Visual Storyboard Player • Linimasa Alur Pembelajaran
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#082921] mt-0.5">
                Eksplorasi Bertahap Komparasi Konsep
              </h3>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center gap-2">
            <button
              disabled={activeStoryboardStep === 0}
              onClick={() => {
                audioSynth.playClickSound();
                setActiveStoryboardStep((prev) => Math.max(0, prev - 1));
              }}
              className="p-2 rounded-xl bg-white text-[#1D5E4D] hover:bg-[#D1EBE1] transition-all disabled:opacity-30 cursor-pointer shadow-2xs"
              title="Tahap Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-[#1D5E4D] px-2 font-mono">
              {activeStoryboardStep + 1} / {visualNodes.length}
            </span>

            <button
              disabled={activeStoryboardStep === visualNodes.length - 1}
              onClick={() => {
                audioSynth.playClickSound();
                setActiveStoryboardStep((prev) => Math.min(visualNodes.length - 1, prev + 1));
              }}
              className="p-2 rounded-xl bg-white text-[#1D5E4D] hover:bg-[#D1EBE1] transition-all disabled:opacity-30 cursor-pointer shadow-2xs"
              title="Tahap Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {visualNodes.map((node, idx) => (
            <button
              key={node.id || idx}
              onClick={() => {
                audioSynth.playClickSound();
                setActiveStoryboardStep(idx);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStoryboardStep === idx
                  ? "bg-[#1D5E4D] text-white shadow-xs font-extrabold scale-102"
                  : "bg-white/70 text-[#124B3D] hover:bg-white"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/10 text-[9px] flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              <span className="truncate max-w-[150px]">{node.title}</span>
            </button>
          ))}
        </div>

        {/* Active Storyboard Card Preview */}
        {visualNodes[activeStoryboardStep] && (
          <div className="bg-white/95 p-5 sm:p-6 rounded-2xl border border-[#1D5E4D]/20 shadow-xs space-y-4 animate-in fade-in zoom-in-98 duration-200">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EBF6F2] text-[#1D5E4D] text-[10px] font-extrabold uppercase tracking-wide">
                  {visualNodes[activeStoryboardStep].category || "Fase Konsep"}
                </span>
                <h4 className="text-base sm:text-lg font-black text-[#082921] mt-1">
                  {visualNodes[activeStoryboardStep].title}
                </h4>
              </div>

              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setSelectedNodeDetail(visualNodes[activeStoryboardStep]);
                  setShowNodeModal(true);
                }}
                className="clay-btn clay-btn-dark px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Buka Kartu Komparasi</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#010105] leading-relaxed font-medium">
              {visualNodes[activeStoryboardStep].shortDefinition}
            </p>

            {/* Visual Analogy Box */}
            {visualNodes[activeStoryboardStep].realWorldAnalogy && (
              <div className="p-3.5 rounded-xl bg-[#FFF4DC] border border-[#785308]/15 flex items-start gap-2.5 text-xs text-[#4A3205]">
                <Lightbulb className="w-4 h-4 text-[#785308] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-[11px] text-[#785308] uppercase">Analogi Visual:</strong>
                  <span>{visualNodes[activeStoryboardStep].realWorldAnalogy}</span>
                </div>
              </div>
            )}

            {/* Principles Badges */}
            {visualNodes[activeStoryboardStep].keyPrinciples?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#1D5E4D] uppercase block">Prinsip Pokok:</span>
                <div className="flex flex-wrap gap-2">
                  {visualNodes[activeStoryboardStep].keyPrinciples.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      className="px-2.5 py-1 rounded-lg bg-[#EBF6F2] text-[#124B3D] text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5E4D]" />
                      <span>{p}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 3. INFOGRAFIS & ILUSTRASI GAMBAR AI (EDUADAPT STUDIO)     */}
      {/* ========================================================= */}
      <section className="clay-card clay-mint p-5 sm:p-6 text-[#124B3D] space-y-4 rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1D5E4D]/15 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white text-[#1D5E4D] flex items-center justify-center shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1D5E4D]/80 block">
                Ilustrasi Visual • EduAdapt AI Studio
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#082921] mt-0.5">
                Infografis Konsep Edukasi
              </h3>
            </div>
          </div>

          <button
            onClick={handleGenerateImage}
            disabled={isGeneratingImage}
            className="clay-btn clay-btn-white px-4 py-1.5 rounded-xl text-xs font-black text-[#1D5E4D] inline-flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat Gambar...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#1D5E4D]" />
                <span>{generatedImageB64 ? "Regenerate Gambar" : "Generate Gambar AI"}</span>
              </>
            )}
          </button>
        </div>

        {/* Image Display Area */}
        {generatedImageB64 ? (
          <div className="relative group rounded-2xl overflow-hidden border-2 border-[#1D5E4D]/20 shadow-xs bg-white">
            <img
              src={generatedImageB64}
              alt={`Visualisasi ${topic}`}
              className="w-full max-h-96 object-contain mx-auto bg-black/5"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => setShowImageModal(true)}
                className="clay-btn clay-btn-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Perbesar Gambar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-2 bg-white/70 rounded-2xl border border-[#1D5E4D]/10">
            <div className="w-10 h-10 rounded-xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center mx-auto shadow-2xs">
              <Eye className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#1D5E4D]">Gambar ilustrasi materi belum digenerate.</p>
            <p className="text-[11px] text-[#5A5E70] max-w-sm mx-auto">
              Klik tombol di atas untuk membuat ilustrasi saintifik visual menggunakan model visual AI EduAdapt.
            </p>
          </div>
        )}

        {imageError && (
          <p className="text-xs text-[#BA1A1A] bg-[#FCD9D7] p-2.5 rounded-xl font-medium">⚠️ {imageError}</p>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. MODAL KARTU KOMPARASI VISUAL (SAAT NODE DIKLIK)        */}
      {/* ========================================================= */}
      {showNodeModal && selectedNodeDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl space-y-5 border border-black/10 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#EBF6F2] text-[#1D5E4D] text-[10px] font-extrabold uppercase tracking-wide">
                  {selectedNodeDetail.category || "Komparasi Visual"}
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-[#1C1E26] mt-1">
                  {selectedNodeDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setShowNodeModal(false)}
                className="p-2 rounded-xl hover:bg-black/5 text-[#5A5E70] cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Definisi Singkat */}
            <div className="p-4 rounded-2xl bg-[#FAFBFD] border border-black/5 space-y-1">
              <span className="text-[10px] font-bold text-[#5A5E70] uppercase tracking-wider block">
                Definisi &amp; Pemahaman Inti:
              </span>
              <p className="text-xs sm:text-sm text-[#1C1E26] leading-relaxed font-semibold">
                {selectedNodeDetail.shortDefinition}
              </p>
            </div>

            {/* Analogi Dunia Nyata */}
            {selectedNodeDetail.realWorldAnalogy && (
              <div className="p-4 rounded-2xl bg-[#FFF9EE] border border-[#785308]/20 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-[#785308] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-extrabold text-[#785308] uppercase tracking-wide block">
                    Analogi Visual Dunia Nyata:
                  </span>
                  <p className="text-xs sm:text-sm text-[#4A3205] leading-relaxed">
                    "{selectedNodeDetail.realWorldAnalogy}"
                  </p>
                </div>
              </div>
            )}

            {/* Prinsip-Prinsip Kunci */}
            {selectedNodeDetail.keyPrinciples?.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-[#1C1E26] uppercase tracking-wide block">
                  Prinsip Kunci &amp; Kaidah Pokok:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedNodeDetail.keyPrinciples.map((principle, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F8F9FD] border border-black/5 text-xs text-[#1C1E26] font-medium flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#1D5E4D] shrink-0 mt-0.5" />
                      <span>{principle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kartu Komparasi dengan Node/Konsep Lain */}
            {selectedNodeDetail.comparisonWithOtherNodes && selectedNodeDetail.comparisonWithOtherNodes.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-black/5">
                <span className="text-[11px] font-extrabold text-[#1C1E26] uppercase tracking-wide block">
                  Tabel Komparasi Terhadap Konsep Lain:
                </span>
                <div className="space-y-2.5">
                  {selectedNodeDetail.comparisonWithOtherNodes.map((comp, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#FAF8FD] border border-[#4B3B7A]/15 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#4B3B7A]" />
                        <span className="text-xs font-black text-[#4B3B7A]">
                          Perbandingan dengan: {comp.targetNode}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-black/5">
                          <strong className="text-[#BA1A1A] block mb-1 text-[10px] uppercase font-bold">
                            Perbedaan Pokok:
                          </strong>
                          <span className="text-[#5A5E70] leading-relaxed">{comp.differences}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-black/5">
                          <strong className="text-[#1D5E4D] block mb-1 text-[10px] uppercase font-bold">
                            Titik Kesamaan:
                          </strong>
                          <span className="text-[#5A5E70] leading-relaxed">{comp.similarities}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aplikasi Praktis */}
            {selectedNodeDetail.practicalApplications?.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-black/5">
                <span className="text-[11px] font-extrabold text-[#1C1E26] uppercase tracking-wide block">
                  Aplikasi Nyata Sains &amp; Teknologi:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedNodeDetail.practicalApplications.map((app, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-[#EBF6F2] text-[#1D5E4D] text-xs font-bold"
                    >
                      🚀 {app}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Close */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowNodeModal(false)}
                className="clay-btn clay-btn-dark px-5 py-2.5 rounded-2xl text-xs font-black cursor-pointer shadow-xs"
              >
                Tutup Kartu Komparasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FULL DIAGRAM PREVIEW */}
      {showDiagramModal && diagramSvg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-5xl w-full bg-white rounded-3xl p-5 overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-[#1C1E26]">{topic} - Peta Konsep Lengkap</h3>
              <button
                onClick={() => setShowDiagramModal(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#5A5E70] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              ref={modalDiagramRef}
              className="w-full max-h-[80vh] overflow-auto p-4 flex items-center justify-center bg-[#FAFBFD] rounded-2xl"
              dangerouslySetInnerHTML={{ __html: diagramSvg }}
            />
          </div>
        </div>
      )}

      {/* MODAL FULL IMAGE PREVIEW */}
      {showImageModal && generatedImageB64 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-[#1C1E26]">{topic} - Ilustrasi AI</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#5A5E70] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={generatedImageB64} alt={topic} className="w-full max-h-[75vh] object-contain rounded-2xl bg-black/5" />
          </div>
        </div>
      )}
    </div>
  );
}
