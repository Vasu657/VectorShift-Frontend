// nodes/logicNodes.js — Control-flow nodes: Conditional, Loop, Delay
import { useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, NodeInput, NodeSelect } from './BaseNode';
import { useStore } from '../store';
import { GitFork, RefreshCw, Timer } from 'lucide-react';

// ── Conditional (If/Else) ─────────────────────────────────────────────────────
export const ConditionalNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleCondChange = useCallback((e) => updateNodeData(id, { condition: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Conditional" icon={GitFork} color="orange" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'input' },
                { type: 'source', position: Position.Right, id: 'true_branch', style: { top: '35%' } },
                { type: 'source', position: Position.Right, id: 'false_branch', style: { top: '65%' } },
            ]}
        >
            <NodeInput
                label="Condition (JS expression)"
                value={data?.condition}
                onChange={handleCondChange}
                placeholder='e.g. input.length > 100'
            />
            <div className="flex gap-2 mt-1 text-[10px] font-semibold">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">✓ True → top</span>
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">✗ False → bottom</span>
            </div>
        </BaseNode>
    );
};

// ── Loop ──────────────────────────────────────────────────────────────────────
export const LoopNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleMaxIterChange = useCallback((e) => updateNodeData(id, { maxIterations: e.target.value }), [id, updateNodeData]);
    const handleModeChange = useCallback((e) => updateNodeData(id, { loopMode: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Loop" icon={RefreshCw} color="indigo" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'list_in' },
                { type: 'source', position: Position.Right, id: 'item_out', style: { top: '35%' } },
                { type: 'source', position: Position.Right, id: 'done_out', style: { top: '65%' } },
            ]}
        >
            <NodeSelect
                label="Mode"
                value={data?.loopMode ?? 'For Each'}
                onChange={handleModeChange}
                options={['For Each', 'While Condition', 'Fixed Count']}
            />
            <NodeInput
                label="Max Iterations"
                value={data?.maxIterations}
                onChange={handleMaxIterChange}
                placeholder="e.g. 10"
            />
        </BaseNode>
    );
};

// ── Delay / Timer ─────────────────────────────────────────────────────────────
export const DelayNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleSecondsChange = useCallback((e) => updateNodeData(id, { delaySeconds: e.target.value }), [id, updateNodeData]);
    const handleUnitChange = useCallback((e) => updateNodeData(id, { delayUnit: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Delay" icon={Timer} color="slate" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'trigger_in' },
                { type: 'source', position: Position.Right, id: 'trigger_out' },
            ]}
        >
            <NodeInput
                label="Duration"
                value={data?.delaySeconds}
                onChange={handleSecondsChange}
                placeholder="e.g. 2"
            />
            <NodeSelect
                label="Unit"
                value={data?.delayUnit ?? 'Seconds'}
                onChange={handleUnitChange}
                options={['Milliseconds', 'Seconds', 'Minutes']}
            />
        </BaseNode>
    );
};
