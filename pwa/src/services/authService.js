import apiClient from './apiClient';
import patientService from './patientService';
import doctorService from './doctorService';
import caregiverService from './caregiverService';

const STORAGE_KEYS = {
  ACTIVE_SESSION: 'voiceback_auth_session',
  CURRENT_USER_OBJECT: 'currentUser',
  PATIENT_INTRO_COMPLETED: 'voiceback_patient_intro_completed',
  PATIENT_REGISTERED: 'voiceback_patient_registered',
  LAST_REGISTERED_EMAIL_PATIENT: 'voiceback_registered_email_patient',
  LAST_REGISTERED_EMAIL_DOCTOR: 'voiceback_registered_email_doctor',
  LAST_REGISTERED_EMAIL_CAREGIVER: 'voiceback_registered_email_caregiver',
  PATIENT_ACCOUNT: 'voiceback_patient_account',
  DOCTOR_ACCOUNT: 'voiceback_doctor_account',
  CAREGIVER_ACCOUNT: 'voiceback_caregiver_account',
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
      return Array.isArray(accounts) && accounts.length > 0;
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

  // Get Last Registered Email for Pre-filling Login forms
  getLastRegisteredEmail: (role) => {
    try {
      if (role === 'patient') return localStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_EMAIL_PATIENT) || '';
      if (role === 'doctor') return localStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_EMAIL_DOCTOR) || '';
      if (role === 'caregiver') return localStorage.getItem(STORAGE_KEYS.LAST_REGISTERED_EMAIL_CAREGIVER) || '';
    } catch (e) {
      return '';
    }
    return '';
  },

  setLastRegisteredEmail: (role, email) => {
    try {
      const normalized = (email || '').trim().toLowerCase();
      if (role === 'patient') localStorage.setItem(STORAGE_KEYS.LAST_REGISTERED_EMAIL_PATIENT, normalized);
      if (role === 'doctor') localStorage.setItem(STORAGE_KEYS.LAST_REGISTERED_EMAIL_DOCTOR, normalized);
      if (role === 'caregiver') localStorage.setItem(STORAGE_KEYS.LAST_REGISTERED_EMAIL_CAREGIVER, normalized);
    } catch (e) {
      // ignore
    }
  },

  // Unified Backend Registration Methods
  registerPatient: async (patientData) => {
    const normalizedEmail = (patientData.email || '').trim().toLowerCase();
    const fullName = (patientData.fullName || '').trim();
    try {
      // 1. Create UserLogin record in Express Backend
      const loginRes = await apiClient.post('/user-logins', {
        email: normalizedEmail,
        passwordHash: patientData.password,
        role: 'Patient',
      });
      const userLogin = loginRes.data.data;

      // 2. Create Patient profile in Express Backend
      const validAphasiaTypes = [
        "Broca's", "Wernicke's", "Global", "Anomic",
        "Transcortical Motor", "Transcortical Sensory", "Conduction", "Mixed", "Other"
      ];
      const selectedAphasia = validAphasiaTypes.includes(patientData.aphasiaType)
        ? patientData.aphasiaType
        : "Broca's";

      const profRes = await patientService.createPatientProfile({
        userId: userLogin._id,
        fullName,
        age: Number(patientData.age) || 45,
        aphasiaType: selectedAphasia,
        gender: patientData.gender || null,
        preferredLanguage: patientData.preferredLanguage || null,
        phone: patientData.mobileNumber || patientData.phone || null,
        email: normalizedEmail,
        emergencyContact: patientData.emergencyContact || null
      });

      const profileObj = profRes.data || profRes;
      localStorage.setItem('voiceback_patient_user', JSON.stringify(profileObj));

      authService.setLastRegisteredEmail('patient', normalizedEmail);
      authService.setPatientRegistered();

      return { success: true, user: { email: normalizedEmail, role: 'patient', fullName, profile: profileObj } };
    } catch (apiError) {
      console.warn('Backend API registration failed, falling back to local storage:', apiError.message);
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENT_ACCOUNT) || '[]');
      const newRecord = {
        fullName,
        email: normalizedEmail,
        password: patientData.password || '',
        role: 'patient',
      };
      const updated = [...existing.filter((u) => (u.email || '').trim().toLowerCase() !== normalizedEmail), newRecord];
      localStorage.setItem(STORAGE_KEYS.PATIENT_ACCOUNT, JSON.stringify(updated));
      localStorage.setItem('voiceback_patient_user', JSON.stringify(newRecord));
      authService.setLastRegisteredEmail('patient', normalizedEmail);
      authService.setPatientRegistered();
      return { success: true, user: newRecord };
    }
  },

  registerDoctor: async (doctorData) => {
    const normalizedEmail = (doctorData.email || '').trim().toLowerCase();
    const fullName = (doctorData.fullName || '').trim();
    try {
      // 1. Create UserLogin record in Express Backend
      const loginRes = await apiClient.post('/user-logins', {
        email: normalizedEmail,
        passwordHash: doctorData.password,
        role: 'Doctor',
      });
      const userLogin = loginRes.data.data;

      // 2. Create Doctor profile in Express Backend
      const docRes = await doctorService.createDoctorProfile({
        userId: userLogin._id,
        fullName,
        specialization: doctorData.specialization || 'Neurologist',
        hospitalAffiliation: doctorData.hospital || doctorData.hospitalName || 'AIIMS Clinical Rehabilitation Center',
        licenseNumber: doctorData.licenseNumber || `LIC-${Math.floor(1000 + Math.random() * 9000)}`,
        email: normalizedEmail,
        phone: doctorData.mobileNumber || '',
      });

      const docObj = docRes.data || docRes;
      localStorage.setItem('voiceback_doctor_user', JSON.stringify(docObj));

      authService.setLastRegisteredEmail('doctor', normalizedEmail);
      return { success: true, user: { email: normalizedEmail, role: 'doctor', fullName, profile: docObj } };
    } catch (apiError) {
      console.warn('Backend API doctor registration failed, falling back to local storage:', apiError.message);
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCTOR_ACCOUNT) || '[]');
      const newRecord = {
        fullName,
        email: normalizedEmail,
        password: doctorData.password || '',
        role: 'doctor',
      };
      const updated = [...existing.filter((d) => (d.email || '').trim().toLowerCase() !== normalizedEmail), newRecord];
      localStorage.setItem(STORAGE_KEYS.DOCTOR_ACCOUNT, JSON.stringify(updated));
      localStorage.setItem('voiceback_doctor_user', JSON.stringify(newRecord));
      authService.setLastRegisteredEmail('doctor', normalizedEmail);
      return { success: true, user: newRecord };
    }
  },

  registerCaregiver: async (caregiverData) => {
    const normalizedEmail = (caregiverData.email || '').trim().toLowerCase();
    const fullName = (caregiverData.fullName || '').trim();
    try {
      // 1. Create UserLogin record in Express Backend
      const loginRes = await apiClient.post('/user-logins', {
        email: normalizedEmail,
        passwordHash: caregiverData.password,
        role: 'Caregiver',
      });
      const userLogin = loginRes.data.data;

      // 2. Create Caregiver profile in Express Backend
      const cgRes = await caregiverService.createCaregiverProfile({
        userId: userLogin._id,
        fullName,
        phone: caregiverData.mobileNumber || '9876543210',
        relationshipToPatient: caregiverData.relationship || 'Caregiver',
        email: normalizedEmail,
      });

      const cgObj = cgRes.data || cgRes;
      localStorage.setItem('voiceback_caregiver_user', JSON.stringify(cgObj));

      authService.setLastRegisteredEmail('caregiver', normalizedEmail);
      return { success: true, user: { email: normalizedEmail, role: 'caregiver', fullName, profile: cgObj } };
    } catch (apiError) {
      console.warn('Backend API caregiver registration failed, falling back to local storage:', apiError.message);
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.CAREGIVER_ACCOUNT) || '[]');
      const newRecord = {
        fullName,
        email: normalizedEmail,
        password: caregiverData.password || '',
        role: 'caregiver',
      };
      const updated = [...existing.filter((c) => (c.email || '').trim().toLowerCase() !== normalizedEmail), newRecord];
      localStorage.setItem(STORAGE_KEYS.CAREGIVER_ACCOUNT, JSON.stringify(updated));
      localStorage.setItem('voiceback_caregiver_user', JSON.stringify(newRecord));
      authService.setLastRegisteredEmail('caregiver', normalizedEmail);
      return { success: true, user: newRecord };
    }
  },

  // Generic login handler calling POST /api/user-logins/login
  loginUser: async (email, password, targetRole = 'patient') => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, error: 'Password is required.' };
    }

    try {
      // Call Express Backend Login Endpoint
      const response = await apiClient.post('/user-logins/login', {
        email: normalizedEmail,
        password,
      });

      const { token, user } = response.data.data;
      const backendRole = (user.role || targetRole).toLowerCase();
      const profile = user.profile || null;
      const userFullName = user.fullName || profile?.fullName || normalizedEmail.split('@')[0];

      // Store auth session object with real full name and profile
      const authSession = {
        token: token || `jwt-token-${Date.now()}`,
        role: backendRole,
        email: user.email,
        fullName: userFullName,
        isAuthenticated: true,
        user: {
          id: user.id || user._id,
          email: user.email,
          role: backendRole,
          fullName: userFullName,
          profile: profile,
        },
      };

      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(authSession));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_OBJECT, JSON.stringify(authSession.user));
      localStorage.setItem('voiceback_current_user', JSON.stringify(authSession.user));

      if (backendRole === 'doctor') {
        localStorage.setItem('voiceback_doctor_user', JSON.stringify(profile || authSession.user));
      } else if (backendRole === 'caregiver') {
        localStorage.setItem('voiceback_caregiver_user', JSON.stringify(profile || authSession.user));
      } else if (backendRole === 'patient') {
        localStorage.setItem('voiceback_patient_user', JSON.stringify(profile || authSession.user));
        authService.setPatientRegistered();
      }

      return { success: true, user: authSession };
    } catch (apiError) {
      if (apiError && apiError.status && apiError.status < 500) {
        return { success: false, error: apiError.message || 'Authentication failed.' };
      }

      console.warn('Backend login API call failed, attempting local fallback:', apiError.message);

      const storageKeyMap = {
        patient: STORAGE_KEYS.PATIENT_ACCOUNT,
        doctor: STORAGE_KEYS.DOCTOR_ACCOUNT,
        caregiver: STORAGE_KEYS.CAREGIVER_ACCOUNT,
      };

      const key = storageKeyMap[targetRole] || STORAGE_KEYS.PATIENT_ACCOUNT;
      const accounts = JSON.parse(localStorage.getItem(key) || '[]');
      const found = accounts.find((a) => (a.email || '').trim().toLowerCase() === normalizedEmail);

      if (!found) {
        return { success: false, error: 'No account found. Please register first.' };
      }

      if (found.password !== password) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      const userFullName = found.fullName || normalizedEmail.split('@')[0];

      const authSession = {
        token: `mock-jwt-token-${Date.now()}`,
        role: targetRole,
        email: found.email,
        fullName: userFullName,
        isAuthenticated: true,
        user: {
          email: found.email,
          role: targetRole,
          fullName: userFullName,
          name: userFullName,
          profile: found,
        },
      };

      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(authSession));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_OBJECT, JSON.stringify(authSession.user));
      localStorage.setItem('voiceback_current_user', JSON.stringify(authSession.user));

      if (targetRole === 'doctor') {
        localStorage.setItem('voiceback_doctor_user', JSON.stringify(found));
      } else if (targetRole === 'caregiver') {
        localStorage.setItem('voiceback_caregiver_user', JSON.stringify(found));
      } else if (targetRole === 'patient') {
        localStorage.setItem('voiceback_patient_user', JSON.stringify(found));
        authService.setPatientRegistered();
      }

      return { success: true, user: authSession };
    }
  },

  // Role-specific login wrappers
  loginPatient: (email, password) => authService.loginUser(email, password, 'patient'),
  loginDoctor: (email, password) => authService.loginUser(email, password, 'doctor'),
  loginCaregiver: (email, password) => authService.loginUser(email, password, 'caregiver'),

  // Get Active Session
  getActiveSession: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session && session.isAuthenticated && session.token) return session;
      return null;
    } catch (e) {
      return null;
    }
  },

  // Check if user is authenticated with required role
  isAuthenticated: (requiredRole) => {
    const session = authService.getActiveSession();
    if (!session || !session.isAuthenticated || !session.token) return false;
    if (requiredRole && session.role !== requiredRole) return false;
    return true;
  },

  getActiveRole: () => {
    const session = authService.getActiveSession();
    return session ? session.role : null;
  },

  getCurrentUser: () => {
    const session = authService.getActiveSession();
    return session ? session.user : null;
  },

  updateActiveSessionProfile: (updatedProfile) => {
    try {
      const rawSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (!rawSession) return;
      const session = JSON.parse(rawSession);
      if (!session) return;
      const fullName = updatedProfile.fullName || session.fullName;
      session.fullName = fullName;
      if (session.user) {
        session.user.fullName = fullName;
        session.user.profile = { ...(session.user.profile || {}), ...updatedProfile };
      }
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_OBJECT, JSON.stringify(session.user));
      localStorage.setItem('voiceback_current_user', JSON.stringify(session.user));
      const role = (session.role || '').toLowerCase();
      if (role === 'patient') {
        localStorage.setItem('voiceback_patient_user', JSON.stringify(updatedProfile));
      } else if (role === 'doctor') {
        localStorage.setItem('voiceback_doctor_user', JSON.stringify(updatedProfile));
      } else if (role === 'caregiver') {
        localStorage.setItem('voiceback_caregiver_user', JSON.stringify(updatedProfile));
      }
    } catch (e) {
      // ignore
    }
  },

  // Logout & Clear Session
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_OBJECT);
      localStorage.removeItem('voiceback_current_user');
      localStorage.removeItem('voiceback_doctor_user');
      localStorage.removeItem('voiceback_caregiver_user');
      localStorage.removeItem('voiceback_patient_user');
    } catch (e) {
      // ignore
    }
  },

  logoutUser: () => {
    authService.logout();
  },
};

export default authService;
