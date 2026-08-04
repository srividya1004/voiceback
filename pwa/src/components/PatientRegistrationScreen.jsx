import React, { useState, useMemo } from 'react';
import { ArrowLeft, Settings, Eye, EyeOff, CheckCircle } from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import PasswordInput from './PasswordInput';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';

export const PatientRegistrationScreen = ({ onBack, onSuccess, onSignInClick }) => {
  const { t, language, setLanguage, voiceAssistant, speak } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    mobileNumber: '',
    email: '',
    aphasiaType: '',
    preferredLanguage: language || 'english',
    password: '',
    confirmPassword: '',
    caregiverAccountId: '',
  });

  // Track touched fields for real-time validation feedback
  const [touched, setTouched] = useState({});

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Touch / Focus audio assistance
  const handleFieldSpeak = (textKey) => {
    if (voiceAssistant && speak) {
      speak(t(textKey) || textKey);
    }
  };

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFullNameChange = (e) => {
    setFormData((prev) => ({ ...prev, fullName: e.target.value }));
    markTouched('fullName');
  };

  const handleAgeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, age: val }));
    markTouched('age');
  };

  const handleMobileChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 0 && !['6', '7', '8', '9'].includes(val[0])) {
      val = '';
    }
    if (val.length > 10) {
      val = val.slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, mobileNumber: val }));
    markTouched('mobileNumber');
  };

  const handleEmailChange = (e) => {
    setFormData((prev) => ({ ...prev, email: e.target.value }));
    markTouched('email');
  };

  const handleGenderChange = (e) => {
    setFormData((prev) => ({ ...prev, gender: e.target.value }));
    markTouched('gender');
  };

  const handleAphasiaChange = (e) => {
    setFormData((prev) => ({ ...prev, aphasiaType: e.target.value }));
    markTouched('aphasiaType');
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setFormData((prev) => ({ ...prev, preferredLanguage: newLang }));
    markTouched('preferredLanguage');
    if (setLanguage) {
      setLanguage(newLang);
    }
  };

  const handlePasswordChange = (e) => {
    setFormData((prev) => ({ ...prev, password: e.target.value }));
    markTouched('password');
  };

  const handleConfirmPasswordChange = (e) => {
    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }));
    markTouched('confirmPassword');
  };

  const handleCaregiverChange = (e) => {
    setFormData((prev) => ({ ...prev, caregiverAccountId: e.target.value }));
  };

  // Real-time Field Error Messages
  const getFieldError = (field) => {
    if (!touched[field]) return null;

    switch (field) {
      case 'fullName':
        if (!formData.fullName.trim()) return 'Full Name is required.';
        return null;
      case 'age':
        if (!formData.age) return 'Age is required.';
        const ageNum = parseInt(formData.age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) return 'Age must be between 1 and 120.';
        return null;
      case 'gender':
        if (!formData.gender) return 'Gender is required.';
        return null;
      case 'mobileNumber':
        if (!formData.mobileNumber) return 'Mobile Number is required.';
        if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) {
          return 'Mobile number must contain exactly 10 digits and start with 6, 7, 8 or 9.';
        }
        return null;
      case 'email':
        if (!formData.email.trim()) return 'Email Address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
          return 'Email address is invalid.';
        }
        return null;
      case 'password':
        if (!formData.password) return 'Password is required.';
        if (formData.password.length < 8) return 'Password must contain at least 8 characters.';
        return null;
      case 'confirmPassword':
        if (!formData.confirmPassword) return 'Confirm Password is required.';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
        return null;
      case 'aphasiaType':
        if (!formData.aphasiaType) return 'Type of Aphasia is required.';
        return null;
      case 'preferredLanguage':
        if (!formData.preferredLanguage) return 'Preferred Language is required.';
        return null;
      default:
        return null;
    }
  };

  // Overall Form Validation Check
  const isFullNameValid = formData.fullName.trim().length > 0;
  const ageNum = parseInt(formData.age, 10);
  const isAgeValid = !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120;
  const isGenderValid = formData.gender !== '';
  const isMobileValid = /^[6-9]\d{9}$/.test(formData.mobileNumber);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isAphasiaValid = formData.aphasiaType !== '';
  const isLanguageValid = formData.preferredLanguage !== '';
  const isPasswordValid = formData.password.length >= 8;
  const isConfirmPasswordValid =
    formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  const isFormValid = useMemo(() => {
    return (
      isFullNameValid &&
      isAgeValid &&
      isGenderValid &&
      isMobileValid &&
      isEmailValid &&
      isAphasiaValid &&
      isLanguageValid &&
      isPasswordValid &&
      isConfirmPasswordValid
    );
  }, [
    isFullNameValid,
    isAgeValid,
    isGenderValid,
    isMobileValid,
    isEmailValid,
    isAphasiaValid,
    isLanguageValid,
    isPasswordValid,
    isConfirmPasswordValid,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    await authService.registerPatient(formData);
    setIsSubmittedSuccess(true);
  };

  const handleContinueToLogin = () => {
    if (onSuccess) {
      onSuccess(formData);
    } else if (onSignInClick) {
      onSignInClick();
    }
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container registration-container">
        {/* Header Bar */}
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
        <div className="role-title-section text-compact text-center" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
          <h1 className="role-main-title">Patient Registration</h1>
          <p className="role-subtitle">Create your VoiceBack account to begin your recovery journey.</p>
        </div>

        {/* Main Section */}
        <main className="role-main registration-main">
          {isSubmittedSuccess ? (
            /* SUCCESS STATE CARD (Strictly displays "Continue to Login") */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                gap: '1rem',
                margin: 'auto 0',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
              }}
            >
              <CheckCircle size={56} style={{ color: 'var(--color-green-primary)' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Registration Successful
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', lineHeight: 1.5 }}>
                Your account has been created successfully.
              </p>
              <button
                type="button"
                className="btn-continue"
                onClick={handleContinueToLogin}
                style={{ marginTop: '0.75rem', width: '100%' }}
              >
                <span>Continue to Login</span>
              </button>
            </div>
          ) : (
            /* SINGLE VERTICAL REGISTRATION FORM WITH REAL-TIME VALIDATION */
            <form
              className="registration-continuous-form"
              onSubmit={handleSubmit}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}
            >
              {/* 1. Full Name * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-fullname">
                  Full Name *
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleFullNameChange}
                  onBlur={() => markTouched('fullName')}
                  onFocus={() => handleFieldSpeak('fullName')}
                  required
                />
                {getFieldError('fullName') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('fullName')}
                  </span>
                )}
              </div>

              {/* 2. Age * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-age">
                  Age *
                </label>
                <input
                  id="reg-age"
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="1 - 120"
                  value={formData.age}
                  onChange={handleAgeChange}
                  onBlur={() => markTouched('age')}
                  onFocus={() => handleFieldSpeak('age')}
                  required
                />
                {getFieldError('age') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('age')}
                  </span>
                )}
              </div>

              {/* 3. Gender * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-gender">
                  Gender *
                </label>
                <select
                  id="reg-gender"
                  className="form-input select-input"
                  value={formData.gender}
                  onChange={handleGenderChange}
                  onBlur={() => markTouched('gender')}
                  required
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {getFieldError('gender') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('gender')}
                  </span>
                )}
              </div>

              {/* 4. Mobile Number * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-mobile">
                  Mobile Number *
                </label>
                <input
                  id="reg-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="form-input"
                  placeholder="10 digits (starts with 6, 7, 8, 9)"
                  value={formData.mobileNumber}
                  onChange={handleMobileChange}
                  onBlur={() => markTouched('mobileNumber')}
                  onFocus={() => handleFieldSpeak('mobileNumber')}
                  required
                />
                {getFieldError('mobileNumber') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('mobileNumber')}
                  </span>
                )}
              </div>

              {/* 5. Email Address * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  Email Address *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleEmailChange}
                  onBlur={() => markTouched('email')}
                  onFocus={() => handleFieldSpeak('emailAddress')}
                  required
                />
                {getFieldError('email') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('email')}
                  </span>
                )}
              </div>

              {/* 6. Password * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Password *
                </label>
                <PasswordInput
                  id="reg-password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  onBlur={() => markTouched('password')}
                  onFocus={() => handleFieldSpeak('password')}
                  placeholder="Min 8 characters"
                  required
                />
                {getFieldError('password') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('password')}
                  </span>
                )}
              </div>

              {/* 7. Confirm Password * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirmpassword">
                  Confirm Password *
                </label>
                <PasswordInput
                  id="reg-confirmpassword"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={() => markTouched('confirmPassword')}
                  onFocus={() => handleFieldSpeak('confirmPassword')}
                  placeholder="Confirm password"
                  required
                />
                {getFieldError('confirmPassword') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('confirmPassword')}
                  </span>
                )}
              </div>

              {/* 8. Type of Aphasia * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-aphasia">
                  Type of Aphasia *
                </label>
                <select
                  id="reg-aphasia"
                  className="form-input select-input"
                  value={formData.aphasiaType}
                  onChange={handleAphasiaChange}
                  onBlur={() => markTouched('aphasiaType')}
                  required
                >
                  <option value="" disabled>Select Type of Aphasia</option>
                  <option value="Broca's Aphasia">Broca's Aphasia</option>
                  <option value="Wernicke's Aphasia">Wernicke's Aphasia</option>
                </select>
                {getFieldError('aphasiaType') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('aphasiaType')}
                  </span>
                )}
              </div>

              {/* 9. Preferred Language * */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-language">
                  Preferred Language *
                </label>
                <select
                  id="reg-language"
                  className="form-input select-input"
                  value={formData.preferredLanguage}
                  onChange={handleLanguageChange}
                  onBlur={() => markTouched('preferredLanguage')}
                  required
                >
                  <option value="" disabled>Select Preferred Language</option>
                  <option value="english">English</option>
                  <option value="kannada">Kannada</option>
                  <option value="hindi">Hindi</option>
                </select>
                {getFieldError('preferredLanguage') && (
                  <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600, marginTop: '0.15rem' }}>
                    {getFieldError('preferredLanguage')}
                  </span>
                )}
              </div>

              {/* 10. Caregiver Account ID (Optional) */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-caregiver">
                  Caregiver Account ID (Optional)
                </label>
                <input
                  id="reg-caregiver"
                  type="text"
                  className="form-input"
                  placeholder="Caregiver Account ID (Optional)"
                  value={formData.caregiverAccountId}
                  onChange={handleCaregiverChange}
                />
              </div>

              {/* Bottom Actions */}
              <div className="continuous-registration-actions" style={{ marginTop: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn-continue btn-create-account"
                  disabled={!isFormValid}
                  onFocus={() => handleFieldSpeak('createAccount')}
                >
                  <span>Create Account</span>
                </button>

                {onSignInClick && (
                  <button
                    type="button"
                    className="btn-secondary-auth btn-signin-link"
                    onClick={onSignInClick}
                    style={{ border: 'none', background: 'transparent', color: 'var(--color-blue-primary)', textDecoration: 'underline' }}
                  >
                    <span>Already have an account? Sign In</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </main>
      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default PatientRegistrationScreen;
