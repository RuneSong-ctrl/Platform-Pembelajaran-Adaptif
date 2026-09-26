import { levelLabel } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { ApiService } from "@/services/apiClient";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import { ArrowLeft, ArrowRight, Eye, Headphones, FlaskConical, Flame, Star, Award } from "@/components/ui/icons";

// Only numbers the backend actually records are shown here; the old per-style
// "parameters" (scan speed, focus stability, ...) were constants, not measurements.
const STYLES = {
  VISUAL: {
    label: "gambar dan bagan", Icon: Eye,
    card: "bg-[#F4FAF7] border-[#D1EBE1]", ink: "text-[#1D5E4D]", bar: "bg-[#1D5E4D]", chip: "bg-[#D1EBE1] text-[#1D5E4D]",
  },
  AUDITORI: {
    label: "mendengarkan", Icon: Headphones,
    card: "bg-[#F8F6FD] border-[#E3DBF8]", ink: "text-[#4B3B7A]", bar: "bg-[#4B3B7A]", chip: "bg-[#E3DBF8] text-[#4B3B7A]",
  },
  KINESTETIK: {
    label: "praktik langsung", Icon: FlaskConical,
    card: "bg-[#FFFBF0] border-[#FEE7B3]", ink: "text-[#785308]", bar: "bg-[#785308]", chip: "bg-[#FEE7B3] text-[#785308]",
  },
} as const;

type Progress = { pct: number; done: number; total: number; unit: string };

export default function LearningPathwayStatusPage() {
  const navigate = useNavigate();
  const { currentUser, credentials } = useApp();
  const style = (currentUser.learningStyle || "KINESTETIK") as keyof typeof STYLES;
  const theme = STYLES[style] ?? STYLES.KINESTETIK;
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    const lp = currentUser.learningProgress;
    const fromUser = (): Progress =>
      style === "VISUAL" ? { pct: lp?.visual ?? 0, done: lp?.visualCompleted ?? 0, total: lp?.visualTotal ?? 0, unit: "materi bergambar selesai" }
      : style === "AUDITORI" ? { pct: lp?.audio ?? 0, done: lp?.audioMinutes ?? 0, total: 45, unit: "menit mendengarkan" }
      : { pct: lp?.practice ?? 0, done: lp?.practiceCompleted ?? 0, total: lp?.practiceTotal ?? 0, unit: "tugas praktik selesai" };
    setProgress(fromUser());
    ApiService.getStyleAnalytics(currentUser.id).then((res) => {
      if (!res) return;
      const v = res.visual_params, a = res.auditory_params, k = res.kinesthetic_params;
      setProgress(
        style === "VISUAL" ? { pct: v.visual_progress_pct, done: v.mindmap_explored_count, total: v.mindmap_total_count, unit: "materi bergambar selesai" }
        : style === "AUDITORI" ? { pct: a.audio_progress_pct, done: a.total_listening_minutes, total: a.target_listening_minutes, unit: "menit mendengarkan" }
        : { pct: k.practice_progress_pct, done: k.missions_completed, total: k.missions_total, unit: "tugas praktik selesai" },
      );
    }).catch(() => { /* keep the locally known progress */ });
  }, [currentUser?.id, currentUser?.learningProgress, style]);

  const myScores = credentials.filter((c) => c.studentId === currentUser.id && c.score != null).map((c) => c.score as number);
  const avgScore = myScores.length ? Math.round(myScores.reduce((a, b) => a + b, 0) / myScores.length) : null;
  const started = Boolean(progress && progress.done > 0);

  const stats = [
    { Icon: Star, label: "Poin XP", value: `${currentUser.xpTotal || 0}` },
    { Icon: Flame, label: "Hari berturut-turut", value: `${currentUser.streakDays || 0}` },
    { Icon: Award, label: "Level", value: levelLabel(currentUser.currentDDALevel) },
    ...(avgScore !== null ? [{ Icon: Award, label: "Nilai rata-rata", value: `${avgScore}` }] : []),
  ];

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-5 min-w-0 pb-24 md:pb-8">
          <div className="max-w-2xl mx-auto flex flex-col gap-5">
            <Link
              to="/student"
              onClick={() => audioSynth.playClickSound()}
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-2xs text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#010105]">Perkembanganmu</h1>
              <p className="text-sm text-[#5A5E70]">
                Kamu paling mudah belajar lewat <strong className={theme.ink}>{theme.label}</strong>.
              </p>
            </div>

            <section className={`clay-card p-5 sm:p-6 border space-y-4 shadow-xs ${theme.card}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${theme.chip}`}>
                  <theme.Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className={`text-3xl font-black leading-none ${theme.ink}`}>{progress?.pct ?? 0}%</span>
                  <p className="text-sm font-bold text-[#5A5E70]">
                    {progress ? `${progress.done} dari ${progress.total} ${progress.unit}` : "Memuat…"}
                  </p>
                </div>
              </div>

              <div
                className="w-full bg-white h-3.5 rounded-full overflow-hidden border border-black/5"
                role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress?.pct ?? 0}
              >
                <div className={`h-full rounded-full transition-all duration-700 ${theme.bar}`} style={{ width: `${progress?.pct ?? 0}%` }} />
              </div>

              {!started && progress && (
                <p className="text-sm text-[#5A5E70]">Belum ada kegiatan tercatat. Mulai belajar, nanti progresmu muncul di sini.</p>
              )}

              <button
                onClick={() => { audioSynth.playClickSound(); navigate("/student/learn"); }}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-black shadow-xs cursor-pointer ${theme.bar}`}
              >
                <span>{started ? "Lanjut Belajar" : "Mulai Belajar"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>

            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map(({ Icon, label, value }) => (
                <div key={label} className="clay-card bg-white p-4 border border-[rgba(28,30,38,0.06)] shadow-2xs">
                  <Icon className={`w-4 h-4 ${theme.ink}`} />
                  <span className="block text-lg font-black text-[#010105] mt-1">{value}</span>
                  <span className="block text-mini font-bold text-[#5A5E70]">{label}</span>
                </div>
              ))}
            </section>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
