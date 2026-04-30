const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

/**
 * GET /api/projects
 * ADMIN: all projects. MEMBER: only projects they belong to.
 */
const getAllProjects = async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === 'ADMIN') {
      projects = await prisma.project.findMany({
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: req.user.id } },
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Returns a project with all its tasks and member list.
 * MEMBER must be a member of the project.
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // MEMBER access check
    if (req.user.role === 'MEMBER') {
      const isMember = project.members.some((m) => m.userId === req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: 'You are not a member of this project.' });
      }
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects
 * ADMIN only — creates a new project.
 */
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: req.user.id,
        // Auto-add the creator as a member
        members: {
          create: { userId: req.user.id },
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
    });

    res.status(201).json({ message: 'Project created successfully.', project });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id
 * ADMIN only — update project name, description, or status.
 */
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, status } = req.body;

    // Verify project exists
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    res.json({ message: 'Project updated successfully.', project });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id
 * ADMIN only — deletes project and cascades to tasks.
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects/:id/members
 * ADMIN only — adds a user to the project.
 */
const addMember = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    // Verify project and user both exist
    const [project, user] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Check for existing membership (Prisma will also throw P2002 but this gives a cleaner message)
    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existingMember) {
      return res.status(409).json({ message: 'User is already a member of this project.' });
    }

    const membership = await prisma.projectMember.create({
      data: { projectId, userId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    res.status(201).json({ message: 'Member added successfully.', membership });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id/members/:userId
 * ADMIN only — removes a user from the project.
 */
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!membership) {
      return res.status(404).json({ message: 'User is not a member of this project.' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
