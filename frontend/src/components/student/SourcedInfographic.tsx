import { useState, type ReactNode } from "react";
import { audioSynth } from "@/services/audioSynth";
import {
  Award,
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
  { border: "border-sky-500", bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-500/30" },
  { border: "border-teal-500", bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-500/30" },
  { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-500/30" },
  { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-500/30" },
];

// Same four-stage layout as RichInfographicStudio, but every block comes from the material and shows its source.
export default function SourcedInfographic({ info, sources, onChange, disabled }: Props) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  const [done, setDone] = useState<Record<number, boolean>>({});
  const source = (refs: SourceRef[]) => (
    <details className="mt-2 text-left">
      <summary className="cursor-pointer text-[11px] font-bold text-slate-500 py-1">Sumber</summary>
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
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
            ✦ Infografis materi
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] mt-2 break-words">{info.title}</h2>
          {info.subtitle && <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 break-words">{info.subtitle}</p>}
        </div>
        {hasFlow && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3.5 sm:min-w-[210px]">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center font-black text-sm shrink-0">
              {progress}%
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1 gap-2">
                <span>Progres pemahaman</span>
                <span className="text-[#0284C7] font-black">{doneCount}/{info.flow_steps.length} tahap</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div style={{ width: `${progress}%` }} className="h-full rounded-full bg-[#0284C7] transition-all duration-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7]">
          💡 {stage("Fondasi & Konsep Inti")}
        </span>
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Gagasan pokok</span>
            <p className="text-sm font-bold text-emerald-950 leading-relaxed mt-0.5 break-words">{info.big_idea.text}</p>
            {source(info.big_idea.source_refs)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Definisi</span>
          <p className="text-sm text-slate-700 leading-relaxed font-medium break-words">{info.definition.text}</p>
          {source(info.definition.source_refs)}
        </div>
        {info.pillars.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3">
            {info.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index % pillarIcons.length];
              return (
                <div key={index} className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-[#0F172A] break-words">{pillar.name}</h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed break-words">{pillar.desc}</p>
                  {source(pillar.source_refs)}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {hasFlow && (
        <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              ⚡ {stage(info.flow_title || "Alur & Tahapan")}
            </span>
            <p className="text-xs text-slate-500 mt-1">Buka setiap tahap, pelajari, lalu tandai jika sudah paham.</p>
          </div>
          <ol className="space-y-3">
            {info.flow_steps.map((step, index) => {
              const isOpen = !!open[index];
              const isDone = !!done[index];
              const style = stepColors[index % stepColors.length];
              return (
                <li key={index} className={`rounded-2xl border transition-all overflow-hidden ${isOpen ? `bg-white ${style.border} shadow-md ring-2 ${style.ring}` : "bg-slate-50/70 border-slate-200"}`}>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => { audioSynth.playClickSound(); setOpen(previous => ({ ...previous, [index]: !previous[index] })); }}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${isDone ? "bg-emerald-500 text-white" : `${style.bg} ${style.text}`}`}>
                        {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : index + 1}
                      </span>
                      <span className="text-sm sm:text-base font-black text-[#0F172A] break-words flex-1 min-w-0">{step.title}</span>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDone(index)}
                      aria-pressed={isDone}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 ${isDone ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 hover:bg-emerald-50"}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isDone ? "Dipahami" : "Tandai paham"}</span>
                    </button>
                  </div>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/40">
                      <p className="text-sm text-slate-800 leading-relaxed font-medium mt-3 break-words">{step.desc}</p>
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
            <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 min-w-0">
              <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                📐 {stage("Rumus & Fakta Kunci")}
              </span>
              {info.key_facts.map((fact, index) => (
                <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 min-w-0">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />{fact.label}
                  </span>
                  <p className="font-mono text-sm font-bold text-[#0F172A] mt-1.5 break-words">{fact.value}</p>
                  {fact.explanation && <p className="text-xs text-slate-600 leading-relaxed mt-1.5 break-words">{fact.explanation}</p>}
                  {source(fact.source_refs)}
                </div>
              ))}
              {info.metrics.map((metric, index) => (
                <div key={`m${index}`} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-black text-[#0F172A] break-words">{metric.label}</span>
                    <span className="font-black text-sm text-[#0F172A]">{metric.value_pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden mt-2" role="img" aria-label={`${metric.label}: ${metric.value_pct}%`}>
                    <div style={{ width: `${metric.value_pct}%` }} className="h-full rounded-full bg-sky-600" />
                  </div>
                  {metric.explanation && <p className="text-xs text-slate-600 leading-relaxed mt-2 break-words">{metric.explanation}</p>}
                  {source(metric.source_refs)}
                </div>
              ))}
            </section>
          )}
          {hasApplied && (
            <section className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 min-w-0">
              <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                🌐 {stage("Penerapan & Analogi")}
              </span>
              {info.application && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-900">
                    <FlaskConical className="w-4 h-4 text-amber-600 shrink-0" />
                    <h4 className="text-sm font-black break-words">{info.application.title}</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium mt-2 break-words">{info.application.desc}</p>
                  {source(info.application.source_refs)}
                </div>
              )}
              {info.analogy && (
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-900 flex-wrap">
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                    <h4 className="text-sm font-black break-words">{info.analogy.title}</h4>
                  </div>
                  <p className="text-[11px] font-bold text-purple-700 mt-1">Analogi (dibuat AI, bukan dari materi)</p>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium mt-2 break-words">{info.analogy.story}</p>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      <div className="p-5 sm:p-6 rounded-3xl bg-[#0F172A] text-white flex items-start gap-4 shadow-md">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
            Kesimpulan kunci
          </span>
          <p className="text-sm text-slate-100 mt-1.5 leading-relaxed font-medium break-words">{info.takeaway.text}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] font-bold text-slate-300 py-1">Sumber</summary>
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
      <textarea disabled={disabled} maxLength={max} rows={2} className="block border rounded-lg w-full p-2 bg-white text-slate-900" value={value} onChange={event => update(event.target.value)} />
    </label>
  );
  const listField = <K extends "pillars" | "flow_steps" | "key_facts" | "metrics">(key: K, index: number, patch: Partial<Infographic[K][number]>) =>
    onChange({ ...info, [key]: info[key].map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  return (
    <details className="bg-white rounded-3xl border border-slate-200 p-5">
      <summary className="cursor-pointer font-semibold py-1">Edit infografis</summary>
      <div className="space-y-4 mt-3">
        <p className="text-sm text-slate-600">
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
            <p className="text-xs text-slate-600">Label setiap kotak harus berbeda satu sama lain.</p>
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
