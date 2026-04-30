const express = require('express');
const { body } = require('express-validator');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All project routes require authentication
router.use(authenticateJWT);

// Validation rules
const createProjectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required.').isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

const updateProjectValidation = [
  body('name').optional().trim().notEmpty().isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('status').optional().isIn(['ACTIVE', 'ARCHIVED']).withMessage('Invalid status.'),
];

// Routes
router.get('/', getAllProjects);
router.post('/', authorizeRole(['ADMIN']), createProjectValidation, createProject);
router.get('/:id', getProjectById);
router.put('/:id', authorizeRole(['ADMIN']), updateProjectValidation, updateProject);
router.delete('/:id', authorizeRole(['ADMIN']), deleteProject);

// Member management
router.post('/:id/members', authorizeRole(['ADMIN']), addMember);
router.delete('/:id/members/:userId', authorizeRole(['ADMIN']), removeMember);

module.exports = router;
