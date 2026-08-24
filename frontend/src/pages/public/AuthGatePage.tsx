import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { audioSynth } from "@/services/audioSynth";
import {
  KeyRound,
  School,
  AlertCircle,
  Hash,
  ArrowRight,
  UserCheck,
  GraduationCap,
  Users,
} from "@/components/ui/icons";

export default function AuthGatePage() {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, login, registerUser, loginWithClassCode } = useApp();

  // Mode: "login" | "register" | "class_code"
  const [authMode, setAuthMode] = useState<"login" | "register" | "class_code">("login");

  // --- Form States ---
  // 1. Login State
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 2. Register State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"SISWA" | "GURU" | "ORTU">("SISWA");
  const [regEducationLevel, setRegEducationLevel] = useState<"SD" | "SMP" | "SMA">("SMA");
  const [regGrade, setRegGrade] = useState<number>(10);
  const [regError, setRegError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // 3. Class Code State
  const [studentName, setStudentName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isJoiningCode, setIsJoiningCode] = useState(false);

  // When education level changes, set sensible default grade
  const handleEducationLevelChange = (level: "SD" | "SMP" | "SMA") => {
    audioSynth.playClickSound();
    setRegEducationLevel(level);
    if (level === "SD") setRegGrade(1);
    else if (level === "SMP") setRegGrade(7);
    else setRegGrade(10);
  };

  // Auto redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === "GURU") {
        navigate("/teacher", { replace: true });
      } else if (currentUser.role === "ORTU") {
        navigate("/parent", { replace: true });
      } else {
        if (!currentUser.learningStyle) {
          navigate("/assessment", { replace: true });
        } else {
          navigate("/student", { replace: true });
        }
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    const res = login(loginIdentifier, loginPassword);
    setIsLoggingIn(false);

    if (!res.success || !res.user) {
      setLoginError(res.message || "Gagal masuk. Periksa kembali nama akun atau email Anda.");
      audioSynth.playErrorSound();
      return;
    }

    audioSynth.playSuccessSound();
    if (res.user.role === "GURU") {
      navigate("/teacher");
    } else if (res.user.role === "ORTU") {
      navigate("/parent");
    } else {
      if (!res.user.learningStyle) {
        navigate("/assessment");
      } else {
        navigate("/student");
      }
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setIsRegistering(true);

    const res = registerUser({
      name: regName,
      email: regEmail,
      role: regRole,
      password: regPassword,
      grade: regRole === "SISWA" ? regGrade : undefined,
    });
    setIsRegistering(false);

    if (!res.success || !res.user) {
      setRegError(res.message || "Gagal membuat akun. Periksa kembali data Anda.");
      audioSynth.playErrorSound();
      return;
    }

    audioSynth.playSuccessSound();
    if (res.user.role === "GURU") {
      navigate("/teacher");
    } else if (res.user.role === "ORTU") {
      navigate("/parent");
    } else {
      navigate("/assessment");
    }
  };

  // Handle Class Code Submit
  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setIsJoiningCode(true);

    const res = loginWithClassCode(studentName, classCode);
    setIsJoiningCode(false);

    if (!res.success || !res.user) {
      setCodeError(res.message || "Kode kelas tidak valid atau gagal bergabung.");
      audioSynth.playErrorSound();
      return;
    }

    audioSynth.playSuccessSound();
    if (res.isNewStudent || !res.user.learningStyle) {
      navigate("/assessment");
    } else {
      navigate("/student");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6FA] text-[#1C1E26] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Subtle Ambient Top Pastel Glow */}
      <div
        className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#E3DBF8]/40 via-[#D1EBE1]/25 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Clean Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-[rgba(28,30,38,0.06)] py-3.5 px-4 sm:px-8 relative z-10 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="clay-pill clay-mint w-10 h-10 rounded-2xl flex items-center justify-center text-[#1D5E4D] font-black shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-[#010105] text-lg sm:text-xl tracking-tight block leading-tight">
                EduAdapt
              </span>
              <p className="text-[11px] text-[#595F72] hidden sm:block font-medium">
                Platform Pembelajaran Adaptif K-12 Berbasis AI Brain &amp; Blockchain Vault
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 relative z-10">
        <div className="w-full max-w-md clay-card p-6 sm:p-8 relative transition-all duration-300">
          {/* Card Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-[#010105] tracking-tight">
              {authMode === "login"
                ? "Selamat Datang"
                : authMode === "register"
                ? "Buat Akun Baru"
                : "Gabung Kode Kelas"}
            </h1>
            <p className="text-xs sm:text-sm text-[#595F72] mt-1 font-medium">
              {authMode === "login"
                ? "Masuk untuk melanjutkan pembelajaran personal Anda"
                : authMode === "register"
                ? "Daftarkan akun sekolah Anda dalam hitungan detik"
                : "Masukkan nama dan 6-digit kode kelas dari guru Anda"}
            </p>
          </div>

          {/* Segmented Mode Selector (Masuk vs Daftar) */}
          {authMode !== "class_code" && (
            <div className="grid grid-cols-2 p-1.5 bg-[#F0EEF6] rounded-2xl mb-6 border border-black/5 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setAuthMode("login");
                  setLoginError("");
                  setRegError("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === "login"
                    ? "clay-card clay-lavender text-[#3C2D68] scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setAuthMode("register");
                  setLoginError("");
                  setRegError("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === "register"
                    ? "clay-card clay-mint text-[#124B3D] scale-102"
                    : "text-[#595F72] hover:text-[#1C1E26]"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Daftar Akun</span>
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 1: MASUK (LOGIN)                                        */}
          {/* ============================================================ */}
          {authMode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="clay-card clay-coral p-3 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-bold">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                  Nama Akun / Email
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Masukkan nama akun atau email Anda"
                  required
                  className="w-full px-4 py-3.5 bg-[#F7F6FA] border border-[rgba(28,30,38,0.1)] rounded-2xl text-xs font-medium text-[#1C1E26] placeholder:text-[#595F72]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1E26]/20 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-[#F7F6FA] border border-[rgba(28,30,38,0.1)] rounded-2xl text-xs font-medium text-[#1C1E26] placeholder:text-[#595F72]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1E26]/20 transition-all shadow-inner"
                />
              </div>

              {/* High-Contrast Clear Primary CTA Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="clay-btn clay-btn-dark w-full mt-2 py-4 px-5 rounded-2xl font-black text-sm text-white flex items-center justify-between group active:scale-98 transition-all cursor-pointer disabled:opacity-50 shadow-md"
              >
                <span>{isLoggingIn ? "Memproses..." : "Masuk ke Portal"}</span>
                <div className="w-8 h-8 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </button>

              {/* Quick Class Code Alternative */}
              <div className="pt-3 border-t border-black/5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setAuthMode("class_code");
                    setCodeError("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4B3B7A] hover:text-[#1C1E26] transition-colors cursor-pointer"
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>Siswa baru? Masuk cepat dengan Kode Kelas Guru</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* MODE 2: DAFTAR AKUN (SIGN UP)                                */}
          {/* ============================================================ */}
          {authMode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="clay-card clay-coral p-3 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-bold">{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: I Made Sujana"
                  required
                  className="w-full px-4 py-3.5 bg-[#F7F6FA] border border-[rgba(28,30,38,0.1)] rounded-2xl text-xs font-medium text-[#1C1E26] placeholder:text-[#595F72]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1E26]/20 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                  Alamat Email / ID Akun
                </label>
                <input
                  type="text"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Contoh: made.sujana@student.eduadapt.id"
                  required
                  className="w-full px-4 py-3.5 bg-[#F7F6FA] border border-[rgba(28,30,38,0.1)] rounded-2xl text-xs font-medium text-[#1C1E26] placeholder:text-[#595F72]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1E26]/20 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Buat kata sandi akun"
                  className="w-full px-4 py-3.5 bg-[#F7F6FA] border border-[rgba(28,30,38,0.1)] rounded-2xl text-xs font-medium text-[#1C1E26] placeholder:text-[#595F72]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1E26]/20 transition-all shadow-inner"
                />
              </div>

              {/* Role Selection Pills */}
              <div>
                <label className="block text-xs font-extrabold text-[#1C1E26] mb-2">
                  Daftar Sebagai Peran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playClickSound();
                      setRegRole("SISWA");
                    }}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      regRole === "SISWA"
                        ? "clay-card clay-mint text-[#124B3D] scale-102"
                        : "bg-[#F0EEF6] text-[#595F72] hover:text-[#1C1E26]"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Siswa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playClickSound();
                      setRegRole("GURU");
                    }}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      regRole === "GURU"
                        ? "clay-card clay-lavender text-[#3C2D68] scale-102"
                        : "bg-[#F0EEF6] text-[#595F72] hover:text-[#1C1E26]"
                    }`}
                  >
                    <School className="w-4 h-4" />
                    <span>Guru</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playClickSound();
                      setRegRole("ORTU");
                    }}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      regRole === "ORTU"
                        ? "clay-card clay-butter text-[#694503] scale-102"
                        : "bg-[#F0EEF6] text-[#595F72] hover:text-[#1C1E26]"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Orang Tua</span>
                  </button>
                </div>
              </div>

              {/* If Siswa: K-12 Comprehensive Education Level & Grade Selector */}
              {regRole === "SISWA" && (
                <div className="space-y-2.5 pt-1">
                  {/* Jenjang Pendidikan Selector */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                      Jenjang Pendidikan (K-12)
                    </label>
                    <div className="grid grid-cols-3 p-1 bg-[#F0EEF6] rounded-xl border border-black/5">
                      {(["SD", "SMP", "SMA"] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleEducationLevelChange(lvl)}
                          className={`py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                            regEducationLevel === lvl
                              ? "bg-white text-[#1C1E26] shadow-xs font-black"
                              : "text-[#595F72] hover:text-[#1C1E26]"
                          }`}
                        >
                          {lvl === "SD" ? "SD" : lvl === "SMP" ? "SMP" : "SMA / SMK"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Grade Selection Grid */}
                  <div>
                    <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                      Pilih Tingkat Kelas
                    </label>
                    <div
                      className={`grid gap-1.5 ${
                        regEducationLevel === "SD"
                          ? "grid-cols-6"
                          : "grid-cols-3"
                      }`}
                    >
                      {regEducationLevel === "SD" &&
                        [1, 2, 3, 4, 5, 6].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              audioSynth.playClickSound();
                              setRegGrade(g);
                            }}
                            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              regGrade === g
                                ? "bg-[#1C1E26] text-white shadow-xs scale-102"
                                : "bg-[#F0EEF6] text-[#595F72] hover:text-[#1C1E26]"
                            }`}
                          >
                            {g}
                          </button>
                        ))}

                      {regEducationLevel === "SMP" &&
                        [7, 8, 9].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              audioSynth.playClickSound();
                              setRegGrade(g);
                            }}
                            className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              regGrade === g
                                ? "bg-[#1C1E26] text-white shadow-xs scale-102"
                                : "bg-[#F0EEF6] text-[#595F72] hover:text-[#1C1E26]"
                            }`}
                          >
                            Kelas {g}
                          </button>
                        ))}

                      {regEducationLevel === "SMA" &&
                        [10, 11, 12].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              audioSynth.playClickSound();
                              setRegGrade(g);
                            }}
                            className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              regGrade === g
                                ? "bg-[#1C1E26] text-white shadow-xs scale-102"
                                : "bg-[#F0EEF6] text-[#595F72] hover:text-[#1C1E26]"
                            }`}
                          >
                            Kelas {g}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* High-Contrast Clear Primary CTA Button */}
              <button
                type="submit"
                disabled={isRegistering}
                className="clay-btn clay-btn-dark w-full mt-3 py-4 px-5 rounded-2xl font-black text-sm text-white flex items-center justify-between group active:scale-98 transition-all cursor-pointer disabled:opacity-50 shadow-md"
              >
                <span>{isRegistering ? "Membuat Akun..." : "Buat Akun & Mulai Belajar"}</span>
                <div className="w-8 h-8 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* MODE 3: GABUNG KODE KELAS (1B QUICK CODE)                     */}
          {/* ============================================================ */}
          {authMode === "class_code" && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              {codeError && (
                <div className="clay-card clay-coral p-3 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-bold">{codeError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: I Kadek Dwi"
                  required
                  className="w-full px-4 py-3.5 bg-[#F7F6FA] border border-[rgba(28,30,38,0.1)] rounded-2xl text-xs font-medium text-[#1C1E26] placeholder:text-[#595F72]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1E26]/20 transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#1C1E26] mb-1.5">
                  6-Digit Kode Kelas Guru
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: UDU802"
                  maxLength={10}
                  required
                  className="w-full px-4 py-3.5 bg-[#F7F6FA] border border-[rgba(28,30,38,0.1)] rounded-2xl text-xs font-black tracking-widest text-[#1C1E26] placeholder:text-[#595F72]/60 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1C1E26]/20 transition-all shadow-inner"
                />
              </div>

              <div className="clay-card clay-mint p-3.5 text-[11px] font-semibold leading-relaxed">
                💡 Masuk dengan kode kelas akan otomatis menghubungkan akun siswa Anda ke kelas guru dan membuka asesmen adaptif.
              </div>

              {/* High-Contrast Clear Primary CTA Button */}
              <button
                type="submit"
                disabled={isJoiningCode}
                className="clay-btn clay-btn-dark w-full mt-2 py-4 px-5 rounded-2xl font-black text-sm text-white flex items-center justify-between group active:scale-98 transition-all cursor-pointer disabled:opacity-50 shadow-md"
              >
                <span>{isJoiningCode ? "Bergabung..." : "Gabung & Mulai Belajar"}</span>
                <div className="w-8 h-8 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playClickSound();
                    setAuthMode("login");
                    setCodeError("");
                  }}
                  className="text-xs font-extrabold text-[#595F72] hover:text-[#1C1E26] transition-colors cursor-pointer"
                >
                  ← Kembali ke Menu Masuk Akun
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Clean Institutional Footer */}
      <footer className="w-full bg-white border-t border-[rgba(28,30,38,0.06)] py-4 px-4 text-center relative z-10">
        <p className="max-w-4xl mx-auto text-xs text-[#595F72] font-medium">
          © 2026 EduAdapt • Riset Hibah Fundamental Universitas Udayana
        </p>
      </footer>
    </div>
  );
}
