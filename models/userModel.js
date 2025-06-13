// src/models/userModel.js
const db = require('../../config/db'); 
// Adjust path: config/db.js is at project root/config/db.js, so from src/models, require('../../config/db').

 /**
  * Insert a new user.
  * @param {string} email
  * @param {string} passwordHash
  * @returns {Promise<Object>} inserted row: { id, email, recent_views, created_at }
  */
async function createUser(email, passwordHash) {
  const text = `
    INSERT INTO users (email, password_hash)
    VALUES ($1, $2)
    RETURNING id, email, recent_views, created_at
  `;
  const values = [email, passwordHash];
  const res = await db.query(text, values);
  return res.rows[0];
}

/**
 * Fetch a user by email.
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
async function getUserByEmail(email) {
  const text = 'SELECT * FROM users WHERE email = $1';
  const res = await db.query(text, [email]);
  return res.rows[0] || null;
}

/**
 * Fetch a user by id.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function getUserById(id) {
  const text = 'SELECT * FROM users WHERE id = $1';
  const res = await db.query(text, [id]);
  return res.rows[0] || null;
}

/**
 * Update the recent_views JSONB array for a user.
 * @param {number} userId
 * @param {Array<number>} recentArray
 * @returns {Promise<Object>} returning updated recent_views
 */
async function updateRecentViews(userId, recentArray) {
  const text = `
    UPDATE users
    SET recent_views = $1::jsonb
    WHERE id = $2
    RETURNING recent_views
  `;
  const values = [JSON.stringify(recentArray), userId];
  const res = await db.query(text, values);
  return res.rows[0];
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  updateRecentViews,
};
