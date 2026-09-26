import React, { useState } from "react";
import { ApiService, utcDate } from "@/services/apiClient";
import { Users, Copy, Check } from "@/components/ui/icons";

/** Lets a student hand a one-time code to a parent so the parent's account can follow their progress. */
export default function ParentCodeCard() {
  const [code, setCode] = useState<{ code: string; expires_at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const make = async () => {
    setBusy(true);
    setError("");
    try {
      setCode(await ApiService.createParentCode());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kode gagal dibuat.");
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    if (!code) return;
    navigator.clipboard?.writeText(code.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="clay-card p-5 sm:p-6 space-y-3 bg-white">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#D1EBE1] text-[#1D5E4D] flex items-center justify-center shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-black text-[#1C1E26]">Hubungkan orang tua</h2>
          <p className="text-xs text-[#5A5E70]">
            Orang tua bisa melihat perkembanganmu dan berkirim catatan dengan gurumu setelah memasukkan kode ini di akun mereka.
          </p>
        </div>
      </div>

      {code ? (
        <div className="rounded-2xl bg-[#F8F9FD] p-4 flex items-center justify-between gap-3">
          <div>
            <span className="block font-mono text-2xl font-black tracking-[0.2em] text-[#010105]">{code.code}</span>
            <span className="block text-mini text-[#5A5E70]">
              Sekali pakai · berlaku sampai{" "}
              {utcDate(code.expires_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <button onClick={copy} aria-label="Salin kode" className="clay-btn clay-btn-white p-2.5 cursor-pointer">
            {copied ? <Check className="w-4 h-4 text-[#1D5E4D]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <button onClick={make} disabled={busy} className="clay-btn clay-btn-dark px-4 py-2.5 text-xs font-black cursor-pointer disabled:opacity-50">
          {busy ? "Membuat kode..." : "Buat kode untuk orang tua"}
        </button>
      )}
      {error && <p role="alert" className="text-xs font-bold text-[#852C28]">{error}</p>}
      {code && <p className="text-mini text-[#9195A8]">Berikan kode ini hanya ke orang tua atau walimu sendiri.</p>}
    </section>
  );
}
