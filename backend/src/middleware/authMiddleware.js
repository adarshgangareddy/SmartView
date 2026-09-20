import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_jwt_secret_change_in_production_12345';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'UNAUTHORIZED', 'Authentication token required.', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'TOKEN_EXPIRED', 'Authentication token has expired. Please log in again.', 401);
    }
    return sendError(res, 'INVALID_TOKEN', 'Invalid authentication token.', 403);
  }
};
