import { apiRequest } from './api';

/**
 * Extracts and formats real backend server errors into clean, human-readable user messages
 */
export const formatAuthError = (error, t) => {
  const message = error?.message || error?.error || '';
  const status = error?.status;

  // Network & Disconnect Errors
  if (!navigator.onLine) {
    return { message: t('errNoInternet'), field: null };
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('connect')) {
    return { message: t('errUnableToConnect'), field: null };
  }

  // Duplicate Email Error
  if (message.includes('already exists') || message.includes('duplicate') || (status === 400 && message.toLowerCase().includes('email'))) {
    return { message: t('errEmailAlreadyExists'), field: 'email' };
  }

  // Email Not Found
  if (message.includes('not found') || status === 404) {
    return { message: t('errUserNotFound'), field: 'email' };
  }

  // Incorrect Password / Invalid Credentials
  if (message.includes('Invalid') || message.toLowerCase().includes('password') || status === 401) {
    return { message: t('errIncorrectPassword'), field: 'password' };
  }

  // Password Too Short
  if (message.includes('at least 8 characters')) {
    return { message: t('errPasswordTooShort'), field: 'password' };
  }

  // Role Mismatch
  if (message.includes('role')) {
    return { message: t('errRoleMismatch'), field: null };
  }

  // Return real backend message if present, otherwise default to unable to connect
  return { message: message || t('errUnableToConnect'), field: null };
};

/**
 * Authenticate user with Email & Password
 * Endpoint: POST /api/user-logins/login
 */
export const loginUser = async (email, password) => {
  const response = await apiRequest('/user-logins/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return response.data; // Returns { token, user }
};

/**
 * Create a new UserLogin record
 * Endpoint: POST /api/user-logins
 */
export const registerUser = async ({ email, passwordHash, role }) => {
  return await apiRequest('/user-logins', {
    method: 'POST',
    body: JSON.stringify({ email, passwordHash, role }),
  });
};

/**
 * Create a new Patient Clinical Profile
 * Endpoint: POST /api/patients
 */
export const registerPatientProfile = async ({ userId, fullName, age, aphasiaType }) => {
  return await apiRequest('/patients', {
    method: 'POST',
    body: JSON.stringify({ userId, fullName, age: Number(age), aphasiaType }),
  });
};

/**
 * Create a new Doctor Clinical Record
 * Endpoint: POST /api/doctors
 */
export const registerDoctorProfile = async ({ userId, fullName, specialization, hospital, contactNumber }) => {
  return await apiRequest('/doctors', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      fullName,
      specialization: specialization || 'Neurology',
      hospitalAffiliation: hospital || 'VoiceBack Clinical Center',
      licenseNumber: `LIC-${Math.floor(1000 + Math.random() * 9000)}`,
      email: undefined,
      phone: contactNumber || undefined,
    }),
  });
};

/**
 * Create a new Caregiver Contact Record
 * Endpoint: POST /api/caregivers
 */
export const registerCaregiverProfile = async ({ userId, fullName, relationship, contactNumber }) => {
  return await apiRequest('/caregivers', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      fullName,
      relationshipToPatient: relationship || 'Family',
      phone: contactNumber || '+15550000000',
    }),
  });
};
