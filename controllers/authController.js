const { register, login } = require('../services/authService');

/**
 * Handler for POST /auth/register
 * Expects req.body: { email, password }
 * On success: responds 201 with { user: { id, email } }
 * On error: throws or passes error to error middleware
 */
async function registerHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await register({ email, password });
    return res.status(201).json({ user });
  } catch (err) {
    // err.status may be set in service (e.g., 400 if email aleady exists)
    next(err);
  }
}

/**
 * Handler for POST /auth/login
 * Expects req.body: { email, password }
 * On success: responds 200 with { token }
 * On invalid credentials: service throws with status 401
 */
async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await login({ email, password });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerHandler,
  loginHandler,
};
