import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { audioSynth } from "@/services/audioSynth";
import {
  Brain,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Layers,
  BookOpen,
  Users,
  GraduationCap,
  ArrowUpRight,
} from "@/components/ui/icons";

export default function LandingPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useApp();

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] selection:bg-[#FADFAD] pb-24">
      <Navbar />

      {/* 1. HERO SECTION */}
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E0DAF5] border border-[rgba(75,59,122,0.18)] text-[#4B3B7A] text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Riset Hibah Fundamental • Universitas Udayana 2026</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-bold tracking-tight text-[#010105] max-w-4xl mx-auto leading-[1.15]">
          Ekosistem Pendidikan Digital yang{" "}
          <span className="bg-[#D1EBE1] text-[#1D5E4D] px-3 py-0.5 rounded-2xl inline-block">
            Personal
          </span>{" "}
          &amp;{" "}
          <span className="bg-[#E0DAF5] text-[#4B3B7A] px-3 py-0.5 rounded-2xl inline-block">
            Aman
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-[#5A5E70] font-medium max-w-2xl mx-auto leading-relaxed">
          Memadukan <strong>Adaptive AI Brain</strong> untuk menyesuaikan modalitas dan kecepatan kognitif siswa, serta <strong>Blockchain Vault</strong> untuk mengunci rekam jejak akademik permanen anti-manipulasi.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => {
              audioSynth.playClickSound();
              if (isAuthenticated && currentUser.role === "SISWA") {
                navigate("/assessment");
              } else {
                navigate("/auth?role=SISWA");
              }
            }}
            variant="primary"
            size="lg"
            className="font-bold text-sm sm:text-base h-12 px-7 shadow-md cursor-pointer"
          >
            Mulai Asesmen Gaya Belajar
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          <Button
            onClick={() => {
              audioSynth.playClickSound();
              if (isAuthenticated) {
                navigate(currentUser.role === "GURU" ? "/teacher" : currentUser.role === "ORTU" ? "/parent" : "/student");
              } else {
                navigate("/auth");
              }
            }}
            variant="outline"
            size="lg"
            className="font-bold text-sm sm:text-base h-12 px-7 cursor-pointer"
          >
            {isAuthenticated ? "Masuk ke Dashboard" : "Masuk / Daftar Akun"}
          </Button>
        </div>
      </header>

      {/* 2. ROLE QUICK ACCESS PORTAL CARDS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-4">
        <div className="text-center mb-6">
          <Badge variant="slate" className="text-xs uppercase font-bold tracking-wider">
            Akses Langsung Berbasis Peran
          </Badge>
          <h2 className="text-2xl font-bold text-[#010105] mt-1">
            Pilih Portal Pengalaman Pengguna
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Role 1: Siswa */}
          <div
            onClick={() => {
              audioSynth.playClickSound();
              if (isAuthenticated && currentUser.role === "SISWA") {
                navigate("/student");
              } else {
                navigate("/auth?role=SISWA");
              }
            }}
            className="clay-card clay-mint p-6 cursor-pointer group hover:scale-[1.02] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#124B3D] mb-4 shadow-md">
                <Brain className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-[#124B3D] text-[10px] font-black uppercase">
                PWA Mobile-First
              </span>
              <h3 className="text-lg font-extrabold text-[#010105] mt-2 group-hover:text-[#124B3D] transition-colors">
                Portal Siswa (Adaptive Learning)
              </h3>
              <p className="text-xs text-[#124B3D]/80 mt-2 font-medium leading-relaxed">
                Jalur belajar bertingkat, kuis Dynamic Difficulty Adjustment (DDA), representasi visual/audio/kinestetik, dan paspor belajar blockchain.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-[rgba(18,75,61,0.15)]">
              <span className="text-xs font-black text-[#124B3D]">Buka Portal Siswa</span>
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#010105] shadow-xs group-hover:bg-[#010105] group-hover:text-white transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Role 2: Guru */}
          <div
            onClick={() => {
              audioSynth.playClickSound();
              if (isAuthenticated && currentUser.role === "GURU") {
                navigate("/teacher");
              } else {
                navigate("/auth?role=GURU");
              }
            }}
            className="clay-card clay-lavender p-6 cursor-pointer group hover:scale-[1.02] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#3C2D68] mb-4 shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-[#3C2D68] text-[10px] font-black uppercase">
                Desktop Web Dashboard
              </span>
              <h3 className="text-lg font-extrabold text-[#010105] mt-2 group-hover:text-[#3C2D68] transition-colors">
                Portal Guru (Command Center &amp; RAG)
              </h3>
              <p className="text-xs text-[#3C2D68]/80 mt-2 font-medium leading-relaxed">
                Manajemen rombel, upload modul RAG anti-halusinasi, studio kuis AI ter-grounding dengan persetujuan guru, dan buku nilai live.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-[rgba(60,45,104,0.15)]">
              <span className="text-xs font-black text-[#3C2D68]">Buka Portal Guru</span>
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#010105] shadow-xs group-hover:bg-[#010105] group-hover:text-white transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Role 3: Orang Tua */}
          <div
            onClick={() => {
              audioSynth.playClickSound();
              if (isAuthenticated && currentUser.role === "ORTU") {
                navigate("/parent");
              } else {
                navigate("/auth?role=ORTU");
              }
            }}
            className="clay-card clay-butter p-6 cursor-pointer group hover:scale-[1.02] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#694503] mb-4 shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-[#694503] text-[10px] font-black uppercase">
                PWA Mobile-First
              </span>
              <h3 className="text-lg font-extrabold text-[#010105] mt-2 group-hover:text-[#694503] transition-colors">
                Portal Orang Tua &amp; Wellbeing
              </h3>
              <p className="text-xs text-[#694503]/80 mt-2 font-medium leading-relaxed">
                Knowledge Map radar pemahaman topik, narasi kemajuan belajar AI, pemantauan waktu belajar vs istirahat, dan catatan konsultasi guru.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-[rgba(105,69,3,0.15)]">
              <span className="text-xs font-black text-[#694503]">Buka Portal Orang Tua</span>
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#010105] shadow-xs group-hover:bg-[#010105] group-hover:text-white transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4 PILAR RISET UTAMA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="text-center mb-8">
          <Badge variant="mint" className="text-xs uppercase font-bold tracking-wider">
            Fondasi Metodologi Ilmiah
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#010105] mt-1">
            Empat Pilar Inovasi Platform EduAdapt
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-6 rounded-3xl bg-white border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D1EBE1] flex items-center justify-center text-[#1D5E4D]">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#010105]">
              1. AI Adaptive Engine &amp; Profil Kognitif
            </h3>
            <p className="text-xs text-[#5A5E70] leading-relaxed font-medium">
              Menganalisis kecepatan kognitif, pengenalan pola, dan spektrum modalitas belajar dinamis. DDA Engine menyesuaikan tingkat kesulitan secara real-time berdasarkan akurasi dan waktu berpikir (detik).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E0DAF5] flex items-center justify-center text-[#4B3B7A]">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#010105]">
              2. Teacher-Grounded RAG (Anti-Halusinasi)
            </h3>
            <p className="text-xs text-[#5A5E70] leading-relaxed font-medium">
              AI tidak mengarang materi secara bebas. Seluruh kuis dan penjelasan tutor di-grounding 100% dari modul PDF buku ajar yang diunggah guru ke dalam database vektor ChromaDB.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#CDDFF5] flex items-center justify-center text-[#21518A]">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#010105]">
              3. Offline Learning &amp; Automatic Sync
            </h3>
            <p className="text-xs text-[#5A5E70] leading-relaxed font-medium">
              Siswa dapat mengunduh paket pembelajaran mandiri untuk belajar di daerah minim sinyal. Hasil capaian disimpan di penyimpanan lokal dan otomatis disinkronkan saat online.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[rgba(28,30,38,0.06)] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FADFAD] flex items-center justify-center text-[#785308]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#010105]">
              4. Blockchain Learning Passport Vault
            </h3>
            <p className="text-xs text-[#5A5E70] leading-relaxed font-medium">
              Setiap capaian modul di-minting ke dalam rantai blok deterministik SHA-256 Merkle chain. Portofolio akademik permanen yang bebas manipulasi dan dapat diverifikasi via QR code publik.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 border-t border-[rgba(28,30,38,0.06)] text-xs text-[#5A5E70] font-medium flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© 2026 Universitas Udayana • Riset Hibah Fundamental (HPF)</p>
        <div className="flex gap-4">
          <Link to="/verify" className="hover:text-[#010105] font-bold">
            Verifikasi Kredensial
          </Link>
          <Link to="/student" className="hover:text-[#010105] font-bold">
            Portal Siswa
          </Link>
          <Link to="/teacher" className="hover:text-[#010105] font-bold">
            Portal Guru
          </Link>
        </div>
      </footer>
    </div>
  );
}
