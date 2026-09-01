import React, { useState, useMemo } from "react";
import { GroundedDocument } from "@/types";
import { API_BASE_URL } from "@/services/apiClient";
import InteractiveConceptMap from "@/components/student/InteractiveConceptMap";
import AdaptiveFlashcards, { FlashcardItem } from "@/components/student/AdaptiveFlashcards";
import RichInfographicStudio from "@/components/student/RichInfographicStudio";
import { audioSynth } from "@/services/audioSynth";
import {
  Layers,
  BookOpen,
  Sparkles,
  Eye,
  Maximize2,
  X,
  ImageIcon,
  Download,
  GitBranch,
} from "@/components/ui/icons";

interface VisualLearnSectionProps {
  doc: GroundedDocument;
}

export default function VisualLearnSection({ doc }: VisualLearnSectionProps) {
  const [activeVisualTab, setActiveVisualTab] = useState<"MAP" | "INFOGRAPHIC">("MAP");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Helper resolusi URL gambar visual backend
  const resolveImageUrl = (url: string | undefined): string => {
    const raw = url || (doc.id ? `/api/v1/documents/${doc.id}/visual-image` : "");
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("blob:") || raw.startsWith("data:")) {
      return raw;
    }
    const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${cleanBase}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const visualImgSrc = resolveImageUrl(doc.visualImageUrl);

  // Flashcards items parsed from backend JSON or smart fallback
  const flashcardItems: FlashcardItem[] = useMemo(() => {
    if (doc.flashcardsJson) {
      try {
        const parsed = JSON.parse(doc.flashcardsJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((fc: any, idx: number) => ({
            id: fc.id || `fc_${idx + 1}`,
            question: fc.question || "Konsep apa yang dibahas pada bagian ini?",
            answer: fc.answer || "Penjelasan materi konsep ter-grounding.",
            hint: fc.hint || `Perhatikan bahasan ke-${idx + 1} dari modul.`,
            conceptTag: fc.conceptTag || `KONSEP 0${idx + 1}`,
          }));
        }
      } catch (e) {
        console.warn("[VisualLearnSection] Error parsing flashcardsJson:", e);
      }
    }

    // Programmatic fallback from text
    const paras = (doc.rawText || doc.summary || "").split("\n\n").filter((p) => p.trim().length > 30);
    return paras.slice(0, 5).map((p, idx) => {
      const sentences = p.split(/(?<=[.?!])\s+/);
      return {
        id: `fc_fallback_${idx + 1}`,
        question: `Apa prinsip kunci yang terkandung dalam gagasan: "${sentences[0]?.slice(0, 75)}..."?`,
        answer: sentences.slice(1, 3).join(" ") || p.slice(0, 160),
        hint: `Lihat keterkaitan sebab-akibat pada bagian ${idx + 1}.`,
        conceptTag: `KONSEP 0${idx + 1}`,
      };
    });
  }, [doc.flashcardsJson, doc.rawText, doc.summary]);

  return (
    <div className="space-y-6">
      {/* 🧭 VISUAL MODE SWITCHER HEADER */}
      <section className="clay-card bg-white p-3.5 sm:p-4 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF6F2] text-[#1D5E4D] flex items-center justify-center shadow-2xs">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C1E26]">
              Studio Pembelajaran Visual
            </h2>
            <p className="text-[11px] text-[#5A5E70]">
              Eksplorasi konsep melalui diagram alir interaktif dan infografis visual beresolusi tinggi.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F8F9FD] rounded-2xl border border-black/5">
          <button
            type="button"
            onClick={() => {
              audioSynth.playClickSound();
              setActiveVisualTab("MAP");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeVisualTab === "MAP"
                ? "bg-[#1D5E4D] text-white shadow-xs"
                : "text-[#1D5E4D] hover:bg-[#EBF6F2]"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Peta Konsep Interaktif</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioSynth.playClickSound();
              setActiveVisualTab("INFOGRAPHIC");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeVisualTab === "INFOGRAPHIC"
                ? "bg-[#4B3B7A] text-white shadow-xs"
                : "text-[#4B3B7A] hover:bg-[#F4F0FD]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Infografis Poster AI</span>
          </button>
        </div>
      </section>

      {/* 🌟 1. INTERACTIVE REACT FLOW CONCEPT MAP */}
      {activeVisualTab === "MAP" && (
        <InteractiveConceptMap doc={doc} />
      )}

      {/* 🖼️ 2. AI VISUAL INFOGRAPHIC STUDIO (DUAL HYBRID HD) */}
      {activeVisualTab === "INFOGRAPHIC" && (
        <RichInfographicStudio doc={doc} />
      )}

      {/* 🃏 3. ADAPTIVE VISUAL FLASHCARDS REVIEW */}
      <section className="clay-card bg-white p-4 sm:p-6 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF4DC] text-[#785308] flex items-center justify-center shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#1C1E26]">
              Kartu Flashcard Uji Ingatan Cepat
            </h3>
            <p className="text-xs text-[#5A5E70]">
              Balik kartu untuk menguji daya ingat spasial dan pemahaman definisimu.
            </p>
          </div>
        </div>

        <AdaptiveFlashcards
          cards={flashcardItems}
          topicTitle={doc.title}
        />
      </section>

      {/* 🔍 FULLSCREEN IMAGE MODAL */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/20 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#4B3B7A]" />
                <h4 className="text-sm font-black text-[#1C1E26]">
                  Poster Infografis Visual: {doc.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#5A5E70] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-[#0E0D14] rounded-2xl my-3">
              <img
                src={visualImgSrc}
                alt={`Infografis ${doc.title}`}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#5A5E70]">Resolusi Tinggi HD • Generated by EduAdapt AI</span>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="clay-btn clay-btn-dark px-5 py-2 rounded-xl text-xs font-black"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
