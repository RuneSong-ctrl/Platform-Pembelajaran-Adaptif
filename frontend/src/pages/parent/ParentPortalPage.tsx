import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import { audioSynth } from "@/services/audioSynth";
import {
  Brain,
  Clock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Send,
  Calendar,
  Check,
  Users,
  Flame,
  Award,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  User,
} from "@/components/ui/icons";

export default function ParentPortalPage() {
  const {
    users,
    notes,
    sendParentTeacherNote,
    learningSchedules,
  } = useApp();

  const [selectedChildId, setSelectedChildId] = useState<string>("user_ayu_01");
  const [noteMessage, setNoteMessage] = useState("");
  const [noteSentSuccess, setNoteSentSuccess] = useState(false);
  const [mobileTab, setMobileTab] = useState<"overview" | "chat" | "schedule">("chat");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const selectedChild =
    users.find((u) => u.id === selectedChildId) || users[0];

  const handleSendNote = () => {
    if (!noteMessage.trim()) return;
    audioSynth.playSuccessSound();
    sendParentTeacherNote("user_teacher_01", selectedChild.id, noteMessage);
    setNoteMessage("");
    setNoteSentSuccess(true);
    setTimeout(() => setNoteSentSuccess(false), 3000);
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [notes, noteSentSuccess]);

  const childSchedules = learningSchedules.filter(
    (s) => s.studentId === selectedChild.id
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] pb-16">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-8 space-y-5 sm:space-y-7">
        {/* 1. TOP HEADER & CHILD SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="clay-pill clay-mint px-2.5 py-0.5 text-[11px] font-extrabold text-[#1D5E4D]">
                Portal Orang Tua
              </span>
              <span className="clay-pill clay-lavender px-2.5 py-0.5 text-[11px] font-bold text-[#4B3B7A]">
                Laporan Real-time
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#010105] tracking-tight">
              Perkembangan Belajar &amp; Kognitif Anak
            </h1>
            <p className="text-xs text-[#5A5E70] font-medium mt-0.5">
              Pantau kemajuan topik kurikulum, kebiasaan belajar mandiri, dan konsultasi langsung dengan wali kelas.
            </p>
          </div>

          {/* Child Switcher Pills */}
          <div className="clay-card clay-white p-1 flex items-center gap-1 self-start sm:self-auto shadow-2xs">
            <button
              onClick={() => {
                audioSynth.playClickSound();
                setSelectedChildId("user_ayu_01");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                selectedChildId === "user_ayu_01"
                  ? "clay-btn clay-btn-dark text-white font-black"
                  : "text-[#5A5E70] hover:text-[#010105]"
              }`}
            >
              Ayu Lestari (10-A)
            </button>
            <button
              onClick={() => {
                audioSynth.playClickSound();
                setSelectedChildId("user_budi_02");
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                selectedChildId === "user_budi_02"
                  ? "clay-btn clay-btn-dark text-white font-black"
                  : "text-[#5A5E70] hover:text-[#010105]"
              }`}
            >
              Budi Pratama (10-A)
            </button>
          </div>
        </div>

        {/* 2. AI NARRATIVE PROGRESS SUMMARY (Clay Mint Hero Card) */}
        <div className="clay-card clay-mint p-4 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="clay-card clay-white w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#1D5E4D]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0E3D31]">
                  Ringkasan Naratif AI untuk Orang Tua
                </h3>
                <span className="text-[11px] text-[#1D5E4D] font-bold">
                  Siswa: {selectedChild.name} • Kelas 10-A
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="clay-pill clay-white text-[10px] font-extrabold text-[#1D5E4D] px-2.5 py-0.5 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                <span>{selectedChild.streakDays || 14} Hari Aktif</span>
              </span>
              <span className="clay-pill clay-white text-[10px] font-extrabold text-[#21518A] px-2.5 py-0.5">
                {selectedChild.xpTotal || 450} XP
              </span>
            </div>
          </div>

          <p className="text-xs text-[#082921] font-medium leading-relaxed bg-white/50 p-3 sm:p-3.5 rounded-2xl border border-white/60">
            Minggu ini, <strong>{selectedChild.name}</strong> menunjukkan penguasaan sangat baik pada topik <em>Fisiologi Sistem Pencernaan &amp; Enzim</em> dengan akurasi kuis adaptif DDA <strong>82%</strong> dan modalitas dominan <strong>Visual ({selectedChild.modalityScores?.visual || 80}%)</strong>. Rekomendasi: Berikan apresiasi atas konsistensi belajar mandiri selama {selectedChild.streakDays || 14} hari berturut-turut.
          </p>
        </div>

        {/* 3. SLEEK & FLUSH SEGMENTED SLIDER CONTROL (md:hidden) */}
        <div className="grid grid-cols-3 gap-1 bg-[#ECE9F2] p-1 rounded-2xl w-full max-w-sm mx-auto md:hidden">
          <button
            onClick={() => {
              audioSynth.playClickSound();
              setMobileTab("overview");
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              mobileTab === "overview"
                ? "bg-white text-[#010105] shadow-xs font-black"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <Brain className="w-3.5 h-3.5 shrink-0" />
            <span>Penguasaan</span>
          </button>

          <button
            onClick={() => {
              audioSynth.playClickSound();
              setMobileTab("chat");
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              mobileTab === "chat"
                ? "bg-[#1C1E26] text-white shadow-xs font-black"
                : "text-[#4B3B7A] font-extrabold"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Chat Guru</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D5E4D]"></span>
          </button>

          <button
            onClick={() => {
              audioSynth.playClickSound();
              setMobileTab("schedule");
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              mobileTab === "schedule"
                ? "bg-white text-[#010105] shadow-xs font-black"
                : "text-[#5A5E70] hover:text-[#010105]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Jadwal</span>
          </button>
        </div>

        {/* 4. MAIN CONTENT: 2-COLUMN GRID ON DESKTOP, MODERN TABBED ON MOBILE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start">
          {/* LEFT SECTION (7 cols on desktop): TOPIC MASTERY & DIGITAL WELLBEING */}
          <div
            className={`lg:col-span-7 space-y-5 ${
              mobileTab !== "overview" ? "hidden md:block" : ""
            }`}
          >
            {/* Topic Mastery Progress */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#010105] flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#4B3B7A]" />
                    <span>Penguasaan Topik Kurikulum Adaptif</span>
                  </h3>
                  <p className="text-[11px] text-[#5A5E70]">
                    Progres pemahaman per materi berdasarkan evaluasi DDA.
                  </p>
                </div>
                <span className="clay-pill clay-lavender text-[9px] font-extrabold px-2.5 py-0.5 text-[#4B3B7A]">
                  Biologi 10
                </span>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-black text-[#010105] mb-1">
                    <span>Biologi: Sistem Pencernaan &amp; Reaksi Enzim</span>
                    <span className="text-[#1D5E4D]">95% (Mastery)</span>
                  </div>
                  <div className="w-full bg-[#EBF6F2] h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-[#1D5E4D] h-full rounded-full w-[95%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-black text-[#010105] mb-1">
                    <span>Biologi: Ekosistem &amp; Daur Energi</span>
                    <span className="text-[#4B3B7A]">78% (Challenging)</span>
                  </div>
                  <div className="w-full bg-[#EBF6F2] h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-[#4B3B7A] h-full rounded-full w-[78%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-black text-[#010105] mb-1">
                    <span>Matematika: Aljabar &amp; Statistik Dasar</span>
                    <span className="text-[#785308]">65% (Perlu Penguatan)</span>
                  </div>
                  <div className="w-full bg-[#EBF6F2] h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-[#785308] h-full rounded-full w-[65%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Wellbeing Tracker */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#010105] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1D5E4D]" />
                    <span>Pola Waktu Belajar &amp; Istirahat (Digital Wellbeing)</span>
                  </h3>
                  <p className="text-[11px] text-[#5A5E70]">
                    Monitoring screen time edukatif vs waktu jeda istirahat siswa.
                  </p>
                </div>
                <span className="clay-pill clay-mint text-[9px] font-extrabold px-2.5 py-0.5 text-[#1D5E4D]">
                  Optimal
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="clay-pill bg-[#F8F9FD] p-3 space-y-0.5">
                  <span className="text-[10px] text-[#5A5E70] font-bold block">Waktu Belajar</span>
                  <span className="text-xl font-black text-[#010105] block">42 Menit</span>
                  <span className="text-[9px] text-[#1D5E4D] font-bold block">Sesuai Panduan</span>
                </div>
                <div className="clay-pill bg-[#F8F9FD] p-3 space-y-0.5">
                  <span className="text-[10px] text-[#5A5E70] font-bold block">Status Layar</span>
                  <span className="text-xl font-black text-[#1D5E4D] block">Seimbang</span>
                  <span className="text-[9px] text-[#5A5E70] font-bold block">Jeda 10 Mnt Terpenuhi</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION (5 cols on desktop): AUTHENTIC & CRISP CHAT MESSENGER UI */}
          <div
            className={`lg:col-span-5 space-y-5 ${
              mobileTab === "overview" ? "hidden md:block" : ""
            }`}
          >
            {/* 1. AUTHENTIC MODERN CHAT MESSENGER UI */}
            <div
              className={`bg-white rounded-3xl border border-[rgba(28,30,38,0.08)] shadow-xs flex flex-col overflow-hidden ${
                mobileTab === "schedule" ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Messenger Header */}
              <div className="px-4 py-3 bg-[#FCFBFE] border-b border-[rgba(28,30,38,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E0DAF5] text-[#4B3B7A] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    GW
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-black text-[#010105]">
                        Bpk. Gunawan, M.Pd.
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-[#1D5E4D]"></span>
                    </div>
                    <p className="text-[10px] text-[#5A5E70] font-medium">
                      Wali Kelas 10-A • Konsultasi Terbuka
                    </p>
                  </div>
                </div>

                <span className="bg-[#EBF6F2] text-[#1D5E4D] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>

              {/* Messenger Chat Stream */}
              <div
                ref={chatScrollRef}
                className="p-3.5 sm:p-4 space-y-3 bg-[#FAF9FD] min-h-[220px] max-h-[300px] overflow-y-auto"
              >
                <div className="text-center my-1">
                  <span className="text-[9px] font-bold text-[#9195A8] bg-white/80 px-2.5 py-0.5 rounded-full border border-black/5">
                    Konsultasi Terkait Siswa: {selectedChild.name}
                  </span>
                </div>

                {notes.map((note) => (
                  <div key={note.id} className="space-y-2.5">
                    {/* Parent Bubble (Right-aligned, Dark pillowy) */}
                    <div className="flex flex-col items-end gap-1 max-w-[88%] ml-auto">
                      <div className="bg-[#1C1E26] text-white p-3 rounded-2xl rounded-tr-xs text-xs leading-relaxed shadow-2xs">
                        <p>{note.message}</p>
                      </div>
                      <span className="text-[9px] text-[#9195A8] font-medium pr-1">
                        Ibu Ni Wayan Sari • Terkirim
                      </span>
                    </div>

                    {/* Teacher Reply Bubble (Left-aligned, Lavender) */}
                    {note.reply && (
                      <div className="flex items-start gap-2 max-w-[90%]">
                        <div className="w-6 h-6 rounded-full bg-[#E0DAF5] text-[#4B3B7A] font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          GW
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="bg-white border border-[#E3DBF8] text-[#2D2152] p-3 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-2xs">
                            <span className="text-[10px] font-black text-[#4B3B7A] block mb-0.5">
                              Bpk. Gunawan, M.Pd.
                            </span>
                            <p>{note.reply}</p>
                          </div>
                          <span className="text-[9px] text-[#9195A8] font-medium pl-1">
                            Dibalas oleh Wali Kelas
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Messenger Bottom Input Bar */}
              <div className="p-2.5 bg-white border-t border-[rgba(28,30,38,0.06)]">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Tulis pesan ke wali kelas..."
                    value={noteMessage}
                    onChange={(e) => setNoteMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendNote();
                    }}
                    className="flex-1 px-3.5 py-2 text-xs bg-[#F8F9FD] rounded-full border border-[rgba(28,30,38,0.08)] outline-none focus:border-[#4B3B7A] focus:bg-white text-[#1C1E26] placeholder:text-[#9195A8] transition-all"
                  />
                  <button
                    onClick={handleSendNote}
                    disabled={!noteMessage.trim()}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      noteMessage.trim()
                        ? "bg-[#1C1E26] hover:bg-[#2C303E] text-white shadow-xs"
                        : "bg-[#F0EEF6] text-[#9195A8] cursor-not-allowed"
                    }`}
                    title="Kirim Pesan"
                  >
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>

                {noteSentSuccess && (
                  <p className="text-[10px] font-bold text-[#1D5E4D] mt-1 pl-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Pesan terkirim ke wali kelas.
                  </p>
                )}
              </div>
            </div>

            {/* 2. LEARNING SCHEDULE PLAN CREATED BY CHILD */}
            <div
              className={`bg-white rounded-3xl p-4 sm:p-5 border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3.5 ${
                mobileTab === "chat" ? "hidden md:block" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#010105] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#4B3B7A]" />
                    <span>Jadwal Mandiri Anak</span>
                  </h3>
                  <p className="text-[10px] text-[#5A5E70]">
                    Disusun sendiri oleh {selectedChild.name}.
                  </p>
                </div>
                <span className="clay-pill clay-lavender text-[9px] font-extrabold px-2 py-0.5 text-[#4B3B7A]">
                  {childSchedules.filter((s) => s.completed).length}/{childSchedules.length} Tuntas
                </span>
              </div>

              <div className="space-y-2.5">
                {childSchedules.map((sch) => (
                  <div
                    key={sch.id}
                    className={`p-3 rounded-2xl border space-y-1 ${
                      sch.completed
                        ? "bg-[#F8F9FD] border-[rgba(28,30,38,0.04)] opacity-70"
                        : "bg-white border-[rgba(28,30,38,0.08)] shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="clay-pill clay-lavender text-[9px] font-extrabold px-2 py-0.2 text-[#4B3B7A]">
                        {sch.day} • {sch.time}
                      </span>
                      {sch.completed ? (
                        <span className="clay-pill clay-mint text-[8px] font-extrabold text-[#1D5E4D] px-1.5 py-0.2 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Selesai
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-[#9195A8]">
                          Aktif
                        </span>
                      )}
                    </div>
                    <h4 className={`text-xs font-bold ${sch.completed ? "line-through text-[#9195A8]" : "text-[#010105]"}`}>
                      {sch.title}
                    </h4>
                    <span className="text-[10px] text-[#5A5E70] block font-medium">
                      {sch.format} ({sch.duration})
                    </span>
                  </div>
                ))}

                {childSchedules.length === 0 && (
                  <div className="p-4 rounded-2xl bg-[#F8F9FD] text-center text-xs text-[#5A5E70]">
                    Siswa belum menyusun jadwal belajar mandiri minggu ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
