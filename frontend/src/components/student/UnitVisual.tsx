import { useId, type ReactNode } from "react";

export type SourceRef = { segment_id: string; quote: string };
type Node = { id: string; label: string; explanation: string; source_refs: SourceRef[] };
type Link = { source: string; target: string; label: string; source_refs: SourceRef[] };
type Row = { aspect: string; values: string[]; source_refs: SourceRef[] };
export type Visual = {
  kind: "concept_map" | "sequence" | "comparison";
  title: string; nodes: Node[]; links: Link[]; columns: string[]; rows: Row[];
};
type Props = {
  visual: Visual; sources: (refs: SourceRef[]) => ReactNode;
  onChange?: (visual: Visual) => void; disabled?: boolean;
};
const names = { concept_map: "Peta konsep", sequence: "Urutan / proses", comparison: "Perbandingan" };

export default function UnitVisual({ visual, sources, onChange, disabled }: Props) {
  const marker = useId().replace(/:/g, "");
  const { nodes, links, columns, rows } = visual;
  const field = (label: string, value: string, maxLength: number, update: (value: string) => void) =>
    <label className="block text-sm">{label}<textarea disabled={disabled} maxLength={maxLength} className="block border rounded-lg w-full p-2 text-[#1C1E26] bg-white" value={value} onChange={event => update(event.target.value)} /></label>;
  const updateNode = (index: number, update: Partial<Node>) => onChange?.({ ...visual, nodes: nodes.map((node, i) => i === index ? { ...node, ...update } : node) });
  const move = (index: number, delta: number) => {
    const next = [...nodes];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange?.({ ...visual, nodes: next });
  };
  const positions = nodes.map((_, i) => {
    const angle = -Math.PI / 2 + i * 2 * Math.PI / nodes.length;
    return { x: 500 + 330 * Math.cos(angle), y: 400 + 280 * Math.sin(angle) };
  });
  const labelOf = (id: string) => nodes.find(node => node.id === id)?.label || id;

  return <section className="min-w-0 rounded-[18px] border border-[#E6E4EE] bg-[#F7F6FA] p-4 space-y-4 text-[#1C1E26]" aria-label={names[visual.kind]}>
    <div><p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">{names[visual.kind]}</p><h4 className="font-bold text-lg break-words">{visual.title}</h4></div>
    {visual.kind === "concept_map" && <>
      <p className="text-sm text-[#475569]">Panah menunjukkan arah hubungan. Baca makna setiap hubungan pada daftar di bawah peta.</p>
      <div className="hidden sm:block rounded-lg bg-white border border-[#E6E4EE]">
        <svg viewBox="0 0 1000 800" className="w-full max-w-[700px] mx-auto" aria-hidden="true">
          <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
          {links.map((link, i) => {
            const a = positions[nodes.findIndex(node => node.id === link.source)];
            const b = positions[nodes.findIndex(node => node.id === link.target)];
            if (!a || !b || link.source === link.target) return null;
            const dx = b.x - a.x, dy = b.y - a.y;
            const inset = Math.min(100 / Math.max(Math.abs(dx), 1), 80 / Math.max(Math.abs(dy), 1));
            const length = Math.hypot(dx, dy);
            const offset = 55;
            const cx = (a.x + b.x) / 2 - dy / length * offset;
            const cy = (a.y + b.y) / 2 + dx / length * offset;
            const mx = (a.x + b.x) / 4 + cx / 2, my = (a.y + b.y) / 4 + cy / 2;
            return <g key={i}>
              <path d={`M ${a.x + dx * inset} ${a.y + dy * inset} Q ${cx} ${cy} ${b.x - dx * inset} ${b.y - dy * inset}`} fill="none" stroke="currentColor" strokeWidth="2" markerEnd={`url(#${marker})`} />
              <circle cx={mx} cy={my} r="14" fill="white" stroke="currentColor" />
              <text x={mx} y={my + 5} textAnchor="middle" fontSize="14" fill="currentColor">{i + 1}</text>
            </g>;
          })}
          {nodes.map((node, i) => <foreignObject key={node.id} x={positions[i].x - 95} y={positions[i].y - 75} width="190" height="150">
            <div className="h-full flex items-center justify-center rounded-xl border border-[#9195A8] bg-white p-3 text-center text-base leading-5 font-semibold break-words">{node.label}</div>
          </foreignObject>)}
        </svg>
      </div>
      <ul className="space-y-3" aria-label="Hubungan antarkonsep">{links.map((link, i) => <li key={i} className="rounded-lg border border-[#E6E4EE] bg-white p-3 break-words">
        <p><span className="font-semibold">{i + 1}. </span><strong>{labelOf(link.source)}</strong> <span aria-hidden="true">→ </span>{link.label}<span aria-hidden="true"> → </span> <strong>{labelOf(link.target)}</strong></p>
        <details><summary className="cursor-pointer py-2 text-sm">Sumber hubungan</summary>{sources(link.source_refs)}</details>
      </li>)}</ul>
    </>}
    {visual.kind !== "comparison" && <ol className="space-y-3" aria-label={visual.kind === "sequence" ? "Langkah berurutan" : "Penjelasan konsep"}>
      {nodes.map((node, i) => <li key={node.id} className="flex gap-3 min-w-0">
        {visual.kind === "sequence" && <div className="flex flex-col items-center" aria-hidden="true"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9195A8] bg-white font-bold">{i + 1}</span>{i < nodes.length - 1 && <span className="mt-2 flex-1 border-l border-[#9195A8]" />}</div>}
        <details className="flex-1 min-w-0 rounded-lg border border-[#E6E4EE] bg-white p-3">
          <summary className="cursor-pointer font-semibold break-words">{node.label}</summary>
          <p className="mt-3 text-sm break-words">{node.explanation}</p>{sources(node.source_refs)}
        </details>
      </li>)}
    </ol>}
    {visual.kind === "comparison" && <>
      <div className="sm:hidden space-y-3">{rows.map((row, i) => <section key={i} className="rounded-lg border border-[#E6E4EE] bg-white p-3">
        <h5 className="font-semibold break-words">{row.aspect}</h5>
        <dl className="mt-2 space-y-2">{columns.map((column, c) => <div key={c}><dt className="text-sm font-semibold break-words">{column}</dt><dd className="text-sm break-words">{row.values[c]}</dd></div>)}</dl>
        <details><summary className="cursor-pointer py-2 text-sm">Sumber aspek</summary>{sources(row.source_refs)}</details>
      </section>)}</div>
      <div className="hidden sm:block overflow-x-auto" tabIndex={0} role="region" aria-label="Tabel perbandingan, dapat digeser horizontal">
      <table className="w-full min-w-[560px] table-fixed border-collapse text-sm bg-white">
        <caption className="text-left pb-2 text-[#475569]">Bandingkan objek pada aspek yang sama; kutipan tersedia pada setiap baris.</caption>
        <thead><tr><th scope="col" className="border-b p-3 text-left">Aspek</th>{columns.map((column, i) => <th scope="col" key={i} className="border-b p-3 text-left break-words">{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}><th scope="row" className="align-top border-b p-3 text-left break-words">{row.aspect}<details className="font-normal"><summary className="cursor-pointer py-2">Sumber aspek</summary>{sources(row.source_refs)}</details></th>{row.values.map((value, n) => <td key={n} className="align-top border-b p-3 break-words">{value}</td>)}</tr>)}</tbody>
      </table>
    </div></>}
    {onChange && <details className="border-t border-[#E6E4EE] pt-3">
      <summary className="cursor-pointer font-semibold py-2">Edit visual</summary>
      <div className="space-y-4 mt-3">
        <p className="text-sm text-[#475569]">Perubahan harus tetap didukung kutipan yang tercantum. Simpan sebelum menyetujui. Klik "Susun ulang" jika susunan atau sumbernya tidak sesuai.</p>
        {field("Judul visual", visual.title, 200, title => onChange({ ...visual, title }))}
        {nodes.map((node, i) => <fieldset key={node.id} className="border rounded-lg p-3 space-y-2"><legend>Konsep / langkah {i + 1}</legend>
          {field("Label", node.label, 120, label => updateNode(i, { label }))}
          {field("Penjelasan", node.explanation, 700, explanation => updateNode(i, { explanation }))}
          {visual.kind === "sequence" && <div className="flex gap-2">
            <button type="button" disabled={disabled || i === 0} className="border rounded px-3 py-2 disabled:opacity-40" aria-label={`Naikkan ${node.label}`} onClick={() => move(i, -1)}>Naik</button>
            <button type="button" disabled={disabled || i === nodes.length - 1} className="border rounded px-3 py-2 disabled:opacity-40" aria-label={`Turunkan ${node.label}`} onClick={() => move(i, 1)}>Turun</button>
          </div>}
          {sources(node.source_refs)}
        </fieldset>)}
        {links.map((link, i) => <fieldset key={i} className="border rounded-lg p-3 space-y-2"><legend>Hubungan {i + 1}</legend>
          {(["source", "target"] as const).map(key => <label key={key} className="block text-sm">{key === "source" ? "Dari konsep" : "Ke konsep"}<select disabled={disabled} className="block border rounded-lg w-full p-2 bg-white" value={link[key]} onChange={event => onChange({ ...visual, links: links.map((item, n) => n === i ? { ...item, [key]: event.target.value } : item) })}>{nodes.map(node => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>)}
          {field("Makna hubungan", link.label, 100, label => onChange({ ...visual, links: links.map((item, n) => n === i ? { ...item, label } : item) }))}
          {sources(link.source_refs)}
        </fieldset>)}
        {columns.map((column, i) => <div key={i}>{field(`Objek ${i + 1}`, column, 120, value => onChange({ ...visual, columns: columns.map((item, n) => n === i ? value : item) }))}</div>)}
        {rows.map((row, i) => <fieldset key={i} className="border rounded-lg p-3 space-y-2"><legend>Aspek {i + 1}</legend>
          {field("Nama aspek", row.aspect, 120, aspect => onChange({ ...visual, rows: rows.map((item, n) => n === i ? { ...item, aspect } : item) }))}
          {row.values.map((value, c) => <div key={c}>{field(columns[c], value, 500, text => onChange({ ...visual, rows: rows.map((item, n) => n === i ? { ...item, values: item.values.map((cell, col) => col === c ? text : cell) } : item) }))}</div>)}
          {sources(row.source_refs)}
        </fieldset>)}
      </div>
    </details>}
  </section>;
}
