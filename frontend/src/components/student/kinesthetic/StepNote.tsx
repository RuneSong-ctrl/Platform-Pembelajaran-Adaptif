import { useState } from "react";
import { CheckCircle2, ChevronRight, RotateCcw } from "@/components/ui/icons";
import { brief } from "./brief";

export type Step = { title: string; desc: string; caption?: string };

// What the latest step does, in one line; the full text stays optional.
export default function StepNote({ steps, done, finishedText, onRestart, summaryOnly = false }: { steps: Step[]; done: number; finishedText: string; onRestart: () => void; summaryOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  if (done === 0 || (summaryOnly && done < steps.length)) return null;
  const step = steps[done - 1];
  return (
    <div className="clay-mint rounded-[26px] p-4 space-y-3" aria-live="polite">
      {done === steps.length ? (
        <>
          <p className="flex items-start gap-2 text-[14px] font-bold"><CheckCircle2 className="w-5 h-5 shrink-0" />{finishedText}</p>
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="rounded-[12px] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#1D5E4D]">{i + 1}. {s.title}</span>
                {i < steps.length - 1 && <ChevronRight aria-hidden="true" className="w-4 h-4" />}
              </li>
            ))}
          </ol>
          <button type="button" onClick={onRestart} className="clay-btn clay-btn-white px-4 py-2 text-[13px] font-bold inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" />Ulangi dari awal</button>
        </>
      ) : (
        <>
          <p className="text-sm text-[#475569]">Langkah {done}: <b className="text-[#1C1E26]">{step.title}</b>: {brief(step.caption, step.desc, 80)}</p>
          <button type="button" onClick={() => setOpen(!open)} className="text-xs font-bold text-[#21518A] cursor-pointer">{open ? "Tutup penjelasan" : "Baca penjelasan lengkap (opsional)"}</button>
          {open && <p className="text-sm text-[#475569]">{step.desc}</p>}
        </>
      )}
    </div>
  );
}
