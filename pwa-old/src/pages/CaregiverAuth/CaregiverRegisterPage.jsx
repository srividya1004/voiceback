import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { PasswordField } from '../../components/PasswordField';
import { VoiceBackLogo } from '../../components/VoiceBackLogo';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { formatAuthError } from '../../services/authService';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const CaregiverRegisterPage = () => {
  const navigate = useNavigate();
  const { registerCaregiver } = useAuth();
  const { t } = useAccessibility();

  const [formData, setFormData] = useState({
    fullName: '',
    relationship: 'Spouse / Family',
    contactNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [errorField, setErrorField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
    setErrorField(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorField(null);

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      setErrorMsg(t('errFullNameRequired'));
      setErrorField('fullName');
      return;
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setErrorMsg(t('errInvalidEmail'));
      setErrorField('email');
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setErrorMsg(t('errPasswordTooShort'));
      setErrorField('password');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(t('errPasswordMismatch'));
      setErrorField('confirmPassword');
      return;
    }

    setSubmitting(true);

    try {
      await registerCaregiver(formData);
      setRegistered(true);
    } catch (err) {
      const formatted = formatAuthError(err, t);
      setErrorMsg(formatted.message);
      setErrorField(formatted.field);
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="center-view animate-fade-in" style={{ padding: '2rem 1rem' }}>
        <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.2rem 1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(231, 76, 60, 0.12)',
            color: '#e74c3c',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.2rem',
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h2>{t('registrationSuccessful')}</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
            Your caregiver account has been created. Please sign in to proceed.
          </p>

          <Button
            onClick={() => navigate('/caregiver/login')}
            size="large"
            style={{ width: '100%', background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
          >
            <span>{t('continueToLogin')}</span>
            <ArrowRight size={20} />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="center-view animate-fade-in" style={{ padding: '1.5rem 0.5rem' }}>
      <Card style={{ maxWidth: '540px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <VoiceBackLogo width="200px" />
          </div>
          <h2>{t('caregiverRegisterTitle')}</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Caregiver account setup and emergency contact registration.
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
            <label className="form-label">{t('fullNameLabel')} *</label>
            <input
              type="text"
              name="fullName"
              className={`form-input ${errorField === 'fullName' ? 'field-error' : ''}`}
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Sarah Vance"
              required
            />
            {errorField === 'fullName' && <span className="field-error-msg">{errorMsg}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="form-group">
              <label className="form-label">{t('relationshipLabel')}</label>
              <input
                type="text"
                name="relationship"
                className="form-input"
                value={formData.relationship}
                onChange={handleChange}
                placeholder="Spouse / Parent"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('contactNumberLabel')}</label>
              <input
                type="tel"
                name="contactNumber"
                className="form-input"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+1 (555) 018-9283"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('emailLabel')} *</label>
            <input
              type="email"
              name="email"
              className={`form-input ${errorField === 'email' ? 'field-error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="caregiver@family.org"
              required
            />
            {errorField === 'email' && <span className="field-error-msg">{errorMsg}</span>}
          </div>

          <PasswordField
            label={t('passwordLabel')}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('passwordPlaceholder')}
            error={errorField === 'password'}
            errorMsg={errorMsg}
          />

          <PasswordField
            label={t('confirmPasswordLabel')}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder={t('passwordPlaceholder')}
            error={errorField === 'confirmPassword'}
            errorMsg={errorMsg}
          />

          <Button
            type="submit"
            loading={submitting}
            loadingText={t('submittingRegister')}
            style={{ width: '100%', marginTop: '0.5rem', background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
          >
            <span>{t('submitContinue')}</span>
            <ArrowRight size={20} />
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          <Link
            to="/caregiver/login"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: '#e74c3c',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            {t('alreadyRegisteredLink')}
          </Link>
        </div>
      </Card>
    </div>
  );
};
