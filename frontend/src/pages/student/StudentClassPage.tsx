import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import {
  Plus,
  School,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  X,
} from "@/components/ui/icons";

export default function StudentClassPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    classrooms,
    joinClassroom,
  } = useApp();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinMessage, setJoinMessage] = useState<{ success: boolean; message: string } | null>(null);

  const studentClasses = classrooms.filter((c) =>
    c.studentIds?.map((id) => String(id)).includes(String(currentUser?.id))
  );

  const handleJoin = () => {
    if (!joinCodeInput) return;
    audioSynth.playClickSound();
    const res = joinClassroom(joinCodeInput);
    setJoinMessage(res);
    if (res.success) {
      audioSynth.playSuccessSound();
      setTimeout(() => {
        setJoinModalOpen(false);
        setJoinCodeInput("");
        setJoinMessage(null);
      }, 1200);
    } else {
      audioSynth.playErrorSound();
    }
  };

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-5 min-w-0 flex flex-col gap-5 pb-24 md:pb-8">
          {/* Top Header & Back Action */}
          <div className="flex items-center justify-between">
            <Link
              to="/student"
              onClick={() => audioSynth.playClickSound()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-2xs text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Beranda</span>
            </Link>

            <button
              onClick={() => {
                audioSynth.playClickSound();
                setJoinModalOpen(true);
              }}
              className="clay-btn clay-btn-dark px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gabung Kelas</span>
            </button>
          </div>

          {/* Page Title */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E3DBF8] text-[#4B3B7A]">
                Rombel &amp; Pembelajaran
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#010105]">
              Ruang Kelas Belajar
            </h1>
            <p className="text-xs text-[#5A5E70] font-medium mt-0.5">
              Pilih kelas untuk mengakses materi, pengumuman, dan tugas kurikulum.
            </p>
          </div>

          {/* ========================================================= */}
          {/* 1. DAFTAR KELAS (Clickable Cards to Detail)              */}
          {/* ========================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9195A8]">
                Kelas Terdaftar ({studentClasses.length})
              </h2>
            </div>

            {studentClasses.length === 0 ? (
              <div className="clay-card bg-white p-8 rounded-3xl border border-black/5 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center mx-auto shadow-2xs">
                  <School className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-[#1C1E26]">Belum Ada Kelas Terdaftar</h3>
                <p className="text-xs text-[#5A5E70] max-w-sm mx-auto">
                  Kamu belum bergabung ke dalam kelas manapun. Masukkan 6-digit kode kelas dari gurumu untuk mulai belajar.
                </p>
                <button
                  onClick={() => {
                    audioSynth.playClickSound();
                    setJoinModalOpen(true);
                  }}
                  className="clay-btn clay-btn-dark px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs cursor-pointer mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gabung Kelas Pertama</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {studentClasses.map((cls, idx) => {
                  const isFirst = idx === 0;
                  return (
                    <div
                      key={cls.id}
                      onClick={() => {
                        audioSynth.playClickSound();
                        navigate(`/student/class/${cls.id}`);
                      }}
                      className={`clay-card p-4 sm:p-5 text-[#1C1E26] space-y-3.5 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                        isFirst ? "clay-lavender border-[#4B3B7A]/20" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                              isFirst ? "bg-white text-[#4B3B7A]" : "clay-card clay-sky text-[#21518A]"
                            }`}
                          >
                            <School className="w-6 h-6" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-full bg-white/90 text-[#4B3B7A] text-[10px] font-extrabold font-mono border border-[rgba(28,30,38,0.06)]">
                                KODE: {cls.joinCode}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D] text-[10px] font-extrabold">
                                Kelas {cls.grade}-A
                              </span>
                            </div>

                            <h3 className="text-sm sm:text-base font-black text-[#010105] truncate">
                              {cls.name}
                            </h3>
                            <p className="text-xs text-[#5A5E70] font-medium flex items-center gap-1 mt-0.5">
                              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Pengajar: {cls.teacherName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 p-1.5 rounded-full bg-black/5 text-[#5A5E70]">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Class Meta Metrics Bar */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 text-center text-xs">
                        <div className="bg-white/70 p-2 rounded-xl border border-[rgba(28,30,38,0.04)]">
                          <span className="font-black text-[#010105] block">
                            {cls.documentsCount || 0} Modul
                          </span>
                          <span className="text-[10px] text-[#5A5E70] font-medium">
                            Materi Belajar
                          </span>
                        </div>

                        <div className="bg-white/70 p-2 rounded-xl border border-[rgba(28,30,38,0.04)]">
                          <span className="font-black text-[#010105] block">
                            {cls.tasksCount || 0} Aktivitas
                          </span>
                          <span className="text-[10px] text-[#5A5E70] font-medium">
                            Tugas &amp; Kuis
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Callout */}
                      <div className="flex items-center justify-between text-xs font-bold text-[#4B3B7A] pt-1">
                        <span className="flex items-center gap-1 text-[11px]">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Buka Ruang Belajar</span>
                        </span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-mono border border-black/5">
                          Masuk &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* INSTANT CLAY JOIN CLASS MODAL */}
      {joinModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4"
          onClick={() => setJoinModalOpen(false)}
        >
          <div
            className="clay-card bg-white rounded-[26px] p-5 sm:p-6 border border-white max-w-xs sm:max-w-sm w-full shadow-[0_12px_28px_rgba(28,30,38,0.08),inset_2px_2px_4px_#fff,inset_-2px_-2px_5px_rgba(0,0,0,0.03)] flex flex-col gap-3 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setJoinModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[#5A5E70] clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-base font-black text-[#1C1E26]">
                Gabung Kelas Baru
              </h3>
              <p className="text-xs text-[#5A5E70] mt-0.5">
                Masukkan 6-digit kode kelas dari guru (misal: UDU802 atau MAT714).
              </p>
            </div>

            <div className="space-y-2.5 my-1">
              <div className="p-1 rounded-2xl bg-[#F7F6FA] border border-white shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.04)]">
                <input
                  type="text"
                  placeholder="CONTOH: UDU802"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full font-mono text-center tracking-widest text-base font-black uppercase rounded-xl h-11 bg-transparent border-0 outline-none text-[#1C1E26]"
                  maxLength={6}
                  autoFocus
                />
              </div>
              {joinMessage && (
                <p
                  className={`text-xs font-bold text-center ${
                    joinMessage.success ? "text-[#1D5E4D]" : "text-[#852C28]"
                  }`}
                >
                  {joinMessage.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
              <button
                onClick={() => setJoinModalOpen(false)}
                className="clay-pill bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] px-4 py-2 text-xs font-extrabold cursor-pointer transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleJoin}
                className="clay-btn clay-btn-dark px-4 py-2 text-xs font-extrabold text-white cursor-pointer shadow-sm active:scale-95"
              >
                Gabung Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
