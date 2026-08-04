import { useState, useCallback, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import RoleSelectionScreen from './components/RoleSelectionScreen';
import PatientIntroScreen from './components/PatientIntroScreen';
import PatientRegistrationScreen from './components/PatientRegistrationScreen';
import PatientLoginScreen from './components/PatientLoginScreen';
import PatientDashboardScreen from './components/PatientDashboardScreen';
import DoctorLoginScreen from './components/DoctorLoginScreen';
import DoctorRegistrationScreen from './components/DoctorRegistrationScreen';
import DoctorDashboardScreen from './components/DoctorDashboardScreen';
import CaregiverLoginScreen from './components/CaregiverLoginScreen';
import CaregiverRegistrationScreen from './components/CaregiverRegistrationScreen';
import CaregiverDashboardScreen from './components/CaregiverDashboardScreen';
import authService from './services/authService';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [roleNotice, setRoleNotice] = useState('');

  // Registered Emails for Auto pre-fill on Login
  const [registeredEmail, setRegisteredEmail] = useState({
    patient: '',
    doctor: '',
    caregiver: '',
  });

  // Role-Based Access Control (RBAC) & Protected Route Guard
  useEffect(() => {
    if (currentScreen === 'splash') return;

    const session = authService.getActiveSession();
    const activeRole = session?.role;

    if (activeRole) {
      // Authenticated User: Restrict access strictly to own role's dashboard
      if (activeRole === 'patient' && currentScreen !== 'patient-dashboard') {
        setCurrentScreen('patient-dashboard');
      } else if (activeRole === 'doctor' && currentScreen !== 'doctor-dashboard') {
        setCurrentScreen('doctor-dashboard');
      } else if (activeRole === 'caregiver' && currentScreen !== 'caregiver-dashboard') {
        setCurrentScreen('caregiver-dashboard');
      }
    } else {
      // Unauthenticated User: Prevent access to any protected dashboard
      if (currentScreen === 'patient-dashboard') {
        setCurrentScreen('patient-login');
      } else if (currentScreen === 'doctor-dashboard') {
        setCurrentScreen('doctor-login');
      } else if (currentScreen === 'caregiver-dashboard') {
        setCurrentScreen('caregiver-login');
      }
    }
  }, [currentScreen]);

  const handleSplashComplete = useCallback(() => {
    const session = authService.getActiveSession();
    if (session && session.role) {
      if (session.role === 'patient') {
        setCurrentScreen('patient-dashboard');
        return;
      } else if (session.role === 'doctor') {
        setCurrentScreen('doctor-dashboard');
        return;
      } else if (session.role === 'caregiver') {
        setCurrentScreen('caregiver-dashboard');
        return;
      }
    }
    setCurrentScreen('role-selection');
  }, []);

  const handleRoleSelect = (roleId) => {
    setRoleNotice('');
    const session = authService.getActiveSession();
    if (session && session.role) {
      if (session.role === 'patient') setCurrentScreen('patient-dashboard');
      else if (session.role === 'doctor') setCurrentScreen('doctor-dashboard');
      else if (session.role === 'caregiver') setCurrentScreen('caregiver-dashboard');
      return;
    }

    if (roleId === 'patient') {
      if (authService.isPatientRegistered()) {
        setCurrentScreen('patient-login');
      } else if (authService.isPatientIntroCompleted()) {
        setCurrentScreen('patient-register');
      } else {
        setCurrentScreen('patient-intro');
      }
    } else if (roleId === 'doctor') {
      setCurrentScreen('doctor-login');
    } else if (roleId === 'caregiver') {
      setCurrentScreen('caregiver-login');
    }
  };

  const handleIntroComplete = () => {
    authService.setPatientIntroCompleted();
    setCurrentScreen('patient-register');
  };

  const handleRegistrationSuccess = (data) => {
    authService.setPatientRegistered();
    if (data?.email) {
      setRegisteredEmail((prev) => ({ ...prev, patient: data.email }));
      authService.setLastRegisteredEmail('patient', data.email);
    }
    setCurrentScreen('patient-login');
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('patient-dashboard');
  };

  const handleDoctorLoginSuccess = () => {
    setCurrentScreen('doctor-dashboard');
  };

  const handleDoctorRegistrationSuccess = (data) => {
    if (data?.email) {
      setRegisteredEmail((prev) => ({ ...prev, doctor: data.email }));
      authService.setLastRegisteredEmail('doctor', data.email);
    }
    setCurrentScreen('doctor-login');
  };

  const handleCaregiverLoginSuccess = () => {
    setCurrentScreen('caregiver-dashboard');
  };

  const handleCaregiverRegistrationSuccess = (data) => {
    if (data?.email) {
      setRegisteredEmail((prev) => ({ ...prev, caregiver: data.email }));
      authService.setLastRegisteredEmail('caregiver', data.email);
    }
    setCurrentScreen('caregiver-login');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentScreen('role-selection');
  };

  return (
    <main style={{ width: '100%', minHeight: '100vh' }}>
      {/* Screen 1: Splash Screen */}
      {currentScreen === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* Screen 2: Role Selection Screen */}
      {currentScreen === 'role-selection' && (
        <RoleSelectionScreen
          onSelectRole={handleRoleSelect}
          noticeMessage={roleNotice}
        />
      )}

      {/* PATIENT FLOW (RBAC Gated) */}
      {/* Screen 3: Patient Introduction */}
      {currentScreen === 'patient-intro' && !authService.getActiveSession() && (
        <PatientIntroScreen
          onComplete={handleIntroComplete}
        />
      )}

      {/* Screen 4: Patient Registration Screen */}
      {currentScreen === 'patient-register' && !authService.getActiveSession() && (
        <PatientRegistrationScreen
          onBack={() => setCurrentScreen('role-selection')}
          onSuccess={handleRegistrationSuccess}
          onSignInClick={() => setCurrentScreen('patient-login')}
        />
      )}

      {/* Screen 5: Patient Login Screen (Pre-fills ONLY email) */}
      {currentScreen === 'patient-login' && !authService.getActiveSession() && (
        <PatientLoginScreen
          initialEmail={registeredEmail.patient || authService.getLastRegisteredEmail('patient')}
          onBack={() => setCurrentScreen('role-selection')}
          onCreateAccountClick={() => setCurrentScreen('patient-register')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Screen 6: Patient Dashboard Screen (PROTECTED RBAC) */}
      {currentScreen === 'patient-dashboard' && authService.isAuthenticated('patient') && (
        <PatientDashboardScreen
          onLogout={handleLogout}
        />
      )}

      {/* DOCTOR FLOW (RBAC Gated) */}
      {/* Screen 7: Doctor Login Screen (Pre-fills ONLY email) */}
      {currentScreen === 'doctor-login' && !authService.getActiveSession() && (
        <DoctorLoginScreen
          initialEmail={registeredEmail.doctor || authService.getLastRegisteredEmail('doctor')}
          onBack={() => setCurrentScreen('role-selection')}
          onCreateAccountClick={() => setCurrentScreen('doctor-register')}
          onLoginSuccess={handleDoctorLoginSuccess}
        />
      )}

      {/* Screen 8: Doctor Registration Screen */}
      {currentScreen === 'doctor-register' && !authService.getActiveSession() && (
        <DoctorRegistrationScreen
          onBack={() => setCurrentScreen('doctor-login')}
          onSuccess={handleDoctorRegistrationSuccess}
          onSignInClick={() => setCurrentScreen('doctor-login')}
        />
      )}

      {/* Screen 9: Doctor Dashboard Screen (PROTECTED RBAC) */}
      {currentScreen === 'doctor-dashboard' && authService.isAuthenticated('doctor') && (
        <DoctorDashboardScreen
          onLogout={handleLogout}
        />
      )}

      {/* CAREGIVER FLOW (RBAC Gated) */}
      {/* Screen 10: Caregiver Login Screen (Pre-fills ONLY email) */}
      {currentScreen === 'caregiver-login' && !authService.getActiveSession() && (
        <CaregiverLoginScreen
          initialEmail={registeredEmail.caregiver || authService.getLastRegisteredEmail('caregiver')}
          onBack={() => setCurrentScreen('role-selection')}
          onCreateAccountClick={() => setCurrentScreen('caregiver-register')}
          onLoginSuccess={handleCaregiverLoginSuccess}
        />
      )}

      {/* Screen 11: Caregiver Registration Screen */}
      {currentScreen === 'caregiver-register' && !authService.getActiveSession() && (
        <CaregiverRegistrationScreen
          onBack={() => setCurrentScreen('caregiver-login')}
          onSuccess={handleCaregiverRegistrationSuccess}
          onSignInClick={() => setCurrentScreen('caregiver-login')}
        />
      )}

      {/* Screen 12: Caregiver Dashboard Screen (PROTECTED RBAC) */}
      {currentScreen === 'caregiver-dashboard' && authService.isAuthenticated('caregiver') && (
        <CaregiverDashboardScreen
          onLogout={handleLogout}
        />
      )}
    </main>
  );
}

export default App;
