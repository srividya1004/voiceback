/**
 * VoiceBack Modular Authentication & Session Service
 * Role-Based Access Control (RBAC), client-side validation, localStorage persistence.
 * Pre-architected for Spring Boot + JWT REST API replacement.
 */

const STORAGE_KEYS = {
  PATIENT_ACCOUNT: 'voiceback_patient_account',
  DOCTOR_ACCOUNT: 'voiceback_doctor_account',
  CAREGIVER_ACCOUNT: 'voiceback_caregiver_account',
  ACTIVE_SESSION: 'voiceback_auth_session',
  CURRENT_USER_OBJECT: 'currentUser',
  CURRENT_PATIENT: 'voiceback_current_user',
  CURRENT_DOCTOR: 'voiceback_doctor_user',
  CURRENT_CAREGIVER: 'voiceback_caregiver_user',
  PATIENT_INTRO_COMPLETED: 'voiceback_patient_intro_completed',
  PATIENT_REGISTERED: 'voiceback_patient_registered',
  // Legacy aliases
  PATIENTS_LEGACY: 'voiceback_registered_users',
  DOCTORS_LEGACY: 'voiceback_registered_doctors',
  CAREGIVERS_LEGACY: 'voiceback_registered_caregivers',
};

export const authService = {
  // Check Patient Intro status
  isPatientIntroCompleted: () => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.PATIENT_INTRO_COMPLETED) === 'true' ||
        localStorage.getItem('patientIntroductionSeen') === 'true'
      );
    } catch (e) {
      return false;
    }
  },

  setPatientIntroCompleted: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENT_INTRO_COMPLETED, 'true');
      localStorage.setItem('patientIntroductionSeen', 'true');
    } catch (e) {
      // ignore
    }
  },

  // Check Patient Registered status
  isPatientRegistered: () => {
    try {
      const flag = localStorage.getItem(STORAGE_KEYS.PATIENT_REGISTERED) === 'true';
      if (flag) return true;
      const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENT_ACCOUNT) || '[]');
      const legacy = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS_LEGACY) || '[]');
      return (Array.isArray(accounts) && accounts.length > 0) || (Array.isArray(legacy) && legacy.length > 0);
    } catch (e) {
      return false;
    }
  },

  setPatientRegistered: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENT_REGISTERED, 'true');
      localStorage.setItem(STORAGE_KEYS.PATIENT_INTRO_COMPLETED, 'true');
    } catch (e) {
      // ignore
    }
  },

  // Helper to fetch list of accounts for a role
  getAccountsByRole: (roleKey, legacyKey) => {
    try {
      const primary = JSON.parse(localStorage.getItem(roleKey) || '[]');
      const legacy = JSON.parse(localStorage.getItem(legacyKey) || '[]');
      const list = [
        ...(Array.isArray(primary) ? primary : [primary]),
        ...(Array.isArray(legacy) ? legacy : [legacy])
      ].filter(Boolean);
      return list;
    } catch (e) {
      return [];
    }
  },

  // Register Patient
  registerPatient: (patientData) => {
    try {
      const normalizedEmail = (patientData.email || '').trim().toLowerCase();
      const existing = authService.getAccountsByRole(STORAGE_KEYS.PATIENT_ACCOUNT, STORAGE_KEYS.PATIENTS_LEGACY);

      const newRecord = {
        fullName: (patientData.fullName || '').trim(),
        email: normalizedEmail,
        password: patientData.password || '',
        role: 'patient',
        registrationStatus: 'registered',
        age: patientData.age || '',
        gender: patientData.gender || '',
        mobileNumber: patientData.mobileNumber || '',
        aphasiaType: patientData.aphasiaType || '',
        preferredLanguage: patientData.preferredLanguage || 'english',
        emergencyContact: patientData.emergencyContact || '',
      };

      const updated = [...existing.filter(u => (u.email || '').trim().toLowerCase() !== normalizedEmail), newRecord];
      localStorage.setItem(STORAGE_KEYS.PATIENT_ACCOUNT, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.PATIENTS_LEGACY, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.CURRENT_PATIENT, JSON.stringify(newRecord));

      authService.setPatientRegistered();

      return { success: true, user: newRecord };
    } catch (e) {
      return { success: false, error: 'Registration storage failed.' };
    }
  },

  // Login Patient
  loginPatient: (email, password) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const existing = authService.getAccountsByRole(STORAGE_KEYS.PATIENT_ACCOUNT, STORAGE_KEYS.PATIENTS_LEGACY);
      const currentPatient = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_PATIENT) || 'null');

      const allAccounts = [
        ...existing,
        ...(currentPatient ? [currentPatient] : [])
      ].filter(Boolean);

      const found = allAccounts.find(u => (u.email || '').trim().toLowerCase() === normalizedEmail);

      // Step 1: Check whether account exists
      if (!found) {
        return { success: false, error: 'No account found. Please register first.' };
      }

      // Step 2: Validate password
      if (!password || found.password !== password) {
        return { success: false, error: 'Incorrect email or password.' };
      }

      // Step 3: Create Active Session & currentUser object (RBAC format)
      const currentUser = {
        role: 'patient',
        email: found.email,
        name: found.fullName || 'Patient',
        isAuthenticated: true,
        user: found,
        timestamp: Date.now(),
      };

      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_OBJECT, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.CURRENT_PATIENT, JSON.stringify(found));
      authService.setPatientRegistered();

      return { success: true, user: found };
    } catch (e) {
      return { success: false, error: 'Login error occurred.' };
    }
  },

  // Register Doctor
  registerDoctor: (doctorData) => {
    try {
      const normalizedEmail = (doctorData.email || '').trim().toLowerCase();
      const existing = authService.getAccountsByRole(STORAGE_KEYS.DOCTOR_ACCOUNT, STORAGE_KEYS.DOCTORS_LEGACY);

      const newRecord = {
        fullName: (doctorData.fullName || '').trim(),
        email: normalizedEmail,
        password: doctorData.password || '',
        role: 'doctor',
        registrationStatus: 'registered',
        doctorId: doctorData.doctorId || `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
        specialization: doctorData.specialization || 'Neurologist',
        hospital: doctorData.hospital || 'AIIMS Clinical Rehabilitation Center',
        mobileNumber: doctorData.mobileNumber || '',
      };

      const updated = [...existing.filter(d => (d.email || '').trim().toLowerCase() !== normalizedEmail), newRecord];
      localStorage.setItem(STORAGE_KEYS.DOCTOR_ACCOUNT, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.DOCTORS_LEGACY, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.CURRENT_DOCTOR, JSON.stringify(newRecord));

      return { success: true, user: newRecord };
    } catch (e) {
      return { success: false, error: 'Doctor registration failed.' };
    }
  },

  // Login Doctor
  loginDoctor: (email, password) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const existing = authService.getAccountsByRole(STORAGE_KEYS.DOCTOR_ACCOUNT, STORAGE_KEYS.DOCTORS_LEGACY);
      const currentDoctor = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_DOCTOR) || 'null');

      const allAccounts = [
        ...existing,
        ...(currentDoctor ? [currentDoctor] : [])
      ].filter(Boolean);

      const found = allAccounts.find(d => (d.email || '').trim().toLowerCase() === normalizedEmail);

      // Step 1: Check whether account exists
      if (!found) {
        return { success: false, error: 'No account found. Please register first.' };
      }

      // Step 2: Validate password
      if (!password || found.password !== password) {
        return { success: false, error: 'Incorrect email or password.' };
      }

      // Step 3: Create Active Session & currentUser object (RBAC format)
      const currentUser = {
        role: 'doctor',
        email: found.email,
        name: found.fullName || 'Doctor',
        isAuthenticated: true,
        user: found,
        timestamp: Date.now(),
      };

      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_OBJECT, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.CURRENT_DOCTOR, JSON.stringify(found));

      return { success: true, user: found };
    } catch (e) {
      return { success: false, error: 'Doctor login error occurred.' };
    }
  },

  // Register Caregiver
  registerCaregiver: (caregiverData) => {
    try {
      const normalizedEmail = (caregiverData.email || '').trim().toLowerCase();
      const existing = authService.getAccountsByRole(STORAGE_KEYS.CAREGIVER_ACCOUNT, STORAGE_KEYS.CAREGIVERS_LEGACY);

      const newRecord = {
        fullName: (caregiverData.fullName || '').trim(),
        email: normalizedEmail,
        password: caregiverData.password || '',
        role: 'caregiver',
        registrationStatus: 'registered',
        relationship: caregiverData.relationship || 'Caregiver',
        mobileNumber: caregiverData.mobileNumber || '',
      };

      const updated = [...existing.filter(c => (c.email || '').trim().toLowerCase() !== normalizedEmail), newRecord];
      localStorage.setItem(STORAGE_KEYS.CAREGIVER_ACCOUNT, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.CAREGIVERS_LEGACY, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.CURRENT_CAREGIVER, JSON.stringify(newRecord));

      return { success: true, user: newRecord };
    } catch (e) {
      return { success: false, error: 'Caregiver registration failed.' };
    }
  },

  // Login Caregiver
  loginCaregiver: (email, password) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const existing = authService.getAccountsByRole(STORAGE_KEYS.CAREGIVER_ACCOUNT, STORAGE_KEYS.CAREGIVERS_LEGACY);
      const currentCaregiver = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_CAREGIVER) || 'null');

      const allAccounts = [
        ...existing,
        ...(currentCaregiver ? [currentCaregiver] : [])
      ].filter(Boolean);

      const found = allAccounts.find(c => (c.email || '').trim().toLowerCase() === normalizedEmail);

      // Step 1: Check whether account exists
      if (!found) {
        return { success: false, error: 'No account found. Please register first.' };
      }

      // Step 2: Validate password
      if (!password || found.password !== password) {
        return { success: false, error: 'Incorrect email or password.' };
      }

      // Step 3: Create Active Session & currentUser object (RBAC format)
      const currentUser = {
        role: 'caregiver',
        email: found.email,
        name: found.fullName || 'Caregiver',
        isAuthenticated: true,
        user: found,
        timestamp: Date.now(),
      };

      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_OBJECT, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.CURRENT_CAREGIVER, JSON.stringify(found));

      return { success: true, user: found };
    } catch (e) {
      return { success: false, error: 'Caregiver login error occurred.' };
    }
  },

  // Get active session / currentUser
  getActiveSession: () => {
    try {
      const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || 'null');
      if (session && session.isAuthenticated !== false) return session;
      const currentUserObj = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER_OBJECT) || 'null');
      if (currentUserObj && currentUserObj.isAuthenticated !== false) return currentUserObj;
      return null;
    } catch (e) {
      return null;
    }
  },

  // Check if role is authenticated
  isAuthenticated: (requiredRole) => {
    const session = authService.getActiveSession();
    if (!session || !session.role || session.isAuthenticated === false) return false;
    if (requiredRole && session.role !== requiredRole) return false;
    return true;
  },

  getActiveRole: () => {
    const session = authService.getActiveSession();
    return session ? session.role : null;
  },

  getCurrentUser: (role) => {
    try {
      const session = authService.getActiveSession();
      if (session && session.user) return session.user;
      if (role === 'patient') return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_PATIENT) || 'null');
      if (role === 'doctor') return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_DOCTOR) || 'null');
      if (role === 'caregiver') return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_CAREGIVER) || 'null');
    } catch (e) {
      return null;
    }
    return null;
  },

  // Logout cleanly
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_OBJECT);
    } catch (e) {
      // ignore
    }
  },

  logoutUser: () => {
    authService.logout();
  },
};

export default authService;
