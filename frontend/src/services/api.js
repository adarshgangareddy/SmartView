import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gate_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration and standard errors
api.interceptors.response.use(
  (response) => {
    // If response follows { success: true, data: { ... } }, unwrap to data
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code;

    // Handle authentication expiration
    if (status === 401 && (errorCode === 'TOKEN_EXPIRED' || errorCode === 'UNAUTHORIZED')) {
      localStorage.removeItem('gate_auth_token');
      localStorage.removeItem('gate_auth_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected network error occurred.';

    return Promise.reject(new Error(message));
  }
);
