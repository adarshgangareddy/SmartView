import { sendError } from '../utils/response.js';

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return sendError(res, 'VALIDATION_ERROR', `Invalid request data: ${issues}`, 400, result.error.format());
  }
  req.validatedBody = result.data;
  next();
};

export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return sendError(res, 'INVALID_PARAMETERS', `Invalid URL parameters: ${issues}`, 400);
  }
  req.validatedParams = result.data;
  next();
};
