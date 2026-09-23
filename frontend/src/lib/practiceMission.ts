import type { Infographic } from "@/components/student/SourcedInfographic";
import type { SourceRef, Visual } from "@/components/student/UnitVisual";

/**
 * Kinesthetic practice stages built only from teacher-approved content (no extra AI).
 * The stage ids and rules must stay identical to backend/app/services/practice_service.py, which enforces order.
 */
export type Card = { id: string; label: string; detail: string; example?: string; source_refs: SourceRef[] };
export type Level = "mudah" | "sedang" | "sulit" | "bonus";
export type SequenceStage = { id: string; kind: "sequence"; level: Level; title: string; instruction: string; items: Card[] };
export type MapGroup = { parent: Card; parentIsSlot: boolean; slots: Card[] };
export type MapStage = { id: string; kind: "map"; level: Level; title: string; instruction: string; root: Card; groups: MapGroup[] };
export type Stage = SequenceStage | MapStage;
type UnitLike = { id: string; title: string; visual?: Visual | null };

const MIN_ITEMS = 3;
const MIN_MAP_SLOTS = 2;
const MAX_UNIT_STAGES = 2;

export function buildMission(info: Infographic | null | undefined, units: UnitLike[]): Stage[] {
  const stages: Stage[] = [];
  const diagram = info?.diagram;
  const steps = info?.flow_steps ?? [];
  if (steps.length >= MIN_ITEMS) {
    stages.push({
      id: "sequence-main", kind: "sequence", level: "mudah", title: info!.flow_title || "Urutkan alur",
      instruction: "Susun langkah-langkah berikut sesuai urutan yang benar.",
      items: steps.map((step, i) => ({ id: `step-${i}`, label: step.title, detail: step.desc, source_refs: step.source_refs })),
    });
  } else if (diagram?.kind === "timeline" && diagram.nodes.length >= MIN_ITEMS) {
    stages.push({
      id: "sequence-main", kind: "sequence", level: "mudah", title: diagram.title || "Urutkan garis waktu",
      instruction: "Susun peristiwa berikut dari yang paling awal.",
      items: diagram.nodes.map(node => ({ id: node.id, label: node.detail ? `${node.label}: ${node.detail}` : node.label, detail: node.detail, example: node.example, source_refs: node.source_refs })),
    });
  }

  if (diagram?.kind === "mindmap") {
    const byId = new Map(diagram.nodes.map(node => [node.id, node]));
    const depth = (id: string): number => {
      let d = 0;
      for (let current = byId.get(id); current?.parent && d < 50; d++) current = byId.get(current.parent);
      return d;
    };
    const card = (id: string): Card => {
      const node = byId.get(id)!;
      return { id: node.id, label: node.label, detail: node.detail, example: node.example, source_refs: node.source_refs };
    };
    const root = diagram.nodes.find(node => !node.parent);
    const branches = diagram.nodes.filter(node => depth(node.id) === 1);
    const details = diagram.nodes.filter(node => depth(node.id) >= 2);
    if (root && branches.length >= MIN_MAP_SLOTS) {
      stages.push({
        id: "map-branches", kind: "map", level: "sedang", title: "Rakit cabang utama",
        instruction: `Seret setiap kartu ke cabang utama "${root.label}".`,
        root: card(root.id), groups: [{ parent: card(root.id), parentIsSlot: false, slots: branches.map(node => card(node.id)) }],
      });
    }
    if (root && details.length >= MIN_MAP_SLOTS) {
      const parents = [...new Set(details.map(node => node.parent!))];
      stages.push({
        id: "map-details", kind: "map", level: "sulit", title: "Rakit rinciannya",
        instruction: "Letakkan setiap konsep rinci di bawah induk yang tepat.",
        root: card(root.id),
        groups: parents.map(parent => ({
          parent: card(parent),
          parentIsSlot: depth(parent) >= 2, // its own name stays hidden until that card is placed correctly
          slots: details.filter(node => node.parent === parent).map(node => card(node.id)),
        })),
      });
    }
  }

  units
    .filter(unit => unit.visual?.kind === "sequence" && unit.visual.nodes.length >= MIN_ITEMS)
    .slice(0, MAX_UNIT_STAGES)
    .forEach(unit => stages.push({
      id: `sequence-unit-${unit.id}`, kind: "sequence", level: "bonus", title: unit.visual!.title || unit.title,
      instruction: "Tantangan bonus: urutkan proses dari bagian materi ini.",
      items: unit.visual!.nodes.map(node => ({ id: node.id, label: node.label, detail: node.explanation, source_refs: node.source_refs })),
    }));
  return stages;
}

/** Stage i is open only when every earlier stage is finished (the server enforces the same rule). */
export const isUnlocked = (stages: Stage[], completed: string[], index: number) =>
  stages.slice(0, index).every(stage => completed.includes(stage.id));

export const stageXp = (wrongChecks: number, hints: number) => Math.max(10, 30 - 5 * wrongChecks - 5 * hints);

/** Shuffles until the order differs from the answer, so a stage never starts already solved. */
export function shuffled<T extends { id: string }>(items: T[], random = Math.random): T[] {
  if (items.length < 2) return [...items];
  for (let attempt = 0; attempt < 20; attempt++) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (copy.some((item, i) => item.id !== items[i].id)) return copy;
  }
  return [...items.slice(1), items[0]];
}
