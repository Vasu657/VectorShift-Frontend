// nodes/outputNode.js — Store-synced output node
import { memo, useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, NodeInput, NodeSelect } from './BaseNode';
import { useStore } from '../store';
import { Workflow } from 'lucide-react';

export const OutputNode = memo(({ id, data, selected }) => {
  const updateNodeData = useStore((s) => s.updateNodeData);

  const outputName = data?.outputName ?? id.replace('customOutput-', 'output_');
  const outputType = data?.outputType ?? 'Text';

  const handleNameChange = useCallback(
    (e) => updateNodeData(id, { outputName: e.target.value }),
    [id, updateNodeData]
  );

  const handleTypeChange = useCallback(
    (e) => updateNodeData(id, { outputType: e.target.value }),
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      data={data}
      title="Output"
      icon={Workflow}
      color="rose"
      selected={selected}
      handles={[
        { type: 'target', position: Position.Left, id: 'value' },
      ]}
    >
      <NodeInput label="Name" value={outputName} onChange={handleNameChange} placeholder="output_name" />
      <NodeSelect label="Type" value={outputType} onChange={handleTypeChange} options={['Text', 'Image', 'File', 'JSON']} />
    </BaseNode>
  );
});
