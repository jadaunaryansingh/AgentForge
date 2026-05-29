import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { ProjectContext } from './ProjectContext';
import { apiUrl, getAuthHeaders, getAuthToken } from '../lib/api';
import { normalizeArchitecture, normalizeGraphDefinition } from '../lib/graphUtils';
import { parseSseBlock } from '../lib/sse';
import type {
  Project,
  Architecture,
  StreamPhase,
} from '../types/project';

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeArchitecture, setActiveArchitecture] = useState<Architecture | null>(null);
  const [architectureHistory, setArchitectureHistory] = useState<Architecture[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);

  const [streamPhase, setStreamPhase] = useState<StreamPhase>('idle');
  const [streamLogs, setStreamLogs] = useState<string>('');
  const [streamMessage, setStreamMessage] = useState<string>('');

  const fetchProjects = useCallback(async () => {
    setIsProjectsLoading(true);
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data.projects);
    } catch (err) {
      console.error('Failed to fetch projects list:', err);
    } finally {
      setIsProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    } else {
      setProjects([]);
      setActiveProject(null);
      setActiveArchitecture(null);
      setArchitectureHistory([]);
    }
  }, [isAuthenticated, fetchProjects]);

  const createProject = async (name: string, description?: string, tags?: string[]) => {
    const res = await axios.post('/api/projects', { name, description, tags });
    const newProj = res.data;
    setProjects((prev) => [newProj, ...prev]);
    setActiveProject(newProj);
    setActiveArchitecture(null);
    setArchitectureHistory([]);
    return newProj;
  };

  const selectProject = async (projectId: string) => {
    const projRes = await axios.get(`/api/projects/${projectId}`);
    setActiveProject(projRes.data);

    try {
      const histRes = await axios.get(`/api/architect/history/${projectId}`);
      const history = (histRes.data as Architecture[]).map(normalizeArchitecture);
      setArchitectureHistory(history);
      setActiveArchitecture(history.length > 0 ? history[0] : null);
    } catch {
      setArchitectureHistory([]);
      setActiveArchitecture(null);
    }
  };

  const deleteProject = async (projectId: string) => {
    await axios.delete(`/api/projects/${projectId}`);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProject?.id === projectId) {
      setActiveProject(null);
      setActiveArchitecture(null);
      setArchitectureHistory([]);
    }
  };

  const selectArchitectureVersion = (versionNum: number) => {
    const arch = architectureHistory.find((a) => a.version === versionNum);
    if (arch) setActiveArchitecture(arch);
  };

  const resetStreamState = () => {
    setStreamPhase('idle');
    setStreamLogs('');
    setStreamMessage('');
  };

  const startArchitectureGeneration = async (
    prompt: string,
    targetModel: string = 'llama-3.3-70b-versatile'
  ) => {
    if (!activeProject) {
      throw new Error('No active project loaded to run architect generator');
    }

    const authToken = token || getAuthToken();
    if (!authToken) {
      toast.error('You must be signed in to generate architectures.');
      throw new Error('Missing authentication token');
    }

    setStreamPhase('extracting');
    setStreamLogs('[AgentForge] Starting AI Solutions Architect stream...\n');
    setStreamMessage('Requesting systems analyst review...');

    try {
      const response = await fetch(apiUrl('/api/architect/stream'), {
        method: 'POST',
        headers: getAuthHeaders(authToken),
        body: JSON.stringify({
          project_id: activeProject.id,
          prompt: prompt.trim(),
          target_model: targetModel,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        let detail = `Server error (${response.status})`;
        try {
          const parsed = JSON.parse(errBody);
          detail = parsed.detail || parsed.error || detail;
        } catch {
          if (errBody) detail = errBody;
        }
        throw new Error(detail);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error('Failed to read from server response stream');

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const parsed = parseSseBlock(block);
          if (!parsed) continue;

          const { event: eventName, data: dataStr } = parsed;

          if (eventName === 'error') {
            const errObj = JSON.parse(dataStr);
            setStreamPhase('error');
            setStreamMessage('Generation encountered an error');
            setStreamLogs((prev) => prev + `[ERROR] ${errObj.error}\n`);
            toast.error(errObj.error || 'Architecture generation failed');
            return;
          }

          if (eventName !== 'phase') continue;

          const payload = JSON.parse(dataStr);
          const phase = payload.phase;

          if (phase === 'started') {
            const modeLabel =
              payload.ai_mode === 'live'
                ? 'Live Groq'
                : payload.ai_mode === 'demo'
                  ? 'Demo mode'
                  : 'Not configured';
            setStreamLogs((prev) => prev + `[System] ${modeLabel} · model: ${payload.model || targetModel}\n`);
          } else if (phase === 'extracting') {
            setStreamPhase('extracting');
            setStreamMessage(payload.message);
            setStreamLogs((prev) => prev + `[Ingesting] ${payload.message}\n`);
          } else if (phase === 'extracted') {
            const requirementsData = payload.requirements;
            setStreamLogs(
              (prev) =>
                prev +
                `[Ingested] ${requirementsData.project_name} · ${requirementsData.domain} · ${requirementsData.complexity}\n`
            );
          } else if (phase === 'planning') {
            setStreamPhase('planning');
            setStreamMessage(payload.message);
            setStreamLogs((prev) => prev + `[Planner] ${payload.message}\n`);
          } else if (phase === 'planned') {
            const graphData = normalizeGraphDefinition(payload.graph);
            if (graphData) {
              setStreamLogs(
                (prev) =>
                  prev +
                  `[Planner] ${graphData.pattern_name} · ${graphData.nodes.length} nodes · entry: ${graphData.entry_point}\n`
              );
            }
          } else if (phase === 'codegen') {
            setStreamPhase('codegen');
            setStreamMessage(payload.message);
            setStreamLogs((prev) => prev + `[Codegen] ${payload.message}\n`);
          } else if (phase === 'code_generated') {
            const codeData = payload.code as string;
            setStreamLogs(
              (prev) =>
                prev + `[Codegen] Python LangGraph compilation complete (${codeData.split('\n').length} lines).\n`
            );
          } else if (phase === 'visualizing') {
            setStreamPhase('visualizing');
            setStreamMessage(payload.message);
            setStreamLogs((prev) => prev + `[Visualization] ${payload.message}\n`);
          } else if (phase === 'visualized') {
            setStreamLogs((prev) => prev + `[Visualization] Flowchart rendered.\n`);
          } else if (phase === 'saving') {
            setStreamPhase('saving');
            setStreamMessage(payload.message);
            setStreamLogs((prev) => prev + `[Database] Saving revision to PostgreSQL...\n`);
          } else if (phase === 'completed') {
            setStreamPhase('completed');
            setStreamMessage('Architecture generated successfully!');
            setStreamLogs(
              (prev) =>
                prev +
                `[Completed] Saved architecture ${payload.architecture_id} (revision v${payload.version}).\n`
            );
            toast.success(`Revision v${payload.version} saved`);
            fetchProjects();
            await selectProject(activeProject.id);
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Architecture generation failed';
      setStreamPhase('error');
      setStreamMessage('Stream execution interrupted');
      setStreamLogs((prev) => prev + `[CRITICAL ERROR] ${message}\n`);
      toast.error(message);
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
