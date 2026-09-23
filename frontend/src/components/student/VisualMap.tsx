import React, { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { audioSynth } from "@/services/audioSynth";
import { Download, Eye, Layers, Maximize2, Network, Sparkles, X, ZoomIn, ZoomOut } from "@/components/ui/icons";
import { renderedLabel, toMermaid, type Diagram, type DiagramNode } from "@/lib/mermaidDiagram";
import InfographicPoster, { type PosterArt } from "./InfographicPoster";
import type { Infographic } from "./SourcedInfographic";
import type { SourceRef } from "./UnitVisual";

const PASTEL: [string, string][] = [["#D2E5FA", "#21518A"], ["#D1EBE1", "#1D5E4D"], ["#E3DBF8", "#4B3B7A"], ["#FEE7B3", "#785308"], ["#FCD9D7", "#852C28"]];
const branchColours = Object.fromEntries(Array.from({ length: 12 }, (_, i) => {
  const [base, dark] = PASTEL[i % PASTEL.length];
  return [[`cScale${i}`, base], [`cScaleLabel${i}`, dark], [`cScaleInv${i}`, dark]];
}).flat());

type Props = { info: Infographic; sources: (refs: SourceRef[]) => ReactNode; art?: PosterArt | null };
type Tab = "image" | "diagram" | "poster";
const kindLabel = { mindmap: "Peta pikiran", flowchart: "Diagram alur", timeline: "Garis waktu" };

let mermaidReady: Promise<typeof import("mermaid").default> | null = null;
// Mermaid is large, so it is only loaded when a visual learner opens a diagram.
function loadMermaid() {
  mermaidReady ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      htmlLabels: false, // plain SVG text keeps PNG export possible
      fontFamily: "'Plus Jakarta Sans', Inter, Arial, sans-serif",
      themeVariables: {
        primaryColor: "#D2E5FA", primaryBorderColor: "#21518A", primaryTextColor: "#1C1E26", lineColor: "#595F72", fontSize: "16px",
        // mindmap branches: the pastel tokens in a fixed order instead of Mermaid's rainbow; the root matches the dark clay centre
        ...branchColours, git0: "#1C1E26", gitBranchLabel0: "#FFFFFF",
      },
      themeCSS: ".mindmap-node rect, .node rect { rx: 12px; ry: 12px; }",
      flowchart: { htmlLabels: false, curve: "basis" },
    });
    return mermaid;
  });
  return mermaidReady;
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copies the SVG with every <image> embedded, so downloads work offline and PNG conversion can load them. */
async function selfContained(svg: SVGSVGElement): Promise<string> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  await Promise.all(Array.from(copy.querySelectorAll("image")).map(async image => {
    const href = image.getAttribute("href");
    if (!href || href.startsWith("data:")) return;
    const blob = await (await fetch(href)).blob();
    const data = await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
    image.setAttribute("href", data);
  }));
  return new XMLSerializer().serializeToString(copy);
}

async function svgToPng(svg: SVGSVGElement, name: string) {
  const text = await selfContained(svg);
  const box = svg.viewBox.baseVal;
  const width = box?.width || svg.getBoundingClientRect().width;
  const height = box?.height || svg.getBoundingClientRect().height;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
  await image.decode();
  const canvas = Object.assign(document.createElement("canvas"), { width: width * 2, height: height * 2 });
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => blob && download(name, blob), "image/png");
}

export default function VisualMap({ info, sources, art = null }: Props) {
  const diagram = info.diagram ?? null;
  const hasArt = Boolean(art?.hero || (art?.icons && Object.keys(art.icons).length));
  // With AI artwork, the illustrated poster replaces the plain poster tab.
  const tabs: Tab[] = [...(hasArt ? ["image" as const] : []), ...(diagram ? ["diagram" as const] : []), ...(hasArt ? [] : ["poster" as const])];
  const [chosen, setChosen] = useState<Tab | null>(null);
  // The AI picture leads when it exists; a picture finishing later is shown without resetting the student's choice.
  const tab: Tab = chosen && tabs.includes(chosen) ? chosen : tabs[0];
  const setTab = setChosen;
  const [zoom, setZoom] = useState(100);
  const [full, setFull] = useState(false);
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<DiagramNode | null>(null);
  const diagramBox = useRef<HTMLDivElement>(null);
  const posterRef = useRef<SVGSVGElement>(null);
  const renderId = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const fileBase = info.title.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 60) || "materi";

  useEffect(() => {
    if (!diagram) return;
    let active = true;
    setFailed(false); setSvg(""); setSelected(null);
    loadMermaid()
      .then(mermaid => mermaid.render(renderId, toMermaid(diagram)))
      .then(result => { if (active) setSvg(result.svg); })
      .catch(error => { console.warn("[VisualMap] diagram render failed", error); if (active) setFailed(true); });
    return () => { active = false; };
  }, [diagram, renderId]);

  const choose = (node: DiagramNode) => { audioSynth.playClickSound(); setSelected(node); };

  useEffect(() => {
    if (!full) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setFull(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const currentSvg = (): SVGSVGElement | null =>
    tab === "diagram" ? diagramBox.current?.querySelector("svg") ?? null : posterRef.current;
  const saveSvg = () => {
    const element = currentSvg();
    if (!element) return;
    audioSynth.playSuccessSound();
    void selfContained(element)
      .then(text => download(`${fileBase}_${tab}.svg`, new Blob([text], { type: "image/svg+xml" })))
      .catch(() => undefined);
  };
  const savePng = () => {
    const element = currentSvg();
    if (element) void svgToPng(element, `${fileBase}_${tab}.png`).catch(() => undefined);
  };
  const tabLabel = (value: Tab) => (value === "image" ? "Infografis AI" : value === "diagram" && diagram ? kindLabel[diagram.kind] : "Poster");

  const outline = diagram && (
    <details className="rounded-2xl border border-[#E6E4EE] bg-white p-4" open={failed}>
      <summary className="cursor-pointer text-sm font-bold text-[#475569]">Lihat diagram sebagai daftar</summary>
      <ul className="mt-2 space-y-2 text-sm">
        {diagram.nodes.map(node => {
          const depth = diagram.kind === "mindmap" ? depthOf(node, diagram) : 0;
          return (
            <li key={node.id} style={{ marginLeft: depth * 16 }}>
              <button type="button" className="text-left font-semibold text-[#1C1E26] underline-offset-2 hover:underline" onClick={() => setSelected(node)}>
                {node.label}
              </button>
              {node.detail && <span className="text-[#475569]">: {node.detail}</span>}
            </li>
          );
        })}
        {diagram.kind === "flowchart" && diagram.edges.map((edge, i) => (
          <li key={`e${i}`} className="text-[#475569]">
            {labelOf(diagram, edge.source)} → {edge.label ? `${edge.label} → ` : ""}{labelOf(diagram, edge.target)}
          </li>
        ))}
      </ul>
    </details>
  );

  const canvas = (fullscreen: boolean) => (
    <div className={`rounded-2xl bg-white border border-[#E6E4EE] overflow-auto ${fullscreen ? "flex-1" : "max-h-[75vh]"}`}>
      {/* Diagrams keep a readable minimum width; on phones the box scrolls instead of shrinking the text. */}
      <div style={{ width: `${zoom}%`, minWidth: tab === "diagram" ? `${7.2 * zoom}px` : "100%" }} className="mx-auto p-3 sm:p-5 transition-[width]">
        {tab === "image" ? (
          <InfographicPoster ref={fullscreen ? undefined : posterRef} info={info} art={art} />
        ) : tab === "diagram" ? (
          failed ? (
            <p className="p-6 text-sm text-[#475569]">Diagram belum dapat digambar di perangkat ini. Lihat versi daftar di bawah.</p>
          ) : svg && diagram ? (
            <MermaidCanvas svg={svg} diagram={diagram} selectedId={selected?.id ?? null} onSelect={choose}
              boxRef={fullscreen ? undefined : diagramBox} />
          ) : (
            <p role="status" className="p-6 text-sm text-[#475569]">Menggambar diagram…</p>
          )
        ) : (
          <InfographicPoster ref={fullscreen ? undefined : posterRef} info={info} />
        )}
      </div>
    </div>
  );

  const toolbar = (fullscreen: boolean) => (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.length > 1 && (
        <div className="flex items-center bg-[#F0EEF6] p-1 rounded-2xl border border-black/5" role="tablist" aria-label="Bentuk visual">
          {tabs.map(value => (
            <button key={value} type="button" role="tab" aria-selected={tab === value}
              onClick={() => { audioSynth.playClickSound(); setTab(value); setZoom(100); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${tab === value ? "bg-[#21518A] text-white" : "text-[#21518A] hover:bg-[#D2E5FA]"}`}>
              {value === "image" ? <Sparkles className="w-3.5 h-3.5" /> : value === "diagram" ? <Layers className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {tabLabel(value)}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center bg-[#F7F6FA] rounded-xl border border-black/5 p-0.5">
        <button type="button" aria-label="Perkecil" disabled={zoom <= 60} onClick={() => setZoom(z => Math.max(60, z - 20))} className="p-2 rounded-lg disabled:opacity-40 cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
        <button type="button" aria-label="Ukuran semula" onClick={() => setZoom(100)} className="px-2 py-1 text-[11px] font-bold text-[#21518A] cursor-pointer">{zoom}%</button>
        <button type="button" aria-label="Perbesar" disabled={zoom >= 250} onClick={() => setZoom(z => Math.min(250, z + 30))} className="p-2 rounded-lg disabled:opacity-40 cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
      </div>
      {!fullscreen && (
        <button type="button" onClick={() => { audioSynth.playClickSound(); setFull(true); }} className="px-3 py-2 rounded-xl bg-[#F0EEF6] text-[#4B3B7A] text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          <Maximize2 className="w-3.5 h-3.5" />Layar penuh
        </button>
      )}
      <button type="button" onClick={saveSvg} className="px-3 py-2 rounded-xl bg-[#1C1E26] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Download className="w-3.5 h-3.5" />SVG</button>
      <button type="button" onClick={savePng} className="px-3 py-2 rounded-xl bg-[#1C1E26] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Download className="w-3.5 h-3.5" />PNG</button>
    </div>
  );

  return (
    <section className="space-y-4 min-w-0" aria-label="Peta visual materi">
      <div className="clay-card p-4 sm:p-5 space-y-4">
        <div className="space-y-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-[8px] bg-[#D1EBE1] text-[#1D5E4D]"><Network className="w-3.5 h-3.5" />Peta visual materi</span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1C1E26] mt-2 break-words">{tab === "diagram" && diagram ? diagram.title : info.title}</h2>
            <p className="text-xs text-[#595F72] mt-0.5">
              {tab === "image"
                ? "Ilustrasi dan ikon dibuat AI; semua tulisan diambil dari materi guru. Bisa diunduh dan dicetak."
                : tab === "diagram"
                  ? "Klik kotak mana pun untuk melihat penjelasan dan sumbernya. Di layar kecil, geser diagram di dalam kotaknya."
                  : "Ringkasan satu halaman; bisa diunduh dan dicetak."}
            </p>
          </div>
          {toolbar(false)}
        </div>
        {tab === "diagram" && diagram ? (
          // The explanation panel is always present below the full-width map: choosing a node only changes its
          // content, never moves the map, and never covers any node (a floating panel hid nodes under it).
          <div className="space-y-3">
            {canvas(false)}
            <NodeDetail diagram={diagram} node={selected} onSelect={choose} onClose={() => setSelected(null)} sources={sources} />
          </div>
        ) : canvas(false)}
        {tab === "diagram" && outline}
      </div>

      {full && (
        <div className="fixed inset-0 z-50 bg-[#1C1E26] flex flex-col gap-3 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Peta visual layar penuh">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl p-2">
            {toolbar(true)}
            <button type="button" aria-label="Tutup layar penuh" onClick={() => setFull(false)} className="p-2 rounded-xl bg-[#F0EEF6] cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          {canvas(true)}
        </div>
      )}
    </section>
  );
}

function NodeDetail({ diagram, node, onSelect, onClose, sources }: {
  diagram: Diagram; node: DiagramNode | null; onSelect: (node: DiagramNode) => void; onClose: () => void;
  sources: (refs: SourceRef[]) => ReactNode;
}) {
  if (!node) {
    // Kept small on wide screens so the floating hint covers as little of the map as possible.
    return (
      <aside className="rounded-2xl border border-dashed border-[#E6E4EE] bg-[#F7F6FA] p-3 text-xs text-[#475569]" aria-live="polite">
        <p className="font-bold text-[#1C1E26] text-sm">Penjelasan simpul</p>
        <p className="mt-1">Klik kotak mana pun untuk membaca penjelasan, contoh, dan cabangnya.</p>
      </aside>
    );
  }
  const trail: DiagramNode[] = [];
  for (let current = node; current.parent; ) {
    const parent = diagram.nodes.find(item => item.id === current.parent);
    if (!parent) break;
    trail.unshift(parent);
    current = parent;
  }
  const children = diagram.nodes.filter(item => item.parent === node.id);
  const next = diagram.kind === "flowchart"
    ? diagram.edges.filter(edge => edge.source === node.id).map(edge => diagram.nodes.find(item => item.id === edge.target)).filter(Boolean) as DiagramNode[]
    : [];
  const related = [...children, ...next];
  const chip = (item: DiagramNode) => (
    <button key={item.id} type="button" onClick={() => onSelect(item)}
      className="px-2.5 py-1 rounded-lg bg-white border border-[#21518A]/25 text-xs font-bold text-[#21518A] hover:bg-[#D2E5FA] cursor-pointer">
      {item.label}
    </button>
  );
  return (
    <aside className="rounded-2xl border border-[#21518A]/25 bg-[#EDF4FD] p-4 space-y-3" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {trail.length > 0 && (
            <p className="text-[11px] font-bold text-[#595F72] break-words">Bagian dari: {trail.map(item => item.label).join(" › ")}</p>
          )}
          <h3 className="font-extrabold text-[#1C1E26] break-words">{node.label}</h3>
        </div>
        <button type="button" aria-label="Tutup penjelasan" onClick={onClose} className="p-1 rounded-lg hover:bg-white cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      {node.detail && <p className="text-sm text-[#475569] leading-relaxed break-words">{node.detail}</p>}
      {node.example && (
        <div className="rounded-xl bg-white border border-[#785308]/25 p-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#785308]">Contoh</p>
          <p className="text-sm text-[#475569] mt-1 break-words">{node.example}</p>
        </div>
      )}
      {related.length > 0 && (
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#595F72] mb-1.5">{diagram.kind === "flowchart" ? "Langkah berikutnya" : "Cabang"}</p>
          <div className="flex flex-wrap gap-1.5">{related.map(chip)}</div>
        </div>
      )}
      <details><summary className="cursor-pointer text-xs font-bold text-[#595F72] py-1">Sumber</summary>{sources(node.source_refs)}</details>
    </aside>
  );
}

/**
 * Inserts the Mermaid SVG itself (React renders an empty box and never touches its children), so re-renders
 * such as opening an explanation cannot wipe the click wiring. One delegated listener handles every node.
 */
function MermaidCanvas({ svg, diagram, selectedId, onSelect, boxRef }: {
  svg: string; diagram: Diagram; selectedId: string | null; onSelect: (node: DiagramNode) => void;
  boxRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const own = useRef<HTMLDivElement>(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  useLayoutEffect(() => {
    const box = own.current;
    if (!box) return;
    if (boxRef) (boxRef as React.MutableRefObject<HTMLDivElement | null>).current = box;
    // Mermaid output is sanitized (securityLevel "strict") and built from escaped, validated labels.
    box.innerHTML = svg;
    if (diagram.kind === "mindmap") {
      // Mermaid places plain-text mindmap labels at the node centre without centring them; fix it in the SVG
      // itself so downloaded SVG/PNG files are correct too.
      box.querySelectorAll("g.mindmap-node text").forEach(text => text.setAttribute("text-anchor", "middle"));
    }
    const texts = Array.from(box.querySelectorAll("text"));
    for (const node of diagram.nodes) {
      const label = renderedLabel(node, diagram.kind).replace(/\s+/g, " ");
      const match = texts.find(t => (t.textContent || "").replace(/\s+/g, " ").trim() === label);
      // Prefer the whole shape group so the entire box is clickable, not only the text.
      const target = (match?.closest("g.node") ?? match?.closest("g.mindmap-node") ?? match?.closest("g")) as SVGGElement | null;
      if (!target) continue;
      target.dataset.nodeId = node.id;
      target.style.cursor = "pointer";
      target.setAttribute("tabindex", "0");
      target.setAttribute("role", "button");
      target.setAttribute("aria-label", `Lihat penjelasan: ${node.label}`);
    }
    const nodeFrom = (event: Event) => {
      const id = (event.target as Element | null)?.closest?.("[data-node-id]")?.getAttribute("data-node-id");
      return diagram.nodes.find(node => node.id === id) ?? null;
    };
    const onClick = (event: MouseEvent) => { const node = nodeFrom(event); if (node) select.current(node); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const node = nodeFrom(event);
      if (node) { event.preventDefault(); select.current(node); }
    };
    // A mouse press would focus the shape and scroll the box to it; keyboard focus still works via Tab.
    const onPress = (event: MouseEvent) => { if (nodeFrom(event)) event.preventDefault(); };
    box.addEventListener("click", onClick);
    box.addEventListener("keydown", onKey);
    box.addEventListener("mousedown", onPress);
    return () => {
      box.removeEventListener("click", onClick);
      box.removeEventListener("keydown", onKey);
      box.removeEventListener("mousedown", onPress);
    };
  }, [svg, diagram, boxRef]);

  useEffect(() => {
    own.current?.querySelectorAll<SVGGElement>("[data-node-id]").forEach(group => {
      const on = group.dataset.nodeId === selectedId;
      group.setAttribute("aria-pressed", String(on));
      // Outline the chosen node's own shape (not its text) so it stays visible while reading the explanation.
      group.querySelectorAll<SVGElement>(":scope > rect, :scope > path, :scope > circle, :scope > polygon, :scope > g > rect, :scope > g > path, :scope > g > circle").forEach(shape => {
        shape.style.stroke = on ? "#1C1E26" : "";
        shape.style.strokeWidth = on ? "4px" : "";
      });
    });
  }, [selectedId, svg]);

  return <div ref={own} className="[&_svg]:w-full [&_svg]:h-auto [&_svg]:max-w-none" />;
}

function labelOf(diagram: Diagram, id: string) {
  return diagram.nodes.find(node => node.id === id)?.label ?? id;
}

function depthOf(node: DiagramNode, diagram: Diagram) {
  let depth = 0;
  for (let current = node; current.parent; depth++) {
    const parent = diagram.nodes.find(item => item.id === current.parent);
    if (!parent) break;
    current = parent;
  }
  return depth;
}
