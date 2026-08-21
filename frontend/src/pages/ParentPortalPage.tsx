import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] pb-32">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Header & Child Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="mint" className="text-xs">
                Portal Pemantauan Orang Tua
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#010105]">
              Perkembangan Belajar &amp; Kognitif
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-0.5">
              Pantau kemajuan topik kurikulum, kebiasaan belajar, dan komunikasi dengan guru.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1.5 rounded-full border border-[rgba(28,30,38,0.06)] shadow-xs self-start sm:self-auto">
            <span className="text-xs font-bold text-[#5A5E70] pl-2">Siswa:</span>
            <button
              onClick={() => setSelectedChildId("user_ayu_01")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedChildId === "user_ayu_01"
                  ? "bg-[#1C1E26] text-white shadow-xs"
                  : "text-[#5A5E70] hover:text-[#010105]"
              }`}
            >
              Ayu Lestari
            </button>
            <button
              onClick={() => setSelectedChildId("user_budi_02")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedChildId === "user_budi_02"
                  ? "bg-[#1C1E26] text-white shadow-xs"
                  : "text-[#5A5E70] hover:text-[#010105]"
              }`}
            >
              Budi Pratama
            </button>
          </div>
        </div>

        {/* 1. AI NARRATIVE PROGRESS SUMMARY */}
        <Card className="p-6 bg-[#D1EBE1] rounded-3xl border border-[rgba(29,94,77,0.2)] space-y-3">
          <div className="flex items-center gap-2 text-[#1D5E4D]">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Ringkasan Naratif AI untuk Orang Tua
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#1D5E4D] font-medium leading-relaxed">
            Minggu ini, <strong>{selectedChild.name}</strong> menunjukkan penguasaan sangat baik pada topik <em>Fisiologi Sistem Pencernaan</em> dengan akurasi kuis <strong>95%</strong> dan modalitas dominan <strong>Visual ({selectedChild.modalityScores?.visual || 80}%)</strong>. Rekomendasi: Berikan apresiasi atas konsistensi belajar mandiri selama 14 hari berturut-turut.
          </p>
        </Card>

        {/* 2. KNOWLEDGE MAP RADAR & COMPETENCY */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#010105] flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#4B3B7A]" /> Penguasaan Topik Kurikulum
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Biologi: Sistem Pencernaan</span>
                  <span className="text-[#1D5E4D]">95% (Mastery)</span>
                </div>
                <Progress value={95} indicatorColor="bg-[#1D5E4D]" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Biologi: Ekosistem &amp; Daur Energi</span>
                  <span className="text-[#4B3B7A]">78% (Challenging)</span>
                </div>
                <Progress value={78} indicatorColor="bg-[#4B3B7A]" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-[#010105] mb-1">
                  <span>Matematika: Aljabar Pecahan</span>
                  <span className="text-[#785308]">65% (Perlu Penguatan)</span>
                </div>
                <Progress value={65} indicatorColor="bg-[#785308]" />
              </div>
            </div>
          </Card>

          {/* 3. DIGITAL WELLBEING TRACKER */}
          <Card className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#010105] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1D5E4D]" /> Pola Waktu Belajar vs Istirahat
            </h3>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-[#FBF9F4]">
                <span className="text-xs text-[#5A5E70] font-bold block">Rata-rata Harian</span>
                <span className="text-xl font-extrabold text-[#010105] mt-1 block">42 Menit</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FBF9F4]">
                <span className="text-xs text-[#5A5E70] font-bold block">Status Wellbeing</span>
                <span className="text-xl font-extrabold text-[#1D5E4D] mt-1 block">Seimbang</span>
              </div>
            </div>

            <p className="text-[11px] text-[#5A5E70] font-medium">
              Sistem AI merekomendasikan jeda 10 menit setiap 30 menit sesi kuis intensif.
            </p>
          </Card>
        </section>

        {/* 4. LEARNING SCHEDULE PLAN CREATED BY CHILD */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#010105] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4B3B7A]" /> Jadwal Belajar Mandiri yang Dibuat {selectedChild.name}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
              Komitmen Mandiri
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {learningSchedules
              .filter((s) => s.studentId === selectedChild.id)
              .map((sch) => (
                <Card
                  key={sch.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    sch.completed
                      ? "bg-[#F8F9FD] border-[rgba(28,30,38,0.06)] opacity-75"
                      : "bg-white border-[#E3DBF8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
                      {sch.day} • {sch.time}
                    </span>
                    {sch.completed && (
                      <span className="text-[9px] font-bold text-[#1D5E4D] flex items-center gap-0.5 bg-[#D1EBE1] px-1.5 py-0.5 rounded-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> Selesai
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[#010105] mt-1 line-clamp-2">
                    {sch.title}
                  </h4>
                  <span className="text-[10px] text-[#5A5E70] mt-1 block">
                    Format: {sch.format} ({sch.duration})
                  </span>
                </Card>
              ))}
          </div>
        </section>

        {/* 5. PARENT-TEACHER CONSULTATION NOTES */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-[#010105] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#010105]" /> Konsultasi &amp; Catatan dengan Wali Kelas
          </h3>

          <div className="space-y-3">
            {notes.map((note) => (
              <Card key={note.id} className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-[#010105] block">{note.senderName}</span>
                    <span className="text-[10px] text-[#9195A8]">Siswa: {note.studentName}</span>
                  </div>
                  <Badge variant="slate" className="text-[10px]">Terkirim</Badge>
                </div>
                <p className="text-xs text-[#5A5E70] font-medium bg-[#FBF9F4] p-3 rounded-2xl">
                  {note.message}
                </p>

                {note.reply && (
                  <div className="p-3 rounded-2xl bg-[#E0DAF5] border border-[rgba(75,59,122,0.15)] space-y-1">
                    <span className="text-[10px] font-bold text-[#4B3B7A] uppercase block">
                      Balasan dari {note.receiverName}:
                    </span>
                    <p className="text-xs text-[#4B3B7A] font-medium">{note.reply}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Send Note Input */}
          <Card className="p-4 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3">
            <textarea
              rows={3}
              placeholder="Tulis pesan atau pertanyaan perkembangan anak kepada wali kelas..."
              value={noteMessage}
              onChange={(e) => setNoteMessage(e.target.value)}
              className="w-full p-3 rounded-2xl border border-[rgba(28,30,38,0.08)] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1C1E26]"
            />
            <div className="flex justify-between items-center">
              {noteSentSuccess && (
                <span className="text-xs font-bold text-[#1D5E4D] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pesan berhasil dikirim ke guru
                </span>
              )}
              <Button
                onClick={handleSendNote}
                disabled={!noteMessage.trim()}
                variant="primary"
                size="sm"
                className="font-bold ml-auto"
              >
                <Send className="w-3.5 h-3.5 mr-1" /> Kirim Catatan
              </Button>
            </div>
          </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
