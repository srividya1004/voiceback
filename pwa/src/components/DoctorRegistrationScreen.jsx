import React, { useState } from 'react';
import { Stethoscope, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import PasswordInput from './PasswordInput';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';

export const DoctorRegistrationScreen = ({ onBack, onSuccess, onSignInClick }) => {
  const { t } = useSettings();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    gender: 'Male',
    licenseNumber: '',
    hospitalName: '',
    specialization: 'Speech Language Pathologist',
    yearsExperience: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const specializations = [
    'Neurologist',
    'Speech Language Pathologist',
    'Rehabilitation Specialist',
    'ENT Specialist',
    'General Physician',
    'Other',
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.trim().replace(/\D/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit Indian mobile number';
    }

    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'Medical Registration / License Number is required';
    }

    if (!formData.hospitalName.trim()) {
      newErrors.hospitalName = 'Hospital / Clinic Name is required';
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const doctorProfile = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      gender: formData.gender,
      licenseNumber: formData.licenseNumber.trim(),
      hospital: formData.hospitalName.trim(),
      specialization: formData.specialization,
      yearsExperience: formData.yearsExperience.trim(),
      password: formData.password,
      doctorId: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    await authService.registerDoctor(doctorProfile);
    onSuccess(doctorProfile);
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container auth-container" style={{ maxWidth: '520px' }}>
        
        {/* Header Bar: Top Left Back Arrow, Top Right VoiceBack Logo */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="settings-btn"
            aria-label="Return to Login"
            title="Return to Login"
            onClick={onSignInClick || onBack}
          >
            <ArrowLeft size={22} />
          </button>
          <VoiceBackLogo variant="header" />
        </header>

        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* Title Section */}
          <div className="role-title-section text-center" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto' }}>
              <Stethoscope size={26} />
            </div>
            <h1 className="role-main-title">Doctor Registration</h1>
            <p className="role-subtitle">
              Create your clinical account to manage patients and rehabilitation sessions.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
            
            {/* SECTION 1: PERSONAL INFORMATION */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
              <h3 className="profile-section-title" style={{ color: 'var(--color-green-primary)' }}>Personal Information</h3>

              <div className="profile-field-group">
                <span className="profile-field-label">Full Name *</span>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Dr. Rajesh Sharma"
                />
                {errors.fullName && <span style={{ color: '#DC2626', fontSize: '0.775rem', fontWeight: 600 }}>{errors.fullName}</span>}
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Email Address *</span>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="doctor@hospital.health"
                />
                {errors.email && <span style={{ color: '#DC2626', fontSize: '0.775rem', fontWeight: 600 }}>{errors.email}</span>}
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Mobile Number *</span>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.mobileNumber}
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  placeholder="+91 98765 43210"
                />
                {errors.mobileNumber && <span style={{ color: '#DC2626', fontSize: '0.775rem', fontWeight: 600 }}>{errors.mobileNumber}</span>}
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Gender *</span>
                <select
                  className="form-input select-input"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </section>

            {/* SECTION 2: PROFESSIONAL INFORMATION */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
              <h3 className="profile-section-title" style={{ color: 'var(--color-green-primary)' }}>Professional Information</h3>

              <div className="profile-field-group">
                <span className="profile-field-label">Medical Registration / License Number *</span>
                <input
                  type="text"
                  className="form-input"
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  placeholder="MCI-123456 / REG-7049"
                />
                {errors.licenseNumber && <span style={{ color: '#DC2626', fontSize: '0.775rem', fontWeight: 600 }}>{errors.licenseNumber}</span>}
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Hospital / Clinic Name *</span>
                <input
                  type="text"
                  className="form-input"
                  value={formData.hospitalName}
                  onChange={(e) => handleChange('hospitalName', e.target.value)}
                  placeholder="AIIMS Rehabilitation Center"
                />
                {errors.hospitalName && <span style={{ color: '#DC2626', fontSize: '0.775rem', fontWeight: 600 }}>{errors.hospitalName}</span>}
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Specialization *</span>
                <select
                  className="form-input select-input"
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                >
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                {errors.specialization && <span style={{ color: '#DC2626', fontSize: '0.775rem', fontWeight: 600 }}>{errors.specialization}</span>}
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Years of Experience (Optional)</span>
                <input
                  type="number"
                  className="form-input"
                  value={formData.yearsExperience}
                  onChange={(e) => handleChange('yearsExperience', e.target.value)}
                  placeholder="e.g. 12"
                  min="0"
                  max="60"
                />
              </div>
            </section>

            {/* SECTION 3: ACCOUNT & SECURITY */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
              <h3 className="profile-section-title" style={{ color: 'var(--color-green-primary)' }}>Account</h3>

              <div className="profile-field-group">
                <span className="profile-field-label">Password *</span>
                <PasswordInput
                  id="doctor-reg-password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                />
                {errors.password && <span style={{ color: '#DC2626', fontSize: '0.775rem', fontWeight: 600 }}>{errors.password}</span>}
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Confirm Password *</span>
                <PasswordInput
                  id="doctor-reg-confirmpassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <span style={{ color: '#DC2626', fontSize: '0.775rem', fontWeight: 600 }}>{errors.confirmPassword}</span>}
              </div>
            </section>

            {/* FORM ACTIONS */}
            <button
              type="submit"
              className="btn-continue"
              style={{ width: '100%', background: 'var(--color-green-primary)', marginTop: '0.25rem' }}
            >
              <span>Create Account</span>
            </button>

            <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-brand-tagline)' }}>
                Already have an account?{' '}
              </span>
              <button
                type="button"
                onClick={onSignInClick || onBack}
                style={{ background: 'none', border: 'none', color: 'var(--color-green-primary)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Login
              </button>
            </div>
          </form>

        </main>
      </div>
    </div>
  );
};

export default DoctorRegistrationScreen;
