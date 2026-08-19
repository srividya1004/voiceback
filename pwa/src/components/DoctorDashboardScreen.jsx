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
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Edit3
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';
import appointmentService from '../services/appointmentService';
import doctorService from '../services/doctorService';
import patientService from '../services/patientService';
import apiClient from '../services/apiClient';

export const DoctorDashboardScreen = ({ onLogout }) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'patients' | 'appointments' | 'emergency'
  const lastSpokenRef = useRef(null);

  // Authenticated Doctor Profile state (resolved from real session/database)
  const session = authService.getActiveSession();
  const sessionUser = session?.user;
  const storedDoc = (() => {
    try {
      return JSON.parse(localStorage.getItem('voiceback_doctor_user') || 'null');
    } catch (e) {
      return null;
    }
  })();

  const initialDoctorName = sessionUser?.fullName || sessionUser?.profile?.fullName || storedDoc?.fullName || session?.email || 'Doctor';

  const [doctorProfile, setDoctorProfile] = useState({
    fullName: initialDoctorName,
    doctorId: sessionUser?.profile?._id || storedDoc?._id || '',
    specialization: sessionUser?.profile?.specialization || storedDoc?.specialization || 'Speech-Language Pathologist & Neurologist',
    hospital: sessionUser?.profile?.hospitalAffiliation || storedDoc?.hospitalAffiliation || 'Clinical Rehabilitation Center',
    email: sessionUser?.email || storedDoc?.email || '',
    phone: sessionUser?.profile?.phone || storedDoc?.phone || '',
  });

  // Real backend appointments, patients & emergency alerts state
  const [appointments, setAppointments] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [statusUpdateNotice, setStatusUpdateNotice] = useState(null);

  // Modal States: Assign Patient & Edit Profile
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignEmailInput, setAssignEmailInput] = useState('');
  const [assignStatusMsg, setAssignStatusMsg] = useState(null);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    fullName: '',
    specialization: '',
    hospitalAffiliation: '',
    phone: ''
  });
  const [profileStatusMsg, setProfileStatusMsg] = useState(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Load real doctor profile, appointments, assigned patients, and emergency alerts
  useEffect(() => {
    loadDoctorIdentity();
    loadAppointments();
    loadPatients();
    loadEmergencyAlerts();
  }, []);

  const loadEmergencyAlerts = async () => {
    try {
      const res = await apiClient.get('/emergency-sos');
      const list = res.data?.data || [];
      setEmergencyAlerts(Array.isArray(list) ? list : []);
    } catch (err) {
      setEmergencyAlerts([]);
    }
  };

  const loadDoctorIdentity = async () => {
    try {
      const res = await doctorService.getAllDoctors();
      const doctorsList = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      
      const currentEmail = (session?.email || '').trim().toLowerCase();
      const currentUserId = sessionUser?.id;

      let matchedDoctor = doctorsList.find((d) => {
        const docEmail = (d.email || '').trim().toLowerCase();
        const docUserId = d.userId?._id || d.userId;
        return (currentEmail && docEmail === currentEmail) || (currentUserId && docUserId === currentUserId);
      });

      if (!matchedDoctor && sessionUser?.profile?._id) {
        matchedDoctor = sessionUser.profile;
      }

      if (matchedDoctor) {
        setDoctorProfile({
          fullName: matchedDoctor.fullName || initialDoctorName,
          doctorId: matchedDoctor._id,
          specialization: matchedDoctor.specialization || 'Speech-Language Pathologist & Neurologist',
          hospital: matchedDoctor.hospitalAffiliation || 'Clinical Rehabilitation Center',
          email: matchedDoctor.email || currentEmail,
          phone: matchedDoctor.phone || '',
        });
        setEditProfileForm({
          fullName: matchedDoctor.fullName || '',
          specialization: matchedDoctor.specialization || '',
          hospitalAffiliation: matchedDoctor.hospitalAffiliation || '',
          phone: matchedDoctor.phone || ''
        });
      }
    } catch (err) {
      console.error('Error fetching doctor identity:', err);
    }
  };

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await patientService.getAllPatients();
      const pList = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setAssignedPatients(pList);
    } catch (err) {
      setAssignedPatients([]);
    }
  };

  // Assign Patient by Registered Email
  const handleAssignPatientSubmit = async (e) => {
    e.preventDefault();
    setAssignStatusMsg(null);
    const email = assignEmailInput.trim().toLowerCase();
    if (!email) {
      setAssignStatusMsg({ type: 'error', text: 'Please enter patient registered email address.' });
      return;
    }
    setSubmittingAssign(true);
    try {
      if (!doctorProfile.doctorId) {
        throw new Error('Doctor session not found.');
      }
      await apiClient.put(`/doctors/${doctorProfile.doctorId}/assign-patient`, {
        email
      });
      setAssignStatusMsg({ type: 'success', text: 'Patient assigned successfully!' });
      setAssignEmailInput('');
      await loadPatients();
      setTimeout(() => setIsAssignModalOpen(false), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign patient.';
      setAssignStatusMsg({ type: 'error', text: msg });
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Edit Doctor Profile Submit
  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileStatusMsg(null);
    setSubmittingProfile(true);
    try {
      if (!doctorProfile.doctorId) {
        throw new Error('Doctor ID not found.');
      }
      const res = await doctorService.update(doctorProfile.doctorId, editProfileForm);
      setProfileStatusMsg({ type: 'success', text: 'Doctor profile updated successfully!' });
      await loadDoctorIdentity();
      setTimeout(() => setIsEditProfileOpen(false), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      setProfileStatusMsg({ type: 'error', text: msg });
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Filter assigned patients for this doctor specifically
  const doctorAssignedPatients = assignedPatients.filter((p) => {
    if (!doctorProfile.doctorId) return true;
    const assignedDocId = p.assignedDoctorId?._id || p.assignedDoctorId;
    return assignedDocId === doctorProfile.doctorId;
  });

  // Filter doctor appointments
  const doctorAppointments = appointments.filter((app) => {
    if (!doctorProfile.doctorId) return true;
    const appDocId = app.doctorId?._id || app.doctorId;
    return appDocId === doctorProfile.doctorId;
  });

  // Filter doctor emergency alerts
  const doctorEmergencyAlerts = emergencyAlerts.filter((sos) => {
    if (!doctorProfile.doctorId) return true;
    const sosDocId = sos.doctorId?._id || sos.doctorId;
    const isAssignedPatient = doctorAssignedPatients.some(p => p._id === (sos.patientId?._id || sos.patientId));
    return sosDocId === doctorProfile.doctorId || isAssignedPatient;
  });

  // Status update using existing PUT /api/appointments/:id API (ONLY valid statuses: Scheduled, Completed, Cancelled)
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setStatusUpdateNotice(null);
    try {
      await appointmentService.updateAppointment(appointmentId, { status: newStatus });
      setStatusUpdateNotice({
        type: 'success',
        text: `Appointment status updated to ${newStatus}.`
      });
      loadAppointments();
      if (voiceAssistant && speak) {
        speak(`Appointment status updated to ${newStatus}.`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update status.';
      setStatusUpdateNotice({ type: 'error', text: errorMsg });
    }
  };

  // Voice Assistant guidance
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (lastSpokenRef.current === 'doctor-dashboard') return;

    lastSpokenRef.current = 'doctor-dashboard';
    speak(`Welcome to Doctor Clinical Portal, ${doctorProfile.fullName}.`);
  }, [voiceAssistant, speak, doctorProfile.fullName]);

  // Drawer menu items
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
      label: 'My Patients',
      icon: Users,
      action: () => {
        setActiveTab('patients');
        setIsDrawerOpen(false);
      },
      isActive: activeTab === 'patients',
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
      id: 'emergency',
      label: 'Emergency Alerts',
      icon: AlertTriangle,
      action: () => {
        setActiveTab('emergency');
        setIsDrawerOpen(false);
      },
      isActive: activeTab === 'emergency',
    },
    {
      id: 'profile',
      label: 'Doctor Profile',
      icon: User,
      action: () => {
        setIsDrawerOpen(false);
        setIsEditProfileOpen(true);
      },
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
      <div className="mobile-container doctor-dashboard-container" style={{ maxWidth: '520px' }}>
        
        {/* ASSIGN PATIENT MODAL BY REGISTERED EMAIL */}
        {isAssignModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="modal-content" style={{ background: 'var(--color-bg-card, #FFFFFF)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  Assign Patient by Registered Email
                </h3>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {assignStatusMsg && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.825rem', fontWeight: 600, background: assignStatusMsg.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: assignStatusMsg.type === 'success' ? 'var(--color-green-primary)' : '#DC2626' }}>
                  {assignStatusMsg.text}
                </div>
              )}

              <form onSubmit={handleAssignPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="profile-field-group">
                  <span className="profile-field-label">Patient Registered Email</span>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. patient.name@example.com"
                    value={assignEmailInput}
                    onChange={(e) => setAssignEmailInput(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary-auth" onClick={() => setIsAssignModalOpen(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-auth" disabled={submittingAssign} style={{ flex: 1, background: 'var(--color-green-primary)' }}>
                    {submittingAssign ? 'Assigning...' : 'Assign Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT DOCTOR PROFILE MODAL */}
        {isEditProfileOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="modal-content" style={{ background: 'var(--color-bg-card, #FFFFFF)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  Edit Doctor Profile
                </h3>
                <button type="button" onClick={() => setIsEditProfileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {profileStatusMsg && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.825rem', fontWeight: 600, background: profileStatusMsg.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: profileStatusMsg.type === 'success' ? 'var(--color-green-primary)' : '#DC2626' }}>
                  {profileStatusMsg.text}
                </div>
              )}

              <form onSubmit={handleEditProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="profile-field-group">
                  <span className="profile-field-label">Full Name</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editProfileForm.fullName}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="profile-field-group">
                  <span className="profile-field-label">Specialization</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editProfileForm.specialization}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, specialization: e.target.value })}
                  />
                </div>
                <div className="profile-field-group">
                  <span className="profile-field-label">Hospital Affiliation</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editProfileForm.hospitalAffiliation}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, hospitalAffiliation: e.target.value })}
                  />
                </div>
                <div className="profile-field-group">
                  <span className="profile-field-label">Phone</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary-auth" onClick={() => setIsEditProfileOpen(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-auth" disabled={submittingProfile} style={{ flex: 1, background: 'var(--color-green-primary)' }}>
                    {submittingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NAVIGATION DRAWER */}
        <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        <aside className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`} aria-label="Clinical Navigation Drawer">
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

          <div className="drawer-user-badge" onClick={() => { setIsDrawerOpen(false); setIsEditProfileOpen(true); }}>
            <div className="drawer-avatar-circle" style={{ background: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green-primary)' }}>
              <Stethoscope size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{doctorProfile.fullName}</h4>
              <span className="drawer-user-role" style={{ color: 'var(--color-green-primary)', fontWeight: 700 }}>
                Primary Doctor
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

        {/* HEADER BAR */}
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
                Doctor Portal
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-green-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Primary Physician Dashboard
              </span>
            </div>
          </div>

          <button
            type="button"
            className="header-profile-avatar-btn"
            onClick={() => setIsEditProfileOpen(true)}
            style={{ background: 'rgba(22, 163, 74, 0.12)', borderColor: 'var(--color-green-primary)', color: 'var(--color-green-primary)' }}
            aria-label="Doctor Profile"
            title="Doctor Profile"
          >
            <Stethoscope size={20} />
          </button>
        </header>

        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* DOCTOR IDENTITY CARD (MATCHING PATIENT PROFILE UX) */}
          <section className="profile-section-card" style={{ width: '100%', gap: '0.75rem', background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(2, 132, 199, 0.06) 100%)', border: '1.5px solid rgba(22, 163, 74, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-green-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}>
                <Stethoscope size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  {doctorProfile.fullName}
                </h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
                  {doctorProfile.specialization}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-brand-tagline)', marginTop: '0.25rem' }}>
              <Building size={14} color="var(--color-green-primary)" />
              <span>{doctorProfile.hospital}</span>
            </div>
          </section>

          {/* STATUS UPDATE NOTICE BANNER */}
          {statusUpdateNotice && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: statusUpdateNotice.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                color: statusUpdateNotice.type === 'success' ? 'var(--color-green-primary)' : '#DC2626',
                border: `1px solid ${statusUpdateNotice.type === 'success' ? 'var(--color-green-primary)' : '#DC2626'}`
              }}
            >
              {statusUpdateNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{statusUpdateNotice.text}</span>
            </div>
          )}

          {/* CLINICAL QUICK ACTION GRID */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', width: '100%' }}>
            <div
              className="action-card"
              onClick={() => setIsAssignModalOpen(true)}
              style={{ minHeight: 'auto', padding: '1rem', cursor: 'pointer' }}
            >
              <div className="action-card-header">
                <div className="action-icon-box" style={{ background: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green-primary)' }}>
                  <UserPlus size={20} />
                </div>
                <ArrowRight size={16} className="action-arrow-icon" />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <h3 className="action-card-title" style={{ fontSize: '0.95rem' }}>Assign Patient</h3>
                <p className="action-card-desc" style={{ fontSize: '0.775rem' }}>Link via registered email</p>
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
                <p className="action-card-desc" style={{ fontSize: '0.775rem' }}>Consultations schedule</p>
              </div>
            </div>
          </section>

          {/* ASSIGNED PATIENTS ROSTER */}
          {(activeTab === 'overview' || activeTab === 'patients') && (
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-green-primary)" />
                  <h3>My Patients Roster</h3>
                </div>
                <button
                  type="button"
                  className="btn-secondary-auth"
                  onClick={() => setIsAssignModalOpen(true)}
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderColor: 'var(--color-green-primary)', color: 'var(--color-green-primary)' }}
                >
                  + Assign Patient
                </button>
              </div>

              {doctorAssignedPatients.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <p className="empty-state-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    No patients assigned.
                  </p>
                  <p className="empty-state-desc" style={{ marginTop: '0.35rem', lineHeight: 1.45 }}>
                    Click "+ Assign Patient" to link a patient using their registered email address.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  {doctorAssignedPatients.map((p) => (
                    <div key={p._id} style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{p.fullName}</h4>
                        <span style={{ fontSize: '0.775rem', color: 'var(--color-brand-tagline)' }}>
                          {p.email ? `Email: ${p.email} • ` : ''}Aphasia: {p.aphasiaType} • Age {p.age}
                        </span>
                      </div>
                      <span className="device-name-badge connected" style={{ fontSize: '0.7rem' }}>Assigned</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* APPOINTMENTS SCHEDULE */}
          {(activeTab === 'overview' || activeTab === 'appointments') && (
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#9333EA" />
                  <h3>Doctor Appointment Schedule</h3>
                </div>
                <span className="device-name-badge connected" style={{ fontSize: '0.75rem' }}>
                  {doctorAppointments.length} Appointments
                </span>
              </div>

              {loadingAppointments ? (
                <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-brand-tagline)' }}>
                  Loading appointments from backend...
                </p>
              ) : doctorAppointments.length === 0 ? (
                <div className="recent-activity-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
                  <p className="empty-state-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                    No appointments scheduled.
                  </p>
                  <p className="empty-state-desc" style={{ marginTop: '0.35rem', lineHeight: 1.45 }}>
                    When caregivers book consultations for your assigned patients, appointments will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                  {doctorAppointments.map((app) => (
                    <div
                      key={app._id}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        background: 'var(--color-bg-card, #FFFFFF)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-brand-title)', margin: 0 }}>
                            Patient: {app.patientId?.fullName || 'Assigned Patient'}
                          </h4>
                          {app.patientId?.aphasiaType && (
                            <span style={{ fontSize: '0.775rem', color: 'var(--color-brand-tagline)' }}>
                              Aphasia: {app.patientId.aphasiaType}
                            </span>
                          )}
                        </div>
                        <span className="device-name-badge connected" style={{ fontSize: '0.75rem' }}>
                          {app.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-brand-title)', fontWeight: 600 }}>
                        <Clock size={16} color="var(--color-blue-primary)" />
                        <span>{new Date(app.appointmentDate).toLocaleString()}</span>
                      </div>

                      {app.clinicalNotes && (
                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.03)', fontSize: '0.825rem', color: 'var(--color-brand-tagline)' }}>
                          <strong>Reason:</strong> {app.clinicalNotes}
                        </div>
                      )}

                      {/* STATUS ACTION BUTTONS (Scheduled -> Completed / Cancelled) */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {app.status !== 'Completed' && (
                          <button
                            type="button"
                            className="btn-secondary-auth"
                            onClick={() => handleUpdateStatus(app._id, 'Completed')}
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.775rem', color: 'var(--color-green-primary)', borderColor: 'var(--color-green-primary)' }}
                          >
                            Mark Completed
                          </button>
                        )}
                        {app.status !== 'Cancelled' && (
                          <button
                            type="button"
                            className="btn-secondary-auth"
                            onClick={() => handleUpdateStatus(app._id, 'Cancelled')}
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.775rem', color: '#DC2626', borderColor: '#DC2626' }}
                          >
                            Cancel Session
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* EMERGENCY ALERTS FOR ASSIGNED PATIENTS (READ-ONLY VIEW) */}
          {(activeTab === 'overview' || activeTab === 'emergency') && (
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <h3>Emergency SOS Alerts</h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.75rem' }}>
                  {doctorEmergencyAlerts.length} Alerts
                </span>
              </div>

              {doctorEmergencyAlerts.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--color-brand-tagline)', fontSize: '0.85rem' }}>
                  No emergency alerts recorded for assigned patients.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  {doctorEmergencyAlerts.map((sos) => (
                    <div key={sos._id} style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(220,38,38,0.06)', border: '1px solid #DC2626', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#DC2626', fontSize: '0.85rem' }}>
                        <span>Patient: {sos.patientId?.fullName || 'Assigned Patient'}</span>
                        <span>{sos.status}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-title)' }}>{sos.message}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-tagline)' }}>Triggered: {new Date(sos.triggeredAt).toLocaleString()}</span>
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

export default DoctorDashboardScreen;
