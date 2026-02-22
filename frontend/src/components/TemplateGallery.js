// components/TemplateGallery.js — Pre-built pipeline template picker (fixed scroll + layout)
import { useState } from 'react';
import { X, LayoutTemplate, ChevronRight, Sparkles, Check } from 'lucide-react';
import { PIPELINE_TEMPLATES } from '../templates/pipelineTemplates';

const COLOR_TOP = {
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    green: 'bg-green-500',
};

const COLOR_BADGE = {
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
};

const COLOR_BTN = {
    purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    amber: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    rose: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    cyan: 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500',
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
};

const CATEGORIES = ['All', ...new Set(PIPELINE_TEMPLATES.map((t) => t.category))];

// Lightweight node flow preview (first 4 nodes shown horizontally)
const FlowPreview = ({ nodes }) => {
    const shown = nodes.slice(0, 4);
    return (
        <div className="flex items-center gap-1 flex-wrap mt-1">
            {shown.map((node, i) => {
                const label = node.type === 'customInput' ? 'Input'
                    : node.type === 'customOutput' ? 'Output'
                        : node.type.charAt(0).toUpperCase() + node.type.slice(1);
                const isLast = i === shown.length - 1;
                return (
                    <span key={node.id} className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                            {label}
                        </span>
                        {!isLast && <ChevronRight className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />}
                    </span>
                );
            })}
            {nodes.length > 4 && (
                <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-0.5">+{nodes.length - 4} more</span>
            )}
        </div>
    );
};

const TemplateCard = ({ template, onLoad }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        setLoading(true);
        setTimeout(() => {
            onLoad(template);
            setLoading(false);
        }, 250);
    };

    return (
        /* Fixed height card so all cards in a row are equal and the button is always visible */
        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 overflow-hidden h-full">
            {/* Color accent top bar */}
            <div className={`h-1 w-full flex-shrink-0 ${COLOR_TOP[template.color] ?? COLOR_TOP.indigo}`} />

            {/* Card body — flex-1 so it fills height */}
            <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Header row */}
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 leading-none" role="img" aria-hidden="true">{template.emoji}</span>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{template.name}</h3>
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 ${COLOR_BADGE[template.color] ?? COLOR_BADGE.indigo}`}>
                            {template.category}
                        </span>
                    </div>
                </div>

                {/* Description — fixed 2–3 line clamp */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">
                    {template.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium flex-shrink-0">
                    <span>📦 {template.nodes.length} nodes</span>
                    <span>🔗 {template.edges.length} edges</span>
                </div>

                {/* Mini flow diagram */}
                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <FlowPreview nodes={template.nodes} />
                </div>
            </div>

            {/* Button — always pinned at the bottom */}
            <div className="px-4 pb-4 flex-shrink-0">
                <button
                    onClick={handleClick}
                    disabled={loading}
                    aria-label={`Use ${template.name} template`}
                    className={`w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98] disabled:opacity-70 ${COLOR_BTN[template.color] ?? COLOR_BTN.indigo}`}
                >
                    {loading ? (
                        <Check className="w-3.5 h-3.5 animate-bounce" />
                    ) : (
                        <LayoutTemplate className="w-3.5 h-3.5" />
                    )}
                    {loading ? 'Loading…' : 'Use This Template'}
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const TemplateGallery = ({ isOpen, onClose, onLoadTemplate }) => {
    const [activeCategory, setActiveCategory] = useState('All');

    if (!isOpen) return null;

    const filtered = activeCategory === 'All'
        ? PIPELINE_TEMPLATES
        : PIPELINE_TEMPLATES.filter((t) => t.category === activeCategory);

    const handleLoad = (template) => {
        onLoadTemplate(template);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[80] bg-black/30 dark:bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog wrapper — takes 90vh, flex-column so inner grid scrolls */}
            <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
                <div
                    className="
                        relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl
                        border border-slate-200 dark:border-slate-700
                        w-full max-w-5xl
                        /* KEY FIX: explicit height + flex-col so the grid can scroll */
                        h-[88vh] flex flex-col overflow-hidden
                    "
                    role="dialog"
                    aria-label="Pipeline template gallery"
                    aria-modal="true"
                >
                    {/* ── Header (flex-shrink-0) */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Pipeline Templates</h2>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Choose a pre-built template to get started instantly</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                            aria-label="Close template gallery"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ── Category tabs (flex-shrink-0) */}
                    <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0 overflow-x-auto">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
                                    ${activeCategory === cat
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-slate-300 dark:text-slate-600 whitespace-nowrap flex-shrink-0">
                            {filtered.length} template{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* ── Scrollable grid area
                         CRITICAL: min-h-0 forces flex child to respect parent height
                         so overflow-y-auto actually creates a scrollbar */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                            {filtered.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onLoad={handleLoad}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Footer (flex-shrink-0) */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            💡 Loading a template replaces the current canvas — export first if needed.
                        </p>
                        <button
                            onClick={onClose}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
