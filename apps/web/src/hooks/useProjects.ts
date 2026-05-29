import { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be wrapped inside ProjectProvider');
  }
  return context;
}
