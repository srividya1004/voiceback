import React, { useState, useRef } from 'react';
import { User, Stethoscope, Heart, Settings, ArrowRight } from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

/**
 * Screen 2 – Role Selection Screen
 * 
 * Primary choices (Patient, Doctor, Caregiver) speak on hover/focus when Voice Assistant is ON.
 */
export const RoleSelectionScreen = ({ onSelectRole, noticeMessage }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { t, voiceAssistant, speak } = useSettings();
  const lastSpokenRef = useRef(null);

  const roles = [
    {
      id: 'patient',
      title: t('patient'),
      description: t('patientDesc'),
      speakName: t('rolePatientName'),
      icon: User,
      colorClass: 'role-patient',
      primaryColor: '#0284C7',
    },
    {
      id: 'doctor',
      title: t('doctor'),
      description: t('doctorDesc'),
      speakName: t('roleDoctorName'),
      icon: Stethoscope,
      colorClass: 'role-doctor',
      primaryColor: '#16A34A',
    },
    {
      id: 'caregiver',
      title: t('caregiver'),
      description: t('caregiverDesc'),
      speakName: t('roleCaregiverName'),
      icon: Heart,
      colorClass: 'role-caregiver',
      primaryColor: '#EA580C',
    },
  ];

  // Speak ONLY primary interactive choices on hover/focus when Voice Assistant is ON
  const handleRoleFocusOrHover = (roleId, speakName) => {
    if (voiceAssistant && lastSpokenRef.current !== roleId) {
      lastSpokenRef.current = roleId;
      speak(speakName);
    }
  };

  const handleRoleClick = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleKeyDown = (e, roleId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRoleClick(roleId);
    }
  };

  const handleContinue = () => {
    if (selectedRole && onSelectRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container">
        {/* Header Section */}
        <header className="role-header">
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
            <h1 className="role-main-title">{t('chooseYourRole')}</h1>
            <p className="role-subtitle">
              {t('selectRoleSubtitle')}
            </p>
          </div>

          {/* Role Cards List */}
          <div
            className="role-cards-container"
            role="radiogroup"
            aria-label={t('chooseYourRole')}
          >
            {roles.map((role) => {
              const IconComponent = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <div
                  key={role.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`role-card ${role.colorClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleRoleClick(role.id)}
                  onMouseEnter={() => handleRoleFocusOrHover(role.id, role.speakName)}
                  onFocus={() => handleRoleFocusOrHover(role.id, role.speakName)}
                  onKeyDown={(e) => handleKeyDown(e, role.id)}
                >
                  <div className="role-icon-box">
                    <IconComponent size={26} strokeWidth={2.2} />
                  </div>

                  <div className="role-card-content">
                    <div className="role-card-title-row">
                      <span className="role-card-title">{role.title}</span>
                      <div className="role-radio-badge">
                        {isSelected && <div className="role-radio-inner" />}
                      </div>
                    </div>
                    <p className="role-card-desc">{role.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Bottom Action Section */}
        <footer className="role-action-bar">
          {noticeMessage && (
            <div style={{
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              background: 'rgba(2, 132, 199, 0.12)',
              border: '1.5px solid var(--color-blue-primary)',
              color: 'var(--color-blue-primary)',
              fontWeight: 700,
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '0.75rem',
              width: '100%',
            }}>
              {noticeMessage}
            </div>
          )}
          <button
            type="button"
            className="btn-continue"
            disabled={!selectedRole}
            onClick={handleContinue}
          >
            <span>{t('continue')}</span>
            <ArrowRight size={20} strokeWidth={2.5} />
          </button>
        </footer>
      </div>

      {/* Settings Bottom Sheet Component */}
      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default RoleSelectionScreen;
