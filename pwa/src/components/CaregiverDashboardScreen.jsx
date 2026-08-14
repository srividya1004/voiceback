import React, { useState, useEffect } from 'react';
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
  Plus,
  ArrowLeft,
  Clock,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';
import appointmentService from '../services/appointmentService';
import patientService from '../services/patientService';
import doctorService from '../services/doctorService';
import caregiverService from '../services/caregiverService';
import apiClient from '../services/apiClient';

export const CaregiverDashboardScreen = ({ onLogout }) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  // Appointment Booking & Relationship State
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [patientsRoster, setPatientsRoster] = useState([]);
  const [doctorsRoster, setDoctorsRoster] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form inputs for Caregiver Appointment Booking
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDateTime, setAppointmentDateTime] = useState('');
  const [reasonForAppointment, setReasonForAppointment] = useState('');
  const [bookingStatusMsg, setBookingStatusMsg] = useState(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Link Patient Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [linkStatusMsg, setLinkStatusMsg] = useState(null);
  const [submittingLink, setSubmittingLink] = useState(false);

  // Edit Caregiver Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    fullName: '',
    phone: '',
    relationshipToPatient: ''
  });
  const [profileStatusMsg, setProfileStatusMsg] = useState(null);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Authenticated Caregiver Profile state
  const session = authService.getActiveSession();
  const sessionUser = session?.user;
  const storedCg = (() => {
    try {
      return JSON.parse(localStorage.getItem('voiceback_caregiver_user') || 'null');
    } catch (e) {
      return null;
    }
  })();

  const initialCaregiverName = sessionUser?.fullName || sessionUser?.profile?.fullName || storedCg?.fullName || session?.email || 'Caregiver';

  const [caregiverProfile, setCaregiverProfile] = useState({
    id: sessionUser?.profile?._id || storedCg?._id || '',
    fullName: initialCaregiverName,
    relationship: sessionUser?.profile?.relationshipToPatient || storedCg?.relationshipToPatient || storedCg?.relationship || 'Caregiver',
    email: sessionUser?.email || storedCg?.email || '',
    mobileNumber: sessionUser?.profile?.phone || storedCg?.phone || storedCg?.mobileNumber || '',
    assignedPatients: sessionUser?.profile?.assignedPatients || storedCg?.assignedPatients || []
  });

  const caregiverFirstName = caregiverProfile.fullName ? caregiverProfile.fullName.split(' ')[0] : 'Caregiver';

  useEffect(() => {
    loadCaregiverIdentity();
  }, []);

  const loadCaregiverIdentity = async () => {
    try {
      const res = await caregiverService.getAllCaregivers();
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      const currentEmail = (session?.email || '').trim().toLowerCase();
      const currentUserId = sessionUser?.id;
      const match = list.find((c) => {
        const cEmail = (c.email || '').trim().toLowerCase();
        const cUserId = c.userId?._id || c.userId;
        return (currentEmail && cEmail === currentEmail) || (currentUserId && cUserId === currentUserId);
      });
      if (match) {
        setCaregiverProfile({
          id: match._id,
          fullName: match.fullName,
          relationship: match.relationshipToPatient || 'Caregiver',
          email: match.email || currentEmail,
          mobileNumber: match.phone || '',
          assignedPatients: match.assignedPatients || []
        });
        setEditProfileForm({
          fullName: match.fullName || '',
          phone: match.phone || '',
          relationshipToPatient: match.relationshipToPatient || 'Caregiver'
        });
      }
    } catch (err) {
      console.error('Error loading caregiver identity:', err);
    }
  };

  useEffect(() => {
    loadAppointmentData();
  }, [currentView, caregiverProfile.id]);

  const loadAppointmentData = async () => {
    setLoadingData(true);
    try {
      const [appsData, patientsRes, doctorsRes, sosRes] = await Promise.all([
        appointmentService.getAppointments().catch(() => []),
        patientService.getAllPatients().catch(() => ({ data: [] })),
        doctorService.getAllDoctors().catch(() => ({ data: [] })),
        apiClient.get('/emergency-sos').catch(() => ({ data: { data: [] } }))
      ]);

      setAppointmentsList(Array.isArray(appsData) ? appsData : []);

      const allPatients = Array.isArray(patientsRes.data) ? patientsRes.data : Array.isArray(patientsRes) ? patientsRes : [];
      setPatientsRoster(allPatients);

      const allDoctors = Array.isArray(doctorsRes.data) ? doctorsRes.data : Array.isArray(doctorsRes) ? doctorsRes : [];
      setDoctorsRoster(allDoctors);

      const sosList = sosRes.data?.data || [];
      setEmergencyAlerts(Array.isArray(sosList) ? sosList : []);
    } catch (err) {
      console.error('Error loading caregiver appointment data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Filter linked patients strictly for this caregiver
  const linkedPatients = patientsRoster.filter((p) => {
    if (!caregiverProfile.id) return false;
    const assignedCgId = p.assignedCaregiverId?._id || p.assignedCaregiverId;
    const inAssignedArray = Array.isArray(caregiverProfile.assignedPatients) &&
      caregiverProfile.assignedPatients.some(ap => (ap._id || ap) === p._id);
    return (assignedCgId && assignedCgId === caregiverProfile.id) || inAssignedArray;
  });

  // Auto-select assigned doctor when selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      const p = linkedPatients.find(item => item._id === selectedPatientId);
      if (p && p.assignedDoctorId) {
        setSelectedDoctorId(p.assignedDoctorId._id || p.assignedDoctorId);
      } else {
        setSelectedDoctorId('');
      }
    }
  }, [selectedPatientId, patientsRoster]);

  // Handle linking patient via registered email
  const handleLinkPatientSubmit = async (e) => {
    e.preventDefault();
    setLinkStatusMsg(null);
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!normalizedEmail) {
      setLinkStatusMsg({ type: 'error', text: 'Please enter a valid patient registered email.' });
      return;
    }
    setSubmittingLink(true);
    try {
      if (!caregiverProfile.id) {
        throw new Error('Caregiver session not found. Please log in again.');
      }
      await apiClient.put(`/caregivers/${caregiverProfile.id}/link-patient`, {
        email: normalizedEmail
      });
      
      setLinkStatusMsg({
        type: 'success',
        text: 'Patient verified and linked successfully!'
      });
      setEmailInput('');
      await loadCaregiverIdentity();
      await loadAppointmentData();
      setTimeout(() => setIsLinkModalOpen(false), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to link patient.';
      setLinkStatusMsg({ type: 'error', text: msg });
    } finally {
      setSubmittingLink(false);
    }
  };

  // Edit Profile Submit
  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileStatusMsg(null);
    setSubmittingProfile(true);
    try {
      if (!caregiverProfile.id) throw new Error('Caregiver ID not found.');
      await caregiverService.update(caregiverProfile.id, editProfileForm);
      setProfileStatusMsg({ type: 'success', text: 'Caregiver profile updated successfully!' });
      await loadCaregiverIdentity();
      setTimeout(() => setIsEditProfileOpen(false), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      setProfileStatusMsg({ type: 'error', text: msg });
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleBookAppointmentSubmit = async (e) => {
    e.preventDefault();
    setBookingStatusMsg(null);

    if (!selectedPatientId) {
      setBookingStatusMsg({ type: 'error', text: 'No patient selected.' });
      return;
    }
    if (!selectedDoctorId) {
      setBookingStatusMsg({ type: 'error', text: 'No doctor assigned to this patient.' });
      return;
    }
    if (!appointmentDateTime) {
      setBookingStatusMsg({ type: 'error', text: 'Please select an appointment date & time.' });
      return;
    }

    setSubmittingBooking(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        appointmentDate: new Date(appointmentDateTime).toISOString(),
        status: 'Scheduled',
        clinicalNotes: reasonForAppointment.trim(),
      };

      const result = await appointmentService.createAppointment(payload);
      
      setBookingStatusMsg({
        type: 'success',
        text: `Appointment scheduled successfully!`
      });

      setReasonForAppointment('');
      setAppointmentDateTime('');
      loadAppointmentData();

      if (voiceAssistant && speak) {
        speak('Appointment scheduled successfully.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to book appointment.';
      setBookingStatusMsg({ type: 'error', text: errorMsg });
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await apiClient.put(`/emergency-sos/${alertId}`, { status: 'Acknowledged' });
      loadAppointmentData();
    } catch (e) {
      console.error('Failed to acknowledge alert:', e.message);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const caregiverAppointments = appointmentsList.filter((app) => {
    if (linkedPatients.length === 0) return false;
    const appPatientId = app.patientId?._id || app.patientId;
    return linkedPatients.some(lp => lp._id === appPatientId);
  });

  const caregiverEmergencyAlerts = emergencyAlerts.filter((sos) => {
    if (linkedPatients.length === 0) return false;
    const sosPatientId = sos.patientId?._id || sos.patientId;
    return linkedPatients.some(lp => lp._id === sosPatientId);
  });

  return (
    <div className="app-viewport">
      <div className="mobile-container caregiver-dashboard-container" style={{ maxWidth: '520px' }}>
        
        {/* LINK PATIENT MODAL BY REGISTERED EMAIL */}
        {isLinkModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="modal-content" style={{ background: 'var(--color-bg-card, #FFFFFF)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  Link Patient by Registered Email
                </h3>
                <button type="button" onClick={() => setIsLinkModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {linkStatusMsg && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.825rem', fontWeight: 600, background: linkStatusMsg.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: linkStatusMsg.type === 'success' ? 'var(--color-green-primary)' : '#DC2626' }}>
                  {linkStatusMsg.text}
                </div>
              )}

              <form onSubmit={handleLinkPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="profile-field-group">
                  <span className="profile-field-label">Patient Registered Email</span>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. patient.name@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary-auth" onClick={() => setIsLinkModalOpen(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-auth" disabled={submittingLink} style={{ flex: 1, background: 'var(--color-orange-primary)' }}>
                    {submittingLink ? 'Verifying...' : 'Link Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT CAREGIVER PROFILE MODAL */}
        {isEditProfileOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="modal-content" style={{ background: 'var(--color-bg-card, #FFFFFF)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  Edit Caregiver Profile
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
                  <span className="profile-field-label">Relationship to Patient</span>
                  <input
                    type="text"
                    className="form-input"
                    value={editProfileForm.relationshipToPatient}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, relationshipToPatient: e.target.value })}
                  />
                </div>
                <div className="profile-field-group">
                  <span className="profile-field-label">Mobile Phone</span>
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
                  <button type="submit" className="btn-primary-auth" disabled={submittingProfile} style={{ flex: 1, background: 'var(--color-orange-primary)' }}>
                    {submittingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NAVIGATION DRAWER */}
        <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        <aside className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`}>
          <div className="drawer-header">
            <VoiceBackLogo variant="header" />
            <button type="button" className="btn-close-sheet" onClick={() => setIsDrawerOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="drawer-user-badge" onClick={() => { setIsDrawerOpen(false); setIsEditProfileOpen(true); }}>
            <div className="drawer-avatar-circle" style={{ background: 'rgba(234, 88, 12, 0.12)', color: 'var(--color-orange-primary)' }}>
              <Heart size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{caregiverProfile.fullName}</h4>
              <span className="drawer-user-role" style={{ color: 'var(--color-orange-primary)', fontWeight: 700 }}>
                Caregiver ({caregiverProfile.relationship})
              </span>
            </div>
          </div>

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

        {/* HEADER BAR */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {currentView !== 'dashboard' ? (
            <button type="button" className="settings-btn" onClick={handleBackToDashboard}>
              <ArrowLeft size={22} />
            </button>
          ) : (
            <button type="button" className="settings-btn" onClick={() => setIsDrawerOpen(true)}>
              <Menu size={22} />
            </button>
          )}

          <VoiceBackLogo variant="header" />

          <button
            type="button"
            className="header-profile-avatar-btn"
            onClick={() => setIsEditProfileOpen(true)}
            style={{ background: 'rgba(234, 88, 12, 0.12)', borderColor: 'var(--color-orange-primary)', color: 'var(--color-orange-primary)' }}
            aria-label="Caregiver Profile"
            title="Caregiver Profile"
          >
            <Heart size={20} />
          </button>
        </header>

        {/* APPOINTMENTS VIEW (CAREGIVER BOOKING & SCHEDULE) */}
        {currentView === 'appointments' ? (
          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
            
            <section className="profile-section-card" style={{ width: '100%', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Calendar size={22} color="var(--color-orange-primary)" />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                    Book Appointment for Patient
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn-secondary-auth"
                  onClick={() => setIsLinkModalOpen(true)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--color-orange-primary)', color: 'var(--color-orange-primary)' }}
                >
                  + Link Patient
                </button>
              </div>

              {bookingStatusMsg && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: bookingStatusMsg.type === 'success' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                    color: bookingStatusMsg.type === 'success' ? 'var(--color-green-primary)' : '#DC2626',
                    border: `1px solid ${bookingStatusMsg.type === 'success' ? 'var(--color-green-primary)' : '#DC2626'}`
                  }}
                >
                  {bookingStatusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{bookingStatusMsg.text}</span>
                </div>
              )}

              {/* BOOKING FORM */}
              <form onSubmit={handleBookAppointmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%' }}>
                
                {/* 1. SELECT LINKED PATIENT */}
                <div className="profile-field-group">
                  <span className="profile-field-label">Select Linked Patient</span>
                  {linkedPatients.length > 0 ? (
                    <select
                      className="form-input select-input"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Linked Patient --</option>
                      {linkedPatients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.fullName} ({p.aphasiaType || "Patient"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select className="form-input select-input" disabled>
                      <option value="">No patients linked.</option>
                    </select>
                  )}
                </div>

                {/* 2. AUTOMATICALLY DERIVED ASSIGNED DOCTOR */}
                <div className="profile-field-group">
                  <span className="profile-field-label">Assigned Primary Doctor</span>
                  {(() => {
                    const selP = linkedPatients.find(p => p._id === selectedPatientId);
                    const doc = selP?.assignedDoctorId;
                    if (doc) {
                      return (
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.06)', border: '1px solid var(--border-color)', fontWeight: 700, color: 'var(--color-brand-title)', fontSize: '0.9rem' }}>
                          Dr. {doc.fullName} ({doc.specialization || 'Primary Doctor'})
                        </div>
                      );
                    }
                    return (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.06)', border: '1px solid #DC2626', fontWeight: 600, color: '#DC2626', fontSize: '0.85rem' }}>
                        No doctor assigned to this patient.
                      </div>
                    );
                  })()}
                </div>

                {/* 3. APPOINTMENT DATE & TIME */}
                <div className="profile-field-group">
                  <span className="profile-field-label">Appointment Date & Time</span>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={appointmentDateTime}
                    onChange={(e) => setAppointmentDateTime(e.target.value)}
                    required
                  />
                </div>

                {/* 4. REASON FOR APPOINTMENT */}
                <div className="profile-field-group">
                  <span className="profile-field-label">Reason for Appointment</span>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Describe purpose of consultation..."
                    value={reasonForAppointment}
                    onChange={(e) => setReasonForAppointment(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary-auth"
                  disabled={submittingBooking || linkedPatients.length === 0 || !selectedDoctorId}
                  style={{ background: 'var(--color-orange-primary)', width: '100%', marginTop: '0.5rem' }}
                >
                  {submittingBooking ? 'Scheduling...' : 'Confirm Appointment'}
                </button>
              </form>
            </section>

            {/* SCHEDULED APPOINTMENTS */}
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header">
                <Calendar size={18} color="var(--color-orange-primary)" />
                <h3>Caregiver Appointment History</h3>
              </div>

              {caregiverAppointments.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-brand-tagline)' }}>
                  No appointments booked yet for linked patients.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {caregiverAppointments.map((app) => (
                    <div key={app._id} style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span>Patient: {app.patientId?.fullName || 'Linked Patient'}</span>
                        <span className="device-name-badge connected">{app.status}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)' }}>
                        Doctor: {app.doctorId?.fullName ? `Dr. ${app.doctorId.fullName}` : 'Assigned Doctor'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-brand-title)', fontWeight: 600 }}>
                        Date: {new Date(app.appointmentDate).toLocaleString()}
                      </div>
                      {app.clinicalNotes && (
                        <div style={{ fontSize: '0.775rem', fontStyle: 'italic' }}>
                          Reason: {app.clinicalNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

          </main>
        ) : (
          /* MAIN CAREGIVER DASHBOARD VIEW */
          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
            
            {/* CAREGIVER IDENTITY CARD (MATCHING PATIENT PROFILE UX) */}
            <section className="profile-section-card" style={{ width: '100%', gap: '0.75rem', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(2, 132, 199, 0.06) 100%)', border: '1.5px solid rgba(234, 88, 12, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-orange-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={26} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                      {getGreeting()}, {caregiverFirstName}
                    </h2>
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
                      Caregiver ({caregiverProfile.relationship})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-secondary-auth"
                  onClick={() => setIsLinkModalOpen(true)}
                  style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', borderColor: 'var(--color-orange-primary)', color: 'var(--color-orange-primary)' }}
                >
                  + Link Patient
                </button>
              </div>
            </section>

            {/* LINKED PATIENTS ROSTER */}
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} color="var(--color-orange-primary)" />
                  <h3>Linked Patients Roster</h3>
                </div>
                <span className="device-name-badge connected" style={{ fontSize: '0.75rem' }}>
                  {linkedPatients.length} Linked
                </span>
              </div>

              {linkedPatients.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, margin: 0, color: 'var(--color-brand-title)' }}>No patients linked.</p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', marginTop: '0.35rem' }}>
                    Click "+ Link Patient" to connect a patient using their registered email address.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  {linkedPatients.map((p) => (
                    <div key={p._id} style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{p.fullName}</h4>
                        <span style={{ fontSize: '0.775rem', color: 'var(--color-brand-tagline)' }}>
                          {p.email ? `Email: ${p.email} • ` : ''}Aphasia: {p.aphasiaType}
                        </span>
                      </div>
                      <span className="device-name-badge connected" style={{ fontSize: '0.7rem' }}>Linked</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* EMERGENCY SOS ALERTS RECORDED */}
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <h3>Emergency SOS Alerts</h3>
                </div>
                <span className="device-name-badge disconnected" style={{ fontSize: '0.75rem' }}>
                  {caregiverEmergencyAlerts.length} Alerts
                </span>
              </div>

              {caregiverEmergencyAlerts.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--color-brand-tagline)', fontSize: '0.85rem' }}>
                  No active emergency alerts recorded for linked patients.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  {caregiverEmergencyAlerts.map((sos) => (
                    <div key={sos._id} style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(220,38,38,0.06)', border: '1px solid #DC2626', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#DC2626', fontSize: '0.85rem' }}>
                        <span>Patient: {sos.patientId?.fullName || 'Linked Patient'}</span>
                        <span className="device-name-badge disconnected">{sos.status}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-title)' }}>{sos.message}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-tagline)' }}>Triggered: {new Date(sos.triggeredAt).toLocaleString()}</span>
                        {sos.status === 'Active' && (
                          <button
                            type="button"
                            className="btn-secondary-auth"
                            onClick={() => handleAcknowledgeAlert(sos._id)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: 'var(--color-green-primary)', borderColor: 'var(--color-green-primary)' }}
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* QUICK ACTIONS */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', width: '100%' }}>
              <div className="action-card" onClick={() => setCurrentView('appointments')} style={{ padding: '1rem', cursor: 'pointer' }}>
                <div className="action-card-header">
                  <div className="action-icon-box" style={{ background: 'rgba(234,88,12,0.12)', color: 'var(--color-orange-primary)' }}>
                    <Calendar size={20} />
                  </div>
                  <ArrowRight size={16} className="action-arrow-icon" />
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <h3 className="action-card-title" style={{ fontSize: '0.95rem' }}>Appointments</h3>
                  <p className="action-card-desc" style={{ fontSize: '0.775rem' }}>Schedule for patient</p>
                </div>
              </div>

              <div className="action-card" onClick={() => setIsLinkModalOpen(true)} style={{ padding: '1rem', cursor: 'pointer' }}>
                <div className="action-card-header">
                  <div className="action-icon-box" style={{ background: 'rgba(22,163,74,0.12)', color: 'var(--color-green-primary)' }}>
                    <Link size={20} />
                  </div>
                  <ArrowRight size={16} className="action-arrow-icon" />
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <h3 className="action-card-title" style={{ fontSize: '0.95rem' }}>Link Patient</h3>
                  <p className="action-card-desc" style={{ fontSize: '0.775rem' }}>Connect via registered email</p>
                </div>
              </div>
            </section>

          </main>
        )}

      </div>

      <SettingsBottomSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default CaregiverDashboardScreen;
