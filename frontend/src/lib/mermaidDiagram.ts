import type { SourceRef } from "@/components/student/UnitVisual";

export type DiagramNode = {
  id: string; label: string; parent: string | null; detail: string; example?: string; source_refs: SourceRef[];
};
export type DiagramEdge = { source: string; target: string; label: string };
export type Diagram = { kind: "mindmap" | "flowchart" | "timeline"; title: string; nodes: DiagramNode[]; edges: DiagramEdge[] };

// Mermaid source is built here from validated data; text from the material is never inserted unescaped.
const clean = (text: string) =>
  text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/%%/g, "%")
    .replace(/["`]/g, "'")
    .replace(/[<>]/g, "")
    .replace(/#/g, "＃")
    .replace(/[|]/g, "/")
    .replace(/\s+/g, " ")
    .trim();
// Prefixing avoids Mermaid keywords such as "end" being read as syntax.
const nodeId = (id: string) => `n_${id.replace(/[^A-Za-z0-9_]/g, "_")}`;

export function toMermaid(diagram: Diagram): string {
  if (diagram.kind === "flowchart") {
    const lines = ["flowchart TD"];
    for (const node of diagram.nodes) lines.push(`  ${nodeId(node.id)}["${clean(node.label)}"]`);
    for (const edge of diagram.edges) {
      const label = clean(edge.label);
      lines.push(`  ${nodeId(edge.source)} -->${label ? `|"${label}"|` : ""} ${nodeId(edge.target)}`);
    }
    return lines.join("\n");
  }
  if (diagram.kind === "timeline") {
    // Timeline items are unquoted and ":" separates period from event, so both sides drop colons.
    const bare = (text: string) => clean(text).replace(/[:;]/g, " -");
    const lines = ["timeline", `  title ${bare(diagram.title)}`];
    for (const node of diagram.nodes) {
      lines.push(node.detail ? `  ${bare(node.label)} : ${bare(node.detail)}` : `  ${bare(node.label)}`);
    }
    return lines.join("\n");
  }
  const children = new Map<string | null, DiagramNode[]>();
  for (const node of diagram.nodes) children.set(node.parent, [...(children.get(node.parent) || []), node]);
  const lines = ["mindmap"];
  const walk = (node: DiagramNode, depth: number) => {
    const text = clean(node.label);
    const shape = depth === 1 ? `((\"${text}\"))` : `["${text}"]`;
    lines.push(`${"  ".repeat(depth)}${nodeId(node.id)}${shape}`);
    for (const child of children.get(node.id) || []) walk(child, depth + 1);
  };
  for (const root of children.get(null) || []) walk(root, 1);
  return lines.join("\n");
}

/** Label as it appears inside the rendered SVG, used to connect clicks back to a node. */
export const renderedLabel = (node: DiagramNode, kind: Diagram["kind"]) =>
  kind === "timeline" ? clean(node.label).replace(/[:;]/g, " -") : clean(node.label);
