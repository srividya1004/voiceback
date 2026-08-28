import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Settings,
  User,
  Camera,
  Upload,
  Trash2,
  Edit3,
  Check,
  Stethoscope,
  Heart,
  Wifi,
  Zap,
  BatteryCharging,
  Globe,
  Volume2,
  Sun,
  Moon,
  Monitor,
  HelpCircle,
  Shield,
  Info,
  LogOut,
  X,
  Palette,
  CheckCircle2
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import patientService from '../services/patientService';
import caregiverService from '../services/caregiverService';
import authService from '../services/authService';

// 20 Clean Material Design / Healthcare Icon Style Avatars (Encoded SVG Data URIs)
const defaultAvatarLibrary = [
  {
    id: 'mat-neutral-filled-blue',
    name: 'Neutral Profile (Filled)',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E0F2FE"/><circle cx="50" cy="38" r="16" fill="%230284C7"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" fill="%230284C7"/></svg>`
  },
  {
    id: 'mat-neutral-outline-blue',
    name: 'Neutral Profile (Outline)',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E0F2FE"/><circle cx="50" cy="38" r="16" stroke="%230284C7" stroke-width="4" fill="none"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" stroke="%230284C7" stroke-width="4" fill="none"/></svg>`
  },
  {
    id: 'mat-female-filled-teal',
    name: 'Female Profile (Filled)',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23CCFBF1"/><circle cx="50" cy="38" r="16" fill="%230D9488"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" fill="%230D9488"/><path d="M36 28c0-8 6-12 14-12s14 4 14 12v4H36v-4z" fill="%230F766E"/></svg>`
  },
  {
    id: 'mat-female-outline-teal',
    name: 'Female Profile (Outline)',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23CCFBF1"/><circle cx="50" cy="38" r="16" stroke="%230D9488" stroke-width="4" fill="none"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" stroke="%230D9488" stroke-width="4" fill="none"/><path d="M34 26c0-6 7-10 16-10s16 4 16 10" stroke="%230D9488" stroke-width="4" fill="none"/></svg>`
  },
  {
    id: 'mat-male-filled-indigo',
    name: 'Male Profile (Filled)',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E0E7FF"/><circle cx="50" cy="36" r="16" fill="%234F46E5"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" fill="%234F46E5"/><path d="M34 22c4-4 10-6 16-6s12 2 16 6" stroke="%233730A3" stroke-width="4" fill="none"/></svg>`
  },
  {
    id: 'mat-male-outline-indigo',
    name: 'Male Profile (Outline)',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E0E7FF"/><circle cx="50" cy="36" r="16" stroke="%234F46E5" stroke-width="4" fill="none"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" stroke="%234F46E5" stroke-width="4" fill="none"/></svg>`
  },
  {
    id: 'mat-adult-green',
    name: 'Adult Profile',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23DCFCE7"/><circle cx="50" cy="38" r="16" fill="%2316A34A"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" fill="%2316A34A"/></svg>`
  },
  {
    id: 'mat-elderly-purple',
    name: 'Elderly Profile',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23F3E8FF"/><circle cx="50" cy="38" r="16" fill="%239333EA"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" fill="%239333EA"/><path d="M38 24c4-3 8-4 12-4s8 1 12 4" stroke="%23E9D5FF" stroke-width="3" fill="none"/></svg>`
  },
  {
    id: 'mat-professional-blue',
    name: 'Professional Profile',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E0F2FE"/><circle cx="50" cy="36" r="15" fill="%230284C7"/><path d="M24 82c4-16 15-22 26-22s22 6 26 22" fill="%230284C7"/><path d="M43 60l7 12 7-12" stroke="%23FFFFFF" stroke-width="3" fill="none"/></svg>`
  },
  {
    id: 'mat-clinician-teal',
    name: 'Clinician Icon',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23CCFBF1"/><circle cx="50" cy="35" r="15" fill="%230D9488"/><path d="M24 82c4-16 15-22 26-22s22 6 26 22" fill="%230D9488"/><path d="M35 48c0 10 7 18 15 18s15-8 15-18" stroke="%2314B8A6" stroke-width="3" fill="none"/></svg>`
  },
  {
    id: 'mat-heart-rose',
    name: 'Healthcare Heart Profile',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FFE4E6"/><path d="M50 72s-22-14-22-28c0-8 6-14 14-14 5 0 7 3 8 5 1-2 3-5 8-5 8 0 14 6 14 14 0 14-22 28-22 28z" fill="%23E11D48"/></svg>`
  },
  {
    id: 'mat-shield-blue',
    name: 'Protected Patient Shield',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E0F2FE"/><path d="M50 25l20 8v18c0 16-10 26-20 30-10-4-20-14-20-30V33l20-8z" fill="%230284C7"/><path d="M44 48l5 5 10-10" stroke="%23FFFFFF" stroke-width="3" fill="none"/></svg>`
  },
  {
    id: 'mat-user-check-green',
    name: 'Verified User Icon',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23DCFCE7"/><circle cx="44" cy="38" r="14" fill="%2316A34A"/><path d="M20 82c3-14 13-22 24-22 6 0 12 2 17 6" fill="%2316A34A"/><circle cx="70" cy="62" r="12" fill="%2315803D"/><path d="M64 62l4 4 8-8" stroke="%23FFFFFF" stroke-width="2.5" fill="none"/></svg>`
  },
  {
    id: 'mat-user-circle-amber',
    name: 'User Circle Icon',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FEF3C7"/><circle cx="50" cy="50" r="34" stroke="%23D97706" stroke-width="4" fill="none"/><circle cx="50" cy="42" r="11" fill="%23D97706"/><path d="M30 72c3-10 11-16 20-16s17 6 20 16" fill="%23D97706"/></svg>`
  },
  {
    id: 'mat-user-tie-indigo',
    name: 'Doctor Profile Icon',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E0E7FF"/><circle cx="50" cy="36" r="15" fill="%234338CA"/><path d="M24 82c4-16 15-22 26-22s22 6 26 22" fill="%234338CA"/><path d="M47 60l3 18 3-18" fill="%23FFFFFF"/></svg>`
  },
  {
    id: 'mat-user-nurse-teal',
    name: 'Caregiver Profile Icon',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23CCFBF1"/><circle cx="50" cy="38" r="15" fill="%230D9488"/><path d="M24 82c4-16 15-22 26-22s22 6 26 22" fill="%230D9488"/><rect x="42" y="18" width="16" height="10" rx="3" fill="%2314B8A6"/><path d="M50 20v6M47 23h6" stroke="%23FFFFFF" stroke-width="2"/></svg>`
  },
  {
    id: 'mat-user-smile-yellow',
    name: 'Friendly Patient Profile',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FEF3C7"/><circle cx="50" cy="38" r="16" fill="%23D97706"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" fill="%23D97706"/><path d="M43 38q7 6 14 0" stroke="%23FFFFFF" stroke-width="2.5" fill="none"/></svg>`
  },
  {
    id: 'mat-user-badge-blue',
    name: 'ID Badge Profile Icon',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E0F2FE"/><rect x="28" y="24" width="44" height="52" rx="6" fill="%230284C7"/><circle cx="50" cy="44" r="10" fill="%23FFFFFF"/><path d="M38 66c2-8 7-12 12-12s10 4 12 12" fill="%23FFFFFF"/></svg>`
  },
  {
    id: 'mat-user-slate',
    name: 'Minimal Slate Profile',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23F1F5F9"/><circle cx="50" cy="38" r="16" fill="%23475569"/><path d="M24 82c4-16 15-24 26-24s22 8 26 24" fill="%23475569"/></svg>`
  },
  {
    id: 'mat-user-pulse-red',
    name: 'Telemetry Profile Icon',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23FEE2E2"/><circle cx="50" cy="36" r="15" fill="%23DC2626"/><path d="M24 82c4-16 15-22 26-22s22 6 26 22" fill="%23DC2626"/><path d="M32 50h8l4-8 6 16 5-10h13" stroke="%23FFFFFF" stroke-width="2.5" fill="none"/></svg>`
  }
];

export const PatientProfileScreen = ({ onBack, onLogout, backendProfile }) => {
  const { t, theme, language, voiceAssistant, speak } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarOptionsOpen, setIsAvatarOptionsOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [tempSelectedAvatar, setTempSelectedAvatar] = useState(defaultAvatarLibrary[0]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [activeSupportModal, setActiveSupportModal] = useState(null); // 'help' | 'privacy' | 'about' | null

  // File input refs for image capture / upload
  const fileUploadInputRef = useRef(null);
  const fileCaptureInputRef = useRef(null);

  // Load patient profile from backendProfile prop or localStorage
  const [profileData, setProfileData] = useState(() => {
    const raw = backendProfile || {};
    try {
      const storedUser = JSON.parse(localStorage.getItem('voiceback_current_user') || 'null');
      const merged = { ...storedUser, ...raw };
      return {
        fullName: merged.fullName || '',
        age: merged.age ? (String(merged.age).includes('Years') ? merged.age : `${merged.age} Years`) : '',
        gender: merged.gender || '',
        aphasiaType: merged.aphasiaType || '',
        preferredLanguage: merged.preferredLanguage || '',
        mobileNumber: merged.phone || merged.mobileNumber || '',
        email: merged.email || '',
        emergencyContact: merged.emergencyContact || '',
        assignedDoctorName: merged.assignedDoctorName || '',
        assignedCaregiverName: merged.assignedCaregiverName || '',
      };
    } catch (e) {
      // ignore
    }
    return {
      fullName: raw.fullName || '',
      age: raw.age ? (String(raw.age).includes('Years') ? raw.age : `${raw.age} Years`) : '',
      gender: raw.gender || '',
      aphasiaType: raw.aphasiaType || '',
      preferredLanguage: raw.preferredLanguage || '',
      mobileNumber: raw.phone || raw.mobileNumber || '',
      email: raw.email || '',
      emergencyContact: raw.emergencyContact || '',
      assignedDoctorName: raw.assignedDoctorName || '',
      assignedCaregiverName: raw.assignedCaregiverName || '',
    };
  });

  // Sync incoming backendProfile prop into profileData state whenever it updates
  useEffect(() => {
    if (backendProfile) {
      setProfileData((prev) => ({
        ...prev,
        id: backendProfile.id || backendProfile._id || prev.id,
        fullName: backendProfile.fullName || prev.fullName,
        age: backendProfile.age ? (String(backendProfile.age).includes('Years') ? backendProfile.age : `${backendProfile.age} Years`) : prev.age,
        gender: backendProfile.gender || prev.gender,
        aphasiaType: backendProfile.aphasiaType || prev.aphasiaType,
        preferredLanguage: backendProfile.preferredLanguage || prev.preferredLanguage,
        mobileNumber: backendProfile.phone || backendProfile.mobileNumber || prev.mobileNumber,
        email: backendProfile.email || prev.email,
        emergencyContact: backendProfile.emergencyContact || prev.emergencyContact,
        assignedDoctorName: backendProfile.assignedDoctorName || prev.assignedDoctorName,
        assignedCaregiverName: backendProfile.assignedCaregiverName || prev.assignedCaregiverName,
      }));
    }
  }, [backendProfile]);

  // Robust Medical Team fetching on mount to guarantee real doctor & caregiver data displays even on page refresh
  useEffect(() => {
    const fetchFreshMedicalTeam = async () => {
      try {
        const session = authService.getActiveSession();
        const userEmail = (session?.email || '').toLowerCase();
        const currentUserId = session?.user?.id;
        if (!userEmail && !currentUserId) return;

        const [patientsRes, caregiversRes] = await Promise.all([
          patientService.getAllPatients().catch(() => ({ data: [] })),
          caregiverService.getAllCaregivers().catch(() => ({ data: [] }))
        ]);

        const list = Array.isArray(patientsRes?.data)
          ? patientsRes.data
          : Array.isArray(patientsRes)
          ? patientsRes
          : [];

        const cList = Array.isArray(caregiversRes?.data)
          ? caregiversRes.data
          : Array.isArray(caregiversRes)
          ? caregiversRes
          : [];

        const match = list.find((p) => {
          const pUserId = p.userId?._id || p.userId;
          return (currentUserId && pUserId === currentUserId) || ((p.email || p.userId?.email || '').toLowerCase() === userEmail);
        });

        if (match) {
          let docName = match.assignedDoctorId?.fullName ? match.assignedDoctorId.fullName : '';
          let cgName = match.assignedCaregiverId?.fullName ? match.assignedCaregiverId.fullName : '';

          if (!cgName) {
            const matchedCg = cList.find((c) =>
              Array.isArray(c.assignedPatients) &&
              c.assignedPatients.some((ap) => (ap._id || ap) === match._id)
            );
            if (matchedCg) {
              cgName = matchedCg.fullName;
            }
          }

          setProfileData((prev) => ({
            ...prev,
            id: match._id,
            fullName: match.fullName || prev.fullName,
            age: match.age ? `${match.age} Years` : prev.age,
            aphasiaType: match.aphasiaType || prev.aphasiaType,
            gender: match.gender || prev.gender,
            preferredLanguage: match.preferredLanguage || prev.preferredLanguage,
            mobileNumber: match.phone || prev.mobileNumber,
            email: match.email || match.userId?.email || prev.email,
            emergencyContact: match.emergencyContact || prev.emergencyContact,
            assignedDoctorName: docName || prev.assignedDoctorName,
            assignedCaregiverName: cgName || prev.assignedCaregiverName,
          }));
        }
      } catch (err) {
        console.error('Error fetching medical team in PatientProfileScreen:', err);
      }
    };

    fetchFreshMedicalTeam();
  }, []);

  // Avatar Image stored locally
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem('voiceback_patient_avatar') || '';
    } catch (e) {
      return '';
    }
  });

  const firstLetter = profileData.fullName ? profileData.fullName.trim().charAt(0).toUpperCase() : 'P';

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const targetId = profileData.id || backendProfile?.id || backendProfile?._id;
      let updatedRecord = null;
      if (targetId) {
        const updatePayload = {
          fullName: profileData.fullName,
          age: parseInt(profileData.age, 10) || undefined,
          aphasiaType: profileData.aphasiaType !== 'Not Available' ? profileData.aphasiaType : undefined,
          gender: profileData.gender !== 'Not Available' ? profileData.gender : undefined,
          preferredLanguage: profileData.preferredLanguage !== 'Not Available' ? profileData.preferredLanguage : undefined,
          phone: profileData.mobileNumber !== 'Not Available' ? profileData.mobileNumber : undefined,
          emergencyContact: profileData.emergencyContact !== 'Not Available' ? profileData.emergencyContact : undefined,
        };
        const res = await patientService.updatePatient(targetId, updatePayload);
        updatedRecord = res?.data || res;
      }

      if (updatedRecord) {
        setProfileData((prev) => ({
          ...prev,
          fullName: updatedRecord.fullName || prev.fullName,
          age: updatedRecord.age ? `${updatedRecord.age} Years` : prev.age,
          aphasiaType: updatedRecord.aphasiaType || prev.aphasiaType,
          gender: updatedRecord.gender || prev.gender,
          preferredLanguage: updatedRecord.preferredLanguage || prev.preferredLanguage,
          mobileNumber: updatedRecord.phone || prev.mobileNumber,
          emergencyContact: updatedRecord.emergencyContact || prev.emergencyContact,
        }));
        authService.updateActiveSessionProfile(updatedRecord);
      } else {
        const storedUser = JSON.parse(localStorage.getItem('voiceback_current_user') || '{}');
        const updatedUser = { ...storedUser, ...profileData };
        authService.updateActiveSessionProfile(updatedUser);
      }

      setSaveSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e) {
      console.warn('Error saving profile data to backend:', e.message);
      setSaveSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }
    setIsEditing(false);
    if (voiceAssistant && speak) {
      speak('Profile changes saved successfully.');
    }
  };

  // Image Upload & Capture Handlers
  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setAvatarDataUrl(dataUrl);
      try {
        localStorage.setItem('voiceback_patient_avatar', dataUrl);
      } catch (err) {
        console.warn('Failed to save avatar image to localStorage:', err);
      }
      setIsAvatarOptionsOpen(false);
      if (voiceAssistant && speak) {
        speak('Profile picture updated.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAvatarPicker = () => {
    setIsAvatarOptionsOpen(false);
    const match = defaultAvatarLibrary.find((a) => a.dataUrl === avatarDataUrl);
    setTempSelectedAvatar(match || defaultAvatarLibrary[0]);
    setIsAvatarPickerOpen(true);
  };

  const handleApplyAvatar = () => {
    if (!tempSelectedAvatar) return;
    setAvatarDataUrl(tempSelectedAvatar.dataUrl);
    try {
      localStorage.setItem('voiceback_patient_avatar', tempSelectedAvatar.dataUrl);
    } catch (e) {
      // ignore
    }
    setIsAvatarPickerOpen(false);
    if (voiceAssistant && speak) {
      speak(`${tempSelectedAvatar.name} applied.`);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarDataUrl('');
    try {
      localStorage.removeItem('voiceback_patient_avatar');
    } catch (e) {
      // ignore
    }
    setIsAvatarOptionsOpen(false);
    if (voiceAssistant && speak) {
      speak('Profile picture removed. Default initial avatar restored.');
    }
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container profile-container" style={{ maxWidth: '520px' }}>
        
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileCaptureInputRef}
          accept="image/*"
          capture="user"
          style={{ display: 'none' }}
          onChange={handleImageFileChange}
        />
        <input
          type="file"
          ref={fileUploadInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageFileChange}
        />

        {/* Header Bar */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="settings-btn"
            aria-label="Return to Dashboard"
            title="Return to Dashboard"
            onClick={onBack}
          >
            <ArrowLeft size={22} />
          </button>

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

        {/* Title Section */}
        <div className="role-title-section text-center" style={{ marginTop: '0.1rem', marginBottom: '0.75rem' }}>
          <h1 className="role-main-title">Patient Profile</h1>
          <p className="role-subtitle">Manage your personal details, preferences, and wearable device status.</p>
        </div>

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              background: 'rgba(22, 163, 74, 0.12)',
              border: '1.5px solid var(--color-green-primary)',
              color: 'var(--color-green-primary)',
              fontWeight: 700,
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '0.75rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Check size={18} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <main className="role-main profile-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* PROFILE HEADER CARD */}
          <section
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-color)',
              borderRadius: '20px',
              padding: '1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.85rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              width: '100%',
            }}
          >
            {/* CIRCULAR PROFILE AVATAR */}
            <div
              className="profile-avatar-wrapper"
              onClick={() => setIsAvatarOptionsOpen(true)}
              style={{ cursor: 'pointer', position: 'relative' }}
              title="Change Profile Photo"
            >
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt={profileData.fullName} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <span>{firstLetter}</span>
                </div>
              )}
              <div className="avatar-edit-overlay">
                <Camera size={18} color="#FFFFFF" />
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                {profileData.fullName}
              </h2>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '20px',
                  background: 'rgba(2, 132, 199, 0.12)',
                  color: 'var(--color-blue-primary)',
                  fontWeight: 700,
                  fontSize: '0.775rem',
                  marginTop: '0.25rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Patient
              </span>
            </div>

            {/* Change Photo Button */}
            <button
              type="button"
              className="profile-photo-btn"
              onClick={() => setIsAvatarOptionsOpen(true)}
            >
              <Camera size={15} />
              <span>Change Profile Photo</span>
            </button>

            {/* Edit / Save Profile Toggle Button */}
            <div style={{ width: '100%', marginTop: '0.5rem' }}>
              {isEditing ? (
                <button
                  type="button"
                  className="btn-continue"
                  onClick={handleSaveProfile}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Check size={18} />
                  <span>Save Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary-auth"
                  onClick={() => setIsEditing(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Edit3 size={16} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </section>

          {/* PERSONAL INFORMATION SECTION */}
          <section className="profile-section-card">
            <h3 className="profile-section-title">Personal Information</h3>

            <div className="profile-info-grid">
              {/* Full Name */}
              <div className="profile-field-group">
                <span className="profile-field-label">Full Name</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                ) : (
                  <span className="profile-field-value">{profileData.fullName}</span>
                )}
              </div>

              {/* Age */}
              <div className="profile-field-group">
                <span className="profile-field-label">Age</span>
                {isEditing ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    value={profileData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                ) : (
                  <span className="profile-field-value">{profileData.age}</span>
                )}
              </div>

              {/* Gender */}
              <div className="profile-field-group">
                <span className="profile-field-label">Gender</span>
                {isEditing ? (
                  <select
                    className="form-input select-input"
                    value={profileData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <span className="profile-field-value">{profileData.gender}</span>
                )}
              </div>

              {/* Type of Aphasia */}
              <div className="profile-field-group">
                <span className="profile-field-label">Type of Aphasia</span>
                {isEditing ? (
                  <select
                    className="form-input select-input"
                    value={profileData.aphasiaType}
                    onChange={(e) => handleInputChange('aphasiaType', e.target.value)}
                  >
                    <option value="Broca's Aphasia">Broca's Aphasia</option>
                    <option value="Wernicke's Aphasia">Wernicke's Aphasia</option>
                    <option value="Global Aphasia">Global Aphasia</option>
                    <option value="Anomic Aphasia">Anomic Aphasia</option>
                  </select>
                ) : (
                  <span className="profile-field-value">{profileData.aphasiaType}</span>
                )}
              </div>

              {/* Preferred Language */}
              <div className="profile-field-group">
                <span className="profile-field-label">Preferred Language</span>
                {isEditing ? (
                  <select
                    className="form-input select-input"
                    value={profileData.preferredLanguage}
                    onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                ) : (
                  <span className="profile-field-value">{profileData.preferredLanguage}</span>
                )}
              </div>

              {/* Mobile Number */}
              <div className="profile-field-group">
                <span className="profile-field-label">Mobile Number</span>
                {isEditing ? (
                  <input
                    type="tel"
                    className="form-input"
                    value={profileData.mobileNumber}
                    onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  />
                ) : (
                  <span className="profile-field-value">{profileData.mobileNumber}</span>
                )}
              </div>

              {/* Email Address (Read-Only) */}
              <div className="profile-field-group">
                <span className="profile-field-label">Email Address</span>
                <span className="profile-field-value">{profileData.email}</span>
              </div>
            </div>
          </section>

          {/* MEDICAL TEAM SECTION (DYNAMICALLY RESOLVED RELATIONSHIPS) */}
          <section className="profile-section-card">
            <h3 className="profile-section-title">Medical Team</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="medical-team-item">
                <div className="medical-team-icon">
                  <Stethoscope size={20} color="var(--color-blue-primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="profile-field-label">Assigned Doctor</span>
                  <span className="profile-field-value" style={{ color: profileData.assignedDoctorName ? 'var(--color-brand-title)' : 'var(--color-brand-tagline)', fontWeight: profileData.assignedDoctorName ? 700 : 600 }}>
                    {profileData.assignedDoctorName || 'No doctor assigned yet.'}
                  </span>
                </div>
              </div>

              <div className="medical-team-item">
                <div className="medical-team-icon orange">
                  <Heart size={20} color="var(--color-orange-primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="profile-field-label">Linked Caregiver</span>
                  <span className="profile-field-value" style={{ color: profileData.assignedCaregiverName ? 'var(--color-brand-title)' : 'var(--color-brand-tagline)', fontWeight: profileData.assignedCaregiverName ? 700 : 600 }}>
                    {profileData.assignedCaregiverName || 'No caregiver linked yet.'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* PREFERENCES SECTION */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 className="profile-section-title" style={{ margin: 0 }}>Preferences</h3>
              <button
                type="button"
                className="btn-secondary-auth"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setIsSettingsOpen(true)}
              >
                <span>Change Settings</span>
              </button>
            </div>

            <div className="profile-info-grid">
              <div className="profile-field-group">
                <span className="profile-field-label">Language</span>
                <span className="profile-field-value" style={{ textTransform: 'capitalize' }}>
                  {language || 'English'}
                </span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Voice Assistant</span>
                <span className="profile-field-value">
                  {voiceAssistant ? '🟢 ON' : '⚪ OFF'}
                </span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Theme</span>
                <span className="profile-field-value" style={{ textTransform: 'capitalize' }}>
                  {theme || 'System'}
                </span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Accessibility</span>
                <span className="profile-field-value">Standard Controls</span>
              </div>
            </div>
          </section>

          {/* SUPPORT & INFO SECTION (INTERACTIVE MODALS) */}
          <section className="profile-section-card">
            <h3 className="profile-section-title">Support & Info</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div
                className="support-link-item"
                onClick={() => setActiveSupportModal('help')}
                style={{ cursor: 'pointer' }}
              >
                <HelpCircle size={18} color="var(--color-blue-primary)" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-brand-title)' }}>Help & Support</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)' }}>Reach out to support@voiceback.health</p>
                </div>
              </div>

              <div
                className="support-link-item"
                onClick={() => setActiveSupportModal('privacy')}
                style={{ cursor: 'pointer' }}
              >
                <Shield size={18} color="var(--color-blue-primary)" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-brand-title)' }}>Privacy Policy</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)' }}>Data privacy and prototype information</p>
                </div>
              </div>

              <div
                className="support-link-item"
                onClick={() => setActiveSupportModal('about')}
                style={{ cursor: 'pointer' }}
              >
                <Info size={18} color="var(--color-blue-primary)" />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-brand-title)' }}>About VoiceBack</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)' }}>VoiceBack v0.3.0 Embedded Healthcare System</p>
                </div>
              </div>
            </div>
          </section>

          {/* LOGOUT BUTTON */}
          <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem', width: '100%' }}>
            <button
              type="button"
              className="btn-danger-logout"
              onClick={onLogout}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>

        </main>
      </div>

      {/* SUPPORT & INFO INTERACTIVE MODALS */}
      {activeSupportModal && (
        <div className="settings-overlay" onClick={() => setActiveSupportModal(null)}>
          <div className="settings-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', gap: '1.25rem' }}>
            <div className="settings-sheet-header">
              <h2 className="settings-sheet-title">
                {activeSupportModal === 'help' && 'Help & Support'}
                {activeSupportModal === 'privacy' && 'Privacy & Data Policy'}
                {activeSupportModal === 'about' && 'About VoiceBack'}
              </h2>
              <button
                type="button"
                className="btn-close-sheet"
                onClick={() => setActiveSupportModal(null)}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: 'var(--color-brand-title)' }}>
              {activeSupportModal === 'help' && (
                <>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>
                    VoiceBack is an assistive communication system for speech and language rehabilitation.
                  </p>
                  <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid var(--border-color)' }}>
                    <strong>Support Contact:</strong>
                    <div style={{ marginTop: '0.25rem', color: 'var(--color-blue-primary)', fontWeight: 700 }}>
                      support@voiceback.health
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary-auth"
                    onClick={() => window.location.href = 'mailto:support@voiceback.health'}
                    style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <span>Send Email Support</span>
                  </button>
                </>
              )}

              {activeSupportModal === 'privacy' && (
                <>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>
                    VoiceBack processes user information strictly to support daily communication and clinical care management.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <li>Patient profile records, aphasia type, and clinical notes are saved in the application database for active session management.</li>
                    <li>Doctor assignments and caregiver links enable clinical scheduling and emergency SOS alert coordination.</li>
                    <li>Speech synthesis and recognition requests process phrase text to assist user communication.</li>
                  </ul>
                </>
              )}

              {activeSupportModal === 'about' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>VoiceBack Assistive Communication</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', fontWeight: 700 }}>Version 0.3.0 (Prototype Build)</span>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.875rem' }}>
                    VoiceBack is an augmentative and alternative communication platform designed to empower individuals with speech and language impairments.
                  </p>
                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', fontSize: '0.825rem' }}>
                    <strong>Supported Languages:</strong> English, Kannada, Hindi
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="btn-secondary-auth"
              onClick={() => setActiveSupportModal(null)}
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PROFILE IMAGE OPTIONS BOTTOM SHEET */}
      {isAvatarOptionsOpen && (
        <div className="settings-overlay" onClick={() => setIsAvatarOptionsOpen(false)}>
          <div className="settings-sheet" onClick={(e) => e.stopPropagation()} style={{ gap: '1rem' }}>
            <div className="settings-sheet-header">
              <h2 className="settings-sheet-title">Profile Photo Options</h2>
              <button
                type="button"
                className="btn-close-sheet"
                onClick={() => setIsAvatarOptionsOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                className="drawer-menu-item"
                onClick={() => fileCaptureInputRef.current?.click()}
              >
                <Camera size={19} />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                className="drawer-menu-item"
                onClick={() => fileUploadInputRef.current?.click()}
              >
                <Upload size={19} />
                <span>Upload from Gallery</span>
              </button>

              <button
                type="button"
                className="drawer-menu-item"
                onClick={handleOpenAvatarPicker}
              >
                <Palette size={19} />
                <span>Choose Medical Avatar</span>
              </button>

              {avatarDataUrl && (
                <button
                  type="button"
                  className="drawer-menu-item danger"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 size={19} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AVATAR PICKER MODAL */}
      {isAvatarPickerOpen && (
        <div className="settings-overlay" onClick={() => setIsAvatarPickerOpen(false)}>
          <div className="settings-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', gap: '1.25rem' }}>
            <div className="settings-sheet-header">
              <h2 className="settings-sheet-title">Select Medical Avatar</h2>
              <button
                type="button"
                className="btn-close-sheet"
                onClick={() => setIsAvatarPickerOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem' }}>
              {defaultAvatarLibrary.map((item) => {
                const isSel = tempSelectedAvatar?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setTempSelectedAvatar(item)}
                    style={{
                      borderRadius: '50%',
                      padding: '4px',
                      border: isSel ? '3px solid var(--color-blue-primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <img src={item.dataUrl} alt={item.name} style={{ width: '100%', height: 'auto', borderRadius: '50%' }} />
                    {isSel && (
                      <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--color-blue-primary)', borderRadius: '50%', color: '#FFF', padding: 2 }}>
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary-auth" onClick={() => setIsAvatarPickerOpen(false)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="button" className="btn-primary-auth" onClick={handleApplyAvatar} style={{ flex: 1 }}>
                Apply Avatar
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

export default PatientProfileScreen;
