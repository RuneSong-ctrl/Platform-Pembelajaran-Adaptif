import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { School, Loader2 } from "@/components/ui/icons";

export const PENDING_JOIN_KEY = "eduadapt_pending_join";

/** Link to share: https://<site>/join/<kode>. */
export const classJoinLink = (code: string) => `${window.location.origin}/join/${encodeURIComponent(code)}`;

export default function JoinClassPage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isRestoringSession, currentUser, joinClassroom } = useApp();
  const [error, setError] = useState("");
  const started = useRef(false);
  const cleanCode = code.trim().toUpperCase();

  useEffect(() => {
    if (isRestoringSession || !isAuthenticated || currentUser.role !== "SISWA" || started.current) return;
    started.current = true; // StrictMode runs effects twice; join only once
    try {
      sessionStorage.removeItem(PENDING_JOIN_KEY);
    } catch {
      // storage blocked: nothing to clear
    }
    joinClassroom(cleanCode).then((res) => {
      if (!res.success) return setError(res.message);
      // Class is joined either way; students who haven't done the first assessment go there first.
      navigate(currentUser.learningStyle ? `/student/class/${res.classroomId}` : "/assessment", { replace: true });
    });
  }, [isRestoringSession, isAuthenticated, currentUser, cleanCode, joinClassroom, navigate]);

  const goLogin = () => {
    try {
      sessionStorage.setItem(PENDING_JOIN_KEY, cleanCode);
    } catch {
      // storage blocked: the student can open the link again after signing in
    }
    navigate("/");
  };

  let body: React.ReactNode;
  if (isRestoringSession || (isAuthenticated && currentUser.role === "SISWA" && !error)) {
    body = (
      <p role="status" className="text-sm font-bold text-[#5A5E70] flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Menggabungkan kamu ke kelas...
      </p>
    );
  } else if (!isAuthenticated) {
    body = (
      <>
        <p className="text-sm text-[#5A5E70]">Masuk atau daftar sebagai siswa dulu. Setelah itu kamu otomatis bergabung ke kelas ini.</p>
        <button onClick={goLogin} className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black cursor-pointer">
          Masuk / Daftar
        </button>
      </>
    );
  } else if (currentUser.role !== "SISWA") {
    body = (
      <>
        <p className="text-sm text-[#5A5E70]">Link ini untuk siswa. Anda masuk sebagai {currentUser.role === "GURU" ? "guru" : "orang tua"}.</p>
        <Link to="/" className="clay-btn clay-btn-white px-5 py-2.5 text-xs font-black">Kembali</Link>
      </>
    );
  } else {
    body = (
      <>
        <p role="alert" className="text-sm font-bold text-[#852C28]">{error}</p>
        <Link to="/student/class" className="clay-btn clay-btn-white px-5 py-2.5 text-xs font-black">Ke daftar kelas</Link>
      </>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F8F9FD] flex items-center justify-center p-4">
      <div className="clay-card clay-white p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl clay-lavender text-[#4B3B7A] flex items-center justify-center mx-auto">
          <School className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#010105]">Gabung ke kelas</h1>
          <p className="text-xs text-[#9195A8] font-mono tracking-widest mt-0.5">{cleanCode}</p>
        </div>
        <div className="space-y-3 flex flex-col items-center">{body}</div>
      </div>
    </div>
  );
}
