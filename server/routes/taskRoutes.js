const express = require('express');
const { body } = require('express-validator');
const {
  getDashboardMetrics,
  getMyTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(authenticateJWT);

// Validation rules
const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required.').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('projectId').notEmpty().withMessage('projectId is required.'),
  body('assigneeId').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid ISO 8601 date.'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Invalid status.'),
];

const updateTaskValidation = [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid ISO 8601 date.'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE'])
    .withMessage('Invalid status.'),
];

// Routes
router.get('/metrics', getDashboardMetrics);
router.get('/my', getMyTasks);
router.post('/', authorizeRole(['ADMIN']), createTaskValidation, createTask);
router.put('/:id', authorizeRole(['ADMIN']), updateTaskValidation, updateTask);
router.patch('/:id/status', updateTaskStatus); // Both roles, controller enforces ownership for MEMBERs
router.delete('/:id', authorizeRole(['ADMIN']), deleteTask);

module.exports = router;
