import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  PlusCircle,
  History,
  CheckCircle2,
  Home,
  Settings,
  LogOut,
  ArrowRight,
  Info,
  X,
  Plus
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const PatientAppointmentsModule = ({
  initialAppointments,
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history' | 'request'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [requestNotice, setRequestNotice] = useState('');
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

  // Dynamic appointments state ready for GET /api/appointments REST API response
  const [upcomingList] = useState(initialAppointments?.upcoming || []);
  const [historyList] = useState(initialAppointments?.history || []);

  // Voice Assistant: Speak once per screen / tab
  useEffect(() => {
    if (!voiceAssistant || !speak) return;

    if (activeTab === 'upcoming' && lastSpokenRef.current !== 'upcoming') {
      lastSpokenRef.current = 'upcoming';
      speak('Upcoming appointments. View your scheduled consultations.');
    } else if (activeTab === 'history' && lastSpokenRef.current !== 'history') {
      lastSpokenRef.current = 'history';
      speak('Appointment history.');
    } else if (activeTab === 'request' && lastSpokenRef.current !== 'request') {
      lastSpokenRef.current = 'request';
      speak('Request a new appointment with your healthcare provider.');
    }
  }, [activeTab, voiceAssistant, speak]);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setRequestNotice('Appointment request feature will be active after backend and clinic scheduling integration.');
    setTimeout(() => setRequestNotice(''), 4000);
    if (voiceAssistant && speak) {
      speak('Appointment request feature will be active after backend integration.');
    }
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
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      action: () => {
        setActiveTab('upcoming');
        setIsDrawerOpen(false);
      },
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
      <div className="mobile-container appointments-container">
        
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
              Appointments
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
          
          {/* NOTICE ALERT */}
          {requestNotice && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '14px',
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1.5px solid var(--color-blue-primary)',
                color: 'var(--color-blue-primary)',
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
              <span>{requestNotice}</span>
            </div>
          )}

          {/* SEGMENTED TAB SWITCHER */}
          <div className="segmented-group" style={{ width: '100%' }}>
            <button
              type="button"
              className={`segmented-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <Calendar size={15} />
              <span>Upcoming</span>
            </button>

            <button
              type="button"
              className={`segmented-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={15} />
              <span>History</span>
            </button>

            <button
              type="button"
              className={`segmented-btn ${activeTab === 'request' ? 'active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              <PlusCircle size={15} />
              <span>Request</span>
            </button>
          </div>

          {/* TAB 1: UPCOMING APPOINTMENTS */}
          {activeTab === 'upcoming' && (
            <section className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="profile-section-title" style={{ margin: 0 }}>Upcoming Appointments</h3>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.775rem' }}>
                  0 Scheduled
                </span>
              </div>

              {upcomingList.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                    <Calendar size={28} />
                  </div>
                  <p className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                    No upcoming appointments scheduled.
                  </p>
                  <p className="empty-state-desc" style={{ marginTop: '0.35rem', lineHeight: 1.45 }}>
                    Your upcoming appointments with your healthcare provider will appear here after backend integration.
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                className="btn-continue"
                onClick={() => setActiveTab('request')}
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Plus size={18} />
                <span>Request Appointment</span>
              </button>
            </section>
          )}

          {/* TAB 2: APPOINTMENT HISTORY */}
          {activeTab === 'history' && (
            <section className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="profile-section-title" style={{ margin: 0 }}>Appointment History</h3>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.775rem' }}>
                  0 Records
                </span>
              </div>

              {historyList.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                    <History size={28} />
                  </div>
                  <p className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                    No past appointments found.
                  </p>
                  <p className="empty-state-desc" style={{ marginTop: '0.35rem', lineHeight: 1.45 }}>
                    Completed and past consultation records will be archived here.
                  </p>
                </div>
              ) : null}
            </section>
          )}

          {/* TAB 3: REQUEST APPOINTMENT */}
          {activeTab === 'request' && (
            <section className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
              <h3 className="profile-section-title">Request Appointment</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-brand-tagline)', lineHeight: 1.45 }}>
                Submit an appointment request for a speech-language or neurological consultation.
              </p>

              <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                <div className="profile-field-group">
                  <span className="profile-field-label">Healthcare Provider</span>
                  <select className="form-input select-input" defaultValue="Assigned Doctor">
                    <option value="Assigned Doctor">Assigned Doctor / Speech Therapist</option>
                    <option value="General Clinical Consultation">General Clinical Consultation</option>
                  </select>
                </div>

                <div className="profile-field-group">
                  <span className="profile-field-label">Preferred Time Window</span>
                  <select className="form-input select-input" defaultValue="Morning">
                    <option value="Morning">Morning (9:00 AM – 12:00 PM)</option>
                    <option value="Afternoon">Afternoon (1:00 PM – 4:00 PM)</option>
                    <option value="Evening">Evening (4:00 PM – 6:00 PM)</option>
                  </select>
                </div>

                <div className="profile-field-group">
                  <span className="profile-field-label">Reason for Consultation</span>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Describe any speech difficulties or symptoms..."
                    style={{ resize: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-continue"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  <span>Submit Appointment Request</span>
                </button>
              </form>

              <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 500 }}>
                  Appointment request system will become functional after backend and clinic scheduling integration.
                </p>
              </div>
            </section>
          )}

        </main>
      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default PatientAppointmentsModule;
