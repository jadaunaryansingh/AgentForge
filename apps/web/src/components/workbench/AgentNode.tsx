import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Cpu, Wrench } from 'lucide-react';

interface AgentNodeProps {
  data: {
    id?: string;
    name?: string;
    description?: string;
    model_config_data?: {
      model?: string;
      temperature?: number;
    };
    tools?: string[];
    is_active?: boolean;
  };
}

export const AgentNode: React.FC<AgentNodeProps> = ({ data }) => {
  const modelName = data.model_config_data?.model || 'llama-3.3-70b';
  const tools = data.tools || [];

  return (
    <div className={`custom-flow-node agent-node ${data.is_active ? 'active-glow' : ''}`}>
      {/* Target Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="input" 
        className="flow-node-handle" 
      />

      <div className="node-header">
        <div className="node-icon-glow purple">
          <Bot size={16} />
        </div>
        <div className="node-meta">
          <span className="node-type-label">Agent Core</span>
          <h4 className="node-title">{data.name || data.id || 'Unnamed Agent'}</h4>
        </div>
      </div>

      <div className="node-body">
        <p className="node-desc">{data.description}</p>
        
        <div className="node-specs">
          <div className="spec-item">
            <Cpu size={12} />
            <span>{modelName}</span>
          </div>
          {tools.length > 0 && (
            <div className="spec-item text-success">
              <Wrench size={12} />
              <span>{tools.length} Tools</span>
            </div>
          )}
        </div>
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
export default AgentNode;
