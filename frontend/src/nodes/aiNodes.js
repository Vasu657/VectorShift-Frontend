// nodes/aiNodes.js — Dedicated AI-focused nodes (Embedder, Image Gen, Classifier, Summarizer)
import { useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, NodeInput, NodeSelect } from './BaseNode';
import { useStore } from '../store';
import { Boxes, ImagePlus, Tags, AlignLeft } from 'lucide-react';

// ── Embedder ──────────────────────────────────────────────────────────────────
export const EmbedderNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleModelChange = useCallback((e) => updateNodeData(id, { embeddingModel: e.target.value }), [id, updateNodeData]);
    const handleDimChange = useCallback((e) => updateNodeData(id, { dimensions: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Embedder" icon={Boxes} color="violet" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'text_in' },
                { type: 'source', position: Position.Right, id: 'vector_out' },
            ]}
        >
            <NodeSelect
                label="Embedding Model"
                value={data?.embeddingModel ?? 'text-embedding-3-small'}
                onChange={handleModelChange}
                options={['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002', 'all-MiniLM-L6-v2']}
            />
            <NodeSelect
                label="Dimensions"
                value={data?.dimensions ?? '1536'}
                onChange={handleDimChange}
                options={['256', '512', '1024', '1536', '3072']}
            />
        </BaseNode>
    );
};

// ── Image Generator ───────────────────────────────────────────────────────────
export const ImageGenNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleModelChange = useCallback((e) => updateNodeData(id, { imageModel: e.target.value }), [id, updateNodeData]);
    const handleSizeChange = useCallback((e) => updateNodeData(id, { imageSize: e.target.value }), [id, updateNodeData]);
    const handleQualChange = useCallback((e) => updateNodeData(id, { quality: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Image Gen" icon={ImagePlus} color="pink" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'prompt' },
                { type: 'source', position: Position.Right, id: 'image_url' },
            ]}
        >
            <NodeSelect
                label="Model"
                value={data?.imageModel ?? 'dall-e-3'}
                onChange={handleModelChange}
                options={['dall-e-3', 'dall-e-2', 'stable-diffusion-xl']}
            />
            <NodeSelect
                label="Size"
                value={data?.imageSize ?? '1024x1024'}
                onChange={handleSizeChange}
                options={['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']}
            />
            <NodeSelect
                label="Quality"
                value={data?.quality ?? 'standard'}
                onChange={handleQualChange}
                options={['standard', 'hd']}
            />
        </BaseNode>
    );
};

// ── Text Classifier ───────────────────────────────────────────────────────────
export const ClassifierNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleLabelsChange = useCallback((e) => updateNodeData(id, { labels: e.target.value }), [id, updateNodeData]);
    const handleModelChange = useCallback((e) => updateNodeData(id, { classifierModel: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Classifier" icon={Tags} color="teal" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'text_in' },
                { type: 'source', position: Position.Right, id: 'label_out', style: { top: '35%' } },
                { type: 'source', position: Position.Right, id: 'score_out', style: { top: '65%' } },
            ]}
        >
            <NodeSelect
                label="Model"
                value={data?.classifierModel ?? 'gpt-4o'}
                onChange={handleModelChange}
                options={['gpt-4o', 'gpt-3.5-turbo', 'claude-3-haiku']}
            />
            <NodeInput
                label="Labels (comma-separated)"
                value={data?.labels}
                onChange={handleLabelsChange}
                placeholder="positive, negative, neutral"
            />
        </BaseNode>
    );
};

// ── Summarizer ────────────────────────────────────────────────────────────────
export const SummarizerNode = ({ id, data, selected }) => {
    const updateNodeData = useStore((s) => s.updateNodeData);
    const handleModelChange = useCallback((e) => updateNodeData(id, { summaryModel: e.target.value }), [id, updateNodeData]);
    const handleStyleChange = useCallback((e) => updateNodeData(id, { summaryStyle: e.target.value }), [id, updateNodeData]);
    const handleLengthChange = useCallback((e) => updateNodeData(id, { summaryLength: e.target.value }), [id, updateNodeData]);

    return (
        <BaseNode id={id} data={data} title="Summarizer" icon={AlignLeft} color="sky" selected={selected}
            handles={[
                { type: 'target', position: Position.Left, id: 'document_in' },
                { type: 'source', position: Position.Right, id: 'summary_out' },
            ]}
        >
            <NodeSelect
                label="Model"
                value={data?.summaryModel ?? 'gpt-4o'}
                onChange={handleModelChange}
                options={['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro']}
            />
            <NodeSelect
                label="Style"
                value={data?.summaryStyle ?? 'Concise'}
                onChange={handleStyleChange}
                options={['Concise', 'Bullet Points', 'Detailed', 'ELI5']}
            />
            <NodeSelect
                label="Target Length"
                value={data?.summaryLength ?? 'Short'}
                onChange={handleLengthChange}
                options={['1 Sentence', 'Short', 'Medium', 'Long']}
            />
        </BaseNode>
    );
};
