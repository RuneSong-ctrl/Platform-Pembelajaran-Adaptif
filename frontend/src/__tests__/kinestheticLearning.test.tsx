import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import KinestheticLearning from "../components/student/KinestheticLearning";

const ref = [{ segment_id: "seg_1", quote: "Model bigram memprediksi kata" }];
const node = (id: string, label: string, parent: string | null = null, example = "") =>
  ({ id, label, parent, detail: `${label} adalah bagian penting. Kalimat kedua yang lebih rinci.`, example, source_refs: ref });
const text = (t: string) => ({ text: t, source_refs: ref });
const info = {
  title: "N-Gram", subtitle: "", big_idea: text("Gagasan pokok."), definition: text("Definisi."), pillars: [],
  flow_title: "Alur N-Gram",
  flow_steps: ["Tentukan kata awal", "Hitung peluang", "Pilih kata"].map((title, i) => ({ title, desc: `Uraian langkah ${i + 1}.`, caption: `Ringkas ${i + 1}`, source_refs: ref })),
  key_facts: [], metrics: [], application: null, analogy: null, takeaway: text("Kesimpulan."),
  diagram: { kind: "mindmap" as const, title: "Peta", edges: [],
    nodes: [node("r", "Model N-Gram"), node("a", "Jenis"), node("b", "Smoothing", "r"), node("a1", "Unigram", "a", "Peluang kata 'makan'.")].map(n => (n.id === "a" ? { ...n, parent: "r" } : n)) },
};
const units = [{ id: "unit_1", title: "Unit", visual: null }];

beforeEach(() => {
  // jsdom lacks pointer capture, which every browser has
  Element.prototype.setPointerCapture = () => undefined;
  // jsdom has no layout: give every board a desktop width
  vi.stubGlobal("ResizeObserver", class { constructor(private cb: ResizeObserverCallback) {} observe() { this.cb([{ contentRect: { width: 1000 } } as ResizeObserverEntry], this as unknown as ResizeObserver); } disconnect() {} unobserve() {} });
});
afterEach(() => vi.unstubAllGlobals());

describe("Kinesthetic material: Games and Challenge", () => {
  it("opens on Games; pulling a concept apart reveals its parts and an info card beside them", () => {
    render(<KinestheticLearning documentId="doc" preview={{ infographic: info, units }} />);
    expect(screen.getByRole("tab", { name: /Games/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("1/4 bagian ditemukan")).toBeTruthy();

    // keyboard stands in for the pull gesture: Enter breaks the concept open
    fireEvent.keyDown(screen.getByRole("button", { name: /Model N-Gram\. Berisi 2 bagian/ }), { key: "Enter" });
    expect(screen.getByText("3/4 bagian ditemukan")).toBeTruthy();
    const card = screen.getByRole("note");
    expect(within(card).getByText("Model N-Gram")).toBeTruthy();
    expect(within(card).getByText("Berisi 2 bagian:")).toBeTruthy();
    expect(within(card).getByText("Info baru")).toBeTruthy();

    fireEvent.keyDown(screen.getByRole("button", { name: /Jenis\. Berisi 1 bagian/ }), { key: "Enter" });
    const leaf = screen.getByRole("button", { name: "Unigram" });
    fireEvent.pointerDown(leaf, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerUp(leaf, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(within(screen.getByRole("note")).getByText(/Peluang kata 'makan'/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tutup info" }));
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("the gear game shows what each step did, and hides itself when a material has no process", () => {
    const { unmount } = render(<KinestheticLearning documentId="doc" preview={{ infographic: info, units }} />);
    fireEvent.click(screen.getByRole("button", { name: /Roda gigi proses/ }));
    const crank = screen.getByRole("slider", { name: /Engkol/ });
    for (let i = 0; i < 3; i++) fireEvent.keyDown(crank, { key: "ArrowRight" });
    const card = screen.getByRole("note");
    expect(within(card).getByText("Langkah 1 berjalan")).toBeTruthy();
    expect(within(card).getByText("Uraian langkah 1.")).toBeTruthy();
    for (let i = 0; i < 3; i++) fireEvent.keyDown(crank, { key: "ArrowLeft" });
    expect(screen.queryByRole("note")).toBeNull(); // turned back: the process rewinds
    unmount();

    render(<KinestheticLearning documentId="doc" preview={{ infographic: { ...info, flow_steps: [] }, units }} />);
    expect(screen.getByRole("button", { name: /Roda gigi proses/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Tidak ada di materi ini")).toBeTruthy();
  });

  it("Challenge is the staged drag-and-drop quiz, reachable any time", () => {
    render(<KinestheticLearning documentId="doc" preview={{ infographic: info, units }} />);
    fireEvent.click(screen.getByRole("tab", { name: /Challenge/ }));
    expect(screen.getByRole("list", { name: "Tahap misi" })).toBeTruthy();
    expect(screen.getByText("Level mudah")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Games/ }));
    expect(screen.getByText("1/4 bagian ditemukan")).toBeTruthy(); // Games kept its place
  });

  it("students see Games only once the teacher has approved the material", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ units: [], infographic: null, sources: [] }) }));
    vi.stubGlobal("fetch", fetchMock);
    render(<KinestheticLearning documentId="doc" />);
    expect(await screen.findByText("Games belum tersedia: guru belum menyetujui materi ini.")).toBeTruthy();
  });
});
