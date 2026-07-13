import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = require('js-cookie').default.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optionally, interceptors can be added here if we need to manually attach a Bearer token
// But since we are leaning towards HttpOnly cookies (more secure), withCredentials: true handles it.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors, e.g., redirect to login on 401
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
