import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DiagramExplorer } from '../components/hub/DiagramExplorer';
import { CodeViewer } from '../components/hub/CodeViewer';
import { CostEstimator } from '../components/hub/CostEstimator';
import { ExportPanel } from '../components/hub/ExportPanel';
import { Layers, FileCode, BarChart3, Download, Info } from 'lucide-react';
import { ParticleBackground } from '../components/ui/ParticleBackground';

type HubTab = 'flowchart' | 'code' | 'costing' | 'export';

export const ArchitectureHub: React.FC = () => {
  const { activeProject, activeArchitecture } = useProjects();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HubTab>('flowchart');

  if (!activeProject) {
    return (
      <div className="hub-empty-page">
        <ParticleBackground />
        <div className="empty-card">
          <Info size={36} />
          <h3>No workspace loaded</h3>
          <p>Please open or create a project workspace from your dashboard to begin modeling.</p>
          <button onClick={() => navigate('/dashboard')} className="enter-btn">
            Open Registry
          </button>
        </div>
      </div>
    );
  }

  if (!activeArchitecture) {
    return (
      <div className="hub-empty-page">
        <ParticleBackground />
        <div className="empty-card">
          <Info size={36} />
          <h3>No compiled systems found</h3>
          <p>Outline your multi-agent specifications in the Prompt Studio to compile code, flowcharts, and costs.</p>
          <button onClick={() => navigate('/new-project')} className="enter-btn">
            Go to Prompt Studio
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'flowchart', label: 'Flow Chart', icon: <Layers size={16} /> },
    { id: 'code', label: 'Python Modules', icon: <FileCode size={16} /> },
    { id: 'costing', label: 'Cost Calculator', icon: <BarChart3 size={16} /> },
    { id: 'export', label: 'Export ZIP', icon: <Download size={16} /> }
  ] as const;

  return (
    <div className="hub-layout-container">
      <ParticleBackground />

      <main className="hub-content">
        <header className="hub-header">
          <div className="hub-title-section">
            <span className="hub-meta-label">Architecture Hub</span>
            <h1 className="main-title">Evaluation & Export Portal</h1>
          </div>
          
          <div className="hub-tab-bar">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`tab-btn ${active ? 'active' : ''}`}
                >
                  <span className="tab-icon">{t.icon}</span>
                  <span className="tab-label">{t.label}</span>
                  {active && <motion.div layoutId="activeTabGlow" className="active-tab-glow" />}
                </button>
              );
            })}
          </div>
        </header>

        <section className="hub-main-viewport">
          {activeTab === 'flowchart' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="viewport-inner">
              <DiagramExplorer mermaidCode={activeArchitecture.diagram_mermaid || ''} />
            </motion.div>
          )}

          {activeTab === 'code' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="viewport-inner">
              <CodeViewer code={activeArchitecture.generated_code || ''} />
            </motion.div>
          )}

          {activeTab === 'costing' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="viewport-inner">
              <CostEstimator estimation={activeArchitecture.cost_estimation || null} />
            </motion.div>
          )}

          {activeTab === 'export' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="viewport-inner">
              <ExportPanel architecture={activeArchitecture} />
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};
export default ArchitectureHub;
