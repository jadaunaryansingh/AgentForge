import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewProject } from './pages/NewProject';
import { Workbench } from './pages/Workbench';
import { ArchitectureHub } from './pages/ArchitectureHub';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Toaster } from 'react-hot-toast';

// Helper route protector
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="global-loader-container">
        <span className="glow-loading-orb" />
        <p>Loading AgentForge...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Layout wrapper to conditional show Sidebar/Topbar only on protected pages
const AppLayout: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <ProjectProvider>
        <div className="app-main-layout">
          <Sidebar />
          <div className="app-body-content">
            <TopBar />
            <div className="page-viewport-scroll">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/new-project" element={<NewProject />} />
                <Route path="/workbench" element={<Workbench />} />
                <Route path="/hub" element={<ArchitectureHub />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </ProjectProvider>
    </ProtectedRoute>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(15, 10, 25, 0.9)',
              border: '1px solid rgba(129, 140, 248, 0.25)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              fontSize: '13px',
              borderRadius: '6px',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)',
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
};
export default App;
