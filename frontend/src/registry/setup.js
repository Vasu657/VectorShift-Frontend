// registry/setup.js — Full node registration with field schemas, categories, and color tokens
import { NodeRegistry } from './NodeRegistry';
import { Database, FileText, Cpu, Type, Layers, Filter, SplitSquareHorizontal, Workflow, Webhook } from 'lucide-react';

import { InputNode } from '../nodes/inputNode';
import { LLMNode } from '../nodes/llmNode';
import { OutputNode } from '../nodes/outputNode';
import { TextNode } from '../nodes/textNode';
import { TransformNode, FilterNode, JoinNode, SplitNode, APINode } from '../nodes/exampleNodes';

export const setupRegistry = () => {
    NodeRegistry.register('customInput', InputNode, {
        label: 'Input',
        icon: Database,
        category: 'I/O',
        color: 'green',
        fields: [
            { key: 'inputName', label: 'Variable Name', type: 'text', placeholder: 'e.g. user_query' },
            { key: 'inputType', label: 'Data Type', type: 'select', options: ['Text', 'File', 'Image', 'Number', 'Boolean'] },
        ],
    });

    NodeRegistry.register('customOutput', OutputNode, {
        label: 'Output',
        icon: Workflow,
        category: 'I/O',
        color: 'rose',
        fields: [
            { key: 'outputName', label: 'Variable Name', type: 'text', placeholder: 'e.g. final_answer' },
            { key: 'outputType', label: 'Data Type', type: 'select', options: ['Text', 'Image', 'File', 'JSON'] },
        ],
    });

    NodeRegistry.register('llm', LLMNode, {
        label: 'LLM',
        icon: Cpu,
        category: 'AI',
        color: 'purple',
        fields: [
            { key: 'model', label: 'Model', type: 'select', options: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-5-sonnet', 'claude-3-haiku', 'gemini-1.5-pro'] },
            { key: 'temperature', label: 'Temperature', type: 'number', placeholder: '0.7', min: 0, max: 2, step: 0.1 },
            { key: 'maxTokens', label: 'Max Tokens', type: 'number', placeholder: '1024', min: 1, max: 128000 },
            { key: 'systemPrompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant...' },
        ],
    });

    NodeRegistry.register('text', TextNode, {
        label: 'Text',
        icon: Type,
        category: 'Data',
        color: 'indigo',
        fields: [
            { key: 'text', label: 'Text Content', type: 'textarea', placeholder: 'Enter text with {{variables}}' },
        ],
    });

    NodeRegistry.register('transform', TransformNode, {
        label: 'Transform',
        icon: Layers,
        category: 'Data',
        color: 'amber',
        fields: [
            { key: 'transformFn', label: 'Transform Logic', type: 'textarea', placeholder: 'Describe the transformation...' },
        ],
    });

    NodeRegistry.register('filter', FilterNode, {
        label: 'Filter',
        icon: Filter,
        category: 'Logic',
        color: 'cyan',
        fields: [
            { key: 'condition', label: 'Filter Condition', type: 'text', placeholder: 'e.g. value > 0' },
        ],
    });

    NodeRegistry.register('join', JoinNode, {
        label: 'Join',
        icon: FileText,
        category: 'Data',
        color: 'amber',
        fields: [
            { key: 'separator', label: 'Separator', type: 'text', placeholder: 'e.g. \\n or , or " "' },
        ],
    });

    NodeRegistry.register('split', SplitNode, {
        label: 'Split',
        icon: SplitSquareHorizontal,
        category: 'Logic',
        color: 'cyan',
        fields: [
            { key: 'delimiter', label: 'Delimiter', type: 'text', placeholder: 'e.g. \\n or ,' },
            { key: 'maxSplits', label: 'Max Splits', type: 'number', placeholder: '2', min: 1 },
        ],
    });

    NodeRegistry.register('api', APINode, {
        label: 'API Call',
        icon: Webhook,
        category: 'Logic',
        color: 'rose',
        fields: [
            { key: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
            { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/data' },
            { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer ..."}' },
        ],
    });
};
