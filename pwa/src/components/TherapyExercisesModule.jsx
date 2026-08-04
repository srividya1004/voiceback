import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowLeft,
  Brain,
  MessageSquare,
  Volume2,
  Smile,
  Headphones,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Home,
  RefreshCw,
  Info,
  User,
  Settings,
  LogOut,
  Play,
  Check
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const TherapyExercisesModule = ({
  initialCategories,
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [currentStep, setCurrentStep] = useState('home'); // 'home' | 'exercise' | 'complete'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastSpokenRef = useRef(null);

  // Default Categories Schema (Ready to be populated via GET /api/therapy-exercises REST API)
  const defaultCategories = [
    {
      id: 'speech-practice',
      title: 'Speech Practice',
      desc: 'Improve pronunciation and speech formation.',
      instructions: 'Read the displayed word aloud slowly and clearly.',
      icon: MessageSquare,
      colorClass: 'blue',
    },
    {
      id: 'language-exercises',
      title: 'Language Exercises',
      desc: 'Practice word recognition and language comprehension.',
      instructions: 'Recognize the word images and practice articulating each phrase.',
      icon: Brain,
      colorClass: 'green',
    },
    {
      id: 'mouth-movement',
      title: 'Mouth Movement',
      desc: 'Exercises to strengthen speech muscles.',
      instructions: 'Practice mouth and lip movements slowly following guided postures.',
      icon: Smile,
      colorClass: 'orange',
    },
    {
      id: 'listening-practice',
      title: 'Listening Practice',
      desc: 'Improve listening and understanding.',
      instructions: 'Listen carefully to clear speech prompts and practice repeating.',
      icon: Headphones,
      colorClass: 'blue',
    },
    {
      id: 'daily-communication',
      title: 'Daily Communication',
      desc: 'Practice common daily conversations.',
      instructions: 'Practice essential everyday conversational greetings and phrases.',
      icon: MessageCircle,
      colorClass: 'green',
    },
  ];

  // Dynamic Categories State ready to receive API data
  const [categories, setCategories] = useState(initialCategories || defaultCategories);

  // Sync profile data & avatar from localStorage / ready for API data
  const [profileData] = useState(() => {
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

  const firstLetter = profileData.fullName ? profileData.fullName.trim().charAt(0).toUpperCase() : 'S';

  // Voice Assistant: Speak once per screen / step
  useEffect(() => {
    if (!voiceAssistant || !speak) return;

    if (currentStep === 'home' && lastSpokenRef.current !== 'home') {
      lastSpokenRef.current = 'home';
      speak('Welcome to Therapy Exercises. Select an exercise to begin.');
    } else if (currentStep === 'exercise' && selectedCategory && lastSpokenRef.current !== `exercise-${selectedCategory.id}`) {
      lastSpokenRef.current = `exercise-${selectedCategory.id}`;
      speak(`${selectedCategory.title}. ${selectedCategory.instructions}`);
    } else if (currentStep === 'complete' && lastSpokenRef.current !== 'complete') {
      lastSpokenRef.current = 'complete';
      speak("Thank you for completing today's exercise.");
    }
  }, [currentStep, selectedCategory, voiceAssistant, speak]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setIsSessionActive(false);
    setCurrentStep('exercise');
  };

  const handleStartExercise = () => {
    setIsSessionActive(true);
    if (voiceAssistant && speak && selectedCategory) {
      speak('Exercise session started.');
    }
  };

  const handleFinishExercise = () => {
    setIsSessionActive(false);
    setCurrentStep('complete');
  };

  const handleReturnToTherapy = () => {
    setSelectedCategory(null);
    setIsSessionActive(false);
    setCurrentStep('home');
  };

  // Drawer Navigation Items
  const drawerItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => onBackToDashboard(),
      isActive: false,
    },
    {
      id: 'therapy-home',
      label: 'Therapy Exercises',
      icon: Brain,
      action: () => handleReturnToTherapy(),
      isActive: currentStep === 'home',
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
      <div className="mobile-container therapy-container">
        
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

        {/* STEP 1: THERAPY HOME */}
        {currentStep === 'home' && (
          <>
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
                  Therapy Exercises
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

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
              <section className="welcome-compact-section">
                <p className="welcome-subtitle" style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', fontWeight: 600, lineHeight: 1.45 }}>
                  Practice speech and communication exercises designed to improve your rehabilitation.
                </p>
              </section>

              {/* CATEGORY CARDS */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                {categories.map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      tabIndex={0}
                      role="button"
                      aria-label={cat.title}
                      className="action-card"
                      onClick={() => handleSelectCategory(cat)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectCategory(cat);
                        }
                      }}
                      style={{ minHeight: 'auto', padding: '1.15rem' }}
                    >
                      <div className="action-card-header">
                        <div className="action-icon-box">
                          <CatIcon size={22} />
                        </div>
                        <ArrowRight size={18} className="action-arrow-icon" />
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <h3 className="action-card-title" style={{ fontSize: '1.1rem' }}>{cat.title}</h3>
                        <p className="action-card-desc">{cat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* RECENT THERAPY PROGRESS (HONEST EMPTY STATE) */}
              <section className="recent-activity-card">
                <div className="recent-activity-header">
                  <Info size={18} color="var(--color-blue-primary)" />
                  <h3>Therapy Progress</h3>
                </div>

                <div className="recent-activity-empty-state">
                  <p className="empty-state-title">No therapy history available.</p>
                  <p className="empty-state-desc">
                    Your therapy progress will appear here after completing therapy sessions.
                  </p>
                </div>
              </section>
            </main>
          </>
        )}

        {/* STEP 2: EXERCISE PAGE */}
        {currentStep === 'exercise' && selectedCategory && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Therapy Home"
                onClick={handleReturnToTherapy}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                {selectedCategory.title}
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center' }}>
              <div className="profile-section-card" style={{ width: '100%', gap: '1rem', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(2, 132, 199, 0.12)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  {React.createElement(selectedCategory.icon, { size: 32 })}
                </div>

                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                    {selectedCategory.title}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-brand-tagline)', marginTop: '0.25rem' }}>
                    {selectedCategory.desc}
                  </p>
                </div>

                {/* Instructions Box */}
                <div style={{ padding: '1.15rem', borderRadius: '14px', background: 'rgba(2, 132, 199, 0.05)', border: '1.5px solid var(--border-color)', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-blue-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>
                    Instructions
                  </h4>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-brand-title)', lineHeight: 1.45 }}>
                    {selectedCategory.instructions}
                  </p>
                </div>

                {isSessionActive && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid var(--color-green-primary)', color: 'var(--color-green-primary)', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={18} />
                    <span>Session in Progress...</span>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', width: '100%' }}>
                  {!isSessionActive ? (
                    <button
                      type="button"
                      className="btn-continue"
                      onClick={handleStartExercise}
                      style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Play size={18} />
                      <span>Start Exercise</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="btn-continue"
                    onClick={handleFinishExercise}
                    style={{ width: '100%', background: isSessionActive ? 'var(--color-green-primary)' : undefined, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Check size={18} />
                    <span>Finish Exercise</span>
                  </button>
                </div>
              </div>
            </main>
          </>
        )}

        {/* STEP 3: SESSION COMPLETE */}
        {currentStep === 'complete' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Return to Therapy"
                onClick={handleReturnToTherapy}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Session Complete
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <div className="profile-section-card" style={{ textAlign: 'center', width: '100%', padding: '2rem 1.25rem', gap: '1rem' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)', border: '2px solid var(--color-green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <CheckCircle2 size={42} color="var(--color-green-primary)" />
                </div>

                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                    Session Completed 🎉
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    Thank you for completing today's exercise.
                  </p>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.05)', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--color-brand-tagline)', fontWeight: 500 }}>
                    Your progress will be available after backend integration.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', width: '100%' }}>
                  <button
                    type="button"
                    className="btn-continue"
                    onClick={handleReturnToTherapy}
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <RefreshCw size={18} />
                    <span>Return to Therapy</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-auth"
                    onClick={onBackToDashboard}
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Home size={18} />
                    <span>Return to Dashboard</span>
                  </button>
                </div>
              </div>
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

export default TherapyExercisesModule;
