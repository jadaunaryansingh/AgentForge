import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Wrench } from 'lucide-react';

interface ToolNodeProps {
  data: {
    id?: string;
    name?: string;
    description?: string;
    tools?: string[];
    is_active?: boolean;
  };
}

export const ToolNode: React.FC<ToolNodeProps> = ({ data }) => {
  const toolsList = data.tools || [];

  return (
    <div className={`custom-flow-node tool-node ${data.is_active ? 'active-glow' : ''}`}>
      {/* Target Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="input" 
        className="flow-node-handle" 
      />

      <div className="node-header">
        <div className="node-icon-glow emerald">
          <Wrench size={16} />
        </div>
        <div className="node-meta">
          <span className="node-type-label">Utility Tool</span>
          <h4 className="node-title">{data.name || data.id || 'Unnamed Tool'}</h4>
        </div>
      </div>

      <div className="node-body">
        <p className="node-desc">{data.description}</p>
        
        {toolsList.length > 0 && (
          <div className="node-tool-pills">
            {toolsList.slice(0, 3).map((t, idx) => (
              <span key={idx} className="tool-pill">{t}</span>
            ))}
            {toolsList.length > 3 && (
              <span className="tool-pill more">+{toolsList.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Source Handle */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output" 
        className="flow-node-handle" 
      />
    </div>
  );
};
export default ToolNode;
