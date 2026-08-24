import React, { useState, useEffect } from "react";
import { Download, X, Sparkles } from "@/components/ui/icons";
import { audioSynth } from "@/services/audioSynth";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a slight delay if user hasn't dismissed before
      const hasDismissed = localStorage.getItem("pwa_prompt_dismissed");
      if (!hasDismissed) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    audioSynth.playClickSound();
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      audioSynth.playSuccessSound();
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    audioSynth.playClickSound();
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-sm w-[calc(100%-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="clay-card clay-dark p-4 rounded-3xl text-white shadow-2xl flex items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] text-white flex items-center justify-center shrink-0 shadow-md">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black tracking-tight">Pasang Aplikasi EduAdapt</h4>
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]"></span>
            </div>
            <p className="text-[10px] text-white/70 font-medium leading-tight mt-0.5">
              Akses cepat tanpa browser &amp; belajar offline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="clay-btn clay-btn-white text-[#1C1E26] px-3 py-1.5 text-xs font-black rounded-xl hover:scale-105 transition-transform cursor-pointer"
          >
            Pasang
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-white/60 hover:text-white rounded-lg cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
