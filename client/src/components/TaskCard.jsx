import { useState } from 'react';
import { Calendar, User, Trash2, Edit3, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const STATUS_BADGE_CLASSES = {
  TODO: 'badge-todo',
  IN_PROGRESS: 'badge-in-progress',
  DONE: 'badge-done',
};

/**
 * TaskCard — displays a single task with status badge, assignee, due date.
 * Supports drag-and-drop for Kanban column transitions.
 * Admin can edit/delete; Members can update status of their own tasks.
 */
const TaskCard = ({ task, onStatusChange, onDelete, onEdit, isDragging }) => {
  const { isAdmin, user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  const canEditStatus = isAdmin || task.assignee?.id === user?.id;

  const handleStatusCycle = async () => {
    if (!canEditStatus || isUpdating) return;

    const statusOrder = ['TODO', 'IN_PROGRESS', 'DONE'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    setIsUpdating(true);
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: nextStatus });
      onStatusChange(task.id, nextStatus);
      toast.success(`Task moved to ${STATUS_LABELS[nextStatus]}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      onDelete(task.id);
      toast.success('Task deleted.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task.');
    }
  };

  // Format date nicely
  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      draggable={canEditStatus}
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.setData('currentStatus', task.status);
      }}
      className={`bg-white dark:bg-slate-800/80 border rounded-xl p-4 cursor-grab active:cursor-grabbing
                  hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group select-none
                  ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
                  ${isOverdue ? 'border-red-300 dark:border-red-500/30' : 'border-slate-200 dark:border-slate-700/60'}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={STATUS_BADGE_CLASSES[task.status]}>
            {STATUS_LABELS[task.status]}
          </span>
          {isOverdue && (
            <span className="badge-overdue flex items-center gap-1">
              <Clock className="w-3 h-3" /> Overdue
            </span>
          )}
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isAdmin && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Edit task"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-snug mb-1">{task.title}</h4>

      {/* Description */}
      {task.description && (
        <p className="text-slate-600 dark:text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/40">
        {/* Assignee */}
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-500 text-xs">
          {task.assignee ? (
            <>
              <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-300 text-[9px] font-bold">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="truncate max-w-[80px]">{task.assignee.name}</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span>Unassigned</span>
            </>
          )}
        </div>

        {/* Due date */}
        {formattedDate && (
          <div
            className={`flex items-center gap-1 text-xs ${
              isOverdue ? 'text-red-400' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Status cycle button for non-drag interactions */}
      {canEditStatus && task.status !== 'DONE' && (
        <button
          onClick={handleStatusCycle}
          disabled={isUpdating}
          className="mt-3 w-full text-xs text-slate-600 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50
                     py-1.5 rounded-lg transition-colors disabled:opacity-50 border border-transparent
                     hover:border-slate-200 dark:hover:border-slate-700"
        >
          {isUpdating ? 'Updating...' : `→ Move to ${STATUS_LABELS[task.status === 'TODO' ? 'IN_PROGRESS' : 'DONE']}`}
        </button>
      )}
    </div>
  );
};

export default TaskCard;
