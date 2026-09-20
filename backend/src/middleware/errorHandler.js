import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled request error at ${req.method} ${req.url}:`, err.stack || err.message);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SERVER_ERROR';

  return sendError(res, code, message, statusCode);
};

export const notFoundHandler = (req, res) => {
  return sendError(res, 'NOT_FOUND', `Endpoint not found: ${req.method} ${req.originalUrl}`, 404);
};
