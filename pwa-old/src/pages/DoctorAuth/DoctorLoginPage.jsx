import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { PasswordField } from '../../components/PasswordField';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { formatAuthError } from '../../services/authService';
import { AlertCircle, ArrowRight, HelpCircle } from 'lucide-react';

export const DoctorLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useAccessibility();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorField, setErrorField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorField(null);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg(t('errInvalidEmail'));
      setErrorField('email');
      return;
    }

    if (!password) {
      setErrorMsg(t('errPasswordRequired'));
      setErrorField('password');
      return;
    }

    setSubmitting(true);

    try {
      await login(email, password, 'Doctor');
      navigate('/dashboard/doctor');
    } catch (err) {
      const formatted = formatAuthError(err, t);
      setErrorMsg(formatted.message);
      setErrorField(formatted.field);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="center-view animate-fade-in" style={{ padding: '1.5rem 0.5rem' }}>
      <Card style={{ maxWidth: '460px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <h2>{t('doctorLoginTitle')}</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Sign in to access your clinical practitioner portal.
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.8rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            border: '1.5px solid var(--color-danger)',
            color: 'var(--color-danger)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            marginBottom: '1.2rem',
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">{t('emailLabel')} *</label>
            <input
              type="email"
              className={`form-input ${errorField === 'email' ? 'field-error' : ''}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); setErrorField(null); }}
              placeholder="dr.smith@hospital.org"
              required
            />
            {errorField === 'email' && <span className="field-error-msg">{errorMsg}</span>}
          </div>

          <PasswordField
            label={t('passwordLabel')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); setErrorField(null); }}
            placeholder={t('passwordPlaceholder')}
            error={errorField === 'password'}
            errorMsg={errorMsg}
          />

          <div style={{ textAlign: 'right', marginBottom: '1.2rem' }}>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-green-hover)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('forgotPassword')}
            </button>
          </div>

          <Button
            type="submit"
            loading={submitting}
            loadingText={t('submittingLogin')}
            style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-green), #16a085)' }}
          >
            <span>{t('submitContinue')}</span>
            <ArrowRight size={20} />
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            to="/doctor/register"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-green-hover)',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            {t('needRegisterLink')}
          </Link>
          <Link
            to="/role-selection"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)',
              textDecoration: 'none',
            }}
          >
            {t('returnRoleSelection')}
          </Link>
        </div>
      </Card>

      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '1rem',
        }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <HelpCircle size={36} color="var(--color-green)" style={{ marginBottom: '1rem' }} />
            <h3>Reset Doctor Credentials</h3>
            <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: '1.5rem' }}>
              Please contact your hospital system administrator to issue a credential reset token.
            </p>
            <Button onClick={() => setShowForgotModal(false)} style={{ width: '100%', background: 'var(--color-green)' }}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
