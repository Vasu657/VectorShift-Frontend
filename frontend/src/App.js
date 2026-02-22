// App.js — Main app with all features wired: dark mode, undo/redo, export/import, auto-layout, command palette, shortcuts
import { useState, useCallback, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
  Hexagon, Sun, Moon, Undo2, Redo2, LayoutGrid, Download, Upload,
  HelpCircle, Trash2, Settings, Sparkles
} from 'lucide-react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { ConfigurationSidebar } from './components/ConfigurationSidebar';
import { CommandPalette } from './components/CommandPalette';
import { ShortcutHelpModal } from './components/ShortcutHelpModal';
import { SettingsPanel } from './components/SettingsPanel';
import { TemplateGallery } from './components/TemplateGallery';
import { setupRegistry } from './registry/setup';


import { useStore, useTemporalStore, temporalStore } from './store';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { applyAutoLayout } from './utils/autoLayout';
import { useSettingsStore } from './store/useSettingsStore';


// Initialize the plugin registry before React mounts (dedup guard prevents double registration)
setupRegistry();

function App() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const reactFlowInstanceRef = useRef(null);



  // Store selectors
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const pipelineName = useStore((s) => s.pipelineName);
  const setPipelineName = useStore((s) => s.setPipelineName);
  const clearCanvas = useStore((s) => s.clearCanvas);
  const isTerminalOpen = useStore((s) => s.isTerminalOpen);
  const isTerminalExpanded = useStore((s) => s.isTerminalExpanded);
  const set = useStore.setState;
  const undo = useCallback(() => temporalStore.getState().undo(), []);
  const redo = useCallback(() => temporalStore.getState().redo(), []);
  const canUndo = useTemporalStore((s) => s.pastStates.length > 0);
  const canRedo = useTemporalStore((s) => s.futureStates.length > 0);

  // Settings
  const autoLayoutDirection = useSettingsStore((s) => s.autoLayoutDirection);
  const confirmOnClear = useSettingsStore((s) => s.confirmOnClear);

  // Capture ReactFlow instance from PipelineUI
  const handleReactFlowInit = useCallback((instance) => {
    reactFlowInstanceRef.current = instance;
  }, []);

  // Export pipeline as JSON
  const handleExport = useCallback(() => {
    const payload = { name: pipelineName, nodes, edges };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pipelineName.replace(/\s+/g, '_') || 'pipeline'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Pipeline exported!');
  }, [nodes, edges, pipelineName]);

  // Import pipeline from JSON file
  const fileInputRef = useRef(null);
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          throw new Error('Invalid pipeline file format.');
        }
        set({ nodes: parsed.nodes, edges: parsed.edges });
        if (parsed.name) setPipelineName(parsed.name);
        toast.success(`Imported "${parsed.name || 'Pipeline'}" — ${parsed.nodes.length} nodes`);
      } catch (err) {
        toast.error(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset so same file can be re-imported
  }, [set, setPipelineName]);

  // Auto-layout via Dagre (uses direction from Settings)
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) {
      toast('Canvas is empty.', { icon: '📭', id: 'empty-layout' });
      return;
    }
    const layoutedNodes = applyAutoLayout(nodes, edges, autoLayoutDirection);
    set({ nodes: layoutedNodes });
    setTimeout(() => reactFlowInstanceRef.current?.fitView({ padding: 0.1, duration: 400 }), 50);
    toast.success(`Auto-layout applied (${autoLayoutDirection === 'LR' ? 'Left → Right' : 'Top → Bottom'})!`);
  }, [nodes, edges, set, autoLayoutDirection]);


  // Clear canvas (respects confirmOnClear setting)
  const handleClearCanvas = useCallback(() => {
    if (nodes.length === 0) return;
    if (!confirmOnClear || window.confirm('Clear the entire canvas? This cannot be undone via undo.')) {
      clearCanvas();
      toast('Canvas cleared.', { icon: '🗑️' });
    }
  }, [nodes.length, clearCanvas, confirmOnClear]);

  // Load a pre-built template onto the canvas
  const handleLoadTemplate = useCallback((template) => {
    if (nodes.length > 0) {
      if (!window.confirm(`Load "${template.name}" template? This will replace the current canvas.`)) return;
    }
    set({
      nodes: template.nodes,
      edges: template.edges,
      nodeIDs: template.nodeIDs,
      pipelineName: template.name,
      activeNodeId: null,
    });
    // Fit view after react has rendered the new nodes
    setTimeout(() => reactFlowInstanceRef.current?.fitView({ padding: 0.12, duration: 500 }), 80);
    toast.success(`Template "${template.name}" loaded!`, { icon: template.emoji });
  }, [nodes.length, set]);


  // Keyboard shortcuts
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsPaletteOpen(true),
    onFitView: () => reactFlowInstanceRef.current?.fitView({ padding: 0.1, duration: 400 }),
    onAutoLayout: handleAutoLayout,
    onExport: handleExport,
    onOpenHelp: () => setIsHelpOpen(true),
  });

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Toast notifications */}
      <Toaster
        position="bottom-center"
        containerStyle={{
          bottom: isTerminalOpen ? (isTerminalExpanded ? 'calc(40vh + 1.5rem)' : 'calc(42px + 1.5rem)') : '1.5rem',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#f1f5f9' : '#1e293b',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Import pipeline JSON file"
      />

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 shadow-sm backdrop-blur-md z-20 relative gap-4">
        {/* Logo + Pipeline Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-inner flex-shrink-0">
            <Hexagon className="w-5 h-5" fill="currentColor" />
          </div>
          <input
            type="text"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 min-w-0 max-w-[160px] truncate"
            aria-label="Pipeline name"
            title="Click to rename pipeline"
          />
        </div>

        {/* Center: Undo / Redo / Layout / Templates / Clear */}
        <div className="flex items-center gap-1">
          <HeaderIconBtn onClick={undo} disabled={!canUndo} label="Undo (Ctrl+Z)" title="Undo">
            <Undo2 className="w-4 h-4" />
          </HeaderIconBtn>
          <HeaderIconBtn onClick={redo} disabled={!canRedo} label="Redo (Ctrl+Y)" title="Redo">
            <Redo2 className="w-4 h-4" />
          </HeaderIconBtn>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          <HeaderIconBtn onClick={handleAutoLayout} label="Auto-layout (Ctrl+L)" title="Auto Layout">
            <LayoutGrid className="w-4 h-4" />
          </HeaderIconBtn>
          <HeaderIconBtn onClick={handleExport} label="Export JSON (Ctrl+E)" title="Export">
            <Download className="w-4 h-4" />
          </HeaderIconBtn>
          <HeaderIconBtn onClick={handleImport} label="Import JSON" title="Import">
            <Upload className="w-4 h-4" />
          </HeaderIconBtn>
          <HeaderIconBtn onClick={handleClearCanvas} disabled={nodes.length === 0} label="Clear canvas" title="Clear Canvas" danger>
            <Trash2 className="w-4 h-4" />
          </HeaderIconBtn>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
          {/* Templates button — visually distinct */}
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all"
            aria-label="Open template gallery"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Templates
          </button>
        </div>


        {/* Right: Settings + Dark mode + Help + Run */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <HeaderIconBtn onClick={() => setIsHelpOpen(true)} label="Keyboard shortcuts (?)" title="Shortcuts">
            <HelpCircle className="w-4 h-4" />
          </HeaderIconBtn>
          <HeaderIconBtn onClick={toggleTheme} label="Toggle dark mode" title={isDark ? 'Light Mode' : 'Dark Mode'}>
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </HeaderIconBtn>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
          <HeaderIconBtn
            onClick={() => setIsSettingsOpen(true)}
            label="Open settings"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </HeaderIconBtn>
          <SubmitButton />
        </div>

      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        <PipelineToolbar />
        <main className="flex-1 relative w-full h-full overflow-hidden" aria-label="Pipeline canvas area">
          <PipelineUI onReactFlowInit={handleReactFlowInit} />
          <ConfigurationSidebar />
        </main>
      </div>

      {/* Modals */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        reactFlowInstance={reactFlowInstanceRef.current}
      />
      <ShortcutHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TemplateGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onLoadTemplate={handleLoadTemplate}
      />
    </div>
  );
}

// Reusable header icon button
const HeaderIconBtn = ({ children, onClick, disabled, label, title, danger }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={title}
    className={`p-1.5 rounded-lg transition-colors flex items-center justify-center
            ${disabled ? 'opacity-30 cursor-not-allowed text-slate-400' :
        danger ? 'text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500' :
          'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'}
        `}
  >
    {children}
  </button>
);

export default App;
