import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";
import {
  verifyCertificateIntegrity,
  VerificationResult,
} from "@/services/blockchainVault";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
} from "@/components/ui/icons";

export default function PublicVerifyPage() {
  const { credentials } = useApp();

  const [queryCertId, setQueryCertId] = useState("KOG-2026-BIO-X7A9");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Tamper Sandbox Testing State
  const [tamperedScore, setTamperedScore] = useState<number>(95);
  const [isTamperSimActive, setIsTamperSimActive] = useState(false);

  const matchedCert = credentials.find(
    (c) =>
      c.certificateId.toLowerCase() === queryCertId.trim().toLowerCase() ||
      c.transactionId.toLowerCase() === queryCertId.trim().toLowerCase()
  );

  const handleVerify = async (simulatedScore?: number) => {
    if (!matchedCert) {
      setVerificationResult({
        isValid: false,
        isTampered: false,
        computedHash: "",
        recordedHash: "",
        storedHash: "",
        tamperReason: "ID Sertifikat atau TxID tidak ditemukan di node buku besar Merkle.",
      });
      audioSynth.playErrorSound();
      return;
    }

    setIsVerifying(true);
    audioSynth.playClickSound();

    setTimeout(async () => {
      const result = await verifyCertificateIntegrity(matchedCert, simulatedScore);
      setVerificationResult(result);
      setIsVerifying(false);

      if (result.isValid) {
        audioSynth.playLevelUpSound();
        confetti({ particleCount: 70, spread: 60 });
      } else {
        audioSynth.playErrorSound();
      }
    }, 600);
  };

  useEffect(() => {
    handleVerify();
  }, [queryCertId]);

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] selection:bg-[#FADFAD] pb-24">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D] text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Independent Public Cryptographic Verifier</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-[#010105]">
            Verifikasi Kredensial Blockchain
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5E70] font-medium max-w-xl mx-auto leading-relaxed">
            Periksa keaslian rekam jejak akademik siswa langsung terhadap SHA-256 Merkle chain. Sistem secara otomatis mendeteksi jika data atau nilai telah dimanipulasi.
          </p>
        </div>

        {/* SEARCH BAR */}
        <Card className="p-4 bg-white rounded-3xl border border-[rgba(28,30,38,0.08)] shadow-xs">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9195A8] absolute left-3.5 top-3" />
              <Input
                value={queryCertId}
                onChange={(e) => setQueryCertId(e.target.value)}
                placeholder="Masukkan ID Sertifikat (cth: KOG-2026-BIO-X7A9) atau TxID..."
                className="pl-10 text-xs sm:text-sm"
              />
            </div>
            <Button
              onClick={() => handleVerify(isTamperSimActive ? tamperedScore : undefined)}
              disabled={isVerifying}
              variant="primary"
              className="font-bold text-xs shrink-0"
            >
              {isVerifying ? "Menghitung Hash..." : "Verifikasi Sekarang"}
            </Button>
          </div>
        </Card>

        {/* VERIFICATION RESULT PANEL */}
        {verificationResult && (
          <div className="space-y-6 animate-in fade-in">
            {verificationResult.isValid ? (
              /* VALID CARD */
              <Card className="p-6 sm:p-8 bg-[#D1EBE1] rounded-3xl border-2 border-[#1D5E4D] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(29,94,77,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#1D5E4D] shadow-xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <Badge variant="white" className="text-[10px] mb-1">
                        Cryptographically Authentic
                      </Badge>
                      <h2 className="text-xl font-bold text-[#010105]">
                        Sertifikat Terverifikasi Asli &amp; Valid
                      </h2>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-[#1D5E4D] bg-white px-3 py-1.5 rounded-full self-start sm:self-auto">
                    Blok #{matchedCert?.blockIndex} • 100% Cocok
                  </span>
                </div>

                {/* Candidate & Subject Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Nama Pemilik</span>
                    <span className="text-sm font-bold text-[#010105]">{matchedCert?.studentName}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Kompetensi</span>
                    <span className="text-sm font-bold text-[#010105]">{matchedCert?.competencyTitle}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Nilai Capaian</span>
                    <span className="text-sm font-extrabold text-[#1D5E4D]">{matchedCert?.score}%</span>
                  </div>
                </div>

                {/* Cryptographic Comparison */}
                <div className="p-4 rounded-2xl bg-white font-mono text-xs space-y-2 border border-[rgba(29,94,77,0.15)]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Stored Block Hash</span>
                    <span className="text-[#010105] break-all">{verificationResult.recordedHash}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Recomputed SHA-256 Hash</span>
                    <span className="text-[#1D5E4D] font-bold break-all">{verificationResult.computedHash}</span>
                  </div>
                </div>
              </Card>
            ) : (
              /* TAMPERED / INVALID CARD */
              <Card className="p-6 sm:p-8 bg-[#FCD9D7] rounded-3xl border-2 border-[#852C28] shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[rgba(133,44,40,0.2)]">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#852C28] shadow-xs">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <Badge variant="coral" className="text-[10px] mb-1">
                      Manipulasi Kredensial Terdeteksi
                    </Badge>
                    <h2 className="text-xl font-bold text-[#852C28]">
                      Integritas Data Gagal (Kredensial Tidak Valid)
                    </h2>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white text-xs font-semibold text-[#852C28] space-y-1">
                  <p className="font-bold">Alasan Penolakan Kriptografis:</p>
                  <p className="text-[#5A5E70]">{verificationResult.tamperReason}</p>
                </div>

                {verificationResult.isTampered && (
                  <div className="p-4 rounded-2xl bg-white font-mono text-xs space-y-2 border border-[rgba(133,44,40,0.15)]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Stored Hash</span>
                      <span className="text-[#5A5E70] break-all">{verificationResult.recordedHash}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#852C28] block">Hash Baru Hasil Perubahan Data</span>
                      <span className="text-[#852C28] font-bold break-all">{verificationResult.computedHash}</span>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* TAMPER SIMULATION SANDBOX */}
        {matchedCert && (
          <Card className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#010105]">
                  Sandbox Pengujian Anti-Manipulasi (Zero-Tamper Proof)
                </h3>
                <p className="text-xs text-[#5A5E70]">
                  Uji coba mengubah nilai asli ({matchedCert.score}%) untuk membuktikan deteksi SHA-256 secara langsung.
                </p>
              </div>

              <Button
                onClick={() => {
                  const nextActive = !isTamperSimActive;
                  setIsTamperSimActive(nextActive);
                  handleVerify(nextActive ? tamperedScore : undefined);
                }}
                variant={isTamperSimActive ? "primary" : "outline"}
                size="sm"
                className="text-xs font-bold shrink-0"
              >
                {isTamperSimActive ? "Mode Simulasi Aktif" : "Aktifkan Simulasi Manipulasi"}
              </Button>
            </div>

            {isTamperSimActive && (
              <div className="p-4 rounded-2xl bg-[#FBF9F4] border border-[rgba(28,30,38,0.06)] space-y-3 animate-in fade-in">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-bold text-[#010105]">
                    Ubah Nilai Simulasi:
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={tamperedScore}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTamperedScore(val);
                      handleVerify(val);
                    }}
                    className="flex-1 accent-[#1C1E26]"
                  />
                  <span className="w-12 text-center text-sm font-bold text-[#010105]">
                    {tamperedScore}%
                  </span>
                </div>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
