import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowLeft,
  AlertTriangle,
  Heart,
  Stethoscope,
  MapPin,
  MessageSquare,
  PhoneCall,
  Home,
  User,
  Settings,
  LogOut,
  ArrowRight,
  Info,
  Shield,
  Check
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const EmergencySOSModule = ({
  initialContacts,
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [sosNoticeMsg, setSosNoticeMsg] = useState('');
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

  // Configurable Emergency Contacts State (Ready for GET /api/emergency-contacts REST API)
  const [emergencyContacts] = useState(initialContacts || {
    caregiver: {
      name: 'Caregiver',
      status: 'Not Connected',
      desc: 'No caregiver account linked yet.',
      actionLabel: 'Connect Caregiver',
    },
    doctor: {
      name: 'Doctor',
      status: 'Not Assigned',
      desc: 'No doctor has been assigned.',
      actionLabel: 'Find Doctor',
    },
  });

  // Voice Assistant: Speak ONCE when screen opens
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (lastSpokenRef.current === 'emergency-sos-home') return;

    lastSpokenRef.current = 'emergency-sos-home';
    speak('Emergency assistance is available from this screen. Your caregiver and doctor can be contacted after backend integration.');
  }, [voiceAssistant, speak]);

  const handleSendRequest = () => {
    setIsConfirmDialogOpen(false);
    setSosNoticeMsg('Emergency request feature will be available after backend integration.');
    setTimeout(() => setSosNoticeMsg(''), 4000);

    if (voiceAssistant && speak) {
      speak('Emergency request feature will be available after backend integration.');
    }
  };

  const handleConnectCaregiver = () => {
    setSosNoticeMsg('Caregiver linkage will be available after backend integration.');
    setTimeout(() => setSosNoticeMsg(''), 4000);
  };

  const handleFindDoctor = () => {
    setSosNoticeMsg('Doctor assignment will be available after backend integration.');
    setTimeout(() => setSosNoticeMsg(''), 4000);
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
      id: 'emergency-sos',
      label: 'Emergency SOS',
      icon: AlertTriangle,
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
      <div className="mobile-container emergency-sos-container">
        
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
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>
              Emergency SOS
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

        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* NOTICE ALERT */}
          {sosNoticeMsg && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1.5px solid #DC2626',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.875rem',
                textAlign: 'center',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <AlertTriangle size={18} />
              <span>{sosNoticeMsg}</span>
            </div>
          )}

          {/* INTRODUCTION CARD */}
          <section className="profile-section-card" style={{ width: '100%', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Shield size={20} color="var(--color-blue-primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                Emergency Assistance
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-tagline)', lineHeight: 1.45 }}>
              If you need immediate help, you can quickly contact your caregiver or healthcare provider.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', fontWeight: 500 }}>
              This feature will become fully functional after backend and mobile integration.
            </p>
          </section>

          {/* LARGE RED EMERGENCY BUTTON */}
          <section className="profile-section-card" style={{ width: '100%', textAlign: 'center', padding: '1.75rem 1.25rem', gap: '1rem', background: 'rgba(220, 38, 38, 0.03)', border: '2px solid rgba(220, 38, 38, 0.3)' }}>
            <button
              type="button"
              className="btn-danger-logout"
              onClick={() => setIsConfirmDialogOpen(true)}
              style={{
                width: '100%',
                padding: '1.15rem',
                fontSize: '1.25rem',
                fontWeight: 900,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#FFFFFF',
                border: 'none',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.4)',
                letterSpacing: '0.5px',
              }}
            >
              <AlertTriangle size={24} />
              <span>🚨 EMERGENCY SOS</span>
            </button>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-tagline)' }}>
              Immediately request help from your caregiver or doctor.
            </p>
          </section>

          {/* EMERGENCY CONTACTS */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
            {/* Caregiver Card */}
            <div className="profile-section-card" style={{ width: '100%', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={20} color="var(--color-orange-primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                    Caregiver
                  </h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.775rem', padding: '0.25rem 0.65rem' }}>
                  {emergencyContacts.caregiver.status}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)' }}>
                {emergencyContacts.caregiver.desc}
              </p>
              <button
                type="button"
                className="btn-secondary-auth"
                onClick={handleConnectCaregiver}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                <span>{emergencyContacts.caregiver.actionLabel}</span>
              </button>
            </div>

            {/* Doctor Card */}
            <div className="profile-section-card" style={{ width: '100%', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Stethoscope size={20} color="var(--color-blue-primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                    Doctor
                  </h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.775rem', padding: '0.25rem 0.65rem' }}>
                  {emergencyContacts.doctor.status}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)' }}>
                {emergencyContacts.doctor.desc}
              </p>
              <button
                type="button"
                className="btn-secondary-auth"
                onClick={handleFindDoctor}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                <span>{emergencyContacts.doctor.actionLabel}</span>
              </button>
            </div>
          </section>

          {/* EMERGENCY MESSAGE PREVIEW */}
          <section className="profile-section-card" style={{ width: '100%', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--color-blue-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                Emergency Message
              </h3>
            </div>
            <div style={{ padding: '0.9rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-brand-title)', fontStyle: 'italic' }}>
                "I need assistance. Please contact me as soon as possible."
              </p>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--color-brand-tagline)' }}>
              Message preview only. No messages will be sent.
            </p>
          </section>

          {/* LOCATION CARD */}
          <section className="profile-section-card" style={{ width: '100%', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="var(--color-brand-tagline)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                  Current Location
                </h3>
              </div>
              <span className="device-name-badge disconnected" style={{ fontSize: '0.775rem', padding: '0.25rem 0.65rem' }}>
                Unavailable
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', lineHeight: 1.4 }}>
              Location services will become available after mobile integration.
            </p>
          </section>

        </main>
      </div>

      {/* SOS CONFIRMATION DIALOG MODAL */}
      {isConfirmDialogOpen && (
        <div className="settings-overlay" onClick={() => setIsConfirmDialogOpen(false)}>
          <div className="settings-sheet" onClick={(e) => e.stopPropagation()} style={{ gap: '1.15rem', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(220, 38, 38, 0.12)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <AlertTriangle size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Send Emergency Request?
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-tagline)', marginTop: '0.4rem', lineHeight: 1.45 }}>
                This will notify your caregiver or doctor after backend integration.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
              <button
                type="button"
                className="btn-continue"
                onClick={handleSendRequest}
                style={{ width: '100%', background: '#DC2626' }}
              >
                <span>Send Request</span>
              </button>

              <button
                type="button"
                className="btn-secondary-auth"
                onClick={() => setIsConfirmDialogOpen(false)}
                style={{ width: '100%' }}
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default EmergencySOSModule;
