// store.js — Zustand store with zundo undo/redo + persist middleware
import { create, useStore as useZustandStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';

const storeCore = (set, get) => ({
  nodes: [],
  edges: [],
  nodeIDs: {},
  activeNodeId: null,
  pipelineName: 'Untitled Pipeline',

  // Execution animation state
  isRunning: false,
  executingNodeIds: [], // nodes currently active in the animation

  // Terminal Bottom Panel state
  isTerminalOpen: false,
  isTerminalExpanded: true,

  // --- Queries ---
  getActiveNode: () => get().nodes.find((n) => n.id === get().activeNodeId),

  // --- Commands ---
  setPipelineName: (name) => set({ pipelineName: name }),
  setActiveNode: (id) => set({ activeNodeId: id }),
  setExecutionState: (isRunning, nodeIds = []) => set({ isRunning, executingNodeIds: nodeIds }),
  setTerminalState: (isOpen, isExpanded) => set({ isTerminalOpen: isOpen, isTerminalExpanded: isExpanded }),

  // Sidebar state
  isSidebarOpen: true,
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

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
          !selectedEdgeIds.has(e.id) &&       // directly selected edge
          !selectedNodeIds.has(e.source) &&    // source node deleted
          !selectedNodeIds.has(e.target)       // target node deleted
      ),
    });
  },

  clearCanvas: () => set({ nodes: [], edges: [], nodeIDs: {}, activeNodeId: null }),

  // --- Handlers ---
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    // Strip node-ID prefix from handle IDs (e.g. "customInput-1-value" → "value")
    const cleanHandle = (h) => h ? h.replace(/^.+-/, '') : null;
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
          label: srcLabel && tgtLabel ? `${srcLabel} → ${tgtLabel}` : (srcLabel || tgtLabel || undefined),
          labelStyle: { fontSize: 10, fontWeight: 600 },
          labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.85 },
        },
        get().edges
      ),
    });
  },

});

// Keys tracked by undo/redo (exclude transient UI state like activeNodeId)
const temporalPartialize = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
});

// Keys persisted to localStorage
const persistPartialize = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  nodeIDs: state.nodeIDs,
  pipelineName: state.pipelineName,
});

export const useStore = create(
  temporal(
    persist(storeCore, {
      name: 'vectorflow-pipeline',
      storage: createJSONStorage(() => localStorage),
      partialize: persistPartialize,
    }),
    { partialize: temporalPartialize, limit: 50 }
  )
);

/**
 * Direct vanilla store reference for imperative undo/redo calls in event callbacks.
 * Use: temporalStore.getState().undo()
 */
export const temporalStore = useStore.temporal;

/**
 * React hook to subscribe to the temporal (undo/redo) store reactively.
 * Use: const canUndo = useTemporalStore(s => s.pastStates.length > 0)
 */
export const useTemporalStore = (selector) =>
  useZustandStore(useStore.temporal, selector);
