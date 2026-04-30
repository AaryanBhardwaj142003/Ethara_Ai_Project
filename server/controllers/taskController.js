const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * GET /api/tasks/metrics
 * Returns dashboard-level metrics for the current user.
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const now = new Date();

    if (isAdmin) {
      // Admin sees global metrics
      const [totalProjects, pendingTasks, completedTasks, overdueTasks, recentTasks] = await Promise.all([
        prisma.project.count({ where: { status: 'ACTIVE' } }),
        prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } }),
        prisma.task.count({ where: { status: 'DONE' } }),
        prisma.task.count({
          where: {
            status: { in: ['TODO', 'IN_PROGRESS'] },
            dueDate: { lt: now },
          },
        }),
        prisma.task.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
        }),
      ]);

      return res.json({ totalProjects, pendingTasks, completedTasks, overdueTasks, recentTasks });
    } else {
      // Member sees their own metrics
      const [myProjects, myPendingTasks, myCompletedTasks, myOverdueTasks, myTasks] = await Promise.all([
        prisma.project.count({
          where: { members: { some: { userId } }, status: 'ACTIVE' },
        }),
        prisma.task.count({
          where: { assigneeId: userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
        }),
        prisma.task.count({
          where: { assigneeId: userId, status: 'DONE' },
        }),
        prisma.task.count({
          where: {
            assigneeId: userId,
            status: { in: ['TODO', 'IN_PROGRESS'] },
            dueDate: { lt: now },
          },
        }),
        prisma.task.findMany({
          where: { assigneeId: userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
        }),
      ]);

      return res.json({
        totalProjects: myProjects,
        pendingTasks: myPendingTasks,
        completedTasks: myCompletedTasks,
        overdueTasks: myOverdueTasks,
        recentTasks: myTasks,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/my
 * Returns all tasks assigned to the current user.
 */
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks
 * ADMIN only — creates a new task in a project.
 */
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { title, description, projectId, assigneeId, dueDate, status } = req.body;

    // Verify the project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // If assigneeId provided, verify the user exists and is a project member
    if (assigneeId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!membership) {
        return res.status(400).json({
          message: 'Assignee must be a member of the project.',
        });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        createdById: req.user.id,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'TODO',
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: 'Task created successfully.', task });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tasks/:id
 * ADMIN only — full update of a task.
 */
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, assigneeId, dueDate, status, projectId } = req.body;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // If changing assignee, verify new assignee is a project member
    if (assigneeId) {
      const pid = projectId || existingTask.projectId;
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: pid, userId: assigneeId } },
      });
      if (!membership) {
        return res.status(400).json({ message: 'Assignee must be a member of the project.' });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status && { status }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.json({ message: 'Task updated successfully.', task });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tasks/:id/status
 * Authenticated users — updates task status.
 * MEMBER: can only update tasks assigned to them.
 * ADMIN: can update any task.
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
      });
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // MEMBER can only update their own tasks
    if (req.user.role === 'MEMBER' && existingTask.assigneeId !== req.user.id) {
      return res.status(403).json({
        message: 'You can only update the status of tasks assigned to you.',
      });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    res.json({ message: 'Task status updated.', task });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id
 * ADMIN only — removes a task.
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await prisma.task.delete({ where: { id } });

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getMyTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
