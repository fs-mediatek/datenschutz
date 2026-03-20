"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeDragHandler,
  BackgroundVariant,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import CustomNode, { type CustomNodeData } from "@/components/flow/CustomNode";
import EdgeLabelModal from "@/components/flow/EdgeLabelModal";
import NodeEditPopover from "@/components/flow/NodeEditPopover";

// ---- Types ----

interface VVTProcess {
  id: string;
  name: string;
}

interface ApiMapNode {
  id: string;
  label: string;
  type: string;
  positionX: number;
  positionY: number;
  processId: string | null;
  process?: { id: string; name: string } | null;
}

interface ApiMapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  dataType: string | null;
  transferType: string | null;
}

interface DataMap {
  id: string;
  name: string;
  description: string | null;
  nodes: ApiMapNode[];
  edges: ApiMapEdge[];
}

// ---- Node type config ----

const nodeTypeButtons = [
  { type: "process", label: "Prozess", color: "bg-blue-100 border-blue-400 text-blue-700", icon: "\u2699\uFE0F" },
  { type: "system", label: "System", color: "bg-green-100 border-green-400 text-green-700", icon: "\uD83D\uDDA5\uFE0F" },
  { type: "person", label: "Person/Abteilung", color: "bg-orange-100 border-orange-400 text-orange-700", icon: "\uD83D\uDC64" },
  { type: "external", label: "Externer Empfänger", color: "bg-red-100 border-red-400 text-red-700", icon: "\uD83C\uDF10" },
  { type: "datasource", label: "Datenquelle", color: "bg-purple-100 border-purple-400 text-purple-700", icon: "\uD83D\uDDC4\uFE0F" },
  { type: "archive", label: "Archiv/Löschung", color: "bg-gray-100 border-gray-400 text-gray-700", icon: "\uD83D\uDDD1\uFE0F" },
];

const nodeTypes = { custom: CustomNode };

// ---- Page Component ----

export default function DataMapEditorPage() {
  const params = useParams();
  const router = useRouter();
  const mapId = params.id as string;

  // State
  const [mapData, setMapData] = useState<DataMap | null>(null);
  const [mapName, setMapName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [processes, setProcesses] = useState<VVTProcess[]>([]);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Edge creation modal
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [showEdgeModal, setShowEdgeModal] = useState(false);

  // Node edit popover
  const [editingNode, setEditingNode] = useState<{
    id: string;
    label: string;
    processId: string | null;
    processName: string | null;
    position: { x: number; y: number };
  } | null>(null);

  // Process node creation
  const [addingNodeType, setAddingNodeType] = useState<string | null>(null);
  const [addNodeLabel, setAddNodeLabel] = useState("");
  const [addNodeProcessId, setAddNodeProcessId] = useState<string | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  // Debounce ref for position saves
  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Load data ----

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mapRes, procRes] = await Promise.all([
          fetch(`/api/data-maps/${mapId}`),
          fetch("/api/processes"),
        ]);
        const mapJson: DataMap = await mapRes.json();
        const procJson: VVTProcess[] = await procRes.json();

        setMapData(mapJson);
        setMapName(mapJson.name);
        setProcesses(procJson);

        // Convert API nodes to ReactFlow nodes
        const rfNodes: Node<CustomNodeData>[] = mapJson.nodes.map((n) => ({
          id: n.id,
          type: "custom",
          position: { x: n.positionX, y: n.positionY },
          data: {
            label: n.label,
            type: n.type,
            processId: n.processId,
            processName: n.process?.name || null,
          },
        }));

        // Convert API edges to ReactFlow edges
        const rfEdges: Edge[] = mapJson.edges.map((e) => ({
          id: e.id,
          source: e.fromNodeId,
          target: e.toNodeId,
          label: e.label || undefined,
          type: "smoothstep",
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
          data: { dataType: e.dataType, transferType: e.transferType },
        }));

        setNodes(rfNodes);
        setEdges(rfEdges);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mapId, setNodes, setEdges]);

  // ---- Save map name ----

  const saveMapName = useCallback(async () => {
    if (!mapName.trim()) return;
    try {
      await fetch(`/api/data-maps/${mapId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: mapName }),
      });
    } catch (err) {
      console.error("Fehler beim Speichern des Namens:", err);
    }
  }, [mapId, mapName]);

  // ---- Save node positions (debounced) ----

  const savePositions = useCallback(
    (currentNodes: Node[]) => {
      if (positionSaveTimer.current) clearTimeout(positionSaveTimer.current);
      setSaved(false);

      positionSaveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          const positions = currentNodes.map((n) => ({
            id: n.id,
            positionX: n.position.x,
            positionY: n.position.y,
          }));
          await fetch(`/api/data-maps/${mapId}/nodes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(positions),
          });
          setSaved(true);
        } catch (err) {
          console.error("Fehler beim Speichern der Positionen:", err);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [mapId]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, _node) => {
      savePositions(nodes);
    },
    [nodes, savePositions]
  );

  // ---- Handle connection (edge creation) ----

  const onConnect = useCallback(
    (connection: Connection) => {
      setPendingConnection(connection);
      setShowEdgeModal(true);
    },
    []
  );

  const handleEdgeSave = useCallback(
    async (data: { label: string; dataType: string; transferType: string }) => {
      if (!pendingConnection) return;

      try {
        const res = await fetch(`/api/data-maps/${mapId}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromNodeId: pendingConnection.source,
            toNodeId: pendingConnection.target,
            label: data.label,
            dataType: data.dataType,
            transferType: data.transferType,
          }),
        });

        if (res.ok) {
          const newEdge = await res.json();
          setEdges((eds) =>
            addEdge(
              {
                ...pendingConnection,
                id: newEdge.id,
                label: newEdge.label || undefined,
                type: "smoothstep",
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2 },
                data: { dataType: newEdge.dataType, transferType: newEdge.transferType },
              },
              eds
            )
          );
        }
      } catch (err) {
        console.error("Fehler beim Erstellen der Verbindung:", err);
      } finally {
        setPendingConnection(null);
        setShowEdgeModal(false);
      }
    },
    [pendingConnection, mapId, setEdges]
  );

  // ---- Add node ----

  const openAddNodeModal = (type: string) => {
    setAddingNodeType(type);
    setAddNodeLabel("");
    setAddNodeProcessId(null);
    setShowAddNodeModal(true);
  };

  const handleAddNode = useCallback(
    async (label: string, type: string, processId: string | null) => {
      // Place node at a somewhat random position in the visible area
      const posX = 200 + Math.random() * 400;
      const posY = 100 + Math.random() * 300;

      try {
        const res = await fetch(`/api/data-maps/${mapId}/nodes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            type,
            positionX: posX,
            positionY: posY,
            processId,
          }),
        });

        if (res.ok) {
          const newNode = await res.json();
          const processName = processId
            ? processes.find((p) => p.id === processId)?.name || null
            : null;

          setNodes((nds) => [
            ...nds,
            {
              id: newNode.id,
              type: "custom",
              position: { x: newNode.positionX, y: newNode.positionY },
              data: {
                label: newNode.label,
                type: newNode.type,
                processId: newNode.processId,
                processName,
              },
            },
          ]);
        }
      } catch (err) {
        console.error("Fehler beim Erstellen des Knotens:", err);
      }
    },
    [mapId, setNodes, processes]
  );

  const confirmAddNode = () => {
    if (!addNodeLabel.trim() || !addingNodeType) return;
    handleAddNode(addNodeLabel, addingNodeType, addNodeProcessId);
    setShowAddNodeModal(false);
  };

  // Add process from sidebar as linked node
  const handleAddProcessNode = useCallback(
    (process: VVTProcess) => {
      handleAddNode(process.name, "process", process.id);
    },
    [handleAddNode]
  );

  // ---- Node click (edit popover) ----

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<CustomNodeData>) => {
      const rect = (_event.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
      const x = _event.clientX - (rect?.left || 0) + (rect?.left || 0);
      const y = _event.clientY - (rect?.top || 0) + (rect?.top || 0);

      setEditingNode({
        id: node.id,
        label: node.data.label,
        processId: node.data.processId || null,
        processName: node.data.processName || null,
        position: { x: Math.min(x, window.innerWidth - 300), y: Math.min(y, window.innerHeight - 350) },
      });
    },
    []
  );

  const handleNodeSave = useCallback(
    async (nodeId: string, data: { label: string; processId: string | null }) => {
      try {
        await fetch(`/api/data-maps/${mapId}/nodes/${nodeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: data.label,
            processId: data.processId,
          }),
        });

        const processName = data.processId
          ? processes.find((p) => p.id === data.processId)?.name || null
          : null;

        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    label: data.label,
                    processId: data.processId,
                    processName,
                  },
                }
              : n
          )
        );
        setEditingNode(null);
      } catch (err) {
        console.error("Fehler beim Aktualisieren des Knotens:", err);
      }
    },
    [mapId, setNodes, processes]
  );

  const handleNodeDelete = useCallback(
    async (nodeId: string) => {
      if (!confirm("Soll dieser Knoten wirklich gelöscht werden?")) return;

      try {
        await fetch(`/api/data-maps/${mapId}/nodes/${nodeId}`, { method: "DELETE" });
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        setEditingNode(null);
      } catch (err) {
        console.error("Fehler beim Löschen des Knotens:", err);
      }
    },
    [mapId, setNodes, setEdges]
  );

  // ---- Pane click to close popover ----

  const onPaneClick = useCallback(() => {
    setEditingNode(null);
  }, []);

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-slate-400">Laden...</div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="text-xl text-slate-400 mb-2">Datenlandkarte nicht gefunden</div>
          <button
            onClick={() => router.push("/datenlandkarte")}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/datenlandkarte")}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            ← Zurück
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <input
            type="text"
            value={mapName}
            onChange={(e) => {
              setMapName(e.target.value);
              setSaved(false);
            }}
            onBlur={saveMapName}
            className="text-lg font-semibold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 px-1 -mx-1 rounded hover:bg-slate-50 focus:bg-slate-50"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {saving ? "Speichert..." : saved ? "✓ Gespeichert" : "Ungespeicherte Änderungen"}
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            {sidebarOpen ? "Seitenleiste ausblenden" : "Seitenleiste einblenden"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-[260px] shrink-0 bg-white border-r border-slate-200 shadow-sm overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Knoten hinzufügen
              </h3>
              <div className="space-y-1.5">
                {nodeTypeButtons.map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => openAddNodeModal(btn.type)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:shadow-sm transition-shadow cursor-pointer ${btn.color}`}
                  >
                    <span>{btn.icon}</span>
                    <span className="font-medium">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Existierende Prozesse
              </h3>
              {processes.length === 0 ? (
                <p className="text-xs text-slate-400">Keine VVT-Prozesse vorhanden.</p>
              ) : (
                <div className="space-y-1">
                  {processes.map((proc) => (
                    <button
                      key={proc.id}
                      onClick={() => handleAddProcessNode(proc)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 hover:shadow-sm transition-all cursor-pointer text-left"
                      title={`Prozess "${proc.name}" als Knoten hinzufügen`}
                    >
                      <span className="text-xs">⚙️</span>
                      <span className="truncate font-medium text-xs">{proc.name}</span>
                      <span className="ml-auto text-blue-400 text-[10px]">🔗</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ReactFlow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-50"
          >
            <Controls position="bottom-right" />
            <MiniMap
              nodeStrokeWidth={3}
              pannable
              zoomable
              position="bottom-left"
              style={{ width: 150, height: 100 }}
            />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
          </ReactFlow>
        </div>
      </div>

      {/* Edge Label Modal */}
      <EdgeLabelModal
        open={showEdgeModal}
        onClose={() => {
          setShowEdgeModal(false);
          setPendingConnection(null);
        }}
        onSave={handleEdgeSave}
      />

      {/* Node Edit Popover */}
      {editingNode && (
        <NodeEditPopover
          open={true}
          nodeId={editingNode.id}
          label={editingNode.label}
          processId={editingNode.processId}
          processName={editingNode.processName}
          processes={processes}
          position={editingNode.position}
          onClose={() => setEditingNode(null)}
          onSave={handleNodeSave}
          onDelete={handleNodeDelete}
        />
      )}

      {/* Add Node Modal */}
      {showAddNodeModal && addingNodeType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {nodeTypeButtons.find((b) => b.type === addingNodeType)?.icon}{" "}
              {nodeTypeButtons.find((b) => b.type === addingNodeType)?.label} hinzufügen
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bezeichnung
                </label>
                <input
                  type="text"
                  value={addNodeLabel}
                  onChange={(e) => setAddNodeLabel(e.target.value)}
                  placeholder="Name des Knotens..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAddNode();
                  }}
                />
              </div>
              {addingNodeType === "process" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mit VVT-Prozess verknüpfen (optional)
                  </label>
                  <select
                    value={addNodeProcessId || ""}
                    onChange={(e) => setAddNodeProcessId(e.target.value || null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Kein Prozess</option>
                    {processes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddNodeModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmAddNode}
                disabled={!addNodeLabel.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
