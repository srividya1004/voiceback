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
  Users,
  Activity,
  MessageSquare,
  Info,
  ArrowLeft,
  Settings,
  LogOut,
  Wifi,
  Radio,
  Calendar,
  Square,
  Volume2,
  Droplet,
  Utensils,
  HelpCircle,
  Heart,
  CheckCircle2,
  XCircle,
  Moon,
  PhoneCall,
  RefreshCw
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
import DynamicCommunicationModule from './DynamicCommunicationModule';
import VolumeControlWidget from './VolumeControlWidget';
import UniversalSpeechInput from './UniversalSpeechInput';
import WakeWordVoicePipelineModule from './WakeWordVoicePipelineModule';
import ConversationModeModule, { generateDynamicResponses } from './ConversationModeModule';
import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';
import patientService from '../services/patientService';
import caregiverService from '../services/caregiverService';
import appointmentService from '../services/appointmentService';
import communicationService from '../services/communicationService';
import therapyService from '../services/therapyService';
import voiceService from '../services/voiceService';
import deviceService from '../services/deviceService';

export const PatientDashboardScreen = ({ onLogout }) => {
  const { t, voiceAssistant, speak, language } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'profile' | 'module'
  const [activeModule, setActiveModule] = useState(null);
  const hasSpokenWelcome = useRef(false);

  // In-Place Dashboard Speech Audio Recording & Processing State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [listeningTranscript, setListeningTranscript] = useState('');
  const [activeOutputPhrase, setActiveOutputPhrase] = useState('');
  const [speechErrorMsg, setSpeechErrorMsg] = useState('');
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState('basic'); // 'basic' | 'people'
  
  // Ephemeral Dynamic Conversation State (Patient Dashboard)
  const [ephemeralQuestion, setEphemeralQuestion] = useState('');
  const [ephemeralChoices, setEphemeralChoices] = useState([]);
  const [ephemeralSelectedChoice, setEphemeralSelectedChoice] = useState('');
  const [ephemeralIsSynthesizing, setEphemeralIsSynthesizing] = useState(false);
  const [ephemeralStatusMsg, setEphemeralStatusMsg] = useState('');
  const ephemeralAutoClearTimer = useRef(null);

  const clearEphemeralConversation = () => {
    setEphemeralQuestion('');
    setEphemeralChoices([]);
    setEphemeralSelectedChoice('');
    setEphemeralIsSynthesizing(false);
    setEphemeralStatusMsg('');
    if (ephemeralAutoClearTimer.current) {
      clearTimeout(ephemeralAutoClearTimer.current);
    }
  };

  const handleConfirmEphemeralChoice = async () => {
    if (!ephemeralSelectedChoice) return;
    setEphemeralIsSynthesizing(true);
    setEphemeralStatusMsg('Synthesizing patient voice audio and routing to physical speaker...');

    try {
      await processPhraseOutput(ephemeralSelectedChoice);
      setEphemeralStatusMsg('🟢 Audio played through physical MAX98357A speaker!');

      // AUTOMATIC EPHEMERAL CLEANUP AFTER SUCCESSFUL PLAYBACK
      ephemeralAutoClearTimer.current = setTimeout(() => {
        clearEphemeralConversation();
      }, 2500);
    } catch (err) {
      console.warn('Ephemeral output notice:', err.message);
      setEphemeralStatusMsg(`Notice: ${err.message}`);
      ephemeralAutoClearTimer.current = setTimeout(() => {
        clearEphemeralConversation();
      }, 3500);
    } finally {
      setEphemeralIsSynthesizing(false);
    }
  };
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);

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
  const [activeCaregiverQuestion, setActiveCaregiverQuestion] = useState('How are you feeling today?');

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

      // 1. Fetch Patient Profile from Backend
      try {
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

        const currentUserId = session?.user?.id;
        const sessionProfile = session?.user?.profile || (() => {
          try {
            return JSON.parse(localStorage.getItem('voiceback_patient_user') || 'null');
          } catch (e) { return null; }
        })();

        const match = list.find((p) => {
          const pUserId = p.userId?._id || p.userId;
          return (currentUserId && String(pUserId) === String(currentUserId)) || ((p.email || p.userId?.email || '').toLowerCase() === userEmail.toLowerCase());
        });

        const activePatientRecord = match || sessionProfile;

        if (isMounted) {
          if (activePatientRecord) {
            // Find linked caregiver if activePatientRecord.assignedCaregiverId is missing
            let linkedCgName = activePatientRecord.assignedCaregiverId?.fullName || '';
            if (!linkedCgName && activePatientRecord._id) {
              const matchedCg = cList.find((c) =>
                Array.isArray(c.assignedPatients) &&
                c.assignedPatients.some((ap) => (ap._id || ap) === activePatientRecord._id)
              );
              if (matchedCg) {
                linkedCgName = matchedCg.fullName;
              }
            }

            const patientGender = (activePatientRecord.gender || 'female').toLowerCase();
            const numericAge = parseInt(activePatientRecord.age, 10) || 22;
            const patientAgeGroup = numericAge <= 17 ? 'child' : numericAge <= 30 ? 'young' : numericAge <= 60 ? 'adult' : 'senior';

            localStorage.setItem('voiceback_patient_gender', patientGender);
            localStorage.setItem('voiceback_patient_age_group', patientAgeGroup);

            // Fetch patient's saved voice profile from backend and bind cloned voiceId
            voiceService.getVoiceProfiles().then((profiles) => {
              const patientIdStr = String(activePatientRecord._id || activePatientRecord.id || '');
              const profile = Array.isArray(profiles) ? profiles.find(vp => String(vp.patientId?._id || vp.patientId) === patientIdStr || vp.voiceId) : null;
              if (profile && profile.voiceId) {
                localStorage.setItem('voiceback_cloned_voice_id', profile.voiceId);
              }
            }).catch(() => {});

            setProfileData({
              id: activePatientRecord._id || activePatientRecord.id,
              fullName: activePatientRecord.fullName || session?.fullName || userEmail,
              email: activePatientRecord.email || session?.email || userEmail || '',
              gender: activePatientRecord.gender || '',
              age: activePatientRecord.age ? (String(activePatientRecord.age).includes('Years') ? activePatientRecord.age : `${activePatientRecord.age} Years`) : '',
              preferredLanguage: activePatientRecord.preferredLanguage || '',
              aphasiaType: activePatientRecord.aphasiaType || '',
              mobileNumber: activePatientRecord.phone || activePatientRecord.mobileNumber || '',
              emergencyContact: activePatientRecord.emergencyContact || '',
              assignedDoctorName: activePatientRecord.assignedDoctorId?.fullName ? `Dr. ${activePatientRecord.assignedDoctorId.fullName}` : '',
              assignedCaregiverName: linkedCgName,
              role: 'Patient',
            });
          } else {
            // Fallback to active session information if backend record is pending
            setProfileData({
              fullName: session?.fullName || userEmail,
              email: userEmail || '',
              gender: '',
              age: '',
              preferredLanguage: '',
              aphasiaType: '',
              mobileNumber: '',
              emergencyContact: '',
              role: 'Patient',
            });
          }
        }
      } catch (e) {
        console.warn('Failed to load patient profile from backend:', e.message);
        if (isMounted) {
          const fallbackProfile = session?.user?.profile || null;
          setProfileData({
            fullName: fallbackProfile?.fullName || session?.fullName || userEmail,
            email: fallbackProfile?.email || userEmail || '',
            gender: fallbackProfile?.gender || '',
            age: fallbackProfile?.age ? `${fallbackProfile.age} Years` : '',
            preferredLanguage: fallbackProfile?.preferredLanguage || '',
            aphasiaType: fallbackProfile?.aphasiaType || '',
            mobileNumber: fallbackProfile?.phone || '',
            emergencyContact: fallbackProfile?.emergencyContact || '',
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

  // Speak ONCE on dashboard load if Voice Assistant is ON
  useEffect(() => {
    if (voiceAssistant && speak && !hasSpokenWelcome.current) {
      hasSpokenWelcome.current = true;
      speak('Welcome back. Tap Communicate or choose a message below.');
    }
  }, [voiceAssistant, speak]);

  // Determine time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 17) return t('goodAfternoon');
    return t('goodEvening');
  };

  // In-Place Voice Generation & Audio Output Pipeline
  const processPhraseOutput = async (phraseText, phraseKey) => {
    if (!phraseText) return;
    setSpeechErrorMsg(''); // Clear error message on valid phrase output
    const textToSynthesize = phraseKey ? t(phraseKey) : phraseText;
    setActiveOutputPhrase(textToSynthesize);

    setIsSynthesizingVoice(true);
    try {
      const speechResult = await voiceService.playSynthesizedAudio({
        patientId: profileData?.id || '',
        text: textToSynthesize,
        language: language === 'kannada' ? 'Kannada' : language === 'hindi' ? 'Hindi' : 'English',
        emotion: 'neutral',
      });
      console.log('🔊 [PatientDashboard] Voice output result:', speechResult);
    } catch (e) {
      console.warn('⚠️ [PatientDashboard] Voice output error:', e.message);
    } finally {
      setIsSynthesizingVoice(false);
    }

    // Log history
    try {
      await communicationService.saveHistory({ recognizedText: textToSynthesize, attemptType: 'Voice' });
    } catch (e) {}
  };

  // Start In-Place Dashboard Speech Audio Recording using MediaRecorder -> ElevenLabs Scribe v2 STT
  const handleStartListening = async () => {
    setSpeechErrorMsg('');
    setListeningTranscript('');
    setIsProcessing(false);
    setIsListening(true);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechErrorMsg('Microphone recording is not supported in this browser environment.');
      setIsListening(false);
      return;
    }

    try {
      console.log('🎙️ Requesting microphone access for MediaRecorder audio capture...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped. Releasing microphone stream...');
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const recordedChunks = audioChunksRef.current;
        if (!recordedChunks || recordedChunks.length === 0) {
          console.warn('No audio chunks captured during recording session.');
          setSpeechErrorMsg("Couldn't hear that. Please try again or choose a message below.");
          setIsListening(false);
          setIsProcessing(false);
          return;
        }

        setIsProcessing(true);
        console.log('⏳ Processing... Sending recorded audio to ElevenLabs Scribe v2 STT API...');

        try {
          const audioBlob = new Blob(recordedChunks, {
            type: mediaRecorder.mimeType || 'audio/webm',
          });

          const formData = new FormData();
          formData.append('audioSample', audioBlob, 'patient_recording.webm');

          const response = await voiceService.transcribeSpeech(formData);
          const transcript = response?.data?.text || response?.text || '';

          const lang = language === 'kannada' ? 'Kannada' : language === 'hindi' ? 'Hindi' : 'English';
          const defaultPrompt = lang === 'Kannada' ? 'ಧ್ವನಿ ಪ್ರಯತ್ನ ಗ್ರಹಿಸಲಾಗಿದೆ' : lang === 'Hindi' ? 'वाणी प्रयास पहचाना गया' : 'Speech Vocalization Triggered';
          
          const rawTranscript = (transcript || '').trim();
          const cleanTranscript = rawTranscript
            .replace(/\[(pause|silence|cough|sigh|snort|laughter|music|clearing|throat-clearing|applause|cheering|noise|static)\]/gi, '')
            .replace(/^\[.*\]$/, '')
            .replace(/\s+/g, ' ')
            .trim() || defaultPrompt;

          console.log(`✅ Scribe v2 Vocalization received: "${rawTranscript}" -> Cleaned: "${cleanTranscript}"`);
          setSpeechErrorMsg('');

          // Dynamically classify question and generate targeted response choices
          const choices = generateDynamicResponses(cleanTranscript, lang);

          setEphemeralQuestion(cleanTranscript);
          setEphemeralChoices(choices);

          if (choices && choices.length > 0) {
            const topReply = choices[0];
            setEphemeralSelectedChoice(topReply);
            setEphemeralStatusMsg(`⚡ Auto-Reply triggered: Synthesizing "${topReply}"...`);
            // Automatically trigger ElevenLabs TTS synthesis & audio playback
            processPhraseOutput(topReply);
          } else {
            const fallbackReply = lang === 'Kannada' ? 'ಹೌದು, ದಯವಿಟ್ಟು' : lang === 'Hindi' ? 'हाँ, कृपया' : 'Yes, please';
            setEphemeralSelectedChoice(fallbackReply);
            setEphemeralStatusMsg(`⚡ Auto-Reply triggered: Synthesizing "${fallbackReply}"...`);
            processPhraseOutput(fallbackReply);
          }
        } catch (sttErr) {
          console.error('ElevenLabs Scribe v2 Speech-to-Text error:', sttErr.message);
          setSpeechErrorMsg("Could not understand speech. Please try again.");
          setTimeout(() => setSpeechErrorMsg(''), 3500);
        } finally {
          setIsProcessing(false);
          setIsListening(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Slice audio chunk every 250ms
      console.log('🎙️ MediaRecorder started successfully. Patient is now recording audio...');
    } catch (micErr) {
      console.error('Microphone permission error during MediaRecorder start:', micErr);
      setSpeechErrorMsg('Microphone is turned off. Please allow microphone access or choose a message below.');
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  // Stop In-Place Speech Audio Recording
  const handleStopListening = () => {
    console.log('User manually tapped STOP LISTENING.');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    }
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

  // Drawer menu items for Patient
  const drawerItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      action: () => handleBackToDashboard(),
      isActive: currentView === 'dashboard',
    },
    {
      id: 'communicate',
      label: 'Communicate',
      icon: MessageSquare,
      action: () => handleOpenModule('Silent Speech'),
      isActive: currentView === 'module' && (activeModule === 'Silent Speech' || activeModule === 'Start Conversation'),
    },
    {
      id: 'conversation-mode',
      label: 'Conversation Mode',
      icon: MessageSquare,
      action: () => handleOpenModule('Conversation Mode'),
      isActive: currentView === 'module' && (activeModule === 'Conversation Mode' || activeModule === 'Real-Time Conversation'),
    },
    {
      id: 'universal-speech',
      label: 'Universal Speech (Type ⌨️ / Speak 🎤)',
      icon: Sparkles,
      action: () => handleOpenModule('Universal Speech'),
      isActive: currentView === 'module' && activeModule === 'Universal Speech',
    },
    {
      id: 'therapy',
      label: 'Therapy',
      icon: Brain,
      action: () => handleOpenModule('Therapy Exercises'),
      isActive: currentView === 'module' && activeModule === 'Therapy Exercises',
    },
    {
      id: 'play-practice',
      label: 'Play & Practice',
      icon: Gamepad2,
      action: () => handleOpenModule('Therapy Games'),
      isActive: currentView === 'module' && activeModule === 'Therapy Games',
    },
    {
      id: 'voice-profile',
      label: 'Voice Profile',
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
      id: 'caregiver-tech-info',
      label: 'Caregiver & Technical Info',
      icon: Radio,
      action: () => handleOpenModule('Caregiver Device Info'),
      isActive: currentView === 'module' && activeModule === 'Caregiver Device Info',
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
      label: 'I Need Help (Emergency)',
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

  // Render Caregiver / Technical Device Info View
  if (currentView === 'module' && (activeModule === 'Caregiver Device Info' || activeModule === 'Device Technical Info')) {
    return (
      <div className="app-viewport">
        <div className="mobile-container dashboard-container">
          <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="settings-btn"
              onClick={handleBackToDashboard}
              aria-label="Back to Patient Home"
              title="Back to Patient Home"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Caregiver & Technical Info</h2>
            <div style={{ width: 22 }} />
          </header>
          
          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="caregiver-tech-card">
              <span className="caregiver-tech-badge">
                <Radio size={14} /> Technical Diagnostics
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Device & Signal Status</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)' }}>
                This technical information is intended for caregivers and technical support.
              </p>
              
              <div className="device-metrics-grid" style={{ marginTop: '0.5rem' }}>
                <div className="metric-box">
                  <span className="metric-label">Connection Status</span>
                  <span className={`metric-value ${deviceStatus.status === 'Connected' ? 'status-online' : 'status-offline'}`}>
                    {deviceStatus.status}
                  </span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Device Name</span>
                  <span className="metric-value">{deviceStatus.deviceName || 'VoiceBack Band v1'}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Firmware Version</span>
                  <span className="metric-value">{deviceStatus.isConnected ? (deviceStatus.firmwareVersion || 'v1.0') : 'Not connected'}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Battery Level</span>
                  <span className="metric-value">{deviceStatus.isConnected && deviceStatus.batteryLevel ? `${deviceStatus.batteryLevel}%` : 'Battery —'}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Signal Strength</span>
                  <span className="metric-value">{deviceStatus.isConnected && deviceStatus.signalStrength ? deviceStatus.signalStrength : 'Signal —'}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">EMG Status</span>
                  <span className="metric-value">{deviceStatus.isConnected ? 'Active' : 'Not connected'}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Signal Quality</span>
                  <span className="metric-value">{deviceStatus.isConnected ? 'Optimal' : 'Not connected'}</span>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Synthesis Engine</span>
                  <span className="metric-value">ElevenLabs v2 / REST API</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-continue"
                onClick={handleBackToDashboard}
                style={{ marginTop: '1rem', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <ArrowLeft size={18} />
                <span>Return to Patient Home</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Render Module Component Views
  if (currentView === 'module' && (activeModule === 'Conversation Mode' || activeModule === 'Real-Time Conversation')) {
    return (
      <ConversationModeModule
        onBackToDashboard={handleBackToDashboard}
        patientId={profileData?.id || profileData?._id}
        patientName={profileData?.fullName || 'Patient'}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

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

  if (currentView === 'module' && (activeModule === 'Universal Speech' || activeModule === 'Universal Speech Generator')) {
    return (
      <div className="app-viewport">
        <div className="mobile-container dashboard-container">
          <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="settings-btn"
              onClick={handleBackToDashboard}
              aria-label="Back to Patient Home"
              title="Back to Patient Home"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Universal Speech Generator</h2>
            <div style={{ width: 22 }} />
          </header>
          
          <main className="role-main" style={{ marginTop: '1rem', width: '100%' }}>
            <UniversalSpeechInput patientId={profileData?.id} />
          </main>
        </div>
      </div>
    );
  }
  if (currentView === 'module' && (activeModule === 'Wake Word Pipeline' || activeModule === '7-Step Voice Architecture')) {
    return (
      <div className="app-viewport">
        <div className="mobile-container dashboard-container">
          <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="settings-btn"
              onClick={handleBackToDashboard}
              aria-label="Back to Patient Home"
              title="Back to Patient Home"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>7-Step Voice Architecture</h2>
            <div style={{ width: 22 }} />
          </header>
          
          <main className="role-main" style={{ marginTop: '1rem', width: '100%' }}>
            <WakeWordVoicePipelineModule patientId={profileData?.id} onBack={handleBackToDashboard} />
          </main>
        </div>
      </div>
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

        {/* MAIN PATIENT DASHBOARD VIEW - DOMINANT CENTRAL COMMUNICATE HUB */}
        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* 1. WELCOME & TRUTHFUL COMPACT DEVICE BAR */}
          <section className="welcome-compact-section" style={{ marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h1 className="welcome-title" style={{ margin: 0 }}>
                {getGreeting()}, {firstName}
              </h1>

              {/* COMPACT TRUTHFUL DEVICE PILL */}
              <div
                className="truthful-device-pill"
                onClick={() => {
                  if (deviceStatus.status !== 'CONNECTED') {
                    deviceService.requestAndConnectBluetooth().catch((err) => console.warn(err.message));
                  }
                }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Click to Connect Bluetooth Neckband"
              >
                <span className={`device-dot ${deviceStatus.status === 'CONNECTED' ? 'connected' : ''}`} />
                <span>
                  Status: <strong style={{ color: deviceStatus.status === 'CONNECTED' ? '#16A34A' : deviceStatus.status === 'CONNECTING' ? '#CA8A04' : '#DC2626' }}>
                    {deviceStatus.status}
                  </strong>
                </span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span>
                  {deviceStatus.status === 'CONNECTED' ? 'VoiceBack-Neckband Connected' : 'Tap to Connect BLE'}
                </span>
              </div>
            </div>

            <p className="welcome-subtitle">{t('tapToSpeakSubtitle')}</p>
          </section>

          {/* 2. DOMINANT CENTRAL COMMUNICATE CONTROL (IN-PLACE LISTENING / PROCESSING VS NORMAL HERO STATE) */}
          {isListening ? (
            <div className="in-place-listening-card">
              <div className="listening-header-row">
                <span className="hero-badge" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {isProcessing ? 'ElevenLabs Scribe v2 STT' : 'Microphone Input'}
                </span>
              </div>

              <div className="listening-pulse-stage">
                <div className="listening-icon-circle">
                  {isProcessing ? <Sparkles size={34} strokeWidth={2.5} /> : <Mic size={34} strokeWidth={2.5} />}
                </div>
                {!isProcessing && <div className="listening-pulse-ring-anim" />}
              </div>

              <div className="listening-status-text">
                <h2 className="listening-headline">
                  {isProcessing ? `⏳ ${t('processing')}` : `🎙️ ${t('listening')}`}
                </h2>
                <p className="listening-subtitle">
                  {isProcessing ? t('processing') : t('listening')}
                </p>
              </div>

              <div className="live-transcript-box">
                {isProcessing
                  ? t('processing')
                  : listeningTranscript || 'Speak now...'}
              </div>

              {!isProcessing && (
                <button
                  type="button"
                  className="btn-stop-listening"
                  onClick={handleStopListening}
                >
                  <Square size={18} fill="#FFFFFF" />
                  <span>{t('stopListening')}</span>
                </button>
              )}
            </div>
          ) : (

            <div
              tabIndex={0}
              role="button"
              aria-label="Communicate"
              className="hero-communicate-card"
              style={{ minHeight: '175px', padding: '1.6rem 1.5rem' }}
              onClick={handleStartListening}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartListening();
                }
              }}
            >
              <div className="hero-top-row">
                <div className="hero-icon-circle" style={{ width: 64, height: 64, borderRadius: 20 }}>
                  <MessageSquare size={36} strokeWidth={2.5} />
                </div>
                <span className="hero-badge" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                  {t('tapToSpeak')}
                </span>
              </div>

              <div className="hero-body" style={{ marginTop: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 className="hero-title" style={{ fontSize: '1.85rem' }}>{t('communicate')}</h2>
                  <Mic size={28} strokeWidth={2.5} />
                </div>
                <p className="hero-desc" style={{ fontSize: '1rem' }}>{t('tapToSpeakSubtitle')}</p>
              </div>
            </div>
          )}

          {/* UNIVERSAL DUAL-INPUT SPEECH GENERATOR (⌨️ TYPE or 🎤 SPEAK -> TEXT -> ElevenLabs -> 🔊 SPEAK) */}
          <UniversalSpeechInput patientId={profileData?.id} />

          {/* SPEECH ERROR DISPLAY IF ANY */}
          {speechErrorMsg && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#DC2626', fontSize: '0.875rem', fontWeight: 600 }}>
              {speechErrorMsg}
            </div>
          )}

          {/* RECOGNIZED / ACTIVE SPOKEN PHRASE DISPLAY BOX */}
          {activeOutputPhrase && !isListening && (
            <div className="spoken-phrase-box" style={{ marginTop: '0.2rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-blue-primary)' }}>
                  {isSynthesizingVoice ? t('synthesizingVoice') : t('youSaid')}
                </span>
                <p className="spoken-phrase-text" style={{ marginTop: '0.2rem' }}>
                  "{activeOutputPhrase}"
                </p>
              </div>
              <button
                type="button"
                className="btn-speak-again"
                aria-label="Speak phrase again"
                title="Speak phrase again"
                onClick={() => processPhraseOutput(activeOutputPhrase)}
              >
                <Volume2 size={22} />
              </button>
            </div>
          )}

          {/* ULTRA IMPRESSIVE EPHEMERAL CONVERSATION PANEL */}
          {ephemeralQuestion && (
            <div className="ultra-ephemeral-panel">
              {/* HEADER BADGE & CLOSE */}
              <div className="ultra-ephemeral-header">
                <div className="ultra-pill-badge">
                  <div className="soundwave-bars">
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                  </div>
                  <span>SPEECH RECOGNIZED</span>
                </div>
                <button
                  type="button"
                  onClick={clearEphemeralConversation}
                  style={{ border: 'none', background: 'transparent', color: 'var(--color-brand-tagline)', cursor: 'pointer', opacity: 0.75, transition: 'all 0.2s ease' }}
                  title="Clear conversation panel"
                >
                  <XCircle size={22} />
                </button>
              </div>

              {/* RECOGNIZED QUESTION TEXT */}
              <div>
                <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-brand-tagline)', display: 'block', marginBottom: '0.25rem' }}>
                  Person Said:
                </span>
                <p style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: 0, lineHeight: 1.35, letterSpacing: '-0.01em' }}>
                  "{ephemeralQuestion}"
                </p>
              </div>

              {/* DYNAMIC RESPONSE CHOICES */}
              {ephemeralChoices.length > 0 && !ephemeralSelectedChoice && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-title)', margin: 0 }}>
                    What would you like to say? (Tap a choice)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {ephemeralChoices.map((choiceText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEphemeralSelectedChoice(choiceText)}
                        style={{
                          padding: '0.9rem 1.1rem',
                          borderRadius: '16px',
                          border: '1.5px solid var(--border-color)',
                          background: 'rgba(255, 255, 255, 0.9)',
                          color: 'var(--color-brand-title)',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span>{choiceText}</span>
                        <CheckCircle2 size={19} color="var(--color-blue-primary)" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PATIENT SELECTED RESPONSE GLASS BOX */}
              {ephemeralSelectedChoice && (
                <div className="ultra-response-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={15} />
                      Selected Response (Patient Voice Output):
                    </span>
                    {ephemeralIsSynthesizing && (
                      <div className="soundwave-bars">
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: '0.2rem 0 0.6rem 0', lineHeight: 1.3 }}>
                    "{ephemeralSelectedChoice}"
                  </p>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className="ultra-btn-confirm"
                      onClick={handleConfirmEphemeralChoice}
                      disabled={ephemeralIsSynthesizing}
                    >
                      <CheckCircle2 size={20} />
                      <span>{ephemeralIsSynthesizing ? 'SYNTHESIZING...' : 'CONFIRM'}</span>
                    </button>

                    <button
                      type="button"
                      className="ultra-btn-change"
                      onClick={() => setEphemeralSelectedChoice('')}
                      disabled={ephemeralIsSynthesizing}
                    >
                      <RefreshCw size={16} />
                      <span>CHANGE</span>
                    </button>
                  </div>
                </div>
              )}

              {ephemeralStatusMsg && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)', fontSize: '0.825rem', color: 'var(--color-blue-primary)', textAlign: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Sparkles size={15} />
                  <span>{ephemeralStatusMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* SPEAKER VOLUME CONTROL WIDGET */}
          <VolumeControlWidget style={{ marginTop: '0.5rem' }} />

          {/* CONVERSATION MODE FEATURE CARD (PATIENT DASHBOARD ONLY) */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Conversation Mode"
            onClick={() => handleOpenModule('Conversation Mode')}
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(13, 148, 136, 0.08) 100%)',
              border: '1.5px solid var(--color-blue-primary)',
              borderRadius: '20px',
              padding: '1.1rem 1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'var(--color-blue-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                  Conversation Mode
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', margin: '0.15rem 0 0 0' }}>
                  Listen to companion & speak with confirmed choices
                </p>
              </div>
            </div>
            <ArrowRight size={20} color="var(--color-blue-primary)" />
          </div>

          {/* UNIVERSAL SPEECH GENERATOR FEATURE CARD */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Universal Speech Generator"
            onClick={() => handleOpenModule('Universal Speech')}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)',
              border: '1.5px solid #10B981',
              borderRadius: '20px',
              padding: '1.1rem 1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                  Universal Speech Generator
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', margin: '0.15rem 0 0 0' }}>
                  ⌨️ Type or 🎤 Speak ➔ ElevenLabs Patient Voice
                </p>
              </div>
            </div>
            <ArrowRight size={20} color="#10B981" />
          </div>




          {/* 4. TWO LARGE CATEGORY SELECTION CONTROLS: BASIC & PEOPLE */}
          <section style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
              <Sparkles size={16} color="var(--color-blue-primary)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, color: 'var(--color-brand-title)' }}>
                {t('quickMessages')}
              </h3>
            </div>

            {/* TWO LARGE CATEGORY SELECTOR CARDS */}
            <div className="category-selector-grid" style={{ marginBottom: '0.85rem' }}>
              {/* CATEGORY 1: BASIC */}
              <div
                tabIndex={0}
                role="button"
                aria-label="Basic Everyday Needs"
                className={`category-selector-card basic ${activeCategoryTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveCategoryTab('basic')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveCategoryTab('basic');
                  }
                }}
              >
                <h4 className="category-card-title">
                  <Sparkles size={20} />
                  <span>{t('basicTab')}</span>
                </h4>
                <p className="category-card-sub">{t('everydayNeeds')}</p>
              </div>

              {/* CATEGORY 2: PEOPLE */}
              <div
                tabIndex={0}
                role="button"
                aria-label="People Family and Care"
                className={`category-selector-card people ${activeCategoryTab === 'people' ? 'active' : ''}`}
                onClick={() => setActiveCategoryTab('people')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveCategoryTab('people');
                  }
                }}
              >
                <h4 className="category-card-title">
                  <Users size={20} />
                  <span>{t('peopleTab')}</span>
                </h4>
                <p className="category-card-sub">{t('familyAndCare')}</p>
              </div>
            </div>

            {/* QUICK MESSAGE BUTTONS GRID */}
            {activeCategoryTab === 'basic' ? (
              <div className="quick-msg-grid-8">
                {/* 1. WATER */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseWater'), 'phraseWater')}
                >
                  <div className="quick-msg-icon-box">
                    <Droplet size={22} />
                  </div>
                  <span>{t('labelWater')}</span>
                </button>

                {/* 2. FOOD */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseFood'), 'phraseFood')}
                >
                  <div className="quick-msg-icon-box">
                    <Utensils size={22} />
                  </div>
                  <span>{t('labelFood')}</span>
                </button>

                {/* 3. MEDICINE */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseMedicine'), 'phraseMedicine')}
                >
                  <div className="quick-msg-icon-box">
                    <Sparkles size={22} />
                  </div>
                  <span>{t('labelMedicine')}</span>
                </button>

                {/* 4. PAIN */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phrasePain'), 'phrasePain')}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                    <Activity size={22} />
                  </div>
                  <span>{t('labelPain')}</span>
                </button>

                {/* 5. TOILET */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseToilet'), 'phraseToilet')}
                >
                  <div className="quick-msg-icon-box">
                    <Info size={22} />
                  </div>
                  <span>{t('labelToilet')}</span>
                </button>

                {/* 6. YES */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseYes'), 'phraseYes')}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <span>{t('labelYes')}</span>
                </button>

                {/* 7. NO */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseNo'), 'phraseNo')}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                    <XCircle size={22} />
                  </div>
                  <span>{t('labelNo')}</span>
                </button>

                {/* 8. TIRED */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseTired'), 'phraseTired')}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                    <Moon size={22} />
                  </div>
                  <span>{t('labelTired')}</span>
                </button>
              </div>
            ) : (
              <div className="quick-msg-grid-4">
                {/* 1. FAMILY */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseFamily'), 'phraseFamily')}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(219, 39, 119, 0.1)', color: '#DB2777' }}>
                    <Heart size={22} />
                  </div>
                  <span>{t('labelFamily')}</span>
                </button>

                {/* 2. CAREGIVER */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseCaregiver'), 'phraseCaregiver')}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7' }}>
                    <User size={22} />
                  </div>
                  <span>{t('labelCaregiver')}</span>
                </button>

                {/* 3. DOCTOR */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseDoctor'), 'phraseDoctor')}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A' }}>
                    <Activity size={22} />
                  </div>
                  <span>{t('labelDoctor')}</span>
                </button>

                {/* 4. CALL FAMILY */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseCallFamily'), 'phraseCallFamily')}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                    <PhoneCall size={22} />
                  </div>
                  <span>{t('labelCallFamily')}</span>
                </button>
              </div>
            )}
          </section>

          {/* 4. SEPARATE LARGE RED SOS EMERGENCY ACTION */}
          <section style={{ width: '100%' }}>
            <div
              tabIndex={0}
              role="button"
              aria-label="I Need Help Emergency SOS"
              className="sos-large-card"
              onClick={() => handleOpenModule('Emergency SOS')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenModule('Emergency SOS');
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={26} color="#FFFFFF" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                    {t('emergencySos')}
                  </h3>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, color: 'rgba(255,255,255,0.9)' }}>
                    {t('emergencySosDesc')}
                  </p>
                </div>
              </div>
              <ArrowRight size={24} color="#FFFFFF" strokeWidth={3} />
            </div>
          </section>

          {/* 5. DEDICATED THERAPY & PLAY REHABILITATION SECTION */}
          <section style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
              <Brain size={16} color="var(--color-green-primary)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0, color: 'var(--color-brand-title)' }}>
                {t('therapyExercises')} & {t('playAndPractice')}
              </h3>
            </div>

            <div className="home-secondary-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {/* CARD 1: THERAPY */}
              <div
                tabIndex={0}
                role="button"
                aria-label="Therapy Exercises"
                className="therapy-play-card therapy"
                onClick={() => handleOpenModule('Therapy Exercises')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenModule('Therapy Exercises');
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.65rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(22, 163, 74, 0.12)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={24} strokeWidth={2.5} />
                  </div>
                  <ArrowRight size={18} color="var(--color-brand-title)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--color-brand-title)' }}>
                    {t('therapyExercises')}
                  </h3>
                  <p style={{ fontSize: '0.825rem', fontWeight: 600, margin: 0, color: 'var(--color-brand-tagline)' }}>
                    {t('therapyExercisesDesc')}
                  </p>
                </div>
              </div>

              {/* CARD 2: PLAY */}
              <div
                tabIndex={0}
                role="button"
                aria-label="Practice and Learn Games"
                className="therapy-play-card play"
                onClick={() => handleOpenModule('Therapy Games')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenModule('Therapy Games');
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.65rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(147, 51, 234, 0.12)', color: '#9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gamepad2 size={24} strokeWidth={2.5} />
                  </div>
                  <ArrowRight size={18} color="var(--color-brand-title)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--color-brand-title)' }}>
                    {t('playAndPractice')}
                  </h3>
                  <p style={{ fontSize: '0.825rem', fontWeight: 600, margin: 0, color: 'var(--color-brand-tagline)' }}>
                    {t('playAndPracticeDesc')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. REAL DATA FEEDS (BACKEND THERAPY PROGRESS & RECENT ACTIVITY) */}
          {therapyProgress && therapyProgress.length > 0 && (
            <section className="profile-section-card" style={{ width: '100%', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={18} color="var(--color-green-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Recent Therapy Progress</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {therapyProgress.slice(0, 2).map((item, idx) => (
                  <div key={item._id || idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.05)', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                      Exercises: {item.exercisesCompleted || 0} | Accuracy: {item.accuracyScore || 0}%
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {communicationHistory && communicationHistory.length > 0 && (
            <section className="recent-activity-card" style={{ width: '100%' }}>
              <div className="recent-activity-header">
                <Info size={18} color="var(--color-blue-primary)" />
                <h3>Recent Communication</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {communicationHistory.slice(0, 2).map((log, idx) => (
                  <div key={log._id || idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                      "{log.recognizedText}"
                    </p>
                  </div>
                ))}
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

export default PatientDashboardScreen;
