import React, { useState } from 'react';
import { Architecture } from '../../context/ProjectContext';
import axios from 'axios';
import { Download, Copy, Check, Server, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportPanelProps {
  architecture: Architecture;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ architecture }) => {
  const [exporting, setExporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMermaid, setCopiedMermaid] = useState(false);

  const infra = architecture.infrastructure_recommendations || {
    deployment_platform: 'AWS ECS (Fargate)',
    container_strategy: 'Docker multi-stage build',
    database_tier: 'Neon Serverless Postgres',
    caching_strategy: 'Redis Upstash Cache',
    scaling_approach: 'CPU metric autoscale',
    estimated_infra_cost_usd: 35.0,
  };

  const handleZipDownload = async () => {
    setExporting(true);
    const downloadToast = toast.loading('Assembling codebase archive...');
    try {
      // Direct binary download from our custom architect export API
      const res = await axios.post(`/api/architect/export/${architecture.id}`, {}, {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agentforge_solution_v${architecture.version}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('ZIP download complete!', { id: downloadToast });
    } catch (err) {
      console.error('Codebase export failure:', err);
      toast.error('Failed to export system zip package.', { id: downloadToast });
    } finally {
      setExporting(false);
    }
  };

  const copyText = async (text: string | undefined, setter: (val: boolean) => void, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setter(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard.');
    }
  };

  return (
    <div className="export-panel-container">
      <div className="export-infra-recommendations">
        <div className="card-section-title">
          <Server size={16} />
          <h3>Infrastructure Strategy</h3>
        </div>

        <div className="infra-grid">
          <div className="infra-item">
            <Cpu size={16} className="infra-icon" />
            <div className="infra-meta">
              <span className="infra-label">Deployment Host</span>
              <span className="infra-value">{infra.deployment_platform}</span>
            </div>
          </div>

          <div className="infra-item">
            <ShieldCheck size={16} className="infra-icon" />
            <div className="infra-meta">
              <span className="infra-label">Scale Strategy</span>
              <span className="infra-value">{infra.scaling_approach}</span>
            </div>
          </div>

          <div className="infra-item">
            <HardDrive size={16} className="infra-icon" />
            <div className="infra-meta">
              <span className="infra-label">Database Engine</span>
              <span className="infra-value">{infra.database_tier}</span>
            </div>
          </div>

          <div className="infra-item">
            <Server size={16} className="infra-icon" />
            <div className="infra-meta">
              <span className="infra-label">State Cache</span>
              <span className="infra-value">{infra.caching_strategy}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="export-actions-card">
        <div className="card-section-title">
          <Download size={16} />
          <h3>Export Operations</h3>
        </div>
        
        <p className="export-desc">
          Download the production-ready code modules, requirements, and environment variables wrapped in a structured ZIP archive.
        </p>

        <button 
          onClick={handleZipDownload} 
          disabled={exporting}
          className={`zip-export-btn ${exporting ? 'disabled' : ''}`}
        >
          {exporting ? (
            <>
              <span className="spinner" />
              <span>Packaging System...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Download LangGraph ZIP</span>
            </>
          )}
        </button>

        <hr className="divider" />

        <div className="action-buttons-row">
          <button 
            onClick={() => copyText(architecture.generated_code, setCopiedCode, 'Python Code')}
            className="copy-btn-secondary"
          >
            {copiedCode ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>Copy Python</span>
          </button>

          <button 
            onClick={() => copyText(architecture.diagram_mermaid, setCopiedMermaid, 'Mermaid Diagram')}
            className="copy-btn-secondary"
          >
            {copiedMermaid ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>Copy Mermaid</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExportPanel;
