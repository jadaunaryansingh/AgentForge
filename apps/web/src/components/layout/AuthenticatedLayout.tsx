import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProjectProvider } from '../../context/ProjectProvider';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/** Shell for all authenticated routes — keeps ProjectProvider stable across navigations. */
export const AuthenticatedLayout: React.FC = () => (
  <ProjectProvider>
    <div className="app-main-layout">
      <Sidebar />
      <div className="app-body-content">
        <TopBar />
        <div className="page-viewport-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  </ProjectProvider>
);

export default AuthenticatedLayout;
