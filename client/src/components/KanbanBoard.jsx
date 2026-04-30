import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, ClipboardList } from 'lucide-react';
import TaskCard from './TaskCard';
import EmptyState from './EmptyState';
import api from '../api/axios';
import toast from 'react-hot-toast';

const COLUMNS = [
  {
    id: 'TODO',
    label: 'To Do',
    icon: Circle,
    headerClass: 'text-slate-500 dark:text-slate-400',
    dotClass: 'bg-slate-400 dark:bg-slate-500',
    dropZoneClass: 'border-slate-200 dark:border-slate-700/50',
    dropActiveClass: 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/5',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    icon: Loader2,
    headerClass: 'text-indigo-600 dark:text-indigo-400',
    dotClass: 'bg-indigo-500',
    dropZoneClass: 'border-slate-200 dark:border-slate-700/50',
    dropActiveClass: 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/5',
  },
  {
    id: 'DONE',
    label: 'Done',
    icon: CheckCircle2,
    headerClass: 'text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
    dropZoneClass: 'border-slate-200 dark:border-slate-700/50',
    dropActiveClass: 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/5',
  },
];

/**
 * KanbanBoard — renders tasks in three columns with HTML5 drag-and-drop.
 * Optimistic UI updates on drag; reverts on error.
 */
const KanbanBoard = ({ tasks: initialTasks, onEdit, onDelete }) => {
  const [tasks, setTasks] = useState(initialTasks);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  // Keep local tasks in sync when parent re-fetches
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const getColumnTasks = (columnId) =>
    tasks.filter((t) => t.status === columnId);

  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = useCallback(async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggingTaskId(null);

    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('currentStatus');

    if (!taskId || currentStatus === targetStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: targetStatus });
      toast.success(`Task moved to ${COLUMNS.find((c) => c.id === targetStatus)?.label}`);
    } catch (error) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t))
      );
      toast.error(error.response?.data?.message || 'Failed to move task.');
    }
  }, []);

  const handleStatusChange = useCallback((taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }, []);

  const handleDeleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (onDelete) onDelete(taskId);
  }, [onDelete]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
      {COLUMNS.map((column) => {
        const columnTasks = getColumnTasks(column.id);
        const isDropTarget = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col rounded-xl border-2 border-dashed transition-all duration-200
                        ${isDropTarget ? column.dropActiveClass : column.dropZoneClass}
                        min-h-[400px] p-3`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${column.dotClass}`} />
                <h3 className={`text-sm font-semibold ${column.headerClass}`}>
                  {column.label}
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-3 flex-1">
              {columnTasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title={`No ${column.label} tasks`}
                  description="Drag tasks here or create a new one."
                />
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      handleDragStart(e, task.id);
                      e.dataTransfer.setData('taskId', task.id);
                      e.dataTransfer.setData('currentStatus', task.status);
                    }}
                    onDragEnd={handleDragEnd}
                  >
                    <TaskCard
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteTask}
                      onEdit={onEdit}
                      isDragging={draggingTaskId === task.id}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
