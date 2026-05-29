import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewProject } from './pages/NewProject';
import { Workbench } from './pages/Workbench';
import { ArchitectureHub } from './pages/ArchitectureHub';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { Toaster } from 'react-hot-toast';

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const ProtectedRoute: React.FC = () => {
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

  return <Outlet />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router future={routerFutureFlags}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/new-project" element={<NewProject />} />
              <Route path="/workbench" element={<Workbench />} />
              <Route path="/hub" element={<ArchitectureHub />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              border: '1.5px solid rgba(99, 102, 241, 0.2)',
              color: '#0f172a',
              backdropFilter: 'blur(10px)',
              fontSize: '13px',
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
};

export default App;
