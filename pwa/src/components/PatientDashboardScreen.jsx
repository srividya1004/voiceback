import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
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
  ArrowLeft
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const PatientDashboardScreen = ({ onLogout }) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const hasSpokenWelcome = useRef(false);

  // Read current registered user name if available, default to 'Srividya'
  const [patientName] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('voiceback_current_user') || 'null');
      if (user && user.fullName) {
        return user.fullName.trim().split(' ')[0];
      }
    } catch (e) {
      // ignore
    }
    return 'Srividya';
  });

  // Speak ONLY ONCE after dashboard loads if Voice Assistant is ON
  useEffect(() => {
    if (voiceAssistant && speak && !hasSpokenWelcome.current) {
      hasSpokenWelcome.current = true;
      speak('Welcome to VoiceBack. Select one of the modules below to continue.');
    }
  }, [voiceAssistant, speak]);

  // Handle module click
  const handleOpenModule = (moduleName) => {
    setActiveModule(moduleName);
    if (voiceAssistant && speak) {
      speak(`${moduleName} module.`);
    }
  };

  const handleBackToDashboard = () => {
    setActiveModule(null);
  };

  const quickActions = [
    {
      id: 'silent-speech',
      title: 'Silent Speech',
      desc: 'Convert silent speech into voice.',
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
      desc: 'Interactive therapy activities.',
      icon: Gamepad2,
    },
    {
      id: 'voice-cloning',
      title: 'Voice Cloning',
      desc: 'Use your personalized AI voice.',
      icon: UserCheck,
    },
    {
      id: 'progress-reports',
      title: 'Progress Reports',
      desc: 'View therapy progress.',
      icon: BarChart3,
    },
    {
      id: 'emergency-sos',
      title: 'Emergency SOS',
      desc: 'Contact caregiver or doctor.',
      icon: AlertTriangle,
      isDanger: true,
    },
  ];

  return (
    <div className="app-viewport">
      <div className="mobile-container dashboard-container">
        {/* Header Bar: ONLY VoiceBack Logo (Left) & Settings (Right). NO BACK BUTTON */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <VoiceBackLogo variant="header" />

          <button
            type="button"
            className="settings-btn"
            aria-label={t('settings') || 'Settings'}
            title={t('settings') || 'Settings'}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* If Module Opened: Render Module Placeholder View */}
        {activeModule ? (
          <main className="role-main" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="placeholder-card" style={{ textAlign: 'center' }}>
              <div
                className="action-icon-box"
                style={{ width: 64, height: 64, margin: '0 auto 1rem auto', borderRadius: 20 }}
              >
                <Activity size={32} />
              </div>
              <span className="placeholder-badge">Coming Soon</span>
              <h1 className="placeholder-title" style={{ fontSize: '1.6rem', marginTop: '0.4rem' }}>
                {activeModule}
              </h1>
              <p className="placeholder-desc" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                The <strong>{activeModule}</strong> module is currently under development.
              </p>
              <button
                type="button"
                className="btn-continue"
                onClick={handleBackToDashboard}
              >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </main>
        ) : (
          /* Main Dashboard View */
          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            
            {/* Greeting Header */}
            <div style={{ marginTop: '0.1rem', marginBottom: '0.1rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Good Morning, {patientName}
              </h1>
            </div>

            {/* HERO WELCOME CARD */}
            <section
              style={{
                background: 'linear-gradient(135deg, #0A84D0 0%, #0284C7 100%)',
                borderRadius: '20px',
                padding: '1.35rem 1.25rem',
                color: '#FFFFFF',
                boxShadow: '0 8px 24px -4px rgba(10, 132, 208, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                width: '100%',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  👋 Welcome, {patientName}
                </h2>
                <p style={{ fontSize: '0.925rem', lineHeight: 1.45, opacity: 0.95, fontWeight: 500 }}>
                  We're here to help you communicate with confidence. Every small step is meaningful.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenModule('Start Conversation')}
                style={{
                  background: '#FFFFFF',
                  color: '#0A84D0',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '0.9rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  marginTop: '0.35rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                  minHeight: '48px',
                  width: '100%',
                  transition: 'all 0.2s ease',
                }}
              >
                <MessageSquare size={20} fill="#0A84D0" />
                <span>Start Conversation</span>
              </button>
            </section>

            {/* QUICK ACTIONS SECTION (2-Column Grid) */}
            <section style={{ width: '100%' }}>
              <h3 className="quick-actions-section-title">
                <Sparkles size={20} color="var(--color-blue-primary)" />
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
                      className="action-card"
                      onClick={() => handleOpenModule(action.title)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenModule(action.title);
                        }
                      }}
                      style={action.isDanger ? { borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.03)' } : {}}
                    >
                      <div className="action-card-header">
                        <div
                          className="action-icon-box"
                          style={action.isDanger ? { background: 'rgba(239, 68, 68, 0.12)', color: '#DC2626' } : {}}
                        >
                          <IconComp size={22} />
                        </div>
                        <ArrowRight size={18} color="var(--color-brand-tagline)" />
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

            {/* EMPTY STATES SECTION (No Fake Medical Data) */}
            <section
              style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '20px',
                padding: '1.1rem 1.25rem',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-brand-title)', fontWeight: 700, fontSize: '0.95rem' }}>
                <Info size={18} color="var(--color-blue-primary)" />
                <span>Therapy Status</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-brand-tagline)' }}>
                <p>• No therapy data available.</p>
                <p>• No reports available.</p>
                <p style={{ fontWeight: 600, color: 'var(--color-blue-primary)', marginTop: '0.15rem' }}>
                  Complete your first therapy session to begin.
                </p>
              </div>
            </section>

          </main>
        )}

        {/* Bottom Navigation Bar */}
        <nav className="dashboard-bottom-nav">
          <button
            type="button"
            className={`nav-tab-btn ${!activeModule ? 'active' : ''}`}
            onClick={() => setActiveModule(null)}
          >
            <Home size={20} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeModule === 'Therapy Games' ? 'active' : ''}`}
            onClick={() => handleOpenModule('Therapy Games')}
          >
            <Gamepad2 size={20} />
            <span>Games</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeModule === 'Therapy Exercises' ? 'active' : ''}`}
            onClick={() => handleOpenModule('Therapy Exercises')}
          >
            <Brain size={20} />
            <span>Therapy</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeModule === 'Progress Reports' ? 'active' : ''}`}
            onClick={() => handleOpenModule('Progress Reports')}
          >
            <BarChart3 size={20} />
            <span>Reports</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeModule === 'Profile' ? 'active' : ''}`}
            onClick={() => handleOpenModule('Profile')}
          >
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>
      </div>

      {/* Settings Bottom Sheet */}
      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default PatientDashboardScreen;
