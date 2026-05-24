import React, { useState, useEffect } from 'react';
import { useProjects, NodeDefinition, GraphDefinition } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowCanvas } from '../components/workbench/FlowCanvas';
import { NodeInspector } from '../components/workbench/NodeInspector';
import { GitFork, Layers, Info, Save } from 'lucide-react';
import { ParticleBackground } from '../components/ui/ParticleBackground';

export const Workbench: React.FC = () => {
  const { activeProject, activeArchitecture } = useProjects();
  const navigate = useNavigate();

  // Local copy of graph for user canvas edits
  const [localGraph, setLocalGraph] = useState<GraphDefinition | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDefinition | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with loaded architecture on mount/update
  useEffect(() => {
    if (activeArchitecture && activeArchitecture.graph_definition) {
      setLocalGraph(JSON.parse(JSON.stringify(activeArchitecture.graph_definition)));
      setSelectedNode(null);
      setHasUnsavedChanges(false);
    }
  }, [activeArchitecture]);

  if (!activeProject) {
    return (
      <div className="workbench-empty-page">
        <ParticleBackground />
        <div className="empty-card">
          <Info size={36} />
          <h3>No workspace loaded</h3>
          <p>Navigate to the solutions registry to open or initialize a project workspace.</p>
          <button onClick={() => navigate('/dashboard')} className="enter-btn">
            Open Registry
          </button>
        </div>
      </div>
    );
  }

  if (!activeArchitecture || !localGraph) {
    return (
      <div className="workbench-empty-page">
        <ParticleBackground />
        <div className="empty-card">
          <Info size={36} />
          <h3>No compiled graph found</h3>
          <p>Please outline your specifications in the Prompt Studio to compile your first LangGraph revision.</p>
          <button onClick={() => navigate('/new-project')} className="enter-btn">
            Go to Prompt Studio
          </button>
        </div>
      </div>
    );
  }

  const handleNodeSelect = (node: NodeDefinition) => {
    setSelectedNode(node);
  };

  const handleNodeUpdate = (updatedNode: NodeDefinition) => {
    if (!localGraph) return;

    const newNodes = localGraph.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    setLocalGraph({
      ...localGraph,
      nodes: newNodes,
    });
    
    // Update selected node in state to show changes
    setSelectedNode(updatedNode);
    setHasUnsavedChanges(true);
  };

  const handleCommit = () => {
    // In local development, we commit canvas revisions locally
    setHasUnsavedChanges(false);
    alert('Changes successfully committed to active design draft!');
  };

  return (
    <div className="workbench-workspace-container">
      <ParticleBackground />

      <div className="workbench-three-panel-grid">
        {/* Left Control Panel: Stats & State variables list */}
        <aside className="workbench-left-sidebar">
          <div className="sidebar-inner-card">
            <div className="panel-section-title">
              <Layers size={16} className="title-icon" />
              <h3>Workflow Overview</h3>
            </div>

            <div className="graph-pattern-details">
              <span className="pattern-badge">{localGraph.pattern_name || 'Custom Pattern'}</span>
              <p className="pattern-desc">{localGraph.description || 'Custom multi-agent routing graph.'}</p>
            </div>

            <hr className="divider" />

            <div className="panel-section-title">
              <GitFork size={16} className="title-icon" />
              <h3>State Variables</h3>
            </div>
            
            <div className="variables-list-box">
              {Object.keys(localGraph.state_schema || {}).length === 0 ? (
                <span className="empty-label">No state schema declared</span>
              ) : (
                <ul className="vars-ul">
                  {Object.entries(localGraph.state_schema || {}).map(([key, val]: [string, any]) => (
                    <li key={key} className="var-item">
                      <div className="var-meta">
                        <span className="var-name">{key}</span>
                        <span className="var-type">{val.type || 'str'}</span>
                      </div>
                      {val.reducer && <span className="var-reducer">reducer: {val.reducer}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="panel-footer-actions">
              <button 
                onClick={() => navigate('/hub')} 
                className="view-reports-btn"
              >
                Evaluate & Export Code
              </button>
            </div>
          </div>
        </aside>

        {/* Center Panel: The Flow Canvas */}
        <section className="workbench-canvas-wrapper">
          <div className="canvas-header-controls">
            <div className="controls-left">
              <h2 className="canvas-title">Interaction Canvas</h2>
              <span className="canvas-subtitle">Click agent or tool nodes to inspect directives</span>
            </div>
            
            {hasUnsavedChanges && (
              <motion.button 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={handleCommit}
                className="commit-changes-btn"
              >
                <Save size={14} />
                <span>Save Draft</span>
              </motion.button>
            )}
          </div>

          <div className="canvas-box-border">
            <FlowCanvas
              graph={localGraph}
              selectedNodeId={selectedNode?.id || null}
              onSelectNode={handleNodeSelect}
            />
          </div>
        </section>

        {/* Right Panel: Node details Inspector */}
        <AnimatePresence>
          {selectedNode && (
            <motion.aside 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="workbench-right-sidebar"
            >
              <NodeInspector
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={handleNodeUpdate}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default Workbench;
