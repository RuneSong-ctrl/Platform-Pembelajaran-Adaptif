import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ApiService, RosterStudent } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";
import { ArrowLeft, Copy, Check, Search, Users, BookOpen, FileText, AlertCircle, Lock, MessageSquare, Link2 } from "@/components/ui/icons";
import AnnouncementFeed from "@/components/common/AnnouncementFeed";
import MessageThread from "@/components/common/MessageThread";
import { classJoinLink } from "@/pages/public/JoinClassPage";

// One colour per class, shared with the dashboard cards so a class looks the same everywhere.
const TONES = [
  { card: "clay-mint", text: "text-[#1D5E4D]" },
  { card: "clay-lavender", text: "text-[#4B3B7A]" },
  { card: "clay-sky", text: "text-[#21518A]" },
  { card: "clay-butter", text: "text-[#785308]" },
];
export const classTone = (index: number) => TONES[Math.max(0, index) % TONES.length];

const STYLE_LABEL: Record<string, string> = {
  VISUAL: "Visual (lebih paham lewat gambar)",
  AUDITORI: "Auditori (lebih paham lewat mendengar)",
  KINESTETIK: "Kinestetik (lebih paham lewat praktik)",
};
const LEVEL_LABEL: Record<string, string> = { BASIC: "Dasar", MEDIUM: "Menengah", CHALLENGING: "Lanjut", MASTERY: "Mahir" };

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime()) / 86400000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

type Tab = "pengumuman" | "siswa" | "materi" | "tugas";

export default function TeacherClassPage() {
  const { classId } = useParams();
  const { classrooms, documents, tasks, triggerSync } = useApp();
  const index = classrooms.findIndex((c) => c.id === classId);
  const cls = classrooms[index];
  const tone = classTone(index);

  const [tab, setTab] = useState<Tab>("pengumuman");
  const [chatWith, setChatWith] = useState<RosterStudent | null>(null);
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [selected, setSelected] = useState<RosterStudent | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!classId) return;
    ApiService.getClassRoster(classId).then(setRoster).catch((e) => setError(e.message));
  }, [classId]);

  if (!cls) {
    return (
      <Shell>
        <div className="clay-card clay-white p-8 text-center space-y-3 max-w-sm mx-auto mt-10">
          <h2 className="text-lg font-black text-[#010105]">Kelas tidak ditemukan</h2>
          <p className="text-xs text-[#5A5E70]">Kelas ini mungkin sudah dihapus atau bukan milik Anda.</p>
          <BackLink />
        </div>
      </Shell>
    );
  }

  const classDocs = documents.filter((d) => d.classroomId === cls.id);
  const classTasks = tasks.filter((t) => t.classroomId === cls.id);
  const needAttention = (roster || []).filter((s) => s.alerts.length > 0).length;
  const shown = (roster || []).filter(
    (s) =>
      (!onlyAlerts || s.alerts.length > 0) &&
      (s.name + " " + s.email).toLowerCase().includes(query.trim().toLowerCase()),
  );

  const resetCode = async () => {
    if (!window.confirm("Ganti kode kelas? Kode dan link lama langsung tidak berlaku. Siswa yang sudah bergabung tetap di kelas.")) return;
    try {
      await ApiService.resetClassCode(cls.id);
      await triggerSync();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kode gagal diganti.");
    }
  };

  const copyText = (what: "code" | "link") => {
    navigator.clipboard?.writeText(what === "code" ? cls.joinCode : classJoinLink(cls.joinCode)).catch(() => {});
    audioSynth.playClickSound();
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  const removeStudent = async () => {
    if (!selected) return;
    try {
      await ApiService.removeStudent(cls.id, selected.id);
      setRoster((r) => (r || []).filter((s) => s.id !== selected.id));
      setSelected(null);
      setConfirmRemove(false);
      triggerSync();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "pengumuman", label: "Pengumuman" },
    { id: "siswa", label: "Siswa", count: cls.studentIds.length },
    { id: "materi", label: "Materi", count: classDocs.length },
    { id: "tugas", label: "Tugas", count: classTasks.length },
  ];

  return (
    <Shell>
      <BackLink />

      {/* Class banner */}
      <section className={`clay-card ${tone.card} p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">{cls.name}</h1>
          <p className={`text-sm font-bold mt-1 ${tone.text}`}>
            {cls.subject} · Kelas {cls.grade}
          </p>
        </div>
        <div className="bg-white/70 rounded-2xl px-4 py-3 self-start sm:self-auto">
          <span className="block text-mini font-bold text-[#5A5E70]">Kode kelas</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-black tracking-widest text-[#010105]">{cls.joinCode}</span>
            <button onClick={() => copyText("code")} aria-label="Salin kode kelas" className="p-1.5 rounded-lg hover:bg-white cursor-pointer text-[#5A5E70]">
              {copied === "code" ? <Check className="w-4 h-4 text-[#1D5E4D]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => copyText("link")}
            className="mt-1.5 w-full clay-btn clay-btn-white px-3 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied === "link" ? <Check className="w-3.5 h-3.5 text-[#1D5E4D]" /> : <Link2 className="w-3.5 h-3.5" />}
            {copied === "link" ? "Link tersalin" : "Salin link undangan"}
          </button>
          <span className="block text-mini text-[#5A5E70] mt-1">Siswa yang membuka link langsung bergabung</span>
          <button onClick={resetCode} className="mt-1 text-mini font-bold text-[#852C28] hover:underline cursor-pointer">
            Ganti kode &amp; link
          </button>
        </div>
      </section>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-[rgba(28,30,38,0.08)] overflow-x-auto" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-none px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-black whitespace-nowrap -mb-px border-b-2 cursor-pointer transition-colors ${
              tab === t.id ? "border-[#010105] text-[#010105]" : "border-transparent text-[#9195A8] hover:text-[#5A5E70]"
            }`}
          >
            {t.label} {t.count !== undefined && <span className="text-xs font-bold text-[#9195A8]">{t.count}</span>}
          </button>
        ))}
      </nav>

      {error && <p className="text-xs font-bold text-[#852C28]">{error}</p>}

      {tab === "pengumuman" && <AnnouncementFeed classroomId={cls.id} canPost />}

      {tab === "siswa" && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="relative sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9195A8]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau email"
                className="rounded-xl text-xs bg-white pl-9"
              />
            </div>
            {needAttention > 0 && (
              <button
                onClick={() => setOnlyAlerts((v) => !v)}
                className={`clay-pill px-3 py-1.5 text-xs font-bold cursor-pointer self-start ${
                  onlyAlerts ? "clay-coral text-[#852C28]" : "clay-white text-[#5A5E70]"
                }`}
              >
                {onlyAlerts ? "Tampilkan semua" : `${needAttention} siswa perlu perhatian`}
              </button>
            )}
          </div>

          {roster === null && !error ? (
            <p className="text-xs text-[#9195A8]">Memuat daftar siswa...</p>
          ) : cls.studentIds.length === 0 ? (
            <Empty icon={<Users className="w-6 h-6" />} title="Belum ada siswa">
              Bagikan kode <b className="font-mono">{cls.joinCode}</b> ke siswa. Setelah bergabung, nama mereka muncul di sini.
            </Empty>
          ) : shown.length === 0 ? (
            <p className="text-xs text-[#9195A8]">Tidak ada siswa yang cocok.</p>
          ) : (
            <ul className="clay-card clay-white divide-y divide-[rgba(28,30,38,0.06)] overflow-hidden">
              {shown.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelected(s)}
                    className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-[#F8F9FD] cursor-pointer"
                  >
                    <span className="w-9 h-9 rounded-full bg-[#E0DAF5] text-[#4B3B7A] font-black text-sm flex items-center justify-center shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-black text-[#010105] truncate">{s.name}</span>
                      <span className="block text-xs text-[#9195A8] truncate">
                        {s.alerts[0] ? <span className="text-[#852C28] font-bold">{s.alerts[0]}</span> : `Aktif ${timeAgo(s.last_active).toLowerCase()}`}
                      </span>
                    </span>
                    <span className="hidden sm:block w-28">
                      <span className="block text-mini font-bold text-[#9195A8] mb-1">Progres {s.progress}%</span>
                      <span className="block h-1.5 rounded-full bg-[#EEF0F6] overflow-hidden">
                        <span className="block h-full bg-[#1D5E4D] rounded-full" style={{ width: `${s.progress}%` }} />
                      </span>
                    </span>
                    <span className="hidden md:block w-20 text-right text-xs font-bold text-[#5A5E70]">
                      {s.tasks_submitted}/{s.tasks_total} tugas
                    </span>
                    <span className="w-12 text-right text-sm font-black text-[#010105]">{s.average_grade ?? "–"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {shown.length > 0 && <p className="text-mini text-[#9195A8] text-right">Angka di kanan = rata-rata nilai tugas</p>}
        </section>
      )}

      {tab === "materi" && (
        <section className="space-y-3">
          <p className="text-xs text-[#5A5E70] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Hanya siswa yang terdaftar di kelas ini yang bisa membuka materinya.
          </p>
          {classDocs.length === 0 ? (
            <Empty icon={<BookOpen className="w-6 h-6" />} title="Belum ada materi">
              Unggah materi di menu <Link to={`/teacher/rag?kelas=${cls.id}`} className="font-bold underline">Materi Ajar</Link>.
            </Empty>
          ) : (
            <ul className="clay-card clay-white divide-y divide-[rgba(28,30,38,0.06)]">
              {classDocs.map((d) => (
                <li key={d.id} className="px-5 py-3.5 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#4B3B7A] shrink-0" />
                  <span className="flex-1 text-sm font-bold text-[#010105] truncate">{d.title}</span>
                  <span className="text-xs text-[#9195A8]">{new Date(d.uploadedAt).toLocaleDateString("id-ID")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "tugas" && (
        <section className="space-y-3">
          {classTasks.length === 0 ? (
            <Empty icon={<FileText className="w-6 h-6" />} title="Belum ada tugas">
              Buat kuis atau tugas di menu <Link to="/teacher/quiz-generator" className="font-bold underline">Buat Kuis</Link>.
            </Empty>
          ) : (
            <ul className="clay-card clay-white divide-y divide-[rgba(28,30,38,0.06)]">
              {classTasks.map((t) => (
                <li key={t.id} className="px-5 py-3.5 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#21518A] shrink-0" />
                  <span className="flex-1 text-sm font-bold text-[#010105] truncate">{t.title}</span>
                  {t.dueDate && <span className="text-xs text-[#9195A8]">Batas {new Date(t.dueDate).toLocaleDateString("id-ID")}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Student detail */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setConfirmRemove(false); } }}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-black text-[#010105]">{selected.name}</DialogTitle>
                <DialogDescription className="text-xs text-[#5A5E70]">{selected.email}</DialogDescription>
              </DialogHeader>

              {selected.alerts.length > 0 && (
                <div className="clay-card clay-coral p-3 space-y-1">
                  {selected.alerts.map((a) => (
                    <p key={a} className="text-xs font-bold text-[#852C28] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {a}
                    </p>
                  ))}
                </div>
              )}

              <dl className="grid grid-cols-2 gap-3 text-xs my-2">
                <Stat label="Progres belajar" value={`${selected.progress}%`} />
                <Stat label="Rata-rata nilai" value={selected.average_grade ?? "Belum ada"} />
                <Stat label="Tugas dikumpulkan" value={`${selected.tasks_submitted} dari ${selected.tasks_total}`} />
                <Stat label="Terakhir aktif" value={timeAgo(selected.last_active)} />
                <Stat label="Level" value={LEVEL_LABEL[selected.level || ""] || "Dasar"} />
                <Stat label="Hari belajar beruntun" value={`${selected.streak_days} hari`} />
                <div className="col-span-2">
                  <Stat label="Gaya belajar" value={STYLE_LABEL[selected.learning_style || ""] || "Belum diketahui"} />
                </div>
              </dl>

              <div className="flex justify-between items-center pt-2 border-t border-[rgba(28,30,38,0.06)]">
                {confirmRemove ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#852C28]">Keluarkan siswa ini?</span>
                    <button onClick={removeStudent} className="clay-btn clay-btn-coral px-3 py-1.5 text-xs font-black cursor-pointer">Ya</button>
                    <button onClick={() => setConfirmRemove(false)} className="clay-btn clay-btn-white px-3 py-1.5 text-xs font-bold cursor-pointer">Batal</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmRemove(true)} className="text-xs font-bold text-[#852C28] hover:underline cursor-pointer">
                    Keluarkan dari kelas
                  </button>
                )}
                <button
                  onClick={() => {
                    setChatWith(selected);
                    setSelected(null);
                  }}
                  className="clay-btn clay-btn-dark px-4 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Kirim pesan
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Private chat with one student */}
      <Dialog open={!!chatWith} onOpenChange={(o) => !o && setChatWith(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
          {chatWith && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-black text-[#010105]">{chatWith.name}</DialogTitle>
                <DialogDescription className="text-xs text-[#5A5E70]">Pesan pribadi · hanya Anda dan siswa ini yang bisa membaca</DialogDescription>
              </DialogHeader>
              <MessageThread classroomId={cls.id} studentId={chatWith.id} emptyHint="Belum ada pesan. Tulis pesan pertama untuk siswa ini." />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden w-full">
        <TeacherSidebar />
        <main className="flex-1 overflow-y-auto min-w-0 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/teacher" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A5E70] hover:text-[#010105]">
      <ArrowLeft className="w-4 h-4" /> Semua kelas
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[#F8F9FD] rounded-xl p-2.5">
      <dt className="text-mini font-bold text-[#9195A8]">{label}</dt>
      <dd className="text-sm font-black text-[#010105]">{value}</dd>
    </div>
  );
}

function Empty({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="clay-card clay-white p-8 text-center space-y-2">
      <div className="w-12 h-12 rounded-2xl bg-[#F8F9FD] text-[#9195A8] flex items-center justify-center mx-auto">{icon}</div>
      <h3 className="text-sm font-black text-[#010105]">{title}</h3>
      <p className="text-xs text-[#5A5E70] max-w-xs mx-auto">{children}</p>
    </div>
  );
}
