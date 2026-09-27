import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#1C1E26] flex flex-col justify-between">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <img src="/brand/logo-256.png" alt="EduAdapt" width={80} height={80} className="w-20 h-20 mx-auto" />
        <span className="block text-5xl font-black text-[#1C1E26]">404</span>
        <h1 className="text-2xl font-bold text-[#1C1E26]">Halaman Tidak Ditemukan</h1>
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

      <footer className="text-center py-6 text-xs text-[#595F72]">
        © 2026 EduAdapt • Riset Hibah Fundamental Universitas Udayana
      </footer>
    </div>
  );
}
