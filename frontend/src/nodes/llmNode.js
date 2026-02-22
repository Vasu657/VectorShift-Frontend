// nodes/llmNode.js — LLM node with model selector, store-synced state
import { useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, FieldLabel, NodeSelect } from './BaseNode';
import { useStore } from '../store';
import { Cpu } from 'lucide-react';

const MODELS = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo', 'claude-3-5-sonnet', 'claude-3-haiku', 'gemini-1.5-pro'];

export const LLMNode = ({ id, data, selected }) => {
  const updateNodeData = useStore((s) => s.updateNodeData);

  const model = data?.model ?? 'gpt-4o';

  const handleModelChange = useCallback(
    (e) => updateNodeData(id, { model: e.target.value }),
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      data={data}
      title="LLM"
      icon={Cpu}
      color="purple"
      selected={selected}
      handles={[
        { type: 'target', position: Position.Left, id: 'system', style: { top: `${100 / 3}%` } },
        { type: 'target', position: Position.Left, id: 'prompt', style: { top: `${200 / 3}%` } },
        { type: 'source', position: Position.Right, id: 'response' },
      ]}
    >
      <div className="flex flex-col gap-2">
        <NodeSelect label="Model" value={model} onChange={handleModelChange} options={MODELS} />
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Input Handles</span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>↙ <strong className="text-purple-600 dark:text-purple-400">system</strong> — system prompt</span>
            <span>↙ <strong className="text-purple-600 dark:text-purple-400">prompt</strong> — user message</span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};
