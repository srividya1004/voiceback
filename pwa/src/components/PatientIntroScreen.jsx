import React, { useState, useEffect } from 'react';
import { Settings, ArrowRight, FastForward } from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';
import voiceService from '../services/voiceService';
import avatarImg from '../assets/healthcare_avatar.png';

export const PatientIntroScreen = ({ onComplete, noticeMessage }) => {
  const { t, voiceAssistant, language, speak } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Trigger avatar speech ALWAYS for Patient Introduction (Onboarding) regardless of voiceAssistant toggle state
  useEffect(() => {
    const welcomeText = t('welcomeMessage');
    if (!welcomeText) return;

    setIsSpeaking(true);
    voiceService.speakNativeTTS(welcomeText, {
      language: language === 'hindi' ? 'Hindi' : language === 'kannada' ? 'Kannada' : 'English',
      rate: 0.95,
      pitch: 1.05,
    }).then(() => {
      setIsSpeaking(false);
    }).catch(() => {
      setIsSpeaking(false);
    });

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    };
  }, [language, t]);

  const handleFinishIntro = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    authService.setPatientIntroCompleted();
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container">
        {/* Header Section with Official Transparent Logo */}
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

        {/* Main Content Area: Vertically Centered with Tightly Bound Title, Avatar, and Actions */}
        <main className="role-main intro-main">
          <div className="role-title-section text-center">
            <h1 className="role-main-title">{t('patientIntroTitle')}</h1>
            <p className="role-subtitle">{t('patientIntroSubtitle')}</p>
          </div>

          {/* Center Realistic Animated Healthcare Professional Avatar */}
          <div className="avatar-stage">
            <div className={`avatar-container ${isSpeaking ? 'speaking' : ''}`}>
              <img
                src={avatarImg}
                alt="Healthcare Professional Guide"
                className="avatar-image"
              />
              {/* Mouth overlay animation element */}
              <div className={`avatar-mouth ${isSpeaking ? 'active' : ''}`} />
              <div className="avatar-pulse-ring" />
            </div>
            {isSpeaking && (
              <div className="speaking-indicator">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}
          </div>

          {/* Action Buttons: Immediately below avatar */}
          <div className="intro-action-bar">
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
                marginBottom: '0.5rem',
                width: '100%',
              }}>
                {noticeMessage}
              </div>
            )}
            <button
              type="button"
              className="btn-continue"
              onClick={handleFinishIntro}
            >
              <span>{t('next')}</span>
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              className="btn-secondary-auth margin-top-sm"
              onClick={handleFinishIntro}
            >
              <span>{t('skipIntro')}</span>
              <FastForward size={18} />
            </button>
          </div>
        </main>
      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default PatientIntroScreen;
