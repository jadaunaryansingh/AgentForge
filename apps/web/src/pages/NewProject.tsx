import React, { useState, useEffect, useRef } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Play, Terminal, ArrowRight, Loader, HelpCircle } from 'lucide-react';
import { ParticleBackground } from '../components/ui/ParticleBackground';

export const NewProject: React.FC = () => {
  const { activeProject, streamPhase, streamLogs, streamMessage, startArchitectureGeneration, resetStreamState } = useProjects();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [targetModel, setTargetModel] = useState('llama-3.3-70b-versatile');
  const [showHelper] = useState(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll console terminal to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamLogs]);

  // Clean stream state on mount
  useEffect(() => {
    resetStreamState();
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !activeProject) return;
    
    try {
      await startArchitectureGeneration(prompt, targetModel);
    } catch (err) {
      console.error(err);
    }
  };

  const isStreaming = streamPhase !== 'idle' && streamPhase !== 'completed' && streamPhase !== 'error';

  const getProgressPercentage = () => {
    switch (streamPhase) {
      case 'idle': return 0;
      case 'extracting': return 20;
      case 'planning': return 50;
      case 'codegen': return 75;
      case 'visualizing': return 90;
      case 'saving': return 95;
      case 'completed': return 100;
      case 'error': return 100;
      default: return 0;
    }
  };

  return (
    <div className="new-project-layout-container">
      <ParticleBackground />

      <main className="new-project-content">
        <header className="new-project-header">
          <h1 className="main-title">Architect Studio</h1>
          <p className="subtitle-description">Describe your multi-agent workflow in natural language to generate a LangGraph solution</p>
        </header>

        {!activeProject ? (
          <div className="empty-state-notice">
            <HelpCircle size={40} className="warning-icon" />
            <h3>No active workspace loaded</h3>
            <p>Go to the registry dashboard to load or create an architecture workspace.</p>
            <button onClick={() => navigate('/dashboard')} className="back-registry-btn">
              Go to Registry
            </button>
          </div>
        ) : (
          <div className="architect-studio-grid">
            {/* Left Prompt Input Panel */}
            <section className="prompt-entry-panel">
              <div className="cyber-glow-card">
                <div className="panel-title-row">
                  <Sparkles size={18} className="panel-title-icon" />
                  <h2>System Requirements Specification</h2>
                </div>

                <form onSubmit={handleStart} className="prompt-form">
                  <div className="prompt-textarea-group">
                    <textarea
                      rows={8}
                      placeholder="Describe your multi-agent idea, for example:
'I want to build a documentation QA system. A search crawler agent fetches web files. An editor agent reads files and extracts summaries. A checker agent validates if answers contain contradictions. A formatting agent returns Markdown outputs.'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isStreaming}
                      required
                    />
                    {prompt.length === 0 && showHelper && (
                      <div className="textarea-help-overlay">
                        <p className="helper-label">Need inspiration?</p>
                        <ul className="helper-list">
                          <li onClick={() => setPrompt("Design a software engineering workflow consisting of: a Systems Analyst agent (systems_analyst) that writes functional specs, a Code Synthesis Engineer agent (code_synthesizer) that translates specs to complete python code, an Automated Test Runner agent (regression_tester) that writes unit tests and runs them, and a Quality Assurance Auditor agent (qa_auditor) that reviews test logs and either passes the build or routes it back to the synthesis engineer with detailed regression notes.")}>
                            Software Engineering Workflow with QA loop
                          </li>
                          <li onClick={() => setPrompt("Design a context-aware RAG pipeline consisting of: a Query Deconstructor agent (query_deconstructor) that transforms complex requests into sub-queries, a Vector DB Retriever node (vector_retriever) that extracts document chunks using Qdrant vector search tools, a Contextual Relevance Router node (relevance_router) that evaluates search results, and a Factual Synthesis Generator agent (synthesis_generator) that compiles a final answer and checks for hallucinations.")}>
                            Dynamic RAG & Verification Pipeline
                          </li>
                          <li onClick={() => setPrompt("Design a financial research team consisting of: a Market Data Ingestion agent (market_data_ingestor) that queries stock history and financial news feeds via Yahoo Finance tools, a Quantitative Analyst agent (quantitative_analyst) that calculates statistical metrics and volatility thresholds, and an Executive Report Writer agent (report_writer) that synthesizes findings into a professional markdown report.")}>
                            Financial Research & Analytics Team
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="form-settings-row">
                    <div className="setting-select-group">
                      <label htmlFor="model-select">Processor Model</label>
                      <select
                        id="model-select"
                        value={targetModel}
                        onChange={(e) => setTargetModel(e.target.value)}
                        disabled={isStreaming}
                      >
                        <option value="llama-3.3-70b-versatile">Llama-3.3 70B (Fast & Coordinated)</option>
                        <option value="llama3-8b-8192">Llama-3 8B (Sub-second execution)</option>
                        <option value="mixtral-8x7b-32768">Mixtral 8x7B (Deep processing)</option>
                      </select>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isStreaming || !prompt.trim()} 
                      className={`submit-architect-btn ${isStreaming ? 'disabled' : ''}`}
                    >
                      <Play size={16} />
                      <span>Compile Graph</span>
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* Right Streaming Status Panel */}
            <section className="streaming-console-panel">
              <div className="cyber-glow-card dark-bg">
                <div className="panel-title-row">
                  <Terminal size={18} className="panel-title-icon" />
                  <h2>Compiler Terminal</h2>
                </div>

                <div className="console-display-box">
                  {streamPhase === 'idle' ? (
                    <div className="console-idle-state">
                      <span className="idle-pulse-dot" />
                      <p className="terminal-log-row">System ready. Awaiting prompt compilation...</p>
                    </div>
                  ) : (
                    <div className="console-active-state">
                      {/* Progress Bar */}
                      <div className="stream-progress-bar-container">
                        <div 
                          className={`progress-fill ${streamPhase === 'error' ? 'error-bg' : ''}`} 
                          style={{ width: `${getProgressPercentage()}%` }} 
                        />
                      </div>
                      
                      {/* Active Phase Badge */}
                      <div className="active-phase-indicator">
                        {isStreaming && <Loader className="spin-icon" size={16} />}
                        <span className={`phase-label ${streamPhase === 'error' ? 'error-text' : ''}`}>
                          Status: {streamMessage}
                        </span>
                      </div>

                      {/* Log Screen */}
                      <div className="console-terminal-screen">
                        {streamLogs.split('\n').map((log, index) => (
                          <div key={index} className="terminal-log-row">
                            <span className="terminal-caret">&gt;</span>
                            <span className="log-text">{log}</span>
                          </div>
                        ))}
                        <div ref={consoleEndRef} />
                      </div>

                      {/* Completion actions */}
                      {streamPhase === 'completed' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="console-success-actions"
                        >
                          <p>LangGraph workflow compilation successful!</p>
                          <button onClick={() => navigate('/workbench')} className="enter-workbench-btn">
                            <span>Open Node Workbench</span>
                            <ArrowRight size={16} />
                          </button>
                        </motion.div>
                      )}

                      {streamPhase === 'error' && (
                        <div className="console-error-actions">
                          <p>Compilation aborted due to error. Please verify API keys or try again.</p>
                          <button onClick={resetStreamState} className="retry-stream-btn">
                            Clear Console
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
export default NewProject;
