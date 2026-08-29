import React, { useState, useRef, useEffect, useMemo } from "react";
import { GroundedDocument, PodcastEpisode } from "@/types";
import { API_BASE_URL } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Disc,
  ListMusic,
  CheckCircle2,
  SkipBack,
  SkipForward,
  Sparkles,
  BookOpen,
  X,
  Award,
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
            title: ep.title || `Episode ${idx + 1}: ${doc.title}`,
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

    // Programmatic fallback: break paragraphs into 3-4 distinct episodes
    const paras = (doc.rawText || doc.summary || "").split("\n\n").filter((p) => p.trim().length > 30);
    const titles = [
      `Episode 1: Fondasi & Hakikat ${doc.title}`,
      `Episode 2: Mekanisme & Hubungan Sistemik`,
      `Episode 3: Analisis Kasus & Dinamika Reaksi`,
      `Episode 4: Aplikasi Nyata & Sintesis Konsep`,
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
        title: titles[i] || `Episode ${i + 1}: ${doc.title}`,
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
            title: `Episode 1: Fondasi ${doc.title}`,
            description: "Ringkasan konsep pokok materi ter-grounding.",
            script: doc.podcastScript || doc.rawText || doc.summary || "Materi pembelajaran audio.",
            durationSec: 45,
            audioUrl: `/api/v1/documents/${doc.id}/podcast-audio?episode=1`,
          },
        ];
  }, [doc.podcastEpisodesJson, doc.rawText, doc.summary, doc.title, doc.id, doc.podcastScript]);

  // Player State
  const [currentEpIndex, setCurrentEpIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [completedEpIds, setCompletedEpIds] = useState<Set<string>>(new Set());
  const [showScriptModal, setShowScriptModal] = useState(false);

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
  const resolveAudioUrl = (url: string | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
      return url;
    }
    const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${cleanBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

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
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
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

  const progressPct = Math.round((completedEpIds.size / Math.max(1, episodes.length)) * 100);

  return (
    <div className="space-y-5">
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

      {/* 🌟 1. SPOTIFY-STYLE ALBUM HEADER CARD */}
      <section className="clay-card bg-gradient-to-br from-[#2E2054] via-[#4B3B7A] to-[#1C1E26] text-white p-5 sm:p-7 rounded-3xl shadow-md relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#6A52AB]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -top-12 w-48 h-48 bg-[#9B82E8]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Animated Vinyl Disc Cover Art */}
          <div className="relative group shrink-0">
            <div
              className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#151221] border-4 border-[#5E4B94] flex items-center justify-center shadow-2xl transition-transform duration-700 ${
                isPlaying ? "animate-spin" : ""
              }`}
              style={{ animationDuration: "6s" }}
            >
              {/* Disc Grooves */}
              <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-white/15 flex items-center justify-center bg-[#4B3B7A]">
                  <Disc className="w-8 h-8 text-white/80" />
                </div>
              </div>
            </div>

            {/* Play Button Overlay on Disc */}
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white text-[#4B3B7A] flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          </div>

          {/* Show Meta Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/15">
                Spotify-Style Podcast
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D]">
                Solo Narrator HD
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {doc.title}
            </h2>

            <p className="text-xs text-white/80 font-medium line-clamp-2 max-w-xl">
              {doc.summary || "Ringkasan audio terstruktur per episode untuk pemahaman konsep maksimal."}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-xs text-white/70">
              <span className="font-bold text-white flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-[#D0C4F7]" />
                <span>{classroomName || "Kelas Adaptif"}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ListMusic className="w-3.5 h-3.5" />
                <span>{episodes.length} Episode Playlist</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>~{totalMinutes} Menit Total</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 📋 2. EPISODE TRACKLIST PLAYLIST */}
      <section className="clay-card bg-white p-4 sm:p-6 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-[#4B3B7A]" />
            <h3 className="text-sm font-black text-[#1C1E26]">Daftar Episode Podcast ({episodes.length})</h3>
          </div>
          <span className="text-xs font-extrabold text-[#4B3B7A] bg-[#F4F0FD] px-2.5 py-1 rounded-full">
            {completedEpIds.size}/{episodes.length} Selesai
          </span>
        </div>

        <div className="space-y-2">
          {episodes.map((ep, idx) => {
            const isCurrent = idx === currentEpIndex;
            const isCompleted = completedEpIds.has(ep.id);

            return (
              <div
                key={ep.id}
                onClick={() => handleSelectEpisode(idx)}
                className={`group p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? "bg-[#F4F0FD] border-[#4B3B7A] shadow-xs"
                    : "bg-white border-black/5 hover:bg-[#F8F9FD] hover:border-black/10"
                }`}
              >
                {/* Left: Track Number / Play Indicator */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-black transition-colors ${
                      isCurrent
                        ? "bg-[#4B3B7A] text-white"
                        : isCompleted
                        ? "bg-[#D1EBE1] text-[#1D5E4D]"
                        : "bg-black/5 text-[#5A5E70] group-hover:bg-[#4B3B7A] group-hover:text-white"
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <span className="flex items-end gap-0.5 h-3.5">
                        <span className="w-1 bg-white animate-pulse h-3.5" />
                        <span className="w-1 bg-white animate-pulse h-2" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 bg-white animate-pulse h-3" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{ep.order}</span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="min-w-0">
                    <h4
                      className={`text-xs sm:text-sm font-extrabold truncate ${
                        isCurrent ? "text-[#4B3B7A]" : "text-[#1C1E26]"
                      }`}
                    >
                      {ep.title}
                    </h4>
                    <p className="text-[11px] text-[#5A5E70] truncate">{ep.description}</p>
                  </div>
                </div>

                {/* Right: Duration & Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono font-bold text-[#5A5E70] hidden sm:inline">
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent && isPlaying
                        ? "bg-[#4B3B7A] text-white shadow-xs"
                        : "bg-black/5 text-[#4B3B7A] hover:bg-[#4B3B7A] hover:text-white"
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
      </section>

      {/* 🎛️ 3. DEDICATED STICKY PLAYER BAR CONTROLLER */}
      <section className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-[rgba(28,30,38,0.08)] shadow-md space-y-3">
        {/* Track Title & Meta */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#4B3B7A] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold text-[#4B3B7A] uppercase">
                Memutar: Episode {currentEpisode.order} dari {episodes.length}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-[#1C1E26] truncate">
                {currentEpisode.title}
              </h4>
            </div>
          </div>

          {/* Script Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowScriptModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#F4F0FD] text-[#4B3B7A] hover:bg-[#E3DBF8] text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lihat Naskah</span>
          </button>
        </div>

        {/* Scrubber Progress Bar */}
        <div className="space-y-1">
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
            className="w-full h-1.5 bg-[#EFEFF4] rounded-lg appearance-none cursor-pointer accent-[#4B3B7A]"
          />
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#5A5E70]">
            <span>{formatTime(audioCurrentTime)}</span>
            <span>{formatTime(audioDuration || currentEpisode.durationSec || 45)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Speed Selector */}
          <button
            type="button"
            onClick={handleCycleSpeed}
            className="px-2.5 py-1 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-mono font-bold text-[#1C1E26] transition-colors cursor-pointer"
          >
            {playbackSpeed}x Speed
          </button>

          {/* Core Controls (Prev, Big Play/Pause, Next) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSkipPrev}
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#1C1E26] transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-[#4B3B7A] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleSkipNext}
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#1C1E26] transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Mute toggle */}
          <button
            type="button"
            onClick={() => {
              if (audioElementRef.current) {
                audioElementRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#5A5E70] transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* 📖 SCRIPT READING MODAL DIALOG */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="clay-card bg-white max-w-lg w-full rounded-3xl p-5 sm:p-6 border border-black/10 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#4B3B7A]" />
                <h3 className="text-sm font-black text-[#1C1E26]">
                  Naskah Tuturan: {currentEpisode.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#5A5E70] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 text-left space-y-3 text-xs sm:text-sm text-[#33384B] leading-relaxed">
              <p className="bg-[#F8F9FD] p-4 rounded-2xl border border-black/5 whitespace-pre-line font-normal">
                {currentEpisode.script}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScriptModal(false)}
              className="clay-btn clay-btn-dark w-full py-2.5 rounded-2xl text-xs font-black"
            >
              Tutup Naskah
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
