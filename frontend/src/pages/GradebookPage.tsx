import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  Flame,
  Award,
  Sparkles,
} from "@/components/ui/icons";

export default function GradebookPage() {
  const { users, credentials } = useApp();

  const [isBatchMinting, setIsBatchMinting] = useState(false);
  const [batchMintSuccess, setBatchMintSuccess] = useState(false);

  const students = users.filter((u) => u.role === "SISWA");

  const handleBatchMint = () => {
    setIsBatchMinting(true);
    audioSynth.playClickSound();

    setTimeout(() => {
      setIsBatchMinting(false);
      setBatchMintSuccess(true);
      audioSynth.playLevelUpSound();
      confetti({ particleCount: 90, spread: 70 });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26]">
      <Navbar />

      <div className="flex">
        <TeacherSidebar />

        <main className="flex-1 p-6 sm:p-10 max-w-7xl space-y-8 overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="clay-pill clay-mint px-3 py-0.5 text-xs font-extrabold text-[#1D5E4D]">
                  Buku Nilai &amp; Analitik DDA
                </span>
                <span className="clay-pill clay-lavender px-3 py-0.5 text-xs font-bold text-[#4B3B7A]">
                  Smart Contract Blockchain
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#010105] tracking-tight">
                Gradebook &amp; Live Classroom Analytics
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-1">
                Pantau sebaran tingkat penguasaan kompetensi DDA seluruh siswa, deteksi dini siswa butuh bimbingan, dan terbitkan kredensial blockchain massal.
              </p>
            </div>

            <button
              onClick={handleBatchMint}
              disabled={isBatchMinting}
              className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isBatchMinting ? "Memproses Minting..." : "Batch Minting Paspor Kelas"}</span>
            </button>
          </div>

          {batchMintSuccess && (
            <div className="clay-card clay-mint p-4 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-black text-[#1D5E4D]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Seluruh sertifikat siswa kelas 10-A berhasil diterbitkan dan dicatat ke dalam ledger blockchain.</span>
              </div>
              <span className="clay-pill clay-white px-3 py-0.5 text-xs font-extrabold text-[#1D5E4D]">
                Minted
              </span>
            </div>
          )}

          {/* DDA DISTRIBUTION CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="clay-card clay-card-hover clay-white p-5 space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase tracking-wider">
                Basic Level
              </span>
              <p className="text-2xl font-black text-[#010105]">1 Siswa</p>
              <span className="clay-pill clay-coral text-[10px] text-[#7A2420] font-bold px-2 py-0.5 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Perlu Bimbingan
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase tracking-wider">
                Medium Level
              </span>
              <p className="text-2xl font-black text-[#010105]">1 Siswa</p>
              <span className="clay-pill clay-butter text-[10px] text-[#694503] font-bold px-2 py-0.5 inline-block">
                Progres Stabil
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase tracking-wider">
                Challenging Level
              </span>
              <p className="text-2xl font-black text-[#010105]">1 Siswa</p>
              <span className="clay-pill clay-lavender text-[10px] text-[#4B3B7A] font-bold px-2 py-0.5 inline-block">
                Akselerasi Baik
              </span>
            </div>

            <div className="clay-card clay-card-hover clay-white p-5 space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase tracking-wider">
                Mastery Level
              </span>
              <p className="text-2xl font-black text-[#010105]">2 Siswa</p>
              <span className="clay-pill clay-mint text-[10px] text-[#1D5E4D] font-bold px-2 py-0.5 inline-block">
                Siap Pengayaan
              </span>
            </div>
          </section>

          {/* STUDENT GRADEBOOK TABLE */}
          <div className="clay-card clay-white p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-[#010105]">
                  Daftar Nilai &amp; Profil Kognitif Siswa
                </h2>
                <p className="text-xs text-[#5A5E70]">
                  Pemetaan modalitas belajar dan histori penguasaan topik DDA.
                </p>
              </div>
              <span className="clay-pill clay-lavender px-3 py-1 text-xs font-extrabold text-[#4B3B7A]">
                Kelas 10-A
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-[rgba(28,30,38,0.06)] text-[#9195A8] uppercase text-[10px] font-black">
                    <th className="pb-3">Nama Siswa</th>
                    <th className="pb-3">Modalitas Dominan</th>
                    <th className="pb-3">Level DDA</th>
                    <th className="pb-3">XP &amp; Streak</th>
                    <th className="pb-3">Status Kredensial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(28,30,38,0.06)]">
                  {students.map((st) => {
                    const hasCert = credentials.some((c) => c.studentId === st.id);

                    return (
                      <tr key={st.id} className="hover:bg-[#F8F9FD] transition-colors">
                        <td className="py-4 font-black text-[#010105] flex items-center gap-3">
                          <div className="clay-card clay-lavender w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-[#4B3B7A] shrink-0">
                            {st.avatar}
                          </div>
                          <span>{st.name}</span>
                        </td>

                        <td className="py-4">
                          <span
                            className={`clay-pill text-[10px] font-extrabold px-2.5 py-0.5 ${
                              st.learningStyle === "VISUAL"
                                ? "clay-mint text-[#1D5E4D]"
                                : st.learningStyle === "AUDITORI"
                                ? "clay-lavender text-[#4B3B7A]"
                                : "clay-butter text-[#785308]"
                            }`}
                          >
                            {st.learningStyle}
                          </span>
                        </td>

                        <td className="py-4">
                          <span
                            className={`clay-pill text-[10px] font-extrabold px-2.5 py-0.5 ${
                              st.currentDDALevel === "CHALLENGING"
                                ? "clay-lavender text-[#4B3B7A]"
                                : st.currentDDALevel === "BASIC"
                                ? "clay-coral text-[#7A2420]"
                                : "clay-mint text-[#1D5E4D]"
                            }`}
                          >
                            {st.currentDDALevel}
                          </span>
                        </td>

                        <td className="py-4 font-bold text-[#5A5E70]">
                          {st.xpTotal} XP • {st.streakDays} Hari
                        </td>

                        <td className="py-4">
                          {hasCert ? (
                            <span className="clay-pill clay-mint text-[10px] font-extrabold px-2.5 py-0.5 text-[#1D5E4D] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Minted
                            </span>
                          ) : (
                            <span className="clay-pill clay-butter text-[10px] font-extrabold px-2.5 py-0.5 text-[#785308] inline-block">
                              Ready to Mint
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
