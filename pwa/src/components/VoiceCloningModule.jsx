import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowLeft,
  Mic,
  Brain,
  Settings,
  Upload,
  UserCheck,
  ArrowRight,
  Info,
  Home,
  User,
  LogOut,
  Radio,
  Sliders,
  Volume2,
  Lock,
  Heart
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const VoiceCloningModule = ({
  initialProfile,
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [currentStep, setCurrentStep] = useState('home'); // 'home' | 'about' | 'collection' | 'status' | 'settings'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastSpokenRef = useRef(null);

  // Sync profile data & avatar from localStorage
  const [patientData] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voiceback_current_user') || 'null');
      if (stored && stored.fullName) return stored;
    } catch (e) {
      // ignore
    }
    return { fullName: 'Srividya Raman' };
  });

  const [avatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem('voiceback_patient_avatar') || '';
    } catch (e) {
      return '';
    }
  });

  const firstLetter = patientData.fullName ? patientData.fullName.trim().charAt(0).toUpperCase() : 'S';

  // Dynamic state ready for GET /api/voice-profiles REST API payload
  const [voiceModelProfile] = useState(initialProfile || {
    status: 'Not Created',
    preferredVoice: "Patient's Own Voice",
    voiceSpeed: 'Default',
    voiceVolume: 'Default',
    samplesCount: 0,
  });

  // Voice Assistant: Speak once per screen step
  useEffect(() => {
    if (!voiceAssistant || !speak) return;

    if (currentStep === 'home' && lastSpokenRef.current !== 'home') {
      lastSpokenRef.current = 'home';
      speak('Welcome to Voice Cloning.');
    } else if (currentStep === 'about' && lastSpokenRef.current !== 'about') {
      lastSpokenRef.current = 'about';
      speak('Learn how VoiceBack creates your personalized voice model.');
    } else if (currentStep === 'collection' && lastSpokenRef.current !== 'collection') {
      lastSpokenRef.current = 'collection';
      speak('Voice samples will help create your personalized voice.');
    } else if (currentStep === 'status' && lastSpokenRef.current !== 'status') {
      lastSpokenRef.current = 'status';
      speak('Your voice model status is currently Not Created.');
    } else if (currentStep === 'settings' && lastSpokenRef.current !== 'settings') {
      lastSpokenRef.current = 'settings';
      speak('Manage your voice preferences.');
    }
  }, [currentStep, voiceAssistant, speak]);

  const handleStepChange = (nextStep) => {
    setCurrentStep(nextStep);
    setIsDrawerOpen(false);
  };

  // Main Action Cards
  const cards = [
    {
      id: 'about',
      title: 'About Voice Cloning',
      desc: 'Learn how VoiceBack creates your personalized voice.',
      icon: Info,
      step: 'about',
    },
    {
      id: 'collection',
      title: 'Voice Sample Collection',
      desc: 'Record or upload voice samples.',
      icon: Mic,
      step: 'collection',
    },
    {
      id: 'status',
      title: 'Voice Model Status',
      desc: 'Check whether your voice model has been created.',
      icon: Brain,
      step: 'status',
    },
    {
      id: 'settings',
      title: 'Voice Settings',
      desc: 'Manage voice preferences.',
      icon: Settings,
      step: 'settings',
    },
  ];

  // Drawer items
  const drawerItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => onBackToDashboard(),
      isActive: false,
    },
    {
      id: 'voice-cloning-home',
      label: 'Voice Cloning',
      icon: UserCheck,
      action: () => handleStepChange('home'),
      isActive: currentStep === 'home',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      action: () => onOpenProfile(),
      isActive: false,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        setIsDrawerOpen(false);
        setIsSettingsOpen(true);
      },
      isActive: false,
    },
  ];

  return (
    <div className="app-viewport">
      <div className="mobile-container voice-cloning-container">
        
        {/* LEFT SLIDE NAVIGATION DRAWER */}
        <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        <aside className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`} aria-label="Navigation Drawer">
          <div className="drawer-header">
            <VoiceBackLogo variant="header" />
            <button
              type="button"
              className="btn-close-sheet"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close Navigation Menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="drawer-user-badge" onClick={onOpenProfile}>
            <div className="drawer-avatar-circle">
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt={patientData.fullName} className="drawer-avatar-img" />
              ) : (
                <span>{firstLetter}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{patientData.fullName}</h4>
              <span className="drawer-user-role">Patient</span>
            </div>
            <ArrowRight size={16} color="var(--color-brand-tagline)" />
          </div>

          <nav className="drawer-menu-list">
            {drawerItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`drawer-menu-item ${item.isActive ? 'active' : ''}`}
                  onClick={item.action}
                >
                  <ItemIcon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="drawer-footer">
            <button
              type="button"
              className="drawer-logout-btn"
              onClick={() => {
                setIsDrawerOpen(false);
                if (onLogout) onLogout();
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* STEP 1: VOICE CLONING HOME */}
        {currentStep === 'home' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  type="button"
                  className="settings-btn"
                  aria-label="Return to Dashboard"
                  title="Return to Dashboard"
                  onClick={onBackToDashboard}
                >
                  <ArrowLeft size={22} />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  Voice Cloning
                </h1>
              </div>

              <button
                type="button"
                className="header-profile-avatar-btn"
                aria-label={`Patient Profile for ${patientData.fullName}`}
                onClick={onOpenProfile}
              >
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt={patientData.fullName} className="header-avatar-img" />
                ) : (
                  <span className="header-avatar-initial">{firstLetter}</span>
                )}
              </button>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
              <section className="welcome-compact-section">
                <p className="welcome-subtitle" style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', fontWeight: 600, lineHeight: 1.45 }}>
                  Create a personalized voice model that can help reproduce your natural voice during communication.
                </p>
              </section>

              {/* 4 CARDS */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                {cards.map((card) => {
                  const CardIcon = card.icon;
                  return (
                    <div
                      key={card.id}
                      tabIndex={0}
                      role="button"
                      aria-label={card.title}
                      className="action-card"
                      onClick={() => handleStepChange(card.step)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStepChange(card.step);
                        }
                      }}
                      style={{ minHeight: 'auto', padding: '1.15rem' }}
                    >
                      <div className="action-card-header">
                        <div className="action-icon-box">
                          <CardIcon size={22} />
                        </div>
                        <ArrowRight size={18} className="action-arrow-icon" />
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <h3 className="action-card-title" style={{ fontSize: '1.1rem' }}>{card.title}</h3>
                        <p className="action-card-desc">{card.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </section>
            </main>
          </>
        )}

        {/* STEP 2: ABOUT VOICE CLONING */}
        {currentStep === 'about' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Voice Cloning Home"
                onClick={() => handleStepChange('home')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                About Voice Cloning
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ width: '100%', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(2, 132, 199, 0.12)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                      What is Voice Cloning?
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-blue-primary)', fontWeight: 700 }}>
                      Personalized Voice Identity
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.925rem', color: 'var(--color-brand-tagline)', lineHeight: 1.55 }}>
                  <p>
                    VoiceBack uses AI to learn the unique characteristics and cadence of your natural voice.
                  </p>
                  <p>
                    When your voice model is available, it will be used during daily communication to convert decoded sEMG speech attempts into your distinct vocal sound.
                  </p>
                  <p style={{ fontWeight: 600, color: 'var(--color-brand-title)' }}>
                    This feature helps preserve your unique identity and personal connection with family and healthcare providers.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-continue"
                  onClick={() => handleStepChange('home')}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  <span>Return to Voice Cloning</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* STEP 3: VOICE SAMPLE COLLECTION */}
        {currentStep === 'collection' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Voice Cloning Home"
                onClick={() => handleStepChange('home')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Voice Sample Collection
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  Collect Voice Samples
                </h2>
                <p style={{ fontSize: '0.925rem', color: 'var(--color-brand-tagline)', lineHeight: 1.45 }}>
                  To create your personalized voice model, voice samples will be required.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', width: '100%' }}>
                  <button
                    type="button"
                    className="btn-continue"
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Mic size={18} />
                    <span>Record Voice (Pending AI Integration)</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-auth"
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Upload size={18} />
                    <span>Upload Audio (Pending Backend Integration)</span>
                  </button>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px dashed var(--border-color)', textAlign: 'center', marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 500, lineHeight: 1.45 }}>
                    • Voice recording will be available after AI integration.<br />
                    • Audio upload will be available after backend integration.
                  </p>
                </div>
              </div>
            </main>
          </>
        )}

        {/* STEP 4: VOICE MODEL STATUS */}
        {currentStep === 'status' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Voice Cloning Home"
                onClick={() => handleStepChange('home')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Voice Model Status
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ width: '100%', gap: '1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                    Voice Model
                  </h2>
                  <span className="device-name-badge disconnected" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                    {voiceModelProfile.status}
                  </span>
                </div>

                <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.04)', border: '1px solid var(--border-color)' }}>
                  <span className="profile-field-label">Status Overview</span>
                  <p style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--color-brand-title)', marginTop: '0.25rem', lineHeight: 1.45 }}>
                    Your personalized voice model has not been created yet.
                  </p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', marginTop: '0.5rem', lineHeight: 1.45 }}>
                    After sufficient voice samples are collected, AI will generate your voice model.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-continue"
                  onClick={() => handleStepChange('home')}
                  style={{ width: '100%' }}
                >
                  <span>Back to Voice Cloning</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* STEP 5: VOICE SETTINGS */}
        {currentStep === 'settings' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Voice Cloning Home"
                onClick={() => handleStepChange('home')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Voice Settings
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  Voice Preferences
                </h2>

                <div className="device-status-grid">
                  <div className="device-status-item">
                    <span className="device-label">Preferred Voice</span>
                    <span className="device-val">{voiceModelProfile.preferredVoice}</span>
                  </div>

                  <div className="device-status-item">
                    <span className="device-label">Voice Speed</span>
                    <span className="device-val">{voiceModelProfile.voiceSpeed}</span>
                  </div>

                  <div className="device-status-item">
                    <span className="device-label">Voice Volume</span>
                    <span className="device-val">{voiceModelProfile.voiceVolume}</span>
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 500 }}>
                    These settings are placeholders and will be configured after AI integration.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-continue"
                  onClick={() => handleStepChange('home')}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  <span>Back to Voice Cloning</span>
                </button>
              </div>
            </main>
          </>
        )}

      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default VoiceCloningModule;
