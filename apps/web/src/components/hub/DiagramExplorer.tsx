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
  const lines: string[] = [];

  for (const line of code.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Drop invalid multi-node class lines (common Gemini output bug)
    if (trimmed.startsWith('class ') && !trimmed.startsWith('classDef ') && trimmed.includes(',')) {
      const parts = trimmed.split(/\s+/);
      const className = parts[parts.length - 1]?.replace(';', '');
      const nodes = trimmed
        .replace(/^class\s+/, '')
        .replace(new RegExp(`\\s+${className};?$`), '')
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      for (const node of nodes) {
        lines.push(`    class ${node} ${className}`);
      }
      continue;
    }

    if (trimmed.startsWith('class ') && !trimmed.startsWith('classDef ')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 3) {
        const className = parts[parts.length - 1].replace(';', '');
        const nodesStr = parts.slice(1, parts.length - 1).join('');
        lines.push(`    class ${nodesStr} ${className}`);
        continue;
      }
    }

    lines.push(line);
  }

  let result = lines.join('\n').trim();
  if (result && !result.startsWith('flowchart') && !result.startsWith('graph')) {
    result = `flowchart LR\n${result}`;
  }
  return result;
};

export const DiagramExplorer: React.FC<DiagramExplorerProps> = ({ mermaidCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!mermaidCode) return;

    let isCancelled = false;

    const renderDiagram = async () => {
      setRenderError(null);
      setSvgHtml('');
      try {
        const sanitizedCode = sanitizeMermaidCode(mermaidCode);
        if (!sanitizedCode) return;

        // Use mermaid.render() — returns SVG as a string without touching the live DOM.
        // This avoids the querySelector crash caused by mermaid.run() mutating a DOM
        // node that React may have unmounted between the call and its internal async work.
        const renderId = `mermaid-render-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, sanitizedCode);

        if (isCancelled) return;

        setSvgHtml(svg);

        // Inject into the container only after we have the final SVG string
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: string }).message)
            : 'Failed to render flowchart structure';
        setRenderError(message);
      }
    };

    renderDiagram();

    return () => {
      isCancelled = true;
    };
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
              style={{ 
                visibility: svgHtml ? 'visible' : 'hidden',
                position: svgHtml ? 'relative' : 'absolute',
                top: svgHtml ? 'auto' : '-9999px',
                left: svgHtml ? 'auto' : '-9999px'
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
export default DiagramExplorer;
