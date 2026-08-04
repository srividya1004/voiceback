import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowLeft,
  Image,
  Type,
  Brain,
  Smile,
  FileText,
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
  Check,
  Gamepad2,
  Activity
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';

export const TherapyGamesModule = ({
  initialCategories,
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();
  const [currentStep, setCurrentStep] = useState('home'); // 'home' | 'details' | 'play' | 'complete'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastSpokenRef = useRef(null);

  // Sync profile data & avatar from localStorage
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

  // Default Clinical Rehabilitation Categories (Ready for GET /api/therapy-games API response)
  const defaultCategories = [
    {
      id: 'picture-id',
      title: 'Picture Identification',
      desc: 'Recognize and identify common objects.',
      instructions: 'Identify the correct picture matching the spoken or written object prompt.',
      icon: Image,
    },
    {
      id: 'word-completion',
      title: 'Word Completion',
      desc: 'Complete missing letters to form words.',
      instructions: 'Select the missing letters to complete everyday vocabulary words.',
      icon: Type,
    },
    {
      id: 'memory-match',
      title: 'Memory Match',
      desc: 'Improve memory using matching activities.',
      instructions: 'Match pairs of related symbols, words, and object cards.',
      icon: Brain,
    },
    {
      id: 'emotion-rec',
      title: 'Emotion Recognition',
      desc: 'Identify facial expressions and emotions.',
      instructions: 'Recognize and identify common human facial expressions and emotions.',
      icon: Smile,
    },
    {
      id: 'sentence-builder',
      title: 'Sentence Builder',
      desc: 'Arrange words into meaningful sentences.',
      instructions: 'Arrange shuffled word cards to construct clear, meaningful sentences.',
      icon: FileText,
    },
    {
      id: 'daily-comm',
      title: 'Daily Communication',
      desc: 'Practice common real-life conversations.',
      instructions: 'Practice interactive dialogues for common daily situations.',
      icon: MessageCircle,
    },
  ];

  // Dynamic state ready for backend REST API payload
  const [categories] = useState(initialCategories || defaultCategories);

  // Voice Assistant: Speak once per screen / step
  useEffect(() => {
    if (!voiceAssistant || !speak) return;

    if (currentStep === 'home' && lastSpokenRef.current !== 'home') {
      lastSpokenRef.current = 'home';
      speak('Welcome to Therapy Games. Select a rehabilitation activity.');
    } else if (currentStep === 'details' && selectedCategory && lastSpokenRef.current !== `details-${selectedCategory.id}`) {
      lastSpokenRef.current = `details-${selectedCategory.id}`;
      speak(`${selectedCategory.title}. ${selectedCategory.instructions}`);
    } else if (currentStep === 'play' && selectedCategory && lastSpokenRef.current !== `play-${selectedCategory.id}`) {
      lastSpokenRef.current = `play-${selectedCategory.id}`;
      speak('Rehabilitation exercise session active.');
    } else if (currentStep === 'complete' && lastSpokenRef.current !== 'complete') {
      lastSpokenRef.current = 'complete';
      speak('Exercise completed.');
    }
  }, [currentStep, selectedCategory, voiceAssistant, speak]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setCurrentStep('details');
  };

  const handleStartExercise = () => {
    setCurrentStep('play');
  };

  const handleFinishExercise = () => {
    setCurrentStep('complete');
  };

  const handleReturnToGames = () => {
    setSelectedCategory(null);
    setCurrentStep('home');
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
      id: 'therapy-games-home',
      label: 'Therapy Games',
      icon: Gamepad2,
      action: () => handleReturnToGames(),
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
      <div className="mobile-container games-container">
        
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

        {/* STEP 1: THERAPY GAMES HOME */}
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
                  Therapy Games
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
                  Practice communication skills through interactive rehabilitation activities.
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

              {/* HONEST EMPTY STATE */}
              <section className="recent-activity-card">
                <div className="recent-activity-header">
                  <Info size={18} color="var(--color-blue-primary)" />
                  <h3>Activity Progress</h3>
                </div>

                <div className="recent-activity-empty-state">
                  <p className="empty-state-title">No activity history available.</p>
                  <p className="empty-state-desc">
                    Your activity progress will appear here after completing rehabilitation sessions.
                  </p>
                </div>
              </section>
            </main>
          </>
        )}

        {/* STEP 2: GAME DETAILS */}
        {currentStep === 'details' && selectedCategory && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Therapy Games Home"
                onClick={handleReturnToGames}
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

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', width: '100%' }}>
                  <button
                    type="button"
                    className="btn-secondary-auth"
                    onClick={handleReturnToGames}
                    style={{ flex: 1 }}
                  >
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    className="btn-continue"
                    onClick={handleStartExercise}
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Play size={18} />
                    <span>Start Exercise</span>
                  </button>
                </div>
              </div>
            </main>
          </>
        )}

        {/* STEP 3: PLAY SCREEN */}
        {currentStep === 'play' && selectedCategory && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Back to Game Details"
                onClick={() => setCurrentStep('details')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                {selectedCategory.title}
              </h1>
              <div style={{ width: 42 }} />
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <div className="profile-section-card" style={{ textAlign: 'center', width: '100%', padding: '2rem 1.25rem', gap: '1.2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(2, 132, 199, 0.12)', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <Activity size={32} />
                </div>

                <div>
                  <span className="placeholder-badge" style={{ background: 'rgba(2, 132, 199, 0.12)', color: 'var(--color-blue-primary)' }}>
                    Exercise Placeholder
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-brand-title)', marginTop: '0.4rem' }}>
                    {selectedCategory.title}
                  </h2>
                  <p style={{ fontSize: '0.925rem', color: 'var(--color-brand-tagline)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                    This rehabilitation activity will become interactive after backend and AI integration.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-continue"
                    onClick={handleFinishExercise}
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Check size={18} />
                    <span>Finish Exercise</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-auth"
                    onClick={handleReturnToGames}
                    style={{ width: '100%' }}
                  >
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </main>
          </>
        )}

        {/* STEP 4: EXERCISE COMPLETE */}
        {currentStep === 'complete' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="settings-btn"
                aria-label="Return to Games"
                onClick={handleReturnToGames}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                Exercise Complete
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
                    Exercise Completed 🎉
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    Thank you for completing today's rehabilitation activity.
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
                    onClick={handleReturnToGames}
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <RefreshCw size={18} />
                    <span>Return to Games</span>
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

export default TherapyGamesModule;
