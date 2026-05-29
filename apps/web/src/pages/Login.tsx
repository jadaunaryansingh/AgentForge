import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Lock, Mail, User, Eye, EyeOff, Clock } from 'lucide-react';
import { ParticleBackground } from '../components/ui/ParticleBackground';
import { RobotMascot } from '../components/ui/RobotMascot';
import axios from 'axios';

export const Login: React.FC = () => {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Health check & Latency states
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [groqReady, setGroqReady] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Health check polling
  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      const startTime = performance.now();
      try {
        const res = await axios.get('/health');
        if (res.status === 200 && active) {
          const endTime = performance.now();
          setLatency(Math.round(endTime - startTime));
          setBackendStatus('online');
          setGroqReady(Boolean(res.data?.ai?.groq_configured));
        }
      } catch (err) {
        if (active) {
          setLatency(null);
          setBackendStatus('offline');
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Pool every 10s

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Running local clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name');
        await register(email, name, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <ParticleBackground />
      
      <div className="auth-background-effects">
        <div className="orb orb-primary" />
        <div className="orb orb-secondary" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="auth-card"
      >
        <div className="auth-header">
          <div className="auth-logo-glow">
            <Terminal size={32} className="glow-icon" />
          </div>
          <h1 className="auth-title">AgentForge</h1>
          <p className="auth-subtitle">AI Solutions Architect for Multi-Agent Systems</p>
        </div>

        <div className="auth-switcher">
          <button 
            className={`switch-btn ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(null); }}
          >
            Sign In
          </button>
          <button 
            className={`switch-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(null); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="auth-error-banner"
          >
            <Shield size={16} />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="input-group"
                key="name-input"
              >
                <label htmlFor="name-field">Full Name</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    id="name-field"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group">
            <label htmlFor="email-field">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email-field"
                type="email"
                placeholder="developer@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password-field">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password-field"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <span className="spinner" />
            ) : isLogin ? (
              'Access Workbench'
            ) : (
              'Initialize Account'
            )}
          </button>
        </form>
      </motion.div>

      {/* Backend Status Floating Popup */}
      <div className="backend-health-popup">
        <div className="popup-inner">
          <div className="status-indicator-section">
            <span className={`status-orb ${backendStatus}`} />
            <div className="status-meta">
              <span className="status-title">
                {backendStatus === 'checking' && 'Verifying Core Link...'}
                {backendStatus === 'online' && 'Orchestration Online'}
                {backendStatus === 'offline' && 'Core Connection Lost'}
              </span>
              <span className="status-subtitle">
                {backendStatus === 'checking' && 'Pinging local host...'}
                {backendStatus === 'online' && (
                  groqReady
                    ? `Groq ready · ${latency}ms`
                    : `API up but GROQ_API_KEY missing · ${latency}ms`
                )}
                {backendStatus === 'offline' && 'Verify server execution'}
              </span>
            </div>
          </div>
          <div className="clock-section">
            <Clock size={12} className="clock-icon" />
            <span className="time-string">{currentTime}</span>
          </div>
        </div>
      </div>

      <RobotMascot
        mode={isLoading ? 'thinking' : isLogin ? 'idle' : 'happy'}
        message={isLoading ? 'Verifying credentials...' : isLogin ? 'Welcome back, engineer!' : 'Create your account to get started!'}
        position="fixed-br"
      />
    </div>
  );
};
export default Login;
