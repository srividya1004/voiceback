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
import authService from '../services/authService';
import patientService from '../services/patientService';
import appointmentService from '../services/appointmentService';
import communicationService from '../services/communicationService';
import therapyService from '../services/therapyService';
import voiceService from '../services/voiceService';
import deviceService from '../services/deviceService';

export const PatientDashboardScreen = ({ onLogout }) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'profile' | 'module'
  const [activeModule, setActiveModule] = useState(null);
  const hasSpokenWelcome = useRef(false);

  // Backend Profile State
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    gender: '',
    age: '',
    preferredLanguage: '',
    role: 'Patient',
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Backend Domain Data States
  const [appointments, setAppointments] = useState([]);
  const [communicationHistory, setCommunicationHistory] = useState([]);
  const [therapyProgress, setTherapyProgress] = useState([]);
  const [voiceProfiles, setVoiceProfiles] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState(() => deviceService.getDeviceStatus());

  useEffect(() => {
    const unsubscribe = deviceService.subscribe((status) => {
      setDeviceStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // Avatar Image Data URL
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem('voiceback_patient_avatar') || '';
    } catch (e) {
      return '';
    }
  });

  // Fetch all Patient Dashboard Data from Express Backend APIs
  useEffect(() => {
    let isMounted = true;

    const fetchBackendData = async () => {
      setIsLoadingProfile(true);
      const session = authService.getActiveSession();
      const userEmail = session?.email || '';

      // 1. Fetch Patient Profile
      try {
        const patientsRes = await patientService.getAllPatients();
        const list = Array.isArray(patientsRes?.data)
          ? patientsRes.data
          : Array.isArray(patientsRes)
          ? patientsRes
          : [];

        const match = list.find(
          (p) => (p.email || p.userId?.email || '').toLowerCase() === userEmail.toLowerCase()
        );

        if (isMounted) {
          if (match) {
            setProfileData({
              id: match._id,
              fullName: match.fullName || session?.name || 'Not Available',
              email: match.email || session?.email || userEmail || 'Not Available',
              gender: match.gender || 'Not Available',
              age: match.age ? `${match.age} Years` : 'Not Available',
              preferredLanguage: match.preferredLanguage || 'Not Available',
              aphasiaType: match.aphasiaType || 'Not Available',
              role: 'Patient',
            });
          } else {
            // Fallback to active session information if backend record is pending
            setProfileData({
              fullName: session?.name || (userEmail ? userEmail.split('@')[0] : 'Not Available'),
              email: userEmail || 'Not Available',
              gender: 'Not Available',
              age: 'Not Available',
              preferredLanguage: 'Not Available',
              role: 'Patient',
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load patient profile from backend:', e.message);
        if (isMounted) {
          setProfileData({
            fullName: session?.name || (userEmail ? userEmail.split('@')[0] : 'Not Available'),
            email: userEmail || 'Not Available',
            gender: 'Not Available',
            age: 'Not Available',
            preferredLanguage: 'Not Available',
            role: 'Patient',
          });
        }
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }

      // 2. Fetch Appointments
      try {
        const apptList = await appointmentService.getAppointments();
        if (isMounted) setAppointments(Array.isArray(apptList) ? apptList : []);
      } catch (e) {
        if (isMounted) setAppointments([]);
      }

      // 3. Fetch Communication History
      try {
        const commList = await communicationService.getHistory();
        if (isMounted) setCommunicationHistory(Array.isArray(commList) ? commList : []);
      } catch (e) {
        if (isMounted) setCommunicationHistory([]);
      }

      // 4. Fetch Therapy Progress
      try {
        const therapyList = await therapyService.getTherapyProgress();
        if (isMounted) setTherapyProgress(Array.isArray(therapyList) ? therapyList : []);
      } catch (e) {
        if (isMounted) setTherapyProgress([]);
      }

      // 5. Fetch Voice Profiles
      try {
        const voiceList = await voiceService.getVoiceProfiles();
        if (isMounted) setVoiceProfiles(Array.isArray(voiceList) ? voiceList : []);
      } catch (e) {
        if (isMounted) setVoiceProfiles([]);
      }
    };

    fetchBackendData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync avatar data
  useEffect(() => {
    try {
      const avatar = localStorage.getItem('voiceback_patient_avatar') || '';
      setAvatarDataUrl(avatar);
    } catch (e) {
      // ignore
    }
  }, [currentView, isDrawerOpen]);

  const displayName = profileData.fullName && profileData.fullName !== 'Not Available'
    ? profileData.fullName
    : 'Patient';

  const firstName = displayName !== 'Patient'
    ? displayName.trim().split(' ')[0]
    : 'Patient';

  const firstLetter = displayName !== 'Patient'
    ? displayName.trim().charAt(0).toUpperCase()
    : 'P';

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
      desc: 'Send urgent alert notification to caregiver.',
      icon: AlertTriangle,
      isDanger: true,
    },
  ];

  // Drawer menu items for Patient
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
        backendProfile={profileData}
      />
    );
  }

  // Render Module Component Views
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

  if (currentView === 'module' && activeModule === 'Therapy Exercises') {
    return (
      <TherapyExercisesModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  if (currentView === 'module' && activeModule === 'Therapy Games') {
    return (
      <TherapyGamesModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  if (currentView === 'module' && activeModule === 'Voice Cloning') {
    return (
      <VoiceCloningModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  if (currentView === 'module' && (activeModule === 'Reports' || activeModule === 'Patient Reports' || activeModule === 'View Progress Reports')) {
    return (
      <PatientReportsModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  if (currentView === 'module' && (activeModule === 'Emergency SOS' || activeModule === 'Emergency Assistance')) {
    return (
      <EmergencySOSModule
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

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
        
        {/* HEADER BAR */}
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

          <button
            type="button"
            className="header-profile-avatar-btn"
            aria-label={`Patient Profile for ${displayName}`}
            title="View Patient Profile"
            onClick={handleOpenProfile}
          >
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt={displayName} className="header-avatar-img" />
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
                <img src={avatarDataUrl} alt={displayName} className="drawer-avatar-img" />
              ) : (
                <span>{firstLetter}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{displayName}</h4>
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

        {/* IF MODULE VIEW OPENED */}
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
                The <strong>{activeModule}</strong> module is connected to VoiceBack Express REST APIs.
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
            
            {/* 1. WELCOME SECTION (NAME FROM BACKEND) */}
            <section className="welcome-compact-section" style={{ marginTop: '0.2rem' }}>
              <h1 className="welcome-title">
                {getGreeting()}, {firstName}
              </h1>
              <p className="welcome-subtitle">Welcome back to VoiceBack.</p>
            </section>

            {/* 2. WEARABLE DEVICE STATUS CARD */}
            <section className="device-status-card">
              <div className="device-status-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Radio size={18} color="var(--color-brand-tagline)" />
                  <h3 className="device-status-title">Wearable Device</h3>
                </div>
                <span className={`device-name-badge ${deviceStatus.status === 'Connected' ? 'connected' : 'disconnected'}`}>
                  {deviceStatus.status}
                </span>
              </div>

              <div className="device-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Connection Status</span>
                  <span className={`metric-value ${deviceStatus.status === 'Connected' ? 'status-online' : 'status-offline'}`}>
                    {deviceStatus.status}
                  </span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Device Name</span>
                  <span className="metric-value status-offline">{deviceStatus.deviceName}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Firmware Version</span>
                  <span className="metric-value status-offline">{deviceStatus.firmwareVersion}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Battery Level</span>
                  <span className="metric-value status-offline">{deviceStatus.batteryLevel}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Signal Strength</span>
                  <span className="metric-value status-offline">{deviceStatus.signalStrength}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">EMG Status</span>
                  <span className="metric-value status-offline">{deviceStatus.emgStatus}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Signal Quality</span>
                  <span className="metric-value status-offline">{deviceStatus.signalQuality}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-connect-device"
                onClick={() => {
                  deviceService.startConnectionSequence();
                  handleOpenModule('Connect Device');
                }}
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

            {/* 4. UPCOMING APPOINTMENTS SECTION */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--color-blue-primary)" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                    Appointments
                  </h3>
                </div>
              </div>

              {appointments && appointments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {appointments.slice(0, 3).map((appt, idx) => (
                    <div key={appt._id || idx} style={{ padding: '0.75rem 0.9rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                        {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleString() : 'Scheduled Session'}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', marginTop: '0.2rem' }}>
                        Status: <strong style={{ color: 'var(--color-blue-primary)' }}>{appt.status || 'Scheduled'}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.04)', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    No upcoming appointments.
                  </p>
                </div>
              )}

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

            {/* 5. QUICK ACTIONS GRID */}
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

            {/* 6. THERAPY SESSIONS SECTION */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={18} color="var(--color-blue-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                  Therapy Sessions
                </h3>
              </div>

              {therapyProgress && therapyProgress.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {therapyProgress.slice(0, 3).map((item, idx) => (
                    <div key={item._id || idx} style={{ padding: '0.75rem 0.9rem', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.05)', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                        Exercises: {item.exercisesCompleted || 0} | Accuracy: {item.accuracyScore || 0}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="recent-activity-empty-state">
                  <p className="empty-state-title">No therapy sessions available.</p>
                </div>
              )}
            </section>

            {/* 7. VOICE PROFILE SECTION */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="var(--color-blue-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                  Voice Profile
                </h3>
              </div>

              {voiceProfiles && voiceProfiles.length > 0 ? (
                <div style={{ padding: '0.75rem 0.9rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    Gender: {voiceProfiles[0].voiceGender || 'Neutral'} | Pitch: {voiceProfiles[0].pitch || 1.0}
                  </p>
                </div>
              ) : (
                <div className="recent-activity-empty-state">
                  <p className="empty-state-title">No voice profile created yet.</p>
                </div>
              )}
            </section>

            {/* 8. RECENT ACTIVITY SECTION (Communication History) */}
            <section className="recent-activity-card">
              <div className="recent-activity-header">
                <Info size={18} color="var(--color-blue-primary)" />
                <h3>Recent Activity</h3>
              </div>

              {communicationHistory && communicationHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {communicationHistory.slice(0, 3).map((log, idx) => (
                    <div key={log._id || idx} style={{ padding: '0.75rem 0.9rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                        "{log.recognizedText}"
                      </p>
                      <p style={{ fontSize: '0.775rem', color: 'var(--color-brand-tagline)', marginTop: '0.15rem' }}>
                        Type: {log.attemptType || 'Silent'} | Confidence: {((log.confidenceScore || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="recent-activity-empty-state">
                  <p className="empty-state-title">No activity available.</p>
                  <p className="empty-state-desc">
                    Your communication history will appear here after your first communication session.
                  </p>
                </div>
              )}
            </section>

          </main>
        )}

      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default PatientDashboardScreen;
