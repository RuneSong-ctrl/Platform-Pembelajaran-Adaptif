import { useEffect, useState } from "react";
import { ApiService, mediaUrl } from "@/services/apiClient";

import UnitVisual, { type SourceRef, type Visual } from "./UnitVisual";
import SourcedInfographic, { type Infographic } from "./SourcedInfographic";
import VisualMap from "./VisualMap";
import KinestheticLearning from "./KinestheticLearning";
type Concept = { name: string; explanation: string; source_refs: SourceRef[] };
type Check = { question: string; options: string[]; correct_index: number; explanation: string; source_refs: SourceRef[] };
type Unit = {
  id: string; title: string; learning_objective: string; concepts: Concept[]; source_refs: SourceRef[];
  suggested_visual: string; suggested_activity: string; comprehension_checks?: Check[]; visual?: Visual | null;
};
type UnitResponse = {
  state: string; error: string | null; revision: number; published_revision: number | null;
  units: Unit[]; sources: { id: string; label: string; page: number | null; text?: string }[];
  infographic?: Infographic | null;
  image?: AiImage | null;
};
type AiImage = {
  state: "PROCESSING" | "READY" | "ERROR";
  hero_url?: string | null; icons?: { label: string; url: string }[]; lettered?: string[]; error?: string;
};
const labels: Record<string, string> = {
  NOT_GENERATED: "Belum dibuat", PROCESSING: "Sedang menyusun unit", DRAFT: "Draf siap ditinjau", ERROR: "Generasi gagal",
};

export default function LearningUnits({ documentId, teacher = false, showVisual = false }: { documentId: string; teacher?: boolean; showVisual?: boolean }) {
  const [data, setData] = useState<UnitResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const endpoint = `/documents/${encodeURIComponent(documentId)}/learning-units`;
  const read = () => ApiService.authenticatedRequest<UnitResponse>(`${endpoint}${teacher ? "/draft" : ""}`);

  useEffect(() => {
    let active = true;
    setData(null); setError(""); setDirty(false);
    const load = async () => {
      try {
        const next = await read();
        if (!active) return;
        setData(next);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Gagal memuat unit.");
      }
    };
    void load();
    return () => { active = false; };
  }, [documentId, teacher]);

  useEffect(() => {
    const draftBusy = data?.state === "PROCESSING";
    const imageBusy = data?.image?.state === "PROCESSING";
    if (!draftBusy && !imageBusy) return;
    let active = true;
    const timer = setTimeout(() => {
      read().then(next => {
        if (!active) return;
        // While only the picture is being drawn, refresh just the picture so unsaved edits are kept.
        setData(previous => (draftBusy || !previous ? next : { ...previous, image: next.image }));
      }).catch(err => { if (active) setError(err.message); });
    }, 4000);
    return () => { active = false; clearTimeout(timer); };
  }, [data?.state, data?.revision, data?.image?.state, data]);

  const imageAction = async (method: "POST" | "DELETE") => {
    setBusy(true); setError("");
    try {
      const result = await ApiService.authenticatedRequest<AiImage | { image: null }>(`${endpoint}/image`, { method });
      setData(previous => previous && ({ ...previous, image: method === "DELETE" ? null : (result as AiImage) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gambar gagal diproses.");
    } finally { setBusy(false); }
  };

  const action = async (kind: "generate" | "save" | "approve") => {
    if (!data) return;
    setBusy(true); setError("");
    try {
      await ApiService.authenticatedRequest(`${endpoint}/${kind === "save" ? "draft" : kind}`, {
        method: kind === "save" ? "PUT" : "POST",
        body: kind === "generate" ? undefined : JSON.stringify({
          revision: data.revision,
          ...(kind === "save" ? { units: data.units, infographic: data.infographic ?? null } : {}),
        }),
      });
      setData(await read()); setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Perubahan gagal disimpan.");
    } finally { setBusy(false); }
  };

  const change = (index: number, update: Partial<Unit>) => {
    setData(previous => previous && ({ ...previous, units: previous.units.map((unit, i) => i === index ? { ...unit, ...update } : unit) }));
    setDirty(true);
  };
  const sources = (refs: SourceRef[]) => refs.map((ref, i) => {
    const source = data?.sources.find(item => item.id === ref.segment_id);
    return <blockquote key={`${ref.segment_id}-${i}`} className="border-l-2 border-[#E6E4EE] pl-3 text-sm text-[#475569] my-2">
      “{ref.quote}” <span className="block text-xs">{source?.page
        ? <a className="underline" href={mediaUrl(`/api/v1/documents/${encodeURIComponent(documentId)}/pdf#page=${source.page}`)} target="_blank" rel="noreferrer">{source.label}</a>
        : source?.label || ref.segment_id}</span>
    </blockquote>;
  });
  const disabled = busy || data?.state === "PROCESSING";
  return <section className="clay-card p-5 sm:p-6 space-y-4" aria-label="Unit belajar bersumber">
    <h2 className="text-[18px] leading-[26px] font-bold text-[#1C1E26]">{teacher ? "Tinjau unit belajar" : "Konsep dari materi guru"}</h2>
    {error && <p role="alert" className="text-[#852C28]">{error}</p>}
    {!data && !error && <p role="status">Memuat unit belajar…</p>}
    {data && <>
      <p role="status" className="text-sm text-[#475569]">{teacher ? labels[data.state] || data.state : data.units.length ? "Materi telah disetujui guru." : "Unit belajar belum dipublikasikan oleh guru."}
        {teacher && data.published_revision != null && ` · Revisi terpublikasi: ${data.published_revision}`}
      </p>
      {teacher && data.error && <p className="text-[#852C28]">{data.error}</p>}
      {teacher && <div className="flex flex-wrap gap-2">
        <button className="border rounded-lg px-3 py-2" disabled={busy || dirty} onClick={() => void action("generate")}>{data.state === "PROCESSING" ? "Coba ulang jika terhenti >30 menit" : data.units.length ? "Buat ulang draf" : "Buat / coba ulang"}</button>
        <button className="border rounded-lg px-3 py-2" disabled={disabled || !dirty} onClick={() => void action("save")}>Simpan perubahan</button>
        <button className="bg-[#1C1E26] text-white rounded-lg px-3 py-2" disabled={disabled || dirty || data.state !== "DRAFT" || !data.units.length} onClick={() => void action("approve")}>Setujui dan publikasikan</button>
      </div>}
      {teacher && <p className="text-xs text-[#475569]">Periksa kebenaran konsep dan jawaban terhadap kutipan sebelum menyetujui. Kecocokan kutipan bukan jaminan penjelasan AI benar. Podcast tidak berubah.</p>}
      {teacher && data.infographic && (
        <div className="rounded-2xl border border-[#E6E4EE] bg-[#F7F6FA] p-4 space-y-2" aria-live="polite">
          <p className="text-sm font-semibold text-[#1C1E26]">Ilustrasi & ikon AI untuk infografis</p>
          {!data.image && <p className="text-sm text-[#475569]">Belum ada gambar untuk draf ini.</p>}
          {data.image?.state === "PROCESSING" && <p role="status" className="text-sm text-[#475569]">Sedang menggambar ilustrasi dan ikon (±15–40 detik)…</p>}
          {data.image?.state === "ERROR" && <p className="text-sm text-[#852C28]">{data.image.error}</p>}
          {data.image?.state === "READY" && (data.image.lettered?.length
            ? <p className="text-sm text-[#785308]">Gambar berikut mungkin masih memuat tulisan dari AI: {data.image.lettered.join(", ")}. Periksa di tab Infografis AI, lalu buat ulang atau hapus sebelum menyetujui.</p>
            : <p className="text-sm text-[#1D5E4D]">Gambar sudah diperiksa bebas tulisan; semua teks di infografis berasal dari materi. Tetap lihat hasilnya sebelum menyetujui.</p>)}
          <div className="flex flex-wrap gap-2">
            <button className="border rounded-lg px-3 py-2 text-sm bg-white" disabled={busy || data.state !== "DRAFT" || data.image?.state === "PROCESSING"} onClick={() => void imageAction("POST")}>
              {data.image ? "Buat ulang gambar" : "Buat gambar"}
            </button>
            {data.image && data.image.state !== "PROCESSING" && (
              <button className="border rounded-lg px-3 py-2 text-sm bg-white" disabled={busy} onClick={() => void imageAction("DELETE")}>Hapus gambar</button>
            )}
          </div>
        </div>
      )}
      {(teacher || showVisual) && data.infographic && (
        <VisualMap
          info={data.infographic}
          sources={sources}
          art={data.image?.state === "READY" ? {
            hero: data.image.hero_url ? mediaUrl(data.image.hero_url) : null,
            icons: Object.fromEntries((data.image.icons || []).map(icon => [icon.label, mediaUrl(icon.url)])),
          } : null}
        />
      )}
      {(teacher || showVisual) && data.infographic && (
        <SourcedInfographic
          info={data.infographic}
          sources={sources}
          disabled={disabled}
          onChange={teacher ? infographic => { setData(previous => previous && ({ ...previous, infographic })); setDirty(true); } : undefined}
        />
      )}
      {teacher && data.units.length > 0 && !data.infographic && (
        <p className="text-sm text-[#475569]">Infografis belum tersedia untuk draf ini. Buat ulang draf untuk menyusunnya.</p>
      )}
      {teacher && data.units.length > 0 && (
        <details className="rounded-2xl border border-[#785308]/25 bg-[#FFF6DF] p-3">
          <summary className="cursor-pointer font-semibold py-1">Pratinjau materi kinestetik: Games & Challenge</summary>
          <p className="text-xs text-[#475569] my-2">Disusun otomatis dari alur, peta konsep, dan urutan unit di draf ini. Siswa mengerjakannya berurutan; tahap berikutnya terbuka setelah tahap sebelumnya selesai.</p>
          <KinestheticLearning documentId={documentId} preview={{ infographic: data.infographic ?? null, units: data.units }} sources={sources} />
        </details>
      )}
      {data.units.map((unit, index) => <article key={unit.id} className="border-t border-[#E6E4EE] pt-4 space-y-3">
        {teacher ? <>
          <label className="block text-sm">Judul unit<input disabled={disabled} className="block border rounded-lg w-full p-2" value={unit.title} onChange={event => change(index, { title: event.target.value })} /></label>
          <label className="block text-sm">Tujuan pembelajaran<textarea disabled={disabled} className="block border rounded-lg w-full p-2" value={unit.learning_objective} onChange={event => change(index, { learning_objective: event.target.value })} /></label>
        </> : <><h3 className="font-bold">{index + 1}. {unit.title}</h3><p>{unit.learning_objective}</p></>}
        {(teacher || showVisual) && (unit.visual
          ? <><UnitVisual visual={unit.visual} sources={sources} disabled={disabled} onChange={teacher ? visual => change(index, { visual }) : undefined} />
            {teacher && <button type="button" disabled={disabled} className="border rounded-lg px-3 py-2 text-sm" onClick={() => change(index, { visual: null, suggested_visual: "none" })}>Jangan gunakan visual ini</button>}</>
          : <p className="text-sm text-[#475569]">Visual belum tersedia untuk unit ini. Konsep dan sumber tetap dapat dibaca.{teacher && " Buat ulang draf untuk meminta visual bersumber; hasilnya perlu ditinjau kembali."}</p>)}
        <div className="grid gap-3 sm:grid-cols-2">{unit.concepts.map((concept, c) => <div key={c} className="rounded-xl bg-[#F7F6FA] p-4">
          <h4 className="font-semibold">{concept.name}</h4>
          {teacher ? <textarea aria-label={`Penjelasan ${concept.name}`} disabled={disabled} className="border rounded-lg w-full p-2" value={concept.explanation} onChange={event => change(index, { concepts: unit.concepts.map((item, n) => n === c ? { ...item, explanation: event.target.value } : item) })} /> : <p className="text-sm mt-2">{concept.explanation}</p>}
          <details><summary className="text-sm cursor-pointer mt-2">Lihat sumber</summary>{sources(concept.source_refs)}</details>
        </div>)}</div>
        {teacher && <details><summary className="cursor-pointer">Periksa pertanyaan dan rekomendasi format</summary>
          <p className="text-sm">Visual: {unit.suggested_visual} · Praktik: {unit.suggested_activity}</p>
          {unit.comprehension_checks?.map((check, i) => <div className="my-3" key={i}><p>{check.question}</p><ol>{check.options.map((option, n) => <li key={n}>{n + 1}. {option}{n === check.correct_index ? " (jawaban)" : ""}</li>)}</ol><p>{check.explanation}</p>{sources(check.source_refs)}</div>)}
        </details>}
      </article>)}
      {!teacher && <p className="text-xs text-[#475569]">Materi bersumber dan ditinjau guru; bukan penilaian penguasaan. Aktivitas kinestetik baru belum tersedia.</p>}
    </>}
  </section>;
}
