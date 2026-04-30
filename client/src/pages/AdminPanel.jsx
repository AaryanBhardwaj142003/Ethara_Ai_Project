import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  Users,
  Archive,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Search,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

// ─── Create Project Form ──────────────────────────────────────────────────────
const CreateProjectForm = ({ onSuccess, onClose }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Project name is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created successfully.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="project-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Project Name <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          id="project-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-field"
          placeholder="e.g. Website Redesign"
        />
      </div>
      <div>
        <label htmlFor="project-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Description
        </label>
        <textarea
          id="project-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field min-h-[80px] resize-y"
          placeholder="What is this project about?"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {isSubmitting ? <LoadingSpinner size="sm" /> : 'Create Project'}
        </button>
      </div>
    </form>
  );
};

// ─── Projects List (also used on /projects route) ─────────────────────────────
const Projects = ({ isAdminPanel = false }) => {
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'users'
  const { user: currentUser } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projectsRes, usersRes] = await Promise.all([
        api.get('/projects'),
        isAdminPanel ? api.get('/auth/users') : Promise.resolve({ data: { users: [] } }),
      ]);
      setProjects(projectsRes.data.projects);
      setAllUsers(usersRes.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdminPanel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleArchive = async (projectId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    try {
      await api.put(`/projects/${projectId}`, { status: newStatus });
      toast.success(`Project ${newStatus === 'ARCHIVED' ? 'archived' : 'restored'}.`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update project.');
    }
  };

  const handleDelete = async (projectId, projectName) => {
    if (!window.confirm(`Delete "${projectName}"? This will also delete all tasks. This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handlePromote = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}.`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role.');
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAdminPanel ? 'Admin Panel' : 'Projects'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {isAdminPanel
              ? `Manage all projects and users. ${allUsers.length} total users.`
              : `${projects.length} project${projects.length !== 1 ? 's' : ''} accessible to you.`}
          </p>
        </div>
        {isAdminPanel && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'projects' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              Members
            </button>
            {activeTab === 'projects' && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="btn-primary flex items-center gap-2 text-sm ml-4"
              >
                <Plus className="w-4 h-4" /> New Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats row (admin only) */}
      {isAdminPanel && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Projects', value: projects.length, color: 'text-indigo-400' },
            { label: 'Active', value: projects.filter((p) => p.status === 'ACTIVE').length, color: 'text-emerald-400' },
            { label: 'Archived', value: projects.filter((p) => p.status === 'ARCHIVED').length, color: 'text-amber-400' },
            { label: 'Total Users', value: allUsers.length, color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10"
          placeholder={`Search ${activeTab}...`}
          aria-label="Search"
        />
      </div>

      {/* Conditional Rendering based on activeTab */}
      {activeTab === 'projects' || !isAdminPanel ? (
        // Projects Grid
        filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={searchQuery ? 'No projects match your search' : 'No projects found'}
          description={
            searchQuery
              ? 'Try a different search term.'
              : isAdminPanel
              ? 'Create your first project to get started.'
              : 'An admin will assign you to projects.'
          }
          action={
            isAdminPanel && !searchQuery ? (
              <button onClick={() => setCreateModalOpen(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Project
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="card hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    project.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                  }`} />
                  <h3 className="text-slate-900 dark:text-slate-100 font-semibold text-sm truncate">{project.name}</h3>
                </div>
                {isAdminPanel && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleArchive(project.id, project.status)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title={project.status === 'ACTIVE' ? 'Archive project' : 'Restore project'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              {project.description ? (
                <p className="text-slate-600 dark:text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">
                  {project.description}
                </p>
              ) : (
                <p className="text-slate-400 dark:text-slate-700 text-xs italic mb-3 flex-1">No description provided.</p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {project.members?.length ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" />
                    {project._count?.tasks ?? 0} tasks
                  </span>
                </div>
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-medium transition-colors"
                >
                  View Board <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )) : (
        // Users List
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Projects</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 dark:text-indigo-300 font-bold text-xs">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-slate-200 font-medium">{u.name} {u.id === currentUser?.id ? '(You)' : ''}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-600/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u._count?.projectMemberships ?? 0} projects
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handlePromote(u.id, u.role)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                          u.role === 'ADMIN' 
                            ? 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200' 
                            : 'border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 hover:border-indigo-300 dark:hover:border-indigo-500'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'Demote to Member' : 'Promote to Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <EmptyState icon={Users} title="No members found" description="Try a different search query." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Project"
      >
        <CreateProjectForm
          onSuccess={fetchData}
          onClose={() => setCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

// Export as two named pages
export const ProjectsList = () => <Projects isAdminPanel={false} />;
export const AdminPanel = () => <Projects isAdminPanel={true} />;

export default Projects;
