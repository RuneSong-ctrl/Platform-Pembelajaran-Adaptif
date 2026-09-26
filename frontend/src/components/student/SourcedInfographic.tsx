import { useState, type ReactNode } from "react";
import { audioSynth } from "@/services/audioSynth";
import {
  Award,
  Calculator,
  Globe,
  Layers,
  Workflow,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Flame,
  Lightbulb,
  ShieldCheck,
  Sparkles,
} from "@/components/ui/icons";
import type { SourceRef } from "./UnitVisual";
import type { Diagram } from "@/lib/mermaidDiagram";

type Sourced = { source_refs: SourceRef[] };
type InfoText = Sourced & { text: string };
export type Infographic = {
  title: string;
  subtitle: string;
  big_idea: InfoText;
  definition: InfoText;
  pillars: (Sourced & { name: string; desc: string; caption?: string })[];
  flow_title: string;
  flow_steps: (Sourced & { title: string; desc: string; caption?: string })[];
  key_facts: (Sourced & { label: string; value: string; explanation: string })[];
  metrics: (Sourced & { label: string; value_pct: number; explanation: string })[];
  application: (Sourced & { title: string; desc: string }) | null;
  analogy: { title: string; story: string } | null;
  takeaway: InfoText;
  diagram?: Diagram | null;
};
type Props = {
  info: Infographic;
  sources: (refs: SourceRef[]) => ReactNode;
  onChange?: (info: Infographic) => void;
  disabled?: boolean;
};

const pillarIcons = [Brain, Flame, ShieldCheck, Lightbulb];
const stepColors = [
  { border: "border-[#21518A]/50", bg: "bg-[#EDF4FD]", text: "text-[#21518A]", ring: "ring-[#21518A]/30" },
  { border: "border-[#1D5E4D]/50", bg: "bg-[#EBF6F2]", text: "text-[#1D5E4D]", ring: "ring-[#1D5E4D]/30" },
  { border: "border-[#785308]/50", bg: "bg-[#FFF6DF]", text: "text-[#785308]", ring: "ring-[#785308]/30" },
  { border: "border-[#4B3B7A]/50", bg: "bg-[#F2EFFC]", text: "text-[#4B3B7A]", ring: "ring-[#4B3B7A]/30" },
];

// Same four-stage layout as RichInfographicStudio, but every block comes from the material and shows its source.
export default function SourcedInfographic({ info, sources, onChange, disabled }: Props) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  const [done, setDone] = useState<Record<number, boolean>>({});
  const source = (refs: SourceRef[]) => (
    <details className="mt-2 text-left">
      <summary className="cursor-pointer text-mini font-bold text-[#595F72] py-1">Sumber</summary>
      {sources(refs)}
    </details>
  );

  const hasFlow = info.flow_steps.length > 0;
  const hasFacts = info.key_facts.length > 0 || info.metrics.length > 0;
  const hasApplied = Boolean(info.application || info.analogy);
  // Stage numbers follow the zones actually shown, so an empty zone never leaves a gap.
  const stages = ["Fondasi & Konsep Inti", hasFlow && (info.flow_title || "Alur & Tahapan"),
    hasFacts && "Rumus & Fakta Kunci", hasApplied && "Penerapan & Analogi"].filter(Boolean) as string[];
  const stage = (name: string) => `Tahap ${stages.indexOf(name) + 1}: ${name}`;
  const doneCount = Object.values(done).filter(Boolean).length;
  const progress = hasFlow ? Math.round((doneCount / info.flow_steps.length) * 100) : 0;

  const toggleDone = (index: number) => {
    const next = !done[index];
    setDone(previous => ({ ...previous, [index]: next }));
    if (next) audioSynth.playSuccessSound(); else audioSynth.playClickSound();
  };

  return (
    <section className="space-y-5 min-w-0" aria-label="Infografis materi">
      <div className="clay-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-mini font-bold uppercase tracking-wider px-2.5 py-1 rounded-[8px] bg-[#D1EBE1] text-[#1D5E4D]">
            <Layers className="w-3.5 h-3.5" />Infografis materi
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1E26] mt-2 break-words">{info.title}</h2>
          {info.subtitle && <p className="text-xs sm:text-sm font-semibold text-[#595F72] mt-1 break-words">{info.subtitle}</p>}
        </div>
        {hasFlow && (
          <div className="bg-[#F7F6FA] p-3.5 rounded-2xl border border-[#E6E4EE] flex items-center gap-3.5 sm:min-w-[210px]">
            <div className="w-10 h-10 rounded-xl bg-[#D2E5FA] text-[#21518A] flex items-center justify-center font-extrabold text-sm shrink-0">
              {progress}%
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-mini font-bold text-[#475569] mb-1 gap-2">
                <span>Progres pemahaman</span>
                <span className="text-[#21518A] font-extrabold">{doneCount}/{info.flow_steps.length} tahap</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E6E4EE] overflow-hidden">
                <div style={{ width: `${progress}%` }} className="h-full rounded-full bg-[#21518A] transition-all duration-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="clay-card p-5 sm:p-6 space-y-4">
        <span className="inline-flex items-center gap-1.5 text-mini font-bold uppercase tracking-wider px-2.5 py-1 rounded-[8px] bg-[#D2E5FA] text-[#21518A]">
          <Lightbulb className="w-3.5 h-3.5" />{stage("Fondasi & Konsep Inti")}
        </span>
        <div className="p-4 rounded-2xl bg-[#EBF6F2] border border-[#1D5E4D]/25 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-[#1D5E4D] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-mini font-extrabold uppercase tracking-wider text-[#1D5E4D] block">Gagasan pokok</span>
            <p className="text-sm font-bold text-[#1D5E4D] leading-relaxed mt-0.5 break-words">{info.big_idea.text}</p>
            {source(info.big_idea.source_refs)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#F7F6FA] border border-[#E6E4EE]">
          <span className="text-mini font-extrabold uppercase text-[#9195A8] tracking-wider block mb-1">Definisi</span>
          <p className="text-sm text-[#475569] leading-relaxed font-medium break-words">{info.definition.text}</p>
          {source(info.definition.source_refs)}
        </div>
        {info.pillars.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
            {info.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index % pillarIcons.length];
              return (
                <div key={index} className="p-4 rounded-2xl bg-[#F7F6FA] border border-[#E6E4EE] space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#D2E5FA] text-[#21518A] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-extrabold text-[#1C1E26] break-words">{pillar.name}</h4>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed break-words">{pillar.desc}</p>
                  {source(pillar.source_refs)}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {hasFlow && (
        <section className="clay-card p-5 sm:p-6 space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-mini font-bold uppercase tracking-wider px-2.5 py-1 rounded-[8px] bg-[#D1EBE1] text-[#1D5E4D]">
              <Workflow className="w-3.5 h-3.5" />{stage(info.flow_title || "Alur & Tahapan")}
            </span>
            <p className="text-xs text-[#595F72] mt-1">Buka setiap tahap, pelajari, lalu tandai jika sudah paham.</p>
          </div>
          <ol className="space-y-3">
            {info.flow_steps.map((step, index) => {
              const isOpen = !!open[index];
              const isDone = !!done[index];
              const style = stepColors[index % stepColors.length];
              return (
                <li key={index} className={`rounded-2xl border transition-all overflow-hidden ${isOpen ? `bg-white ${style.border} ring-2 ${style.ring}` : "bg-[#F7F6FA] border-[#E6E4EE]"}`}>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => { audioSynth.playClickSound(); setOpen(previous => ({ ...previous, [index]: !previous[index] })); }}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${isDone ? "bg-[#1D5E4D] text-white" : `${style.bg} ${style.text}`}`}>
                        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : index + 1}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-[#1C1E26] break-words flex-1 min-w-0">{step.title}</span>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-[#595F72] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#595F72] shrink-0" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDone(index)}
                      aria-pressed={isDone}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 ${isDone ? "bg-[#D1EBE1] text-[#1D5E4D]" : "bg-[#F0EEF6] text-[#475569] hover:bg-[#EBF6F2]"}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isDone ? "Dipahami" : "Tandai paham"}</span>
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-[#E6E4EE] bg-[#F7F6FA]">
                      <p className="text-sm text-[#1C1E26] leading-relaxed font-medium mt-3 break-words">{step.desc}</p>
                      {source(step.source_refs)}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {(hasFacts || hasApplied) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {hasFacts && (
            <section className="clay-card p-5 sm:p-6 space-y-3 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-mini font-bold uppercase tracking-wider px-2.5 py-1 rounded-[8px] bg-[#D2E5FA] text-[#21518A]">
                <Calculator className="w-3.5 h-3.5" />{stage("Rumus & Fakta Kunci")}
              </span>
              {info.key_facts.map((fact, index) => (
                <div key={index} className="p-4 rounded-2xl bg-[#F7F6FA] border border-[#E6E4EE] min-w-0">
                  <span className="text-mini font-extrabold uppercase tracking-wider text-[#595F72] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />{fact.label}
                  </span>
                  <p className="font-mono text-sm font-bold text-[#1C1E26] mt-1.5 break-words">{fact.value}</p>
                  {fact.explanation && <p className="text-xs text-[#475569] leading-relaxed mt-1.5 break-words">{fact.explanation}</p>}
                  {source(fact.source_refs)}
                </div>
              ))}
              {info.metrics.map((metric, index) => (
                <div key={`m${index}`} className="p-4 rounded-2xl bg-[#F7F6FA] border border-[#E6E4EE]">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-extrabold text-[#1C1E26] break-words">{metric.label}</span>
                    <span className="font-extrabold text-sm text-[#1C1E26]">{metric.value_pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#E6E4EE] overflow-hidden mt-2" role="img" aria-label={`${metric.label}: ${metric.value_pct}%`}>
                    <div style={{ width: `${metric.value_pct}%` }} className="h-full rounded-full bg-[#21518A]" />
                  </div>
                  {metric.explanation && <p className="text-xs text-[#475569] leading-relaxed mt-2 break-words">{metric.explanation}</p>}
                  {source(metric.source_refs)}
                </div>
              ))}
            </section>
          )}
          {hasApplied && (
            <section className="clay-card p-5 sm:p-6 space-y-3 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-mini font-bold uppercase tracking-wider px-2.5 py-1 rounded-[8px] bg-[#E3DBF8] text-[#4B3B7A]">
                <Globe className="w-3.5 h-3.5" />{stage("Penerapan & Analogi")}
              </span>
              {info.application && (
                <div className="p-4 rounded-2xl bg-[#FFF6DF] border border-[#785308]/25">
                  <div className="flex items-center gap-2 text-[#785308]">
                    <FlaskConical className="w-4 h-4 text-[#785308] shrink-0" />
                    <h4 className="text-sm font-extrabold break-words">{info.application.title}</h4>
                  </div>
                  <p className="text-sm text-[#475569] leading-relaxed font-medium mt-2 break-words">{info.application.desc}</p>
                  {source(info.application.source_refs)}
                </div>
              )}
              {info.analogy && (
                <div className="p-4 rounded-2xl bg-[#F2EFFC] border border-[#4B3B7A]/25">
                  <div className="flex items-center gap-2 text-[#4B3B7A] flex-wrap">
                    <Sparkles className="w-4 h-4 text-[#4B3B7A] shrink-0" />
                    <h4 className="text-sm font-extrabold break-words">{info.analogy.title}</h4>
                  </div>
                  <p className="text-mini font-bold text-[#4B3B7A] mt-1">Analogi (dibuat AI, bukan dari materi)</p>
                  <p className="text-sm text-[#475569] leading-relaxed font-medium mt-2 break-words">{info.analogy.story}</p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <div className="clay-dark rounded-[26px] p-5 sm:p-6 flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-[#1D5E4D]/20 text-[#D1EBE1] flex items-center justify-center shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="text-mini font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1D5E4D]/30 text-[#D1EBE1]">
            Kesimpulan kunci
          </span>
          <p className="text-sm text-[#F0EEF6] mt-1.5 leading-relaxed font-medium break-words">{info.takeaway.text}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-mini font-bold text-[#9195A8] py-1">Sumber</summary>
            <div className="bg-white rounded-xl p-2 mt-1">{sources(info.takeaway.source_refs)}</div>
          </details>
        </div>
      </div>

      {onChange && <InfographicEditor info={info} onChange={onChange} disabled={disabled} />}
    </section>
  );
}

function InfographicEditor({ info, onChange, disabled }: { info: Infographic; onChange: (info: Infographic) => void; disabled?: boolean }) {
  const field = (label: string, value: string, max: number, update: (value: string) => void) => (
    <label className="block text-sm">
      {label}
      <textarea disabled={disabled} maxLength={max} rows={2} className="block border rounded-lg w-full p-2 bg-white text-[#1C1E26]" value={value} onChange={event => update(event.target.value)} />
    </label>
  );
  const listField = <K extends "pillars" | "flow_steps" | "key_facts" | "metrics">(key: K, index: number, patch: Partial<Infographic[K][number]>) =>
    onChange({ ...info, [key]: info[key].map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  return (
    <details className="clay-card p-5">
      <summary className="cursor-pointer font-semibold py-1">Edit infografis</summary>
      <div className="space-y-4 mt-3">
        <p className="text-sm text-[#475569]">
          Teks boleh diperbaiki, tetapi rumus, fakta, dan angka tidak dapat diubah karena harus sama dengan kutipan materi. Simpan sebelum menyetujui.
        </p>
        {field("Judul", info.title, 200, title => onChange({ ...info, title }))}
        {field("Subjudul", info.subtitle, 300, subtitle => onChange({ ...info, subtitle }))}
        {field("Gagasan pokok", info.big_idea.text, 700, text => onChange({ ...info, big_idea: { ...info.big_idea, text } }))}
        {field("Definisi", info.definition.text, 700, text => onChange({ ...info, definition: { ...info.definition, text } }))}
        {info.pillars.map((pillar, i) => (
          <fieldset key={`p${i}`} className="border rounded-lg p-3 space-y-2"><legend>Pilar {i + 1}</legend>
            {field("Nama", pillar.name, 80, name => listField("pillars", i, { name }))}
            {field("Penjelasan", pillar.desc, 300, desc => listField("pillars", i, { desc }))}
          </fieldset>
        ))}
        {info.flow_steps.map((step, i) => (
          <fieldset key={`s${i}`} className="border rounded-lg p-3 space-y-2"><legend>Tahap alur {i + 1}</legend>
            {field("Judul", step.title, 120, title => listField("flow_steps", i, { title }))}
            {field("Penjelasan", step.desc, 500, desc => listField("flow_steps", i, { desc }))}
          </fieldset>
        ))}
        {info.key_facts.map((fact, i) => (
          <fieldset key={`f${i}`} className="border rounded-lg p-3 space-y-2"><legend>Fakta: <span className="font-mono">{fact.value}</span></legend>
            {field("Label", fact.label, 120, label => listField("key_facts", i, { label }))}
            {field("Penjelasan", fact.explanation, 400, explanation => listField("key_facts", i, { explanation }))}
          </fieldset>
        ))}
        {info.application && (
          <fieldset className="border rounded-lg p-3 space-y-2"><legend>Penerapan</legend>
            {field("Judul", info.application.title, 120, title => onChange({ ...info, application: { ...info.application!, title } }))}
            {field("Penjelasan", info.application.desc, 600, desc => onChange({ ...info, application: { ...info.application!, desc } }))}
          </fieldset>
        )}
        {info.analogy && (
          <fieldset className="border rounded-lg p-3 space-y-2"><legend>Analogi (dibuat AI)</legend>
            {field("Judul", info.analogy.title, 120, title => onChange({ ...info, analogy: { ...info.analogy!, title } }))}
            {field("Cerita", info.analogy.story, 700, story => onChange({ ...info, analogy: { ...info.analogy!, story } }))}
            <button type="button" disabled={disabled} className="border rounded-lg px-3 py-2 text-sm" onClick={() => onChange({ ...info, analogy: null })}>
              Hapus analogi
            </button>
          </fieldset>
        )}
        {field("Kesimpulan", info.takeaway.text, 700, text => onChange({ ...info, takeaway: { ...info.takeaway, text } }))}
        {info.diagram && (
          <fieldset className="border rounded-lg p-3 space-y-2"><legend>Diagram utama</legend>
            <p className="text-xs text-[#475569]">Label setiap kotak harus berbeda satu sama lain.</p>
            {field("Judul diagram", info.diagram.title, 120, title => onChange({ ...info, diagram: { ...info.diagram!, title } }))}
            {info.diagram.nodes.map((node, i) => (
              <div key={node.id} className="grid gap-2 sm:grid-cols-2">
                {field(`Kotak ${i + 1}`, node.label, 80, label => onChange({ ...info, diagram: { ...info.diagram!, nodes: info.diagram!.nodes.map((n, j) => (j === i ? { ...n, label } : n)) } }))}
                {field("Penjelasan", node.detail, 400, detail => onChange({ ...info, diagram: { ...info.diagram!, nodes: info.diagram!.nodes.map((n, j) => (j === i ? { ...n, detail } : n)) } }))}
              </div>
            ))}
          </fieldset>
        )}
      </div>
    </details>
  );
}
