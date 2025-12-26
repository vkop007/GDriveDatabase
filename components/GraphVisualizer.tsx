"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Database, FileJson, Network, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

/* ---------------- TYPES ---------------- */

interface TreeData {
  id: string;
  name: string;
  tables: {
    id: string;
    name: string;
    schema?: {
      key: string;
      type: string;
      relationTableId?: string;
    }[];
  }[];
}

interface GraphVisualizerProps {
  treeData: TreeData[];
}

/* ---------------- NODES ---------------- */

function RootNode({ data }: { data: any }) {
  return (
    <div className="relative group cursor-pointer">
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {/* Multi-layer animated glow */}
      <div
        className="absolute -inset-8 rounded-[32px] bg-gradient-to-r 
        from-pink-500/30 via-purple-500/30 to-pink-500/30 
        blur-3xl animate-pulse"
      />
      <div
        className="absolute -inset-4 rounded-[28px] bg-gradient-to-br 
        from-pink-600/20 to-purple-600/20 
        blur-2xl opacity-80"
      />

      {/* Animated border gradient */}
      <div className="absolute -inset-[2px] rounded-[26px] bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 opacity-60 animate-gradient-x" />

      <div
        className="relative px-10 py-7 min-w-[300px] rounded-3xl 
        bg-gradient-to-br from-neutral-900/98 via-neutral-900/95 to-neutral-800/90 
        backdrop-blur-3xl 
        shadow-[0_8px_32px_rgba(236,72,153,0.3),0_0_80px_rgba(168,85,247,0.15)]
        transition-all duration-500
        group-hover:shadow-[0_12px_48px_rgba(236,72,153,0.4),0_0_100px_rgba(168,85,247,0.25)]"
      >
        <div className="flex items-center justify-center gap-5">
          {/* Premium icon container with inner glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 blur-lg opacity-60" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Network size={28} className="text-white drop-shadow-lg" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
              {data.label}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-pink-300/90 mt-1.5 font-medium">
              <Sparkles size={12} className="text-pink-400" />
              {data.dbCount} databases
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatabaseNode({ data }: { data: any }) {
  return (
    <div className="group relative transition-all duration-500 hover:-translate-y-2 cursor-pointer">
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {/* Animated glow on hover */}
      <div className="absolute -inset-4 rounded-[22px] bg-gradient-to-br from-pink-500/15 via-fuchsia-500/10 to-purple-500/15 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />

      {/* Subtle border glow */}
      <div className="absolute -inset-[1px] rounded-[18px] bg-gradient-to-br from-pink-500/40 via-transparent to-purple-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div
        className="relative min-w-[240px] px-7 py-6 rounded-2xl 
        bg-gradient-to-br from-neutral-900/95 via-neutral-900/90 to-neutral-800/85
        backdrop-blur-2xl 
        border border-neutral-700/50 
        shadow-[0_4px_24px_rgba(0,0,0,0.5),0_0_40px_rgba(236,72,153,0.05)]
        transition-all duration-500
        group-hover:border-pink-500/30 
        group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(236,72,153,0.15)]"
      >
        <div className="flex items-center gap-4">
          {/* Icon with gradient background */}
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500/30 to-fuchsia-600/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500/25 via-pink-500/15 to-fuchsia-500/20 border border-pink-500/20 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:border-pink-500/40">
              <Database
                size={20}
                className="text-pink-400 transition-colors duration-300 group-hover:text-pink-300"
              />
            </div>
          </div>
          <div>
            <div className="text-white font-semibold text-lg tracking-tight group-hover:text-pink-50 transition-colors duration-300">
              {data.label}
            </div>
            <div className="text-sm text-neutral-400 mt-1 group-hover:text-neutral-300 transition-colors duration-300">
              {data.tableCount} tables
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableNode({ data }: { data: any }) {
  return (
    <div className="group relative transition-all duration-400 hover:-translate-y-1.5 cursor-pointer">
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      {/* Add handles for left/right connections for relationships */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ opacity: 0 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ opacity: 0 }}
      />

      {/* Glow effect */}
      <div className="absolute -inset-3 rounded-[16px] bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-400" />

      {/* Border highlight */}
      <div className="absolute -inset-[1px] rounded-[14px] bg-gradient-to-br from-cyan-500/30 via-transparent to-teal-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      <div
        className="relative min-w-[200px] px-5 py-4 rounded-xl 
        bg-gradient-to-br from-neutral-900/90 via-neutral-900/85 to-neutral-850/80
        backdrop-blur-xl
        border border-neutral-700/40 
        shadow-[0_2px_16px_rgba(0,0,0,0.4)]
        transition-all duration-400
        group-hover:border-cyan-500/25 
        group-hover:shadow-[0_6px_28px_rgba(0,0,0,0.5),0_0_40px_rgba(34,211,238,0.1)]"
      >
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-neutral-800">
          {/* Icon with subtle gradient */}
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-cyan-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-teal-500/15 border border-cyan-500/15 flex items-center justify-center transition-all duration-400 group-hover:scale-110 group-hover:border-cyan-500/30">
              <FileJson
                size={15}
                className="text-cyan-400 transition-colors duration-300 group-hover:text-cyan-300"
              />
            </div>
          </div>
          <span className="text-sm font-medium text-neutral-200 group-hover:text-cyan-50 transition-colors duration-300">
            {data.label}
          </span>
        </div>

        {/* Columns List */}
        <div className="space-y-1">
          {data.schema && data.schema.length > 0 ? (
            data.schema.slice(0, 5).map((col: any) => (
              <div
                key={col.key}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-neutral-400">{col.key}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] bg-neutral-800/50 
                            ${
                              col.type === "relation"
                                ? "text-purple-400"
                                : col.type === "storage"
                                ? "text-orange-400"
                                : "text-neutral-500"
                            }`}
                >
                  {col.type}
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-neutral-600 italic">No columns</div>
          )}
          {data.schema && data.schema.length > 5 && (
            <div className="text-[10px] text-neutral-600 pt-1">
              +{data.schema.length - 5} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  root: RootNode,
  database: DatabaseNode,
  table: TableNode,
};

/* ---------------- MAIN ---------------- */

export default function GraphVisualizer({ treeData }: GraphVisualizerProps) {
  const router = useRouter();

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const width = 1400;
    const dbSpacing = 380;
    const tableSpacing = 280;

    nodes.push({
      id: "root",
      type: "root",
      position: { x: width / 2 - 150, y: 40 },
      data: { label: "All Databases", dbCount: treeData.length },
    });

    treeData.forEach((db, i) => {
      const x =
        width / 2 - ((treeData.length - 1) * dbSpacing) / 2 + i * dbSpacing;

      const dbId = `db-${db.id}`;

      nodes.push({
        id: dbId,
        type: "database",
        position: { x, y: 280 },
        data: {
          label: db.name,
          tableCount: db.tables.length,
          dbId: db.id,
        },
      });
      edges.push({
        id: `root-${dbId}`,
        source: "root",
        target: dbId,
        type: "smoothstep",
        animated: true,
        style: {
          stroke: "url(#pink-gradient)",
          strokeWidth: 2.5,
          strokeDasharray: "8 4",
        },
      });

      db.tables.forEach((t, j) => {
        const tx =
          x - ((db.tables.length - 1) * tableSpacing) / 2 + j * tableSpacing;

        const tableId = `table-${t.id}`;

        nodes.push({
          id: tableId,
          type: "table",
          position: { x: tx, y: 560 },
          data: {
            label: t.name,
            tableId: t.id,
            dbId: db.id,
            schema: t.schema,
          },
        });

        edges.push({
          id: `${dbId}-${tableId}`,
          source: dbId,
          target: tableId,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "url(#cyan-gradient)",
            strokeWidth: 2,
            strokeDasharray: "6 3",
          },
        });

        // Add relationships
        if (t.schema) {
          t.schema.forEach((col) => {
            if (col.type === "relation" && col.relationTableId) {
              const targetId = `table-${col.relationTableId}`;
              // We only add edge if target exists in our graph (cross-db relations might be tricky if not loaded)
              // But assume flat tree structure allows checking existence later or just adding edge

              edges.push({
                id: `${tableId}-${targetId}`,
                source: tableId,
                target: targetId,
                sourceHandle: "right", // use side handles for relations
                targetHandle: "left",
                type: "default",
                animated: true,
                style: {
                  stroke: "#a855f7", // purple for relations
                  strokeWidth: 1.5,
                },
                label: col.key,
                labelStyle: { fill: "#d8b4fe", fontWeight: 500, fontSize: 10 },
                labelBgStyle: { fill: "#3b0764", fillOpacity: 0.7 },
                labelBgPadding: [4, 2],
                labelBgBorderRadius: 4,
              });
            }
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [treeData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      if (node.type === "database") {
        router.push(`/dashboard/database/${node.data.dbId}`);
      }
      if (node.type === "table") {
        router.push(
          `/dashboard/database/${node.data.dbId}/table/${node.data.tableId}`
        );
      }
    },
    [router]
  );

  return (
    <div className="h-screen bg-neutral-950 relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-pink-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-[150px]" />
      </div>

      {/* SVG Gradients for edges */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <linearGradient
            id="pink-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#d946ef" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient
            id="cyan-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.3}
        maxZoom={1.4}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          gap={32}
          size={1.5}
          color="#1a1a1a"
          style={{ backgroundColor: "transparent" }}
        />
        <Controls className="!bg-neutral-900/90 !border-neutral-700/50 !rounded-xl !shadow-xl !backdrop-blur-xl" />
        <MiniMap
          zoomable
          pannable
          className="!bg-neutral-900/80 !border-neutral-700/40 !rounded-xl !shadow-xl !backdrop-blur-xl"
          maskColor="rgba(0, 0, 0, 0.7)"
          nodeColor={(n) =>
            n.type === "root"
              ? "#ec4899"
              : n.type === "database"
              ? "#d946ef"
              : "#22d3ee"
          }
        />
      </ReactFlow>

      {/* Custom styles for ReactFlow controls */}
      <style jsx global>{`
        .react-flow__controls {
          background: rgba(23, 23, 23, 0.9) !important;
          border: 1px solid rgba(64, 64, 64, 0.5) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(20px) !important;
          overflow: hidden;
        }
        .react-flow__controls-button {
          background: rgba(38, 38, 38, 0.95) !important;
          border: none !important;
          border-bottom: 1px solid rgba(64, 64, 64, 0.3) !important;
          color: #a3a3a3 !important;
          transition: all 0.2s ease !important;
        }
        .react-flow__controls-button:hover {
          background: rgba(64, 64, 64, 0.8) !important;
          color: #ffffff !important;
        }
        .react-flow__controls-button:last-child {
          border-bottom: none !important;
        }
        .react-flow__controls-button svg {
          fill: currentColor !important;
        }
        .react-flow__minimap {
          background: rgba(23, 23, 23, 0.85) !important;
          border: 1px solid rgba(64, 64, 64, 0.4) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(20px) !important;
        }
        .react-flow__edge-path {
          filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.3));
        }
      `}</style>
    </div>
  );
}
