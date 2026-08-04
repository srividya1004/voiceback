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
  Sliders,
  Volume2,
  Lock,
  Heart,
  FileAudio,
  Trash2,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import voiceService from '../services/voiceService';
import authService from '../services/authService';

export const VoiceCloningModule = ({
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeNoticeModal, setActiveNoticeModal] = useState(null); // null | 'record' | 'upload' | 'remove'
  const hasSpokenRef = useRef(false);

  // Patient Profile state
  const [patientData] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voiceback_current_user') || 'null');
      if (stored && stored.fullName) return stored;
    } catch (e) {
      // ignore
    }
    return { fullName: 'Patient' };
  });

  const [avatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem('voiceback_patient_avatar') || '';
    } catch (e) {
      return '';
    }
  });

  const firstLetter = patientData.fullName && patientData.fullName !== 'Patient'
    ? patientData.fullName.trim().charAt(0).toUpperCase()
    : 'P';

  // Backend Voice Profile Data state
  const [voiceProfile, setVoiceProfile] = useState({
    status: 'Not Created',
    samplesCount: 0,
    trainingStatus: 'Not Started',
    preferredVoice: 'Not Available',
    lastUpdated: 'Not Available',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load Voice Profile from Express REST API
  useEffect(() => {
    let isMounted = true;
    const fetchVoiceProfile = async () => {
      setIsLoading(true);
      try {
        const profiles = await voiceService.getVoiceProfiles();
        if (isMounted && Array.isArray(profiles) && profiles.length > 0) {
          const mainProfile = profiles[0];
          setVoiceProfile({
            status: mainProfile.customVoiceAssetUrl ? 'Created' : 'Not Created',
            samplesCount: mainProfile.samplesCount || 0,
            trainingStatus: mainProfile.trainingStatus || 'Not Started',
            preferredVoice: mainProfile.voiceGender ? `${mainProfile.voiceGender} Voice` : 'Not Available',
            lastUpdated: mainProfile.updatedAt ? new Date(mainProfile.updatedAt).toLocaleDateString() : 'Not Available',
          });
        }
      } catch (e) {
        console.warn('Failed to load voice profile from backend:', e.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchVoiceProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Voice Assistant greeting
  useEffect(() => {
    if (voiceAssistant && speak && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      speak('Voice Model Management. View voice profile status and dataset options.');
    }
  }, [voiceAssistant, speak]);

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
      id: 'voice-cloning',
      label: 'Voice Cloning',
      icon: UserCheck,
      action: () => setIsDrawerOpen(false),
      isActive: true,
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
        
        {/* HEADER BAR */}
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
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
              Voice Model Management
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

        {/* MAIN MODULE CONTENT */}
        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* TITLE SUBTITLE */}
          <section className="welcome-compact-section" style={{ marginTop: '0.1rem' }}>
            <p className="welcome-subtitle" style={{ fontSize: '0.925rem', color: 'var(--color-brand-tagline)', fontWeight: 500, lineHeight: 1.45 }}>
              Prepare your personalized AI voice model for natural speech synthesis.
            </p>
          </section>

          {/* CARD 1: VOICE PROFILE OVERVIEW */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="var(--color-blue-primary)" />
                <h3 className="profile-section-title" style={{ margin: 0 }}>Voice Profile Overview</h3>
              </div>
              <span className="device-name-badge disconnected" style={{ fontSize: '0.775rem' }}>
                {voiceProfile.status}
              </span>
            </div>

            <div className="profile-info-grid">
              <div className="profile-field-group">
                <span className="profile-field-label">Voice Model Status</span>
                <span className="profile-field-value">{voiceProfile.status}</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Number of Uploaded Samples</span>
                <span className="profile-field-value">{voiceProfile.samplesCount} Uploaded</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Training Status</span>
                <span className="profile-field-value">{voiceProfile.trainingStatus}</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Preferred Voice</span>
                <span className="profile-field-value">{voiceProfile.preferredVoice}</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Last Updated</span>
                <span className="profile-field-value">{voiceProfile.lastUpdated}</span>
              </div>
            </div>
          </section>

          {/* CARD 2: VOICE SAMPLE MANAGEMENT */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <FileAudio size={18} color="var(--color-blue-primary)" />
              <h3 className="profile-section-title" style={{ margin: 0 }}>Voice Samples</h3>
            </div>

            <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.04)', border: '1px solid var(--border-color)', marginBottom: '0.85rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                No samples uploaded.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                Audio recordings will be stored here once voice dataset collection starts.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn-continue"
                onClick={() => setActiveNoticeModal('record')}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Mic size={18} />
                <span>Record Voice</span>
              </button>

              <button
                type="button"
                className="btn-secondary-auth"
                onClick={() => setActiveNoticeModal('upload')}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Upload size={18} />
                <span>Upload Audio</span>
              </button>

              <button
                type="button"
                className="btn-secondary-auth"
                onClick={() => setActiveNoticeModal('remove')}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-red-primary)' }}
              >
                <Trash2 size={18} />
                <span>Remove Sample</span>
              </button>
            </div>
          </section>

          {/* CARD 3: VOICE DATASET */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Brain size={18} color="var(--color-blue-primary)" />
              <h3 className="profile-section-title" style={{ margin: 0 }}>Voice Dataset</h3>
            </div>

            <div className="profile-info-grid">
              <div className="profile-field-group">
                <span className="profile-field-label">Dataset Status</span>
                <span className="profile-field-value">Empty</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Samples Uploaded</span>
                <span className="profile-field-value">0</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Recommended Samples</span>
                <span className="profile-field-value">50–100</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Recommended Recording Time</span>
                <span className="profile-field-value">10–20 minutes</span>
              </div>
            </div>
          </section>

          {/* CARD 4: VOICE TRAINING */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={18} color="var(--color-blue-primary)" />
              <h3 className="profile-section-title" style={{ margin: 0 }}>Voice Training</h3>
            </div>

            <div className="profile-info-grid">
              <div className="profile-field-group">
                <span className="profile-field-label">Training Status</span>
                <span className="profile-field-value">Not Started</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Model Version</span>
                <span className="profile-field-value">Not Available</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Estimated Time</span>
                <span className="profile-field-value">Not Available</span>
              </div>
            </div>
          </section>

          {/* CARD 5: RECORDING GUIDELINES */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <HelpCircle size={18} color="var(--color-blue-primary)" />
              <h3 className="profile-section-title" style={{ margin: 0 }}>Recording Guidelines</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--color-brand-tagline)', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Quiet environment</strong>: Record in a silent room without background noise or echoes.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Natural speaking</strong>: Speak clearly using your normal tone and vocal posture.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Complete sentences</strong>: Read full sentences rather than isolated words.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Preferred language</strong>: Record samples in your primary preferred language.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Normal speaking speed</strong>: Maintain a steady, comfortable conversational pace.</span>
              </div>
            </div>
          </section>

          {/* CARD 6: AI PLACEHOLDERS */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Cpu size={18} color="var(--color-blue-primary)" />
              <h3 className="profile-section-title" style={{ margin: 0 }}>AI System Specification</h3>
            </div>

            <div className="profile-info-grid">
              <div className="profile-field-group">
                <span className="profile-field-label">Voice Model ID</span>
                <span className="profile-field-value">Not Available</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Training Job ID</span>
                <span className="profile-field-value">Not Available</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Dataset Version</span>
                <span className="profile-field-value">Not Available</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">AI Status</span>
                <span className="profile-field-value">Not Available</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Inference Status</span>
                <span className="profile-field-value">Not Available</span>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* WORKFLOW NOTICE MODAL */}
      {activeNoticeModal && (
        <div className="settings-overlay" onClick={() => setActiveNoticeModal(null)}>
          <div className="settings-sheet" onClick={(e) => e.stopPropagation()} style={{ gap: '1rem' }}>
            <div className="settings-sheet-header">
              <h2 className="settings-sheet-title">
                {activeNoticeModal === 'record' && 'Record Voice Workflow'}
                {activeNoticeModal === 'upload' && 'Upload Audio Workflow'}
                {activeNoticeModal === 'remove' && 'Remove Voice Sample'}
              </h2>
              <button
                type="button"
                className="btn-close-sheet"
                onClick={() => setActiveNoticeModal(null)}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', lineHeight: 1.5 }}>
              <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.06)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                  Workflow Prepared for AI & Backend Integration
                </p>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', marginTop: '0.4rem' }}>
                  {activeNoticeModal === 'record' && 'The voice recording workflow interface is ready. Direct WebAudio microphone recording will activate when the AI TTS synthesis model is integrated.'}
                  {activeNoticeModal === 'upload' && 'The audio upload workflow interface is ready. Upload API endpoint (POST /api/voice-profiles/upload-sample) is currently missing from the backend.'}
                  {activeNoticeModal === 'remove' && 'No voice samples currently exist to remove.'}
                </p>
              </div>

              <button
                type="button"
                className="btn-continue"
                onClick={() => setActiveNoticeModal(null)}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <span>Understand & Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS BOTTOM SHEET */}
      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default VoiceCloningModule;
