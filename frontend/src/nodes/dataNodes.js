// nodes/dataNodes.js — Data manipulation nodes
import { useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, NodeInput, NodeSelect } from './BaseNode';
import { useStore } from '../store';
import { Braces, Table2, Calculator } from 'lucide-react';

// ── JSON Parser ───────────────────────────────────────────────────────────────
export const JSONParserNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handlePathChange = useCallback((e) => updateNodeData(id, { jsonPath: e.target.value }), [id, updateNodeData]);
    const handleModeChange = useCallback((e) => updateNodeData(id, { parseMode: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="JSON Parser" icon={Braces} color="amber" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'json_in' },
                { type: 'source', position: Position.Right, id: 'value_out', style: { top: '35%' } },
                { type: 'source', position: Position.Right, id: 'error_out', style: { top: '65%' } },
            ]}
        >
            <NodeSelect
                label="Mode"
                value={data?.parseMode ?? 'Extract Key'}
                onChange={handleModeChange}
                options={['Extract Key', 'Stringify', 'Array Length', 'Keys List']}
            />
            <NodeInput
                label="Key Path (dot-notation)"
                value={data?.jsonPath}
                onChange={handlePathChange}
                placeholder="e.g. data.results[0].name"
            />
        </BaseNode>
    );
};

// ── CSV / Table Parser ─────────────────────────────────────────────────────────
export const CSVParserNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleDelimChange = useCallback((e) => updateNodeData(id, { csvDelimiter: e.target.value }), [id, updateNodeData]);
    const handleHeaderChange = useCallback((e) => updateNodeData(id, { hasHeader: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="CSV Parser" icon={Table2} color="green" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'csv_in' },
                { type: 'source', position: Position.Right, id: 'rows_out', style: { top: '35%' } },
                { type: 'source', position: Position.Right, id: 'headers_out', style: { top: '65%' } },
            ]}
        >
            <NodeSelect
                label="Delimiter"
                value={data?.csvDelimiter ?? 'Comma'}
                onChange={handleDelimChange}
                options={['Comma', 'Semicolon', 'Tab', 'Pipe']}
            />
            <NodeSelect
                label="Has Header Row"
                value={data?.hasHeader ?? 'Yes'}
                onChange={handleHeaderChange}
                options={['Yes', 'No']}
            />
        </BaseNode>
    );
};

// ── Math / Calculator ─────────────────────────────────────────────────────────
export const CalculatorNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleExprChange = useCallback((e) => updateNodeData(id, { expression: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Calculator" icon={Calculator} color="cyan" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'a', style: { top: '35%' } },
                { type: 'target', position: Position.Left, id: 'b', style: { top: '65%' } },
                { type: 'source', position: Position.Right, id: 'result' },
            ]}
        >
            <NodeInput
                label="Expression"
                value={data?.expression}
                onChange={handleExprChange}
                placeholder="e.g. a + b * 2"
            />
        </BaseNode>
    );
};
