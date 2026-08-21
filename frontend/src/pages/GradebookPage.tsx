import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import TeacherSidebar from "@/components/layout/TeacherSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
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
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19]">
      <Navbar />

      <div className="flex">
        <TeacherSidebar />

        <main className="flex-1 p-6 sm:p-10 max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="mint" className="text-xs">
                  Buku Nilai &amp; Analitik DDA
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-[#010105]">
                Gradebook &amp; Live Classroom Analytics
              </h1>
              <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-0.5">
                Pantau sebaran tingkat penguasaan kompetensi DDA seluruh siswa, deteksi dini siswa butuh bimbingan, dan terbitkan kredensial blockchain massal.
              </p>
            </div>

            <Button
              onClick={handleBatchMint}
              disabled={isBatchMinting}
              variant="primary"
              className="font-bold shadow-xs self-start sm:self-auto"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {isBatchMinting ? "Memproses Minting..." : "Batch Minting Paspor Kelas"}
            </Button>
          </div>

          {batchMintSuccess && (
            <div className="p-4 rounded-3xl bg-[#D1EBE1] border border-[rgba(29,94,77,0.25)] flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1D5E4D]">
                <CheckCircle2 className="w-4 h-4" /> Seluruh sertifikat siswa kelas 10-A berhasil diterbitkan dan dicatat ke dalam ledger blockchain.
              </div>
              <Badge variant="mint">Minted</Badge>
            </div>
          )}

          {/* DDA DISTRIBUTION CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase">Basic Level</span>
              <p className="text-2xl font-bold text-[#010105]">1 Siswa</p>
              <span className="text-[10px] text-[#ba1a1a] font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Perlu Intervensi
              </span>
            </Card>

            <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase">Medium Level</span>
              <p className="text-2xl font-bold text-[#010105]">1 Siswa</p>
              <span className="text-[10px] text-[#785308] font-semibold">Progres Stabil</span>
            </Card>

            <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase">Challenging Level</span>
              <p className="text-2xl font-bold text-[#010105]">1 Siswa</p>
              <span className="text-[10px] text-[#4B3B7A] font-semibold">Akselerasi Baik</span>
            </Card>

            <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-1">
              <span className="text-xs font-bold text-[#9195A8] uppercase">Mastery Level</span>
              <p className="text-2xl font-bold text-[#010105]">2 Siswa</p>
              <span className="text-[10px] text-[#1D5E4D] font-semibold">Siap Pengayaan</span>
            </Card>
          </section>

          {/* STUDENT GRADEBOOK TABLE */}
          <Card className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-[#010105]">
                Daftar Nilai &amp; Profil Kognitif Siswa
              </h2>
              <Badge variant="slate" className="text-xs">
                Kelas 10-A
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-[rgba(28,30,38,0.06)] text-[#9195A8] uppercase text-[10px]">
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
                      <tr key={st.id} className="hover:bg-[#FBF9F4]/60 transition-colors">
                        <td className="py-4 font-bold text-[#010105] flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#E0DAF5] text-[#4B3B7A] flex items-center justify-center font-bold">
                            {st.avatar}
                          </div>
                          <span>{st.name}</span>
                        </td>

                        <td className="py-4">
                          <Badge
                            variant={
                              st.learningStyle === "VISUAL"
                                ? "mint"
                                : st.learningStyle === "AUDITORI"
                                ? "lavender"
                                : "butter"
                            }
                            className="text-[10px]"
                          >
                            {st.learningStyle}
                          </Badge>
                        </td>

                        <td className="py-4">
                          <Badge
                            variant={
                              st.currentDDALevel === "CHALLENGING"
                                ? "lavender"
                                : st.currentDDALevel === "BASIC"
                                ? "coral"
                                : "mint"
                            }
                            className="text-[10px]"
                          >
                            {st.currentDDALevel}
                          </Badge>
                        </td>

                        <td className="py-4 font-semibold text-[#5A5E70]">
                          {st.xpTotal} XP • {st.streakDays} Hari
                        </td>

                        <td className="py-4">
                          {hasCert ? (
                            <span className="text-[#1D5E4D] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Minted
                            </span>
                          ) : (
                            <span className="text-[#785308] font-bold">
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
          </Card>
        </main>
      </div>
    </div>
  );
}
