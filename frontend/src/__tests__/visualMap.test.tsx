import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { toMermaid, type Diagram } from "../lib/mermaidDiagram";

const renderMock = vi.fn();
vi.mock("mermaid", () => ({ default: { initialize: vi.fn(), render: (...args: unknown[]) => renderMock(...args) } }));
import VisualMap from "../components/student/VisualMap";

const ref = [{ segment_id: "seg_1", quote: "Model bigram memprediksi kata" }];
const node = (id: string, label: string, parent: string | null = null, detail = "") => ({ id, label, parent, detail, source_refs: ref });
const mindmap: Diagram = {
  kind: "mindmap", title: "Peta N-Gram", edges: [],
  nodes: [node("root", "N-Gram"), node("bigram", "Bigram", "root", "Memakai satu kata sebelumnya."), node("end", "Smoothing \"Laplace\"", "root")],
};
const info = {
  title: "Model Bahasa N-Gram", subtitle: "",
  big_idea: { text: "Kata berikutnya ditebak dari kata sebelumnya.", source_refs: ref },
  definition: { text: "Bigram memakai satu kata sebelumnya.", source_refs: ref },
  pillars: [], flow_title: "", flow_steps: [], key_facts: [], metrics: [], application: null, analogy: null,
  takeaway: { text: "Konteks pendek membantu prediksi.", source_refs: ref },
  diagram: mindmap,
};
const sources = (refs: typeof ref) => <p>{refs[0].quote}</p>;
afterEach(() => renderMock.mockReset());

describe("Mermaid code from validated diagram data", () => {
  it("builds a mindmap, escaping quotes and avoiding Mermaid keywords", () => {
    const code = toMermaid(mindmap);
    expect(code.split("\n")[0]).toBe("mindmap");
    expect(code).toContain('n_root(("N-Gram"))');
    expect(code).toContain("    n_bigram[\"Bigram\"]");
    expect(code).toContain("n_end[\"Smoothing 'Laplace'\"]"); // "end" is prefixed, quotes neutralised
  });

  it("builds a top-down flowchart with labelled arrows", () => {
    const code = toMermaid({ kind: "flowchart", title: "Alur", nodes: [node("a", "Hitung | frekuensi"), node("b", "Bagi")],
      edges: [{ source: "a", target: "b", label: "lalu" }] });
    expect(code).toBe('flowchart TD\n  n_a["Hitung / frekuensi"]\n  n_b["Bagi"]\n  n_a -->|"lalu"| n_b');
  });

  it("builds a timeline without colons inside items", () => {
    const code = toMermaid({ kind: "timeline", title: "Sejarah: RI", edges: [],
      nodes: [node("a", "17 Agustus 1945", null, "Proklamasi: dibacakan")] });
    expect(code).toBe("timeline\n  title Sejarah - RI\n  17 Agustus 1945 : Proklamasi - dibacakan");
  });
});

describe("Visual map", () => {
  it("opens a node's explanation and source when its box is clicked", async () => {
    renderMock.mockResolvedValue({ svg: '<svg><g class="node"><rect/><text>Bigram</text></g><g class="node"><text>N-Gram</text></g></svg>' });
    const { container } = render(<VisualMap info={info} sources={sources} />);
    const box = await waitFor(() => {
      const shape = container.querySelector('svg g.node[role="button"]');
      expect(shape).toBeTruthy();
      return shape!;
    });
    expect(box.getAttribute("aria-label")).toBe("Lihat penjelasan: Bigram");
    fireEvent.click(box);
    expect(await screen.findByText("Memakai satu kata sebelumnya.")).toBeTruthy();
    expect(renderMock.mock.calls[0][1]).toContain("mindmap");
  });

  it("keeps every node clickable after opening explanations (no refresh needed)", async () => {
    const tree: Diagram = { kind: "mindmap", title: "Peta", edges: [], nodes: [
      node("root", "N-Gram"),
      { ...node("smooth", "Smoothing", "root", "Mengatasi peluang nol."), example: "Menambah satu pada setiap hitungan kata." },
      node("laplace", "Laplace", "smooth", "Menambah satu pada semua hitungan."),
    ] };
    renderMock.mockResolvedValue({ svg: '<svg><g class="node"><rect/><text>N-Gram</text></g><g class="node"><rect/><text>Smoothing</text></g><g class="node"><rect/><text>Laplace</text></g></svg>' });
    const { container } = render(<VisualMap info={{ ...info, diagram: tree }} sources={sources} />);
    const shape = async (label: string) => waitFor(() => {
      const found = container.querySelector(`[role="button"][aria-label="Lihat penjelasan: ${label}"]`);
      expect(found).toBeTruthy();
      return found!;
    });
    fireEvent.click(await shape("Smoothing"));
    expect(await screen.findByText("Mengatasi peluang nol.")).toBeTruthy();
    expect(screen.getByText("Menambah satu pada setiap hitungan kata.")).toBeTruthy(); // the example
    expect(screen.getByText("Bagian dari: N-Gram")).toBeTruthy();

    fireEvent.click(await shape("Laplace")); // second click on the same diagram, no refresh
    expect(await screen.findByText("Menambah satu pada semua hitungan.")).toBeTruthy();
    expect(screen.getByText("Bagian dari: N-Gram › Smoothing")).toBeTruthy();
    expect((await shape("Laplace")).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(await shape("Smoothing"));
    fireEvent.click(within(screen.getByRole("complementary")).getByRole("button", { name: "Laplace" })); // branch chip
    expect(await screen.findByText("Menambah satu pada semua hitungan.")).toBeTruthy();
  });

  it("falls back to a readable list when the diagram cannot be drawn", async () => {
    renderMock.mockRejectedValue(new Error("parse error"));
    render(<VisualMap info={info} sources={sources} />);
    expect(await screen.findByText(/Diagram belum dapat digambar/)).toBeTruthy();
    const list = screen.getByText("Lihat diagram sebagai daftar").closest("details")!;
    expect(list.open).toBe(true);
    fireEvent.click(within(list).getByText("Bigram"));
    expect(await screen.findByText("Memakai satu kata sebelumnya.")).toBeTruthy();
  });

  it("leads with the AI-illustrated infographic and keeps diagram nodes clickable after switching tabs", async () => {
    renderMock.mockResolvedValue({ svg: '<svg><g class="node"><rect/><text>Bigram</text></g></svg>' });
    const art = { hero: "http://localhost:8000/uploads/images/doc_ai_1234abcd.png", icons: {} };
    const { container } = render(<VisualMap info={{ ...info, pillars: [{ name: "Bigram", desc: "Dua kata.", source_refs: ref }] }}
      sources={sources} art={{ ...art, icons: { Bigram: "http://localhost:8000/uploads/images/doc_ai_5678abcd.png" } }} />);
    expect(screen.getByRole("tab", { name: "Infografis AI" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByRole("tab", { name: "Poster" })).toBeNull(); // replaced by the illustrated poster
    const poster = screen.getByRole("img", { name: "Poster infografis Model Bahasa N-Gram" });
    const hrefs = Array.from(poster.querySelectorAll("image")).map(image => image.getAttribute("href"));
    expect(hrefs).toEqual([art.hero, "http://localhost:8000/uploads/images/doc_ai_5678abcd.png"]);
    expect(poster.textContent).toContain("Model Bahasa N-Gram"); // text is set by the app, not drawn by AI
    fireEvent.click(screen.getByRole("tab", { name: "Peta pikiran" }));
    const box = await waitFor(() => {
      const shape = container.querySelector('svg g.node[role="button"]');
      expect(shape).toBeTruthy();
      return shape!;
    });
    fireEvent.click(box);
    expect(await screen.findByText("Memakai satu kata sebelumnya.")).toBeTruthy();
  });

  it("shows the poster tab built from the sourced infographic", async () => {
    renderMock.mockResolvedValue({ svg: "<svg></svg>" });
    render(<VisualMap info={info} sources={sources} />);
    fireEvent.click(screen.getByRole("tab", { name: "Poster" }));
    await waitFor(() => expect(screen.getByRole("img", { name: "Poster infografis Model Bahasa N-Gram" })).toBeTruthy());
  });
});
