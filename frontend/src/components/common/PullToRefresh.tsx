import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { emitRefresh } from "@/services/liveEvents";
import { RefreshCw } from "@/components/ui/icons";

const TRIGGER = 70;
const MAX_PULL = 110;

/**
 * Pull-to-refresh for phone screens. Place it as a direct child of the page's scrolling <main>:
 * it listens on that parent, so pages need no ref wiring. The indicator is fixed-position, so it
 * never takes part in the page's flex/gap layout.
 */
export default function PullToRefresh() {
  const { triggerSync } = useApp();
  const anchor = useRef<HTMLSpanElement>(null);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const syncRef = useRef(triggerSync);
  syncRef.current = triggerSync;

  useEffect(() => {
    const scroller = anchor.current?.parentElement;
    if (!scroller || !window.matchMedia?.("(max-width: 767px) and (pointer: coarse)").matches) return;

    let startY: number | null = null;
    let distance = 0;

    const onStart = (e: TouchEvent) => {
      startY = scroller.scrollTop <= 0 && !busyRef.current ? e.touches[0].clientY : null;
      distance = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || scroller.scrollTop > 0) {
        startY = dy <= 0 ? startY : null;
        distance = 0;
        setPull(0);
        return;
      }
      distance = Math.min(dy * 0.5, MAX_PULL);
      setPull(distance);
      if (e.cancelable) e.preventDefault(); // stop the native bounce while we show our own indicator
    };
    const onEnd = async () => {
      if (startY === null) return;
      startY = null;
      if (distance < TRIGGER) {
        setPull(0);
        return;
      }
      busyRef.current = true;
      setBusy(true);
      setPull(TRIGGER);
      try {
        await syncRef.current();
        emitRefresh();
      } finally {
        busyRef.current = false;
        setBusy(false);
        setPull(0);
      }
    };

    scroller.addEventListener("touchstart", onStart, { passive: true });
    scroller.addEventListener("touchmove", onMove, { passive: false });
    scroller.addEventListener("touchend", onEnd);
    scroller.addEventListener("touchcancel", onEnd);
    return () => {
      scroller.removeEventListener("touchstart", onStart);
      scroller.removeEventListener("touchmove", onMove);
      scroller.removeEventListener("touchend", onEnd);
      scroller.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const ready = pull >= TRIGGER;
  return (
    <span ref={anchor} className="contents md:hidden">
      <span
        role="status"
        aria-live="polite"
        className="fixed left-1/2 z-30 pointer-events-none top-[calc(4rem+env(safe-area-inset-top))]"
        style={{
          transform: `translate(-50%, ${pull - 48}px)`,
          opacity: pull > 8 ? 1 : 0,
          // follow the finger exactly; animate only the snap back and the loading hold
          transition: pull > 0 && !busy ? "none" : "transform 200ms ease, opacity 200ms ease",
        }}
      >
        <span className="clay-card clay-white w-10 h-10 rounded-full flex items-center justify-center text-[#1D5E4D]">
          <RefreshCw
            className={`w-4 h-4 ${busy ? "animate-spin" : ""}`}
            style={busy ? undefined : { transform: `rotate(${pull * 3}deg)`, opacity: ready ? 1 : 0.55 }}
          />
        </span>
        <span className="sr-only">{busy ? "Memuat ulang data" : ready ? "Lepas untuk memuat ulang" : ""}</span>
      </span>
    </span>
  );
}
