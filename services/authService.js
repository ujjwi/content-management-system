const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail } = require('../models/userModel');

/**
 * Register a new user.
 * @param {{ email: string, password: string }} param0
 * @returns {Promise<{ id: number, email: string }>}
 * @throws Error with .status property on validation failure
 */
async function register({ email, password }) {
  // Check if user already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 400;
    throw err;
  }
  // Hash password
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  // Create user
  const user = await createUser(email, hash);
  // Return minimal user info
  return { id: user.id, email: user.email };
}

/**
 * Login existing user.
 * @param {{ email: string, password: string }} param0
 * @returns {Promise<{ token: string }>}
 * @throws Error with .status property on invalid credentials
 */
async function login({ email, password }) {
  const user = await getUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  // Compare password
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  // Sign JWT
  const payload = { userId: user.id };
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  const token = jwt.sign(payload, secret, { expiresIn });
  return { token };
}

module.exports = {
  register,
  login,
};
