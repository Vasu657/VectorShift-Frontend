// components/TemplateGallery.js — Click-to-load template gallery with hover overlay UX
import { useState, useMemo } from 'react';
import { X, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { PIPELINE_TEMPLATES } from '../templates/pipelineTemplates';

// Color helpers
const COLOR_TOP = {
    purple: 'from-purple-500 to-violet-600',
    indigo: 'from-indigo-500 to-blue-600',
    amber: 'from-amber-400 to-orange-500',
    rose: 'from-rose-500 to-pink-600',
    cyan: 'from-cyan-400 to-sky-500',
    green: 'from-emerald-400 to-green-500',
    pink: 'from-pink-400 to-rose-500',
    sky: 'from-sky-400 to-cyan-500',
    violet: 'from-violet-500 to-purple-600',
    teal: 'from-teal-400 to-cyan-500',
    slate: 'from-slate-400 to-slate-600',
};

const COLOR_BADGE = {
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    pink: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
    sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    violet: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    teal: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
    slate: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
};

const CATEGORIES = ['All', ...new Set(PIPELINE_TEMPLATES.map((t) => t.category))];

// Lightweight node flow preview
const FlowPreview = ({ nodes }) => {
    const shown = nodes.slice(0, 5);
    return (
        <div className="flex items-center gap-1 flex-wrap">
            {shown.map((node, i) => {
                const label = node.type === 'customInput' ? 'Input'
                    : node.type === 'customOutput' ? 'Output'
                        : node.type.charAt(0).toUpperCase() + node.type.slice(1);
                return (
                    <span key={node.id} className="flex items-center gap-0.5">
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-white/20 text-white/90 border border-white/20">
                            {label}
                        </span>
                        {i < shown.length - 1 && <ChevronRight className="w-2 h-2 text-white/40 flex-shrink-0" />}
                    </span>
                );
            })}
            {nodes.length > 5 && (
                <span className="text-[9px] text-white/60 ml-0.5">+{nodes.length - 5}</span>
            )}
        </div>
    );
};

// Card: entire surface is a button — hover reveals a gradient overlay with "Open" CTA
const TemplateCard = ({ template, onLoad }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        if (loading) return;
        setLoading(true);
        setTimeout(() => {
            onLoad(template);
            setLoading(false);
        }, 200);
    };

    const gradient = `bg-gradient-to-br ${COLOR_TOP[template.color] ?? COLOR_TOP.indigo}`;

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            aria-label={`Load ${template.name} template`}
            className="relative group flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:-translate-y-1 text-left w-full h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-70"
        >
            {/* ── Coloured Header Panel ── */}
            <div className={`${gradient} p-5 flex-shrink-0 relative overflow-hidden`}>
                {/* Decorative blobs */}
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                <div className="relative z-10">
                    <span className="text-3xl leading-none" role="img" aria-hidden="true">{template.emoji}</span>
                    <h3 className="mt-2 text-sm font-black text-white leading-tight">{template.name}</h3>
                    <div className="mt-2">
                        <FlowPreview nodes={template.nodes} />
                    </div>
                </div>

                {/* Hover overlay: full-panel "Open on Canvas" indicator */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-20">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 text-white font-bold text-xs shadow-lg">
                        {loading
                            ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading…</>
                            : <><Zap className="w-3.5 h-3.5" /> Open on Canvas</>
                        }
                    </div>
                </div>
            </div>

            {/* ── Card Body ── */}
            <div className="flex flex-col flex-1 p-4 bg-white dark:bg-slate-800 gap-3">
                {/* Category badge */}
                <span className={`self-start text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${COLOR_BADGE[template.color] ?? COLOR_BADGE.indigo}`}>
                    {template.category}
                </span>

                {/* Description */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">
                    {template.description}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    <span>📦 {template.nodes.length} nodes</span>
                    <span>🔗 {template.edges.length} edges</span>
                </div>
            </div>
        </button>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const TemplateGallery = ({ isOpen, onClose, onLoadTemplate }) => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = useMemo(() => {
        let list = activeCategory === 'All'
            ? PIPELINE_TEMPLATES
            : PIPELINE_TEMPLATES.filter((t) => t.category === activeCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
            );
        }
        return list;
    }, [activeCategory, searchQuery]);

    if (!isOpen) return null;

    const handleLoad = (template) => {
        onLoadTemplate(template);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[80] bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
                <div
                    className="relative bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
                    role="dialog"
                    aria-label="Pipeline template gallery"
                    aria-modal="true"
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-800 dark:text-slate-100">Pipeline Templates</h2>
                                <p className="text-xs text-slate-400">Click any card to instantly load it onto the canvas</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ── Toolbar: tabs + search ── */}
                    <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800 overflow-x-auto">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                        <div className="ml-auto flex-shrink-0">
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search templates…"
                                className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 w-44"
                            />
                        </div>
                    </div>

                    {/* ── Grid ── */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                                <span className="text-5xl">🔍</span>
                                <p className="text-sm text-slate-500 dark:text-slate-400">No templates match <strong>"{searchQuery}"</strong></p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                                {filtered.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onLoad={handleLoad}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            💡 {filtered.length} template{filtered.length !== 1 ? 's' : ''} · Loading replaces the current canvas
                        </p>
                        <button
                            onClick={onClose}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TemplateGallery;
