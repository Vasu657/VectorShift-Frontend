// components/ConfigurationSidebar.js — Dynamic form introspection sidebar with extra handles management
import { useCallback, useState } from 'react';
import { useStore } from '../store';
import { NodeRegistry } from '../registry/NodeRegistry';
import { X, Settings2, Tag, Layers3, Plus, ArrowLeftRight, ChevronDown, ChevronRight } from 'lucide-react';

// Map field type → input renderer
const renderField = (field, value, onChange) => {
    const baseClass =
        'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-medium';

    switch (field.type) {
        case 'select':
            return (
                <select value={value ?? field.options?.[0] ?? ''} onChange={(e) => onChange(field.key, e.target.value)} className={`${baseClass} appearance-none cursor-pointer`}>
                    {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
            );
        case 'textarea':
            return (
                <textarea
                    value={value ?? ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className={`${baseClass} resize-y`}
                />
            );
        case 'number':
            return (
                <input
                    type="number"
                    value={value ?? ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    step={field.step || 1}
                    className={baseClass}
                />
            );
        default: // 'text'
            return (
                <input
                    type="text"
                    value={value ?? ''}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={baseClass}
                />
            );
    }
};

// ─── Extra Handles Section ────────────────────────────────────────────────────

const HandleTag = ({ name, side, onRemove }) => (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border
        ${side === 'input'
            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
            : 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'}`}
    >
        <span className="opacity-60 font-normal">{side === 'input' ? '← ' : ' →'}</span>
        {name}
        <button
            onClick={() => onRemove(name)}
            title={`Remove ${name}`}
            className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors"
        >
            <X className="w-3 h-3" />
        </button>
    </div>
);

const ExtraHandlesSection = ({ nodeId, extraInputs = [], extraOutputs = [] }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const [newInput, setNewInput] = useState('');
    const [newOutput, setNewOutput] = useState('');
    const [expanded, setExpanded] = useState(true);

    const clean = (v) => v.trim().replace(/\s+/g, '_').toLowerCase();

    const addHandle = (side) => {
        const raw = side === 'input' ? newInput : newOutput;
        const name = clean(raw);
        if (!name) return;
        if (side === 'input') {
            if (extraInputs.includes(name)) return;
            updateNodeData(nodeId, { extraInputs: [...extraInputs, name] });
            setNewInput('');
        } else {
            if (extraOutputs.includes(name)) return;
            updateNodeData(nodeId, { extraOutputs: [...extraOutputs, name] });
            setNewOutput('');
        }
    };

    const removeHandle = (side, name) => {
        if (side === 'input') {
            updateNodeData(nodeId, { extraInputs: extraInputs.filter((h) => h !== name) });
        } else {
            updateNodeData(nodeId, { extraOutputs: extraOutputs.filter((h) => h !== name) });
        }
    };

    const inputClass = 'flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200';

    return (
        <div>
            <button
                className="w-full flex items-center justify-between text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3"
                onClick={() => setExpanded((e) => !e)}
            >
                <span className="flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3 h-3" />
                    Custom Handles
                </span>
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>

            {expanded && (
                <div className="flex flex-col gap-4">
                    {/* Input handles */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase text-indigo-500 dark:text-indigo-400 tracking-wider">
                            Input Handles (left side)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {extraInputs.length === 0 && (
                                <span className="text-[11px] text-slate-400 italic">None added yet</span>
                            )}
                            {extraInputs.map((h) => (
                                <HandleTag key={h} name={h} side="input" onRemove={(n) => removeHandle('input', n)} />
                            ))}
                        </div>
                        <div className="flex gap-1.5">
                            <input
                                value={newInput}
                                onChange={(e) => setNewInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addHandle('input')}
                                placeholder="handle_name…"
                                className={inputClass}
                            />
                            <button
                                onClick={() => addHandle('input')}
                                className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Output handles */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase text-purple-500 dark:text-purple-400 tracking-wider">
                            Output Handles (right side)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {extraOutputs.length === 0 && (
                                <span className="text-[11px] text-slate-400 italic">None added yet</span>
                            )}
                            {extraOutputs.map((h) => (
                                <HandleTag key={h} name={h} side="output" onRemove={(n) => removeHandle('output', n)} />
                            ))}
                        </div>
                        <div className="flex gap-1.5">
                            <input
                                value={newOutput}
                                onChange={(e) => setNewOutput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addHandle('output')}
                                placeholder="handle_name…"
                                className={inputClass}
                            />
                            <button
                                onClick={() => addHandle('output')}
                                className="px-2 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                        Handles appear on the node card immediately and can be connected to any other node. The backend validation automatically accounts for custom handles.
                    </p>
                </div>
            )}
        </div>
    );
};

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export const ConfigurationSidebar = () => {
    const activeNodeId = useStore((s) => s.activeNodeId);
    const getActiveNode = useStore((s) => s.getActiveNode);
    const setActiveNode = useStore((s) => s.setActiveNode);
    const updateNodeData = useStore((s) => s.updateNodeData);

    const activeNode = getActiveNode();

    const handleFieldChange = useCallback(
        (key, value) => {
            if (!activeNodeId) return;
            updateNodeData(activeNodeId, { [key]: value });
        },
        [activeNodeId, updateNodeData]
    );

    if (!activeNodeId || !activeNode) return null;

    const metadata = NodeRegistry.getMetadata(activeNode.type);
    const fields = metadata?.fields || [];
    const extraInputs = activeNode.data?.extraInputs ?? [];
    const extraOutputs = activeNode.data?.extraOutputs ?? [];

    return (
        <div
            className="absolute top-0 right-0 w-80 h-full bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-50 flex flex-col animate-slide-in-right"
            role="complementary"
            aria-label="Node configuration panel"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 shrink-0">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Settings2 className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                    <span className="font-semibold text-sm tracking-tight">Node Configuration</span>
                </div>
                <button
                    onClick={() => setActiveNode(null)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors text-slate-500"
                    aria-label="Close configuration panel"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-8 flex flex-col gap-6 min-h-0">

                {/* Identity */}
                <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Identification</h3>
                    <div className="flex flex-col gap-3">
                        <label className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                <Tag className="w-3 h-3" />
                                ID
                            </div>
                            <input
                                type="text"
                                value={activeNode.id}
                                disabled
                                className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed w-full"
                                aria-label="Node ID (read only)"
                            />
                        </label>
                        {metadata && (
                            <label className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    <Layers3 className="w-3 h-3" />
                                    Type
                                </div>
                                <input
                                    type="text"
                                    value={`${metadata.label} (${metadata.category || 'General'})`}
                                    disabled
                                    className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed w-full"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Dynamic fields from registry schema */}
                {fields.length > 0 && (
                    <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Properties</h3>
                        <div className="flex flex-col gap-4">
                            {fields.map((field) => (
                                <div key={field.key} className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        {field.label}
                                    </span>
                                    {renderField(field, activeNode.data?.[field.key], handleFieldChange)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {fields.length === 0 && (
                    <div className="text-sm text-slate-400 dark:text-slate-500 p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-lg italic text-center">
                        No configurable properties for this node.
                    </div>
                )}

                {/* Separator */}
                <div className="border-t border-dashed border-slate-200 dark:border-slate-700" />

                {/* Extra Handles section */}
                <ExtraHandlesSection
                    nodeId={activeNodeId}
                    extraInputs={extraInputs}
                    extraOutputs={extraOutputs}
                />
            </div>
        </div>
    );
};
