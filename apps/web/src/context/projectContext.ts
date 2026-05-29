import { createContext } from 'react';
import type { ProjectContextValue } from '../types/project';

/** Stable context instance (separate file avoids Vite HMR breaking provider consumers). */
export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);
