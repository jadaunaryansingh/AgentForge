import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

export interface Project {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  architecture_count: number;
}

export interface NodeDefinition {
  id: string;
  name: string;
  type: 'agent' | 'tool' | 'router' | 'memory' | 'input' | 'output';
  description: string;
  model_config_data?: Record<string, any>;
  system_prompt?: string;
  tools?: string[];
}

export interface EdgeDefinition {
  source: string;
  target: string;
  condition?: string;
  label?: string;
}

export interface GraphDefinition {
  pattern_name?: string;
  description?: string;
  nodes: NodeDefinition[];
  edges: EdgeDefinition[];
  entry_point: string;
  state_schema: Record<string, any>;
  memory_type: 'thread' | 'persistent' | 'hybrid';
}

export interface CostEstimation {
  estimated_monthly_cost_usd: number;
  complexity_score: number;
  branching_factor: number;
  node_count: number;
  recommended_model: string;
  breakdown: Record<string, any>;
}

export interface InfraRecommendation {
  deployment_platform: string;
  container_strategy: string;
  database_tier: string;
  caching_strategy: string;
  scaling_approach: string;
  estimated_infra_cost_usd: number;
}

export interface Architecture {
  id: string;
  project_id: string;
  version: number;
  prompt: string;
  graph_definition?: GraphDefinition;
  memory_strategy?: Record<string, any>;
  infrastructure_recommendations?: InfraRecommendation;
  cost_estimation?: CostEstimation;
  diagram_mermaid?: string;
  generated_code?: string;
  created_at: string;
}

export type StreamPhase = 
  | 'idle'
  | 'extracting'
  | 'planning'
  | 'codegen'
  | 'visualizing'
  | 'saving'
  | 'completed'
  | 'error';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  activeArchitecture: Architecture | null;
  architectureHistory: Architecture[];
  isProjectsLoading: boolean;
  streamPhase: StreamPhase;
  streamLogs: string;
  streamMessage: string;
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  createProject: (name: string, description?: string, tags?: string[]) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  selectArchitectureVersion: (versionNum: number) => void;
  startArchitectureGeneration: (prompt: string, targetModel?: string) => Promise<void>;
  resetStreamState: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeArchitecture, setActiveArchitecture] = useState<Architecture | null>(null);
  const [architectureHistory, setArchitectureHistory] = useState<Architecture[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);

  // SSE Stream state
  const [streamPhase, setStreamPhase] = useState<StreamPhase>('idle');
  const [streamLogs, setStreamLogs] = useState<string>('');
  const [streamMessage, setStreamMessage] = useState<string>('');

  // Fetch projects when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
      setActiveArchitecture(null);
      setArchitectureHistory([]);
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data.projects);
    } catch (err) {
      console.error("Failed to fetch projects list:", err);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const createProject = async (name: string, description?: string, tags?: string[]) => {
    try {
      const res = await axios.post('/api/projects', { name, description, tags });
      const newProj = res.data;
      setProjects(prev => [newProj, ...prev]);
      setActiveProject(newProj);
      setActiveArchitecture(null);
      setArchitectureHistory([]);
      return newProj;
    } catch (err) {
      console.error("Failed to create project:", err);
      throw err;
    }
  };

  const selectProject = async (projectId: string) => {
    try {
      const projRes = await axios.get(`/api/projects/${projectId}`);
      setActiveProject(projRes.data);

      try {
        const histRes = await axios.get(`/api/architect/history/${projectId}`);
        setArchitectureHistory(histRes.data);
        if (histRes.data.length > 0) {
          // Select latest revision
          setActiveArchitecture(histRes.data[0]);
        } else {
          setActiveArchitecture(null);
        }
      } catch (histErr) {
        // Project might have no configurations yet
        setArchitectureHistory([]);
        setActiveArchitecture(null);
      }
    } catch (err) {
      console.error("Failed to retrieve project details:", err);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await axios.delete(`/api/projects/${projectId}`);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (activeProject?.id === projectId) {
        setActiveProject(null);
        setActiveArchitecture(null);
        setArchitectureHistory([]);
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      throw err;
    }
  };

  const selectArchitectureVersion = (versionNum: number) => {
    const arch = architectureHistory.find(a => a.version === versionNum);
    if (arch) {
      setActiveArchitecture(arch);
    }
  };

  const resetStreamState = () => {
    setStreamPhase('idle');
    setStreamLogs('');
    setStreamMessage('');
  };

  const startArchitectureGeneration = async (prompt: string, targetModel: string = 'llama-3.3-70b-versatile') => {
    if (!activeProject) {
      throw new Error('No active project loaded to run architect generator');
    }

    setStreamPhase('extracting');
    setStreamLogs('[AgentForge] Starting AI Solutions Architect stream...\n');
    setStreamMessage('Requesting systems analyst review...');

    // Live intermediate assembly cache
    let requirementsData: any = null;
    let graphData: any = null;
    let codeData: any = null;

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/api/architect/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: activeProject.id,
          prompt: prompt,
          target_model: targetModel
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error status code: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) {
        throw new Error('Failed to read from server response stream');
      }

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        // Retain remaining incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse SSE fields
          const sseEventMatch = line.match(/^event:\s*(\w+)/m);
          const sseDataMatch = line.match(/^data:\s*(.+)$/m);
          
          if (!sseDataMatch) continue;

          const eventName = sseEventMatch ? sseEventMatch[1] : 'message';
          const dataStr = sseDataMatch[1];

          if (eventName === 'error') {
            const errObj = JSON.parse(dataStr);
            setStreamPhase('error');
            setStreamMessage('Generation encountered an error');
            setStreamLogs(prev => prev + `[ERROR] ${errObj.error}\n`);
            return;
          }

          if (eventName === 'phase') {
            const payload = JSON.parse(dataStr);
            const phase = payload.phase;

            if (phase === 'extracting') {
              setStreamPhase('extracting');
              setStreamMessage(payload.message);
              setStreamLogs(prev => prev + `[Ingesting] ${payload.message}\n`);
            } 
            else if (phase === 'extracted') {
              requirementsData = payload.requirements;
              setStreamLogs(prev => prev + `[Ingested] Requirements Extracted: ${requirementsData.project_name} (${requirementsData.domain})\n`);
            } 
            else if (phase === 'planning') {
              setStreamPhase('planning');
              setStreamMessage(payload.message);
              setStreamLogs(prev => prev + `[Planner] ${payload.message}\n`);
            } 
            else if (phase === 'planned') {
              graphData = payload.graph;
              setStreamLogs(prev => prev + `[Planner] Planned multi-agent topology: ${graphData.pattern_name} with ${graphData.nodes?.length} nodes.\n`);
            } 
            else if (phase === 'codegen') {
              setStreamPhase('codegen');
              setStreamMessage(payload.message);
              setStreamLogs(prev => prev + `[Codegen] ${payload.message}\n`);
            } 
            else if (phase === 'code_generated') {
              codeData = payload.code;
              setStreamLogs(prev => prev + `[Codegen] Python LangGraph compilation complete. (${codeData.split('\n').length} lines of code)\n`);
            } 
            else if (phase === 'visualizing') {
              setStreamPhase('visualizing');
              setStreamMessage(payload.message);
              setStreamLogs(prev => prev + `[Visualization] ${payload.message}\n`);
            } 
            else if (phase === 'visualized') {
              setStreamLogs(prev => prev + `[Visualization] Flowchart drawing rendered.\n`);
            } 
            else if (phase === 'saving') {
              setStreamPhase('saving');
              setStreamMessage(payload.message);
              setStreamLogs(prev => prev + `[Database] Saving revision details to PostgreSQL...\n`);
            } 
            else if (phase === 'completed') {
              setStreamPhase('completed');
              setStreamMessage('Architecture generated successfully!');
              setStreamLogs(prev => prev + `[Completed] Architecture saved with ID ${payload.architecture_id} (Revision v${payload.version}).\n`);
              
              // Refetch projects to update architecture count and history
              fetchProjects();
              await selectProject(activeProject.id);
            }
          }
        }
      }
    } catch (err: any) {
      setStreamPhase('error');
      setStreamMessage('Stream execution interrupted');
      setStreamLogs(prev => prev + `[CRITICAL ERROR] Failed during SSE run: ${err.message}\n`);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        activeArchitecture,
        architectureHistory,
        isProjectsLoading,
        streamPhase,
        streamLogs,
        streamMessage,
        fetchProjects,
        selectProject,
        createProject,
        deleteProject,
        selectArchitectureVersion,
        startArchitectureGeneration,
        resetStreamState,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be wrapped inside ProjectProvider');
  }
  return context;
};
