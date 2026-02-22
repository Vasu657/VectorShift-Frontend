// nodes/BaseNode.js — Enhanced base: dynamic extra handles (managed via Config Sidebar), color coding, dark mode
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Hexagon } from 'lucide-react';
import { NodeErrorBoundary } from '../components/NodeErrorBoundary';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

// Maps color token → Tailwind classes for header badge and border accent
const COLOR_STYLES = {
    indigo: { badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300', border: 'group-hover:border-indigo-400 dark:group-hover:border-indigo-500', ring: 'ring-indigo-500/50', dot: '!bg-indigo-500' },
    purple: { badge: 'bg-purple-50 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300', border: 'group-hover:border-purple-400 dark:group-hover:border-purple-500', ring: 'ring-purple-500/50', dot: '!bg-purple-500' },
    green: { badge: 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300', border: 'group-hover:border-green-400 dark:group-hover:border-green-500', ring: 'ring-green-500/50', dot: '!bg-green-500' },
    amber: { badge: 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300', border: 'group-hover:border-amber-400 dark:group-hover:border-amber-500', ring: 'ring-amber-500/50', dot: '!bg-amber-500' },
    rose: { badge: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300', border: 'group-hover:border-rose-400 dark:group-hover:border-rose-500', ring: 'ring-rose-500/50', dot: '!bg-rose-500' },
    cyan: { badge: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-300', border: 'group-hover:border-cyan-400 dark:group-hover:border-cyan-500', ring: 'ring-cyan-500/50', dot: '!bg-cyan-500' },
};

const selector = id => state => ({
    isExecuting: state.executingNodeIds.includes(id)
});

export const BaseNode = memo(({
    id,
    data,
    title,
    children,
    handles = [],
    style = {},
    icon: Icon = Hexagon,
    color = 'indigo',
    selected,
}) => {
    const cs = COLOR_STYLES[color] || COLOR_STYLES.indigo;

    // Check if this node is currently executing in the animation
    const { isExecuting } = useStore(selector(id), shallow);

    // Extra handles added via the Configuration Sidebar
    const extraInputs = data?.extraInputs ?? [];
    const extraOutputs = data?.extraOutputs ?? [];

    return (
        <NodeErrorBoundary>
            <div
                className={`
                    relative bg-white dark:bg-slate-800 rounded-xl shadow-sm
                    border transition-all duration-300 group w-[280px] overflow-visible
                    ${isExecuting
                        ? `border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] dark:shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-[1.02] z-50`
                        : selected
                            ? `border-indigo-400 dark:border-indigo-500 ring-2 ${cs.ring}`
                            : `border-slate-200 dark:border-slate-700 ${cs.border}`}
                    ${!isExecuting && 'hover:shadow-lg hover:scale-[1.01]'} animate-scale-in
                `}
                style={{ ...style }}
                role="article"
                aria-label={`${title} node`}
            >
                {/* Built-in handles defined by each node component */}
                {handles.map((handle, index) => (
                    <Handle
                        key={index}
                        type={handle.type}
                        position={handle.position || (handle.type === 'source' ? Position.Right : Position.Left)}
                        id={`${id}-${handle.id}`}
                        style={handle.style}
                        className={`custom-handle !w-3 !h-3 !opacity-100 ${cs.dot} !border-2 !border-white dark:!border-slate-800 transition-transform hover:scale-125`}
                        aria-label={`${handle.type} handle: ${handle.id}`}
                    />
                ))}

                {/* Extra input handles (left side) — added via Config Sidebar */}
                {extraInputs.map((name, i) => (
                    <Handle
                        key={`extra-in-${name}`}
                        type="target"
                        position={Position.Left}
                        id={`${id}-${name}`}
                        style={{ top: `${60 + i * 24}px` }}
                        className={`custom-handle !w-3 !h-3 !opacity-100 ${cs.dot} !border-2 !border-white dark:!border-slate-800 transition-transform hover:scale-125`}
                        aria-label={`custom input handle: ${name}`}
                    />
                ))}

                {/* Extra output handles (right side) — added via Config Sidebar */}
                {extraOutputs.map((name, i) => (
                    <Handle
                        key={`extra-out-${name}`}
                        type="source"
                        position={Position.Right}
                        id={`${id}-${name}`}
                        style={{ top: `${60 + i * 24}px` }}
                        className={`custom-handle !w-3 !h-3 !opacity-100 ${cs.dot} !border-2 !border-white dark:!border-slate-800 transition-transform hover:scale-125`}
                        aria-label={`custom output handle: ${name}`}
                    />
                ))}

                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 flex items-center justify-between rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md shadow-sm border border-transparent ${cs.badge}`}>
                            <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{title}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3">
                    {children}
                </div>

                {/* Show small handle-name labels at the bottom if any custom handles exist */}
                {(extraInputs.length > 0 || extraOutputs.length > 0) && (
                    <div className="flex justify-between px-3 pb-2 border-t border-dashed border-slate-100 dark:border-slate-700 pt-2">
                        <div className="flex flex-col gap-0.5">
                            {extraInputs.map((name) => (
                                <span key={name} className="text-[9px] text-indigo-400 dark:text-indigo-500 font-semibold">← {name}</span>
                            ))}
                        </div>
                        <div className="flex flex-col gap-0.5 items-end">
                            {extraOutputs.map((name) => (
                                <span key={name} className="text-[9px] text-purple-400 dark:text-purple-500 font-semibold">{name} →</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </NodeErrorBoundary>
    );
});

BaseNode.displayName = 'BaseNode';

// ─── Shared field primitives ───────────────────────────────────────────────────

export const FieldLabel = ({ children }) => (
    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{children}</span>
);

export const NodeInput = ({ label, value, onChange, placeholder, ...rest }) => (
    <label className="flex flex-col gap-1.5">
        <FieldLabel>{label}</FieldLabel>
        <input
            type="text"
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400"
            {...rest}
        />
    </label>
);

export const NodeSelect = ({ label, value, onChange, options = [], children, ...rest }) => (
    <label className="flex flex-col gap-1.5">
        <FieldLabel>{label}</FieldLabel>
        <select
            value={value || ''}
            onChange={onChange}
            className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-medium appearance-none cursor-pointer"
            {...rest}
        >
            {options.map((o) => (
                <option key={o} value={o}>{o}</option>
            ))}
            {children}
        </select>
    </label>
);
