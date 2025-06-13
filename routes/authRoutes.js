const express = require('express');
const { check } = require('express-validator');
const { registerHandler, loginHandler } = require('../controllers/authController');
const { validateRequest } = require('../middlewares/validateMiddleware');

const router = express.Router();

/**
 * POST /auth/register
 * Body: { email: string, password: string }
 */
router.post(
  '/register',
  [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  registerHandler
);

/**
 * POST /auth/login
 * Body: { email: string, password: string }
 */
router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  loginHandler
);

module.exports = router;
