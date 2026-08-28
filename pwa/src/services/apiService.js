/**
 * VoiceBack API Service Abstraction Layer
 * 
 * Pre-architected to seamlessly connect the React PWA frontend to the Node.js Express REST API.
 * Backend Base URL is parameterized via VITE_API_BASE_URL (defaults to http://localhost:5000/api).
 * 
 * Provides structured data models and async fetch wrappers for:
 * - Auth & User Logins (/api/user-logins)
 * - Patient Demographics & Profiles (/api/patients)
 * - Doctor & Caregiver Clinical Links (/api/doctors, /api/caregivers)
 * - Therapy Progress Tracking (/api/therapy-progress)
 * - Communication Logs (/api/communication-history)
 * - EMG Telemetry Profiles (/api/emg-profiles)
 * - Voice Synthesis Profiles (/api/voice-profiles)
 * - System Health Metrics (/api/health)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Generic HTTP client wrapper with authorization header injection
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('voiceback_jwt_token');
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

    if (!response.ok) {
      const error = new Error(data.message || `HTTP error! Status: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If backend is unreachable or offline, throw structured error for component fallback
    console.warn(`API Service Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const apiService = {
  /**
   * Health Check Endpoint
   * GET /api/health
   */
  async checkHealth() {
    return request('/health');
  },

  /**
   * User Authentication
   * POST /api/user-logins/login
   */
  async login(email, password) {
    return request('/user-logins/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * User Registration
   * POST /api/user-logins
   */
  async registerUser(userData) {
    return request('/user-logins', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Patient Clinical Profile Endpoints
   * GET /api/patients, GET /api/patients/:id, POST /api/patients, PUT /api/patients/:id
   */
  async getPatientProfile(patientId) {
    return request(`/patients/${patientId}`);
  },

  async updatePatientProfile(patientId, profileData) {
    return request(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  async createPatientProfile(patientData) {
    return request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  },

  /**
   * Therapy Progress Endpoints
   * GET /api/therapy-progress, POST /api/therapy-progress
   */
  async getTherapyProgress(patientId) {
    return request(`/therapy-progress${patientId ? `?patientId=${patientId}` : ''}`);
  },

  async recordTherapySession(sessionData) {
    return request('/therapy-progress', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  /**
   * Communication History Endpoints
   * GET /api/communication-history, POST /api/communication-history
   */
  async getCommunicationHistory(patientId) {
    return request(`/communication-history${patientId ? `?patientId=${patientId}` : ''}`);
  },

  async logCommunicationAttempt(logData) {
    return request('/communication-history', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  },

  /**
   * EMG Profile Endpoints
   * GET /api/emg-profiles/:id
   */
  async getEMGProfile(patientId) {
    return request(`/emg-profiles${patientId ? `?patientId=${patientId}` : ''}`);
  },

  /**
   * Voice Profile Endpoints
   * GET /api/voice-profiles/:id
   */
  async getVoiceProfile(patientId) {
    return request(`/voice-profiles${patientId ? `?patientId=${patientId}` : ''}`);
  },
};

export default apiService;
