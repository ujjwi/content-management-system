const jwt = require('jsonwebtoken');
const { getUserById } = require('../models/userModel');

/**
 * Middleware to authenticate requests using JWT.
 * Expects Authorization header: "Bearer <token>".
 * On success: attaches req.user = { id, email } and calls next().
 * On failure: responds 401 Unauthorized.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not set');
    }
    const payload = jwt.verify(token, secret);
    const userId = payload.userId;
    // Fetch user to ensure it still exists
    const user = await getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: user not found' });
    }
    // Attach minimal user info to request
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

module.exports = { authenticate };
