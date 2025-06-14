const express = require('express');
const { check, param, query } = require('express-validator');
const {
  createArticleHandler,
  listArticlesHandler,
  getRecentlyViewedHandler,
  getArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
} = require('../controllers/articleController');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// All article routes require authentication
router.use(authenticate);

// POST /articles
router.post(
  '/',
  [
    check('title').notEmpty().withMessage('Title is required'),
    check('content').notEmpty().withMessage('Content is required'),
  ],
  validateRequest,
  createArticleHandler
);

// GET /articles  (list with pagination)
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be >=1').toInt(),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be >=1').toInt(),
  ],
  validateRequest,
  listArticlesHandler
);

// GET /articles/recently-viewed
router.get('/recently-viewed', getRecentlyViewedHandler);

// GET /articles/:id
router.get(
  '/:id',
  [
    param('id').isInt().withMessage('Article ID must be an integer').toInt(),
  ],
  validateRequest,
  getArticleHandler
);

// PUT /articles/:id
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Article ID must be an integer').toInt(),
    check('title').optional().notEmpty().withMessage('Title, if provided, cannot be empty'),
    check('content').optional().notEmpty().withMessage('Content, if provided, cannot be empty'),
  ],
  validateRequest,
  updateArticleHandler
);

// DELETE /articles/:id
router.delete(
  '/:id',
  [
    param('id').isInt().withMessage('Article ID must be an integer').toInt(),
  ],
  validateRequest,
  deleteArticleHandler
);

module.exports = router;
