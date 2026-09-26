import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { ApiService } from "@/services/apiClient";
import { audioSynth } from "@/services/audioSynth";

/** Parent enters the code their child made in the child's profile page. */
export default function LinkChildForm({ onLinked }: { onLinked?: (childId: string) => void }) {
  const { triggerSync, setSelectedParentChildId } = useApp();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const child = await ApiService.linkChild(code.trim());
      audioSynth.playSuccessSound();
      setDone(`${child.name} berhasil terhubung.`);
      setCode("");
      await triggerSync();
      setSelectedParentChildId(child.id);
      onLinked?.(child.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode gagal dipakai.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-[#5A5E70]">
        Minta anak membuka <b>Profil</b> di akunnya, lalu tekan <b>Buat kode untuk orang tua</b>. Masukkan kode 8 huruf itu di sini.
      </p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Contoh: K7MQ2XRA"
          maxLength={16}
          autoComplete="off"
          aria-label="Kode dari anak"
          className="flex-1 min-w-0 p-3 rounded-2xl border border-[rgba(28,30,38,0.12)] text-sm font-mono font-black tracking-widest bg-[#F8F9FD] focus:outline-none focus:border-[#4B3B7A]"
        />
        <button
          type="submit"
          disabled={!code.trim() || busy}
          className="clay-btn clay-btn-dark px-5 py-2.5 text-xs font-black cursor-pointer disabled:opacity-50 shrink-0"
        >
          {busy ? "Memeriksa..." : "Hubungkan"}
        </button>
      </div>
      {error && <p role="alert" className="text-xs font-bold text-[#852C28]">{error}</p>}
      {done && <p role="status" className="text-xs font-bold text-[#1D5E4D]">{done}</p>}
    </form>
  );
}
