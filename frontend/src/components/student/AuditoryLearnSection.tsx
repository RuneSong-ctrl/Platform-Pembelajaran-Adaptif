import React, { useState, useRef, useEffect, useMemo } from "react";
import { GroundedDocument, KaraokeSegment } from "@/types";
import { ApiService, API_BASE_URL } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Disc,
  Radio,
  Loader2,
  Sparkles,
  Repeat,
  ArrowRight,
  School,
} from "@/components/ui/icons";

interface AuditoryLearnSectionProps {
  doc: GroundedDocument;
  classroomName?: string;
}

export default function AuditoryLearnSection({
  doc,
  classroomName,
}: AuditoryLearnSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [loopingSegmentId, setLoopingSegmentId] = useState<string | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const activeKaraokeRef = useRef<HTMLDivElement | null>(null);

  // Helper formatting waktu detik ke mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Helper resolusi URL audio backend
  const resolveAudioUrl = (url: string | undefined): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
      return url;
    }
    const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    return `${cleanBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const rawPodcastUrl =
    doc.podcastAudioUrl || (doc.id ? `/api/v1/documents/${doc.id}/podcast-audio` : "");
  const pregeneratedAudioUrl = resolveAudioUrl(rawPodcastUrl);

  // 1. Ekstrak naskah teks utuh dari materi guru (bersihkan speaker tags artifisial)
  const substantiveScript = useMemo(() => {
    let raw = doc.podcastScript || doc.rawText || doc.summary || "";
    // Bersihkan tag pembicara lama agar menjadi narasi tunggal yang elegan
    raw = raw.replace(/\[?(Kak Ardi|Bu Citra|Host|Pakar)\]?:\s*/gi, "").trim();
    return raw;
  }, [doc.podcastScript, doc.rawText, doc.summary]);

  // 2. Bangun Transkrip Karaoke Kalimat demi Kalimat Ber-Timestamp
  const karaokeSentences: KaraokeSegment[] = useMemo(() => {
    // Jika sudah ada data karaokeJson terstruktur, gunakan itu
    if (doc.karaokeJson) {
      try {
        const parsed = JSON.parse(doc.karaokeJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => ({
            id: item.id || `seg_${idx + 1}`,
            startSec: Number(item.startSec || item.start || 0),
            endSec: Number(item.endSec || item.end || 5),
            speaker: item.speaker || "Narator Modul",
            text: (item.text || "").replace(/\[?(Kak Ardi|Bu Citra|Host|Pakar)\]?:\s*/gi, "").trim(),
          }));
        }
      } catch (e) {
        console.warn("[AuditorySection] Error parsing karaokeJson:", e);
      }
    }

    // Bangun segmentasi kalimat otomatis berbasis kecepatan bicara rata-rata (~2.6 kata per detik)
    const sentences = substantiveScript
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    let curTime = 0.0;
    return sentences.map((s, idx) => {
      const wordsCount = s.split(/\s+/).length;
      const durationSec = Math.max(3.0, Math.round((wordsCount / 2.6) * 10) / 10);
      const segment: KaraokeSegment = {
        id: `seg_${idx + 1}`,
        startSec: Math.round(curTime * 10) / 10,
        endSec: Math.round((curTime + durationSec) * 10) / 10,
        speaker: "Narator Modul",
        text: s,
      };
      curTime += durationSec + 0.3;
      return segment;
    });
  }, [doc.karaokeJson, substantiveScript]);

  // Estimasi durasi jika audio belum dimuat
  const estimatedTotalDuration = useMemo(() => {
    if (karaokeSentences.length > 0) {
      return karaokeSentences[karaokeSentences.length - 1].endSec;
    }
    return 180;
  }, [karaokeSentences]);

  // Indeks baris aktif karaoke berdasarkan detik saat ini
  const activeSentenceIndex = karaokeSentences.findIndex(
    (seg) => audioCurrentTime >= seg.startSec && audioCurrentTime <= seg.endSec
  );

  // Auto-scroll ke baris aktif
  useEffect(() => {
    if (activeKaraokeRef.current && isPlaying) {
      activeKaraokeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSentenceIndex, isPlaying]);

  // Handle loop satu kalimat tertentu jika diaktifkan siswa
  useEffect(() => {
    if (loopingSegmentId && audioElementRef.current && isPlaying) {
      const targetSeg = karaokeSentences.find((s) => s.id === loopingSegmentId);
      if (targetSeg && audioCurrentTime >= targetSeg.endSec) {
        audioElementRef.current.currentTime = targetSeg.startSec;
      }
    }
  }, [audioCurrentTime, loopingSegmentId, karaokeSentences, isPlaying]);

  // Sync playback speed ke HTML5 audio element
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  // Handler Play / Pause Master Podcast
  const handleTogglePlay = async () => {
    audioSynth.playClickSound();

    if (!audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // 1. Coba putar file podcast yang sudah ada di server
    if (pregeneratedAudioUrl && !audioElementRef.current.src) {
      audioElementRef.current.src = pregeneratedAudioUrl;
      audioElementRef.current.load();
    }

    try {
      if (audioElementRef.current.src) {
        audioElementRef.current.playbackRate = playbackSpeed;
        await audioElementRef.current.play();
        setIsPlaying(true);
        audioSynth.playSuccessSound();
        return;
      }
    } catch (err) {
      console.warn("[AuditorySection] Direct audio play error, trying on-demand TTS:", err);
    }

    // 2. Generate on-demand TTS via EduVoice API jika belum ada file audio statis
    setIsLoadingTTS(true);
    try {
      const textToRead = substantiveScript.slice(0, 2200);
      const blob = await ApiService.generateTTS({
        text: textToRead,
        voice: "id-ID-ArdiNeural",
      });

      if (blob && blob.size > 200) {
        const audioUrl = URL.createObjectURL(blob);
        audioElementRef.current.src = audioUrl;
        audioElementRef.current.load();
        audioElementRef.current.playbackRate = playbackSpeed;
        await audioElementRef.current.play();
        setIsPlaying(true);
        audioSynth.playSuccessSound();
      }
    } catch (error) {
      console.error("[AuditorySection] Gagal mensintesis suara TTS:", error);
    } finally {
      setIsLoadingTTS(false);
    }
  };

  // Handler melompat ke kalimat tertentu (Seek to Sentence)
  const handleSeekToSentence = (startSec: number) => {
    audioSynth.playClickSound();
    setAudioCurrentTime(startSec);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = startSec;
      if (!isPlaying) {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Handler mengulang (repeat) kalimat tertentu
  const handleRepeatSentence = (seg: KaraokeSegment, e: React.MouseEvent) => {
    e.stopPropagation();
    audioSynth.playClickSound();
    handleSeekToSentence(seg.startSec);
  };

  // Handler toggle loop kalimat
  const handleToggleLoopSentence = (segId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    audioSynth.playClickSound();
    if (loopingSegmentId === segId) {
      setLoopingSegmentId(null);
    } else {
      setLoopingSegmentId(segId);
      const seg = karaokeSentences.find((s) => s.id === segId);
      if (seg) handleSeekToSentence(seg.startSec);
    }
  };

  const handleToggleMute = () => {
    audioSynth.playClickSound();
    if (audioElementRef.current) {
      audioElementRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setAudioCurrentTime(newTime);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = newTime;
    }
  };

  const handleSkipForward = () => {
    audioSynth.playClickSound();
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = Math.min(
        audioDuration || estimatedTotalDuration,
        audioElementRef.current.currentTime + 10
      );
    }
  };

  const handleSkipBackward = () => {
    audioSynth.playClickSound();
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = Math.max(0, audioElementRef.current.currentTime - 10);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HTML5 Audio Element Tersembunyi */}
      <audio
        ref={audioElementRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioElementRef.current) {
            setAudioCurrentTime(audioElementRef.current.currentTime);
            if (audioElementRef.current.duration && !isNaN(audioElementRef.current.duration)) {
              setAudioDuration(audioElementRef.current.duration);
            }
          }
        }}
        onLoadedMetadata={() => {
          if (audioElementRef.current?.duration && !isNaN(audioElementRef.current.duration)) {
            setAudioDuration(audioElementRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setAudioCurrentTime(0);
          setLoopingSegmentId(null);
        }}
        onError={(e) => {
          console.warn("[AuditorySection] Audio error:", e);
          setIsPlaying(false);
        }}
      />

      {/* ========================================================================= */}
      {/* 🎙️ 1. MASTER MUSIC & PODCAST STUDIO PLAYER                                 */}
      {/* ========================================================================= */}
      <section className="clay-card clay-lavender p-5 sm:p-7 text-[#2D2152] space-y-5 rounded-3xl shadow-sm border border-[#4B3B7A]/15 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#7C5CBF]/15 blur-3xl pointer-events-none" />

        {/* Track Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Spinning Vinyl Cover Art with Equalizer Animation */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#4B3B7A] to-[#1E143D] text-white flex items-center justify-center shrink-0 shadow-md">
              <Disc
                className={`w-8 h-8 sm:w-10 sm:h-10 text-white/80 ${
                  isPlaying ? "animate-spin [animation-duration:4s]" : ""
                }`}
              />
              {isPlaying && (
                <div className="absolute bottom-2 flex items-end gap-0.5 h-3">
                  <span className="w-1 bg-[#D1EBE1] rounded-full animate-bounce [animation-delay:0.1s] h-3" />
                  <span className="w-1 bg-[#D1EBE1] rounded-full animate-bounce [animation-delay:0.3s] h-2" />
                  <span className="w-1 bg-[#D1EBE1] rounded-full animate-bounce [animation-delay:0.2s] h-3.5" />
                  <span className="w-1 bg-[#D1EBE1] rounded-full animate-bounce [animation-delay:0.4s] h-2" />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#4B3B7A] text-white text-[10px] font-extrabold uppercase tracking-wide shadow-2xs">
                  {isPlaying ? "Sedang Diputar" : "Podcast Pembelajaran"}
                </span>
                <span className="text-[11px] font-bold text-[#4B3B7A]">
                  Narasi Penuh Kontinu
                </span>
              </div>

              <h2 className="text-base sm:text-xl font-black text-[#1E143D] leading-snug">
                {doc.title}
              </h2>

              <p className="text-xs text-[#4B3B7A] font-medium truncate max-w-md">
                {doc.summary || "Narasi audio komprehensif diselaraskan dengan naskah bacaan."}
              </p>
            </div>
          </div>

          {/* Voice Indicator Badge */}
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <span className="px-3 py-1 rounded-full bg-white/90 text-[#4B3B7A] text-xs font-black shadow-2xs border border-[#4B3B7A]/15">
              🎙️ EduVoice AI HD
            </span>
            <span className="text-[11px] font-bold text-[#5A5E70]">
              {classroomName || "Kelas Adaptif"}
            </span>
          </div>
        </div>

        {/* Timeline Scrubber Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max={audioDuration > 0 ? audioDuration : estimatedTotalDuration}
              value={audioCurrentTime}
              onChange={handleScrubberChange}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#4B3B7A] bg-black/10 transition-all hover:h-2.5"
            />
          </div>
          <div className="flex justify-between text-xs font-mono font-bold text-[#4B3B7A]">
            <span>{formatTime(audioCurrentTime)}</span>
            <span>{formatTime(audioDuration > 0 ? audioDuration : estimatedTotalDuration)}</span>
          </div>
        </div>

        {/* Transport Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#4B3B7A]/15">
          {/* Mute & Volume Status */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMute}
              className="p-2 rounded-xl text-[#4B3B7A] hover:bg-white/60 transition-all cursor-pointer"
              title={isMuted ? "Bunyikan Suara" : "Senyapkan"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <span className="text-xs font-bold text-[#4B3B7A]">
              {isLoadingTTS ? "Memuat Suara Narasi..." : isPlaying ? "Audio Aktif" : "Siap Diputar"}
            </span>
          </div>

          {/* Center: Playback Buttons */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 self-center">
            {/* Mundur 10 Detik */}
            <button
              type="button"
              onClick={handleSkipBackward}
              className="p-2.5 rounded-full text-[#4B3B7A] hover:bg-white/80 transition-all cursor-pointer flex items-center justify-center"
              title="Mundur 10 Detik"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[9px] font-black -ml-1">10</span>
            </button>

            {/* Master Play / Pause Button */}
            <button
              type="button"
              disabled={isLoadingTTS}
              onClick={handleTogglePlay}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                isPlaying
                  ? "bg-[#4B3B7A] text-white ring-4 ring-[#4B3B7A]/20"
                  : "bg-white text-[#4B3B7A] hover:bg-[#F4F0FD]"
              }`}
              title={isPlaying ? "Jeda Podcast" : "Putar Podcast Penuh"}
            >
              {isLoadingTTS ? (
                <Loader2 className="w-7 h-7 animate-spin text-[#4B3B7A]" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            {/* Maju 10 Detik */}
            <button
              type="button"
              onClick={handleSkipForward}
              className="p-2.5 rounded-full text-[#4B3B7A] hover:bg-white/80 transition-all cursor-pointer flex items-center justify-center"
              title="Maju 10 Detik"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[9px] font-black -ml-1">10</span>
            </button>
          </div>

          {/* Right: Kecepatan Putar */}
          <div className="flex items-center justify-end gap-1">
            <span className="text-[10px] font-extrabold text-[#4B3B7A] mr-0.5">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  audioSynth.playClickSound();
                  setPlaybackSpeed(spd);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                  playbackSpeed === spd
                    ? "bg-[#4B3B7A] text-white shadow-xs scale-105"
                    : "bg-white/60 text-[#4B3B7A] hover:bg-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🎤 2. LIVE KARAOKE TRANSCRIPT SYNC & REPEAT KALIMAT                      */}
      {/* ========================================================================= */}
      <section className="clay-card clay-white p-5 sm:p-7 rounded-3xl border border-[#4B3B7A]/15 space-y-4 shadow-xs">
        {/* Karaoke Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#ECE8F7] text-[#4B3B7A] flex items-center justify-center shadow-2xs">
              <Radio className="w-5 h-5 text-[#4B3B7A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B3B7A]">
                  Karaoke Transcript Sync
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#4B3B7A] text-white text-[9px] font-extrabold animate-pulse">
                  Live Sync
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-[#1C1E26] mt-0.5">
                Naskah Bacaan yang Sinkron dengan Suara
              </h3>
            </div>
          </div>

          <div className="text-xs text-[#5A5E70] font-medium">
            💡 Klik baris kalimat mana saja untuk mendengarkan bagian tersebut
          </div>
        </div>

        {/* Looping Banner Info if Active */}
        {loopingSegmentId && (
          <div className="p-2.5 rounded-xl bg-[#EBE4FA] text-[#4B3B7A] text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#4B3B7A] animate-spin [animation-duration:6s]" />
              <span>Mode Ulang Otomatis aktif untuk kalimat yang dipilih.</span>
            </div>
            <button
              type="button"
              onClick={() => setLoopingSegmentId(null)}
              className="text-[11px] font-black underline cursor-pointer hover:text-[#1E143D]"
            >
              Hentikan Ulang
            </button>
          </div>
        )}

        {/* Scrollable Sentence List */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {karaokeSentences.map((seg, idx) => {
            const isCurrentActive = activeSentenceIndex === idx;
            const isLoopingThis = loopingSegmentId === seg.id;

            return (
              <div
                key={seg.id}
                ref={isCurrentActive ? activeKaraokeRef : null}
                onClick={() => handleSeekToSentence(seg.startSec)}
                className={`p-4 sm:p-4.5 rounded-2xl transition-all cursor-pointer space-y-2 border relative ${
                  isCurrentActive
                    ? "bg-[#F4F0FD] border-2 border-[#4B3B7A] shadow-md ring-4 ring-[#4B3B7A]/15 scale-[1.01]"
                    : "bg-white/80 border-black/5 hover:border-[#4B3B7A]/30 hover:bg-[#FAF8FD]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-2xs ${
                        isCurrentActive ? "bg-[#4B3B7A] text-white" : "bg-[#ECE8F7] text-[#4B3B7A]"
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {isCurrentActive && isPlaying && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-[#4B3B7A] uppercase bg-white px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4B3B7A]" />
                        Sedang Disuarakan
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tombol Ulang Kalimat Ini (Repeat) */}
                    <button
                      type="button"
                      onClick={(e) => handleRepeatSentence(seg, e)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-[#4B3B7A]/20 text-[#4B3B7A] hover:bg-[#ECE8F7] text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      title="Ulang Kalimat Ini dari Awal"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Ulang Kalimat</span>
                    </button>

                    {/* Tombol Loop Kalimat */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleLoopSentence(seg.id, e)}
                      className={`p-1.5 rounded-xl border text-[10px] font-extrabold flex items-center shadow-2xs transition-all cursor-pointer ${
                        isLoopingThis
                          ? "bg-[#4B3B7A] text-white border-[#4B3B7A]"
                          : "bg-white border-[#4B3B7A]/20 text-[#4B3B7A] hover:bg-[#ECE8F7]"
                      }`}
                      title={isLoopingThis ? "Hentikan Loop Kalimat" : "Ulangi Terus Kalimat Ini"}
                    >
                      <Repeat className="w-3 h-3" />
                    </button>

                    <span className="text-[10px] font-mono font-bold text-[#5A5E70] ml-1">
                      {formatTime(seg.startSec)}
                    </span>
                  </div>
                </div>

                <p
                  className={`text-xs sm:text-sm leading-relaxed transition-colors ${
                    isCurrentActive
                      ? "text-[#1E143D] font-extrabold"
                      : "text-[#2D2152]/80 font-normal"
                  }`}
                >
                  {seg.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
