// src/models/articleModel.js
const db = require('../../config/db');

/**
 * Create a new article.
 * @param {number} userId
 * @param {string} title
 * @param {string} content
 * @returns {Promise<Object>} inserted row: { id, user_id, title, content, created_at, updated_at }
 */
async function createArticle(userId, title, content) {
  const text = `
    INSERT INTO articles (user_id, title, content)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, title, content, created_at, updated_at
  `;
  const values = [userId, title, content];
  const res = await db.query(text, values);
  return res.rows[0];
}

/**
 * Fetch an article by id.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function getArticleById(id) {
  const text = 'SELECT * FROM articles WHERE id = $1';
  const res = await db.query(text, [id]);
  return res.rows[0] || null;
}

/**
 * List articles for a user with pagination.
 * @param {number} userId
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<{ items: Array, total: number }>}
 */
async function getArticlesByUser(userId, limit, offset) {
  // Fetch items
  const itemsRes = await db.query(
    'SELECT * FROM articles WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  // Fetch total count
  const countRes = await db.query(
    'SELECT COUNT(*) FROM articles WHERE user_id = $1',
    [userId]
  );
  const total = parseInt(countRes.rows[0].count, 10);
  return { items: itemsRes.rows, total };
}

/**
 * Update an article by id.
 * @param {number} id
 * @param {{ title?: string, content?: string }} fields
 * @returns {Promise<Object|null>}
 */
async function updateArticle(id, fields) {
  // Build dynamic SET clause
  const setClauses = [];
  const values = [];
  let idx = 1;
  if (fields.title !== undefined) {
    setClauses.push(`title = $${idx++}`);
    values.push(fields.title);
  }
  if (fields.content !== undefined) {
    setClauses.push(`content = $${idx++}`);
    values.push(fields.content);
  }
  if (setClauses.length === 0) {
    // Nothing to update; return existing row
    return getArticleById(id);
  }
  // Always update updated_at
  setClauses.push(`updated_at = NOW()`);
  const setClause = setClauses.join(', ');
  // The id parameter is next
  const text = `
    UPDATE articles
    SET ${setClause}
    WHERE id = $${idx}
    RETURNING id, user_id, title, content, created_at, updated_at
  `;
  values.push(id);
  const res = await db.query(text, values);
  return res.rows[0] || null;
}

/**
 * Delete an article by id.
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteArticle(id) {
  await db.query('DELETE FROM articles WHERE id = $1', [id]);
}

module.exports = {
  createArticle,
  getArticleById,
  getArticlesByUser,
  updateArticle,
  deleteArticle,
};
