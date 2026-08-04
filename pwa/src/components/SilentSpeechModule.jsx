import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowLeft,
  Mic,
  Radio,
  Wifi,
  Activity,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowRight,
  RefreshCw,
  Home,
  MessageSquare,
  User,
  Settings,
  AlertTriangle,
  LogOut,
  Info
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import deviceService from '../services/deviceService';

export const SilentSpeechModule = ({
  initialStep = 'silent-speech-home',
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [step, setStep] = useState(initialStep);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState(() => deviceService.getDeviceStatus());
  const lastSpokenStepRef = useRef(null);

  useEffect(() => {
    const unsubscribe = deviceService.subscribe((status) => {
      setDeviceStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // Sync profile data & avatar from localStorage
  const [profileData] = useState(() => {
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

  const firstLetter = profileData.fullName ? profileData.fullName.trim().charAt(0).toUpperCase() : 'S';

  // Voice Assistant: Speak ONLY ONCE per screen step when screen opens
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (lastSpokenStepRef.current === step) return;

    lastSpokenStepRef.current = step;

    switch (step) {
      case 'silent-speech-home':
        speak('Welcome to Silent Speech.');
        break;
      case 'connect-device':
        speak('Connect your wearable device to continue.');
        break;
      case 'ready-to-capture':
        speak('You are ready to begin communication.');
        break;
      case 'listening':
        speak('Listening has started.');
        break;
      case 'recognized-text':
        speak('Speech recognition results will appear here.');
        break;
      case 'generated-voice':
        speak('Voice generation will be available after AI integration.');
        break;
      case 'conversation-history':
        speak('Your conversation history will appear here.');
        break;
      default:
        break;
    }
  }, [step, voiceAssistant, speak]);

  const handleStepChange = (nextStep) => {
    setStep(nextStep);
    setIsDrawerOpen(false);
  };

  // Drawer menu items
  const drawerItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => onBackToDashboard(),
      isActive: false,
    },
    {
      id: 'silent-speech-home',
      label: 'Silent Speech',
      icon: Mic,
      action: () => handleStepChange('silent-speech-home'),
      isActive: step === 'silent-speech-home',
    },
    {
      id: 'connect-device',
      label: 'Connect Device',
      icon: Wifi,
      action: () => handleStepChange('connect-device'),
      isActive: step === 'connect-device',
    },
    {
      id: 'ready-to-capture',
      label: 'Ready to Capture',
      icon: CheckCircle2,
      action: () => handleStepChange('ready-to-capture'),
      isActive: step === 'ready-to-capture',
    },
    {
      id: 'listening',
      label: 'Listening',
      icon: Activity,
      action: () => handleStepChange('listening'),
      isActive: step === 'listening',
    },
    {
      id: 'conversation-history',
      label: 'Conversation History',
      icon: MessageSquare,
      action: () => handleStepChange('conversation-history'),
      isActive: step === 'conversation-history',
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
      <div className="mobile-container silent-speech-container">
        
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
                <img src={avatarDataUrl} alt={profileData.fullName} className="drawer-avatar-img" />
              ) : (
                <span>{firstLetter}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{profileData.fullName}</h4>
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

        {/* SCREEN 1: SILENT SPEECH HOME */}
        {step === 'silent-speech-home' && (
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
                  Silent Speech
                </h1>
              </div>

              <button
                type="button"
                className="header-profile-avatar-btn"
                aria-label={`Patient Profile for ${profileData.fullName}`}
                onClick={onOpenProfile}
              >
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt={profileData.fullName} className="header-avatar-img" />
                ) : (
                  <span className="header-avatar-initial">{firstLetter}</span>
                )}
              </button>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
              <section className="welcome-compact-section">
                <p className="welcome-subtitle" style={{ fontSize: '1rem', color: 'var(--color-brand-title)', fontWeight: 700 }}>
                  Communicate naturally using your VoiceBack wearable device.
                </p>
              </section>

              {/* DEVICE STATUS CARD */}
              <section className="device-status-card">
                <div className="device-status-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Radio size={18} color="var(--color-brand-tagline)" />
                    <h3 className="device-status-title">Wearable Device</h3>
                  </div>
                  <span className="device-name-badge disconnected">Not Connected</span>
                </div>

                <div style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-title)' }}>
                    Your wearable device is not connected.
                  </p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)' }}>
                    Connect the device to begin communication.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-continue"
                  onClick={() => handleStepChange('connect-device')}
                  style={{ width: '100%' }}
                >
                  <Wifi size={18} />
                  <span>Connect Device</span>
                </button>
              </section>

              {/* RECENT CONVERSATIONS (EMPTY STATE) */}
              <section className="recent-activity-card">
                <div className="recent-activity-header">
                  <Info size={18} color="var(--color-blue-primary)" />
                  <h3>Recent Conversations</h3>
                </div>

                <div className="recent-activity-empty-state">
                  <p className="empty-state-title">No conversations available.</p>
                  <p className="empty-state-desc">
                    Your conversation history will appear here after using Silent Speech.
                  </p>
                </div>
              </section>
            </main>
          </>
        )}

        {/* SCREEN 2: CONNECT DEVICE */}
        {step === 'connect-device' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Silent Speech Home"
                onClick={() => handleStepChange('silent-speech-home')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Connect Device
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              {/* Illustration Placeholder */}
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'rgba(2, 132, 199, 0.1)',
                  border: '2px solid var(--color-blue-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '1rem',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)',
                }}
              >
                <Radio size={48} color="var(--color-blue-primary)" />
              </div>

              <div style={{ textAlign: 'center', maxWidth: '340px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brand-title)', marginBottom: '0.4rem' }}>
                  Wearable Device
                </h2>
                <p style={{ fontSize: '0.925rem', color: 'var(--color-brand-tagline)', lineHeight: 1.45 }}>
                  To begin communication, connect your VoiceBack Neckband.
                </p>
              </div>

              <div className="profile-section-card" style={{ width: '100%', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
                <span className="profile-field-label">Current Status</span>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                  Not Connected
                </span>
                
                <button
                  type="button"
                  className="btn-continue"
                  onClick={() => handleStepChange('ready-to-capture')}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  <Wifi size={18} />
                  <span>Search Device</span>
                </button>
              </div>

              <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px dashed var(--border-color)', textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 500 }}>
                  Device connection will be available after firmware integration.
                </p>
              </div>
            </main>
          </>
        )}

        {/* SCREEN 3: READY TO CAPTURE */}
        {step === 'ready-to-capture' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Connect Device"
                onClick={() => handleStepChange('connect-device')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Silent Speech
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ textAlign: 'center', width: '100%', padding: '2rem 1.25rem', gap: '1rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)', border: '2px solid var(--color-green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <CheckCircle2 size={36} color="var(--color-green-primary)" />
                </div>

                <div>
                  <span className="device-name-badge" style={{ background: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green-primary)', fontSize: '0.85rem' }}>
                    Ready
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-title)', marginTop: '0.5rem', marginBottom: '0.35rem' }}>
                    Ready to Capture
                  </h2>
                  <p style={{ fontSize: '0.925rem', color: 'var(--color-brand-tagline)', lineHeight: 1.45 }}>
                    Your wearable device is ready. Press <strong>Start Listening</strong> to begin.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-continue"
                  onClick={() => handleStepChange('listening')}
                  style={{ width: '100%', marginTop: '0.75rem' }}
                >
                  <Mic size={20} />
                  <span>Start Listening</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* SCREEN 4: LISTENING */}
        {step === 'listening' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Ready"
                onClick={() => handleStepChange('ready-to-capture')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Listening
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              {/* Clean Listening Pulse Animation */}
              <div className="listening-stage">
                <div className="listening-mic-circle">
                  <Mic size={48} color="#FFFFFF" />
                </div>
                <div className="listening-pulse-ring ring-1" />
                <div className="listening-pulse-ring ring-2" />
                <div className="listening-pulse-ring ring-3" />
              </div>

              <div style={{ textAlign: 'center' }}>
                <span className="placeholder-badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: 'var(--color-blue-primary)' }}>
                  Active Listening
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-brand-title)', marginTop: '0.4rem' }}>
                  Listening...
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', marginTop: '0.35rem' }}>
                  Waiting for EMG signal...
                </p>
              </div>

              <button
                type="button"
                className="btn-danger-logout"
                onClick={() => handleStepChange('recognized-text')}
                style={{ width: '100%', maxWidth: '360px', marginTop: '1rem' }}
              >
                <Activity size={18} />
                <span>Stop Listening</span>
              </button>
            </main>
          </>
        )}

        {/* SCREEN 5: RECOGNIZED TEXT */}
        {step === 'recognized-text' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Listening"
                onClick={() => handleStepChange('listening')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Recognized Text
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
                <h3 className="profile-section-title">Recognized Speech</h3>

                <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.04)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    No speech detected yet.
                  </p>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px dashed var(--border-color)' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', textAlign: 'center', lineHeight: 1.4 }}>
                    Speech recognition will be available after AI integration.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', width: '100%' }}>
                  <button
                    type="button"
                    className="btn-secondary-auth"
                    onClick={() => handleStepChange('listening')}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <RefreshCw size={16} />
                    <span>Listen Again</span>
                  </button>

                  <button
                    type="button"
                    className="btn-continue"
                    onClick={() => handleStepChange('generated-voice')}
                    style={{ flex: 1 }}
                  >
                    <span>Continue</span>
                  </button>
                </div>
              </div>
            </main>
          </>
        )}

        {/* SCREEN 6: GENERATED VOICE */}
        {step === 'generated-voice' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Recognized Text"
                onClick={() => handleStepChange('recognized-text')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Generated Voice
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
                <h3 className="profile-section-title">Voice Output</h3>

                <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.04)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-brand-title)', lineHeight: 1.5 }}>
                    Voice generation is not available yet.<br />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)' }}>
                      This feature will be enabled after AI integration.
                    </span>
                  </p>
                </div>

                {/* Disabled Play Voice Button */}
                <button
                  type="button"
                  className="btn-secondary-auth"
                  disabled
                  style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <VolumeX size={18} />
                  <span>Play Voice (Pending AI Integration)</span>
                </button>

                <button
                  type="button"
                  className="btn-continue"
                  onClick={() => handleStepChange('conversation-history')}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  <span>Go to Conversation History</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* SCREEN 7: CONVERSATION HISTORY */}
        {step === 'conversation-history' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Generated Voice"
                onClick={() => handleStepChange('generated-voice')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Conversation History
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="recent-activity-card" style={{ width: '100%' }}>
                <div className="recent-activity-header">
                  <Info size={18} color="var(--color-blue-primary)" />
                  <h3>Conversation History</h3>
                </div>

                <div className="recent-activity-empty-state" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <p className="empty-state-title" style={{ fontSize: '1rem' }}>No conversation history available.</p>
                  <p className="empty-state-desc" style={{ marginTop: '0.25rem' }}>
                    Your conversations will appear here after using Silent Speech.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-continue"
                onClick={onBackToDashboard}
                style={{ width: '100%' }}
              >
                <Home size={18} />
                <span>Return to Dashboard</span>
              </button>
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

export default SilentSpeechModule;
