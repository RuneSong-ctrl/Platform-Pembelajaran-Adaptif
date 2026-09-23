import type { ReactNode } from "react";
import { X } from "@/components/ui/icons";

// The "reward" of a gesture: what was just uncovered, shown right next to the thing the student worked on.
export default function InfoCard({ left, top, bottom, width, maxHeight, badge, title, onClose, children }: {
  left: number; top?: number; bottom?: number; width: number; maxHeight?: number; badge?: string; title: string; onClose?: () => void; children: ReactNode;
}) {
  return (
    <div key={title} className="kin-card clay-white absolute z-50 rounded-[18px] p-3.5 text-left overflow-y-auto"
      style={{ left, top, bottom, width, maxHeight }} role="note" aria-live="polite" onPointerDown={event => event.stopPropagation()}>
      <style>{`
        @keyframes kin-card { from { transform: scale(.6) translateY(8px); opacity: 0 } to { transform: none; opacity: 1 } }
        .kin-card { animation: kin-card .32s cubic-bezier(.2,1.4,.4,1) both; transform-origin: top center; }
      `}</style>
      <div className="flex items-start justify-between gap-2">
        {badge ? <span className="text-[10px] font-bold uppercase tracking-wider text-[#785308] bg-[#FEE7B3] rounded-[8px] px-2 py-0.5">{badge}</span> : <span />}
        {onClose && <button type="button" onClick={onClose} aria-label="Tutup info" className="-mt-1 -mr-1 w-7 h-7 rounded-full flex items-center justify-center text-[#595F72] hover:bg-[#F0EEF6] cursor-pointer"><X className="w-4 h-4" /></button>}
      </div>
      <p className="mt-1.5 text-[14px] font-bold text-[#1C1E26] leading-5 break-words">{title}</p>
      <div className="mt-1.5 space-y-2 text-[13px] leading-[19px] text-[#475569]">{children}</div>
    </div>
  );
}
