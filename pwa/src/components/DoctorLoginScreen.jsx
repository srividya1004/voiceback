import React, { useState } from 'react';
import { Stethoscope, ArrowLeft, Lock, Mail, UserPlus } from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import PasswordInput from './PasswordInput';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';

export const DoctorLoginScreen = ({ onBack, onCreateAccountClick, onLoginSuccess }) => {
  const { t } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }

    const result = authService.loginDoctor(email, password);
    if (!result.success) {
      setErrorMsg(result.error);
      return;
    }

    if (onLoginSuccess) {
      onLoginSuccess(result.user);
    }
  };

  const handleForgotPassword = () => {
    setNoticeMsg('Password recovery will be available after backend API integration.');
    setTimeout(() => setNoticeMsg(''), 4000);
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container auth-container">
        
        {/* Header Bar: Top Left Back Arrow, Top Right VoiceBack Logo */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="settings-btn"
            aria-label="Back to Role Selection"
            title="Back to Role Selection"
            onClick={onBack}
          >
            <ArrowLeft size={22} />
          </button>
          <VoiceBackLogo variant="header" />
        </header>

        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
          
          {/* Title Card */}
          <div className="role-title-section text-center" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto' }}>
              <Stethoscope size={26} />
            </div>
            <h1 className="role-main-title">Doctor Login</h1>
            <p className="role-subtitle">
              Sign in to your clinical portal account.
            </p>
          </div>

          {/* Notice / Error Alerts */}
          {noticeMsg && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid var(--color-blue-primary)', color: 'var(--color-blue-primary)', fontSize: '0.875rem', fontWeight: 600, width: '100%', textAlign: 'center' }}>
              {noticeMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid #DC2626', color: '#DC2626', fontSize: '0.875rem', fontWeight: 600, width: '100%', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {/* Login Form Card */}
          <section className="profile-section-card" style={{ width: '100%', gap: '1.15rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              
              <div className="profile-field-group">
                <span className="profile-field-label">Email Address *</span>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="doctor@hospital.health"
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Mail size={18} color="var(--color-brand-tagline)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Password *</span>
                <PasswordInput
                  id="doctor-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  leftIcon={<Lock size={18} />}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.25rem' }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: 'var(--color-blue-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="btn-continue"
                style={{ width: '100%', background: 'var(--color-green-primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Stethoscope size={18} />
                <span>Login</span>
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', textAlign: 'center', width: '100%' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-brand-tagline)', marginBottom: '0.65rem' }}>
                Don't have an account?
              </p>
              <button
                type="button"
                className="btn-secondary-auth"
                onClick={onCreateAccountClick}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-green-primary)', borderColor: 'rgba(22, 163, 74, 0.4)' }}
              >
                <UserPlus size={18} />
                <span>Create Doctor Account</span>
              </button>
            </div>
          </section>

          <button
            type="button"
            className="btn-secondary-auth"
            onClick={onBack}
            style={{ width: '100%' }}
          >
            <span>Switch Role</span>
          </button>
        </main>

      </div>
    </div>
  );
};

export default DoctorLoginScreen;
