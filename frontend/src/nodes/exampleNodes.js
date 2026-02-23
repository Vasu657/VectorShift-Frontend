// nodes/exampleNodes.js — Enhanced example nodes with color tokens, dark mode, store sync
import { useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, FieldLabel, NodeInput, NodeSelect } from './BaseNode';
import { DynamicModelSelect } from '../components/DynamicModelSelect';
import { useStore } from '../store';
import { Layers, Filter, FileText, SplitSquareHorizontal, Webhook } from 'lucide-react';

export const TransformNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleChange = useCallback((e) => updateNodeData(id, { transformFn: e.target.value }), [id, updateNodeData]);
    const handleModelChange = useCallback((v) => updateNodeData(id, { transformModel: v }), [id, updateNodeData]);
    return (
        <BaseNode id={id} data={data} title="Transform" icon={Layers} color="amber" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'input' },
                { type: 'source', position: Position.Right, id: 'output' },
            ]}
        >
            <DynamicModelSelect label="Model" value={data?.transformModel ?? ''} onChange={handleModelChange} />
            <NodeInput label="Transform Logic" value={data?.transformFn} onChange={handleChange} placeholder="Describe transformation..." />
        </BaseNode>
    );
};

export const FilterNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleChange = useCallback((e) => updateNodeData(id, { condition: e.target.value }), [id, updateNodeData]);
    return (
        <BaseNode id={id} data={data} title="Filter" icon={Filter} color="cyan" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'input' },
                { type: 'source', position: Position.Right, id: 'output' },
            ]}
        >
            <NodeInput label="Condition" value={data?.condition} onChange={handleChange} placeholder="e.g. value > 0" />
        </BaseNode>
    );
};

export const JoinNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleChange = useCallback((e) => updateNodeData(id, { separator: e.target.value }), [id, updateNodeData]);
    return (
        <BaseNode id={id} data={data} title="Join" icon={FileText} color="amber" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'input1', style: { top: '30%' } },
                { type: 'target', position: Position.Left, id: 'input2', style: { top: '70%' } },
                { type: 'source', position: Position.Right, id: 'output' },
            ]}
        >
            <NodeInput label="Separator" value={data?.separator} onChange={handleChange} placeholder='e.g. \n or ," "' />
        </BaseNode>
    );
};

export const SplitNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleChange = useCallback((e) => updateNodeData(id, { delimiter: e.target.value }), [id, updateNodeData]);
    return (
        <BaseNode id={id} data={data} title="Split" icon={SplitSquareHorizontal} color="cyan" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'input' },
                { type: 'source', position: Position.Right, id: 'output1', style: { top: '30%' } },
                { type: 'source', position: Position.Right, id: 'output2', style: { top: '70%' } },
            ]}
        >
            <NodeInput label="Delimiter" value={data?.delimiter} onChange={handleChange} placeholder='e.g. \n or ,' />
        </BaseNode>
    );
};

export const APINode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleMethodChange = useCallback((e) => updateNodeData(id, { method: e.target.value }), [id, updateNodeData]);
    const handleUrlChange = useCallback((e) => updateNodeData(id, { url: e.target.value }), [id, updateNodeData]);
    return (
        <BaseNode id={id} data={data} title="API Call" icon={Webhook} color="rose" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'request' },
                { type: 'source', position: Position.Right, id: 'response' },
            ]}
        >
            <NodeSelect label="Method" value={data?.method ?? 'GET'} onChange={handleMethodChange} options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE']} />
            <NodeInput label="URL" value={data?.url} onChange={handleUrlChange} placeholder="https://api.example.com/data" />
        </BaseNode>
    );
};
