import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { audioSynth } from "@/services/audioSynth";
import { ApiService } from "@/services/apiClient";
import {
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
} from "@/components/ui/icons";

export default function StudentPassportPage() {
  const navigate = useNavigate();
  const { currentUser, credentials } = useApp();
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const studentCreds = credentials.filter((c) => c.studentId === currentUser.id);
  // Hasil verifikasi hash per sertifikat dari backend: true = utuh, false = hash tidak cocok, undefined = belum dicek.
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const credKey = studentCreds.map((c) => c.certificateId).join(",");

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      studentCreds.map((c) =>
        ApiService.verifyCredential(c.certificateId)
          .then((res) => [c.certificateId, Boolean(res?.is_valid)] as const)
          .catch(() => null)
      )
    ).then((results) => {
      if (!cancelled) setVerified(Object.fromEntries(results.filter((x) => x !== null)));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credKey]);

  const total = studentCreds.length;
  const checkedCount = studentCreds.filter((c) => verified[c.certificateId] !== undefined).length;
  const validCount = studentCreds.filter((c) => verified[c.certificateId] === true).length;
  const tamperedCount = checkedCount - validCount;
  const avgScore = total > 0 ? Math.round(studentCreds.reduce((acc, c) => acc + c.score, 0) / total) : null;
  const bestScore = total > 0 ? Math.max(...studentCreds.map((c) => c.score)) : null;
  const latestIssued = studentCreds.map((c) => c.issuedAt).filter(Boolean).sort().at(-1);
  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "–";

  const integrity =
    total === 0
      ? { label: "BELUM ADA", note: "Selesaikan kuis untuk mendapat sertifikat", color: "text-[#9195A8]" }
      : checkedCount < total
      ? { label: "MEMERIKSA…", note: `${checkedCount}/${total} sertifikat dicek`, color: "text-[#5A5E70]" }
      : tamperedCount > 0
      ? { label: `${tamperedCount} BERMASALAH`, note: "Hash tidak cocok dengan ledger", color: "text-[#852C28]" }
      : { label: "UTUH", note: `Terakhir terbit ${formatDate(latestIssued)}`, color: "text-[#1D5E4D]" };

  const handleCopyTx = (tx: string) => {
    audioSynth.playClickSound();
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  return (
    <div className="h-screen bg-[#FBF9F4] text-[#1B1C19] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <StudentSidebar />

      <main className="flex-1 overflow-y-auto min-w-0 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-bold text-[#5A5E70]">
          <Link
            to="/student/profile"
            onClick={() => audioSynth.playClickSound()}
            className="inline-flex items-center gap-1.5 hover:text-[#1C1E26] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Profil
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#1C1E26]" aria-current="page">Paspor Belajar</span>
        </nav>

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
            <span className="text-mini font-bold text-[#9195A8] uppercase">Total Sertifikat Kredensial</span>
            <p className="text-2xl font-bold text-[#010105] mt-1">{total} Sertifikat</p>
            <p className="text-mini text-[#1D5E4D] font-medium mt-1">
              {total === 0 ? "Belum ada kredensial" : `${validCount} dari ${total} terverifikasi`}
            </p>
          </Card>

          <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs">
            <span className="text-mini font-bold text-[#9195A8] uppercase">Rerata Skor Kompetensi</span>
            <p className="text-2xl font-bold text-[#010105] mt-1">
              {avgScore === null ? "–" : `${avgScore}%`}
            </p>
            <p className="text-mini text-[#4B3B7A] font-medium mt-1">
              {bestScore === null ? "Belum ada nilai" : `Skor tertinggi ${bestScore}%`}
            </p>
          </Card>

          <Card className="p-5 bg-white rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs">
            <span className="text-mini font-bold text-[#9195A8] uppercase">Integritas Ledger</span>
            <p className={`text-2xl font-bold mt-1 ${integrity.color}`}>{integrity.label}</p>
            <p className="text-mini text-[#5A5E70] font-medium mt-1">{integrity.note}</p>
          </Card>
        </div>

        {/* Block Credentials List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#010105]">
            Daftar Blok Transaksi Akademik
          </h2>

          {total === 0 && (
            <Card className="p-8 bg-white rounded-3xl border border-dashed border-[rgba(28,30,38,0.12)] text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F0EEF6] text-[#4B3B7A] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#010105]">Belum ada sertifikat</p>
              <p className="text-xs text-[#5A5E70] max-w-sm mx-auto">
                Sertifikat kompetensi otomatis tercatat di sini setelah kamu lulus kuis adaptif di kelasmu.
              </p>
            </Card>
          )}

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
                      {cred.className} • {formatDate(cred.issuedAt)} • Nilai Capaian: <strong className="text-[#010105]">{cred.score}%</strong>
                    </p>
                  </div>
                </div>

                {verified[cred.certificateId] === undefined ? (
                  <Badge variant="outline" className="text-mini self-start sm:self-auto">
                    Blok #{cred.blockIndex} • Memeriksa…
                  </Badge>
                ) : verified[cred.certificateId] ? (
                  <Badge variant="mint" className="text-mini self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Blok #{cred.blockIndex} Terverifikasi
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-mini self-start sm:self-auto text-[#852C28] border-[#852C28]/30">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Blok #{cred.blockIndex} Hash Tidak Cocok
                  </Badge>
                )}
              </div>

              {/* Cryptographic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FBF9F4] p-4 rounded-2xl border border-[rgba(28,30,38,0.06)] font-mono">
                <div>
                  <span className="text-mini uppercase font-bold text-[#9195A8] block">ID Sertifikat</span>
                  <span className="text-[#010105] font-bold">{cred.certificateId}</span>
                </div>
                <div>
                  <span className="text-mini uppercase font-bold text-[#9195A8] block">Penerbit &amp; Otoritas</span>
                  <span className="text-[#010105]">{cred.verifiedBy}</span>
                </div>
                <div className="sm:col-span-2 break-all">
                  <span className="text-mini uppercase font-bold text-[#9195A8] block">Block Hash (SHA-256)</span>
                  <span className="text-[#1D5E4D] font-bold">{cred.blockHash}</span>
                </div>
                <div className="sm:col-span-2 break-all">
                  <span className="text-mini uppercase font-bold text-[#9195A8] block">Previous Hash</span>
                  <span className="text-[#5A5E70]">{cred.previousHash}</span>
                </div>
                <div className="sm:col-span-2 flex items-center justify-between gap-2 break-all pt-1 border-t border-[rgba(28,30,38,0.06)]">
                  <div>
                    <span className="text-mini uppercase font-bold text-[#9195A8] block">Transaction Hash (TxID)</span>
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
                <p className="text-mini font-bold text-[#1D5E4D] animate-in fade-in">
                  ✓ TxID disalin ke papan klip!
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
      </main>
      </div>

      <BottomNav />
    </div>
  );
}
