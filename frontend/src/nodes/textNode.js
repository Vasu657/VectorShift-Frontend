// nodes/textNode.js — Store-synced text node with auto-resize and variable handles
import { memo, useEffect, useRef, useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, FieldLabel } from './BaseNode';
import { useStore } from '../store';
import { Type } from 'lucide-react';

// Extract {{variable}} handles from text
const getHandles = (text) => {
  const safeText = text?.slice(0, 10000) || '';
  const regex = /{{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*}}/g;
  const matches = [...safeText.matchAll(regex)];
  const variableNames = [...new Set(matches.map((m) => m[1]))];
  return [
    { type: 'source', position: Position.Right, id: 'output' },
    ...variableNames.map((name, index) => ({
      type: 'target',
      position: Position.Left,
      id: name,
      style: { top: `${60 + index * 26}px` },
    })),
  ];
};

export const TextNode = memo(({ id, data, selected }) => {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const textareaRef = useRef(null);

  const currText = data?.text ?? '{{input}}';
  const handles = getHandles(currText);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [currText]);

  // Compute dynamic node width based on longest line
  const nodeWidth = (() => {
    const lines = currText.split('\n');
    const maxLen = Math.max(0, ...lines.map((l) => l.length));
    return Math.max(280, Math.min(600, maxLen * 8 + 60));
  })();

  const handleChange = useCallback(
    (e) => updateNodeData(id, { text: e.target.value }),
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      data={data}
      title="Text"
      icon={Type}
      color="indigo"
      selected={selected}
      handles={handles}
      style={{ width: nodeWidth, minWidth: 280 }}
    >
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Text Body</FieldLabel>
        <textarea
          ref={textareaRef}
          value={currText}
          onChange={handleChange}
          className="w-full min-h-[60px] max-h-[200px] px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-medium resize-none overflow-y-auto"
          placeholder="Enter text with {{variables}}"
          aria-label="Text node content"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Use <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{'{{var}}'}</code> to create input handles
        </p>
      </div>
    </BaseNode>
  );
});
