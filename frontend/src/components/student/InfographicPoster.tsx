import { forwardRef, type ReactElement } from "react";
import type { Infographic } from "./SourcedInfographic";

const W = 1200;
const PAD = 56;
const INNER = W - PAD * 2;
const FONT = "'Plus Jakarta Sans', Inter, Arial, sans-serif";
const INK = "#0F172A";
const MUTED = "#475569";
// Identity hues for the concept medallions (each also carries its own label, so colour is never the only cue).
const HUES = ["#0284C7", "#0F766E", "#B45309", "#7E22CE"];
const TINTS = ["#E0F2FE", "#CCFBF1", "#FEF3C7", "#F3E8FF"];

/** Greedy word wrap using an average glyph width; long words are hard-split so nothing overflows. */
function wrap(text: string, width: number, size: number): string[] {
  const max = Math.max(6, Math.floor(width / (size * 0.53)));
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    for (const piece of word.match(new RegExp(`.{1,${max}}`, "gu")) || []) {
      if (!line) line = piece;
      else if ((line + " " + piece).length <= max) line += " " + piece;
      else { lines.push(line); line = piece; }
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Infographics use short phrases: the teacher-approved caption, else the first sentence, trimmed at a word. */
function brief(caption: string | undefined, text: string, max = 70): string {
  const source = (caption || "").trim() || text.split(/(?<=[.!?])\s/)[0].trim();
  if (source.length <= max) return source;
  const cut = source.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 20 ? cut.lastIndexOf(" ") : max).trim()}…`;
}

type Block = { el: ReactElement; height: number };

function textBlock(key: string, text: string, x: number, y: number, width: number, size: number, color: string,
  weight = 500, lineGap = 1.35, anchor: "start" | "middle" = "start"): Block {
  const lines = wrap(text, width, size);
  const lh = size * lineGap;
  return {
    height: lines.length * lh,
    el: (
      <text key={key} x={x} y={y + size} fontFamily={FONT} fontSize={size} fontWeight={weight} fill={color} textAnchor={anchor}>
        {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>{line}</tspan>)}
      </text>
    ),
  };
}

/** AI-drawn pictures (no lettering) placed into the poster; all text still comes from the infographic. */
export type PosterArt = { hero?: string | null; icons?: Record<string, string> };

// One self-contained SVG picture that summarises the material (plain <text>, so it downloads as SVG or PNG).
const InfographicPoster = forwardRef<SVGSVGElement, { info: Infographic; art?: PosterArt | null }>(function InfographicPoster({ info, art }, ref) {
  const parts: ReactElement[] = [];
  let y = 0;

  const sectionLabel = (key: string, label: string, color: string) => {
    parts.push(
      <rect key={`${key}-pill`} x={PAD} y={y} width={label.length * 11 + 36} height={34} rx={17} fill={color} />,
      <text key={key} x={PAD + 18} y={y + 23} fontFamily={FONT} fontSize={15} fontWeight={800} fill="#FFFFFF" letterSpacing={1.5}>{label.toUpperCase()}</text>,
    );
    y += 54;
  };

  // 1. Header: title, subtitle and big idea on the left; the AI illustration on the right.
  const hero = art?.hero;
  const heroW = hero ? 470 : 0;
  const textW = hero ? INNER - heroW - 40 : INNER;
  const headerTop = PAD;
  let hy = headerTop + 8;
  const badge = <text key="badge" x={PAD} y={hy + 14} fontFamily={FONT} fontSize={15} fontWeight={800} fill="#7DD3FC" letterSpacing={3}>INFOGRAFIS MATERI</text>;
  hy += 34;
  const title = textBlock("title", info.title, PAD, hy, textW, 46, "#FFFFFF", 800, 1.15);
  hy += title.height + 10;
  const subtitle = info.subtitle ? textBlock("subtitle", info.subtitle, PAD, hy, textW, 20, "#CBD5E1", 600) : null;
  if (subtitle) hy += subtitle.height + 14;
  hy += 10;
  const idea = textBlock("idea", info.big_idea.text, PAD + 22, hy + 16, textW - 44, 20, "#0F172A", 700);
  const ideaH = idea.height + 36;
  const heroH = hero ? Math.round(heroW * 9 / 16) : 0;
  const headerH = Math.max(hy + ideaH - headerTop + 28, heroH + 56);
  parts.push(<rect key="header" x={0} y={0} width={W} height={headerTop + headerH} fill="#0F172A" />);
  parts.push(badge, title.el);
  if (subtitle) parts.push(subtitle.el);
  parts.push(<rect key="idea-r" x={PAD} y={hy} width={textW} height={ideaH} rx={18} fill="#ECFDF5" />, idea.el);
  if (hero) {
    const hx = W - PAD - heroW;
    const hyTop = headerTop + (headerH - 28 - heroH) / 2;
    parts.push(
      <clipPath key="hero-clip" id="poster-hero-clip"><rect x={hx} y={hyTop} width={heroW} height={heroH} rx={22} /></clipPath>,
      <rect key="hero-bg" x={hx} y={hyTop} width={heroW} height={heroH} rx={22} fill="#FFFFFF" />,
      <image key="hero" href={hero} x={hx} y={hyTop} width={heroW} height={heroH} preserveAspectRatio="xMidYMid slice" clipPath="url(#poster-hero-clip)" />,
    );
  }
  y = headerTop + headerH + 36;

  // 2. Key concepts as connected medallions (icon or number), each with its label and a short caption.
  if (info.pillars.length) {
    sectionLabel("s-concepts", "Konsep utama", HUES[0]);
    const count = info.pillars.length;
    const slot = INNER / count;
    const R = count > 3 ? 70 : 80;
    const cy = y + R;
    parts.push(<line key="concept-line" x1={PAD + slot / 2} y1={cy} x2={PAD + slot * (count - 0.5)} y2={cy} stroke="#CBD5E1" strokeWidth={4} />);
    let tallest = 0;
    info.pillars.forEach((pillar, i) => {
      const cx = PAD + slot * (i + 0.5);
      const icon = art?.icons?.[pillar.name];
      parts.push(<circle key={`pc${i}`} cx={cx} cy={cy} r={R} fill={TINTS[i % 4]} stroke={HUES[i % 4]} strokeWidth={5} />);
      if (icon) {
        parts.push(
          <clipPath key={`pclip${i}`} id={`poster-icon-${i}`}><circle cx={cx} cy={cy} r={R - 12} /></clipPath>,
          <circle key={`pw${i}`} cx={cx} cy={cy} r={R - 12} fill="#FFFFFF" />,
          <image key={`pi${i}`} href={icon} x={cx - (R - 22)} y={cy - (R - 22)} width={(R - 22) * 2} height={(R - 22) * 2} preserveAspectRatio="xMidYMid meet" clipPath={`url(#poster-icon-${i})`} />,
        );
      } else {
        parts.push(<text key={`pn${i}`} x={cx} y={cy + 20} textAnchor="middle" fontFamily={FONT} fontSize={56} fontWeight={800} fill={HUES[i % 4]}>{i + 1}</text>);
      }
      parts.push(<circle key={`pb${i}`} cx={cx + R * 0.72} cy={cy - R * 0.72} r={20} fill={HUES[i % 4]} />,
        <text key={`pbn${i}`} x={cx + R * 0.72} y={cy - R * 0.72 + 7} textAnchor="middle" fontFamily={FONT} fontSize={18} fontWeight={800} fill="#FFFFFF">{i + 1}</text>);
      const label = textBlock(`pl${i}`, pillar.name, cx, cy + R + 16, slot - 30, 21, INK, 800, 1.2, "middle");
      const cap = textBlock(`pcap${i}`, brief(pillar.caption, pillar.desc), cx, cy + R + 22 + label.height, slot - 36, 16, MUTED, 500, 1.35, "middle");
      parts.push(label.el, cap.el);
      tallest = Math.max(tallest, R * 2 + 26 + label.height + cap.height);
    });
    y += tallest + 40;
  }

  // 3. Process as numbered arrow tiles.
  if (info.flow_steps.length) {
    sectionLabel("s-flow", info.flow_title || "Alur", HUES[1]);
    const perRow = Math.min(4, info.flow_steps.length);
    const gap = 16;
    const tileW = (INNER - gap * (perRow - 1)) / perRow;
    for (let start = 0; start < info.flow_steps.length; start += perRow) {
      const row = info.flow_steps.slice(start, start + perRow);
      const blocks = row.map((step, j) => {
        const i = start + j;
        const x = PAD + j * (tileW + gap);
        const t = textBlock(`ft${i}`, step.title, x + 66, y + 22, tileW - 96, 18, "#FFFFFF", 800, 1.2);
        const c = textBlock(`fc${i}`, brief(step.caption, step.desc, 60), x + 66, y + 30 + t.height, tileW - 96, 15, "#CCFBF1", 500);
        return { i, x, t, c, h: Math.max(96, 44 + t.height + c.height) };
      });
      const h = Math.max(...blocks.map(b => b.h));
      for (const { i, x, t, c } of blocks) {
        const tip = 22;
        const last = i === info.flow_steps.length - 1;
        const points = last
          ? `${x},${y} ${x + tileW},${y} ${x + tileW},${y + h} ${x},${y + h}`
          : `${x},${y} ${x + tileW - tip},${y} ${x + tileW},${y + h / 2} ${x + tileW - tip},${y + h} ${x},${y + h}`;
        parts.push(
          <polygon key={`fp${i}`} points={points} fill={i % 2 ? "#115E59" : "#0F766E"} />,
          <circle key={`fn${i}`} cx={x + 34} cy={y + h / 2} r={20} fill="#FFFFFF" />,
          <text key={`fnt${i}`} x={x + 34} y={y + h / 2 + 7} textAnchor="middle" fontFamily={FONT} fontSize={19} fontWeight={800} fill="#0F766E">{i + 1}</text>,
          t.el, c.el,
        );
      }
      y += h + gap;
    }
    y += 24;
  }

  // 4. Facts and application side by side (or full width when only one exists).
  const facts = [...info.key_facts.map(f => ({ value: f.value, label: f.label })),
    ...info.metrics.map(m => ({ value: `${m.value_pct}%`, label: m.label }))];
  const applied = [
    ...(info.application ? [{ title: info.application.title, text: brief(undefined, info.application.desc, 110), tag: "Penerapan" }] : []),
    ...(info.analogy ? [{ title: info.analogy.title, text: brief(undefined, info.analogy.story, 110), tag: "Analogi buatan AI" }] : []),
  ];
  if (facts.length || applied.length) {
    const both = facts.length > 0 && applied.length > 0;
    const colW = both ? (INNER - 24) / 2 : INNER;
    const top = y;
    // Lay out each panel's contents first so both panels can share one height and read as a single band.
    const factItems: ReactElement[] = [];
    let fy = top + 64;
    facts.slice(0, 4).forEach((fact, i) => {
      const v = textBlock(`fv${i}`, fact.value, PAD + 24, fy, colW - 48, 26, HUES[2], 800, 1.2);
      const l = textBlock(`fl${i}`, fact.label, PAD + 24, fy + v.height + 4, colW - 48, 15, MUTED, 600);
      factItems.push(v.el, l.el);
      fy += v.height + l.height + 22;
    });
    const ax = both ? PAD + colW + 24 : PAD;
    const applyItems: ReactElement[] = [];
    let ay = top + 64;
    applied.forEach((item, i) => {
      applyItems.push(<text key={`at${i}`} x={ax + 24} y={ay + 12} fontFamily={FONT} fontSize={13} fontWeight={800} fill={HUES[3]} letterSpacing={1}>{item.tag.toUpperCase()}</text>);
      const t = textBlock(`atl${i}`, item.title, ax + 24, ay + 18, colW - 48, 19, INK, 800, 1.2);
      const b = textBlock(`ab${i}`, item.text, ax + 24, ay + 24 + t.height, colW - 48, 15, MUTED, 500);
      applyItems.push(t.el, b.el);
      ay += 24 + t.height + b.height + 22;
    });
    const h = Math.max(facts.length ? fy - top + 4 : 0, applied.length ? ay - top + 4 : 0);
    if (facts.length) {
      parts.push(
        <rect key="facts-r" x={PAD} y={top} width={colW} height={h} rx={20} fill="#FFFBEB" stroke="#FCD34D" />,
        <text key="facts-h" x={PAD + 24} y={top + 38} fontFamily={FONT} fontSize={16} fontWeight={800} fill={HUES[2]} letterSpacing={1.5}>RUMUS & FAKTA KUNCI</text>,
        ...factItems,
      );
    }
    if (applied.length) {
      parts.push(
        <rect key="apply-r" x={ax} y={top} width={colW} height={h} rx={20} fill="#FAF5FF" stroke="#D8B4FE" />,
        <text key="apply-h" x={ax + 24} y={top + 38} fontFamily={FONT} fontSize={16} fontWeight={800} fill={HUES[3]} letterSpacing={1.5}>PENERAPAN & ANALOGI</text>,
        ...applyItems,
      );
    }
    y = top + h + 36;
  }

  // 5. Takeaway band and footer.
  const take = textBlock("take", info.takeaway.text, PAD + 30, y + 50, INNER - 60, 21, "#F1F5F9", 600);
  parts.push(
    <rect key="take-r" x={PAD} y={y} width={INNER} height={take.height + 80} rx={22} fill={INK} />,
    <text key="take-h" x={PAD + 30} y={y + 38} fontFamily={FONT} fontSize={15} fontWeight={800} fill="#6EE7B7" letterSpacing={2}>KESIMPULAN KUNCI</text>,
    take.el,
  );
  y += take.height + 80 + 30;
  parts.push(<text key="foot" x={PAD} y={y} fontFamily={FONT} fontSize={14} fill={MUTED}>
    {hero || art?.icons
      ? "EduAdapt · Isi dari materi guru, ditinjau guru. Ilustrasi & ikon dibuat AI; semua tulisan dari materi."
      : "EduAdapt · Disusun dari materi guru dan ditinjau guru."}
  </text>);
  const height = y + PAD - 20;

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${height}`} width={W} height={height}
      role="img" aria-label={`Poster infografis ${info.title}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect width={W} height={height} fill="#F8FAFC" />
      {parts}
    </svg>
  );
});

export default InfographicPoster;
