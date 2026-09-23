import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { buildMission, isUnlocked, shuffled, stageXp } from "../lib/practiceMission";
import PracticeMission from "../components/student/PracticeMission";

const ref = [{ segment_id: "seg_1", quote: "Model bigram memprediksi kata" }];
const node = (id: string, parent: string | null = null) => ({ id, label: `Label ${id}`, parent, detail: `Penjelasan ${id}.`, example: "", source_refs: ref });
const text = (t: string) => ({ text: t, source_refs: ref });
const info = {
  title: "N-Gram", subtitle: "", big_idea: text("Gagasan pokok."), definition: text("Definisi."), pillars: [],
  flow_title: "Alur N-Gram",
  flow_steps: ["Tentukan kata awal", "Hitung peluang", "Pilih kata"].map((title, i) => ({ title, desc: `Uraian langkah ${i + 1}.`, source_refs: ref })),
  key_facts: [], metrics: [], application: null, analogy: null, takeaway: text("Kesimpulan."),
  diagram: { kind: "mindmap" as const, title: "Peta", edges: [], nodes: [node("r"), node("a", "r"), node("b", "r"), node("a1", "a"), node("b1", "b")] },
};
const seqUnit = { id: "unit_2", title: "Unit", visual: { kind: "sequence" as const, title: "Urutan unit", links: [], columns: [], rows: [],
  nodes: ["x", "y", "z"].map(id => ({ id, label: `Node ${id}`, explanation: `Uraian ${id}.`, source_refs: ref })) } };
const shortUnit = { ...seqUnit, id: "unit_3", visual: { ...seqUnit.visual, nodes: seqUnit.visual.nodes.slice(0, 2) } };
afterEach(() => vi.unstubAllGlobals());

describe("Practice mission stages", () => {
  it("derives the same ordered stages as the server", () => {
    // Same fixture as backend test_practice_stages_follow_the_approved_content.
    expect(buildMission(info, [seqUnit, shortUnit]).map(stage => stage.id))
      .toEqual(["sequence-main", "map-branches", "map-details", "sequence-unit-unit_2"]);
    expect(buildMission(info, []).map(stage => stage.level)).toEqual(["mudah", "sedang", "sulit"]);
    const timeline = { ...info, flow_steps: [], diagram: { ...info.diagram, kind: "timeline" as const, nodes: [node("p"), node("q"), node("s")] } };
    expect(buildMission(timeline, []).map(stage => stage.id)).toEqual(["sequence-main"]);
    expect(buildMission({ ...info, flow_steps: info.flow_steps.slice(0, 2), diagram: null }, [])).toEqual([]);
  });

  it("hides a detail group's parent name while that parent is itself a card to place", () => {
    const deep = { ...info, diagram: { ...info.diagram, nodes: [...info.diagram.nodes, node("a1x", "a1")] } };
    const details = buildMission(deep, []).find(stage => stage.id === "map-details")!;
    if (details.kind !== "map") throw new Error("expected a map stage");
    expect(details.groups.map(group => [group.parent.id, group.parentIsSlot])).toEqual([["a", false], ["b", false], ["a1", true]]);
  });

  it("unlocks stages strictly in order, never starts solved, and scores fairly", () => {
    const stages = buildMission(info, []);
    expect([0, 1, 2].map(i => isUnlocked(stages, [], i))).toEqual([true, false, false]);
    expect(isUnlocked(stages, ["sequence-main"], 2)).toBe(false);
    expect(isUnlocked(stages, ["sequence-main", "map-branches"], 2)).toBe(true);
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    for (let i = 0; i < 20; i++) expect(shuffled(items).map(item => item.id)).not.toEqual(["1", "2", "3"]);
    expect([stageXp(0, 0), stageXp(1, 1), stageXp(9, 9)]).toEqual([30, 20, 10]);
  });
});

describe("Practice mission for students", () => {
  const published = { units: [{ id: "unit_1", title: "Unit", visual: null }], infographic: info, sources: [{ id: "seg_1", label: "Halaman 1", page: 1 }] };
  const stub = (completed: string[] = []) => {
    const state = { completed: [...completed], xp: 0 };
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.endsWith("/learning-units")) return { ok: true, json: async () => published };
      if (options?.method === "POST") {
        const body = JSON.parse(String(options.body));
        state.completed.push(body.stage);
        state.xp += body.xp;
      }
      return { ok: true, json: async () => ({ stages: ["sequence-main", "map-branches", "map-details"], completed: state.completed, xp: state.xp }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };
  const placeInOrder = (labels: string[]) => {
    const slots = within(screen.getByRole("list", { name: "Urutan jawaban" })).getAllByRole("button");
    labels.forEach((label, i) => {
      fireEvent.click(within(screen.getByLabelText("Tumpukan kartu")).getByRole("button", { name: label }));
      fireEvent.click(slots[i]);
    });
  };

  it("keeps harder stages locked and opens the next one only after finishing the easy one", async () => {
    const fetchMock = stub();
    render(<PracticeMission documentId="doc" />);
    expect(await screen.findByText("Selesaikan “Alur N-Gram” dulu")).toBeTruthy();
    const path = screen.getByRole("list", { name: "Tahap misi" });
    expect(within(path).getByRole("button", { name: /sedang\s*Rakit cabang utama/ }).hasAttribute("disabled")).toBe(true);
    expect(within(path).getByRole("button", { name: /sulit\s*Rakit rinciannya/ }).hasAttribute("disabled")).toBe(true);

    // A wrong order: the misplaced cards come back to the pile with an explanation.
    placeInOrder(["Pilih kata", "Hitung peluang", "Tentukan kata awal"]);
    fireEvent.click(screen.getByRole("button", { name: "Periksa" }));
    expect(screen.getByText(/1 tepat, 2 belum tepat/)).toBeTruthy();
    expect(within(screen.getByLabelText("Tumpukan kartu")).getAllByRole("button")).toHaveLength(2);

    const slots = within(screen.getByRole("list", { name: "Urutan jawaban" })).getAllByRole("button");
    fireEvent.click(within(screen.getByLabelText("Tumpukan kartu")).getByRole("button", { name: "Tentukan kata awal" }));
    fireEvent.click(slots[0]);
    fireEvent.click(within(screen.getByLabelText("Tumpukan kartu")).getByRole("button", { name: "Pilih kata" }));
    fireEvent.click(slots[2]);
    fireEvent.click(screen.getByRole("button", { name: "Periksa" }));

    expect(await screen.findByText(/Tahap selesai! \+25 XP/)).toBeTruthy();
    expect(screen.getByRole("region", { name: "Pembahasan" }).textContent).toContain("Uraian langkah 1.");
    await waitFor(() => expect(fetchMock.mock.calls.some(([, o]) => o?.method === "POST" && JSON.parse(String(o.body)).stage === "sequence-main")).toBe(true));
    fireEvent.click(await screen.findByRole("button", { name: /Lanjut ke tahap berikutnya: Rakit cabang utama/ }));
    expect(await screen.findByText("Seret setiap kartu ke cabang utama \"Label r\". Seret kartu, atau ketuk kartu lalu ketuk tempatnya.")).toBeTruthy();
    expect(within(path).getByRole("button", { name: /sulit\s*Rakit rinciannya/ }).hasAttribute("disabled")).toBe(true); // still locked
  });

  it("lets the teacher preview every stage without recording progress", async () => {
    const fetchMock = stub();
    render(<PracticeMission documentId="doc" preview={{ infographic: info, units: [] }} />);
    const path = screen.getByRole("list", { name: "Tahap misi" });
    expect(within(path).getAllByRole("button").every(button => !button.hasAttribute("disabled"))).toBe(true);
    fireEvent.click(within(path).getByRole("button", { name: /Rakit rinciannya/ }));
    expect(screen.getByText("Level sulit")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
