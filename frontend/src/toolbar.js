// toolbar.js — Enhanced node library with search, category grouping, count badges, and dark mode
import { useState, useMemo } from 'react';
import { useStore } from './store';
import { DraggableNode } from './draggableNode';
import { NodeRegistry } from './registry/NodeRegistry';
import { Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// Color map for category badges
const CATEGORY_COLORS = {
    'I/O': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'AI': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    'Data': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Logic': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    'Integrations': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export const PipelineToolbar = () => {
    const isSidebarOpen = useStore((s) => s.isSidebarOpen);
    const setSidebarOpen = useStore((s) => s.setSidebarOpen);
    const [query, setQuery] = useState('');
    const allItems = NodeRegistry.getToolbarItems();

    const filtered = useMemo(() => {
        if (!query.trim()) return allItems;
        const q = query.toLowerCase();
        return allItems.filter(
            (item) =>
                item.label.toLowerCase().includes(q) ||
                (item.category || '').toLowerCase().includes(q) ||
                (item.description || '').toLowerCase().includes(q)
        );
    }, [query, allItems]);

    // Group by category
    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach((item) => {
            const cat = item.category || 'General';
            if (!map[cat]) map[cat] = [];
            map[cat].push(item);
        });
        return map;
    }, [filtered]);

    return (
        <div
            className={`flex flex-col h-full overflow-hidden border-r border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md z-10 shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 p-4 gap-4' : 'w-12 py-4 px-2 items-center'}`}
            role="toolbar"
            aria-label="Node library"
        >
            {/* Header Toolbar */}
            <div className={`flex items-center shrink-0 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                {isSidebarOpen && (
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 truncate">
                        Node Library
                    </h2>
                )}
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-5 h-5 text-indigo-500 my-1" />}
                </button>
            </div>

            {isSidebarOpen ? (
                <>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" aria-hidden="true" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search nodes..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                            aria-label="Search node types"
                        />
                    </div>

                    {/* Grouped results */}
                    <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-5">
                        {Object.keys(grouped).length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center">
                                <span className="text-2xl">🔍</span>
                                <p className="text-xs text-slate-400 dark:text-slate-500">No nodes match <strong>"{query}"</strong></p>
                            </div>
                        ) : (
                            Object.entries(grouped).map(([category, items]) => (
                                <div key={category}>
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex-1">
                                            {category}
                                        </h3>
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                            {items.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {items.map((item) => (
                                            <DraggableNode
                                                key={item.type}
                                                type={item.type}
                                                label={item.label}
                                                icon={item.icon}
                                                color={item.color}
                                                description={item.description}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-auto pt-2 border-t border-slate-200 dark:border-slate-700/50 shrink-0">
                        {allItems.length} nodes · Press <kbd className="px-1 bg-slate-100 dark:bg-slate-700 rounded font-mono text-slate-500 dark:text-slate-400">Ctrl+K</kbd> to quick-add
                    </div>
                </>
            ) : (
                <div className="flex flex-col gap-3 mt-4 w-full">
                    <div style={{ writingMode: 'vertical-rl', transform: 'scale(-1)' }} className="text-[10px] font-bold tracking-widest text-slate-300 dark:text-slate-600 uppercase mt-4 text-center cursor-default select-none">
                        NODE LIBRARY
                    </div>
                </div>
            )}
        </div>
    );
};
