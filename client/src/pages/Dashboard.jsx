import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const STATUS_BADGE = {
  TODO: 'badge-todo',
  IN_PROGRESS: 'badge-in-progress',
  DONE: 'badge-done',
};
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

const MetricCard = ({ icon: Icon, label, value, color, sublabel }) => (
  <div className="card flex items-center gap-4 animate-slide-up">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-slate-900 dark:text-white text-2xl font-bold">{value ?? '—'}</p>
      {sublabel && <p className="text-slate-400 dark:text-slate-500 text-xs">{sublabel}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [metricsRes, projectsRes, tasksRes] = await Promise.all([
          api.get('/tasks/metrics'),
          api.get('/projects'),
          api.get('/tasks/my'),
        ]);
        setMetrics(metricsRes.data);
        setProjects(projectsRes.data.projects.slice(0, 5));
        setMyTasks(tasksRes.data.tasks.slice(0, 8));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
          <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400 mx-auto mb-3" />
          <p className="text-slate-900 dark:text-slate-300 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          {isAdmin ? "Here's what's happening across all projects." : "Here's your work summary."}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={FolderKanban}
          label="Active Projects"
          value={metrics?.totalProjects}
          color="bg-indigo-600/20 text-indigo-400"
          sublabel={isAdmin ? 'Total in system' : 'You are a member of'}
        />
        <MetricCard
          icon={Clock}
          label="Pending Tasks"
          value={metrics?.pendingTasks}
          color="bg-amber-600/20 text-amber-400"
          sublabel="To Do + In Progress"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed Tasks"
          value={metrics?.completedTasks}
          color="bg-emerald-600/20 text-emerald-400"
          sublabel="Done"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Overdue Tasks"
          value={metrics?.overdueTasks}
          color={
            metrics?.overdueTasks > 0
              ? 'bg-red-600/20 text-red-400'
              : 'bg-emerald-600/20 text-emerald-400'
          }
          sublabel={metrics?.overdueTasks === 0 ? 'All on track!' : 'Past due date'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-slate-900 dark:text-slate-100 font-semibold text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              My Tasks
            </h2>
            <Link
              to="/projects"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No tasks assigned"
              description="You're all caught up! Tasks assigned to you will appear here."
            />
          ) : (
            <div className="space-y-2">
              {myTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== 'DONE';
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={STATUS_BADGE[task.status]}>
                        {STATUS_LABEL[task.status]}
                      </span>
                      <span className="text-slate-900 dark:text-slate-200 text-sm font-medium truncate">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {isOverdue && (
                        <span className="badge-overdue text-xs">Overdue</span>
                      )}
                      {task.project && (
                        <Link
                          to={`/projects/${task.project.id}`}
                          className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs transition-colors"
                        >
                          {task.project.name}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-slate-900 dark:text-slate-100 font-semibold text-base flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              {isAdmin ? 'Recent Projects' : 'My Projects'}
            </h2>
            <Link
              to="/projects"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description={
                isAdmin
                  ? 'Create your first project from the Admin Panel.'
                  : 'An admin will assign you to projects.'
              }
            />
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60
                             hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span className="text-slate-900 dark:text-slate-200 text-sm font-medium truncate">
                      {project.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-slate-500 text-xs">
                      {project._count?.tasks ?? 0} tasks
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export default Dashboard;
