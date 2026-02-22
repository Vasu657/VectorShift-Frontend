// components/CommandPalette.js — Ctrl+K quick-add node palette
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { NodeRegistry } from '../registry/NodeRegistry';
import { Search, X, Command } from 'lucide-react';

const COLOR_MAP = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
};

export const CommandPalette = ({ isOpen, onClose, reactFlowInstance }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);
    const addNode = useStore((s) => s.addNode);
    const getNodeID = useStore((s) => s.getNodeID);

    const allItems = NodeRegistry.getToolbarItems();

    const filtered = query.trim()
        ? allItems.filter(
            (item) =>
                item.label.toLowerCase().includes(query.toLowerCase()) ||
                (item.category || '').toLowerCase().includes(query.toLowerCase())
        )
        : allItems;

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSelect = useCallback(
        (item) => {
            const center = reactFlowInstance
                ? reactFlowInstance.project({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
                : { x: 200, y: 200 };

            const nodeID = getNodeID(item.type);
            addNode({
                id: nodeID,
                type: item.type,
                position: {
                    x: center.x + Math.random() * 40 - 20,
                    y: center.y + Math.random() * 40 - 20,
                },
                data: { id: nodeID, nodeType: item.type },
            });
            onClose();
        },
        [reactFlowInstance, addNode, getNodeID, onClose]
    );

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0]);
        },
        [filtered, handleSelect, onClose]
    );

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
                    <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search nodes to add..."
                        className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                        aria-label="Search nodes"
                    />
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        aria-label="Close palette"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Results */}
                <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
                    {filtered.length === 0 ? (
                        <li className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                            No nodes found for "<span className="font-medium">{query}</span>"
                        </li>
                    ) : (
                        filtered.map((item) => {
                            const Icon = item.icon;
                            const colorCls = COLOR_MAP[item.color] || COLOR_MAP.indigo;
                            return (
                                <li
                                    key={item.type}
                                    onClick={() => handleSelect(item)}
                                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                                    role="option"
                                    aria-selected="false"
                                >
                                    <span className={`p-1.5 rounded-lg ${colorCls}`}>
                                        {Icon && <Icon className="w-4 h-4" />}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                            {item.label}
                                        </span>
                                        {item.category && (
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                {item.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-auto flex items-center gap-1 text-xs text-slate-300 dark:text-slate-600">
                                        <Command className="w-3 h-3" />
                                        <span>↵</span>
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>

                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center gap-4 text-xs text-slate-400">
                    <span><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">↵</kbd> to add first result</span>
                    <span><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono">Esc</kbd> to close</span>
                    <span className="ml-auto">{filtered.length} nodes</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
