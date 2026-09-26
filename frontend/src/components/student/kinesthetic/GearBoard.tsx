import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { audioSynth } from "@/services/audioSynth";
import { RotateCw } from "@/components/ui/icons";
import { brief } from "./brief";
import InfoCard from "./InfoCard";
import StepNote, { type Step } from "./StepNote";

// "Roda gigi": each step is a gear. Turning the crank brings the machine to life gear by gear;
// turning it back rewinds the process. The motion mirrors the idea: every step drives the next.
const TURN_PER_STEP = 240; // degrees of cranking that bring the next gear to life
const TEETH = 10;

function gearPath(r: number, depth: number) {
  const points: string[] = [];
  const step = (Math.PI * 2) / TEETH;
  for (let i = 0; i < TEETH; i++) {
    const a = i * step;
    for (const [angle, radius] of [[a, r - depth], [a + step * 0.12, r], [a + step * 0.48, r], [a + step * 0.6, r - depth]]) {
      points.push(`${(radius * Math.cos(angle)).toFixed(1)},${(radius * Math.sin(angle)).toFixed(1)}`);
    }
  }
  return `M${points.join("L")}Z`;
}

export default function GearBoard({ steps, onProgress }: { steps: Step[]; onProgress?: (done: number, total: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const crank = useRef<SVGGElement>(null);
  const last = useRef<number | null>(null);
  const [width, setWidth] = useState(800);
  const [turned, setTurned] = useState(0); // total degrees cranked, never below 0
  const n = steps.length;
  const done = Math.min(n, Math.floor(turned / TURN_PER_STEP));
  const previous = useRef(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (done > previous.current) {
      if (done === n) audioSynth.playLevelUpSound();
      else audioSynth.playSuccessSound();
    }
    previous.current = done;
    setHidden(false); // a new step reached (or rewound to) brings its card back
    onProgress?.(done, n);
  }, [done, n, onProgress]);

  const vertical = width < 640;
  const r = vertical ? 40 : 50;
  const pitch = r * 1.86; // close enough for the teeth to interlock
  // Where the info card goes: beside the chain on wide boards, under it on medium ones, over the labels on phones.
  const chain = (n - 1) * pitch + 2 * r;
  const cardSide = !vertical && width - chain - 120 >= 300 ? "right" : vertical ? "under" : "below";
  const startX = cardSide === "right" ? 80 : Math.max(80, (width - (n - 1) * pitch) / 2);
  const centres = steps.map((_, i) => vertical
    ? { x: 70 + (i % 2 ? 14 : 0), y: 70 + i * pitch }
    : { x: startX + i * pitch, y: 150 + (i % 2 ? 14 : 0) });
  const chainBottom = 70 + (n - 1) * pitch + r + 30;
  const height = vertical ? chainBottom + 220 : cardSide === "below" ? 500 : 320;

  const angleAt = (event: ReactPointerEvent) => {
    const rect = crank.current!.getBoundingClientRect();
    return (Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180) / Math.PI;
  };
  const down = (event: ReactPointerEvent<SVGGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    last.current = angleAt(event);
  };
  const move = (event: ReactPointerEvent<SVGGElement>) => {
    if (last.current === null) return;
    const angle = angleAt(event);
    let delta = angle - last.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    last.current = angle;
    // clockwise moves the process forward, anticlockwise rewinds it
    setTurned(t => Math.max(0, Math.min(t + delta, n * TURN_PER_STEP + 720)));
  };
  const up = () => { last.current = null; };
  const rotation = (i: number) => (i % 2 ? -1 : 1) * Math.max(0, turned - i * TURN_PER_STEP) + (i % 2 ? 180 / TEETH : 0);
  const knob = r * 0.55;
  const crankAngle = (turned * Math.PI) / 180;

  return (
    <div className="space-y-4">
      <div ref={box} className="relative w-full select-none touch-none rounded-[26px] border border-[#E6E4EE] bg-[#F7F6FA] overflow-hidden" style={{ height }}>
        <svg width={width} height={height} className="absolute inset-0" role="img" aria-label="Mesin roda gigi proses">
          {steps.map((step, i) => {
            const c = centres[i];
            const alive = i < done || (i === done && turned > i * TURN_PER_STEP);
            return (
              <g key={i} transform={`translate(${c.x} ${c.y})`}>
                <g transform={`rotate(${rotation(i)})`} >
                  <path d={gearPath(r, r * 0.16)} fill={i < done ? "#D1EBE1" : alive ? "#FEE7B3" : "#F0EEF6"} stroke={i < done ? "#1D5E4D" : alive ? "#785308" : "#9195A8"} strokeOpacity={0.55} strokeWidth={2} strokeLinejoin="round" />
                  <circle r={r * 0.3} fill="#FFFFFF" />
                  <line x1={0} y1={-r * 0.3} x2={0} y2={-r * 0.62} stroke={i < done ? "#1D5E4D" : alive ? "#785308" : "#9195A8"} strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
                </g>
                {i < done
                  ? <path d={`M${-r * 0.13} 0 L ${-r * 0.03} ${r * 0.1} L ${r * 0.15} ${-r * 0.1}`} fill="none" stroke="#1D5E4D" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  : <text textAnchor="middle" dy="0.35em" fontSize={vertical ? 14 : 16} fontWeight={800} fill="#1C1E26">{i + 1}</text>}
              </g>
            );
          })}
          {/* the crank on the first gear */}
          <g ref={crank} transform={`translate(${centres[0].x} ${centres[0].y})`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            style={{ cursor: "grab", outline: "none" }} tabIndex={0} role="slider" aria-label="Engkol: putar searah jarum jam untuk menjalankan proses" aria-valuemin={0} aria-valuemax={n} aria-valuenow={done}
            onKeyDown={event => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") setTurned(t => t + TURN_PER_STEP / 3);
              if (event.key === "ArrowLeft" || event.key === "ArrowUp") setTurned(t => Math.max(0, t - TURN_PER_STEP / 3));
            }}>
            <circle r={r + 16} fill="transparent" />
            <line x1={0} y1={0} x2={knob * Math.cos(crankAngle - Math.PI / 2) * 1.6} y2={knob * Math.sin(crankAngle - Math.PI / 2) * 1.6} stroke="#1C1E26" strokeWidth={7} strokeLinecap="round" />
            <circle cx={knob * Math.cos(crankAngle - Math.PI / 2) * 1.6} cy={knob * Math.sin(crankAngle - Math.PI / 2) * 1.6} r={13} fill="#1C1E26" stroke="white" strokeWidth={3} />
          </g>
        </svg>

        {/* labels: title always, what the step does once its gear is running */}
        {steps.map((step, i) => {
          const c = centres[i];
          const style = vertical
            ? { left: c.x + r + 14, top: c.y, transform: "translateY(-50%)", width: width - c.x - r - 26 }
            : { left: c.x, top: i % 2 ? c.y - r - 12 : c.y + r + 12, transform: `translate(-50%, ${i % 2 ? "-100%" : "0"})`, width: Math.min(170, pitch * 1.7) };
          return (
            <div key={i} className={`absolute ${vertical ? "text-left" : "text-center"}`} style={style}>
              <p className={`text-[12px] sm:text-[13px] font-bold break-words ${i < done ? "text-[#1C1E26]" : "text-[#9195A8]"}`}>{step.title}</p>
              {i < done && <p className="mt-1 inline-block rounded-[8px] bg-[#D1EBE1] px-2 py-0.5 text-mini font-semibold text-[#1D5E4D]">{brief(step.caption, step.desc, 50)}</p>}
            </div>
          );
        })}

        {done > 0 && !hidden && (() => {
          const i = done - 1;
          const c = centres[i];
          const step = steps[i];
          let box: { left: number; top: number; width: number };
          if (cardSide === "right") {
            const left = centres[n - 1].x + r + 60;
            box = { left, top: 60, width: Math.min(340, width - left - 16) };
          } else if (cardSide === "below") {
            const w = Math.min(320, width - 16);
            box = { left: Math.max(8, Math.min(width - w - 8, c.x - w / 2)), top: 320, width: w };
          } else {
            box = { left: 8, top: chainBottom + 8, width: width - 16 };
          }
          return (
            <>
              {(
                // a thread from the gear that just came alive to what it did
                <svg className="absolute inset-0 pointer-events-none" width={width} height={height} aria-hidden="true">
                  <path d={cardSide === "right"
                    ? `M${c.x} ${c.y} C ${c.x + 60} ${c.y - 80}, ${box.left - 60} ${box.top + 40}, ${box.left} ${box.top + 40}`
                    : cardSide === "under"
                      ? `M${width - 34} ${c.y} L ${width - 14} ${c.y} L ${width - 14} ${box.top}` // down the edge, clear of the gears and labels
                      : `M${c.x} ${c.y + r} L ${box.left + box.width / 2} ${box.top}`}
                    fill="none" stroke="#21518A" strokeWidth={3} strokeDasharray="6 6" />
                  <circle cx={c.x} cy={c.y} r={r * 0.36} fill="none" stroke="#21518A" strokeWidth={3} />
                </svg>
              )}
              <InfoCard left={box.left} top={box.top} width={box.width} maxHeight={cardSide === "under" ? 200 : 240}
                badge={`Langkah ${i + 1} berjalan`} title={step.title} onClose={() => setHidden(true)}>
                <p className="font-semibold text-[#1D5E4D]">{brief(step.caption, step.desc, 70)}</p>
                <p>{step.desc}</p>
                {i + 1 < n && <p className="text-mini font-semibold text-[#595F72]">Putar terus untuk menggerakkan “{steps[i + 1].title}”</p>}
              </InfoCard>
            </>
          );
        })()}

        {turned === 0 && (
          <p className="absolute flex items-center gap-2 text-[13px] font-semibold text-[#595F72] pointer-events-none" style={vertical ? { left: 130, top: 20 } : { left: centres[0].x - 40, top: 30 }}><RotateCw className="w-4 h-4" />Putar engkolnya searah jarum jam</p>
        )}
        {done > 0 && done < n && <p className={`absolute ${vertical ? "top-2" : "bottom-2"} right-3 text-mini font-bold text-[#9195A8] pointer-events-none`}>Putar balik untuk mundur</p>}
      </div>
      <StepNote summaryOnly steps={steps} done={done} finishedText="Mesin prosesnya berjalan penuh. Setiap langkah menggerakkan langkah berikutnya." onRestart={() => setTurned(0)} />
    </div>
  );
}
