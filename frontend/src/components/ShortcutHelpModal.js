// components/ShortcutHelpModal.js — Keyboard shortcuts reference modal
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
    { key: 'Ctrl + Z', desc: 'Undo last action', group: 'History' },
    { key: 'Ctrl + Y', desc: 'Redo last action', group: 'History' },
    { key: 'Delete / Backspace', desc: 'Delete selected node(s)', group: 'Canvas' },
    { key: 'Ctrl + K', desc: 'Open command palette', group: 'Canvas' },
    { key: 'Ctrl + L', desc: 'Auto-layout graph (Dagre)', group: 'Canvas' },
    { key: 'Ctrl + Shift + F', desc: 'Fit view to all nodes', group: 'Canvas' },
    { key: 'Ctrl + E', desc: 'Export pipeline as JSON', group: 'Pipeline' },
    { key: '?', desc: 'Show this shortcuts help', group: 'General' },
    { key: 'Escape', desc: 'Close sidebar / palette', group: 'General' },
];

const groups = [...new Set(SHORTCUTS.map((s) => s.group))];

export const ShortcutHelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold">
                        <Keyboard className="w-4 h-4 text-indigo-500" />
                        Keyboard Shortcuts
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        aria-label="Close shortcuts help"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
                    {groups.map((group) => (
                        <div key={group}>
                            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                                {group}
                            </h3>
                            <div className="flex flex-col gap-1.5">
                                {SHORTCUTS.filter((s) => s.group === group).map((s) => (
                                    <div
                                        key={s.key}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-slate-600 dark:text-slate-300">{s.desc}</span>
                                        <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                            {s.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
