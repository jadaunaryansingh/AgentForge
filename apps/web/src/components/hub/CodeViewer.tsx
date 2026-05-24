import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, FileCode } from 'lucide-react';

interface CodeViewerProps {
  code: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code block:', err);
    }
  };

  return (
    <div className="code-viewer-component">
      <div className="code-viewer-header">
        <div className="file-meta">
          <FileCode size={16} className="file-icon" />
          <span className="file-name">compiled_workflow.py</span>
        </div>
        <button onClick={handleCopy} className="copy-code-action-btn">
          {copied ? (
            <>
              <Check size={14} className="text-success" />
              <span className="text-success">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      <div className="syntax-scroller-border">
        <SyntaxHighlighter
          language="python"
          style={tomorrow}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: 'transparent',
            fontSize: '13px',
            fontFamily: 'Fira Code, monospace',
            lineHeight: '1.6',
          }}
        >
          {code || '# No compiled code generated.'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
export default CodeViewer;
