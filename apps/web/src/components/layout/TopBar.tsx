import React from 'react';
import { useProjects } from '../../hooks/useProjects';
import { Layers, FolderKanban, History } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { activeProject, activeArchitecture, architectureHistory, selectArchitectureVersion } = useProjects();

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        {activeProject ? (
          <div className="active-context-badge">
            <FolderKanban className="badge-icon" size={16} />
            <span className="project-label">Project:</span>
            <span className="project-name">{activeProject.name}</span>
          </div>
        ) : (
          <div className="no-context-badge">
            <span className="no-project-label">Select a project to begin architecting</span>
          </div>
        )}

        {activeProject && activeArchitecture && (
          <div className="active-version-badge">
            <Layers className="badge-icon" size={16} />
            <span className="version-label">Revision:</span>
            <span className="version-tag">v{activeArchitecture.version}</span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        {activeProject && architectureHistory.length > 1 && (
          <div className="revision-picker-container">
            <History size={16} className="picker-icon" />
            <span className="picker-label">Restore:</span>
            <select
              value={activeArchitecture?.version || ''}
              onChange={(e) => selectArchitectureVersion(Number(e.target.value))}
              className="revision-select"
            >
              {architectureHistory.map((arch) => (
                <option key={arch.id} value={arch.version}>
                  Revision v{arch.version} ({new Date(arch.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </header>
  );
};
export default TopBar;
