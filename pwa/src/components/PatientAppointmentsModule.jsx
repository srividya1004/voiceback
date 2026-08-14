import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  History,
  Home,
  Settings,
  LogOut,
  ArrowRight,
  Info,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import appointmentService from '../services/appointmentService';

import authService from '../services/authService';

export const PatientAppointmentsModule = ({
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastSpokenRef = useRef(null);

  // Sync authenticated patient profile from authService / session
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

  // Fetch real appointments from backend
  useEffect(() => {
    let isMounted = true;
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const data = await appointmentService.getAppointments();
        if (isMounted) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching patient appointments:', err);
        if (isMounted) setAppointments([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAppointments();
    return () => {
      isMounted = false;
    };
  }, []);

  // Voice Assistant guidance
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (activeTab === 'upcoming' && lastSpokenRef.current !== 'upcoming') {
      lastSpokenRef.current = 'upcoming';
      speak('Upcoming appointments. View your scheduled consultations.');
    } else if (activeTab === 'history' && lastSpokenRef.current !== 'history') {
      lastSpokenRef.current = 'history';
      speak('Appointment history.');
    }
  }, [activeTab, voiceAssistant, speak]);

  const upcomingList = appointments.filter(
    (app) => app.status === 'Scheduled'
  );
  const historyList = appointments.filter(
    (app) => app.status === 'Completed' || app.status === 'Cancelled'
  );

  const getStatusBadge = (status) => {
    if (status === 'Scheduled') {
      return (
        <span className="device-name-badge connected" style={{ background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)', border: '1px solid var(--color-blue-primary)' }}>
          {t('statusScheduled')}
        </span>
      );
    }
    if (status === 'Completed') {
      return (
        <span className="device-name-badge connected" style={{ background: 'rgba(22, 163, 74, 0.1)', color: 'var(--color-green-primary)', border: '1px solid var(--color-green-primary)' }}>
          {t('statusCompleted')}
        </span>
      );
    }
    if (status === 'Cancelled') {
      return (
        <span className="device-name-badge disconnected" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid #DC2626' }}>
          {t('statusCancelled')}
        </span>
      );
    }
    return <span className="device-name-badge disconnected">{status}</span>;
  };

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
      label: t('readOnlyPatientAppointmentTitle'),
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
      label: t('settings'),
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
        
        {/* NAVIGATION DRAWER */}
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
              <span className="drawer-user-role">{t('patient')}</span>
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
              {t('readOnlyPatientAppointmentTitle')}
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
          
          {/* READ ONLY NOTICE BANNER */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '14px',
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1.5px solid var(--color-blue-primary)',
              color: 'var(--color-blue-primary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              lineHeight: 1.4
            }}
          >
            <Info size={20} style={{ flexShrink: 0 }} />
            <span>{t('readOnlyPatientNotice')}</span>
          </div>

          {/* SEGMENTED TAB SWITCHER (NO BOOKING/REQUEST TAB) */}
          <div className="segmented-group" style={{ width: '100%' }}>
            <button
              type="button"
              className={`segmented-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <Calendar size={15} />
              <span>Upcoming ({upcomingList.length})</span>
            </button>

            <button
              type="button"
              className={`segmented-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={15} />
              <span>History ({historyList.length})</span>
            </button>
          </div>

          {/* TAB 1: UPCOMING APPOINTMENTS */}
          {activeTab === 'upcoming' && (
            <section className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
              <h3 className="profile-section-title" style={{ margin: 0 }}>
                {t('statusScheduled')}
              </h3>

              {loading ? (
                <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-brand-tagline)' }}>
                  Loading appointments...
                </p>
              ) : upcomingList.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                    <Calendar size={28} />
                  </div>
                  <p className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                    {t('noAppointmentsFound')}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {upcomingList.map((app) => (
                    <div
                      key={app._id}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        background: 'var(--color-bg-card, #FFFFFF)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Stethoscope size={18} color="var(--color-blue-primary)" />
                          <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-brand-title)', margin: 0 }}>
                            {app.doctorId?.fullName || 'Doctor Consultation'}
                          </h4>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      {app.doctorId?.specialization && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', fontWeight: 500 }}>
                          {app.doctorId.specialization} • {app.doctorId.hospitalAffiliation}
                        </span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-brand-title)', fontWeight: 600, marginTop: '0.2rem' }}>
                        <Clock size={16} color="var(--color-blue-primary)" />
                        <span>{new Date(app.appointmentDate).toLocaleString()}</span>
                      </div>

                      {app.clinicalNotes && (
                        <div style={{ marginTop: '0.3rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', fontSize: '0.825rem', color: 'var(--color-brand-tagline)' }}>
                          <strong>{t('reasonForAppointment')}:</strong> {app.clinicalNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 2: APPOINTMENT HISTORY */}
          {activeTab === 'history' && (
            <section className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
              <h3 className="profile-section-title" style={{ margin: 0 }}>
                Appointment History
              </h3>

              {loading ? (
                <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-brand-tagline)' }}>
                  Loading history...
                </p>
              ) : historyList.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                    <History size={28} />
                  </div>
                  <p className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                    No past appointments found.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {historyList.map((app) => (
                    <div
                      key={app._id}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        background: 'var(--color-bg-card, #FFFFFF)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Stethoscope size={18} color="var(--color-blue-primary)" />
                          <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-brand-title)', margin: 0 }}>
                            {app.doctorId?.fullName || 'Doctor Consultation'}
                          </h4>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-brand-title)', fontWeight: 600 }}>
                        <Clock size={16} color="var(--color-blue-primary)" />
                        <span>{new Date(app.appointmentDate).toLocaleString()}</span>
                      </div>

                      {app.clinicalNotes && (
                        <div style={{ marginTop: '0.2rem', fontSize: '0.825rem', color: 'var(--color-brand-tagline)' }}>
                          <strong>{t('reasonForAppointment')}:</strong> {app.clinicalNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
