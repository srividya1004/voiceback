import { useState, useCallback } from 'react';
import SplashScreen from './components/SplashScreen';
import RoleSelectionScreen from './components/RoleSelectionScreen';
import PatientIntroScreen from './components/PatientIntroScreen';
import PatientRegistrationScreen from './components/PatientRegistrationScreen';
import PatientLoginScreen from './components/PatientLoginScreen';
import PatientDashboardScreen from './components/PatientDashboardScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [roleNotice, setRoleNotice] = useState('');

  const handleSplashComplete = useCallback(() => {
    setCurrentScreen('role-selection');
  }, []);

  const handleRoleSelect = (roleId) => {
    if (roleId === 'patient') {
      setRoleNotice('');
      setCurrentScreen('patient-intro');
    } else if (roleId === 'doctor') {
      setRoleNotice('Doctor Registration – Coming Next');
    } else if (roleId === 'caregiver') {
      setRoleNotice('Caregiver Registration – Coming Next');
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

      {/* Screen 6: Patient Dashboard Screen */}
      {currentScreen === 'patient-dashboard' && (
        <PatientDashboardScreen
          onLogout={() => setCurrentScreen('role-selection')}
        />
      )}
    </main>
  );
}

export default App;
