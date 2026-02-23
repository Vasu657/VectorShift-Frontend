// nodes/llmNode.js — LLM node with live free-model picker from OpenRouter
import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';
import { useOpenRouterModels } from '../hooks/useOpenRouterModels';
import { Cpu, ChevronDown, Search, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

// ─── Searchable model dropdown ────────────────────────────────────────────────
const ModelPicker = ({ value, onChange }) => {
  const { models, loading, error } = useOpenRouterModels();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
      // Auto-focus search input
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = query.trim()
    ? models.filter(
      (m) =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.id.toLowerCase().includes(query.toLowerCase())
    )
    : models;

  // Find display name for current value
  const currentModel = models.find((m) => m.id === value);
  const displayName = currentModel ? currentModel.name : (value || 'Select free model…');

  const handleSelect = (modelId) => {
    onChange(modelId);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full nodrag" style={{ zIndex: open ? 9999 : 1 }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg border transition-colors
                    ${open
            ? 'border-purple-400 bg-white dark:bg-slate-800 ring-1 ring-purple-400/40'
            : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 hover:border-purple-300'
          } text-slate-700 dark:text-slate-200`}
      >
        <span className="truncate font-medium">
          {loading ? (
            <span className="flex items-center gap-1 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> Fetching models…</span>
          ) : error ? (
            <span className="flex items-center gap-1 text-amber-500"><AlertTriangle className="w-3 h-3" /> {value || 'Error loading'}</span>
          ) : (
            displayName
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl overflow-hidden"
          style={{ zIndex: 99999, minWidth: '260px', maxHeight: '280px', display: 'flex', flexDirection: 'column' }}
        >
          {/* Search box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models…"
                className="w-full pl-6 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Model count badge */}
          {!loading && !error && (
            <div className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30 flex-shrink-0">
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                🆓 {filtered.length} free model{filtered.length !== 1 ? 's' : ''}
                {models.length > 0 && filtered.length !== models.length && ` of ${models.length}`}
              </span>
            </div>
          )}

          {/* Model list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading free models…
              </div>
            ) : error ? (
              <div className="p-3 text-center">
                <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-slate-500">Failed to load models</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{error}</p>
                <p className="text-[10px] text-slate-400 mt-1">Check your OpenRouter key in Settings</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No models match "{query}"
              </div>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelect(m.id)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-b-0
                                        ${value === m.id ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{m.id}</div>
                  {m.context_length > 0 && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                      {(m.context_length / 1000).toFixed(0)}k ctx · Free
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── LLM Node ─────────────────────────────────────────────────────────────────
export const LLMNode = memo(({ id, data, selected }) => {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const model = data?.model ?? '';

  const handleModelChange = useCallback(
    (modelId) => updateNodeData(id, { model: modelId }),
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      data={data}
      title="LLM"
      icon={Cpu}
      color="purple"
      selected={selected}
      handles={[
        { type: 'target', position: Position.Left, id: 'system', style: { top: `${100 / 3}%` } },
        { type: 'target', position: Position.Left, id: 'prompt', style: { top: `${200 / 3}%` } },
        { type: 'source', position: Position.Right, id: 'response' },
      ]}
    >
      <div className="flex flex-col gap-2">
        {/* Model label */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Model</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">FREE ONLY</span>
        </div>

        {/* Dynamic model picker */}
        <ModelPicker value={model} onChange={handleModelChange} />

        {/* Selected model id display */}
        {model && (
          <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate px-1">
            {model}
          </div>
        )}

        {/* Input handle descriptions */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 mt-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Input Handles</span>
          </div>
          <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            <span>↙ <strong className="text-purple-600 dark:text-purple-400">system</strong> — system prompt</span>
            <span>↙ <strong className="text-purple-600 dark:text-purple-400">prompt</strong> — user message</span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
});
