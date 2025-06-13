const {
  createArticle,
  getArticleById,
  getArticlesByUser,
  updateArticle,
  deleteArticle,
} = require('../models/articleModel');
const { getUserById, updateRecentViews } = require('../models/userModel');

/**
 * Create a new article for the given user.
 * @param {number} userId
 * @param {{ title: string, content: string }} data
 * @returns {Promise<Object>} the created article
 */
async function createNewArticle(userId, { title, content }) {
  return createArticle(userId, title, content);
}

/**
 * Get article detail, ensuring the user is owner, and update recently viewed.
 * @param {number} userId
 * @param {number} articleId
 * @returns {Promise<Object>} the article row
 * @throws Error with .status property if not found or forbidden
 */
async function getArticleDetail(userId, articleId) {
  const article = await getArticleById(articleId);
  if (!article) {
    const err = new Error('Article not found');
    err.status = 404;
    throw err;
  }
  // Ownership check: only owner can view/manage
  if (article.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  // Update recently viewed
  await handleRecentlyViewed(userId, articleId);
  return article;
}

/**
 * List articles for a user with pagination.
 * @param {number} userId
 * @param {{ page?: number|string, limit?: number|string }} opts
 * @returns {Promise<{ items: Array, meta: { total: number, page: number, limit: number, totalPages: number } }>}
 */
async function listArticles(userId, { page = 1, limit = 10 }) {
  const pg = parseInt(page, 10) || 1;
  const lim = parseInt(limit, 10) || 10;
  const offset = (pg - 1) * lim;
  const { items, total } = await getArticlesByUser(userId, lim, offset);
  return {
    items,
    meta: {
      total,
      page: pg,
      limit: lim,
      totalPages: Math.ceil(total / lim),
    },
  };
}

/**
 * Update an existing article if owner.
 * @param {number} userId
 * @param {number} articleId
 * @param {{ title?: string, content?: string }} data
 * @returns {Promise<Object>} updated article
 * @throws Error with .status property if not found or forbidden
 */
async function updateExistingArticle(userId, articleId, data) {
  const article = await getArticleById(articleId);
  if (!article) {
    const err = new Error('Article not found');
    err.status = 404;
    throw err;
  }
  if (article.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return updateArticle(articleId, data);
}

/**
 * Delete an existing article if owner.
 * @param {number} userId
 * @param {number} articleId
 * @returns {Promise<void>}
 * @throws Error with .status property if not found or forbidden
 */
async function deleteExistingArticle(userId, articleId) {
  const article = await getArticleById(articleId);
  if (!article) {
    const err = new Error('Article not found');
    err.status = 404;
    throw err;
  }
  if (article.user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  await deleteArticle(articleId);
}

/**
 * Get the list of recently viewed articles for a user, in order.
 * @param {number} userId
 * @returns {Promise<Array>} array of article rows
 * @throws Error with .status if user not found
 */
async function getRecentlyViewedList(userId) {
  const user = await getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const arr = Array.isArray(user.recent_views) ? user.recent_views : [];
  if (arr.length === 0) {
    return [];
  }
  // Fetch each article in order; filter out missing or not owned? 
  // Here, since only owner can view, we might still fetch but then filter ownership
  const articles = [];
  for (const id of arr) {
    const art = await getArticleById(id);
    if (art && art.user_id === userId) {
      articles.push(art);
    }
    // If art is null or not owned, skip
  }
  return articles;
}

/**
 * Helper: update the recent_views JSONB array for the user:
 * - Fetch current array
 * - Remove the articleId if present
 * - Prepend to front
 * - Trim to limit from env (RECENT_VIEW_LIMIT)
 * - Save back via updateRecentViews
 * @param {number} userId
 * @param {number} articleId
 */
async function handleRecentlyViewed(userId, articleId) {
  const user = await getUserById(userId);
  if (!user) {
    // If user not found, skip silently or throw? Here skip.
    return;
  }
  let arr = Array.isArray(user.recent_views) ? user.recent_views : [];
  // Remove existing occurrence
  arr = arr.filter((id) => id !== articleId);
  // Prepend
  arr.unshift(articleId);
  // Trim to limit
  const limit = parseInt(process.env.RECENT_VIEW_LIMIT, 10) || 10;
  if (arr.length > limit) {
    arr = arr.slice(0, limit);
  }
  // Update in DB
  await updateRecentViews(userId, arr);
}

module.exports = {
  createNewArticle,
  getArticleDetail,
  listArticles,
  updateExistingArticle,
  deleteExistingArticle,
  getRecentlyViewedList,
};
