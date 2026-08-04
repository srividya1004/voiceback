import React, { useState } from 'react';
import {
  Menu,
  X,
  Heart,
  User,
  Calendar,
  Brain,
  BarChart3,
  AlertTriangle,
  Settings,
  Home,
  LogOut,
  ArrowRight,
  Info,
  Link,
  Plus
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const CaregiverDashboardScreen = ({ onLogout }) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'profile' | 'placeholder-module'
  const [activeModule, setActiveModule] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');

  // Sync caregiver profile from localStorage
  const [caregiverProfile] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voiceback_caregiver_user') || 'null');
      if (stored && stored.fullName) return stored;
    } catch (e) {
      // ignore
    }
    return {
      fullName: 'Ramesh Raman',
      relationship: 'Spouse',
      email: 'caregiver@example.com',
      mobileNumber: '+91 98765 11111',
    };
  });

  const caregiverFirstName = caregiverProfile.fullName ? caregiverProfile.fullName.split(' ')[0] : 'Caregiver';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLinkPatient = () => {
    setNoticeMsg('Patient linking will become available after backend integration.');
    setTimeout(() => setNoticeMsg(''), 4000);
    if (voiceAssistant && speak) {
      speak('Patient linking will become available after backend integration.');
    }
  };

  const handleOpenModule = (moduleTitle) => {
    setActiveModule(moduleTitle);
    setCurrentView('placeholder-module');
    setIsDrawerOpen(false);
    if (voiceAssistant && speak) {
      speak(`${moduleTitle} selected.`);
    }
  };

  const handleOpenProfile = () => {
    setCurrentView('profile');
    setIsDrawerOpen(false);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setActiveModule('');
  };

  // Quick Action Cards definition
  const quickActions = [
    {
      id: 'patient-profile',
      title: 'Patient Profile',
      desc: 'View patient information.',
      icon: User,
      action: () => handleOpenModule('Patient Profile'),
    },
    {
      id: 'appointments',
      title: 'Appointments',
      desc: 'View upcoming appointments.',
      icon: Calendar,
      action: () => handleOpenModule('Appointments'),
    },
    {
      id: 'therapy-progress',
      title: 'Therapy Progress',
      desc: 'Monitor therapy sessions.',
      icon: Brain,
      action: () => handleOpenModule('Therapy Progress'),
    },
    {
      id: 'reports',
      title: 'Reports',
      desc: 'View rehabilitation reports.',
      icon: BarChart3,
      action: () => handleOpenModule('Reports'),
    },
    {
      id: 'emergency-alerts',
      title: 'Emergency Alerts',
      desc: 'Receive SOS notifications.',
      icon: AlertTriangle,
      isDanger: true,
      action: () => handleOpenModule('Emergency Alerts'),
    },
    {
      id: 'settings',
      title: 'Settings',
      desc: 'Manage caregiver preferences.',
      icon: Settings,
      action: () => setIsSettingsOpen(true),
    },
  ];

  // Drawer Menu Items (RBAC compliant)
  const drawerItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => handleBackToDashboard(),
      isActive: currentView === 'dashboard',
    },
    {
      id: 'linked-patient',
      label: 'Linked Patient',
      icon: User,
      action: () => handleOpenModule('Linked Patient'),
      isActive: currentView === 'placeholder-module' && activeModule === 'Linked Patient',
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      action: () => handleOpenModule('Appointments'),
      isActive: currentView === 'placeholder-module' && activeModule === 'Appointments',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      action: () => handleOpenModule('Reports'),
      isActive: currentView === 'placeholder-module' && activeModule === 'Reports',
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: AlertTriangle,
      action: () => handleOpenModule('Emergency'),
      isActive: currentView === 'placeholder-module' && activeModule === 'Emergency',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: Heart,
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
  ];

  return (
    <div className="app-viewport">
      <div className="mobile-container caregiver-container" style={{ maxWidth: '480px' }}>
        
        {/* LEFT SLIDE NAVIGATION DRAWER */}
        <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        <aside className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`} aria-label="Caregiver Navigation Drawer">
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

          {/* Caregiver User Badge */}
          <div className="drawer-user-badge" onClick={handleOpenProfile}>
            <div className="drawer-avatar-circle" style={{ background: 'rgba(234, 88, 12, 0.12)', color: 'var(--color-orange-primary)' }}>
              <Heart size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{caregiverProfile.fullName}</h4>
              <span className="drawer-user-role" style={{ color: 'var(--color-orange-primary)', fontWeight: 700 }}>
                Caregiver ({caregiverProfile.relationship})
              </span>
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
              <span>Logout Caregiver Portal</span>
            </button>
          </div>
        </aside>

        {/* HEADER BAR: Top Left Hamburger Menu (NO BACK BUTTON), Top Right Circular Profile Avatar */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="settings-btn"
            aria-label="Open Navigation Menu"
            title="Open Navigation Menu"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Menu size={22} />
          </button>

          <VoiceBackLogo variant="header" />

          <button
            type="button"
            className="header-profile-avatar-btn"
            aria-label={`Caregiver Profile for ${caregiverProfile.fullName}`}
            onClick={handleOpenProfile}
            style={{ background: 'rgba(234, 88, 12, 0.12)', borderColor: 'var(--color-orange-primary)', color: 'var(--color-orange-primary)' }}
          >
            <Heart size={20} />
          </button>
        </header>

        {/* PROFILE VIEW */}
        {currentView === 'profile' ? (
          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
            <div className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(234, 88, 12, 0.15)', color: 'var(--color-orange-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={28} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                    {caregiverProfile.fullName}
                  </h2>
                  <span style={{ fontSize: '0.825rem', color: 'var(--color-orange-primary)', fontWeight: 700 }}>
                    Caregiver ({caregiverProfile.relationship})
                  </span>
                </div>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Email Address</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-brand-title)' }}>{caregiverProfile.email}</span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Mobile Number</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-brand-title)' }}>{caregiverProfile.mobileNumber}</span>
              </div>

              <button
                type="button"
                className="btn-continue"
                onClick={handleBackToDashboard}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <span>Return to Dashboard</span>
              </button>
            </div>
          </main>
        ) : currentView === 'placeholder-module' ? (
          /* MODULE PLACEHOLDER VIEW */
          <main className="role-main" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '55vh' }}>
            <div className="placeholder-card" style={{ textAlign: 'center', width: '100%', maxWidth: '420px' }}>
              <div
                className="action-icon-box"
                style={{ width: 64, height: 64, margin: '0 auto 1rem auto', borderRadius: 20, background: 'rgba(234, 88, 12, 0.12)', color: 'var(--color-orange-primary)' }}
              >
                <Heart size={32} />
              </div>
              <span className="placeholder-badge" style={{ background: 'rgba(234, 88, 12, 0.12)', color: 'var(--color-orange-primary)' }}>
                Caregiver Portal Module
              </span>
              <h1 className="placeholder-title" style={{ fontSize: '1.5rem', marginTop: '0.4rem' }}>
                {activeModule}
              </h1>
              <p className="placeholder-desc" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                The <strong>{activeModule}</strong> feature will become fully functional after patient linking and backend API integration.
              </p>
              <button
                type="button"
                className="btn-continue"
                onClick={handleBackToDashboard}
                style={{ width: '100%', background: 'var(--color-orange-primary)' }}
              >
                <span>Return to Dashboard</span>
              </button>
            </div>
          </main>
        ) : (
          /* MAIN CAREGIVER DASHBOARD VIEW */
          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
            
            {/* NOTICE ALERT */}
            {noticeMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  background: 'rgba(234, 88, 12, 0.1)',
                  border: '1.5px solid var(--color-orange-primary)',
                  color: 'var(--color-orange-primary)',
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
                <Info size={18} />
                <span>{noticeMsg}</span>
              </div>
            )}

            {/* WELCOME SECTION */}
            <section className="welcome-compact-section" style={{ marginTop: '0.2rem' }}>
              <h1 className="welcome-title">
                {getGreeting()}, {caregiverFirstName}
              </h1>
              <p className="welcome-subtitle">Welcome to VoiceBack.</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-brand-tagline)', fontWeight: 500, marginTop: '0.15rem' }}>
                Support your loved one's communication journey.
              </p>
            </section>

            {/* LINKED PATIENT CARD */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={20} color="var(--color-blue-primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                    Linked Patient
                  </h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.775rem' }}>
                  No patient linked yet.
                </span>
              </div>

              <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.04)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', lineHeight: 1.45 }}>
                  Your linked patient will appear here after backend integration.
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary-auth"
                onClick={handleLinkPatient}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-blue-primary)', borderColor: 'var(--color-blue-primary)' }}
              >
                <Link size={16} />
                <span>Link Patient</span>
              </button>
            </section>

            {/* QUICK ACTIONS GRID */}
            <section style={{ width: '100%' }}>
              <h3 className="quick-actions-section-title">
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
                      onClick={action.action}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          action.action();
                        }
                      }}
                    >
                      <div className="action-card-header">
                        <div className={`action-icon-box ${action.isDanger ? 'danger' : ''}`} style={!action.isDanger ? { background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)' } : {}}>
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

            {/* RECENT ACTIVITY CARD (HONEST EMPTY STATE) */}
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header">
                <Info size={18} color="var(--color-blue-primary)" />
                <h3>Recent Activity</h3>
              </div>

              <div className="recent-activity-empty-state">
                <p className="empty-state-title">No recent activity available.</p>
                <p className="empty-state-desc">
                  Patient activity will appear after backend integration.
                </p>
              </div>
            </section>

            {/* NOTIFICATIONS CARD (HONEST EMPTY STATE) */}
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header">
                <AlertTriangle size={18} color="var(--color-brand-tagline)" />
                <h3>Notifications</h3>
              </div>

              <div className="recent-activity-empty-state">
                <p className="empty-state-title">No notifications available.</p>
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

export default CaregiverDashboardScreen;
