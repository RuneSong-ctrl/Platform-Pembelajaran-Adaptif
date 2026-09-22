import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { Diagram, DiagramNode } from "@/lib/mermaidDiagram";
import { audioSynth } from "@/services/audioSynth";
import { Hand } from "@/components/ui/icons";
import { brief } from "./brief";
import InfoCard from "./InfoCard";

// "Bongkar": a concept is a ball the student pulls apart into its parts, and pushes back together.
// The gesture mirrors the idea (a whole made of parts); nothing can be done wrong.
const PULL = 90; // px of pulling needed to break a concept open
const TAP = 6; // px of movement below which a press counts as a tap
const MERGE_MS = 380;

type Pos = { x: number; y: number; angle: number };
type Props = { diagram: Diagram; selected: string | null; onSelect: (id: string | null) => void; onProgress?: (found: number, total: number, whole: boolean) => void };

function layout(rootId: string, children: Map<string, DiagramNode[]>, open: Set<string>): Map<string, Pos> {
  const pos = new Map<string, Pos>([[rootId, { x: 0, y: 0, angle: -Math.PI / 2 }]]);
  const place = (id: string, depth: number) => {
    if (!open.has(id)) return;
    const kids = children.get(id) ?? [];
    const p = pos.get(id)!;
    kids.forEach((kid, i) => {
      let angle: number;
      let r: number;
      if (depth === 0) {
        angle = -Math.PI / 2 + (2 * Math.PI * i) / kids.length;
        r = 1;
      } else {
        // grandchildren fan outwards, away from the centre
        const spread = Math.min(Math.PI * 0.95, kids.length * 0.6);
        angle = p.angle + (kids.length === 1 ? 0 : -spread / 2 + (spread * i) / (kids.length - 1));
        r = 0.85;
      }
      pos.set(kid.id, { x: p.x + r * Math.cos(angle), y: p.y + r * Math.sin(angle), angle });
      place(kid.id, depth + 1);
    });
  };
  place(rootId, 0);
  return pos;
}

// Small screens: only the concept being looked into and its parts, so bubbles never pile up.
function focusLayout(focusId: string, children: Map<string, DiagramNode[]>, open: Set<string>): Map<string, Pos> {
  const pos = new Map<string, Pos>([[focusId, { x: 0, y: 0, angle: -Math.PI / 2 }]]);
  if (!open.has(focusId)) return pos;
  const kids = children.get(focusId) ?? [];
  kids.forEach((kid, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / kids.length;
    pos.set(kid.id, { x: Math.cos(angle), y: Math.sin(angle), angle });
  });
  return pos;
}

export default function BongkarBoard({ diagram, selected, onSelect, onProgress }: Props) {
  const nodes = diagram.nodes;
  const root = nodes.find(node => !node.parent) ?? nodes[0];
  const children = useMemo(() => {
    const map = new Map<string, DiagramNode[]>();
    for (const node of nodes) if (node.parent) map.set(node.parent, [...(map.get(node.parent) ?? []), node]);
    return map;
  }, [nodes]);
  const byId = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);

  const [open, setOpen] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState<Set<string>>(new Set());
  const [found, setFound] = useState<Set<string>>(new Set([root.id]));
  const [whole, setWhole] = useState(false);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);
  const [focus, setFocus] = useState(root.id);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [fresh, setFresh] = useState(false);
  const [full, setFull] = useState(false);
  const press = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { onProgress?.(found.size, nodes.length, whole); }, [found, nodes.length, onProgress, whole]);

  // Nodes still flying back into their parent keep their place until the animation ends.
  const shownOpen = useMemo(() => new Set([...open, ...merging]), [open, merging]);
  const compact = width < 640;
  const units = useMemo(() => (compact ? focusLayout(focus, children, shownOpen) : layout(root.id, children, shownOpen)),
    [compact, focus, root.id, children, shownOpen]);
  const visible = [...units.keys()].map(id => byId.get(id)!);
  const trail: DiagramNode[] = [];
  for (let id: string | null = focus; id; id = byId.get(id)?.parent ?? null) trail.unshift(byId.get(id)!);
  const bubble = compact ? 84 : 132; // bubble width in px
  const xs = [...units.values()].map(p => p.x);
  const ys = [...units.values()].map(p => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const margin = bubble / 2 + 8;
  const scale = Math.min(compact ? 150 : 210, (width - 2 * margin) / Math.max(maxX - minX, 0.01));
  const top = compact ? 34 : 10; // room for the breadcrumb on small screens
  const zoned = width < 900; // phones and tablets: the info card gets its own strip under the map, so it never hides a part
  const CARD_ZONE = zoned ? 210 : 0;
  const mapHeight = Math.max(compact ? 320 : 360, (maxY - minY) * scale + 2 * margin + top + 10);
  const height = mapHeight + CARD_ZONE;
  const offsetX = margin - minX * scale + (width - 2 * margin - (maxX - minX) * scale) / 2;
  const offsetY = margin + top - minY * scale;
  const px = (id: string) => {
    const p = units.get(id)!;
    return { x: offsetX + p.x * scale, y: offsetY + p.y * scale };
  };
  const isParentOf = (id: string) => (children.get(id)?.length ?? 0) > 0;

  const openNode = (id: string) => {
    const kids = children.get(id) ?? [];
    setOpen(prev => new Set(prev).add(id));
    setFound(prev => new Set([...prev, ...kids.map(kid => kid.id)]));
    setWhole(false);
    setFocus(id);
    onSelect(id);
    audioSynth.playClickSound();
    if (found.size + kids.filter(kid => !found.has(kid.id)).length === nodes.length) setTimeout(() => audioSynth.playSuccessSound(), 250);
  };
  const mergeInto = (parentId: string) => {
    // the parent and every open branch under it close together
    const closing = new Set<string>();
    const walk = (id: string) => { if (open.has(id)) { closing.add(id); (children.get(id) ?? []).forEach(kid => walk(kid.id)); } };
    walk(parentId);
    setMerging(closing);
    setOpen(prev => new Set([...prev].filter(id => !closing.has(id))));
    onSelect(parentId);
    audioSynth.playClickSound();
    setTimeout(() => {
      setMerging(new Set());
      // on small screens step back out to the level where the rebuilt concept sits
      setFocus(byId.get(parentId)?.parent ?? parentId);
    }, MERGE_MS);
    if (parentId === root.id && found.size === nodes.length) {
      setWhole(true);
      setTimeout(() => audioSynth.playLevelUpSound(), MERGE_MS);
    }
  };

  const down = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { id, x: event.clientX, y: event.clientY, moved: false };
  };
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    if (!p) return;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    if (Math.hypot(dx, dy) > TAP) p.moved = true;
    if (p.moved) setDrag({ id: p.id, dx, dy });
  };
  const up = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    press.current = null;
    setDrag(null);
    if (!p) return;
    const { id } = p;
    const node = byId.get(id)!;
    if (!p.moved) {
      onSelect(id);
      if (isParentOf(id) && !open.has(id)) setNudge(id);
      return;
    }
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    if (node.parent && units.has(node.parent)) {
      const from = px(id);
      const to = px(node.parent);
      if (Math.hypot(from.x + dx - to.x, from.y + dy - to.y) < bubble * 0.6) return mergeInto(node.parent);
    }
    if (isParentOf(id) && Math.hypot(dx, dy) >= PULL) {
      if (!open.has(id)) openNode(id);
      else if (compact && id !== focus) { setFocus(id); onSelect(id); } // already open: look inside it again
    }
  };
  const key = (id: string, keyName: string) => {
    // keyboard: Enter breaks a concept open, Backspace puts its parent back together
    if (keyName === "Enter" && isParentOf(id) && !open.has(id)) openNode(id);
    if (keyName === "Backspace" && byId.get(id)?.parent) mergeInto(byId.get(id)!.parent!);
  };

  // The info card belongs to the selected part, once it is out in the open (a closed concept must be pulled first).
  const cardNode = selected && units.has(selected) && !(isParentOf(selected) && !open.has(selected)) && !merging.size ? byId.get(selected)! : null;
  useEffect(() => {
    setFull(false);
    if (!cardNode) return;
    setFresh(!learned.has(cardNode.id));
    setLearned(prev => (prev.has(cardNode.id) ? prev : new Set(prev).add(cardNode.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardNode?.id]);
  const cardWidth = compact ? width - 16 : zoned ? 360 : 280;
  const card = cardNode && (() => {
    const at = px(cardNode.id);
    const half = (cardNode.id === root.id ? bubble * 1.15 : bubble) / 2;
    if (zoned) return { left: Math.max(8, Math.min(width - cardWidth - 8, at.x - cardWidth / 2)), top: mapHeight + 6, bottom: undefined, from: at };
    // Try beside, above, below and the board corners; keep the spot that hides the fewest parts.
    const CARD_H = 240;
    const clampBox = (l: number, t: number) => ({ left: Math.max(8, Math.min(width - cardWidth - 8, l)), top: Math.max(8, Math.min(height - CARD_H - 8, t)) });
    const nodeH = cardNode.id === root.id ? bubble * 1.15 : Math.max(bubble * 0.62, 60);
    const candidates = [
      clampBox(at.x + half + 14, at.y - 50), clampBox(at.x - half - 14 - cardWidth, at.y - 50),
      clampBox(at.x - cardWidth / 2, at.y + nodeH / 2 + 14), clampBox(at.x - cardWidth / 2, at.y - nodeH / 2 - 14 - CARD_H),
      clampBox(8, 8), clampBox(width, 8), clampBox(8, height), clampBox(width, height),
    ];
    const hidden = (box: { left: number; top: number }) => visible.reduce((sum, other) => {
      const o = px(other.id);
      const w = (other.id === root.id ? bubble * 1.15 : bubble) / 2;
      const h = (other.id === root.id ? bubble * 1.15 : Math.max(bubble * 0.62, 60)) / 2;
      const dx = Math.min(box.left + cardWidth, o.x + w) - Math.max(box.left, o.x - w);
      const dy = Math.min(box.top + CARD_H, o.y + h) - Math.max(box.top, o.y - h);
      return sum + (dx > 0 && dy > 0 ? dx * dy * (other.id === cardNode.id ? 10 : 1) : 0);
    }, 0);
    const score = (box: { left: number; top: number }) => hidden(box) + Math.hypot(box.left + cardWidth / 2 - at.x, box.top + CARD_H / 2 - at.y) * 2;
    const best = candidates.reduce((a, b) => (score(b) < score(a) ? b : a));
    return { ...best, bottom: undefined, from: at };
  })();

  useEffect(() => {
    if (!nudge) return;
    const timer = setTimeout(() => setNudge(null), 1600);
    return () => clearTimeout(timer);
  }, [nudge]);

  return (
    <div ref={box} className="relative w-full select-none touch-none overflow-hidden rounded-[26px] bg-[#F7F6FA] border border-[#E6E4EE]" style={{ height }}
      onPointerDown={event => { if (event.target === event.currentTarget) onSelect(null); }}>
      <style>{`
        @keyframes kin-pop { from { transform: translate(calc(-50% + var(--fx)), calc(-50% + var(--fy))) scale(.2); opacity: 0 } 70% { opacity: 1 } to { transform: translate(-50%, -50%) scale(1); opacity: 1 } }
        @keyframes kin-merge { from { transform: translate(-50%, -50%) scale(1); opacity: 1 } to { transform: translate(calc(-50% + var(--fx)), calc(-50% + var(--fy))) scale(.2); opacity: 0 } }
        @keyframes kin-wiggle { 0%,100% { rotate: 0deg } 25% { rotate: -6deg } 75% { rotate: 6deg } }
        @keyframes kin-line { from { stroke-dashoffset: 400 } to { stroke-dashoffset: 0 } }
        .kin-node { position: absolute; transform: translate(-50%, -50%); transition: left .45s ease, top .45s ease; }
        .kin-pop { animation: kin-pop .5s cubic-bezier(.2,1.4,.4,1) both; }
        .kin-merge { animation: kin-merge ${MERGE_MS}ms ease-in both; }
        .kin-wiggle { animation: kin-wiggle .35s ease 3; }
      `}</style>

      <svg className="absolute inset-0 pointer-events-none" width={width} height={height} aria-hidden="true">
        {visible.filter(node => node.parent && units.has(node.parent)).map(node => {
          const a = px(node.parent!);
          const b = px(node.id);
          const pulled = drag?.id === node.id ? drag : null;
          return <line key={node.id} x1={a.x} y1={a.y} x2={b.x + (pulled?.dx ?? 0)} y2={b.y + (pulled?.dy ?? 0)}
            stroke={merging.has(node.parent!) ? "transparent" : "#9195A8"} strokeWidth={2} strokeDasharray="400" style={{ animation: "kin-line .6s ease both", transition: "all .45s ease" }} />;
        })}
      </svg>

      {visible.map(node => {
        const at = px(node.id);
        const parentAt = node.parent && units.has(node.parent) ? px(node.parent) : at;
        const closedParent = isParentOf(node.id) && !open.has(node.id);
        const isRoot = node.id === root.id;
        const pulled = drag?.id === node.id ? drag : null;
        const distance = pulled ? Math.hypot(pulled.dx, pulled.dy) : 0;
        const tension = closedParent ? Math.min(1, distance / PULL) : 0;
        const leaving = node.parent ? merging.has(node.parent) : false;
        const kids = children.get(node.id)?.length ?? 0;
        const style = { left: at.x, top: at.y, "--fx": `${parentAt.x - at.x}px`, "--fy": `${parentAt.y - at.y}px`, zIndex: pulled ? 30 : isRoot ? 20 : 10 } as CSSProperties;
        return (
          <div key={node.id} className={`kin-node ${leaving ? "kin-merge" : isRoot ? "" : "kin-pop"}`} style={style}>
            <button type="button"
              onPointerDown={event => down(event, node.id)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { press.current = null; setDrag(null); }}
              onKeyDown={event => key(node.id, event.key)}
              aria-label={`${node.label}${closedParent ? `. Berisi ${kids} bagian, tarik untuk membongkar` : ""}`}
              aria-pressed={selected === node.id}
              className={`relative block rounded-full text-center font-bold leading-tight cursor-grab active:cursor-grabbing outline-none focus-visible:ring-4 focus-visible:ring-[#21518A]/35 ${nudge === node.id ? "kin-wiggle" : ""} ${
                isRoot ? "clay-dark" : closedParent ? "clay-butter" : isParentOf(node.id) ? "clay-white" : "clay-sky"
              } ${selected === node.id ? "ring-4 ring-[#21518A]/35" : ""}`}
              style={{
                width: isRoot ? bubble * 1.15 : bubble, minHeight: isRoot ? bubble * 1.15 : bubble * 0.62, padding: compact ? "8px 6px" : "12px 10px",
                fontSize: compact ? 11 : isRoot ? 15 : 13,
                transform: pulled ? `translate(${pulled.dx}px, ${pulled.dy}px) scale(${1 + tension * 0.18})` : undefined,
                transition: pulled ? "none" : "transform .35s cubic-bezier(.2,1.5,.4,1)",
              }}>
              {closedParent && tension > 0 && (
                // cracks appear as the concept is stretched
                <span aria-hidden="true" className="absolute inset-[-6px] rounded-full border-4 border-dashed border-[#785308]/50" style={{ opacity: tension, rotate: `${tension * 90}deg` }} />
              )}
              <span className="relative break-words">{node.label}</span>
              {closedParent && <span className="relative block mt-1 text-[10px] font-bold opacity-80">{tension >= 1 ? "Lepas!" : `${kids} bagian di dalam`}</span>}
            </button>
          </div>
        );
      })}

      {cardNode && card && (
        // a thread from the touched part to its card
        <svg className="absolute inset-0 pointer-events-none" width={width} height={height} aria-hidden="true">
          {zoned
            ? <path d={`M${card.from.x} ${card.from.y} L ${Math.max(card.left + 20, Math.min(card.left + cardWidth - 20, card.from.x))} ${mapHeight + 6}`} stroke="#21518A" strokeWidth={3} strokeDasharray="6 6" />
            : <path d={`M${card.from.x} ${card.from.y} L ${Math.max(card.left, Math.min(card.left + cardWidth, card.from.x))} ${Math.max(card.top ?? 0, Math.min((card.top ?? 0) + 120, card.from.y))}`} stroke="#21518A" strokeWidth={3} strokeDasharray="6 6" />}
        </svg>
      )}
      {zoned && !cardNode && (
        <p className="absolute inset-x-0 text-center text-xs font-bold text-[#9195A8] pointer-events-none" style={{ top: mapHeight + 70 }}>Ketuk sebuah bagian untuk membuka infonya di sini</p>
      )}
      {cardNode && card && (
        <InfoCard left={card.left} top={card.top} bottom={card.bottom} width={cardWidth} maxHeight={zoned ? CARD_ZONE - 12 : height - 16} title={cardNode.label}
          badge={fresh ? "Info baru" : undefined} onClose={() => onSelect(null)}>
          {isParentOf(cardNode.id) ? (
            <>
              <p>{brief(undefined, cardNode.detail, 150)}</p>
              <p className="text-xs font-bold text-[#595F72]">Berisi {children.get(cardNode.id)!.length} bagian:</p>
              <div className="flex flex-wrap gap-1">
                {children.get(cardNode.id)!.map(kid => <span key={kid.id} className="rounded-full bg-[#D2E5FA] px-2.5 py-0.5 text-[11px] font-semibold text-[#21518A]">{kid.label}</span>)}
              </div>
            </>
          ) : (
            <>
              <p>{full ? cardNode.detail : brief(undefined, cardNode.detail, 200)}</p>
              {cardNode.example && <p className="rounded-[12px] bg-[#FFF6DF] px-3 py-2 text-[#785308]"><b>Contoh:</b> {full ? cardNode.example : brief(undefined, cardNode.example, 130)}</p>}
            </>
          )}
          {(cardNode.detail.length > 150 || (cardNode.example?.length ?? 0) > 130) && (
            <button type="button" onClick={() => setFull(!full)} className="text-xs font-bold text-[#21518A] cursor-pointer">{full ? "Ringkas lagi" : "Baca lengkap"}</button>
          )}
        </InfoCard>
      )}

      {open.size === 0 && !whole && (
        <p className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 text-[13px] font-semibold text-[#595F72] pointer-events-none"><Hand className="w-4 h-4" />Tarik bola besar ini menjauh sampai pecah</p>
      )}
      {compact && trail.length > 1 && (
        <nav aria-label="Posisi di peta" className="absolute top-2 inset-x-2 z-40 flex flex-wrap items-center gap-1 text-[11px] font-bold">
          {trail.map((step, i) => (
            <span key={step.id} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true" className="text-[#9195A8]">›</span>}
              {i < trail.length - 1
                ? <button type="button" onClick={() => { setFocus(step.id); onSelect(step.id); }} className="clay-pill bg-white px-2.5 py-0.5 text-[#21518A] cursor-pointer">{step.label}</button>
                : <span className="text-[#475569]">{step.label}</span>}
            </span>
          ))}
        </nav>
      )}
      {compact && focus !== root.id && open.has(focus) && (
        <p className="absolute bottom-3 inset-x-0 text-center text-[11px] font-bold text-[#595F72] pointer-events-none">Dorong bagian ke tengah untuk memasangnya kembali</p>
      )}
      {nudge && <p className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2 text-[12px] font-semibold text-[#785308] pointer-events-none"><Hand className="w-4 h-4" />Tarik bolanya menjauh, jangan diketuk</p>}
    </div>
  );
}
