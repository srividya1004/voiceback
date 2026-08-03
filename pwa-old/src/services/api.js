/**
 * API Service Client Wrapper for VoiceBack Express Backend
 * Configured via environment variable VITE_API_BASE_URL
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('vb_auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      const serverMessage = data.message || data.error || 'Request failed';
      const errObj = new Error(serverMessage);
      errObj.status = response.status;
      errObj.data = data;
      throw errObj;
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};
