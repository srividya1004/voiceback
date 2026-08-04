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

  // Protected Route Enforcement Guard
  useEffect(() => {
    if (currentScreen === 'patient-dashboard' && !authService.isAuthenticated('patient')) {
      setCurrentScreen('patient-login');
    } else if (currentScreen === 'doctor-dashboard' && !authService.isAuthenticated('doctor')) {
      setCurrentScreen('doctor-login');
    } else if (currentScreen === 'caregiver-dashboard' && !authService.isAuthenticated('caregiver')) {
      setCurrentScreen('caregiver-login');
    }
  }, [currentScreen]);

  const handleSplashComplete = useCallback(() => {
    setCurrentScreen('role-selection');
  }, []);

  const handleRoleSelect = (roleId) => {
    setRoleNotice('');
    if (roleId === 'patient') {
      setCurrentScreen('patient-intro');
    } else if (roleId === 'doctor') {
      setCurrentScreen('doctor-login');
    } else if (roleId === 'caregiver') {
      setCurrentScreen('caregiver-login');
    }
  };

  const handleIntroComplete = () => {
    setCurrentScreen('patient-register');
  };

  const handleRegistrationSuccess = () => {
    setCurrentScreen('patient-login');
  };

  const handleLoginSuccess = () => {
    setCurrentScreen('patient-dashboard');
  };

  const handleDoctorLoginSuccess = () => {
    setCurrentScreen('doctor-dashboard');
  };

  const handleDoctorRegistrationSuccess = () => {
    setCurrentScreen('doctor-login');
  };

  const handleCaregiverLoginSuccess = () => {
    setCurrentScreen('caregiver-dashboard');
  };

  const handleCaregiverRegistrationSuccess = () => {
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

      {/* PATIENT FLOW */}
      {/* Screen 3: Patient Introduction */}
      {currentScreen === 'patient-intro' && (
        <PatientIntroScreen
          onComplete={handleIntroComplete}
        />
      )}

      {/* Screen 4: Patient Registration Screen */}
      {currentScreen === 'patient-register' && (
        <PatientRegistrationScreen
          onBack={() => setCurrentScreen('role-selection')}
          onSuccess={handleRegistrationSuccess}
          onSignInClick={() => setCurrentScreen('patient-login')}
        />
      )}

      {/* Screen 5: Patient Login Screen */}
      {currentScreen === 'patient-login' && (
        <PatientLoginScreen
          onBack={() => setCurrentScreen('role-selection')}
          onCreateAccountClick={() => setCurrentScreen('patient-register')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Screen 6: Patient Dashboard Screen (PROTECTED) */}
      {currentScreen === 'patient-dashboard' && authService.isAuthenticated('patient') && (
        <PatientDashboardScreen
          onLogout={handleLogout}
        />
      )}

      {/* DOCTOR FLOW */}
      {/* Screen 7: Doctor Login Screen */}
      {currentScreen === 'doctor-login' && (
        <DoctorLoginScreen
          onBack={() => setCurrentScreen('role-selection')}
          onCreateAccountClick={() => setCurrentScreen('doctor-register')}
          onLoginSuccess={handleDoctorLoginSuccess}
        />
      )}

      {/* Screen 8: Doctor Registration Screen */}
      {currentScreen === 'doctor-register' && (
        <DoctorRegistrationScreen
          onBack={() => setCurrentScreen('doctor-login')}
          onSuccess={handleDoctorRegistrationSuccess}
          onSignInClick={() => setCurrentScreen('doctor-login')}
        />
      )}

      {/* Screen 9: Doctor Dashboard Screen (PROTECTED) */}
      {currentScreen === 'doctor-dashboard' && authService.isAuthenticated('doctor') && (
        <DoctorDashboardScreen
          onLogout={handleLogout}
        />
      )}

      {/* CAREGIVER FLOW */}
      {/* Screen 10: Caregiver Login Screen */}
      {currentScreen === 'caregiver-login' && (
        <CaregiverLoginScreen
          onBack={() => setCurrentScreen('role-selection')}
          onCreateAccountClick={() => setCurrentScreen('caregiver-register')}
          onLoginSuccess={handleCaregiverLoginSuccess}
        />
      )}

      {/* Screen 11: Caregiver Registration Screen */}
      {currentScreen === 'caregiver-register' && (
        <CaregiverRegistrationScreen
          onBack={() => setCurrentScreen('caregiver-login')}
          onSuccess={handleCaregiverRegistrationSuccess}
          onSignInClick={() => setCurrentScreen('caregiver-login')}
        />
      )}

      {/* Screen 12: Caregiver Dashboard Screen (PROTECTED) */}
      {currentScreen === 'caregiver-dashboard' && authService.isAuthenticated('caregiver') && (
        <CaregiverDashboardScreen
          onLogout={handleLogout}
        />
      )}
    </main>
  );
}

export default App;
