import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle, Download } from 'lucide-react';

interface DiagramExplorerProps {
  mermaidCode: string;
}

// Configure global Mermaid options
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
});

export const DiagramExplorer: React.FC<DiagramExplorerProps> = ({ mermaidCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!mermaidCode) return;

    const renderDiagram = async () => {
      setRenderError(null);
      try {
        // Clear previous container contents
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Standardize IDs for mermaid compile
        const elementId = `mermaid-svg-${Math.floor(Math.random() * 10000)}`;
        
        // Generate SVG string
        const { svg } = await mermaid.render(elementId, mermaidCode.trim());
        setSvgHtml(svg);
      } catch (err: any) {
        console.error("Mermaid parsing error:", err);
        setRenderError(err.message || 'Failed to render flowchart structure');
      }
    };

    renderDiagram();
  }, [mermaidCode]);

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agentforge_workflow.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="diagram-explorer-component">
      <div className="diagram-header-bar">
        <span className="diagram-status-label">Flow Diagram Preview</span>
        {svgHtml && !renderError && (
          <button onClick={handleDownloadSvg} className="export-svg-btn">
            <Download size={14} />
            <span>Download SVG</span>
          </button>
        )}
      </div>

      <div className="diagram-viewport-card">
        {renderError ? (
          <div className="diagram-error-card">
            <AlertCircle className="error-icon" size={24} />
            <p className="error-title">Rendering Issue</p>
            <p className="error-desc">{renderError}</p>
            <pre className="raw-mermaid-box">{mermaidCode}</pre>
          </div>
        ) : svgHtml ? (
          <div 
            className="mermaid-render-container"
            dangerouslySetInnerHTML={{ __html: svgHtml }} 
          />
        ) : (
          <div className="diagram-loading-placeholder">
            <span className="spinner-glow" />
            <p>Compiling SVG visualizer...</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default DiagramExplorer;
