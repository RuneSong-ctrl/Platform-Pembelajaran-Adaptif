import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { audioSynth } from "@/services/audioSynth";
import {
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  ArrowLeft,
} from "@/components/ui/icons";

export default function StudentPassportPage() {
  const navigate = useNavigate();
  const { currentUser, credentials } = useApp();
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const studentCreds = credentials.filter((c) => c.studentId === currentUser.id);

  const handleCopyTx = (tx: string) => {
    audioSynth.playClickSound();
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] pb-32">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-6">
        {/* Top Back Navigation */}
        <div>
          <Link
            to="/student"
            onClick={() => audioSynth.playClickSound()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[rgba(28,30,38,0.08)] shadow-[0_4px_12px_rgba(28,30,38,0.04)] text-xs font-bold text-[#5A5E70] hover:text-[#1C1E26] hover:bg-[#F2EFFC] transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke Beranda Siswa</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="mint" className="text-xs">
                SHA-256 Merkle Ledger
              </Badge>
              <Badge variant="lavender" className="text-xs">
                Zero Tamper Proof
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#010105]">
              Blockchain Learning Passport Vault
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5E70] font-medium mt-0.5">
              Portofolio akademik terdesentralisasi milik <strong>{currentUser.name}</strong> yang terkunci secara permanen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/verify")}
              variant="outline"
              size="sm"
              className="text-xs font-bold"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Buka Verifikator Publik
            </Button>
          </div>
        </div>

        {/* Passport Ledger Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs">
            <span className="text-[11px] font-bold text-[#9195A8] uppercase">Total Sertifikat Kredensial</span>
            <p className="text-2xl font-bold text-[#010105] mt-1">{studentCreds.length} Blok</p>
            <p className="text-[11px] text-[#1D5E4D] font-medium mt-1">100% Terverifikasi</p>
          </Card>

          <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs">
            <span className="text-[11px] font-bold text-[#9195A8] uppercase">Rerata Skor Kompetensi</span>
            <p className="text-2xl font-bold text-[#010105] mt-1">
              {studentCreds.length > 0
                ? Math.round(
                    studentCreds.reduce((acc, c) => acc + c.score, 0) / studentCreds.length
                  )
                : 0}
              %
            </p>
            <p className="text-[11px] text-[#4B3B7A] font-medium mt-1">Standar Kelulusan A</p>
          </Card>

          <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs">
            <span className="text-[11px] font-bold text-[#9195A8] uppercase">Status Hash Node</span>
            <p className="text-2xl font-bold text-[#1D5E4D] mt-1">LENGKAP</p>
            <p className="text-[11px] text-[#5A5E70] font-medium mt-1">Merkle Chain Sinkron</p>
          </Card>
        </div>

        {/* Block Credentials List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#010105]">
            Daftar Blok Transaksi Akademik
          </h2>

          {studentCreds.map((cred) => (
            <Card
              key={cred.id}
              className="p-6 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(28,30,38,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D1EBE1] flex items-center justify-center text-[#1D5E4D]">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#010105]">{cred.competencyTitle}</h3>
                    <p className="text-xs text-[#5A5E70] font-medium">
                      {cred.className} • Nilai Capaian: <strong className="text-[#010105]">{cred.score}%</strong>
                    </p>
                  </div>
                </div>

                <Badge variant="mint" className="text-[11px] self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Blok #{cred.blockIndex} Ter-verifikasi
                </Badge>
              </div>

              {/* Cryptographic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FBF9F4] p-4 rounded-2xl border border-[rgba(28,30,38,0.06)] font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9195A8] block">ID Sertifikat</span>
                  <span className="text-[#010105] font-bold">{cred.certificateId}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Penerbit &amp; Otoritas</span>
                  <span className="text-[#010105]">{cred.verifiedBy}</span>
                </div>
                <div className="sm:col-span-2 break-all">
                  <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Block Hash (SHA-256)</span>
                  <span className="text-[#1D5E4D] font-bold">{cred.blockHash}</span>
                </div>
                <div className="sm:col-span-2 break-all">
                  <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Previous Hash</span>
                  <span className="text-[#5A5E70]">{cred.previousHash}</span>
                </div>
                <div className="sm:col-span-2 flex items-center justify-between gap-2 break-all pt-1 border-t border-[rgba(28,30,38,0.06)]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#9195A8] block">Transaction Hash (TxID)</span>
                    <span className="text-[#4B3B7A] font-bold">{cred.transactionId}</span>
                  </div>
                  <button
                    onClick={() => handleCopyTx(cred.transactionId)}
                    className="p-1.5 rounded-xl bg-white border border-[rgba(28,30,38,0.1)] text-[#010105] hover:bg-[#F0EEE9] transition-colors shrink-0 cursor-pointer"
                    title="Salin TxID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {copiedTx === cred.transactionId && (
                <p className="text-[10px] font-bold text-[#1D5E4D] animate-in fade-in">
                  ✓ TxID disalin ke papan klip!
                </p>
              )}
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
