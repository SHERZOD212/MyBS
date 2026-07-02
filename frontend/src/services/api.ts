import axios from 'axios';

const BACKEND_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: `${BACKEND_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: add token to headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle unauthorized requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Force refresh or redirect to auth page
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { BACKEND_BASE };
