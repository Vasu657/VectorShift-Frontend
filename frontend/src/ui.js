// ui.js — ReactFlow canvas with API client, empty state, and keyboard delete support
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { NodeRegistry } from './registry/NodeRegistry';
import { parsePipeline } from './api/client';
import { useSettingsStore } from './store/useSettingsStore';
import { Workflow, MousePointerClick } from 'lucide-react';

import 'reactflow/dist/style.css';


const proOptions = { hideAttribution: true };


const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  setActiveNode: state.setActiveNode,
});

// Empty canvas illustration shown when no nodes exist
const EmptyCanvasState = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10">
    <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-slate-600">
      <div className="flex items-center gap-3">
        <Workflow className="w-10 h-10 opacity-60" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-slate-400 dark:text-slate-500">Your canvas is empty</p>
        <p className="text-sm text-slate-300 dark:text-slate-600 mt-1 flex items-center gap-1.5 justify-center">
          <MousePointerClick className="w-4 h-4" />
          Drag a node from the left panel or press
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono text-slate-400 dark:text-slate-500">Ctrl+K</kbd>
        </p>
      </div>
    </div>
  </div>
);

export const PipelineUI = ({ onReactFlowInit }) => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodeTypes] = useState(() => NodeRegistry.getComponentMap());
  const [isValidGraph, setIsValidGraph] = useState(true);

  const {
    nodes, edges, getNodeID, addNode,
    onNodesChange, onEdgesChange, onConnect, setActiveNode,
  } = useStore(selector, shallow);

  const isTerminalOpen = useStore((s) => s.isTerminalOpen);
  const isTerminalExpanded = useStore((s) => s.isTerminalExpanded);

  // Canvas settings from the settings store
  const showEdgeLabels = useSettingsStore((s) => s.showEdgeLabels);
  const showMinimap = useSettingsStore((s) => s.showMinimap);
  const showGrid = useSettingsStore((s) => s.showGrid);
  const gridSize = useSettingsStore((s) => s.gridSize);
  const minZoom = useSettingsStore((s) => s.minZoom);
  const maxZoom = useSettingsStore((s) => s.maxZoom);
  const connectionType = useSettingsStore((s) => s.connectionLineType);
  const snapToGrid = useSettingsStore((s) => s.snapToGrid);
  const animateEdges = useSettingsStore((s) => s.animateEdges);

  // Derive display edges: strip labels when toggle is off, toggle animation
  const displayEdges = useMemo(() =>
    edges.map((e) => ({
      ...e,
      label: showEdgeLabels ? e.label : undefined,
      animated: animateEdges,
    })),
    [edges, showEdgeLabels, animateEdges]
  );


  // Expose instance to parent (App.js needs it for auto-layout and command palette)
  useEffect(() => {
    if (reactFlowInstance) onReactFlowInit?.(reactFlowInstance);
  }, [reactFlowInstance, onReactFlowInit]);

  // Debounced live DAG validation (only on topology changes, not position drags)
  useEffect(() => {
    if (nodes.length === 0) {
      setIsValidGraph(true);
      return;
    }
    const checkDag = setTimeout(async () => {
      try {
        const data = await parsePipeline(nodes, edges);
        setIsValidGraph(data.is_dag);
      } catch {
        // Backend might be offline; don't flash error for live check
      }
    }, 800);
    return () => clearTimeout(checkDag);
  }, [
    // Only re-run when topology changes (connections), not node positions
    edges.length,
    nodes.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    edges.map((e) => e.id).join(','),
  ]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!event?.dataTransfer?.getData('application/reactflow')) return;
      const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      const type = appData?.nodeType;
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeID = getNodeID(type);
      addNode({ id: nodeID, type, position, data: { id: nodeID, nodeType: type } });
    },
    [reactFlowInstance, addNode, getNodeID]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((_, node) => setActiveNode(node.id), [setActiveNode]);
  const onPaneClick = useCallback(() => setActiveNode(null), [setActiveNode]);

  return (
    <>
      {/* DAG cycle warning banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 transition-all pointer-events-none" aria-live="polite">
        {!isValidGraph && (
          <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-pulse pointer-events-auto">
            <span>⚠️ Graph contains cycles! Invalid Pipeline.</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {nodes.length === 0 && <EmptyCanvasState />}

      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={(instance) => {
            setReactFlowInstance(instance);
            onReactFlowInit?.(instance);
          }}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          snapToGrid={snapToGrid}
          snapGrid={[gridSize, gridSize]}
          connectionLineType={connectionType}
          minZoom={minZoom}
          maxZoom={maxZoom}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          deleteKeyCode={null}
          aria-label="Pipeline canvas"
        >
          {showGrid && <Background color="#cbd5e1" gap={gridSize} size={2} />}
          <Controls
            className="!bg-white dark:!bg-slate-800 !shadow-md !border-slate-200 dark:!border-slate-700 !rounded-lg !transition-all duration-300"
            style={{ marginBottom: isTerminalOpen ? (isTerminalExpanded ? '40vh' : '42px') : 0 }}
          />
          {showMinimap && (
            <MiniMap
              className="!bg-white dark:!bg-slate-800 !rounded-xl !shadow-lg !border-slate-200 dark:!border-slate-700 !bottom-6 !right-6 transition-all hover:scale-105 duration-300"
              style={{ marginBottom: isTerminalOpen ? (isTerminalExpanded ? 'calc(40vh - 1rem)' : '18px') : 0 }}
              maskColor="rgba(248, 250, 252, 0.7)"
            />
          )}
        </ReactFlow>
      </div>

    </>
  );
};
