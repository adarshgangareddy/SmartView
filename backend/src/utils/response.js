/**
 * Standardized API Response Utilities
 * As required by Specification Section 31:
 * Success: { "success": true, "data": {} }
 * Error:   { "success": false, "error": { "code": "...", "message": "..." } }
 */

export const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendError = (res, code, message, statusCode = 400, details = null) => {
  const errorObj = {
    code,
    message,
  };

  if (details && process.env.NODE_ENV !== 'production') {
    errorObj.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorObj,
  });
};
