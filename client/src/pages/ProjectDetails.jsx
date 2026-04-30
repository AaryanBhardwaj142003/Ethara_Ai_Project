import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Users,
  Calendar,
  AlertTriangle,
  FolderKanban,
  UserPlus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import KanbanBoard from '../components/KanbanBoard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// ─── Create/Edit Task Modal Form ──────────────────────────────────────────────
const TaskForm = ({ projectId, members, taskToEdit, onSuccess, onClose }) => {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState({
    title: taskToEdit?.title || '',
    description: taskToEdit?.description || '',
    assigneeId: taskToEdit?.assignee?.id || '',
    dueDate: taskToEdit?.dueDate
      ? new Date(taskToEdit.dueDate).toISOString().split('T')[0]
      : '',
    status: taskToEdit?.status || 'TODO',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Task title is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        projectId,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      };
      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, payload);
        toast.success('Task updated successfully.');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created successfully.');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Title <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field"
          placeholder="e.g. Design landing page"
        />
      </div>

      <div>
        <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Description
        </label>
        <textarea
          id="task-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field min-h-[80px] resize-y"
          placeholder="Optional task details..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="task-assignee" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Assignee
          </label>
          <select
            id="task-assignee"
            value={form.assigneeId}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            className="input-field"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name} {m.user.id === currentUser?.id ? '(you)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Status
          </label>
          <select
            id="task-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="input-field"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="task-due-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Due Date
        </label>
        <input
          id="task-due-date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="input-field"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {isSubmitting ? <LoadingSpinner size="sm" /> : taskToEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

// ─── Add Member Modal ─────────────────────────────────────────────────────────
const AddMemberForm = ({ projectId, existingMemberIds, onSuccess, onClose }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/auth/users');
        const nonMembers = data.users.filter((u) => !existingMemberIds.includes(u.id));
        setAllUsers(nonMembers);
        if (nonMembers.length > 0) setSelectedUserId(nonMembers[0].id);
      } catch {
        toast.error('Failed to load users.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [existingMemberIds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a user.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/members`, { userId: selectedUserId });
      toast.success('Member added successfully.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner className="py-6" />;

  if (allUsers.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-600 dark:text-slate-400 text-sm">All users are already members of this project.</p>
        <button onClick={onClose} className="btn-secondary mt-4">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="add-member-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Select User
        </label>
        <select
          id="add-member-select"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="input-field"
        >
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email}) — {u.role}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {isSubmitting ? <LoadingSpinner size="sm" /> : 'Add Member'}
        </button>
      </div>
    </form>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProjectDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const fetchProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setTaskModalOpen(true);
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed.');
      fetchProject();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[400px]">
        <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400 mb-3" />
        <p className="text-slate-900 dark:text-slate-300 font-medium">{error || 'Project not found.'}</p>
        <Link to="/projects" className="btn-secondary mt-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
      </div>
    );
  }

  const memberIds = project.members.map((m) => m.userId);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link
            to="/projects"
            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Projects
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
          {project.description && (
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{project.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              project.status === 'ACTIVE'
                ? 'bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {project.status}
            </span>
            <span className="text-slate-500 dark:text-slate-600 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMemberModalOpen(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
            <button
              onClick={() => { setTaskToEdit(null); setTaskModalOpen(true); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card">
        <h2 className="text-slate-900 dark:text-slate-300 text-sm font-semibold flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          Team Members ({project.members.length})
        </h2>
        {project.members.length === 0 ? (
          <EmptyState icon={Users} title="No members yet" description="Add team members to this project." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {project.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-sm group"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-600/30 flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 text-[9px] font-bold">
                    {m.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-slate-900 dark:text-slate-300">{m.user.name}</span>
                <span className="text-slate-500 dark:text-slate-600 text-xs">{m.user.role}</span>
                {isAdmin && m.userId !== project.createdById && (
                  <button
                    onClick={() => handleRemoveMember(m.userId)}
                    className="text-slate-400 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1 opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${m.user.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div>
        <h2 className="text-slate-900 dark:text-slate-300 text-sm font-semibold flex items-center gap-2 mb-4">
          <FolderKanban className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          Task Board ({project.tasks.length} tasks)
        </h2>
        <KanbanBoard
          tasks={project.tasks}
          onEdit={handleEditTask}
          onDelete={() => fetchProject()}
        />
      </div>

      {/* Create/Edit Task Modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setTaskToEdit(null); }}
        title={taskToEdit ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          projectId={id}
          members={project.members}
          taskToEdit={taskToEdit}
          onSuccess={fetchProject}
          onClose={() => { setTaskModalOpen(false); setTaskToEdit(null); }}
        />
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title="Add Team Member"
      >
        <AddMemberForm
          projectId={id}
          existingMemberIds={memberIds}
          onSuccess={fetchProject}
          onClose={() => setMemberModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default ProjectDetails;
