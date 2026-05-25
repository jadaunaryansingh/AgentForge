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

const sanitizeMermaidCode = (code: string): string => {
  if (!code) return '';
  return code
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      // Fix class declarations with comma-spaces (e.g. class START, END style;)
      if (trimmed.startsWith('class ') && !trimmed.startsWith('classDef ')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
          const className = parts[parts.length - 1];
          const nodesStr = parts.slice(1, parts.length - 1).join('');
          return `    class ${nodesStr} ${className}`;
        }
      }
      return line;
    })
    .join('\n');
};

export const DiagramExplorer: React.FC<DiagramExplorerProps> = ({ mermaidCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!mermaidCode) return;

    const renderDiagram = async () => {
      setRenderError(null);
      try {
        if (!containerRef.current) return;
        
        // 1. Sanitize code
        const sanitizedCode = sanitizeMermaidCode(mermaidCode);

        // 2. Clear old contents and create new mermaid element
        containerRef.current.innerHTML = '';
        const child = document.createElement('div');
        child.className = 'mermaid';
        child.textContent = sanitizedCode.trim();
        containerRef.current.appendChild(child);

        // 3. Render using Mermaid DOM runner
        await mermaid.run({
          nodes: [child]
        });

        // 4. Capture outerHTML for SVG download compatibility
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          setSvgHtml(svgElement.outerHTML);
        }
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
        ) : (
          <>
            {!svgHtml && (
              <div className="diagram-loading-placeholder">
                <span className="spinner-glow" />
                <p>Compiling SVG visualizer...</p>
              </div>
            )}
            <div 
              ref={containerRef}
              className="mermaid-render-container"
              style={{ display: svgHtml ? 'block' : 'none' }}
            />
          </>
        )}
      </div>
    </div>
  );
};
export default DiagramExplorer;
