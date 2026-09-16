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
  CheckCircle2
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';
import apiClient from '../services/apiClient';
import patientService from '../services/patientService';

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
  const [sosNoticeMsg, setSosNoticeMsg] = useState(null);
  const [submittingSos, setSubmittingSos] = useState(false);
  const lastSpokenRef = useRef(null);

  // Authenticated Patient Profile & Caregiver/Doctor Info
  const [patientProfile, setPatientProfile] = useState({
    id: '',
    fullName: 'Patient',
    assignedDoctorName: 'No doctor assigned.',
    assignedCaregiverId: null,
    assignedCaregiverName: 'No caregiver linked.'
  });

  const [avatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem('voiceback_patient_avatar') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    loadPatientDetails();
  }, []);

  const loadPatientDetails = async () => {
    try {
      const session = authService.getActiveSession();
      const userEmail = session?.email || '';
      const patientsRes = await patientService.getAllPatients();
      const list = Array.isArray(patientsRes?.data) ? patientsRes.data : Array.isArray(patientsRes) ? patientsRes : [];
      let match = list.find((p) => (p.email || p.userId?.email || '').toLowerCase() === userEmail.toLowerCase());

      if (!match && session?.user?.id) {
        match = list.find((p) => String(p.userId?._id || p.userId) === String(session.user.id) || String(p._id) === String(session.user.id));
      }

      if (match) {
        const cg = match.assignedCaregiverId;
        const cgId = cg?._id ? String(cg._id) : (cg ? String(cg) : null);
        const cgName = cg?.fullName || (cgId ? 'Assigned Caregiver' : '');

        setPatientProfile({
          id: match._id,
          fullName: match.fullName || session?.name || 'Patient',
          assignedDoctorName: match.assignedDoctorId?.fullName ? `Dr. ${match.assignedDoctorId.fullName}` : 'No doctor assigned.',
          assignedCaregiverId: cgId,
          assignedCaregiverName: cgName || 'No caregiver linked.'
        });
      } else {
        const stored = JSON.parse(localStorage.getItem('voiceback_patient_user') || 'null');
        const cg = stored?.assignedCaregiverId;
        const cgId = cg?._id ? String(cg._id) : (cg ? String(cg) : null);
        const cgName = cg?.fullName || (cgId ? 'Assigned Caregiver' : '');

        setPatientProfile({
          id: stored?._id || session?.user?.id || '',
          fullName: session?.name || stored?.fullName || 'Patient',
          assignedDoctorName: 'No doctor assigned.',
          assignedCaregiverId: cgId,
          assignedCaregiverName: cgName || 'No caregiver linked.'
        });
      }
    } catch (e) {
      console.error('Error fetching patient emergency details:', e);
    }
  };

  const firstLetter = patientProfile.fullName ? patientProfile.fullName.trim().charAt(0).toUpperCase() : 'P';

  // Voice Assistant guidance
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (lastSpokenRef.current === 'emergency-sos-home') return;

    lastSpokenRef.current = 'emergency-sos-home';
    speak('Emergency assistance module. Tap Confirm Emergency SOS to trigger alert.');
  }, [voiceAssistant, speak]);

  const handleEmergencyButtonClick = () => {
    if (!patientProfile.assignedCaregiverId) {
      const noCgMsg = 'No caregiver is assigned. Emergency alert could not be sent.';
      setSosNoticeMsg({ type: 'error', text: noCgMsg });
      if (voiceAssistant && speak) {
        speak(noCgMsg);
      }
      setTimeout(() => setSosNoticeMsg(null), 5000);
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const handleSendRequest = async () => {
    setIsConfirmDialogOpen(false);
    if (!patientProfile.assignedCaregiverId) {
      const noCgMsg = 'No caregiver is assigned. Emergency alert could not be sent.';
      setSosNoticeMsg({ type: 'error', text: noCgMsg });
      if (voiceAssistant && speak) {
        speak(noCgMsg);
      }
      setTimeout(() => setSosNoticeMsg(null), 5000);
      return;
    }

    setSubmittingSos(true);
    try {
      if (!patientProfile.id) {
        throw new Error('Patient ID is missing.');
      }
      const res = await apiClient.post('/emergency-sos', {
        patientId: patientProfile.id,
        location: 'Home / Living Room',
        message: 'Patient triggered Emergency SOS!'
      });

      const cgName = res.data?.data?.caregiverId?.fullName || patientProfile.assignedCaregiverName || 'Assigned Caregiver';
      const successMsg = `Emergency SOS sent! Your assigned caregiver (${cgName}) has been alerted.`;
      setSosNoticeMsg({ type: 'success', text: successMsg });
      if (voiceAssistant && speak) {
        speak(`Emergency SOS sent. Your assigned caregiver, ${cgName}, has been alerted.`);
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || e.message || 'Failed to record emergency alert.';
      setSosNoticeMsg({ type: 'error', text: errMsg });
      if (voiceAssistant && speak) {
        speak(errMsg);
      }
    } finally {
      setSubmittingSos(false);
      setTimeout(() => setSosNoticeMsg(null), 6000);
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
      <div className="mobile-container emergency-sos-container" style={{ maxWidth: '520px' }}>
        
        {/* NAVIGATION DRAWER */}
        <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        <aside className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`} aria-label="Navigation Drawer">
          <div className="drawer-header">
            <VoiceBackLogo variant="header" />
            <button
              type="button"
              className="btn-close-sheet"
              onClick={() => setIsDrawerOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="drawer-user-badge" onClick={onOpenProfile}>
            <div className="drawer-avatar-circle">
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt={patientProfile.fullName} className="drawer-avatar-img" />
              ) : (
                <span>{firstLetter}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{patientProfile.fullName}</h4>
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
            onClick={onOpenProfile}
          >
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt={patientProfile.fullName} className="header-avatar-img" />
            ) : (
              <span className="header-avatar-initial">{firstLetter}</span>
            )}
          </button>
        </header>

        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* TRUTHFUL NOTICE BANNER */}
          {sosNoticeMsg && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                background: sosNoticeMsg.type === 'error' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(22, 163, 74, 0.12)',
                border: `1.5px solid ${sosNoticeMsg.type === 'error' ? '#DC2626' : 'var(--color-green-primary)'}`,
                color: sosNoticeMsg.type === 'error' ? '#DC2626' : 'var(--color-green-primary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textAlign: 'center',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {sosNoticeMsg.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
              <span>{typeof sosNoticeMsg === 'string' ? sosNoticeMsg : sosNoticeMsg.text}</span>
            </div>
          )}

          {/* LARGE RED EMERGENCY BUTTON */}
          <section className="profile-section-card" style={{ width: '100%', textAlign: 'center', padding: '1.75rem 1.25rem', gap: '1rem', background: 'rgba(220, 38, 38, 0.03)', border: '2px solid rgba(220, 38, 38, 0.3)' }}>
            <button
              type="button"
              className="btn-danger-logout"
              onClick={handleEmergencyButtonClick}
              disabled={submittingSos}
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
              <span>🚨 CONFIRM EMERGENCY SOS</span>
            </button>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-tagline)', margin: 0 }}>
              Trigger alert to notify your assigned caregiver immediately.
            </p>
          </section>

          {/* RELEVANT CONTACT INFORMATION */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
            {/* Caregiver Status Card */}
            <div className="profile-section-card" style={{ width: '100%', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Heart size={20} color="var(--color-orange-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                  Linked Caregiver
                </h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-title)', fontWeight: 700, margin: 0 }}>
                {patientProfile.assignedCaregiverName}
              </p>
            </div>

            {/* Doctor Status Card */}
            <div className="profile-section-card" style={{ width: '100%', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} color="var(--color-blue-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                  Assigned Doctor
                </h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-title)', fontWeight: 700, margin: 0 }}>
                {patientProfile.assignedDoctorName}
              </p>
            </div>
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
                Trigger Emergency Alert?
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-tagline)', marginTop: '0.4rem', lineHeight: 1.45 }}>
                An emergency alert will be sent directly to your assigned caregiver ({patientProfile.assignedCaregiverName}).
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
              <button
                type="button"
                className="btn-continue"
                onClick={handleSendRequest}
                style={{ width: '100%', background: '#DC2626' }}
              >
                <span>Confirm Emergency Alert</span>
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
