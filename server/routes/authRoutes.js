const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe, getAllUsers, updateUserRole } = require('../controllers/authController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
];

const loginValidation = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', authenticateJWT, getMe);
router.get('/users', authenticateJWT, authorizeRole(['ADMIN']), getAllUsers);
router.patch('/users/:id/role', authenticateJWT, authorizeRole(['ADMIN']), updateUserRole);

module.exports = router;
