import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { audioSynth } from "@/services/audioSynth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LogOut } from "@/components/ui/icons";

/** Asks before signing out; every logout button opens this instead of logging out directly. */
export default function LogoutConfirmDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { logout } = useApp();
  const navigate = useNavigate();

  const confirm = () => {
    audioSynth.playClickSound();
    onOpenChange(false);
    logout();
    navigate("/");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 bg-white rounded-3xl border-2 border-white shadow-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#FDE8E8] text-[#852C28] flex items-center justify-center mb-1">
            <LogOut className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-black text-[#010105]">Keluar dari akun?</DialogTitle>
          <DialogDescription className="text-xs text-[#5A5E70]">
            Anda perlu masuk lagi dengan email dan kata sandi untuk membuka akun ini.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            autoFocus
            className="clay-btn clay-btn-white px-4 py-2.5 text-xs font-bold text-[#5A5E70] cursor-pointer"
          >
            Batal
          </button>
          <button onClick={confirm} className="clay-btn clay-btn-coral px-4 py-2.5 text-xs font-black cursor-pointer">
            Ya, keluar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
