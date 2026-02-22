// nodes/inputNode.js — Store-synced input node
import { useCallback } from 'react';
import { Position } from 'reactflow';
import { BaseNode, NodeInput, NodeSelect } from './BaseNode';
import { useStore } from '../store';
import { Database } from 'lucide-react';

export const InputNode = ({ id, data, selected }) => {
  const updateNodeData = useStore((s) => s.updateNodeData);

  // Fallback values so the node renders cleanly on first drop
  const inputName = data?.inputName ?? id.replace('customInput-', 'input_');
  const inputType = data?.inputType ?? 'Text';

  const handleNameChange = useCallback(
    (e) => updateNodeData(id, { inputName: e.target.value }),
    [id, updateNodeData]
  );

  const handleTypeChange = useCallback(
    (e) => updateNodeData(id, { inputType: e.target.value }),
    [id, updateNodeData]
  );

  return (
    <BaseNode
      id={id}
      data={data}
      title="Input"
      icon={Database}
      color="green"
      selected={selected}
      handles={[
        { type: 'source', position: Position.Right, id: 'value' },
      ]}
    >
      <NodeInput label="Name" value={inputName} onChange={handleNameChange} placeholder="input_name" />
      <NodeSelect label="Type" value={inputType} onChange={handleTypeChange} options={['Text', 'File', 'Image', 'Number', 'Boolean']} />
    </BaseNode>
  );
};
