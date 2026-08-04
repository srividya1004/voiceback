/**
 * VoiceBack Modular Authentication & Session Service
 * Client-side validation, localStorage persistence, and protected session management.
 * Pre-architected for Spring Boot + JWT REST API replacement.
 */

const STORAGE_KEYS = {
  PATIENTS: 'voiceback_registered_users',
  DOCTORS: 'voiceback_registered_doctors',
  CAREGIVERS: 'voiceback_registered_caregivers',
  ACTIVE_SESSION: 'voiceback_auth_session',
  CURRENT_PATIENT: 'voiceback_current_user',
  CURRENT_DOCTOR: 'voiceback_doctor_user',
  CURRENT_CAREGIVER: 'voiceback_caregiver_user',
};

export const authService = {
  // Register Patient
  registerPatient: (patientData) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
      const updated = [...existing.filter(u => u.email.toLowerCase() !== patientData.email.toLowerCase()), patientData];
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.CURRENT_PATIENT, JSON.stringify(patientData));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Registration storage failed.' };
    }
  },

  // Login Patient
  loginPatient: (email, password) => {
    try {
      const registered = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
      const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_PATIENT) || 'null');
      
      const found = registered.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) ||
                    (currentUser && currentUser.email?.toLowerCase() === email.trim().toLowerCase() ? currentUser : null);

      if (!found) {
        return { success: false, error: 'No account found. Please register first.' };
      }

      if (found.password && found.password !== password) {
        return { success: false, error: 'Incorrect password.' };
      }

      // Create Session
      const session = { role: 'patient', email: found.email, user: found, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.CURRENT_PATIENT, JSON.stringify(found));
      return { success: true, user: found };
    } catch (e) {
      return { success: false, error: 'Login error occurred.' };
    }
  },

  // Register Doctor
  registerDoctor: (doctorData) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCTORS) || '[]');
      const updated = [...existing.filter(d => d.email.toLowerCase() !== doctorData.email.toLowerCase()), doctorData];
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.CURRENT_DOCTOR, JSON.stringify(doctorData));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Doctor registration failed.' };
    }
  },

  // Login Doctor (STRICT VALIDATION)
  loginDoctor: (email, password) => {
    try {
      const registered = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCTORS) || '[]');
      const found = registered.find(d => d.email.toLowerCase() === email.trim().toLowerCase());

      if (!found) {
        return {
          success: false,
          error: 'No doctor account found. Please create a doctor account first.',
        };
      }

      if (found.password !== password) {
        return { success: false, error: 'Incorrect password.' };
      }

      // Create Session
      const session = { role: 'doctor', email: found.email, user: found, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.CURRENT_DOCTOR, JSON.stringify(found));
      return { success: true, user: found };
    } catch (e) {
      return { success: false, error: 'Doctor login error occurred.' };
    }
  },

  // Register Caregiver
  registerCaregiver: (caregiverData) => {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.CAREGIVERS) || '[]');
      const updated = [...existing.filter(c => c.email.toLowerCase() !== caregiverData.email.toLowerCase()), caregiverData];
      localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.CURRENT_CAREGIVER, JSON.stringify(caregiverData));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Caregiver registration failed.' };
    }
  },

  // Login Caregiver (STRICT VALIDATION)
  loginCaregiver: (email, password) => {
    try {
      const registered = JSON.parse(localStorage.getItem(STORAGE_KEYS.CAREGIVERS) || '[]');
      const found = registered.find(c => c.email.toLowerCase() === email.trim().toLowerCase());

      if (!found) {
        return {
          success: false,
          error: 'No caregiver account found. Please create an account first.',
        };
      }

      if (found.password !== password) {
        return { success: false, error: 'Incorrect password.' };
      }

      // Create Session
      const session = { role: 'caregiver', email: found.email, user: found, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.CURRENT_CAREGIVER, JSON.stringify(found));
      return { success: true, user: found };
    } catch (e) {
      return { success: false, error: 'Caregiver login error occurred.' };
    }
  },

  // Get active session
  getActiveSession: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || 'null');
    } catch (e) {
      return null;
    }
  },

  // Check if role is authenticated
  isAuthenticated: (requiredRole) => {
    const session = authService.getActiveSession();
    if (!session || !session.role) return false;
    if (requiredRole && session.role !== requiredRole) return false;
    return true;
  },

  // Logout cleanly
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } catch (e) {
      // ignore
    }
  },
};

export default authService;
