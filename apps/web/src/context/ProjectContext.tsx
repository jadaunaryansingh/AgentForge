import { createContext } from 'react';
import type { ProjectContextValue } from '../types/project';

/** Stable React context instance. */
export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

/** Barrel file — types and hooks for project state. */
export type {
  Project,
  NodeDefinition,
  EdgeDefinition,
  GraphDefinition,
  CostEstimation,
  InfraRecommendation,
  Architecture,
  StreamPhase,
  ProjectContextValue,
} from '../types/project';

export { ProjectProvider } from './ProjectProvider';
