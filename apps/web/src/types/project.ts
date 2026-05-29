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
  model_config_data?: Record<string, unknown>;
  model_config?: Record<string, unknown>;
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
  state_schema: Record<string, unknown>;
  memory_type: 'thread' | 'persistent' | 'hybrid';
}

export interface CostEstimation {
  estimated_monthly_cost_usd: number;
  complexity_score: number;
  branching_factor: number;
  node_count: number;
  recommended_model: string;
  breakdown: Record<string, unknown>;
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
  memory_strategy?: Record<string, unknown>;
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

export interface ProjectContextValue {
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
