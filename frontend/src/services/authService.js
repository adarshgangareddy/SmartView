import { api } from './api.js';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.success && response.data?.token) {
      localStorage.setItem('gate_auth_token', response.data.token);
      localStorage.setItem('gate_auth_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('gate_auth_token');
      localStorage.removeItem('gate_auth_user');
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data?.user;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('gate_auth_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('gate_auth_token'));
  },
};
