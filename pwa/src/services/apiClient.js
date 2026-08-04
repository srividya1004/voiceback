import axios from 'axios';

/**
 * VoiceBack Centralized Axios HTTP Client
 * Configured with VITE_API_URL, default headers, and JWT Bearer authorization interceptors.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if session exists
apiClient.interceptors.request.use(
  (config) => {
    try {
      const rawSession = localStorage.getItem('voiceback_auth_session');
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session && session.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        'Network error. Please ensure the backend server is running.',
      errors: error.response?.data?.errors || null,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
