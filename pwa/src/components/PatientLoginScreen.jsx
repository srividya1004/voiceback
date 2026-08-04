import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import PasswordInput from './PasswordInput';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';

export const PatientLoginScreen = ({ initialEmail = '', onBack, onCreateAccountClick, onLoginSuccess }) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form State - Pre-fill ONLY registered email, password remains empty
  const [email, setEmail] = useState(() => initialEmail || authService.getLastRegisteredEmail('patient') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Feedback Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState('');

  // Sync initialEmail if prop changes
  useEffect(() => {
    const prefilled = initialEmail || authService.getLastRegisteredEmail('patient');
    if (prefilled) {
      setEmail(prefilled);
    }
    setPassword(''); // MUST NOT pre-fill password
    setErrorMessage('');
    setForgotPasswordMsg('');
  }, [initialEmail]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length > 0;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleFieldSpeak = (textKey) => {
    if (voiceAssistant && speak) {
      speak(t(textKey) || textKey);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    // Authenticate Patient via authService (handles backend API & fallback)
    const result = await authService.loginPatient(email, password);
    if (!result.success) {
      setErrorMessage(result.error);
      if (voiceAssistant && speak) {
        speak(result.error);
      }
      return;
    }

    setErrorMessage('');
    if (onLoginSuccess) {
      onLoginSuccess(result.user);
    }
  };

  const handleForgotPassword = () => {
    setErrorMessage('');
    setForgotPasswordMsg('Password reset instructions have been sent to your email.');
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container">
        {/* Header Section */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {onBack ? (
            <button
              type="button"
              className="settings-btn"
              aria-label={t('back') || 'Back'}
              onClick={onBack}
            >
              <ArrowLeft size={22} />
            </button>
          ) : (
            <div style={{ width: 42 }} />
          )}

          <VoiceBackLogo variant="header" />
          <div style={{ width: 42 }} />
        </header>

        {/* Title Section */}
        <div className="role-title-section text-center" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
          <h1 className="role-main-title">Patient Login</h1>
          <p className="role-subtitle">
            Sign in to continue your recovery journey.
          </p>
        </div>

        {/* Main Form Area */}
        <main className="role-main">
          {/* Validation Error Alert */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#DC2626',
                fontSize: '0.825rem',
                fontWeight: 600,
                marginBottom: '1rem',
                width: '100%',
              }}
              role="alert"
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Forgot Password Info Alert */}
          {forgotPasswordMsg && (
            <div
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid var(--color-blue-primary)',
                color: 'var(--color-blue-primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                textAlign: 'center',
                marginBottom: '1rem',
                width: '100%',
              }}
            >
              {forgotPasswordMsg}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            {/* Email Address * */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                <Mail size={16} />
                <span>Email Address *</span>
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                autoComplete="off"
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                onFocus={() => handleFieldSpeak('emailAddress')}
                required
              />
            </div>

            {/* Password * (Reusable PasswordInput) */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                <Lock size={16} />
                <span>Password *</span>
              </label>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                onFocus={() => handleFieldSpeak('password')}
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Options: Remember Me & Forgot Password? */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                marginTop: '0.1rem',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-blue-primary)', width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--color-brand-title)', fontWeight: 500 }}>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-blue-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Action Buttons */}
            <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="submit"
                className="btn-continue"
                disabled={!isFormValid}
                onFocus={() => handleFieldSpeak('login')}
              >
                <span>Login</span>
              </button>

              {onCreateAccountClick && (
                <button
                  type="button"
                  className="btn-secondary-auth"
                  onClick={onCreateAccountClick}
                >
                  <span>Create New Account</span>
                </button>
              )}
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

export default PatientLoginScreen;
