import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import LearningUnits from "../components/student/LearningUnits";
import UnitVisual, { type Visual } from "../components/student/UnitVisual";

const ref = { segment_id: "seg_1", quote: "Rebus air terlebih dahulu, kemudian seduh teh." };
const nodes = [
  { id: "air", label: "Rebus air", explanation: "Air direbus terlebih dahulu.", source_refs: [ref] },
  { id: "teh", label: "Seduh teh", explanation: "Kemudian seduh teh dengan air.", source_refs: [ref] },
];
const sequence: Visual = { kind: "sequence", title: "Menyeduh teh", nodes, links: [], columns: [], rows: [] };
const sampleUnit = {
  id: "unit_1", title: "Membuat minuman", learning_objective: "Menjelaskan tahapan menyeduh teh.",
  concepts: [], source_refs: [ref], suggested_visual: "sequence", suggested_activity: "none", visual: sequence,
};

const state = { state: "NOT_GENERATED", revision: 0, published_revision: null, error: null, units: [], sources: [] };
afterEach(() => vi.unstubAllGlobals());

const infoRef = [{ segment_id: "seg_1", quote: "Model bigram memprediksi kata" }];
const info = {
  title: "Model Bahasa N-Gram", subtitle: "Ringkasan materi",
  big_idea: { text: "Kata berikutnya ditebak dari kata sebelumnya.", source_refs: infoRef },
  definition: { text: "Bigram memakai satu kata sebelumnya.", source_refs: infoRef },
  pillars: [{ name: "Smoothing", desc: "Menambah satu pada hitungan.", source_refs: infoRef }],
  flow_title: "", flow_steps: [],
  key_facts: [{ label: "Rumus bigram", value: "P(wn|wn-1) = C(wn-1 wn) / C(wn-1)", explanation: "", source_refs: infoRef }],
  metrics: [], application: null,
  analogy: { title: "Seperti menebak lirik lagu", story: "Kita menebak kata berikutnya dari kata sebelumnya." },
  takeaway: { text: "Konteks pendek membantu prediksi.", source_refs: infoRef },
};

describe("Learning unit review", () => {
  it("shows the approved infographic to visual students without invented zones", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ...state, units: [sampleUnit], infographic: info }) })));
    render(<LearningUnits documentId="doc" showVisual />);
    expect((await screen.findAllByText("Model Bahasa N-Gram")).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Poster infografis Model Bahasa N-Gram" })).toBeTruthy(); // no diagram → poster first
    expect(screen.getAllByText("P(wn|wn-1) = C(wn-1 wn) / C(wn-1)").length).toBeGreaterThan(0); // poster and stage cards
    expect(screen.getByText("Analogi (dibuat AI, bukan dari materi)")).toBeTruthy();
    expect(screen.getByText(/Tahap 3: Penerapan & Analogi/)).toBeTruthy(); // no empty flow stage in between
    expect(screen.queryByText(/Progres pemahaman/)).toBeNull();
    const infographicZone = screen.getByRole("region", { name: "Infografis materi" });
    expect(within(infographicZone).queryByText(/%$/)).toBeNull(); // no invented percentages
    expect(screen.queryByText("Edit infografis")).toBeNull();
  });

  it("warns the teacher about lettering left in AI pictures and can redraw them", async () => {
    const image = { state: "READY", hero_url: "/uploads/images/doc_ai_1234abcd.png", icons: [], lettered: ["Ilustrasi utama"] };
    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => ({
      ok: true,
      json: async () => (options?.method === "POST" ? { state: "PROCESSING" } : { ...state, state: "DRAFT", units: [sampleUnit], infographic: info, image }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(<LearningUnits documentId="doc" teacher />);
    expect(await screen.findByText(/mungkin masih ada tulisan yang tidak perlu: Ilustrasi utama/)).toBeTruthy();
    const poster = screen.getByRole("img", { name: "Poster infografis Model Bahasa N-Gram" });
    expect(poster.querySelector("image")!.getAttribute("href")).toBe("http://localhost:8000/uploads/images/doc_ai_1234abcd.png");
    fireEvent.click(screen.getByText("Buat ulang gambar"));
    expect(await screen.findByText(/Gambar sedang dibuat/)).toBeTruthy();
    expect(fetchMock.mock.calls.some(([url, o]) => String(url).endsWith("/learning-units/image") && o?.method === "POST")).toBe(true);
  });

  it("saves teacher edits to the infographic together with the units", async () => {
    let response = { ...state, state: "DRAFT", units: [sampleUnit], infographic: info };
    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => {
      if (options?.method === "PUT") response = { ...response, ...JSON.parse(options.body as string), revision: 1 };
      return { ok: true, json: async () => response };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<LearningUnits documentId="doc" teacher />);
    fireEvent.click(await screen.findByText("Edit infografis"));
    fireEvent.change(screen.getAllByLabelText("Judul")[0], { target: { value: "N-Gram untuk Kelas 10" } });
    fireEvent.click(screen.getByText("Simpan perubahan"));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, o]) => o?.method === "PUT")).toBe(true));
    const body = JSON.parse(fetchMock.mock.calls.find(([, o]) => o?.method === "PUT")![1]!.body as string);
    expect(body.infographic.title).toBe("N-Gram untuk Kelas 10");
  });

  it("shows an honest empty state without invented content", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => state })));
    render(<LearningUnits documentId="doc" />);
    expect(await screen.findByText("Unit belajar belum dipublikasikan oleh guru.")).toBeTruthy();
    expect(screen.queryByText("86.5%")).toBeNull();
    expect(screen.queryByText("Setujui & tampilkan ke siswa")).toBeNull();
  });

  it("renders accessible sequence, map relationships and comparison cells", () => {
    const sources = () => <p>{ref.quote}</p>;
    const { rerender } = render(<UnitVisual visual={sequence} sources={sources} />);
    expect(screen.getByRole("list", { name: "Langkah berurutan" })).toBeTruthy();
    expect(screen.getByText("Air direbus terlebih dahulu.")).toBeTruthy();
    rerender(<UnitVisual visual={{ ...sequence, kind: "concept_map", links: [{ source: "air", target: "teh", label: "dilanjutkan dengan", source_refs: [ref] }] }} sources={sources} />);
    expect(screen.getByRole("list", { name: "Hubungan antarkonsep" }).textContent).toContain("dilanjutkan dengan");
    rerender(<UnitVisual visual={{ ...sequence, kind: "comparison", nodes: [], columns: ["Teh panas", "Teh dingin"], rows: [{ aspect: "Suhu relatif", values: ["Lebih hangat", "Lebih dingin"], source_refs: [ref] }] }} sources={sources} />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.getByRole("cell", { name: "Lebih dingin" })).toBeTruthy();
  });

  it("shows published visuals without teacher editing controls", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ...state, units: [sampleUnit] }) })));
    render(<LearningUnits documentId="doc" showVisual />);
    expect(await screen.findByText("Menyeduh teh")).toBeTruthy();
    expect(screen.queryByText("Edit visual")).toBeNull();
    expect(screen.queryByText("Setujui & tampilkan ke siswa")).toBeNull();
  });

  it("keeps old units readable without inventing a visual", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ...state, units: [{ ...sampleUnit, visual: null }] }) })));
    render(<LearningUnits documentId="doc" showVisual />);
    expect(await screen.findByText(/Visual belum tersedia untuk unit ini/)).toBeTruthy();
    expect(screen.queryByText("Menyeduh teh")).toBeNull();
  });

  it("saves teacher visual edits before enabling approval", async () => {
    let response = { ...state, state: "DRAFT", units: [sampleUnit] };
    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => {
      if (options?.method === "PUT") response = { ...response, ...JSON.parse(options.body as string), revision: 1 };
      return { ok: true, json: async () => response };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<LearningUnits documentId="doc" teacher />);
    const title = await screen.findByLabelText("Judul visual");
    fireEvent.change(title, { target: { value: "Urutan membuat teh" } });
    expect((screen.getByText("Setujui & tampilkan ke siswa") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText("Simpan perubahan"));
    await waitFor(() => expect((screen.getByText("Setujui & tampilkan ke siswa") as HTMLButtonElement).disabled).toBe(false));
    const save = fetchMock.mock.calls.find(([, options]) => options?.method === "PUT");
    expect(JSON.parse(save![1]!.body as string).units[0].visual.title).toBe("Urutan membuat teh");
    expect(fetchMock.mock.calls.every(([url]) => !url.includes("podcast"))).toBe(true);
  });

  it("does not report failed generation as success", async () => {
    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => options?.method === "POST"
      ? { ok: false, status: 403, json: async () => ({ detail: "Akses ditolak" }) }
      : { ok: true, status: 200, json: async () => state });
    vi.stubGlobal("fetch", fetchMock);
    render(<LearningUnits documentId="doc" teacher />);
    fireEvent.click(await screen.findByText("Susun isi belajar"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Akses ditolak"));
    expect(fetchMock.mock.calls.every(([url]) => !url.includes("podcast"))).toBe(true);
  });
});
