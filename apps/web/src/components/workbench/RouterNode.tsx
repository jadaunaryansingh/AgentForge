import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface RouterNodeProps {
  data: {
    id?: string;
    name?: string;
    description?: string;
    is_active?: boolean;
  };
}

export const RouterNode: React.FC<RouterNodeProps> = ({ data }) => {
  return (
    <div className={`custom-flow-node router-node ${data.is_active ? 'active-glow' : ''}`}>
      <Handle type="target" position={Position.Left} id="input" className="flow-node-handle" />

      <div className="node-header">
        <div className="node-icon-glow violet">
          <GitBranch size={16} />
        </div>
        <div className="node-meta">
          <span className="node-type-label">Router</span>
          <h4 className="node-title">{data.name || data.id || 'Decision Router'}</h4>
        </div>
      </div>

      <div className="node-body">
        <p className="node-desc">{data.description || 'Routes execution based on state conditions.'}</p>
      </div>

      <Handle type="source" position={Position.Right} id="output" className="flow-node-handle" />
    </div>
  );
};

export default RouterNode;
