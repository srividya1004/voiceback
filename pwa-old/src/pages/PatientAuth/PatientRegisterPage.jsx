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

export const PatientRegisterPage = () => {
  const navigate = useNavigate();
  const { registerPatient } = useAuth();
  const { t } = useAccessibility();

  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'Other',
    aphasiaType: "Broca's",
    preferredLanguage: 'English',
    emergencyContact: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [errorField, setErrorField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const aphasiaOptions = [
    "Broca's",
    "Wernicke's",
    'Global',
    'Anomic',
    'Transcortical Motor',
    'Transcortical Sensory',
    'Conduction',
    'Mixed',
    'Other',
  ];

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

    const ageNum = Number(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setErrorMsg(t('errAgeRequired'));
      setErrorField('age');
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
      await registerPatient(formData);
      setRegistered(true);
    } catch (err) {
      const formatted = formatAuthError(err, t);
      setErrorMsg(formatted.message);
      setErrorField(formatted.field);
    } finally {
      setSubmitting(false);
    }
  };

  // Post-Registration View: Registration Successful -> Continue to Login
  if (registered) {
    return (
      <div className="center-view animate-fade-in" style={{ padding: '2rem 1rem' }}>
        <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.2rem 1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-green-light)',
            color: 'var(--color-green)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.2rem',
          }}>
            <CheckCircle2 size={36} />
          </div>
          <h2>{t('registrationSuccessful')}</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
            Your patient account has been created. Please sign in to proceed.
          </p>

          <Button
            onClick={() => navigate('/patient/login')}
            size="large"
            style={{ width: '100%' }}
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
      <Card style={{ maxWidth: '560px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <VoiceBackLogo width="200px" />
          </div>
          <h2>{t('patientRegisterTitle')}</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Patient setup and communication profile registration.
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
              placeholder={t('fullNamePlaceholder')}
              required
            />
            {errorField === 'fullName' && <span className="field-error-msg">{errorMsg}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="form-group">
              <label className="form-label">{t('ageLabel')} *</label>
              <input
                type="number"
                name="age"
                className={`form-input ${errorField === 'age' ? 'field-error' : ''}`}
                value={formData.age}
                onChange={handleChange}
                placeholder={t('agePlaceholder')}
                min="1"
                max="120"
                required
              />
              {errorField === 'age' && <span className="field-error-msg">{errorMsg}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('genderLabel')}</label>
              <select
                name="gender"
                className="form-select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div className="form-group">
              <label className="form-label">{t('aphasiaTypeLabel')} *</label>
              <select
                name="aphasiaType"
                className="form-select"
                value={formData.aphasiaType}
                onChange={handleChange}
                required
              >
                {aphasiaOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('preferredLangLabel')}</label>
              <select
                name="preferredLanguage"
                className="form-select"
                value={formData.preferredLanguage}
                onChange={handleChange}
              >
                <option value="English">English</option>
                <option value="Kannada">Kannada</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('emergencyContactLabel')}</label>
            <input
              type="tel"
              name="emergencyContact"
              className="form-input"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="+1 (555) 019-2834"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('emailLabel')} *</label>
            <input
              type="email"
              name="email"
              className={`form-input ${errorField === 'email' ? 'field-error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder={t('emailPlaceholder')}
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
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            <span>{t('submitContinue')}</span>
            <ArrowRight size={20} />
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          <Link
            to="/patient/login"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-blue)',
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
