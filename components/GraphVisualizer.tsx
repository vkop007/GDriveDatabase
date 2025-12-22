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
import { Database, FileJson, Network } from "lucide-react";
import { useRouter } from "next/navigation";

/* ---------------- TYPES ---------------- */

interface TreeData {
  id: string;
  name: string;
  tables: { id: string; name: string }[];
}

interface GraphVisualizerProps {
  treeData: TreeData[];
}

/* ---------------- NODES ---------------- */

function RootNode({ data }: { data: any }) {
  return (
    <div className="relative">
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div
        className="absolute -inset-6 rounded-3xl bg-gradient-to-r 
        from-pink-500/20 via-purple-500/20 to-pink-500/20 
        blur-3xl animate-pulse"
      />

      <div
        className="relative px-10 py-6 min-w-[280px] rounded-3xl 
        bg-neutral-900/95 backdrop-blur-2xl 
        border border-pink-500/30 shadow-2xl"
      >
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <Network size={26} className="text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.label}</div>
            <div className="text-xs text-pink-400 mt-1">
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
    <div className="group relative transition-all duration-300 hover:-translate-y-1">
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {/* Soft glow */}
      <div className="absolute -inset-3 rounded-2xl bg-neutral-400/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div
        className="relative min-w-[220px] px-7 py-5 rounded-2xl 
        bg-neutral-900/90 backdrop-blur-xl 
        border border-neutral-700/60 
        shadow-xl shadow-black/40 
        transition-all duration-300
        group-hover:border-neutral-600/80 group-hover:shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Database size={20} className="text-pink-400" />
          </div>
          <div>
            <div className="text-white font-semibold">{data.label}</div>
            <div className="text-xs text-neutral-400 mt-1">
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
    <div className="group relative transition-all duration-200 hover:-translate-y-0.5">
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div
        className="relative min-w-[170px] px-4 py-3 rounded-xl 
        bg-neutral-900/80 border border-neutral-700/50 
        shadow-md shadow-black/30 
        transition-all duration-200
        group-hover:border-neutral-600/70 group-hover:shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-400/15 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <FileJson size={14} className="text-cyan-400" />
          </div>
          <span className="text-sm text-neutral-200">{data.label}</span>
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
    const dbSpacing = 360;
    const tableSpacing = 260;

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
        position: { x, y: 260 },
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
          stroke: "#ff006e",
          strokeWidth: 2.5,
        },
      });

      db.tables.forEach((t, j) => {
        const tx =
          x - ((db.tables.length - 1) * tableSpacing) / 2 + j * tableSpacing;

        const tableId = `table-${t.id}`;

        nodes.push({
          id: tableId,
          type: "table",
          position: { x: tx, y: 520 },
          data: {
            label: t.name,
            tableId: t.id,
            dbId: db.id,
          },
        });

        edges.push({
          id: `${dbId}-${tableId}`,
          source: dbId,
          target: tableId,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#00d9ff",
            strokeWidth: 2,
          },
        });
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
    <div className="h-screen bg-neutral-950">
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
      >
        <Background gap={24} size={1} color="#2a2a2a" />
        <Controls />
        <MiniMap
          zoomable
          pannable
          nodeColor={(n) =>
            n.type === "root"
              ? "#ff006e"
              : n.type === "database"
              ? "#a855f7"
              : "#38bdf8"
          }
        />
      </ReactFlow>
    </div>
  );
}
