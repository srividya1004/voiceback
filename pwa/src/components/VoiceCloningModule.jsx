import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Mic,
  Settings,
  Upload,
  UserCheck,
  ArrowRight,
  Home,
  User,
  LogOut,
  Volume2,
  FileAudio,
  Trash2,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Square,
  AlertCircle,
  ShieldCheck,
  Globe,
  Smile
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import voiceService from '../services/voiceService';
import authService from '../services/authService';

export const VoiceCloningModule = ({
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const hasSpokenRef = useRef(false);

  // Patient Session Data
  const [session] = useState(() => authService.getActiveSession() || {});
  const [patientData] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voiceback_current_user') || 'null');
      if (stored && stored.fullName) return stored;
    } catch (e) {
      // ignore
    }
    return { fullName: session.name || 'Patient' };
  });

  const [avatarDataUrl] = useState(() => {
    try {
      return localStorage.getItem('voiceback_patient_avatar') || '';
    } catch (e) {
      return '';
    }
  });

  const firstLetter = patientData.fullName && patientData.fullName !== 'Patient'
    ? patientData.fullName.trim().charAt(0).toUpperCase()
    : 'P';

  // Voice Profile Status & Synthesis Engine State
  const [voiceProfileStatus, setVoiceProfileStatus] = useState('Not Configured'); // 'Ready' | 'Ready (Local Demo)' | 'Not Configured' | 'Processing'
  const [voiceEngine, setVoiceEngine] = useState('local_demo'); // 'elevenlabs' | 'local_demo'
  const [lastClonedAt, setLastClonedAt] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Audio Sample Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // UI Progress & Feedback State
  const [isCloning, setIsCloning] = useState(false);
  const [cloningStatusMessage, setCloningStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Speech Synthesis Playground State (eleven_v3 & Local Fallback)
  const [synthesisText, setSynthesisText] = useState('Hello, I am using VoiceBack to speak naturally in my own cloned voice.');
  const [selectedLanguage, setSelectedLanguage] = useState('English'); // 'English' | 'Hindi' | 'Kannada'
  const [selectedEmotion, setSelectedEmotion] = useState('neutral'); // 'neutral' | 'calm' | 'urgent' | 'happy'
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedAudioUrl, setSynthesizedAudioUrl] = useState('');

  // Refs for WebAudio MediaRecorder
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Voice Profile Status from Backend API
  const fetchVoiceProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const profiles = await voiceService.getVoiceProfiles();
      if (Array.isArray(profiles) && profiles.length > 0) {
        const readyProfile = profiles.find((p) => p.status === 'Ready') || profiles[0];
        if (readyProfile && (readyProfile.status === 'Ready' || readyProfile.voiceId)) {
          setVoiceProfileStatus('Ready');
          setVoiceEngine('elevenlabs');
          setLastClonedAt(readyProfile.lastClonedAt || readyProfile.updatedAt);
        } else {
          setVoiceProfileStatus('Not Configured');
          setVoiceEngine('local_demo');
        }
      } else {
        setVoiceProfileStatus('Not Configured');
        setVoiceEngine('local_demo');
      }
    } catch (e) {
      console.warn('Voice profile fetch notice:', e.message);
      setVoiceProfileStatus('Not Configured');
      setVoiceEngine('local_demo');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchVoiceProfile();
  }, []);

  // Local Demo SpeechSynthesis Fallback (Web Speech API)
  const speakLocalDemo = async (text, emotion) => {
    setIsSynthesizing(true);
    try {
      const result = await voiceService.speakNativeTTS(text, { emotion, language: 'English' });
      if (result?.success) {
        setSuccessMessage(`Speech synthesized using ${result.provider}.`);
      } else {
        setErrorMessage('Local speech synthesis encountered an issue.');
      }
    } catch (e) {
      console.error('Local Speech Synthesis Error:', e);
      setErrorMessage('Local speech synthesis encountered an issue.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Voice Assistant greeting
  useEffect(() => {
    if (voiceAssistant && speak && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      speak('Patient Voice Model Studio. Record or upload clean speech to restore your natural voice.');
    }
  }, [voiceAssistant, speak]);

  // Start Microphone Recording
  const startRecording = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioBlob(blob);
        setRecordedAudioUrl(url);
        setSelectedFile(null); // clear file upload selection if recorded
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone Access Error:', err);
      setErrorMessage('Microphone access denied or not supported in this browser. You can also upload an audio file below.');
    }
  };

  // Stop Microphone Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Handle Audio File Select
  const handleFileChange = (e) => {
    setErrorMessage('');
    setSuccessMessage('');
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl('');
    }
  };

  // Clear current sample recording/file
  const handleClearSample = () => {
    setRecordedAudioBlob(null);
    setRecordedAudioUrl('');
    setSelectedFile(null);
    setRecordingTime(0);
  };

  // Trigger ElevenLabs Instant Voice Cloning with Local Fallback support
  const handleCloneVoice = async () => {
    if (!recordedAudioBlob && !selectedFile) {
      setErrorMessage('Please record a voice sample or select an audio file first.');
      return;
    }

    setIsCloning(true);
    setErrorMessage('');
    setSuccessMessage('');
    setCloningStatusMessage('Uploading private audio sample and connecting to ElevenLabs IVC...');

    try {
      const formData = new FormData();
      const patientId = session.patientId || session.id || '';

      if (recordedAudioBlob) {
        const audioFile = new File([recordedAudioBlob], `patient-recording-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        formData.append('audioSample', audioFile);
      } else if (selectedFile) {
        formData.append('audioSample', selectedFile);
      }

      if (patientId) {
        formData.append('patientId', patientId);
      }
      formData.append('voiceName', `VoiceBack_Patient_${patientData.fullName.replace(/\s+/g, '_')}`);

      const result = await voiceService.uploadAndCloneVoice(formData);
      const clonedVoiceId = result?.data?.voiceId || result?.voiceId;
      if (clonedVoiceId && typeof window !== 'undefined') {
        localStorage.setItem('voiceback_cloned_voice_id', clonedVoiceId);
      }

      setVoiceProfileStatus('Ready');
      setVoiceEngine('elevenlabs');
      setLastClonedAt(new Date());
      setSuccessMessage('Voice Profile created successfully! Your cloned natural human voice is saved and active.');
      handleClearSample();
    } catch (err) {
      console.warn('ElevenLabs Voice Cloning Cloud Notice:', err.message);
      const isQuotaOrSubError = err.message?.toLowerCase().includes('subscription') ||
        err.message?.toLowerCase().includes('free') ||
        err.message?.toLowerCase().includes('quota') ||
        err.message?.toLowerCase().includes('401') ||
        err.message?.toLowerCase().includes('403');

      const noticeMsg = isQuotaOrSubError
        ? 'ElevenLabs Instant Voice Cloning is unavailable on the current Cloud tier. Activated Local Demo Voice mode for speech synthesis.'
        : `ElevenLabs IVC error (${err.message}). Activated Local Demo Voice mode for speech synthesis.`;

      setErrorMessage(noticeMsg);
      setVoiceEngine('local_demo');
      setVoiceProfileStatus('Ready (Local Demo)');
      setLastClonedAt(new Date());
      handleClearSample();
    } finally {
      setIsCloning(false);
      setCloningStatusMessage('');
    }
  };

  // Trigger Speech Synthesis (ElevenLabs Cloud or Local Demo Fallback)
  const handleSynthesizeSpeech = async () => {
    if (!synthesisText || !synthesisText.trim()) {
      setErrorMessage('Please enter text to speak.');
      return;
    }

    setErrorMessage('');
    setSynthesizedAudioUrl('');

    // If active engine is Local Demo Voice, synthesize directly via browser SpeechSynthesis
    if (voiceEngine === 'local_demo') {
      setIsSynthesizing(true);
      speakLocalDemo(synthesisText, selectedEmotion);
      return;
    }

    // ElevenLabs Cloud Synthesis
    if (voiceProfileStatus !== 'Ready' && voiceProfileStatus !== 'Ready (Local Demo)') {
      setErrorMessage('Voice Profile is not ready. Please record/upload a voice sample first.');
      return;
    }

    setIsSynthesizing(true);

    try {
      const patientId = session.patientId || session.id || '';
      const audioBlob = await voiceService.synthesizeSpeech({
        patientId,
        text: synthesisText,
        language: selectedLanguage,
        emotion: selectedEmotion,
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      setSynthesizedAudioUrl(audioUrl);
      setSuccessMessage('Audio synthesized using ElevenLabs Cloud (`eleven_v3`)!');

      // Auto-play synthesized audio
      const audioObj = new Audio(audioUrl);
      audioObj.play().catch((e) => console.warn('Audio auto-play blocked by browser:', e));
    } catch (err) {
      console.warn('ElevenLabs Cloud synthesis unavailable. Falling back to Local Demo Voice:', err.message);
      setErrorMessage(`ElevenLabs cloud synthesis unavailable (${err.message}). Switched active engine to Local Demo Voice.`);
      setVoiceEngine('local_demo');
      // Execute local demo fallback speech immediately
      speakLocalDemo(synthesisText, selectedEmotion);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Drawer items
  const drawerItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => onBackToDashboard(),
      isActive: false,
    },
    {
      id: 'voice-cloning',
      label: 'Voice Studio',
      icon: UserCheck,
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
      <div className="mobile-container voice-cloning-container">
        
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
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
              Patient Voice Studio
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

        {/* MAIN MODULE CONTENT */}
        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* TITLE & PRIVACY BADGE */}
          <section className="welcome-compact-section" style={{ marginTop: '0.1rem' }}>
            <p className="welcome-subtitle" style={{ fontSize: '0.925rem', color: 'var(--color-brand-tagline)', fontWeight: 500, lineHeight: 1.45 }}>
              Regenerate speech in your own voice using ElevenLabs Instant Voice Cloning (`eleven_v3`).
            </p>
          </section>

          {/* ALERTS & NOTIFICATIONS */}
          {errorMessage && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#16a34a', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* CARD 1: VOICE PROFILE STATUS & ENGINE SELECTOR */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCheck size={18} color="var(--color-blue-primary)" />
                <h3 className="profile-section-title" style={{ margin: 0 }}>Voice Profile & Engine</h3>
              </div>
              <span className={`device-name-badge ${voiceProfileStatus.startsWith('Ready') ? 'connected' : 'disconnected'}`} style={{ fontSize: '0.825rem', fontWeight: 700 }}>
                {voiceEngine === 'local_demo'
                  ? 'Engine: Local Demo Voice ✓'
                  : voiceProfileStatus === 'Ready'
                  ? 'Voice Profile: Ready ✓'
                  : 'Voice Profile: Not Configured'}
              </span>
            </div>

            {/* VOICE ENGINE SWITCHER TOGGLE */}
            <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(241, 245, 249, 0.9)', border: '1px solid var(--border-color)', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                Active Synthesis Engine Mode
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setVoiceEngine('elevenlabs')}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: voiceEngine === 'elevenlabs' ? 'var(--color-blue-primary)' : 'var(--border-color)',
                    background: voiceEngine === 'elevenlabs' ? 'rgba(2, 132, 199, 0.1)' : '#ffffff',
                    color: voiceEngine === 'elevenlabs' ? 'var(--color-blue-primary)' : 'var(--color-brand-tagline)',
                    fontWeight: voiceEngine === 'elevenlabs' ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  ElevenLabs Cloud (`eleven_v3`)
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceEngine('local_demo')}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: voiceEngine === 'local_demo' ? 'var(--color-green-primary)' : 'var(--border-color)',
                    background: voiceEngine === 'local_demo' ? 'rgba(34, 197, 94, 0.1)' : '#ffffff',
                    color: voiceEngine === 'local_demo' ? 'var(--color-green-primary)' : 'var(--color-brand-tagline)',
                    fontWeight: voiceEngine === 'local_demo' ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Local Demo Voice (Browser TTS)
                </button>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-field-group">
                <span className="profile-field-label">Status</span>
                <span className="profile-field-value" style={{ color: voiceProfileStatus.startsWith('Ready') ? 'var(--color-green-primary)' : 'var(--color-red-primary)', fontWeight: 700 }}>
                  {voiceProfileStatus.startsWith('Ready') ? `${voiceProfileStatus} ✓` : 'Not Configured'}
                </span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Active Engine</span>
                <span className="profile-field-value" style={{ fontWeight: 600 }}>
                  {voiceEngine === 'elevenlabs' ? 'ElevenLabs Cloud (eleven_v3)' : 'Local Demo Voice (Web Speech API)'}
                </span>
              </div>

              <div className="profile-field-group">
                <span className="profile-field-label">Last Cloned</span>
                <span className="profile-field-value">
                  {lastClonedAt ? new Date(lastClonedAt).toLocaleDateString() : 'Not Available'}
                </span>
              </div>
            </div>
          </section>

          {/* PRIVACY ASSURANCE BANNER */}
          <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldCheck size={20} color="var(--color-blue-primary)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', margin: 0, lineHeight: 1.4 }}>
              <strong>Patient Audio Privacy:</strong> Voice recordings are processed privately for instant cloning and immediately deleted from local disk after completion. Raw audio files are never published.
            </p>
          </div>

          {/* CARD 2: VOICE SAMPLE RECORDING & UPLOAD */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <FileAudio size={18} color="var(--color-blue-primary)" />
              <h3 className="profile-section-title" style={{ margin: 0 }}>Patient Voice Recording</h3>
            </div>

            {/* RECORDING / FILE STATE INDICATOR */}
            <div style={{ padding: '1rem', borderRadius: '14px', background: 'rgba(248, 250, 252, 0.8)', border: '1px solid var(--border-color)', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isRecording ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444' }}>Recording Live Audio...</span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'monospace' }}>{formatTime(recordingTime)}</span>
                </div>
              ) : recordedAudioUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-green-primary)' }}>✓ Voice Recording Captured ({formatTime(recordingTime)})</span>
                  <audio src={recordedAudioUrl} controls style={{ width: '100%', height: '40px' }} />
                </div>
              ) : selectedFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>Selected File: {selectedFile.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-tagline)' }}>({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', margin: 0, lineHeight: 1.45 }}>
                  Record 1–2 minutes of clean, natural speech using the microphone or select an existing `.wav`/`.mp3`/`.webm` audio file.
                </p>
              )}
            </div>

            {/* RECORD / UPLOAD ACTION BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {!isRecording ? (
                <button
                  type="button"
                  className="btn-continue"
                  onClick={startRecording}
                  disabled={isCloning}
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Mic size={18} />
                  <span>{recordedAudioBlob ? 'Re-record Voice Sample' : 'Record Microphone Sample'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-continue"
                  onClick={stopRecording}
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#ef4444', borderColor: '#ef4444' }}
                >
                  <Square size={18} />
                  <span>Stop Recording ({formatTime(recordingTime)})</span>
                </button>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <button
                type="button"
                className="btn-secondary-auth"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={isRecording || isCloning}
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Upload size={18} />
                <span>Upload Pre-recorded Audio File</span>
              </button>

              {(recordedAudioBlob || selectedFile) && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn-continue"
                    onClick={handleCloneVoice}
                    disabled={isCloning}
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--color-green-primary)', borderColor: 'var(--color-green-primary)' }}
                  >
                    <Sparkles size={18} />
                    <span>{isCloning ? 'Cloning Voice...' : 'Clone Patient Voice (IVC)'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-auth"
                    onClick={handleClearSample}
                    disabled={isCloning}
                    style={{ color: '#ef4444', padding: '0 0.85rem' }}
                    title="Clear sample"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              {cloningStatusMessage && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-blue-primary)', textAlign: 'center', marginTop: '0.25rem' }}>
                  {cloningStatusMessage}
                </p>
              )}
            </div>
          </section>

          {/* CARD 3: SPEECH SYNTHESIS PLAYGROUND (eleven_v3) */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Volume2 size={18} color="var(--color-blue-primary)" />
              <h3 className="profile-section-title" style={{ margin: 0 }}>Voice Synthesis Playground</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* INPUT TEXT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                  Intended Speech Text
                </label>
                <textarea
                  value={synthesisText}
                  onChange={(e) => setSynthesisText(e.target.value)}
                  rows={3}
                  placeholder="Enter text to synthesize in patient voice..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* LANGUAGE SELECTOR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-brand-title)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Globe size={15} />
                  <span>Target Language</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['English', 'Hindi', 'Kannada'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguage(lang)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: selectedLanguage === lang ? 'var(--color-blue-primary)' : 'var(--border-color)',
                        background: selectedLanguage === lang ? 'rgba(2, 132, 199, 0.1)' : '#ffffff',
                        color: selectedLanguage === lang ? 'var(--color-blue-primary)' : 'var(--color-brand-tagline)',
                        fontWeight: selectedLanguage === lang ? 700 : 500,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* EXPRESSIVE EMOTION SELECTOR (eleven_v3 Audio Tag Control) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-brand-title)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Smile size={15} />
                  <span>Expressive Emotion Delivery</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                  {[
                    { id: 'neutral', label: 'Neutral' },
                    { id: 'calm', label: 'Calm' },
                    { id: 'urgent', label: 'Urgent' },
                    { id: 'happy', label: 'Happy' },
                  ].map((emo) => (
                    <button
                      key={emo.id}
                      type="button"
                      onClick={() => setSelectedEmotion(emo.id)}
                      style={{
                        padding: '0.45rem 0.5rem',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: selectedEmotion === emo.id ? 'var(--color-blue-primary)' : 'var(--border-color)',
                        background: selectedEmotion === emo.id ? 'rgba(2, 132, 199, 0.1)' : '#ffffff',
                        color: selectedEmotion === emo.id ? 'var(--color-blue-primary)' : 'var(--color-brand-tagline)',
                        fontWeight: selectedEmotion === emo.id ? 700 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {emo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SYNTHESIZE ACTION BUTTON */}
              <button
                type="button"
                className="btn-continue"
                onClick={handleSynthesizeSpeech}
                disabled={isSynthesizing || (voiceEngine === 'elevenlabs' && !voiceProfileStatus.startsWith('Ready'))}
                style={{
                  width: '100%',
                  marginTop: '0.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '0.5rem',
                  background: voiceEngine === 'local_demo' ? 'var(--color-green-primary)' : undefined,
                  borderColor: voiceEngine === 'local_demo' ? 'var(--color-green-primary)' : undefined,
                }}
              >
                <Sparkles size={18} />
                <span>
                  {isSynthesizing
                    ? voiceEngine === 'local_demo' ? 'Speaking in Local Demo Voice...' : 'Synthesizing in Cloned Voice...'
                    : voiceEngine === 'local_demo' ? 'Synthesize Speech (Local Demo Voice)' : 'Synthesize Speech in My Voice (ElevenLabs Cloud)'}
                </span>
              </button>

              {/* SYNTHESIZED AUDIO PLAYBACK */}
              {synthesizedAudioUrl && (
                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-green-primary)' }}>
                    ✓ Audio Generated (`eleven_v3`)
                  </span>
                  <audio src={synthesizedAudioUrl} controls autoPlay style={{ width: '100%', height: '40px' }} />
                </div>
              )}
            </div>
          </section>

          {/* CARD 4: RECORDING GUIDELINES */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <HelpCircle size={18} color="var(--color-blue-primary)" />
              <h3 className="profile-section-title" style={{ margin: 0 }}>Voice Recording Guidelines</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--color-brand-tagline)', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Quiet environment</strong>: Record in a silent room without background noise, TV, or echo.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Single speaker</strong>: Ensure no other person is speaking during recording.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Consistent posture</strong>: Maintain a steady 6–8 inch distance from the microphone.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="var(--color-green-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                <span><strong>Natural pace</strong>: Speak smoothly using normal conversational pace and vocal tone.</span>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* SETTINGS BOTTOM SHEET */}
      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default VoiceCloningModule;
