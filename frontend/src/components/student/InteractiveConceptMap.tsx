import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GroundedDocument, ReactFlowNodeData } from "@/types";
import { audioSynth } from "@/services/audioSynth";
import confetti from "canvas-confetti";
import {
  Eye,
  Sparkles,
  Layers,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  X,
  Maximize2,
  ArrowRight,
  GitBranch,
  Brain,
  Check,
  Award,
} from "@/components/ui/icons";

// --- CUSTOM CARD NODE COMPONENT ---
function ConceptNodeCard({ data, selected }: { data: any; selected?: boolean }) {
  const isFondasi = data.category?.toLowerCase().includes("fondasi") || data.category?.toLowerCase().includes("teori");
  const isProses = data.category?.toLowerCase().includes("proses") || data.category?.toLowerCase().includes("mekanisme");
  const isRegulasi = data.category?.toLowerCase().includes("regulasi") || data.category?.toLowerCase().includes("faktor");
  const isAplikasi = data.category?.toLowerCase().includes("aplikasi") || data.category?.toLowerCase().includes("terapan");

  const badgeBg = isFondasi
    ? "bg-[#D1EBE1] text-[#1D5E4D] border-[#9DE1CA]"
    : isProses
    ? "bg-[#E3DBF8] text-[#4B3B7A] border-[#D0C4F7]"
    : isRegulasi
    ? "bg-[#FFF4DC] text-[#785308] border-[#FFE299]"
    : "bg-[#EBF3FF] text-[#1E429F] border-[#C3D9FF]";

  const nodeBorder = selected
    ? "ring-3 ring-[#1D5E4D] shadow-lg scale-103"
    : "hover:ring-2 hover:ring-[#1D5E4D]/40 hover:shadow-md";

  return (
    <div
      className={`relative w-64 sm:w-72 bg-white rounded-2xl p-4 border border-[rgba(28,30,38,0.12)] shadow-xs transition-all duration-200 cursor-pointer ${nodeBorder} ${
        data.isCompleted ? "border-l-4 border-l-[#1D5E4D]" : ""
      }`}
      onClick={() => {
        audioSynth.playClickSound();
        if (data.onNodeClick) data.onNodeClick(data);
      }}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-[#1D5E4D] !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[#4B3B7A] !border-2 !border-white" />
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-[#1D5E4D] !border-2 !border-white" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-[#4B3B7A] !border-2 !border-white" />

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
          {data.category || "Konsep Inti"}
        </span>
        {data.isCompleted && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#1D5E4D]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Dipahami</span>
          </span>
        )}
      </div>

      {/* Node Title */}
      <h4 className="text-sm font-extrabold text-[#1C1E26] leading-snug line-clamp-2 mb-1.5">
        {data.title}
      </h4>

      {/* Short Definition */}
      <p className="text-xs text-[#5A5E70] leading-relaxed line-clamp-3 mb-2.5">
        {data.shortDefinition}
      </p>

      {/* Bottom Hint */}
      <div className="flex items-center justify-between pt-2 border-t border-black/5 text-[11px] font-bold text-[#1D5E4D]">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>Buka Detail & Analogi</span>
        </span>
        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}

const nodeTypes = {
  conceptNode: ConceptNodeCard,
};

interface InteractiveConceptMapProps {
  doc: GroundedDocument;
}

export default function InteractiveConceptMap({ doc }: InteractiveConceptMapProps) {
  // Parse raw visual nodes data
  const parsedNodesData: ReactFlowNodeData[] = useMemo(() => {
    if (doc.visualNodesJson) {
      try {
        const parsed = JSON.parse(doc.visualNodesJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn("[InteractiveConceptMap] Failed to parse visualNodesJson", e);
      }
    }

    // Smart programmatic fallback
    const paras = (doc.rawText || doc.summary || "").split("\n\n").filter((p) => p.trim().length > 30);
    return [
      {
        id: "node_1",
        title: `Fondasi & Hakikat: ${doc.title}`,
        category: "Fondasi Teori",
        shortDefinition: paras[0]?.slice(0, 140) || `Prinsip dasar pembangun materi ${doc.title}.`,
        detailedExplanation: (paras[0] || `Pembahasan ini mencakup terminologi, parameter kunci, dan kerangka ilmiah dasar.`) + " Konsep ini menjadi tumpuan utama dalam memahami bab secara menyeluruh.",
        keyPrinciples: ["Definisi terminologi ilmiah", "Karakteristik variabel pokok", "Postulat dasar sistem"],
        realWorldAnalogy: "Bagaikan fondasi bangunan bertingkat yang menopang seluruh lantai di atasnya.",
        visualMetaphor: "Balok tumpuan yang kokoh dengan aliran energi ke seluruh cabang.",
        practicalApplications: ["Identifikasi parameter dasar eksperimen", "Penyusunan hipotesis awal"],
        connections: ["node_2", "node_3"],
        position: { x: 80, y: 60 },
      },
      {
        id: "node_2",
        title: "Mekanisme & Aliran Proses",
        category: "Mekanisme & Proses",
        shortDefinition: paras[1]?.slice(0, 140) || "Hubungan timbal balik dan dinamika interaksi antar-elemen konsep.",
        detailedExplanation: (paras[1] || "Mekanisme proses berjalan melalui interaksi dinamis antar komponen.") + " Setiap perubahan pada satu variabel langsung mempengaruhi variabel lainnya.",
        keyPrinciples: ["Hukum aksi-reaksi sistemik", "Faktor katalisator dan akselerator", "Dinamika kesetimbangan"],
        realWorldAnalogy: "Bagaikan gir-gir mesin jam mekanik yang berputar harmonis menciptakan detak waktu yang akurat.",
        visualMetaphor: "Rangkaian roda gigi saling mengunci dengan panah energi yang mengalir terus menerus.",
        practicalApplications: ["Prediksi luaran eksperimen laboratorium", "Pengendalian laju proses"],
        connections: ["node_3", "node_4"],
        position: { x: 420, y: 60 },
      },
      {
        id: "node_3",
        title: "Regulasi & Faktor Pengendali",
        category: "Regulasi Sistem",
        shortDefinition: paras[2]?.slice(0, 140) || "Parameter pengendali yang menjaga stabilitas kondisi ideal.",
        detailedExplanation: "Sistem ini memerlukan regulasi ketat terhadap kondisi lingkungan eksternal dan internal agar proses tetap berjalan pada efisiensi puncak tanpa mengalami disrupsi.",
        keyPrinciples: ["Toleransi ambang batas variabel", "Umpan balik regulasi sistem", "Respon adaptif kesetimbangan"],
        realWorldAnalogy: "Bagaikan termostat otomatis yang mengatur suhu ruangan agar tetap sejuk dan stabil.",
        visualMetaphor: "Katup pengaman dengan indikator jarum ukur yang berayun di zona hijau optimal.",
        practicalApplications: ["Optimasi kondisi reaksi", "Mitigasi anomali dan error"],
        connections: ["node_4"],
        position: { x: 80, y: 320 },
      },
      {
        id: "node_4",
        title: "Aplikasi Nyata & Sintesis",
        category: "Aplikasi Terapan",
        shortDefinition: paras[3]?.slice(0, 140) || "Implementasi praktis konsep dalam teknologi, lingkungan, dan kehidupan.",
        detailedExplanation: "Penguasaan konsep memungkinkan rekayasa teknologi terapan, pemecahan masalah saintifik nyata, serta inovasi dalam industri modern.",
        keyPrinciples: ["Optimalisasi pemanfaatan sistem", "Efisiensi konversi energi", "Keberlanjutan fungsi"],
        realWorldAnalogy: "Bagaikan mobil listrik mutakhir yang memadukan aerodinamika, motor listrik, dan baterai pintar.",
        visualMetaphor: "Pohon yang berbuah lebat sebagai hasil dari akar yang kokoh dan batang yang sehat.",
        practicalApplications: ["Inovasi bioteknologi/teknik terapan", "Pemecahan studi kasus nyata"],
        connections: ["node_1"],
        position: { x: 420, y: 320 },
      },
    ];
  }, [doc.visualNodesJson, doc.rawText, doc.summary, doc.title]);

  // State
  const [selectedNode, setSelectedNode] = useState<ReactFlowNodeData | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set());

  // Handle opening node detail side-panel
  const handleOpenNodeDetail = useCallback((nodeData: ReactFlowNodeData) => {
    setSelectedNode(nodeData);
  }, []);

  // Construct React Flow Nodes
  const initialNodes: Node[] = useMemo(() => {
    return parsedNodesData.map((node, index) => {
      const defaultCol = index % 2;
      const defaultRow = Math.floor(index / 2);
      const posX = node.position?.x ?? 80 + defaultCol * 340;
      const posY = node.position?.y ?? 60 + defaultRow * 260;

      return {
        id: node.id,
        type: "conceptNode",
        position: { x: posX, y: posY },
        data: {
          ...node,
          isCompleted: completedNodeIds.has(node.id),
          onNodeClick: handleOpenNodeDetail,
        },
      };
    });
  }, [parsedNodesData, completedNodeIds, handleOpenNodeDetail]);

  // Construct React Flow Edges
  const initialEdges: Edge[] = useMemo(() => {
    const edgesList: Edge[] = [];
    const validNodeIds = new Set(parsedNodesData.map((n) => n.id));

    parsedNodesData.forEach((node, idx) => {
      if (Array.isArray(node.connections) && node.connections.length > 0) {
        node.connections.forEach((targetId, cIdx) => {
          if (validNodeIds.has(targetId) && targetId !== node.id) {
            edgesList.push({
              id: `edge_${node.id}_${targetId}_${cIdx}`,
              source: node.id,
              target: targetId,
              animated: true,
              style: { stroke: "#1D5E4D", strokeWidth: 2.5, opacity: 0.75 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#1D5E4D",
                width: 14,
                height: 14,
              },
            });
          }
        });
      } else {
        // Sequential fallback connection
        const nextNode = parsedNodesData[idx + 1];
        if (nextNode) {
          edgesList.push({
            id: `edge_seq_${node.id}_${nextNode.id}`,
            source: node.id,
            target: nextNode.id,
            animated: true,
            style: { stroke: "#1D5E4D", strokeWidth: 2, opacity: 0.65 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#1D5E4D",
              width: 12,
              height: 12,
            },
          });
        }
      }
    });

    return edgesList;
  }, [parsedNodesData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Mark node as understood
  const handleMarkUnderstood = (nodeId: string) => {
    audioSynth.playLevelUpSound();
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
    setCompletedNodeIds((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
  };

  const progressPct = Math.round((completedNodeIds.size / Math.max(1, parsedNodesData.length)) * 100);

  return (
    <div className="space-y-4">
      {/* Header Info & Progress Bar */}
      <section className="clay-card bg-white p-4 sm:p-5 rounded-3xl border border-[rgba(28,30,38,0.06)] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF6F2] text-[#1D5E4D] flex items-center justify-center shadow-2xs">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1C1E26]">
                Peta Konsep Visual Interaktif
              </h2>
              <p className="text-xs text-[#5A5E70]">
                Klik setiap simpul konsep untuk membuka pembedahan visual, analogi, dan prinsip kunci.
              </p>
            </div>
          </div>

          {/* Counter Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-[#F8F9FD] px-3.5 py-2 rounded-2xl border border-black/5">
            <Award className="w-4 h-4 text-[#1D5E4D]" />
            <span className="text-xs font-black text-[#1C1E26]">
              {completedNodeIds.size} / {parsedNodesData.length} Simpul Dipelajari
            </span>
            <span className="text-[11px] font-bold text-[#1D5E4D] bg-[#D1EBE1] px-2 py-0.5 rounded-full">
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EFEFF4] h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#1D5E4D] to-[#4B3B7A] h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </section>

      {/* Main Canvas & Side Panel Container */}
      <div className="relative w-full h-[520px] sm:h-[600px] bg-[#F8F9FD] rounded-3xl border border-[rgba(28,30,38,0.08)] shadow-xs overflow-hidden">
        {/* React Flow Interactive Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.4}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-[#F8F9FD]"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#D8DCE8" />
          <Controls className="!bg-white !rounded-2xl !border !border-black/10 !shadow-xs !p-1" />
          <MiniMap
            nodeColor="#1D5E4D"
            maskColor="rgba(240, 242, 248, 0.7)"
            className="!rounded-2xl !border !border-black/10 !bg-white/90 !overflow-hidden hidden sm:block"
          />
        </ReactFlow>

        {/* Floating Helper Notice on Canvas */}
        <div className="absolute top-3 left-3 pointer-events-none bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-black/5 shadow-2xs text-[11px] font-bold text-[#5A5E70] flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-[#1D5E4D]" />
          <span>Geser &amp; perbesar kanvas bebas</span>
        </div>

        {/* Interactive Slide-in Side Panel */}
        {selectedNode && (
          <aside className="absolute top-0 right-0 w-full sm:w-[380px] md:w-[420px] h-full bg-white border-l border-[rgba(28,30,38,0.1)] shadow-xl z-20 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Side-Panel Header */}
            <div className="p-4 sm:p-5 border-b border-black/5 flex items-center justify-between bg-gradient-to-r from-[#F8F9FD] to-white">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#D1EBE1] text-[#1D5E4D] border border-[#9DE1CA]">
                  {selectedNode.category || "Konsep Terpilih"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  audioSynth.playClickSound();
                  setSelectedNode(null);
                }}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#5A5E70] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side-Panel Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-left">
              {/* Title & Short Def */}
              <div>
                <h3 className="text-lg font-black text-[#1C1E26] leading-tight mb-1.5">
                  {selectedNode.title}
                </h3>
                <p className="text-xs text-[#5A5E70] font-medium leading-relaxed bg-[#F8F9FD] p-3 rounded-2xl border border-black/5">
                  {selectedNode.shortDefinition}
                </p>
              </div>

              {/* 🔬 Detailed In-Depth Explanation */}
              {selectedNode.detailedExplanation && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-[#1C1E26] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1D5E4D]" />
                    <span>Pembedahan Konseptual Mendalam:</span>
                  </h4>
                  <p className="text-xs text-[#33384B] leading-relaxed font-normal bg-white p-3.5 rounded-2xl border border-black/5 shadow-2xs">
                    {selectedNode.detailedExplanation}
                  </p>
                </div>
              )}

              {/* ⚡ Key Principles */}
              {Array.isArray(selectedNode.keyPrinciples) && selectedNode.keyPrinciples.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-[#1C1E26] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4B3B7A]" />
                    <span>Prinsip &amp; Kaidah Pokok:</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedNode.keyPrinciples.map((principle, pIdx) => (
                      <li
                        key={pIdx}
                        className="text-xs text-[#33384B] flex items-start gap-2 bg-[#F4F0FD]/60 p-2.5 rounded-xl border border-[#E3DBF8]/70"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4B3B7A] mt-1.5 shrink-0" />
                        <span>{principle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 💡 Real-World Analogy */}
              {selectedNode.realWorldAnalogy && (
                <div className="bg-[#FFF9EE] p-3.5 rounded-2xl border border-[#FFE299] space-y-1">
                  <h4 className="text-xs font-extrabold text-[#785308] flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Analogi Dunia Nyata:</span>
                  </h4>
                  <p className="text-xs text-[#5C3F00] leading-relaxed italic">
                    "{selectedNode.realWorldAnalogy}"
                  </p>
                </div>
              )}

              {/* 🎨 Visual Metaphor */}
              {selectedNode.visualMetaphor && (
                <div className="bg-[#EBF6F2] p-3.5 rounded-2xl border border-[#9DE1CA] space-y-1">
                  <h4 className="text-xs font-extrabold text-[#1D5E4D] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Gambaran Visual Mental:</span>
                  </h4>
                  <p className="text-xs text-[#124B3D] leading-relaxed">
                    {selectedNode.visualMetaphor}
                  </p>
                </div>
              )}

              {/* 🚀 Practical Applications */}
              {Array.isArray(selectedNode.practicalApplications) && selectedNode.practicalApplications.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-extrabold text-[#1C1E26] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#1E429F]" />
                    <span>Penerapan Praktis:</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.practicalApplications.map((app, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[11px] font-bold text-[#1E429F] bg-[#EBF3FF] px-2.5 py-1 rounded-xl border border-[#C3D9FF]"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Side-Panel Footer Action */}
            <div className="p-4 border-t border-black/5 bg-white space-y-2">
              <button
                type="button"
                onClick={() => handleMarkUnderstood(selectedNode.id)}
                className={`w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  completedNodeIds.has(selectedNode.id)
                    ? "bg-[#D1EBE1] text-[#1D5E4D] border border-[#9DE1CA]"
                    : "clay-btn clay-btn-dark shadow-xs"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completedNodeIds.has(selectedNode.id)
                    ? "Sudah Ditandai Paham ✓"
                    : "Tandai Konsep Ini Dipahami"}
                </span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
