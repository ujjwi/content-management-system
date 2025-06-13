/**
 * Global error-handling middleware.
 * Expects errors thrown in controllers/services to have .status property optionally.
 * Responds with JSON: { error: message }.
 */
function errorHandler(err, req, res, next) {
  console.error(err); // for debugging; in production use a logger
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
