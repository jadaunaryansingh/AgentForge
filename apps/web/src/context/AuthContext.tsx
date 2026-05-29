import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBase } from '../lib/api';
import { isLocalAppToken } from '../lib/jwt';

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  syncNeonToken: (jwtToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Empty base uses Vite dev proxy (/api -> localhost:8000). Set VITE_API_URL for production.
axios.defaults.baseURL = getApiBase();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('agentforge_token');
      if (storedToken) {
        // Drop legacy Neon/browser tokens before hitting the API (prevents 401 noise)
        if (!isLocalAppToken(storedToken)) {
          localStorage.removeItem('agentforge_token');
        } else {
          try {
            setToken(storedToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            const res = await axios.get('/api/auth/me');
            setUser(res.data);
          } catch {
            localStorage.removeItem('agentforge_token');
            delete axios.defaults.headers.common['Authorization'];
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { access_token, user: userData } = res.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('agentforge_token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (err: any) {
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      localStorage.removeItem('agentforge_token');
      throw new Error(err.response?.data?.detail || 'Login authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, displayName: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { 
        email, 
        display_name: displayName, 
        password 
      });
      const { access_token, user: userData } = res.data;

      setToken(access_token);
      setUser(userData);
      localStorage.setItem('agentforge_token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (err: any) {
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      localStorage.removeItem('agentforge_token');
      throw new Error(err.response?.data?.detail || 'Registration account setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('agentforge_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const syncNeonToken = async (jwtToken: string) => {
    setIsLoading(true);
    try {
      setToken(jwtToken);
      localStorage.setItem('agentforge_token', jwtToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      
      const res = await axios.post('/api/auth/sync');
      setUser(res.data);
    } catch (err: any) {
      console.error("Neon Auth token synchronization failed:", err);
      logout();
      throw new Error(err.response?.data?.detail || 'Neon authentication sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        syncNeonToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be wrapped inside AuthProvider');
  }
  return context;
};
