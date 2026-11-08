import React, { useState, useRef, useEffect, useMemo } from "react";
import { GroundedDocument, PodcastEpisode } from "@/types";
import { mediaUrl } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  ListMusic,
  CheckCircle2,
  SkipBack,
  SkipForward,
  BookOpen,
  Clock,
  Radio,
} from "@/components/ui/icons";

interface AuditoryLearnSectionProps {
  doc: GroundedDocument;
  classroomName?: string;
}

export default function AuditoryLearnSection({
  doc,
  classroomName,
}: AuditoryLearnSectionProps) {
  // 1. Parse Episodes Playlist from doc.podcastEpisodesJson or Fallback
  const episodes: PodcastEpisode[] = useMemo(() => {
    if (doc.podcastEpisodesJson) {
      try {
        const parsed = JSON.parse(doc.podcastEpisodesJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((ep: any, idx: number) => ({
            id: ep.id || `ep_${idx + 1}`,
            order: ep.order ?? idx + 1,
            title: ep.title || `Bagian ${idx + 1}: ${doc.title}`,
            description: ep.description || `Pembedahan sub-topik bagian ${idx + 1}.`,
            script: ep.script || doc.podcastScript || doc.rawText || "",
            durationSec: ep.durationSec || 45,
            audioUrl: ep.audioUrl || `/api/v1/documents/${doc.id}/podcast-audio?episode=${idx + 1}`,
          }));
        }
      } catch (e) {
        console.warn("[AuditoryLearnSection] Error parsing podcastEpisodesJson:", e);
      }
    }

    // Programmatic fallback: break paragraphs into structured educational parts
    const paras = (doc.rawText || doc.summary || "").split("\n\n").filter((p) => p.trim().length > 30);
    const titles = [
      `Bagian 1: Fondasi & Hakikat ${doc.title}`,
      `Bagian 2: Mekanisme & Hubungan Sistemik`,
      `Bagian 3: Analisis Kasus & Dinamika Reaksi`,
      `Bagian 4: Aplikasi Nyata & Sintesis Konsep`,
    ];
    const descs = [
      `Memahami definisi dasar dan komponen kunci dari materi ${doc.title}.`,
      `Menelusuri bagaimana setiap bagian saling berinteraksi secara konsisten.`,
      `Menganalisis skenario perubahan variabel dan dampaknya pada sistem.`,
      `Menghubungkan teori dengan implementasi teknologi dan kehidupan nyata.`,
    ];

    const count = Math.min(4, Math.max(2, paras.length));
    const fallbackList: PodcastEpisode[] = [];
    for (let i = 0; i < count; i++) {
      const p = paras[i] || paras[0] || doc.summary || doc.title;
      fallbackList.push({
        id: `ep_${i + 1}`,
        order: i + 1,
        title: titles[i] || `Bagian ${i + 1}: ${doc.title}`,
        description: descs[i] || `Pembahasan konsep bagian ${i + 1}.`,
        script: p,
        durationSec: 45,
        audioUrl: `/api/v1/documents/${doc.id}/podcast-audio?episode=${i + 1}`,
      });
    }

    return fallbackList.length > 0
      ? fallbackList
      : [
          {
            id: "ep_1",
            order: 1,
            title: `Bagian 1: Fondasi ${doc.title}`,
            description: "Ringkasan konsep pokok materi ter-grounding.",
            script: doc.podcastScript || doc.rawText || doc.summary || "Materi pembelajaran audio.",
            durationSec: 45,
            audioUrl: `/api/v1/documents/${doc.id}/podcast-audio?episode=1`,
          },
        ];
  }, [doc.podcastEpisodesJson, doc.rawText, doc.summary, doc.title, doc.id, doc.podcastScript]);

  // Tab State: Pemutar & Naskah vs. Daftar Episode
  const [activeTab, setActiveTab] = useState<"player" | "playlist">("player");

  // Player State
  const [currentEpIndex, setCurrentEpIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [completedEpIds, setCompletedEpIds] = useState<Set<string>>(new Set());

  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const currentEpisode = episodes[currentEpIndex] || episodes[0];

  // Helper formatting mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Resolve absolute audio URL
  const resolveAudioUrl = (url: string | undefined): string => (url ? mediaUrl(url) : "");

  const resolvedAudioSrc = resolveAudioUrl(currentEpisode?.audioUrl);

  // Synchronize Playback speed
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Handle Play/Pause
  const togglePlay = () => {
    audioSynth.playClickSound();
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("[AuditorySection] Play failed:", err);
          setIsPlaying(false);
        });
    }
  };

  // Play Specific Episode
  const handleSelectEpisode = (index: number) => {
    audioSynth.playClickSound();
    setCurrentEpIndex(index);
    setAudioCurrentTime(0);
    setIsPlaying(true);
    setActiveTab("player");
    setTimeout(() => {
      if (audioElementRef.current) {
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.play().catch(() => {});
      }
    }, 100);
  };

  // Skip Next Episode
  const handleSkipNext = () => {
    audioSynth.playClickSound();
    if (currentEpIndex < episodes.length - 1) {
      handleSelectEpisode(currentEpIndex + 1);
    } else {
      handleSelectEpisode(0);
    }
  };

  // Skip Prev Episode
  const handleSkipPrev = () => {
    audioSynth.playClickSound();
    if (currentEpIndex > 0) {
      handleSelectEpisode(currentEpIndex - 1);
    } else {
      handleSelectEpisode(episodes.length - 1);
    }
  };

  // Handle Episode Finished (Auto Next)
  const handleAudioEnded = () => {
    audioSynth.playLevelUpSound();
    const nextCompleted = new Set(completedEpIds);
    nextCompleted.add(currentEpisode.id);
    setCompletedEpIds(nextCompleted);

    if (nextCompleted.size === episodes.length) {
      confetti({ disableForReducedMotion: true, particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }

    // Auto advance to next episode
    if (currentEpIndex < episodes.length - 1) {
      handleSelectEpisode(currentEpIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  // Speed cycle
  const handleCycleSpeed = () => {
    audioSynth.playClickSound();
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  // Calculate total playlist time in minutes
  const totalMinutes = useMemo(() => {
    const totalSec = episodes.reduce((acc, ep) => acc + (ep.durationSec || 45), 0);
    return (totalSec / 60).toFixed(1);
  }, [episodes]);

  return (
    <div className="space-y-4">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioElementRef}
        src={resolvedAudioSrc}
        onTimeUpdate={() => {
          if (audioElementRef.current) {
            setAudioCurrentTime(audioElementRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioElementRef.current) {
            setAudioDuration(audioElementRef.current.duration || currentEpisode.durationSec || 45);
          }
        }}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* 🌟 1. HERO CARD: STUDIO PEMBELAJARAN AUDITORI (CLAY PREMIUM) */}
      <section className="clay-card clay-lavender p-5 sm:p-6 rounded-3xl border border-white/90 shadow-xs relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            {/* Tactile Squircle Icon Box */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-[18px] clay-card bg-white text-[#4B3B7A] flex flex-col items-center justify-center shrink-0 shadow-2xs border border-white/90">
              <Headphones className="w-8 h-8 sm:w-9 sm:h-9" strokeWidth={2.2} />
              {/* Subtle Status Light */}
              <span
                className={`w-2 h-2 rounded-full mt-1 transition-colors duration-300 ${
                  isPlaying ? "bg-[#1D5E4D]" : "bg-[#B8A8E6]"
                }`}
              />
            </div>

            {/* Meta & Title */}
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="clay-pill bg-white text-[#4B3B7A] text-mini font-extrabold uppercase tracking-wide px-3 py-0.5 shadow-2xs border border-white">
                  Modalitas Auditori
                </span>
                <span className="clay-pill bg-[#D1EBE1] text-[#1D5E4D] text-mini font-extrabold px-3 py-0.5 shadow-2xs border border-white/60">
                  Narasi Terverifikasi
                </span>
                <span className="clay-pill bg-white/80 text-[#3C2D68] text-mini font-extrabold px-2.5 py-0.5 shadow-2xs border border-white/60">
                  {completedEpIds.size}/{episodes.length} Selesai
                </span>
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[#1E143D] tracking-tight leading-snug">
                {doc.title}
              </h2>

              <p className="text-xs sm:text-sm text-[#43356E] font-medium leading-relaxed max-w-2xl line-clamp-2">
                {doc.summary ||
                  "Pendalaman konsep melalui paparan narasi audio terstruktur per bagian materi pokok."}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#524180] font-semibold">
                <span className="flex items-center gap-1.5 font-bold text-[#1E143D]">
                  <Radio className="w-3.5 h-3.5 text-[#4B3B7A]" />
                  <span>{classroomName || "Kelas Adaptif"}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <ListMusic className="w-3.5 h-3.5 text-[#4B3B7A]" />
                  <span>{episodes.length} Bagian Materi</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4B3B7A]" />
                  <span>~{totalMinutes} Menit Pembahasan</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Play CTA */}
          <div className="shrink-0 flex items-center md:self-center">
            <button
              type="button"
              onClick={togglePlay}
              className="w-full md:w-auto clay-btn clay-btn-white hover:bg-[#F2EFFC] text-[#3C2D68] px-5 py-3 rounded-2xl font-black text-xs shadow-2xs border border-white flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-98"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current text-[#4B3B7A]" />
                  <span>Jeda Narasi</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5 text-[#4B3B7A]" />
                  <span>Putar Bagian {currentEpisode.order}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 🧭 2. MENU TAB KONSEPTUAL (PEMUTAR & NASKAH VS DAFTAR EPISODE) */}
      <div className="grid grid-cols-2 gap-3" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "player"}
          onClick={() => {
            audioSynth.playClickSound();
            setActiveTab("player");
          }}
          className={`clay-btn ${
            activeTab === "player" ? "clay-btn-lavender" : "clay-btn-white"
          } rounded-[18px] p-3 sm:p-4 flex items-center gap-3 text-left`}
        >
          <span
            className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center text-[#4B3B7A] ${
              activeTab === "player" ? "bg-white shadow-2xs" : "bg-[#F2EFFC]"
            }`}
          >
            <Headphones className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs sm:text-sm font-black text-[#1C1E26]">
              Pemutar &amp; Naskah
            </span>
            <span className="block text-mini text-[#5A5E70] truncate">
              Audio konsol dan intisari bacaan
            </span>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "playlist"}
          onClick={() => {
            audioSynth.playClickSound();
            setActiveTab("playlist");
          }}
          className={`clay-btn ${
            activeTab === "playlist" ? "clay-btn-lavender" : "clay-btn-white"
          } rounded-[18px] p-3 sm:p-4 flex items-center gap-3 text-left`}
        >
          <span
            className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center text-[#4B3B7A] ${
              activeTab === "playlist" ? "bg-white shadow-2xs" : "bg-[#F2EFFC]"
            }`}
          >
            <ListMusic className="w-5 h-5" strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs sm:text-sm font-black text-[#1C1E26]">
              Daftar Episode ({episodes.length})
            </span>
            <span className="block text-mini text-[#5A5E70] truncate">
              Urutan kurikulum materi
            </span>
          </span>
        </button>
      </div>

      {/* 🎛️ 3. KONTEN TAB: PEMUTAR & NASKAH */}
      {activeTab === "player" && (
        <div className="space-y-4">
          {/* Audio Player Studio Console */}
          <div className="clay-card bg-white p-5 sm:p-6 rounded-3xl border border-white/90 shadow-xs space-y-4">
            {/* Header Track Info */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl clay-card clay-lavender text-[#4B3B7A] flex items-center justify-center shrink-0 shadow-2xs">
                  <Headphones className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <span className="text-mini font-mono font-bold text-[#6A52AB] uppercase tracking-wide block">
                    Memutar Bagian {currentEpisode.order} dari {episodes.length}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate">
                    {currentEpisode.title}
                  </h3>
                </div>
              </div>

              {completedEpIds.has(currentEpisode.id) ? (
                <span className="clay-pill bg-[#D1EBE1] text-[#1D5E4D] text-mini font-extrabold px-3 py-1 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </span>
              ) : (
                <span className="clay-pill clay-lavender text-[#4B3B7A] text-mini font-extrabold px-3 py-1 shrink-0">
                  Sedang Dipelajari
                </span>
              )}
            </div>

            {/* Tactile Audio Frequency Monitor */}
            <div className="flex items-center justify-center gap-1.5 h-11 py-2 px-4 bg-[#F7F5FC] rounded-2xl border border-[#E9E4F5]">
              {[25, 45, 70, 35, 85, 60, 95, 40, 75, 55, 80, 65, 90, 50, 70, 35, 60, 80, 45, 30].map(
                (h, i) => (
                  <span
                    key={i}
                    className={`w-1 sm:w-1.5 rounded-full transition-all duration-200 ${
                      isPlaying ? "bg-[#4B3B7A]" : "bg-[#C4B7EC]"
                    }`}
                    style={{
                      height: isPlaying
                        ? `${Math.max(20, (h * ((i % 4) + 1.2)) % 100)}%`
                        : `${Math.max(15, h * 0.3)}%`,
                      transitionDelay: `${i * 12}ms`,
                    }}
                  />
                )
              )}
            </div>

            {/* Scrubber Progress Bar */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={audioDuration || currentEpisode.durationSec || 45}
                value={audioCurrentTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAudioCurrentTime(val);
                  if (audioElementRef.current) {
                    audioElementRef.current.currentTime = val;
                  }
                }}
                aria-label="Progres durasi audio materi"
                className="w-full h-2 bg-[#EBE7F7] rounded-lg appearance-none cursor-pointer accent-[#4B3B7A]"
              />
              <div className="flex items-center justify-between text-mini font-mono font-bold text-[#5A5E70]">
                <span>{formatTime(audioCurrentTime)}</span>
                <span className="text-[#84889A] font-medium hidden sm:inline truncate max-w-xs">
                  {currentEpisode.description}
                </span>
                <span>{formatTime(audioDuration || currentEpisode.durationSec || 45)}</span>
              </div>
            </div>

            {/* Tactile Clay Control Console */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5">
              {/* Playback Speed Pill */}
              <button
                type="button"
                onClick={handleCycleSpeed}
                className="clay-pill bg-[#F2EFFC] hover:bg-[#E3DBF8] text-xs font-mono font-extrabold text-[#4B3B7A] px-3.5 py-1.5 transition-all cursor-pointer border border-[#E3DBF8] shadow-2xs"
                title="Ubah kecepatan pemutaran narasi"
              >
                {playbackSpeed}x Kecepatan
              </button>

              {/* Core Playback Control Buttons */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Skip -10s */}
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    if (audioElementRef.current) {
                      audioElementRef.current.currentTime = Math.max(0, audioCurrentTime - 10);
                      setAudioCurrentTime(audioElementRef.current.currentTime);
                    }
                  }}
                  className="w-10 h-10 rounded-2xl clay-btn clay-btn-white text-[#3C2D68] border border-[#E3DBF8] shadow-2xs flex items-center justify-center cursor-pointer transition-all"
                  title="Mundur 10 Detik"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Prev Episode */}
                <button
                  type="button"
                  onClick={handleSkipPrev}
                  className="w-10 h-10 rounded-2xl clay-btn clay-btn-white text-[#3C2D68] border border-[#E3DBF8] shadow-2xs flex items-center justify-center cursor-pointer transition-all"
                  title="Bagian Sebelumnya"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Big Center Play / Pause Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl clay-btn clay-btn-lavender text-[#3C2D68] border-2 border-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title={isPlaying ? "Jeda Narasi" : "Putar Narasi"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                {/* Next Episode */}
                <button
                  type="button"
                  onClick={handleSkipNext}
                  className="w-10 h-10 rounded-2xl clay-btn clay-btn-white text-[#3C2D68] border border-[#E3DBF8] shadow-2xs flex items-center justify-center cursor-pointer transition-all"
                  title="Bagian Berikutnya"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Skip +10s */}
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    if (audioElementRef.current) {
                      const maxT = audioDuration || currentEpisode.durationSec || 45;
                      audioElementRef.current.currentTime = Math.min(maxT, audioCurrentTime + 10);
                      setAudioCurrentTime(audioElementRef.current.currentTime);
                    }
                  }}
                  className="w-10 h-10 rounded-2xl clay-btn clay-btn-white text-[#3C2D68] border border-[#E3DBF8] shadow-2xs flex items-center justify-center cursor-pointer transition-all"
                  title="Maju 10 Detik"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Mute Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (audioElementRef.current) {
                    audioElementRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="w-10 h-10 rounded-2xl clay-btn clay-btn-white hover:bg-[#F2EFFC] text-[#524180] border border-[#E3DBF8] shadow-2xs flex items-center justify-center cursor-pointer transition-all"
                title={isMuted ? "Bunyikan Suara" : "Bisukan Suara"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Integrated Naskah Narasi Edukatif (Full Transcript Panel) */}
          <div className="clay-card bg-white p-5 sm:p-6 rounded-3xl border border-white/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl clay-card clay-lavender flex items-center justify-center text-[#4B3B7A] shadow-2xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#1C1E26]">
                    Naskah Narasi: {currentEpisode.title}
                  </h3>
                  <p className="text-mini text-[#5A5E70]">
                    Teks resmi panduan audio untuk memperdalam pemahaman konsep
                  </p>
                </div>
              </div>

              <span className="clay-pill bg-[#F2EFFC] text-[#4B3B7A] text-mini font-extrabold px-3 py-1 border border-[#E3DBF8]">
                Transkrip Materi
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF9FE] border border-[#E9E4F5] text-xs sm:text-sm text-[#261A47] leading-relaxed whitespace-pre-line font-medium">
              {currentEpisode.script}
            </div>
          </div>
        </div>
      )}

      {/* 📋 4. KONTEN TAB: DAFTAR EPISODE PLAYLIST */}
      {activeTab === "playlist" && (
        <div className="clay-card bg-white p-5 sm:p-6 rounded-3xl border border-white/90 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl clay-card clay-lavender flex items-center justify-center text-[#4B3B7A] shadow-2xs">
                <ListMusic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#1C1E26]">
                  Daftar Bagian Pembelajaran ({episodes.length})
                </h3>
                <p className="text-mini text-[#5A5E70]">
                  Pilih bagian materi untuk mendengarkan bahasan secara terstruktur
                </p>
              </div>
            </div>

            <span className="clay-pill clay-lavender text-mini font-extrabold px-3 py-1 text-[#4B3B7A] shadow-2xs">
              {completedEpIds.size}/{episodes.length} Selesai
            </span>
          </div>

          <div className="space-y-2.5">
            {episodes.map((ep, idx) => {
              const isCurrent = idx === currentEpIndex;
              const isCompleted = completedEpIds.has(ep.id);

              return (
                <div
                  key={ep.id}
                  onClick={() => handleSelectEpisode(idx)}
                  className={`group p-3.5 sm:p-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? "clay-card clay-lavender border-2 border-[#4B3B7A]/40 shadow-xs"
                      : "clay-card bg-[#FAFAFC] hover:bg-[#F2EFFC]/70 border border-black/5 hover:border-[#D0C4F7] shadow-2xs"
                  }`}
                >
                  {/* Left: Number & Titles */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-black transition-all ${
                        isCurrent
                          ? "clay-btn bg-[#4B3B7A] text-white shadow-2xs"
                          : isCompleted
                          ? "clay-pill bg-[#D1EBE1] text-[#1D5E4D]"
                          : "clay-pill bg-black/5 text-[#5A5E70] group-hover:bg-[#E3DBF8] group-hover:text-[#4B3B7A]"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span>{ep.order}</span>}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs sm:text-sm font-extrabold truncate ${
                            isCurrent ? "text-[#261A47]" : "text-[#1C1E26] group-hover:text-[#4B3B7A]"
                          }`}
                        >
                          {ep.title}
                        </h4>
                        {isCurrent && (
                          <span className="clay-pill bg-white text-[#4B3B7A] text-mini font-black px-2 py-0.5 shadow-2xs">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-mini truncate mt-0.5 ${
                          isCurrent ? "text-[#43356E]" : "text-[#5A5E70]"
                        }`}
                      >
                        {ep.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Duration & Action Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-mini font-mono font-bold hidden sm:inline ${
                        isCurrent ? "text-[#43356E]" : "text-[#5A5E70]"
                      }`}
                    >
                      {formatTime(ep.durationSec || 45)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrent) {
                          togglePlay();
                        } else {
                          handleSelectEpisode(idx);
                        }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? "clay-btn clay-btn-white text-[#4B3B7A] border border-white shadow-2xs hover:scale-105 active:scale-95"
                          : "clay-btn bg-black/5 hover:bg-[#E3DBF8] text-[#5A5E70] group-hover:text-[#4B3B7A]"
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
