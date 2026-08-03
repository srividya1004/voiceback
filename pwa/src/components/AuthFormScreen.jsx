import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Lock, Mail, User } from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const AuthFormScreen = ({ roleId, mode = 'register', onBack, onNavigate }) => {
  const { t } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Always reset fields to empty whenever Login page opens
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
  }, [roleId, mode, currentMode]);

  const getRoleTitle = () => {
    if (roleId === 'patient') return t('patient');
    if (roleId === 'doctor') return t('doctor');
    if (roleId === 'caregiver') return t('caregiver');
    return t('chooseYourRole');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentMode === 'register') {
      if (onNavigate) {
        onNavigate('patient-login');
      }
    } else {
      if (onNavigate) {
        onNavigate('patient-dashboard');
      }
    }
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container">
        {/* Header Section */}
        <header className="role-header">
          <button
            type="button"
            className="settings-btn"
            aria-label={t('back')}
            onClick={onBack}
          >
            <ArrowLeft size={20} />
          </button>
          <VoiceBackLogo variant="header" />
          <button
            type="button"
            className="settings-btn"
            aria-label={t('settings')}
            title={t('settings')}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="role-main">
          <div className="role-title-section">
            <h1 className="role-main-title">{getRoleTitle()}</h1>
            <p className="role-subtitle">
              {currentMode === 'register' ? t('registrationGuidance') : t('loginGuidance')}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {currentMode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">
                  <User size={16} />
                  <span>Name</span>
                </label>
                <input
                  id="auth-name"
                  type="text"
                  className="form-input"
                  placeholder={t('enterFullName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">
                <Mail size={16} />
                <span>Email</span>
              </label>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder={t('enterEmail')}
                value={email}
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">
                <Lock size={16} />
                <span>Password</span>
              </label>
              <input
                id="auth-password"
                type="password"
                className="form-input"
                placeholder={t('enterPassword')}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-continue"
              >
                <span>{currentMode === 'register' ? t('register') : t('login')}</span>
              </button>

              <button
                type="button"
                className="btn-secondary-auth"
                onClick={() => {
                  const nextMode = currentMode === 'register' ? 'login' : 'register';
                  setCurrentMode(nextMode);
                  if (onNavigate) {
                    onNavigate(nextMode === 'login' ? 'patient-login' : 'patient-register');
                  }
                }}
              >
                <span>{currentMode === 'register' ? t('login') : t('register')}</span>
              </button>
            </div>
          </form>
        </main>
      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default AuthFormScreen;
