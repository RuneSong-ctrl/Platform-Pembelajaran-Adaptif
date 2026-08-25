import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  Eye,
  Headphones,
  FlaskConical,
  Play,
  Pause,
  Sparkles,
  Volume2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Check,
  School,
  Bot,
} from "@/components/ui/icons";

export default function AdaptiveLearnPage() {
  const navigate = useNavigate();
  const { currentUser, documents, classrooms } = useApp();

  const style = currentUser.learningStyle || "VISUAL";

  // Find student's enrolled classrooms
  const myClassrooms = classrooms.filter((c) =>
    Boolean(currentUser?.id && c.studentIds?.includes(currentUser.id))
  );
  // Active document from enrolled classroom or global first document
  const activeDoc =
    documents.find((d) => myClassrooms.some((c) => c.id === d.classroomId)) ||
    documents[0];

  const activeClassroom = classrooms.find((c) => c.id === activeDoc?.classroomId);

  // Audio Player State (Auditory student exclusive)
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);

  // Derive dynamic sections/chunks from document raw text
  const docParagraphs = (activeDoc?.rawText || "")
    .split(/\n\n|\.\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 15);

  const dynamicEpisodes =
    docParagraphs.length > 0
      ? docParagraphs.slice(0, 4).map((p, idx) => ({
          title: `Bagian ${idx + 1}: ${p.slice(0, 45)}...`,
          duration: `0${Math.min(9, Math.max(2, Math.ceil(p.length / 50)))}:${String(
            (idx * 17 + 24) % 60
          ).padStart(2, "0")}`,
          transcript: p,
        }))
      : [
          {
            title: "Bagian 1: Ringkasan Modul Pembelajaran",
            duration: "03:15",
            transcript: activeDoc?.summary || activeDoc?.rawText || "Materi pembelajaran adaptif.",
          },
        ];

  // Kinesthetic interactive concept matching
  const [matchedItems, setMatchedItems] = useState<{ [itemId: string]: string }>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [simulationCompleted, setSimulationCompleted] = useState(false);

  const simulationItems =
    docParagraphs.length >= 2
      ? docParagraphs.slice(0, 4).map((p, idx) => ({
          id: `item_${idx}`,
          name: `Konsep ${idx + 1}: ${p.slice(0, 35)}...`,
          targetZone: `zone_${idx}`,
          label: `K-0${idx + 1}`,
        }))
      : [
          { id: "item_0", name: "Pemahaman Inti Materi", targetZone: "zone_0", label: "Konsep 1" },
          { id: "item_1", name: "Aplikasi Skenario Masalah", targetZone: "zone_1", label: "Konsep 2" },
        ];

  const simulationZones = simulationItems.map((item, idx) => ({
    id: `zone_${idx}`,
    name: `Langkah ${idx + 1}`,
    desc: `Penerapan target analisis ${idx + 1}`,
  }));

  const handleZoneClick = (zoneId: string) => {
    if (!selectedItem) return;
    audioSynth.playClickSound();
    const updated = { ...matchedItems, [selectedItem]: zoneId };
    setMatchedItems(updated);
    setSelectedItem(null);

    if (Object.keys(updated).length === simulationItems.length) {
      const allCorrect = simulationItems.every((it) => updated[it.id] === it.targetZone);
      if (allCorrect) {
        audioSynth.playLevelUpSound();
        confetti({ particleCount: 70, spread: 60 });
        setSimulationCompleted(true);
      }
    }
  };

  const handleResetSimulation = () => {
    audioSynth.playClickSound();
    setMatchedItems({});
    setSelectedItem(null);
    setSimulationCompleted(false);
  };

  const handleToggleAudio = () => {
    audioSynth.playClickSound();
    const ep = dynamicEpisodes[activeEpisode] || dynamicEpisodes[0];
    if (ep) {
      handleTTSRead(ep.transcript);
    }
  };

  const handleTTSRead = (text: string) => {
    audioSynth.playClickSound();
    if ("speechSynthesis" in window) {
      if (isSpeakingSummary || isPlaying) {
        window.speechSynthesis.cancel();
        setIsSpeakingSummary(false);
        setIsPlaying(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "id-ID";
        utterance.rate = playbackSpeed;
        utterance.onend = () => {
          setIsSpeakingSummary(false);
          setIsPlaying(false);
        };
        utterance.onerror = () => {
          setIsSpeakingSummary(false);
          setIsPlaying(false);
        };
        setIsSpeakingSummary(true);
        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col pb-24 md:pb-8">
      <Navbar />

      <div className="flex flex-1 w-full">
        <StudentSidebar />

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-5 min-w-0 flex flex-col gap-5">
          {/* Top Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to="/student"
              onClick={() => audioSynth.playClickSound()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-2xs text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Beranda Siswa</span>
            </Link>

            {/* Modalitas Eksklusif Pill */}
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-2xs ${
                style === "AUDITORI"
                  ? "bg-[#E3DBF8] text-[#4B3B7A]"
                  : style === "KINESTETIK"
                  ? "bg-[#FEE7B3] text-[#785308]"
                  : "bg-[#D1EBE1] text-[#1D5E4D]"
              }`}
            >
              {style === "AUDITORI" && <Headphones className="w-3 h-3" />}
              {style === "KINESTETIK" && <FlaskConical className="w-3 h-3" />}
              {style === "VISUAL" && <Eye className="w-3 h-3" />}
              <span>
                Materi Khusus {style === "AUDITORI" ? "Auditori" : style === "KINESTETIK" ? "Kinestetik" : "Visual"}
              </span>
            </span>
          </div>

          {!activeDoc ? (
            /* CLEAN EMPTY STATE WHEN TEACHER HAS NOT ADDED MODULES */
            <div className="clay-card clay-white p-8 sm:p-12 rounded-3xl border border-black/5 text-center space-y-4 shadow-xs my-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF6F2] text-[#1D5E4D] flex items-center justify-center mx-auto shadow-2xs">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h2 className="text-lg sm:text-xl font-black text-[#1C1E26]">
                  Belum Ada Materi Pembelajaran Aktif
                </h2>
                <p className="text-xs sm:text-sm text-[#595F72] leading-relaxed">
                  Guru di kelasmu belum mengunggah modul ajar atau silabus PDF ke sistem. Kamu dapat bergabung ke kelas guru menggunakan kode kelas atau mulai berdiskusi secara mandiri bersama Asisten AI Tutor.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Link
                  to="/student/class"
                  onClick={() => audioSynth.playClickSound()}
                  className="clay-btn clay-btn-dark px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <School className="w-4 h-4" />
                  <span>Cek Ruang Kelas</span>
                </Link>
                <Link
                  to="/student/ai"
                  onClick={() => audioSynth.playClickSound()}
                  className="clay-btn clay-btn-white px-5 py-2.5 rounded-2xl text-xs font-bold text-[#1C1E26] flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Bot className="w-4 h-4 text-[#4B3B7A]" />
                  <span>Tanya Asisten AI Tutor</span>
                </Link>
              </div>
            </div>
          ) : (
            /* DYNAMIC CONTENT WHEN DOCUMENT EXISTS */
            <>
              {/* Header Topic Meta */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-[#1C1E26] border border-[rgba(28,30,38,0.08)]">
                    {activeClassroom?.name || "Kelas Adaptif"}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#5A5E70]">
                    {activeDoc.vectorId || "VEC-DOC"}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#010105]">
                  {activeDoc.title}
                </h1>
                <p className="text-xs text-[#5A5E70] font-medium mt-0.5">
                  {activeDoc.summary || "Materi kurikulum ter-grounding disajikan eksklusif sesuai profil kognitifmu."}
                </p>
              </div>

              {/* ========================================================= */}
              {/* 1. VISUAL MODE DYNAMIC CONTENT                           */}
              {/* ========================================================= */}
              {style === "VISUAL" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Visual Overview Card */}
                  <section className="clay-card clay-mint p-5 text-[#124B3D] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1D5E4D]/80 block">
                          Peta Visual Konsep
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-[#082921] mt-0.5">
                          Struktur Inti &amp; Konsep Pembelajaran
                        </h2>
                      </div>
                      <div className="w-9 h-9 rounded-2xl bg-white/80 text-[#1D5E4D] flex items-center justify-center shrink-0">
                        <Eye className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Sequential Visual Concept Cards - Vertical Stack */}
                    <div className="flex flex-col gap-3 pt-1">
                      {docParagraphs.slice(0, 4).map((para, idx) => (
                        <div
                          key={idx}
                          className="bg-white/90 p-4 rounded-2xl border border-[rgba(29,94,77,0.15)] shadow-xs flex flex-col gap-1.5"
                        >
                          <span className="text-[10px] font-extrabold text-[#1D5E4D] uppercase tracking-wider block">
                            Poin Kunci {idx + 1}
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-[#010105] leading-relaxed">
                            {para}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Summary Callout */}
                  <section className="clay-card p-5 space-y-3 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl clay-card clay-mint flex items-center justify-center text-[#1D5E4D]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#010105]">
                          Teks Modul Lengkap
                        </h3>
                        <p className="text-[10px] text-[#5A5E70]">
                          Sumber Ter-Grounding: {activeDoc.title}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#EBF6F2] border border-[rgba(29,94,77,0.1)] text-xs text-[#1D5E4D] font-medium leading-relaxed whitespace-pre-line">
                      {activeDoc.rawText}
                    </div>
                  </section>

                  {/* AI Companion Visual Cue Card */}
                  <section className="clay-card clay-sky p-4 text-[#153A66] flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#21518A] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold text-[#21518A]">
                        Petunjuk Visual AI Companion
                      </h4>
                      <p className="text-[11px] text-[#153A66] mt-0.5 leading-relaxed">
                        Fokus pada keterkaitan antarkonsep di atas sebelum menyelesaikan tantangan evaluasi adaptif.
                      </p>
                    </div>
                  </section>

                  {/* Action to Quiz */}
                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      navigate("/quiz");
                    }}
                    className="clay-btn clay-btn-dark w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Uji Pemahaman di Kuis Adaptif DDA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. AUDITORY MODE DYNAMIC CONTENT                         */}
              {/* ========================================================= */}
              {style === "AUDITORI" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Podcast Master Player Card */}
                  <section className="clay-card clay-lavender p-5 text-[#2D2152] space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B3B7A]/80 block">
                          Now Playing • Bagian {activeEpisode + 1}
                        </span>
                        <h2 className="text-sm sm:text-base font-black text-[#1E143D] mt-0.5">
                          {dynamicEpisodes[activeEpisode]?.title || "Audio Pembelajaran"}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleAudio}
                        className="clay-btn clay-btn-white w-12 h-12 rounded-full flex items-center justify-center text-[#4B3B7A] shrink-0 cursor-pointer shadow-xs"
                        title={isPlaying ? "Jeda Audio" : "Putar Audio"}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Speed Controls & TTS */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#4B3B7A]/15">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#4B3B7A]">Kecepatan:</span>
                        {[1.0, 1.25, 1.5].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => setPlaybackSpeed(spd)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                              playbackSpeed === spd
                                ? "bg-[#4B3B7A] text-white"
                                : "bg-white/60 text-[#4B3B7A]"
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          handleTTSRead(
                            dynamicEpisodes[activeEpisode]?.transcript || activeDoc.rawText
                          )
                        }
                        className="clay-btn clay-btn-white px-3 py-1 text-[11px] font-bold text-[#4B3B7A] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isSpeakingSummary ? "Hentikan Suara" : "Bacakan Teks"}</span>
                      </button>
                    </div>
                  </section>

                  {/* Playlist of Episodes */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#5A5E70] uppercase px-1">
                      Daftar Bagian Pembelajaran Audio
                    </h3>
                    {dynamicEpisodes.map((ep, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          audioSynth.playClickSound();
                          setActiveEpisode(idx);
                        }}
                        className={`clay-card p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          activeEpisode === idx
                            ? "border-2 border-[#4B3B7A] bg-[#F4F0FD]"
                            : "bg-white hover:bg-[#FAF8FD]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              activeEpisode === idx
                                ? "bg-[#4B3B7A] text-white"
                                : "bg-[#ECE8F7] text-[#4B3B7A]"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#1C1E26]">{ep.title}</h4>
                            <p className="text-[10px] text-[#5A5E70] truncate max-w-xs sm:max-w-md">
                              {ep.transcript}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#5A5E70]">
                          {ep.duration}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      navigate("/quiz");
                    }}
                    className="clay-btn clay-btn-dark w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Mulai Kuis Adaptif Berbasis Audio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. KINESTHETIC MODE DYNAMIC CONTENT                      */}
              {/* ========================================================= */}
              {style === "KINESTETIK" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <section className="clay-card clay-butter p-5 text-[#4A3205] space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#785308]/80 block">
                          Lab Interaktif &amp; Eksperimen Mandiri
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-[#2C1D02] mt-0.5">
                          Klasifikasi &amp; Pemetaan Konsep Praktik
                        </h2>
                      </div>
                      <div className="w-9 h-9 rounded-2xl bg-white text-[#785308] flex items-center justify-center shrink-0">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-xs text-[#785308] font-medium leading-relaxed bg-white/60 p-3 rounded-2xl">
                      Pilih kartu konsep di bawah, lalu klik target langkah yang sesuai untuk menguji pemahaman kontekstualmu.
                    </p>

                    {/* Step 1: Clickable Concepts */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[#785308] uppercase block">
                        1. Pilih Kartu Konsep:
                      </span>
                      <div className="flex flex-col gap-2">
                        {simulationItems.map((item) => {
                          const isPlaced = Boolean(matchedItems[item.id]);
                          const isSelected = selectedItem === item.id;
                          return (
                            <button
                              key={item.id}
                              disabled={isPlaced}
                              onClick={() => {
                                audioSynth.playClickSound();
                                setSelectedItem(isSelected ? null : item.id);
                              }}
                              className={`p-3.5 rounded-2xl text-left text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                isPlaced
                                  ? "bg-white/40 text-[#A69B82] line-through cursor-not-allowed"
                                  : isSelected
                                  ? "bg-[#785308] text-white shadow-xs scale-101"
                                  : "bg-white text-[#4A3205] hover:bg-[#FFF9EE] shadow-2xs"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{item.name}</span>
                                <span className="text-[9px] font-mono uppercase bg-black/5 px-2 py-0.5 rounded-md">
                                  {item.label}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Target Drop Zones */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[#785308] uppercase block">
                        2. Pasangkan ke Target Langkah:
                      </span>
                      <div className="flex flex-col gap-2.5">
                        {simulationZones.map((zone) => {
                          const matchedEntry = Object.entries(matchedItems).find(
                            ([, zId]) => zId === zone.id
                          );
                          const matchedObj = matchedEntry
                            ? simulationItems.find((it) => it.id === matchedEntry[0])
                            : null;

                          return (
                            <div
                              key={zone.id}
                              onClick={() => handleZoneClick(zone.id)}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                matchedObj
                                  ? "bg-white border-[#785308]/30 shadow-xs"
                                  : selectedItem
                                  ? "border-dashed border-[#785308] bg-[#FFF9EE] animate-pulse"
                                  : "border-dashed border-[#785308]/30 bg-white/40"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm font-bold text-[#2C1D02]">{zone.name}</span>
                                <span className="text-[10px] text-[#785308]">{zone.desc}</span>
                              </div>
                              {matchedObj && (
                                <div className="mt-2.5 p-2 rounded-xl bg-[#EBF6F2] text-[#1D5E4D] text-xs font-bold flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>{matchedObj.name}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {simulationCompleted && (
                      <div className="p-3.5 rounded-2xl bg-[#EBF6F2] text-[#1D5E4D] text-xs font-bold text-center animate-in zoom-in-95">
                        🎉 Selamat! Seluruh konsep berhasil dipetakan secara akurat!
                      </div>
                    )}

                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={handleResetSimulation}
                        className="text-[11px] font-bold text-[#785308] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Skenario</span>
                      </button>
                    </div>
                  </section>

                  <button
                    onClick={() => {
                      audioSynth.playClickSound();
                      navigate("/quiz");
                    }}
                    className="clay-btn clay-btn-dark w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Lanjutkan ke Evaluasi Praktik DDA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
