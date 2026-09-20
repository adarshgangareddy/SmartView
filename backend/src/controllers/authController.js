import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase, isMockDb, memoryStore } from '../db/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_jwt_secret_change_in_production_12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 'MISSING_CREDENTIALS', 'Email and password are required.', 400);
      }

      let user = null;

      if (isMockDb) {
        user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      } else {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (error) {
          logger.error('Database query error during login:', error.message);
          return sendError(res, 'AUTH_ERROR', 'Authentication service error.', 500);
        }
        user = data;
      }

      if (!user) {
        return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
      }

      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      logger.info(`User logged in successfully: ${user.email}`);

      return sendSuccess(res, {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err) {
      logger.error('Login error:', err.message);
      return sendError(res, 'SERVER_ERROR', 'An unexpected error occurred during login.', 500);
    }
  },

  async logout(req, res) {
    return sendSuccess(res, { message: 'Logged out successfully.' });
  },

  async getMe(req, res) {
    return sendSuccess(res, { user: req.user });
  },
};
