import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowLeft,
  Mic,
  Radio,
  Wifi,
  Activity,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowRight,
  RefreshCw,
  Home,
  MessageSquare,
  User,
  Settings,
  AlertTriangle,
  LogOut,
  Info,
  Droplet,
  Utensils,
  HelpCircle,
  Heart,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import VolumeControlWidget from './VolumeControlWidget';
import { useSettings } from '../context/SettingsContext';
import deviceService, { DEVICE_STATES } from '../services/deviceService';
import authService from '../services/authService';
import voiceService from '../services/voiceService';

/**
 * Live EMG Waveform Visualizer for BioAmp EXG Pill (GPIO34)
 */
export const EMGWaveformVisualizer = ({ isConnected, deviceName }) => {
  const canvasRef = useRef(null);
  const BUFFER_SIZE = 200;
  const dataBufferRef = useRef(Array(200).fill(1800));
  const [currentVal, setCurrentVal] = useState({ raw: 0, flt: 0, vlt: 0 });

  useEffect(() => {
    if (!isConnected) {
      setCurrentVal({ raw: 0, flt: 0, vlt: 0 });
      dataBufferRef.current = Array(200).fill(1800);
      return;
    }

    const unsubscribe = deviceService.subscribeTelemetry((packet) => {
      if (packet && typeof packet.raw !== 'undefined') {
        setCurrentVal(packet);
        const val = typeof packet.flt !== 'undefined' ? packet.flt : packet.raw;
        dataBufferRef.current.push(val);
        if (dataBufferRef.current.length > BUFFER_SIZE) {
          dataBufferRef.current.shift();
        }
      }
    });

    let animId;
    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const parentWidth = canvas.parentElement?.clientWidth || 340;
        if (canvas.width !== parentWidth) {
          canvas.width = parentWidth;
        }
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.12)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 25) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Waveform plot
        const data = dataBufferRef.current;
        if (data.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = isConnected ? '#38BDF8' : '#64748B';
          ctx.lineWidth = 2.5;

          const minVal = 0;
          const maxVal = 4095;

          data.forEach((val, index) => {
            const x = (index / (data.length - 1)) * width;
            const normalized = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
            const y = height - (normalized * (height - 12) + 6);

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        }
      }
      animId = requestAnimationFrame(renderCanvas);
    };

    animId = requestAnimationFrame(renderCanvas);

    return () => {
      unsubscribe();
      cancelAnimationFrame(animId);
    };
  }, [isConnected]);

  return (
    <div style={{ width: '100%', background: '#0F172A', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(2, 132, 199, 0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? '#22C55E' : '#EF4444', display: 'inline-block', boxShadow: isConnected ? '0 0 8px #22C55E' : 'none' }} />
          <span style={{ color: '#F8FAFC', fontSize: '0.875rem', fontWeight: 800 }}>
            {isConnected ? `${deviceName || 'VoiceBack-Neckband'} Connected` : 'EMG Telemetry Offline'}
          </span>
        </div>
        <span style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
          BioAmp EXG Pill (GPIO34)
        </span>
      </div>

      <canvas ref={canvasRef} width={340} height={90} style={{ width: '100%', height: '90px', display: 'block', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.6)' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', textAlign: 'center' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem', borderRadius: '8px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Raw ADC</div>
          <div style={{ color: '#F8FAFC', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace' }}>{isConnected ? currentVal.raw : '-'}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem', borderRadius: '8px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Filtered EMA</div>
          <div style={{ color: '#38BDF8', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace' }}>{isConnected ? currentVal.flt : '-'}</div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.4rem', borderRadius: '8px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Voltage</div>
          <div style={{ color: '#4ADE80', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'monospace' }}>{isConnected ? `${currentVal.vlt}V` : '-'}</div>
        </div>
      </div>
    </div>
  );
};

export const SilentSpeechModule = ({
  initialStep = 'silent-speech-home',
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [step, setStep] = useState(initialStep);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activePhrase, setActivePhrase] = useState('I need water.');
  const [activeCategory, setActiveCategory] = useState('basic');
  const [deviceStatus, setDeviceStatus] = useState(() => deviceService.getDeviceStatus());
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [proposedText, setProposedText] = useState('I need water.');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState('');
  const lastSpokenStepRef = useRef(null);

  const handleConfirmAndSpeak = async () => {
    if (!proposedText || !proposedText.trim()) return;
    setIsSynthesizing(true);
    setPlaybackStatus('Synthesizing speech via patient voice profile...');
    try {
      const session = authService.getActiveSession();
      const patientId = session?.user?.profile?._id || session?.user?.id;
      const res = await voiceService.playSynthesizedAudio({
        patientId,
        text: proposedText,
        language: 'English',
        emotion: 'neutral',
      });
      setPlaybackStatus(res.provider ? `Output: ${res.provider}` : 'Audio sent to physical speaker.');
    } catch (err) {
      console.warn('Speech synthesis playback error:', err.message);
      setPlaybackStatus(`Speech synthesis error: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleRejectText = () => {
    setPlaybackStatus('Speech request rejected by patient.');
    setStep('listening');
  };

  useEffect(() => {
    const unsubscribe = deviceService.subscribe((status) => {
      setDeviceStatus(status);
      if (status.status === DEVICE_STATES.CONNECTED) {
        setIsConnecting(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleConnectBLE = async () => {
    setConnectionError('');
    setIsConnecting(true);
    try {
      await deviceService.requestAndConnectBluetooth();
      setConnectionError('');
    } catch (err) {
      console.warn('Bluetooth connection error:', err.message);
      setConnectionError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectBLE = async () => {
    try {
      await deviceService.disconnect();
    } catch (err) {
      console.warn('Disconnection error:', err);
    }
  };

  // Categorized Quick Communication Phrases
  const basicPhrases = [
    { id: 'water', label: 'WATER', text: 'I need water.', icon: Droplet, colorClass: 'water' },
    { id: 'food', label: 'FOOD', text: 'I need food.', icon: Utensils, colorClass: 'food' },
    { id: 'pain', label: 'PAIN', text: 'I am in pain.', icon: Activity, colorClass: 'pain' },
    { id: 'toilet', label: 'TOILET', text: 'I need the toilet.', icon: Info, colorClass: 'water' },
    { id: 'medicine', label: 'MEDICINE', text: 'I need my medicine.', icon: Sparkles, colorClass: 'food' },
  ];

  const relationPhrases = [
    { id: 'family', label: 'FAMILY', text: 'I want my family.', icon: Heart, colorClass: 'family' },
    { id: 'caregiver', label: 'CAREGIVER', text: 'I want my caregiver.', icon: User, colorClass: 'water' },
    { id: 'doctor', label: 'DOCTOR', text: 'I want my doctor.', icon: CheckCircle2, colorClass: 'pain' },
  ];

  const sosPhrases = [
    { id: 'help', label: 'HELP', text: 'I need help.', icon: HelpCircle, colorClass: 'help' },
  ];

  const [profileData] = useState(() => {
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

  const firstLetter = profileData.fullName ? profileData.fullName.trim().charAt(0).toUpperCase() : 'S';

  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (lastSpokenStepRef.current === step) return;

    lastSpokenStepRef.current = step;

    switch (step) {
      case 'silent-speech-home':
        speak('Welcome to Silent Speech.');
        break;
      case 'connect-device':
        speak('Connect your wearable device to continue.');
        break;
      case 'ready-to-capture':
        speak('You are ready to begin communication.');
        break;
      case 'listening':
        speak('Listening has started.');
        break;
      default:
        break;
    }
  }, [step, voiceAssistant, speak]);

  const handleStepChange = (nextStep) => {
    setStep(nextStep);
    setIsDrawerOpen(false);
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
      id: 'silent-speech-home',
      label: 'Silent Speech',
      icon: Mic,
      action: () => handleStepChange('silent-speech-home'),
      isActive: step === 'silent-speech-home',
    },
    {
      id: 'connect-device',
      label: 'Connect Device',
      icon: Wifi,
      action: () => handleStepChange('connect-device'),
      isActive: step === 'connect-device',
    },
    {
      id: 'ready-to-capture',
      label: 'Ready to Capture',
      icon: CheckCircle2,
      action: () => handleStepChange('ready-to-capture'),
      isActive: step === 'ready-to-capture',
    },
    {
      id: 'listening',
      label: 'Listening',
      icon: Activity,
      action: () => handleStepChange('listening'),
      isActive: step === 'listening',
    },
    {
      id: 'conversation-history',
      label: 'Conversation History',
      icon: MessageSquare,
      action: () => handleStepChange('conversation-history'),
      isActive: step === 'conversation-history',
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
      <div className="mobile-container silent-speech-container">
        
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
                <img src={avatarDataUrl} alt={profileData.fullName} className="drawer-avatar-img" />
              ) : (
                <span>{firstLetter}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{profileData.fullName}</h4>
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

        {/* SCREEN 1: SILENT SPEECH & QUICK COMMUNICATION */}
        {step === 'silent-speech-home' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  type="button"
                  className="settings-btn"
                  aria-label="Return to Patient Home"
                  title="Return to Patient Home"
                  onClick={onBackToDashboard}
                >
                  <ArrowLeft size={22} />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  COMMUNICATE
                </h1>
              </div>

              <button
                type="button"
                className="header-profile-avatar-btn"
                aria-label={`Patient Profile for ${profileData.fullName}`}
                onClick={onOpenProfile}
              >
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt={profileData.fullName} className="header-avatar-img" />
                ) : (
                  <span className="header-avatar-initial">{firstLetter}</span>
                )}
              </button>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
              
              {/* 1. ACTIVE SPOKEN PHRASE DISPLAY BOX */}
              <div className="spoken-phrase-box">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-blue-primary)' }}>
                    Active Speech Output
                  </span>
                  <p className="spoken-phrase-text" style={{ marginTop: '0.2rem' }}>
                    "{activePhrase || 'I need water.'}"
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-speak-again"
                  aria-label="Speak phrase again"
                  title="Speak phrase again"
                  onClick={() => {
                    if (speak) speak(activePhrase || 'I need water.');
                  }}
                >
                  <Volume2 size={22} />
                </button>
              </div>

              {/* 2. LIVE EMG TELEMETRY VISUALIZER (WHEN BLE CONNECTED) */}
              <EMGWaveformVisualizer
                isConnected={deviceStatus.isConnected}
                deviceName={deviceStatus.deviceName}
              />

              {/* 3. SPEAKER VOLUME CONTROL WIDGET */}
              <VolumeControlWidget />

              {/* 3. CATEGORY TABS (BASIC, RELATION, SOS) */}
              <section className="common-needs-section">
                <div className="category-tab-grid">
                  <button
                    type="button"
                    className={`category-tab-btn ${activeCategory === 'basic' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('basic')}
                  >
                    <Sparkles size={16} />
                    <span>BASIC</span>
                  </button>

                  <button
                    type="button"
                    className={`category-tab-btn ${activeCategory === 'relation' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('relation')}
                  >
                    <User size={16} />
                    <span>RELATION</span>
                  </button>

                  <button
                    type="button"
                    className={`category-tab-btn ${activeCategory === 'sos' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('sos')}
                  >
                    <HelpCircle size={16} />
                    <span>SOS</span>
                  </button>
                </div>

                {/* CATEGORIZED PHRASE CARDS GRID */}
                <div className="phrase-card-grid" style={{ marginTop: '0.65rem' }}>
                  {activeCategory === 'basic' && basicPhrases.map((phrase) => {
                    const IconComponent = phrase.icon;
                    return (
                      <button
                        key={phrase.id}
                        type="button"
                        className={`common-need-btn ${phrase.colorClass}`}
                        onClick={() => {
                          setActivePhrase(phrase.text);
                          if (speak) speak(phrase.text);
                        }}
                      >
                        <div className="common-need-icon">
                          <IconComponent size={22} />
                        </div>
                        <span>{phrase.label}</span>
                      </button>
                    );
                  })}

                  {activeCategory === 'relation' && relationPhrases.map((phrase) => {
                    const IconComponent = phrase.icon;
                    return (
                      <button
                        key={phrase.id}
                        type="button"
                        className={`common-need-btn ${phrase.colorClass}`}
                        onClick={() => {
                          setActivePhrase(phrase.text);
                          if (speak) speak(phrase.text);
                        }}
                      >
                        <div className="common-need-icon">
                          <IconComponent size={22} />
                        </div>
                        <span>{phrase.label}</span>
                      </button>
                    );
                  })}

                  {activeCategory === 'sos' && sosPhrases.map((phrase) => {
                    const IconComponent = phrase.icon;
                    return (
                      <button
                        key={phrase.id}
                        type="button"
                        className={`common-need-btn ${phrase.colorClass}`}
                        onClick={() => {
                          setActivePhrase(phrase.text);
                          if (speak) speak(phrase.text);
                        }}
                      >
                        <div className="common-need-icon">
                          <IconComponent size={22} />
                        </div>
                        <span>{phrase.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 4. HARDWARE BLE SETUP CARD */}
              <section className="profile-section-card" style={{ width: '100%', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Radio size={20} color="var(--color-blue-primary)" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>ESP32 BLE Neckband</h3>
                  </div>
                  <span className={`device-name-badge ${deviceStatus.isConnected ? 'connected' : 'disconnected'}`}>
                    {deviceStatus.status || 'Connect Device'}
                  </span>
                </div>

                {deviceStatus.isConnected ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    <p style={{ fontSize: '0.875rem', color: '#16A34A', fontWeight: 700, margin: 0 }}>
                      ✓ VoiceBack-Neckband Connected & Streaming sEMG Telemetry
                    </p>
                    <button
                      type="button"
                      className="btn-danger-logout"
                      onClick={handleDisconnectBLE}
                      style={{ width: '100%', marginTop: '0.35rem' }}
                    >
                      Disconnect Device
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-brand-tagline)', margin: 0 }}>
                      Connect physical ESP32 BLE device (VoiceBack-Neckband) to capture live sEMG signal telemetry.
                    </p>
                    <button
                      type="button"
                      className="btn-continue"
                      onClick={handleConnectBLE}
                      disabled={isConnecting}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Wifi size={18} />}
                      <span>{isConnecting ? 'CONNECTING...' : 'Connect VoiceBack-Neckband'}</span>
                    </button>
                  </div>
                )}

                {connectionError && (
                  <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid #DC2626', color: '#DC2626', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={16} />
                    <span>{connectionError}</span>
                  </div>
                )}
              </section>

            </main>
          </>
        )}

        {/* SCREEN 2: CONNECT DEVICE */}
        {step === 'connect-device' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Silent Speech Home"
                onClick={() => handleStepChange('silent-speech-home')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Connect Device
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: deviceStatus.isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                  border: `2px solid ${deviceStatus.isConnected ? '#22C55E' : 'var(--color-blue-primary)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '1rem',
                  boxShadow: '0 8px 24px rgba(2, 132, 199, 0.15)',
                }}
              >
                <Radio size={48} color={deviceStatus.isConnected ? '#22C55E' : 'var(--color-blue-primary)'} />
              </div>

              <div style={{ textAlign: 'center', maxWidth: '340px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brand-title)', marginBottom: '0.4rem' }}>
                  VoiceBack-Neckband
                </h2>
                <p style={{ fontSize: '0.925rem', color: 'var(--color-brand-tagline)', lineHeight: 1.45 }}>
                  {deviceStatus.isConnected ? 'VoiceBack-Neckband Connected' : 'Connect your physical ESP32 BLE wearable device to begin streaming real-time BioAmp EXG Pill sEMG telemetry.'}
                </p>
              </div>

              <div className="profile-section-card" style={{ width: '100%', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
                <span className="profile-field-label">Current Status</span>
                <span
                  className={`device-name-badge ${deviceStatus.isConnected ? 'connected' : 'disconnected'}`}
                  style={{
                    fontSize: '0.9rem',
                    padding: '0.4rem 1rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    background: deviceStatus.isConnected ? 'rgba(34, 197, 94, 0.15)' : deviceStatus.isConnecting ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: deviceStatus.isConnected ? '#16A34A' : deviceStatus.isConnecting ? '#CA8A04' : '#DC2626',
                    border: `1px solid ${deviceStatus.isConnected ? '#22C55E' : deviceStatus.isConnecting ? '#EAB308' : '#EF4444'}`
                  }}
                >
                  {deviceStatus.status}
                </span>

                {deviceStatus.isConnected ? (
                  <div style={{ width: '100%', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid #22C55E', color: '#16A34A', fontSize: '0.9rem', fontWeight: 800 }}>
                      VoiceBack-Neckband Connected
                    </div>

                    <button
                      type="button"
                      className="btn-danger-logout"
                      onClick={handleDisconnectBLE}
                      style={{ width: '100%' }}
                    >
                      Disconnect Device
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-continue"
                    onClick={handleConnectBLE}
                    disabled={isConnecting}
                    style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Wifi size={18} />}
                    <span>{isConnecting ? 'CONNECTING...' : 'Connect VoiceBack-Neckband'}</span>
                  </button>
                )}

                {connectionError && (
                  <div style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid #DC2626', color: '#DC2626', fontSize: '0.825rem', fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{connectionError}</span>
                  </div>
                )}
              </div>

              {/* LIVE EMG WAVEFORM DISPLAY */}
              <EMGWaveformVisualizer
                isConnected={deviceStatus.isConnected}
                deviceName={deviceStatus.deviceName}
              />

            </main>
          </>
        )}

        {/* SCREEN 3: READY TO CAPTURE */}
        {step === 'ready-to-capture' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Connect Device"
                onClick={() => handleStepChange('connect-device')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Silent Speech
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ textAlign: 'center', width: '100%', padding: '2rem 1.25rem', gap: '1rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)', border: '2px solid var(--color-green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <CheckCircle2 size={36} color="var(--color-green-primary)" />
                </div>

                <div>
                  <span className="device-name-badge" style={{ background: 'rgba(22, 163, 74, 0.12)', color: 'var(--color-green-primary)', fontSize: '0.85rem' }}>
                    Ready
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-title)', marginTop: '0.5rem', marginBottom: '0.35rem' }}>
                    Ready to Capture
                  </h2>
                  <p style={{ fontSize: '0.925rem', color: 'var(--color-brand-tagline)', lineHeight: 1.45 }}>
                    Your wearable device is ready. Press <strong>Start Listening</strong> to begin.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-continue"
                  onClick={() => handleStepChange('listening')}
                  style={{ width: '100%', marginTop: '0.75rem' }}
                >
                  <Mic size={20} />
                  <span>Start Listening</span>
                </button>
              </div>
            </main>
          </>
        )}

        {/* SCREEN 4: LISTENING */}
        {step === 'listening' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Ready"
                onClick={() => handleStepChange('ready-to-capture')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Listening
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <div className="listening-stage">
                <div className="listening-mic-circle">
                  <Mic size={48} color="#FFFFFF" />
                </div>
                <div className="listening-pulse-ring ring-1" />
                <div className="listening-pulse-ring ring-2" />
                <div className="listening-pulse-ring ring-3" />
              </div>

              <div style={{ textAlign: 'center' }}>
                <span className="placeholder-badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: 'var(--color-blue-primary)' }}>
                  Active Listening
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-brand-title)', marginTop: '0.4rem' }}>
                  Listening...
                </h2>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', marginTop: '0.35rem' }}>
                  {deviceStatus.isConnected ? 'Receiving real-time BioAmp EXG Pill sEMG signal stream...' : 'Waiting for EMG signal...'}
                </p>
              </div>

              <EMGWaveformVisualizer
                isConnected={deviceStatus.isConnected}
                deviceName={deviceStatus.deviceName}
              />

              <button
                type="button"
                className="btn-danger-logout"
                onClick={() => handleStepChange('recognized-text')}
                style={{ width: '100%', maxWidth: '360px', marginTop: '1rem' }}
              >
                <Activity size={18} />
                <span>Stop Listening</span>
              </button>
            </main>
          </>
        )}

        {/* SCREEN 5: RECOGNIZED TEXT & PATIENT CONFIRMATION */}
        {step === 'recognized-text' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Listening"
                onClick={() => handleStepChange('listening')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Review Prediction
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              
              <div className="profile-section-card" style={{ width: '100%', gap: '1rem', padding: '1.5rem 1.25rem', textAlign: 'center' }}>
                <span className="placeholder-badge" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#CA8A04', border: '1px solid #EAB308' }}>
                  Confirmation Required Before Audio Output
                </span>

                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-brand-tagline)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Proposed Speech Output
                </h3>

                <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.06)', border: '2px solid var(--color-blue-primary)' }}>
                  <p style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0, lineHeight: 1.4 }}>
                    "{proposedText}"
                  </p>
                </div>

                <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', margin: 0 }}>
                  Review the proposed text above. Audio will <strong>NOT</strong> play until you press <strong>CONFIRM & SPEAK</strong>.
                </p>

                {playbackStatus && (
                  <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.04)', color: 'var(--color-brand-title)', fontSize: '0.825rem', fontWeight: 600 }}>
                    {playbackStatus}
                  </div>
                )}

                {/* PATIENT ACTION BUTTONS: CONFIRM vs REJECT */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                  
                  {/* REJECT BUTTON (DISCARD WITHOUT TTS) */}
                  <button
                    type="button"
                    className="btn-danger-logout"
                    onClick={handleRejectText}
                    disabled={isSynthesizing}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.85rem 0.5rem' }}
                  >
                    <X size={18} />
                    <span>REJECT</span>
                  </button>

                  {/* CONFIRM BUTTON (SYNTHESIZE & ROUTE TO PHYSICAL SPEAKER) */}
                  <button
                    type="button"
                    className="btn-continue"
                    onClick={handleConfirmAndSpeak}
                    disabled={isSynthesizing}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.85rem 0.5rem', background: '#16A34A', borderColor: '#16A34A' }}
                  >
                    {isSynthesizing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>SYNTHESIZING...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>CONFIRM & SPEAK</span>
                      </>
                    )}
                  </button>

                </div>
              </div>

              {/* LIVE TELEMETRY DISPLAY */}
              <EMGWaveformVisualizer
                isConnected={deviceStatus.isConnected}
                deviceName={deviceStatus.deviceName}
              />
            </main>
          </>
        )}

      </div>

      <SettingsBottomSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default SilentSpeechModule;
