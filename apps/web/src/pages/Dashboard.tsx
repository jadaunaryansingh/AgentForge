import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, FolderKanban, ArrowRight, Sparkles, Database } from 'lucide-react';
import { ParticleBackground } from '../components/ui/ParticleBackground';

export const Dashboard: React.FC = () => {
  const { projects, createProject, deleteProject, selectProject, isProjectsLoading } = useProjects();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTags, setNewProjTags] = useState('');

  // Calculate statistics
  const totalProjects = projects.length;
  const totalRevisions = projects.reduce((acc, p) => acc + (p.architecture_count || 0), 0);
  const totalTags = Array.from(new Set(projects.flatMap(p => p.tags || []))).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const parsedTags = newProjTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await createProject(newProjName, newProjDesc, parsedTags);
      setNewProjName('');
      setNewProjDesc('');
      setNewProjTags('');
      setShowModal(false);
      
      // Redirect directly to the NewProject page to describe the idea
      navigate('/new-project');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = async (projectId: string) => {
    await selectProject(projectId);
    navigate('/new-project');
  };

  return (
    <div className="dashboard-layout-container">
      <ParticleBackground />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-greeting">
            <h1 className="main-title">Solutions Registry</h1>
            <p className="subtitle-description">Manage and evaluate your multi-agent AI system architectures</p>
          </div>
          <button onClick={() => setShowModal(true)} className="create-proj-action-btn">
            <Plus size={18} />
            <span>New Architecture</span>
          </button>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="stat-card"
          >
            <div className="stat-icon-wrapper secondary">
              <FolderKanban size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{totalProjects}</span>
              <span className="stat-label">Active Workspaces</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <div className="stat-icon-wrapper primary">
              <Sparkles size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{totalRevisions}</span>
              <span className="stat-label">Compiled Graphs</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card"
          >
            <div className="stat-icon-wrapper success">
              <Database size={22} />
            </div>
            <div className="stat-data">
              <span className="stat-value">{totalTags}</span>
              <span className="stat-label">Categories</span>
            </div>
          </motion.div>
        </section>

        {/* Projects List Section */}
        <section className="projects-collection-section">
          {isProjectsLoading ? (
            <div className="loading-spinner-container">
              <span className="orb-loader" />
              <p>Syncing systems...</p>
            </div>
          ) : projects.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-projects-state"
            >
              <div className="empty-graphic">
                <Sparkles size={48} className="spark-glow" />
              </div>
              <h3>No architectures found</h3>
              <p>Initialize a new project to start planning node graphs, costing models, and memory saves.</p>
              <button onClick={() => setShowModal(true)} className="create-empty-action-btn">
                Create First Project
              </button>
            </motion.div>
          ) : (
            <div className="projects-grid">
              {projects.map((proj, idx) => (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="project-card"
                >
                  <div className="project-card-header">
                    <h3 className="project-card-title">{proj.name}</h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Confirm deleting project "${proj.name}"?`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      className="delete-card-action"
                      title="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="project-card-desc">
                    {proj.description || 'No description provided.'}
                  </p>
                  
                  {proj.tags && proj.tags.length > 0 && (
                    <div className="project-tags-row">
                      {proj.tags.map((tag) => (
                        <span key={tag} className="tag-badge">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="project-card-footer">
                    <span className="project-history-count">
                      {proj.architecture_count} Revisions
                    </span>
                    <button 
                      onClick={() => handleSelect(proj.id)}
                      className="load-project-btn"
                    >
                      <span>Design</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Creation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="modal-container"
          >
            <div className="modal-header">
              <h2>New System Architecture</h2>
              <button onClick={() => setShowModal(false)} className="close-modal-btn">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="modal-input-group">
                <label htmlFor="modal-proj-name">Project Title</label>
                <input
                  id="modal-proj-name"
                  type="text"
                  placeholder="e.g. Code Reviewer System"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="modal-input-group">
                <label htmlFor="modal-proj-desc">Purpose Description</label>
                <textarea
                  id="modal-proj-desc"
                  rows={3}
                  placeholder="Describe what these agents will coordinate..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                />
              </div>

              <div className="modal-input-group">
                <label htmlFor="modal-proj-tags">Categories / Tags (comma separated)</label>
                <input
                  id="modal-proj-tags"
                  type="text"
                  placeholder="coding, RAG, custom-apis"
                  value={newProjTags}
                  onChange={(e) => setNewProjTags(e.target.value)}
                />
              </div>

              <div className="modal-form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-modal-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-modal-btn">
                  Create Workspace
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
