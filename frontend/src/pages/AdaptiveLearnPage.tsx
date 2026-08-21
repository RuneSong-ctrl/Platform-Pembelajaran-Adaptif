import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
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
} from "@/components/ui/icons";

export default function AdaptiveLearnPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const style = currentUser.learningStyle || "VISUAL";

  // Audio Player State (Auditory student exclusive)
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);

  const episodes = [
    {
      title: "Episode 1: Petualangan Menembus Saluran Cerna",
      duration: "05:24",
      audioUrl: "#",
      transcript:
        "Selamat datang di podcast modul biologi adaptif. Pada episode pertama ini, kita menelusuri rongga mulut. Di sini terjadi pencernaan mekanik oleh gigi dan pencernaan kimiawi oleh enzim ptialin (amilase saliva). Ptialin bekerja memotong rantai polisakarida amilum menjadi disakarida maltosa pada suasana pH netral 6.8 sebelum bolus makanan didorong melalui esofagus oleh gerak peristaltik.",
    },
    {
      title: "Episode 2: Rahasia Asam Lambung & Enzim Pepsin",
      duration: "06:12",
      audioUrl: "#",
      transcript:
        "Memasuki lambung (ventrikulus), dinding lambung menghasilkan asam klorida (HCl) berkonsentrasi tinggi dengan pH 1.5 hingga 2.0. Keasaman ekstrem ini mengaktifkan enzim pepsinogen menjadi enzim pepsin aktif untuk memecah ikatan peptida protein menjadi pepton, sekaligus mensterilkan makanan dari bakteri patogen.",
    },
    {
      title: "Episode 3: Labirin Penyerapan Sari Makanan di Usus Halus",
      duration: "07:45",
      audioUrl: "#",
      transcript:
        "Di usus halus, kimus asam dinetralkan oleh natrium bikarbonat dari pankreas di duodenum. Enzim tripsin, amilase pankreas, dan lipase bekerja tuntas. Selanjutnya pada ileum, miliaran vili dan mikrovili memperluas area permukaan serap nutrisi hingga 200 meter persegi, mengalirkan asam amino dan glukosa ke pembuluh kapiler darah serta asam lemak ke pembuluh kil.",
    },
  ];

  // Kinesthetic Drag-and-drop Simulation State (Kinesthetic student exclusive)
  const [matchedItems, setMatchedItems] = useState<{ [itemId: string]: string }>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [simulationCompleted, setSimulationCompleted] = useState(false);

  const simulationItems = [
    { id: "item_ptialin", name: "Enzim Ptialin (Amilase)", targetZone: "zone_mulut", label: "Ptialin" },
    { id: "item_pepsin", name: "Pepsin & Asam HCl (pH 1.5)", targetZone: "zone_lambung", label: "Pepsin + HCl" },
    { id: "item_tripsin", name: "Tripsin & Enzim Lipase", targetZone: "zone_duodenum", label: "Tripsin & Lipase" },
    { id: "item_absorpsi", name: "Vili Penyerapan Nutrisi", targetZone: "zone_ileum", label: "Vili Ileum" },
  ];

  const simulationZones = [
    { id: "zone_mulut", name: "1. Rongga Mulut", desc: "Pencernaan amilum netral" },
    { id: "zone_lambung", name: "2. Lambung", desc: "Pencernaan protein asam" },
    { id: "zone_duodenum", name: "3. Usus 12 Jari", desc: "Netralisasi & hidrolisis lemak" },
    { id: "zone_ileum", name: "4. Usus Halus", desc: "Penyerapan kapiler darah" },
  ];

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
    setIsPlaying(!isPlaying);
  };

  const handleTTSRead = (text: string) => {
    audioSynth.playClickSound();
    if ("speechSynthesis" in window) {
      if (isSpeakingSummary) {
        window.speechSynthesis.cancel();
        setIsSpeakingSummary(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "id-ID";
        utterance.rate = playbackSpeed;
        utterance.onend = () => setIsSpeakingSummary(false);
        utterance.onerror = () => setIsSpeakingSummary(false);
        setIsSpeakingSummary(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] pb-32 overflow-x-hidden">
      <Navbar />

      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 sm:pt-4 flex flex-col gap-4">
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
            <span>Materi Khusus {style === "AUDITORI" ? "Auditori" : style === "KINESTETIK" ? "Kinestetik" : "Visual"}</span>
          </span>
        </div>

        {/* Header Topic Meta */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white text-[#1C1E26] border border-[rgba(28,30,38,0.08)]">
              Biologi Kelas 10-A
            </span>
            <span className="text-[10px] font-mono font-bold text-[#5A5E70]">
              BAB 3 • VEC-BIO-301
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#010105]">
            Fisiologi Sistem Pencernaan &amp; Enzim
          </h1>
          <p className="text-xs text-[#5A5E70] font-medium mt-0.5">
            Materi kurikulum ter-grounding disajikan eksklusif sesuai profil kognitifmu.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 1. VISUAL MODE EXCLUSIVE CONTENT                         */}
        {/* ========================================================= */}
        {style === "VISUAL" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Visual Overview Card */}
            <section className="clay-card clay-mint p-5 text-[#124B3D] space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1D5E4D]/80 block">
                    Peta Visual • Saluran Pencernaan
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-[#082921] mt-0.5">
                    Alur Pencernaan Makanan &amp; Sekresi Enzim
                  </h2>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-white/80 text-[#1D5E4D] flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
              </div>

              {/* 4 Organ Sequential Visual Cards */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="bg-white/85 p-3 rounded-2xl border border-[rgba(29,94,77,0.15)] shadow-xs">
                  <span className="text-[10px] font-extrabold text-[#1D5E4D] uppercase block">
                    1. Rongga Mulut
                  </span>
                  <p className="text-xs font-bold text-[#010105] mt-0.5">Enzim Ptialin</p>
                  <p className="text-[10px] text-[#5A5E70] mt-0.5">Amilum ➔ Maltosa (pH 6.8)</p>
                </div>

                <div className="bg-white/85 p-3 rounded-2xl border border-[rgba(29,94,77,0.15)] shadow-xs">
                  <span className="text-[10px] font-extrabold text-[#785308] uppercase block">
                    2. Lambung
                  </span>
                  <p className="text-xs font-bold text-[#010105] mt-0.5">Pepsin + HCl</p>
                  <p className="text-[10px] text-[#5A5E70] mt-0.5">Protein ➔ Pepton (pH 1.5)</p>
                </div>

                <div className="bg-white/85 p-3 rounded-2xl border border-[rgba(29,94,77,0.15)] shadow-xs">
                  <span className="text-[10px] font-extrabold text-[#4B3B7A] uppercase block">
                    3. Duodenum
                  </span>
                  <p className="text-xs font-bold text-[#010105] mt-0.5">Tripsin &amp; Lipase</p>
                  <p className="text-[10px] text-[#5A5E70] mt-0.5">Pepton ➔ Asam Amino</p>
                </div>

                <div className="bg-white/85 p-3 rounded-2xl border border-[rgba(29,94,77,0.15)] shadow-xs">
                  <span className="text-[10px] font-extrabold text-[#21518A] uppercase block">
                    4. Ileum (Vili)
                  </span>
                  <p className="text-xs font-bold text-[#010105] mt-0.5">Absorpsi Nutrisi</p>
                  <p className="text-[10px] text-[#5A5E70] mt-0.5">Kapiler Darah &amp; Limfa</p>
                </div>
              </div>
            </section>

            {/* Infografis Enzimatis Detail */}
            <section className="clay-card p-5 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl clay-card clay-mint flex items-center justify-center text-[#1D5E4D]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#010105]">
                    Infografis: Luas Permukaan Serap Vili Ileum
                  </h3>
                  <p className="text-[10px] text-[#5A5E70]">
                    Kutipan Modul Guru: BAB 3 Hal. 25
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EBF6F2] border border-[rgba(29,94,77,0.1)] text-xs text-[#1D5E4D] font-medium leading-relaxed">
                Struktur lipatan vili dan mikrovili memperluas bidang kontak penyerapan hingga <strong>200 m²</strong> (setara luas lapangan tenis). Glukosa &amp; asam amino dialirkan ke kapiler darah vena porta hepatika, sedangkan asam lemak dan gliserol diserap oleh pembuluh limfa (lakteal/kil).
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
                  Ingat rumus visual: <strong>Mulut (Amilum) ➔ Lambung (Protein) ➔ Duodenum (Lemak &amp; Peptida) ➔ Ileum (Penyerapan Total)</strong>.
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
              <span>Uji Pemahaman Diagram di Kuis DDA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. AUDITORY MODE EXCLUSIVE CONTENT                       */}
        {/* ========================================================= */}
        {style === "AUDITORI" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Podcast Master Player Card */}
            <section className="clay-card clay-lavender p-5 text-[#2D2152] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B3B7A]/80 block">
                    Now Playing • Podcast Bio Ep. {activeEpisode + 1}
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-[#1E143D] mt-0.5">
                    {episodes[activeEpisode].title}
                  </h2>
                  <p className="text-[11px] text-[#4B3B7A] font-medium mt-0.5">
                    Narasi ter-grounding kurikulum Biologi Kelas 10-A
                  </p>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-white/80 text-[#4B3B7A] flex items-center justify-center shrink-0 shadow-xs">
                  <Headphones className="w-5 h-5" />
                </div>
              </div>

              {/* Scrubber Bar */}
              <div className="space-y-1">
                <div className="w-full bg-white/80 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#4B3B7A] h-full rounded-full transition-all duration-300"
                    style={{ width: isPlaying ? "70%" : "35%" }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#4B3B7A] font-bold">
                  <span>{isPlaying ? "03:45" : "01:54"}</span>
                  <span>{episodes[activeEpisode].duration}</span>
                </div>
              </div>

              {/* Playback Controls & Speed Selector */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 bg-white/60 p-1 rounded-full text-[10px] font-bold text-[#4B3B7A]">
                  {[1.0, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        audioSynth.playClickSound();
                        setPlaybackSpeed(spd);
                      }}
                      className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                        playbackSpeed === spd ? "bg-[#4B3B7A] text-white" : ""
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleToggleAudio}
                  className="clay-btn clay-btn-white w-12 h-12 rounded-full flex items-center justify-center text-[#4B3B7A] shadow-xs cursor-pointer"
                  title={isPlaying ? "Jeda Audio" : "Putar Audio"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleTTSRead(episodes[activeEpisode].transcript)}
                  className="clay-btn clay-btn-white px-3 py-1.5 rounded-full text-[11px] font-bold text-[#4B3B7A] flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Bacakan Transkrip Suara"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeakingSummary ? "Stop" : "Bacakan"}</span>
                </button>
              </div>
            </section>

            {/* Episode Playlist Rows */}
            <section className="clay-card p-4 space-y-2 bg-white">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8] px-1">
                Daftar Episode Podcast Bab 3
              </h3>

              <div className="space-y-2">
                {episodes.map((ep, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      audioSynth.playClickSound();
                      setActiveEpisode(idx);
                      setIsPlaying(true);
                    }}
                    className={`clay-card p-3 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      activeEpisode === idx
                        ? "clay-lavender border-[#4B3B7A]/30 text-[#4B3B7A]"
                        : "hover:bg-[#F8F9FD] text-[#010105]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 text-xs font-bold">
                        {activeEpisode === idx && isPlaying ? (
                          <Volume2 className="w-4 h-4 text-[#4B3B7A] animate-pulse" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold truncate">{ep.title}</h4>
                        <p className="text-[10px] text-[#5A5E70]">Durasi {ep.duration}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-[#4B3B7A] bg-white/70 px-2 py-0.5 rounded-full shrink-0">
                      {activeEpisode === idx ? "Aktif" : "Putar"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Complete Episode Transcript */}
            <section className="clay-card p-5 space-y-2 bg-white">
              <h3 className="text-xs font-extrabold text-[#010105] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#4B3B7A]" />
                <span>Transkrip Narasi: Episode {activeEpisode + 1}</span>
              </h3>
              <div className="p-3.5 rounded-2xl bg-[#F2EFFC] text-xs text-[#2D2152] leading-relaxed">
                {episodes[activeEpisode].transcript}
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
              <span>Uji Pemahaman Audio di Kuis DDA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. KINESTHETIC MODE EXCLUSIVE CONTENT                    */}
        {/* ========================================================= */}
        {style === "KINESTETIK" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Lab Simulation Card */}
            <section className="clay-card clay-butter p-5 text-[#4A3205] space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#785308]/80 block">
                    Lab Simulasi Interaktif • Organ &amp; Enzim
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-[#2C1D02] mt-0.5">
                    Pasangkan Enzim ke Zona Organ yang Sesuai
                  </h2>
                  <p className="text-[11px] text-[#785308] font-medium">
                    Ketuk item enzim di bawah, lalu ketuk zona organ target.
                  </p>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-white/80 text-[#785308] flex items-center justify-center shrink-0 shadow-xs">
                  <FlaskConical className="w-5 h-5" />
                </div>
              </div>

              {/* Selectable Molecule Items */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#785308] block">
                  1. Pilih Molekul Enzim / Struktur:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {simulationItems.map((item) => {
                    const isMatched = !!matchedItems[item.id];
                    const isCurrent = selectedItem === item.id;
                    return (
                      <button
                        key={item.id}
                        disabled={isMatched}
                        onClick={() => {
                          audioSynth.playClickSound();
                          setSelectedItem(item.id);
                        }}
                        className={`p-2.5 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer ${
                          isMatched
                            ? "bg-white/40 text-[#785308]/50 line-through cursor-not-allowed border border-transparent"
                            : isCurrent
                            ? "bg-[#1C1E26] text-white shadow-xs scale-102"
                            : "bg-white text-[#785308] hover:bg-white/90 border border-[#785308]/20 shadow-2xs"
                        }`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Organ Zones */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#785308] block">
                  2. Ketuk Zona Organ Target:
                </span>
                <div className="space-y-2">
                  {simulationZones.map((zone) => {
                    const matchedItem = simulationItems.find((it) => matchedItems[it.id] === zone.id);
                    const isCorrect = matchedItem && matchedItem.targetZone === zone.id;

                    return (
                      <div
                        key={zone.id}
                        onClick={() => handleZoneClick(zone.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isCorrect
                            ? "bg-[#D1EBE1] border-[#1D5E4D]/30 text-[#1D5E4D]"
                            : selectedItem
                            ? "bg-white border-[#785308] ring-2 ring-[#785308]/20 text-[#010105]"
                            : "bg-white/80 border-[rgba(28,30,38,0.08)] text-[#010105]"
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-extrabold">{zone.name}</h4>
                          <p className="text-[10px] text-[#5A5E70]">{zone.desc}</p>
                        </div>

                        {matchedItem ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#1D5E4D] flex items-center gap-1 shadow-2xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                            {matchedItem.label}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#9195A8] border border-dashed border-[#9195A8]/50 px-2 py-0.5 rounded-full">
                            Kosong
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulation Result / Reset */}
              {simulationCompleted ? (
                <div className="p-3.5 rounded-2xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-between text-xs font-bold animate-in zoom-in-95">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Semua Enzim Terpasang Sempurna! (+40 XP)
                  </span>
                  <button
                    onClick={handleResetSimulation}
                    className="clay-btn clay-btn-white px-2.5 py-1 rounded-xl text-[10px] font-bold text-[#1D5E4D]"
                  >
                    Ulangi
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center text-[10px] text-[#785308] font-bold pt-1">
                  <span>Progres: {Object.keys(matchedItems).length} dari 4 terpasang</span>
                  <button
                    onClick={handleResetSimulation}
                    className="hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Lab
                  </button>
                </div>
              )}
            </section>

            {/* Hands-on Experiment Steps */}
            <section className="clay-card p-5 space-y-3 bg-white">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#010105]">
                Misi Eksperimen Biokimia Mandiri
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#F8F9FD] border border-[rgba(28,30,38,0.06)]">
                  <span className="font-bold text-[#785308]">Langkah 1: Uji Reaksi Amilum Saliva</span>
                  <p className="text-[11px] text-[#5A5E70] mt-0.5">
                    Mengamati perubahan warna iodin saat amilum dihidrolisis menjadi maltosa dalam tabung reaksi bersuhu 37°C.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F8F9FD] border border-[rgba(28,30,38,0.06)]">
                  <span className="font-bold text-[#785308]">Langkah 2: Simulasi Denaturasi Protein</span>
                  <p className="text-[11px] text-[#5A5E70] mt-0.5">
                    Uji pemecahan albumin telur oleh enzim pepsin dalam suasana asam HCl pekat.
                  </p>
                </div>
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
              <span>Uji Hasil Eksperimen di Kuis DDA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
