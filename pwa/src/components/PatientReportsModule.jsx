import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowLeft,
  MessageSquare,
  Brain,
  Gamepad2,
  Mic,
  Calendar,
  FileText,
  Home,
  User,
  Settings,
  LogOut,
  ArrowRight,
  Info,
  BarChart2
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';

export const PatientReportsModule = ({
  initialReportsData,
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastSpokenRef = useRef(null);

  // Sync profile data & avatar from session/localStorage
  const [patientData] = useState(() => {
    const session = authService.getActiveSession();
    const sessionUser = session?.user;
    const stored = (() => {
      try {
        return JSON.parse(localStorage.getItem('voiceback_patient_user') || 'null') || JSON.parse(localStorage.getItem('voiceback_current_user') || 'null');
      } catch (e) {
        return null;
      }
    })();
    const name = sessionUser?.fullName || sessionUser?.profile?.fullName || stored?.fullName || session?.email || 'Patient';
    return { fullName: name };
  });

  const [avatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem('voiceback_patient_avatar') || '';
    } catch (e) {
      return '';
    }
  });

  const firstLetter = patientData.fullName ? patientData.fullName.trim().charAt(0).toUpperCase() : 'S';

  // Configurable Report Categories (Ready to receive data from GET /api/reports or GET /api/therapy-progress)
  const defaultReportCategories = [
    {
      id: 'conversation-history',
      title: 'Conversation History',
      desc: 'View previous communication sessions.',
      status: 'No conversations available.',
      icon: MessageSquare,
    },
    {
      id: 'therapy-progress',
      title: 'Therapy Progress',
      desc: 'Track completed therapy exercises.',
      status: 'No therapy sessions completed.',
      icon: Brain,
    },
    {
      id: 'therapy-games',
      title: 'Therapy Games',
      desc: 'View completed rehabilitation activities.',
      status: 'No therapy games completed.',
      icon: Gamepad2,
    },
    {
      id: 'voice-cloning',
      title: 'Voice Cloning',
      desc: 'View your personalized voice model status.',
      status: 'No voice model available.',
      icon: Mic,
    },
    {
      id: 'session-timeline',
      title: 'Session Timeline',
      desc: 'View a chronological history of VoiceBack activities.',
      status: 'No timeline available.',
      icon: Calendar,
    },
  ];

  const [reportCategories] = useState(initialReportsData || defaultReportCategories);

  // Voice Assistant: Speak ONCE when screen opens
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (lastSpokenRef.current === 'reports-home') return;

    lastSpokenRef.current = 'reports-home';
    speak('This section will display your therapy and communication reports after you begin using VoiceBack.');
  }, [voiceAssistant, speak]);

  // Navigation Drawer Items
  const drawerItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => onBackToDashboard(),
      isActive: false,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart2,
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
      <div className="mobile-container reports-container">
        
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
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
              Reports
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
          {/* DESCRIPTION SECTION */}
          <section className="welcome-compact-section">
            <p className="welcome-subtitle" style={{ fontSize: '0.95rem', color: 'var(--color-brand-title)', fontWeight: 700, lineHeight: 1.45 }}>
              Review your therapy sessions and communication history.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', marginTop: '0.25rem' }}>
              Your reports will become available after you begin using VoiceBack.
            </p>
          </section>

          {/* REPORT CATEGORIES */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
            {reportCategories.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="profile-section-card"
                  style={{ width: '100%', padding: '1.15rem', gap: '0.65rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CatIcon size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                        {cat.title}
                      </h3>
                    </div>
                    <span className="device-name-badge disconnected" style={{ fontSize: '0.775rem', padding: '0.25rem 0.65rem' }}>
                      {cat.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', lineHeight: 1.4 }}>
                    {cat.desc}
                  </p>
                </div>
              );
            })}
          </section>

          {/* GENERAL EMPTY STATE CARD */}
          <section className="profile-section-card" style={{ width: '100%', textAlign: 'center', padding: '2rem 1.25rem', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <BarChart2 size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                No Reports Yet
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-tagline)', marginTop: '0.35rem', lineHeight: 1.45 }}>
                Complete your first therapy session or conversation to generate reports.
              </p>
            </div>

            <button
              type="button"
              className="btn-continue"
              onClick={onBackToDashboard}
              style={{ width: '100%', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Home size={18} />
              <span>Return to Dashboard</span>
            </button>
          </section>
        </main>

      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default PatientReportsModule;
