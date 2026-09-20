import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests from this IP, please try again after 15 minutes.', 429);
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Limit login attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'AUTH_RATE_LIMIT', 'Too many login attempts, please try again after 15 minutes.', 429);
  },
});

export const commandLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 commands per minute to prevent motor spam
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'COMMAND_RATE_LIMIT', 'Too many gate commands issued in a short period. Please wait before retrying.', 429);
  },
});
