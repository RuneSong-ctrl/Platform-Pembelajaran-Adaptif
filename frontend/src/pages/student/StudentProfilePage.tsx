import { levelLabel } from "@/lib/utils";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import ParentCodeCard from "@/components/student/ParentCodeCard";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { audioSynth } from "@/services/audioSynth";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Eye,
  Headphones,
  FlaskConical,
  Flame,
  Star,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ChevronRight,
  Award,
  Edit3,
  Camera,
  Check,
  UploadCloud,
  CheckCircle2,
} from "@/components/ui/icons";

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUserProfile, logout, credentials } = useApp();
  const certCount = credentials.filter((c) => c.studentId === currentUser.id).length;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(currentUser.name);
  const [editEmail, setEditEmail] = useState(currentUser.email);
  const [editGrade, setEditGrade] = useState(currentUser.grade || 10);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Avatar Upload State
  const [previewAvatar, setPreviewAvatar] = useState(
    currentUser.avatar || currentUser.name?.slice(0, 2).toUpperCase() || "ST"
  );

  const avatarPresets = ["ST", "ED", "ID", "AK", "RN", "SK", "DY", "MA"];

  const scores = currentUser.modalityScores || {
    visual: 0,
    audio: 0,
    practice: 0,
  };

  const style = currentUser.learningStyle || "VISUAL";

  const getStyleBadge = () => {
    switch (style) {
      case "AUDITORI":
        return {
          label: "Auditori",
          badgeBg: "bg-[#E3DBF8] text-[#4B3B7A]",
          Icon: Headphones,
        };
      case "KINESTETIK":
        return {
          label: "Kinestetik",
          badgeBg: "bg-[#FEE7B3] text-[#785308]",
          Icon: FlaskConical,
        };
      case "VISUAL":
      default:
        return {
          label: "Visual",
          badgeBg: "bg-[#D1EBE1] text-[#1D5E4D]",
          Icon: Eye,
        };
    }
  };

  const styleBadge = getStyleBadge();
  const StyleIcon = styleBadge.Icon;

  const handleOpenEdit = () => {
    audioSynth.playClickSound();
    setEditName(currentUser.name);
    setEditEmail(currentUser.email);
    setEditGrade(currentUser.grade || 10);
    setSaveSuccessMsg("");
    setProfileError("");
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || isSavingProfile) return;
    setIsSavingProfile(true);
    setProfileError("");
    try {
      await updateCurrentUserProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        grade: Number(editGrade) || 10,
      });
      audioSynth.playSuccessSound();
      setSaveSuccessMsg("Profil berhasil diperbarui!");
      setTimeout(() => {
        setShowEditModal(false);
        setSaveSuccessMsg("");
      }, 1000);
    } catch (error) {
      audioSynth.playErrorSound();
      setProfileError(error instanceof Error ? error.message : "Profil belum tersimpan.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveAvatar = async (avatar: string) => {
    const previous = previewAvatar;
    setAvatarError("");
    setPreviewAvatar(avatar);
    try {
      await updateCurrentUserProfile({ avatar });
      audioSynth.playSuccessSound();
      setShowAvatarModal(false);
    } catch (error) {
      setPreviewAvatar(previous);
      audioSynth.playErrorSound();
      setAvatarError(error instanceof Error ? error.message : "Avatar belum tersimpan.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
      setAvatarError("Pilih gambar dengan ukuran maksimal 1 MB.");
      return;
    }

    audioSynth.playClickSound();
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) void saveAvatar(base64Url);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: string) => {
    void saveAvatar(preset);
  };

  const handleLogout = () => {
    audioSynth.playClickSound();
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden w-full">
        <StudentSidebar />

        <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-5 min-w-0 flex flex-col gap-5 pb-24 md:pb-8 [&>*]:shrink-0">
        {/* 1. PROFILE HEADER CARD WITH EDIT & AVATAR UPLOAD */}
        <section className="clay-card p-5 sm:p-6 flex items-center justify-between gap-4 relative overflow-hidden bg-white">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar Squircle with Upload Trigger */}
            <div className="relative group shrink-0">
              {currentUser.avatar && currentUser.avatar.startsWith("data:image") ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-3xl object-cover border-2 border-white shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-3xl clay-card clay-lavender flex items-center justify-center text-[#4B3B7A] text-xl font-black shadow-xs">
                  {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Camera Icon Overlay */}
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setShowAvatarModal(true);
                }}
                className="group/cam absolute -bottom-3 -right-3 flex items-end justify-end p-2 cursor-pointer"
                title="Ganti Foto Profil"
                aria-label="Ganti foto profil"
              >
                {/* Tombol tetap 44px (area sentuh global), lingkaran visualnya kecil */}
                <span className="w-6 h-6 rounded-full bg-[#1C1E26] text-white flex items-center justify-center border-2 border-white shadow-xs group-hover/cam:scale-110 group-active/cam:scale-95 transition-transform">
                  <Camera className="w-3 h-3" />
                </span>
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {currentUser.grade && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EBF6F2] text-[#1D5E4D] text-mini font-extrabold">
                    Kelas {currentUser.grade}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-[#F0EEF6] text-[#5A5E70] text-mini font-bold">
                  Siswa
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-black text-[#010105] truncate">
                {currentUser.name}
              </h1>
              <p className="text-xs text-[#5A5E70] truncate font-medium">
                {currentUser.email}
              </p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={handleOpenEdit}
            className="w-9 h-9 rounded-2xl bg-[#F0EEF6] hover:bg-[#E3DBF8] text-[#4B3B7A] flex items-center justify-center shrink-0 transition-colors shadow-2xs cursor-pointer"
            title="Edit Data Profil"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </section>

        {/* Paspor Belajar shortcut */}
        <Link
          to="/passport"
          onClick={() => audioSynth.playClickSound()}
          className="clay-card bg-white p-4 sm:p-5 flex items-center gap-3.5 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D5E4D]/40 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-black text-[#010105]">Paspor Belajar</h2>
            <p className="text-xs text-[#5A5E70] font-medium truncate">
              {certCount > 0 ? `${certCount} sertifikat kompetensi tercatat` : "Belum ada sertifikat, selesaikan kuis untuk mendapatkannya"}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#9195A8] shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* 2. LEARNING STYLE ASSESSMENT RESULTS */}
        <section className="clay-card p-5 sm:p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-mini font-extrabold uppercase tracking-wider text-[#9195A8] block">
                Cara Belajarmu
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-[#010105]">
                Profil Gaya Belajar
              </h2>
            </div>

            <span className={`px-2.5 py-1 rounded-full ${styleBadge.badgeBg} text-mini font-extrabold flex items-center gap-1`}>
              <StyleIcon className="w-3 h-3" />
              <span>Dominan: {styleBadge.label}</span>
            </span>
          </div>

          {/* 3 Progress Bars per Modality */}
          <div className="space-y-3 pt-1">
            {/* Visual Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1 text-[#1D5E4D]">
                  <Eye className="w-3.5 h-3.5" /> Visual · gambar &amp; diagram
                </span>
                <span className="text-[#1D5E4D]">{scores.visual}%</span>
              </div>
              <div className="w-full bg-[#EBF6F2] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1D5E4D] h-full rounded-full transition-all duration-500"
                  style={{ width: `${scores.visual}%` }}
                ></div>
              </div>
            </div>

            {/* Audio Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1 text-[#4B3B7A]">
                  <Headphones className="w-3.5 h-3.5" /> Auditori · suara &amp; penjelasan
                </span>
                <span className="text-[#4B3B7A]">{scores.audio}%</span>
              </div>
              <div className="w-full bg-[#F2EFFC] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#4B3B7A] h-full rounded-full transition-all duration-500"
                  style={{ width: `${scores.audio}%` }}
                ></div>
              </div>
            </div>

            {/* Kinesthetic Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1 text-[#785308]">
                  <FlaskConical className="w-3.5 h-3.5" /> Kinestetik · praktik langsung
                </span>
                <span className="text-[#785308]">{scores.practice}%</span>
              </div>
              <div className="w-full bg-[#FFF6DF] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#785308] h-full rounded-full transition-all duration-500"
                  style={{ width: `${scores.practice}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[rgba(28,30,38,0.06)] flex items-center justify-between text-xs">
            <span className="text-[#5A5E70] font-medium">
              Kecepatan belajar:{" "}
              <strong className="text-[#010105]">
                {currentUser.processingSpeed === "FAST" ? "Cepat" : currentUser.processingSpeed === "DELIBERATE" ? "Teliti & perlahan" : "Sedang"}
              </strong>
            </span>
            <Link
              to="/assessment"
              onClick={() => audioSynth.playClickSound()}
              className="font-bold text-[#4B3B7A] bg-[#F0EEF6] hover:bg-[#E3DBF8] px-3 py-1.5 rounded-full transition-colors"
            >
              Ulangi asesmen
            </Link>
          </div>
        </section>

        {/* 3. CAPAIAN & STATISTIK BELAJAR */}
        <section className="clay-card p-5 sm:p-6 space-y-3 bg-white">
          <h2 className="text-sm sm:text-base font-extrabold text-[#010105]">
            Statistik &amp; Capaian Belajar
          </h2>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Stat 1: Total XP */}
            <div className="bg-[#F8F9FD] p-3 rounded-2xl border border-[rgba(28,30,38,0.05)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl clay-card clay-sky flex items-center justify-center text-[#21518A] shrink-0">
                <Star className="w-5 h-5 fill-[#21518A]" />
              </div>
              <div>
                <span className="text-mini text-[#5A5E70] font-bold block">Total XP</span>
                <span className="text-sm font-black text-[#010105]">{currentUser.xpTotal || 450}</span>
              </div>
            </div>

            {/* Stat 2: Streak */}
            <div className="bg-[#F8F9FD] p-3 rounded-2xl border border-[rgba(28,30,38,0.05)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl clay-card clay-butter flex items-center justify-center text-[#785308] shrink-0">
                <Flame className="w-5 h-5 fill-[#785308]" />
              </div>
              <div>
                <span className="text-mini text-[#5A5E70] font-bold block">Streak Hari</span>
                <span className="text-sm font-black text-[#010105]">{currentUser.streakDays || 14} Hari</span>
              </div>
            </div>

            {/* Stat 3: Level DDA */}
            <div className="bg-[#F8F9FD] p-3 rounded-2xl border border-[rgba(28,30,38,0.05)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl clay-card clay-mint flex items-center justify-center text-[#1D5E4D] shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-mini text-[#5A5E70] font-bold block">Level</span>
                <span className="text-sm font-black text-[#010105]">{levelLabel(currentUser.currentDDALevel, "MEDIUM")}</span>
              </div>
            </div>

            {/* Stat 4: Nyawa Belajar */}
            <div className="bg-[#F8F9FD] p-3 rounded-2xl border border-[rgba(28,30,38,0.05)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl clay-card clay-lavender flex items-center justify-center text-[#4B3B7A] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-mini text-[#5A5E70] font-bold block">Nyawa Latihan</span>
                <span className="text-sm font-black text-[#010105]">{currentUser.hearts || 5}/5</span>
              </div>
            </div>
          </div>
        </section>

        <ParentCodeCard />

        {/* 4. ACTIONS: RE-ASSESSMENT & LOGOUT */}
        <section className="space-y-2.5">
          {/* Re-Assessment Trigger */}
          <button
            onClick={() => {
              audioSynth.playClickSound();
              setShowConfirmModal(true);
            }}
            className="clay-card clay-card-hover p-4 w-full flex items-center justify-between text-left cursor-pointer group bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl clay-card clay-lavender flex items-center justify-center text-[#4B3B7A] shrink-0">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#010105]">
                  Tes Ulang Cara Belajar
                </h3>
                <p className="text-mini text-[#5A5E70]">
                  Uji ulang profil modalitas untuk kalibrasi dashboard
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9195A8] group-hover:text-[#010105] transition-colors" />
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="clay-btn bg-[#FCD9D7] text-[#852C28] hover:bg-[#F8C8C6] w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun Siswa</span>
          </button>
        </section>
      </main>
    </div>

      {/* MODAL 1: EDIT PROFILE DIALOG */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-sm p-6 bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#010105]">
              Edit Data Profil Siswa
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A5E70]">
              Perbarui identitas namamu yang tercatat di kelas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-3">
            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Nama Lengkap
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Contoh: Ayu Lestari"
                className="rounded-2xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Alamat Email
              </label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="ayu@student.eduadapt.id"
                className="rounded-2xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1">
                Tingkat Jenjang Kelas
              </label>
              <Input
                type="number"
                min={1}
                max={12}
                value={editGrade}
                onChange={(e) => setEditGrade(Number(e.target.value))}
                className="rounded-2xl text-xs"
              />
            </div>

            {saveSuccessMsg && (
              <p className="text-xs font-bold text-[#1D5E4D] text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveSuccessMsg}</span>
              </p>
            )}
            {profileError && (
              <p role="alert" className="text-xs font-bold text-[#852C28] text-center">{profileError}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowEditModal(false)}
              className="clay-btn clay-btn-white px-4 py-2 rounded-xl text-xs font-bold text-[#5A5E70] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={() => void handleSaveProfile()}
              disabled={isSavingProfile}
              className="clay-btn clay-btn-dark px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-60"
            >
              {isSavingProfile ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: AVATAR / PHOTO UPLOAD DIALOG */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="max-w-sm p-6 bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#010105]">
              Pilih Foto Profil
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5A5E70]">
              Unggah foto dari perangkat atau pilih inisial avatar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3">
            {avatarError && (
              <p role="alert" className="text-xs font-bold text-[#852C28]">{avatarError}</p>
            )}
            {/* Custom Upload Section */}
            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1.5">
                Unggah Foto dari Perangkat
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[rgba(28,30,38,0.15)] rounded-2xl hover:bg-[#F8F9FD] transition-colors cursor-pointer text-center">
                <UploadCloud className="w-7 h-7 text-[#4B3B7A] mb-1" />
                <span className="text-xs font-bold text-[#010105]">Pilih Berkas Foto</span>
                <span className="text-mini text-[#9195A8]">PNG, JPG, WEBP maks 1MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Inisial Presets */}
            <div>
              <label className="block text-xs font-bold text-[#010105] mb-1.5">
                Atau Pilih Inisial Avatar
              </label>
              <div className="grid grid-cols-4 gap-2">
                {avatarPresets.map((preset) => {
                  const isSelected = previewAvatar === preset;
                  return (
                    <button
                      key={preset}
                      onClick={() => handleSelectPreset(preset)}
                      className={`h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all cursor-pointer ${
                        isSelected
                          ? "clay-card clay-lavender border-2 border-[#4B3B7A] scale-105"
                          : "bg-[#F4F6FA] hover:bg-[#E3DBF8] text-[#4B3B7A]"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="clay-btn clay-btn-white px-4 py-2 rounded-xl text-xs font-bold text-[#5A5E70] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CONFIRMATION MODAL FOR RE-ASSESSMENT */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(28,30,38,0.25)] border border-[rgba(28,30,38,0.08)] space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl clay-card clay-butter text-[#785308] flex items-center justify-center mx-auto shadow-xs">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-[#010105]">
                Mulai tes ulang?
              </h3>
              <p className="text-xs text-[#5A5E70] leading-relaxed">
                Tampilan dashboard adaptif dan rekomendasi materi akan disesuaikan kembali berdasarkan hasil diagnostik baru.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  audioSynth.playClickSound();
                  setShowConfirmModal(false);
                }}
                className="clay-btn clay-btn-white flex-1 py-2.5 text-xs font-bold text-[#5A5E70] cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={() => {
                  audioSynth.playSuccessSound();
                  setShowConfirmModal(false);
                  navigate("/assessment");
                }}
                className="clay-btn clay-btn-dark flex-1 py-2.5 text-xs font-bold text-white cursor-pointer"
              >
                Ya, Mulai Tes
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
