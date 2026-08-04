import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Mic,
  Brain,
  Gamepad2,
  UserCheck,
  BarChart3,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Home,
  User,
  Activity,
  MessageSquare,
  Info,
  ArrowLeft,
  Settings,
  LogOut,
  Wifi,
  Radio,
  Calendar
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import PatientProfileScreen from './PatientProfileScreen';
import SilentSpeechModule from './SilentSpeechModule';
import TherapyExercisesModule from './TherapyExercisesModule';
import TherapyGamesModule from './TherapyGamesModule';
import VoiceCloningModule from './VoiceCloningModule';
import PatientReportsModule from './PatientReportsModule';
import EmergencySOSModule from './EmergencySOSModule';
import PatientAppointmentsModule from './PatientAppointmentsModule';
import { useSettings } from '../context/SettingsContext';

export const PatientDashboardScreen = ({ onLogout }) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'profile' | 'module'
  const [activeModule, setActiveModule] = useState(null);
  const hasSpokenWelcome = useRef(false);

  // Read registered patient profile & avatar from localStorage
  const [profileData, setProfileData] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voiceback_current_user') || 'null');
      if (stored && stored.fullName) {
        return stored;
      }
    } catch (e) {
      // ignore
    }
    return { fullName: 'Srividya Raman' };
  });

  const [avatarDataUrl, setAvatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem('voiceback_patient_avatar') || '';
    } catch (e) {
      return '';
    }
  });

  // Sync avatar and profile data whenever dashboard is focused or drawer opens
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voiceback_current_user') || 'null');
      if (stored && stored.fullName) {
        setProfileData(stored);
      }
      const avatar = localStorage.getItem('voiceback_patient_avatar') || '';
      setAvatarDataUrl(avatar);
    } catch (e) {
      // ignore
    }
  }, [currentView, isDrawerOpen]);

  const firstName = profileData.fullName ? profileData.fullName.trim().split(' ')[0] : 'Srividya';
  const firstLetter = profileData.fullName ? profileData.fullName.trim().charAt(0).toUpperCase() : 'S';

  // Speak ONLY ONCE on dashboard load if Voice Assistant is ON
  useEffect(() => {
    if (voiceAssistant && speak && !hasSpokenWelcome.current) {
      hasSpokenWelcome.current = true;
      speak('Welcome back. Select a module to continue.');
    }
  }, [voiceAssistant, speak]);

  // Determine time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Open module handler
  const handleOpenModule = (moduleName) => {
    setActiveModule(moduleName);
    setCurrentView('module');
    setIsDrawerOpen(false);
    if (voiceAssistant && speak) {
      speak(`${moduleName} module.`);
    }
  };

  const handleOpenProfile = () => {
    setCurrentView('profile');
    setIsDrawerOpen(false);
    if (voiceAssistant && speak) {
      speak('Patient Profile.');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setActiveModule(null);
  };

  // Quick Actions Configuration
  const quickActions = [
    {
      id: 'silent-speech',
      title: 'Silent Speech',
      desc: 'View live EMG signals and communicate silently.',
      icon: Mic,
    },
    {
      id: 'therapy-exercises',
      title: 'Therapy Exercises',
      desc: 'Practice speech rehabilitation.',
      icon: Brain,
    },
    {
      id: 'therapy-games',
      title: 'Therapy Games',
      desc: 'Interactive rehabilitation games.',
      icon: Gamepad2,
    },
    {
      id: 'voice-cloning',
      title: 'Voice Cloning',
      desc: 'Manage your personalized voice model.',
      icon: UserCheck,
    },
    {
      id: 'reports',
      title: 'Reports',
      desc: 'View therapy reports and communication history.',
      icon: BarChart3,
    },
    {
      id: 'appointments',
      title: 'Appointments',
      desc: 'View or request healthcare consultations.',
      icon: Calendar,
    },
    {
      id: 'emergency-sos',
      title: 'Emergency SOS',
      desc: 'Quickly contact caregiver or doctor.',
      icon: AlertTriangle,
      isDanger: true,
    },
  ];

  // Slide Drawer Navigation Items
  const drawerItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => handleBackToDashboard(),
      isActive: currentView === 'dashboard',
    },
    {
      id: 'start-conversation',
      label: 'Start Conversation',
      icon: MessageSquare,
      action: () => handleOpenModule('Start Conversation'),
      isActive: currentView === 'module' && activeModule === 'Start Conversation',
    },
    {
      id: 'silent-speech',
      label: 'Silent Speech',
      icon: Mic,
      action: () => handleOpenModule('Silent Speech'),
      isActive: currentView === 'module' && activeModule === 'Silent Speech',
    },
    {
      id: 'therapy',
      label: 'Therapy',
      icon: Brain,
      action: () => handleOpenModule('Therapy Exercises'),
      isActive: currentView === 'module' && activeModule === 'Therapy Exercises',
    },
    {
      id: 'therapy-games',
      label: 'Therapy Games',
      icon: Gamepad2,
      action: () => handleOpenModule('Therapy Games'),
      isActive: currentView === 'module' && activeModule === 'Therapy Games',
    },
    {
      id: 'voice-cloning',
      label: 'Voice Cloning',
      icon: UserCheck,
      action: () => handleOpenModule('Voice Cloning'),
      isActive: currentView === 'module' && activeModule === 'Voice Cloning',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      action: () => handleOpenModule('Reports'),
      isActive: currentView === 'module' && activeModule === 'Reports',
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      action: () => handleOpenModule('Appointments'),
      isActive: currentView === 'module' && activeModule === 'Appointments',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      action: () => handleOpenProfile(),
      isActive: currentView === 'profile',
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
    {
      id: 'emergency-sos',
      label: 'Emergency SOS',
      icon: AlertTriangle,
      action: () => handleOpenModule('Emergency SOS'),
      isActive: currentView === 'module' && activeModule === 'Emergency SOS',
      isDanger: true,
    },
  ];

  // If view is 'profile', render PatientProfileScreen
  if (currentView === 'profile') {
    return (
      <PatientProfileScreen
        onBack={handleBackToDashboard}
        onLogout={onLogout}
      />
    );
  }

  // If active module is Silent Speech related, render SilentSpeechModule
  if (currentView === 'module' && (activeModule === 'Silent Speech' || activeModule === 'Start Conversation' || activeModule === 'Connect Device')) {
    const initialStep = activeModule === 'Connect Device' ? 'connect-device' : 'silent-speech-home';
    return (
      <SilentSpeechModule
        initialStep={initialStep}
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  // If active module is Therapy Exercises, render TherapyExercisesModule
  if (currentView === 'module' && activeModule === 'Therapy Exercises') {
    return (
      <TherapyExercisesModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  // If active module is Therapy Games, render TherapyGamesModule
  if (currentView === 'module' && activeModule === 'Therapy Games') {
    return (
      <TherapyGamesModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  // If active module is Voice Cloning, render VoiceCloningModule
  if (currentView === 'module' && activeModule === 'Voice Cloning') {
    return (
      <VoiceCloningModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  // If active module is Reports / Patient Reports, render PatientReportsModule
  if (currentView === 'module' && (activeModule === 'Reports' || activeModule === 'Patient Reports' || activeModule === 'View Progress Reports')) {
    return (
      <PatientReportsModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  // If active module is Emergency SOS, render EmergencySOSModule
  if (currentView === 'module' && (activeModule === 'Emergency SOS' || activeModule === 'Emergency Assistance')) {
    return (
      <EmergencySOSModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  // If active module is Appointments, render PatientAppointmentsModule
  if (currentView === 'module' && (activeModule === 'Appointments' || activeModule === 'Upcoming Appointments')) {
    return (
      <PatientAppointmentsModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="app-viewport">
      <div className="mobile-container dashboard-container">
        
        {/* HEADER BAR: Top Left Hamburger Menu (NO LOGO), Top Right Circular Profile Avatar */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {/* ☰ Hamburger Menu */}
          <button
            type="button"
            className="settings-btn"
            aria-label="Open Navigation Menu"
            title="Open Navigation Menu"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* 👤 Circular Patient Profile Avatar (Navigates to Profile) */}
          <button
            type="button"
            className="header-profile-avatar-btn"
            aria-label={`Patient Profile for ${profileData.fullName}`}
            title="View Patient Profile"
            onClick={handleOpenProfile}
          >
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt={profileData.fullName} className="header-avatar-img" />
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

          {/* Mini Patient Profile Badge */}
          <div className="drawer-user-badge" onClick={handleOpenProfile}>
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

          {/* Drawer Menu Items */}
          <nav className="drawer-menu-list">
            {drawerItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`drawer-menu-item ${item.isActive ? 'active' : ''} ${item.isDanger ? 'danger' : ''}`}
                  onClick={item.action}
                >
                  <ItemIcon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout at bottom of drawer */}
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

        {/* IF MODULE VIEW OPENED: Render Module Placeholder View */}
        {currentView === 'module' && activeModule ? (
          <main className="role-main" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="placeholder-card" style={{ textAlign: 'center', width: '100%', maxWidth: '420px' }}>
              <div
                className="action-icon-box"
                style={{ width: 64, height: 64, margin: '0 auto 1rem auto', borderRadius: 20 }}
              >
                <Activity size={32} color="var(--color-blue-primary)" />
              </div>
              <span className="placeholder-badge">Module View</span>
              <h1 className="placeholder-title" style={{ fontSize: '1.6rem', marginTop: '0.4rem' }}>
                {activeModule}
              </h1>
              <p className="placeholder-desc" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                The <strong>{activeModule}</strong> module is ready for AI & sEMG firmware integration.
              </p>
              <button
                type="button"
                className="btn-continue"
                onClick={handleBackToDashboard}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
              >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </main>
        ) : (
          /* MAIN DASHBOARD VIEW */
          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
            
            {/* 1. WELCOME SECTION (CLEAN & MODERN) */}
            <section className="welcome-compact-section" style={{ marginTop: '0.2rem' }}>
              <h1 className="welcome-title">
                {getGreeting()}, {firstName}
              </h1>
              <p className="welcome-subtitle">Welcome back to VoiceBack.</p>
            </section>

            {/* 2. WEARABLE DEVICE STATUS CARD (REAL EMPTY STATES - NO FAKE HARDWARE DATA) */}
            <section className="device-status-card">
              <div className="device-status-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Radio size={18} color="var(--color-brand-tagline)" />
                  <h3 className="device-status-title">Wearable Device</h3>
                </div>
                <span className="device-name-badge disconnected">Not Connected</span>
              </div>

              <div className="device-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Status</span>
                  <span className="metric-value status-offline">Not Connected</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">EMG Sensor</span>
                  <span className="metric-value status-offline">Waiting for wearable device</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Battery</span>
                  <span className="metric-value status-offline">Unavailable</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Bluetooth</span>
                  <span className="metric-value status-offline">Unavailable</span>
                </div>
              </div>

              {/* Primary Connect Device Button */}
              <button
                type="button"
                className="btn-connect-device"
                onClick={() => handleOpenModule('Connect Device')}
              >
                <Wifi size={18} />
                <span>Connect Device</span>
              </button>
            </section>

            {/* 3. PRIMARY ACTION: START CONVERSATION CARD */}
            <section className="primary-action-card">
              <div className="primary-action-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <MessageSquare size={22} fill="#FFFFFF" color="#FFFFFF" />
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Start Conversation</h2>
                </div>
                <p style={{ fontSize: '0.925rem', opacity: 0.95, fontWeight: 500, lineHeight: 1.4 }}>
                  Begin communicating using VoiceBack.
                </p>
              </div>

              <button
                type="button"
                className="btn-primary-action"
                onClick={() => handleOpenModule('Start Conversation')}
              >
                <span>Start Conversation</span>
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </section>

            {/* COMPACT UPCOMING APPOINTMENT CARD */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--color-blue-primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                    Upcoming Appointment
                  </h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.75rem' }}>
                  No appointments
                </span>
              </div>

              <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.04)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                  No appointments scheduled.
                </p>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', marginTop: '0.25rem', lineHeight: 1.45 }}>
                  Your upcoming appointments with your healthcare provider will appear here after backend integration.
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary-auth"
                onClick={() => handleOpenModule('Appointments')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Calendar size={16} />
                <span>View Appointments</span>
              </button>
            </section>

            {/* 4. QUICK ACTIONS GRID */}
            <section style={{ width: '100%' }}>
              <h3 className="quick-actions-section-title">
                <Sparkles size={18} color="var(--color-blue-primary)" />
                <span>Quick Actions</span>
              </h3>

              <div className="quick-actions-grid">
                {quickActions.map((action) => {
                  const IconComp = action.icon;
                  return (
                    <div
                      key={action.id}
                      tabIndex={0}
                      role="button"
                      aria-label={action.title}
                      className={`action-card ${action.isDanger ? 'danger' : ''}`}
                      onClick={() => handleOpenModule(action.title)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenModule(action.title);
                        }
                      }}
                    >
                      <div className="action-card-header">
                        <div className={`action-icon-box ${action.isDanger ? 'danger' : ''}`}>
                          <IconComp size={22} />
                        </div>
                        <ArrowRight size={18} className="action-arrow-icon" />
                      </div>

                      <div>
                        <h4 className="action-card-title">{action.title}</h4>
                        <p className="action-card-desc">{action.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. RECENT ACTIVITY (EMPTY STATE) */}
            <section className="recent-activity-card">
              <div className="recent-activity-header">
                <Info size={18} color="var(--color-blue-primary)" />
                <h3>Recent Activity</h3>
              </div>

              <div className="recent-activity-empty-state">
                <p className="empty-state-title">No activity available.</p>
                <p className="empty-state-desc">
                  Start your first conversation or therapy session to begin.
                </p>
              </div>
            </section>

          </main>
        )}

      </div>

      {/* Settings Bottom Sheet Component */}
      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default PatientDashboardScreen;
