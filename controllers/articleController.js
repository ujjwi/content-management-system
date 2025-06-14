const {
  createNewArticle,
  getArticleDetail,
  listArticles,
  updateExistingArticle,
  deleteExistingArticle,
  getRecentlyViewedList,
} = require('../services/articleService');

/**
 * POST /articles
 * Body: { title, content }
 */
async function createArticleHandler(req, res, next) {
  try {
    const data = req.body;
    const article = await createNewArticle(req.user.id, data);
    return res.status(201).json({ article });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /articles
 * Query: ?page=1&limit=10
 */
async function listArticlesHandler(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await listArticles(req.user.id, { page, limit });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /articles/recently-viewed
 */
async function getRecentlyViewedHandler(req, res, next) {
  try {
    const articles = await getRecentlyViewedList(req.user.id);
    return res.json({ articles });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /articles/:id
 */
async function getArticleHandler(req, res, next) {
  try {
    const articleId = parseInt(req.params.id, 10);
    const article = await getArticleDetail(req.user.id, articleId);
    return res.json({ article });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /articles/:id
 * Body: { title?, content? }
 */
async function updateArticleHandler(req, res, next) {
  try {
    const articleId = parseInt(req.params.id, 10);
    const data = req.body;
    const article = await updateExistingArticle(req.user.id, articleId, data);
    return res.json({ article });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /articles/:id
 */
async function deleteArticleHandler(req, res, next) {
  try {
    const articleId = parseInt(req.params.id, 10);
    await deleteExistingArticle(req.user.id, articleId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createArticleHandler,
  listArticlesHandler,
  getRecentlyViewedHandler,
  getArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
};
