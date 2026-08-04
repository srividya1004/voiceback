import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowLeft,
  Stethoscope,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  Search,
  Plus,
  Home,
  User,
  Settings,
  LogOut,
  ArrowRight,
  Info,
  Check,
  Shield,
  Activity,
  UserCheck,
  Building
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const DoctorDashboardScreen = ({ onLogout }) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'patients' | 'reports' | 'appointments' | 'alerts'
  const lastSpokenRef = useRef(null);

  // Doctor Clinical Profile (Stored or fetched from API GET /api/doctors/me)
  const [doctorProfile] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voiceback_doctor_user') || 'null');
      if (stored && stored.fullName) return stored;
    } catch (e) {
      // ignore
    }
    return {
      fullName: 'Dr. Rajesh Sharma',
      doctorId: 'DOC-7049',
      specialization: 'Speech-Language Pathologist & Neurologist',
      hospital: 'AIIMS Clinical Rehabilitation Center',
      email: 'dr.sharma@voiceback.health',
    };
  });

  // Dynamic state schemas ready for backend REST API payloads
  const [assignedPatients] = useState([]); // Ready for GET /api/patients?assignedDoctorId=DOC-7049
  const [appointments] = useState([]);      // Ready for GET /api/appointments?assignedDoctorId=DOC-7049
  const [clinicalReports] = useState([]);   // Ready for GET /api/therapy-progress?assignedDoctorId=DOC-7049
  const [emergencyAlerts] = useState([]);   // Ready for GET /api/emergency-sos?assignedDoctorId=DOC-7049

  // Voice Assistant: Speak once on doctor dashboard mount
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (lastSpokenRef.current === 'doctor-dashboard') return;

    lastSpokenRef.current = 'doctor-dashboard';
    speak(`Welcome to Doctor Clinical Portal, ${doctorProfile.fullName}.`);
  }, [voiceAssistant, speak, doctorProfile.fullName]);

  // Drawer menu items for Doctor (RBAC compliant)
  const drawerItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: Home,
      action: () => {
        setActiveTab('overview');
        setIsDrawerOpen(false);
      },
      isActive: activeTab === 'overview',
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      action: () => {
        setActiveTab('patients');
        setIsDrawerOpen(false);
      },
      isActive: activeTab === 'patients',
    },
    {
      id: 'therapy-monitoring',
      label: 'Therapy Monitoring',
      icon: Activity,
      action: () => {
        setActiveTab('reports');
        setIsDrawerOpen(false);
      },
      isActive: false,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      action: () => {
        setActiveTab('reports');
        setIsDrawerOpen(false);
      },
      isActive: activeTab === 'reports',
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      action: () => {
        setActiveTab('appointments');
        setIsDrawerOpen(false);
      },
      isActive: activeTab === 'appointments',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      action: () => {
        setActiveTab('overview');
        setIsDrawerOpen(false);
      },
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
      <div className="mobile-container doctor-dashboard-container" style={{ maxWidth: '520px' }}>
        
        {/* LEFT SLIDE NAVIGATION DRAWER */}
        <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        <aside className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`} aria-label="Clinical Navigation Drawer">
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

          {/* Doctor Profile Badge */}
          <div className="drawer-user-badge">
            <div className="drawer-avatar-circle" style={{ background: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green-primary)' }}>
              <Stethoscope size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{doctorProfile.fullName}</h4>
              <span className="drawer-user-role" style={{ color: 'var(--color-green-primary)', fontWeight: 700 }}>
                Doctor / Clinician
              </span>
            </div>
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
              <span>Logout Doctor Portal</span>
            </button>
          </div>
        </aside>

        {/* CLINICAL HEADER BAR */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              type="button"
              className="settings-btn"
              aria-label="Open Navigation Menu"
              onClick={() => setIsDrawerOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Doctor Clinical Portal
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-green-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Medical Dashboard
              </span>
            </div>
          </div>

          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(22, 163, 74, 0.12)',
              border: '2px solid var(--color-green-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-green-primary)',
            }}
            title={doctorProfile.fullName}
          >
            <Stethoscope size={22} />
          </div>
        </header>

        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* DOCTOR WELCOME SECTION */}
          <section className="profile-section-card" style={{ width: '100%', gap: '0.75rem', background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(2, 132, 199, 0.06) 100%)', border: '1.5px solid rgba(22, 163, 74, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-green-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyCenter: 'center', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}>
                <Stethoscope size={26} style={{ margin: 'auto' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  {doctorProfile.fullName}
                </h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
                  {doctorProfile.specialization} • ID: #{doctorProfile.doctorId}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-brand-tagline)', marginTop: '0.25rem' }}>
              <Building size={14} color="var(--color-green-primary)" />
              <span>{doctorProfile.hospital}</span>
            </div>
          </section>

          {/* CLINICAL QUICK ACTION CARDS */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', width: '100%' }}>
            <div
              className="action-card"
              onClick={() => setActiveTab('patients')}
              style={{ minHeight: 'auto', padding: '1rem', cursor: 'pointer' }}
            >
              <div className="action-card-header">
                <div className="action-icon-box" style={{ background: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green-primary)' }}>
                  <Users size={20} />
                </div>
                <ArrowRight size={16} className="action-arrow-icon" />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <h3 className="action-card-title" style={{ fontSize: '0.95rem' }}>Patient Roster</h3>
                <p className="action-card-desc" style={{ fontSize: '0.775rem' }}>Assigned patient profiles</p>
              </div>
            </div>

            <div
              className="action-card"
              onClick={() => setActiveTab('reports')}
              style={{ minHeight: 'auto', padding: '1rem', cursor: 'pointer' }}
            >
              <div className="action-card-header">
                <div className="action-icon-box" style={{ background: 'rgba(2, 132, 199, 0.12)', color: 'var(--color-blue-primary)' }}>
                  <FileText size={20} />
                </div>
                <ArrowRight size={16} className="action-arrow-icon" />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <h3 className="action-card-title" style={{ fontSize: '0.95rem' }}>Clinical Reports</h3>
                <p className="action-card-desc" style={{ fontSize: '0.775rem' }}>sEMG logs & therapy progress</p>
              </div>
            </div>

            <div
              className="action-card"
              onClick={() => setActiveTab('appointments')}
              style={{ minHeight: 'auto', padding: '1rem', cursor: 'pointer' }}
            >
              <div className="action-card-header">
                <div className="action-icon-box" style={{ background: 'rgba(147, 51, 234, 0.12)', color: '#9333EA' }}>
                  <Calendar size={20} />
                </div>
                <ArrowRight size={16} className="action-arrow-icon" />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <h3 className="action-card-title" style={{ fontSize: '0.95rem' }}>Appointments</h3>
                <p className="action-card-desc" style={{ fontSize: '0.775rem' }}>Consultation schedule</p>
              </div>
            </div>

            <div
              className="action-card"
              onClick={() => setActiveTab('alerts')}
              style={{ minHeight: 'auto', padding: '1rem', cursor: 'pointer' }}
            >
              <div className="action-card-header">
                <div className="action-icon-box" style={{ background: 'rgba(220, 38, 38, 0.12)', color: '#DC2626' }}>
                  <AlertTriangle size={20} />
                </div>
                <ArrowRight size={16} className="action-arrow-icon" />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <h3 className="action-card-title" style={{ fontSize: '0.95rem' }}>SOS Alerts</h3>
                <p className="action-card-desc" style={{ fontSize: '0.775rem' }}>Urgent patient notifications</p>
              </div>
            </div>
          </section>

          {/* TAB 1: ASSIGNED PATIENTS (HONEST EMPTY STATE) */}
          {(activeTab === 'overview' || activeTab === 'patients') && (
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-green-primary)" />
                  <h3>Assigned Patients</h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.75rem' }}>
                  0 Patients
                </span>
              </div>

              {assignedPatients.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <p className="empty-state-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    No patients assigned.
                  </p>
                  <p className="empty-state-desc" style={{ marginTop: '0.35rem', lineHeight: 1.45 }}>
                    Patient records will appear here when patients link your Doctor ID (<strong>#{doctorProfile.doctorId}</strong>) in their profiles.
                  </p>
                </div>
              ) : null}
            </section>
          )}

          {/* TAB 2: TODAY'S APPOINTMENTS (HONEST EMPTY STATE) */}
          {(activeTab === 'overview' || activeTab === 'appointments') && (
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#9333EA" />
                  <h3>Appointments</h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.75rem' }}>
                  0 Appointments
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <p className="empty-state-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    No appointments scheduled.
                  </p>
                  <p className="empty-state-desc" style={{ marginTop: '0.35rem', lineHeight: 1.45 }}>
                    Appointment calendar will synchronize after backend integration.
                  </p>
                </div>
              ) : null}
            </section>
          )}

          {/* TAB 3: CLINICAL REPORTS (HONEST EMPTY STATE) */}
          {(activeTab === 'overview' || activeTab === 'reports') && (
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="var(--color-blue-primary)" />
                  <h3>Clinical Reports</h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.75rem' }}>
                  0 Reports
                </span>
              </div>

              {clinicalReports.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <p className="empty-state-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    Reports will become available after backend integration.
                  </p>
                  <p className="empty-state-desc" style={{ marginTop: '0.35rem', lineHeight: 1.45 }}>
                    Patient therapy progress and sEMG reports will populate as assigned patients complete rehabilitation sessions.
                  </p>
                </div>
              ) : null}
            </section>
          )}

          {/* TAB 4: EMERGENCY ALERTS / NOTIFICATIONS (HONEST EMPTY STATE) */}
          {(activeTab === 'overview' || activeTab === 'alerts') && (
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <h3>Notifications & Alerts</h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.75rem' }}>
                  0 Notifications
                </span>
              </div>

              {emergencyAlerts.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <p className="empty-state-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    No notifications available.
                  </p>
                  <p className="empty-state-desc" style={{ marginTop: '0.35rem', lineHeight: 1.45 }}>
                    Real-time patient SOS notifications and clinical updates will be received here.
                  </p>
                </div>
              ) : null}
            </section>
          )}

          {/* BACKEND INTEGRATION NOTICE */}
          <section style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.05)', border: '1px dashed var(--border-color)', textAlign: 'center', width: '100%' }}>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 500 }}>
              Doctor Clinical Portal is pre-architected to receive live API data from Express backend endpoints.
            </p>
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

export default DoctorDashboardScreen;
