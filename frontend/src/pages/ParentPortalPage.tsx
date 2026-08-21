import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Progress } from "@/components/ui/progress";
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

  const childSchedules = learningSchedules.filter(
    (s) => s.studentId === selectedChild.id
  );

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] pb-32">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Header & Child Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="clay-pill clay-mint px-3 py-0.5 text-xs font-extrabold text-[#1D5E4D]">
                Portal Pemantauan Orang Tua
              </span>
              <span className="clay-pill clay-lavender px-3 py-0.5 text-xs font-bold text-[#4B3B7A]">
                Laporan Terpadu
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#010105] tracking-tight">
              Perkembangan Belajar &amp; Kognitif Anak
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-1">
              Pantau kemajuan topik kurikulum, kebiasaan belajar mandiri, dan komunikasi langsung dengan wali kelas.
            </p>
          </div>

          {/* Child Switcher Pills */}
          <div className="clay-pill clay-white p-1.5 flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs font-bold text-[#5A5E70] pl-2">Pilih Anak:</span>
            <button
              onClick={() => {
                audioSynth.playClickSound();
                setSelectedChildId("user_ayu_01");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                selectedChildId === "user_ayu_01"
                  ? "clay-btn clay-btn-dark text-white font-black"
                  : "clay-pill clay-white text-[#5A5E70] hover:text-[#010105]"
              }`}
            >
              Ayu Lestari (10-A)
            </button>
            <button
              onClick={() => {
                audioSynth.playClickSound();
                setSelectedChildId("user_budi_02");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                selectedChildId === "user_budi_02"
                  ? "clay-btn clay-btn-dark text-white font-black"
                  : "clay-pill clay-white text-[#5A5E70] hover:text-[#010105]"
              }`}
            >
              Budi Pratama (10-A)
            </button>
          </div>
        </div>

        {/* 1. AI NARRATIVE PROGRESS SUMMARY (Clay Card Mint) */}
        <div className="clay-card clay-mint p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-2 text-[#1D5E4D]">
            <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#1D5E4D]" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#124B3D]">
              Ringkasan Naratif AI untuk Orang Tua
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#0E3D31] font-medium leading-relaxed">
            Minggu ini, <strong>{selectedChild.name}</strong> menunjukkan penguasaan sangat baik pada topik <em>Fisiologi Sistem Pencernaan &amp; Enzim</em> dengan akurasi kuis <strong>82%</strong> dan modalitas dominan <strong>Visual ({selectedChild.modalityScores?.visual || 80}%)</strong>. Rekomendasi: Berikan apresiasi atas konsistensi belajar mandiri selama {selectedChild.streakDays || 14} hari berturut-turut.
          </p>
        </div>

        {/* 2. TOPIC MASTERY & DIGITAL WELLBEING (Desktop 2-Column Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topic Competency Progress */}
          <div className="clay-card clay-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#010105] flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#4B3B7A]" />
                <span>Penguasaan Topik Kurikulum</span>
              </h3>
              <span className="clay-pill clay-lavender text-[10px] font-extrabold px-2.5 py-0.5 text-[#4B3B7A]">
                Kurikulum 2026
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Biologi: Sistem Pencernaan &amp; Enzim</span>
                  <span className="text-[#1D5E4D]">95% (Mastery)</span>
                </div>
                <div className="w-full bg-[#EBF6F2] h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-[#1D5E4D] h-full rounded-full w-[95%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Biologi: Ekosistem &amp; Daur Energi</span>
                  <span className="text-[#4B3B7A]">78% (Challenging)</span>
                </div>
                <div className="w-full bg-[#EBF6F2] h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-[#4B3B7A] h-full rounded-full w-[78%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
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
          <div className="clay-card clay-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#010105] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1D5E4D]" />
                <span>Pola Waktu Belajar vs Istirahat</span>
              </h3>
              <span className="clay-pill clay-mint text-[10px] font-extrabold px-2.5 py-0.5 text-[#1D5E4D]">
                Digital Wellbeing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="clay-pill bg-[#F8F9FD] p-4">
                <span className="text-xs text-[#5A5E70] font-bold block">Rata-rata Harian</span>
                <span className="text-2xl font-black text-[#010105] mt-1 block">42 Menit</span>
                <span className="text-[10px] text-[#1D5E4D] font-bold">Optimal untuk Siswa</span>
              </div>
              <div className="clay-pill bg-[#F8F9FD] p-4">
                <span className="text-xs text-[#5A5E70] font-bold block">Status Wellbeing</span>
                <span className="text-2xl font-black text-[#1D5E4D] mt-1 block">Seimbang</span>
                <span className="text-[10px] text-[#5A5E70] font-bold">Jeda Istirahat Cukup</span>
              </div>
            </div>

            <p className="text-[11px] text-[#5A5E70] font-medium leading-relaxed">
              Sistem AI merekomendasikan jeda 10 menit setiap 30 menit sesi kuis intensif untuk menjaga daya ingat jangka panjang.
            </p>
          </div>
        </section>

        {/* 3. LEARNING SCHEDULE PLAN CREATED BY CHILD */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#010105] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4B3B7A]" />
              <span>Jadwal Belajar Mandiri yang Dibuat {selectedChild.name}</span>
            </h3>
            <span className="clay-pill clay-lavender text-[10px] font-extrabold px-3 py-1 text-[#4B3B7A]">
              {childSchedules.filter((s) => s.completed).length}/{childSchedules.length} Target Tuntas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {childSchedules.map((sch) => (
              <div
                key={sch.id}
                className={`clay-card clay-card-hover p-4.5 space-y-2 ${
                  sch.completed ? "bg-[#F8F9FD] opacity-75" : "clay-white"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="clay-pill clay-lavender text-[10px] font-extrabold px-2.5 py-0.5 text-[#4B3B7A]">
                    {sch.day} • {sch.time}
                  </span>
                  {sch.completed && (
                    <span className="clay-pill clay-mint text-[9px] font-extrabold text-[#1D5E4D] px-2 py-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Selesai
                    </span>
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-black text-[#010105] line-clamp-2">
                  {sch.title}
                </h4>
                <span className="text-[10px] text-[#5A5E70] font-bold block">
                  Format: {sch.format} ({sch.duration})
                </span>
              </div>
            ))}

            {childSchedules.length === 0 && (
              <div className="clay-card clay-white p-6 text-center text-xs text-[#5A5E70] col-span-full">
                Siswa belum menyusun jadwal belajar mandiri minggu ini.
              </div>
            )}
          </div>
        </section>

        {/* 4. PARENT-TEACHER CONSULTATION NOTES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#010105] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#010105]" />
              <span>Konsultasi &amp; Catatan dengan Wali Kelas</span>
            </h3>
            <span className="clay-pill clay-white text-[10px] font-bold text-[#5A5E70] px-3 py-1">
              Wali Kelas: Bpk. Gunawan, M.Pd.
            </span>
          </div>

          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="clay-card clay-white p-5 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-black text-[#010105] block">
                      {note.senderName}
                    </span>
                    <span className="text-[10px] text-[#9195A8] font-semibold">
                      Siswa: {note.studentName}
                    </span>
                  </div>
                  <span className="clay-pill bg-[#F8F9FD] text-[10px] font-bold text-[#5A5E70] px-2.5 py-0.5">
                    Terkirim
                  </span>
                </div>
                <p className="text-xs text-[#5A5E70] font-medium bg-[#F8F9FD] p-3.5 rounded-2xl">
                  {note.message}
                </p>

                {note.reply && (
                  <div className="clay-card clay-lavender p-3.5 space-y-1">
                    <span className="text-[10px] font-black text-[#4B3B7A] uppercase block">
                      Balasan dari {note.receiverName}:
                    </span>
                    <p className="text-xs text-[#3C2D68] font-medium leading-relaxed">
                      {note.reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Send Note Input in Clay Card */}
          <div className="clay-card clay-white p-5 space-y-3">
            <textarea
              rows={3}
              placeholder="Tulis pesan atau pertanyaan perkembangan anak kepada wali kelas..."
              value={noteMessage}
              onChange={(e) => setNoteMessage(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-[rgba(28,30,38,0.08)] bg-[#F8F9FD] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1C1E26]"
            />
            <div className="flex justify-between items-center">
              {noteSentSuccess && (
                <span className="clay-pill clay-mint px-3 py-1 text-xs font-black text-[#1D5E4D] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pesan berhasil dikirim ke wali kelas
                </span>
              )}
              <button
                onClick={handleSendNote}
                disabled={!noteMessage.trim()}
                className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black ml-auto flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Catatan ke Guru</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
