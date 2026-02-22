import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';

export const createCanvasSlice = (set, get) => ({
  nodes: [],
  edges: [],
  nodeIDs: {},
  activeNodeId: null,
  pipelineName: 'Untitled Pipeline',

  getActiveNode: () => get().nodes.find((n) => n.id === get().activeNodeId),

  setPipelineName: (name) => set({ pipelineName: name }),
  setActiveNode: (id) => set({ activeNodeId: id }),

  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) newIDs[type] = 0;
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },

  updateNodeData: (nodeId, dataUpdate) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, ...dataUpdate };
        }
        return node;
      }),
    });
  },

  deleteSelectedNodes: () => {
    const selectedNodeIds = new Set(
      get().nodes.filter((n) => n.selected).map((n) => n.id)
    );
    const selectedEdgeIds = new Set(
      get().edges.filter((e) => e.selected).map((e) => e.id)
    );
    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;
    set({
      nodes: get().nodes.filter((n) => !selectedNodeIds.has(n.id)),
      edges: get().edges.filter(
        (e) =>
          !selectedEdgeIds.has(e.id) &&
          !selectedNodeIds.has(e.source) &&
          !selectedNodeIds.has(e.target)
      ),
    });
  },

  clearCanvas: () => set({ nodes: [], edges: [], nodeIDs: {}, activeNodeId: null }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const cleanHandle = (h) => (h ? h.replace(/^.+-/, '') : null);
    const srcLabel = cleanHandle(connection.sourceHandle);
    const tgtLabel = cleanHandle(connection.targetHandle);

    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, height: 18, width: 18 },
          style: { strokeWidth: 2 },
          label: srcLabel && tgtLabel ? `${srcLabel} → ${tgtLabel}` : srcLabel || tgtLabel || undefined,
          labelStyle: { fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.85 },
        },
        get().edges
      ),
    });
  },
});
