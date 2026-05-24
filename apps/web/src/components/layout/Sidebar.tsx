import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectContext';
import { LayoutDashboard, Compass, GitBranch, LogOut, Terminal, Layers } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { activeProject, activeArchitecture } = useProjects();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      path: '/dashboard',
      enabled: true
    },
    {
      name: 'Prompt Canvas',
      icon: <Compass size={20} />,
      path: '/new-project',
      enabled: true
    },
    {
      name: 'Agent Workbench',
      icon: <GitBranch size={20} />,
      path: '/workbench',
      enabled: !!activeProject,
      tooltip: !activeProject ? 'Create or load a project first' : undefined
    },
    {
      name: 'Architecture Hub',
      icon: <Layers size={20} />,
      path: '/hub',
      enabled: !!activeProject && !!activeArchitecture,
      tooltip: !activeProject ? 'Create or load a project first' : !activeArchitecture ? 'Generate an architecture first' : undefined
    }
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <Terminal className="logo-icon" size={24} />
        <span className="logo-text">AgentForge</span>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => {
            const enabled = item.enabled;
            const active = isActive(item.path);

            return (
              <li key={item.name} title={item.tooltip}>
                <button
                  onClick={() => enabled && navigate(item.path)}
                  disabled={!enabled}
                  className={`nav-btn ${active ? 'active' : ''} ${!enabled ? 'disabled' : ''}`}
                >
                  <span className="btn-icon">{item.icon}</span>
                  <span className="btn-name">{item.name}</span>
                  {active && <span className="active-indicator" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-summary">
          <div className="user-avatar">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} />
            ) : (
              <div className="avatar-placeholder">
                {user?.display_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="online-pulse" />
          </div>
          <div className="user-details">
            <span className="user-name">{user?.display_name}</span>
            <span className="user-role">Developer</span>
          </div>
        </div>

        <button onClick={logout} className="logout-btn">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
