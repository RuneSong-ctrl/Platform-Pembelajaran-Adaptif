import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19] flex flex-col justify-between">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <span className="text-5xl font-black text-[#1C1E26]">404</span>
        <h1 className="text-2xl font-bold text-[#010105]">Halaman Tidak Ditemukan</h1>
        <p className="text-xs text-[#5A5E70]">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>

        <div className="pt-4">
          <Link to="/">
            <Button variant="primary" className="font-bold">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-[#9195A8]">
        © 2026 EduFlow Adaptive Ecosystem
      </footer>
    </div>
  );
}
