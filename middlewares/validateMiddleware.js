const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results.
 * If there are errors, responds with 400 and error details.
 * Otherwise calls next().
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { validateRequest };
