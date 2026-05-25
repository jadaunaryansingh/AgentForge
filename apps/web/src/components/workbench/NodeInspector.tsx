import React, { useState, useEffect } from 'react';
import { NodeDefinition } from '../../context/ProjectContext';
import { X, Bot, Wrench, ShieldAlert } from 'lucide-react';

interface NodeInspectorProps {
  node: NodeDefinition | null;
  onClose: () => void;
  onUpdate: (updatedNode: NodeDefinition) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ node, onClose, onUpdate }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [temp, setTemp] = useState(0.1);
  const [toolsString, setToolsString] = useState('');

  // Sync state when selected node changes
  useEffect(() => {
    if (node) {
      setName(node.name || node.id || '');
      setDesc(node.description || '');
      setSystemPrompt(node.system_prompt || '');
      setModel(node.model_config_data?.model || 'llama-3.3-70b-versatile');
      setTemp(node.model_config_data?.temperature ?? 0.1);
      setToolsString(node.tools?.join(', ') || '');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTools = toolsString
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onUpdate({
      ...node,
      name,
      description: desc,
      system_prompt: systemPrompt,
      model_config_data: {
        model,
        temperature: Number(temp),
      },
      tools: updatedTools,
    });
  };

  return (
    <div className="node-inspector-panel">
      <div className="inspector-header">
        <div className="inspector-title">
          <Bot size={18} className="title-icon" />
          <h3>Node Configurator</h3>
        </div>
        <button onClick={onClose} className="close-inspector-btn">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSave} className="inspector-form">
        <div className="form-scrollable-area">
          {/* Read Only Node Meta */}
          <div className="meta-badge-row">
            <span className="meta-badge-label">Node Identifier:</span>
            <code>{node.id}</code>
          </div>

          <div className="inspector-field">
            <label htmlFor="inspector-node-name">Display Name</label>
            <input
              id="inspector-node-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="inspector-field">
            <label htmlFor="inspector-node-desc">Function Summary</label>
            <textarea
              id="inspector-node-desc"
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
            />
          </div>

          {node.type !== 'tool' && (
            <>
              <div className="inspector-field">
                <label htmlFor="inspector-node-prompt">System Prompt Directives</label>
                <textarea
                  id="inspector-node-prompt"
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="e.g. You are an agent specialized in analyzing..."
                />
              </div>

              <div className="inspector-group-row">
                <div className="inspector-field flex-grow">
                  <label htmlFor="inspector-node-model">LLM Model</label>
                  <select
                    id="inspector-node-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option value="llama-3.3-70b-versatile">Llama 70B</option>
                    <option value="llama3-8b-8192">Llama 8B</option>
                    <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                  </select>
                </div>

                <div className="inspector-field width-30">
                  <label htmlFor="inspector-node-temp">Temp</label>
                  <input
                    id="inspector-node-temp"
                    type="number"
                    min="0"
                    max="1.2"
                    step="0.05"
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          <div className="inspector-field">
            <label htmlFor="inspector-node-tools">
              <span className="flex-center-gap">
                <Wrench size={14} />
                <span>Associated Tools (comma separated)</span>
              </span>
            </label>
            <input
              id="inspector-node-tools"
              type="text"
              placeholder="calculator, search_web, code_compiler"
              value={toolsString}
              onChange={(e) => setToolsString(e.target.value)}
            />
          </div>

          {node.type === 'router' && (
            <div className="inspector-alert notice">
              <ShieldAlert size={14} />
              <span>
                Note: Router nodes evaluate execution choices. Ensure condition labels are specified on output edges in the canvas.
              </span>
            </div>
          )}
        </div>

        <div className="inspector-actions">
          <button type="button" onClick={onClose} className="btn-secondary">
            Dismiss
          </button>
          <button type="submit" className="btn-primary">
            Apply Changes
          </button>
        </div>
      </form>
    </div>
  );
};
export default NodeInspector;
