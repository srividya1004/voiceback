import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Brain,
  Droplet,
  Utensils,
  Sparkles,
  Info,
  AlertTriangle,
  Heart,
  ArrowRight,
  CheckCircle2,
  Lock,
  Home,
  RefreshCw,
  User,
  Settings,
  LogOut,
  Play,
  RotateCcw,
  Gamepad2,
  Trophy,
  Mic,
  Zap,
  HelpCircle,
  UserCheck,
  Type,
  MessageSquare,
  Coffee,
  Book,
  Smartphone,
  Bus,
  Smile,
  Sun,
  Star
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import SpeechInputTrigger from './SpeechInputTrigger';
import { useSettings } from '../context/SettingsContext';
import validationService from '../services/validationService';
import therapyService from '../services/therapyService';
import authService from '../services/authService';

export const TherapyGamesModule = ({
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak, language } = useSettings();
  const [currentStep, setCurrentStep] = useState('menu'); // 'menu' | 'play_game' | 'complete'
  const [activeGameId, setActiveGameId] = useState('game1'); // 'game1', 'game2', 'game3', 'game4'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastSpokenRef = useRef(null);

  // Patient Session Data
  const [session] = useState(() => authService.getActiveSession() || {});
  const patientId = session.user?.id || session.patientId || '6a71fce81cb089a32ce1159d';

  // --- 4 DISTINCT GAMES LIST ---
  const gamesList = [
    { id: 'game1', title: 'Game 1: Picture Match', desc: 'Visual card pair matching.', icon: Brain, color: '#0284C7' },
    { id: 'game2', title: 'Game 2: Speak & Pop (15+ Target Pool)', desc: 'Say words to pop floating target bubbles!', icon: Zap, color: '#9333EA' },
    { id: 'game3', title: 'Game 3: Sentence Challenge', desc: 'Construct & speak complete functional sentences.', icon: Type, color: '#16A34A' },
    { id: 'game4', title: 'Game 4: Scenario Response', desc: 'Analyze visual scenarios and speak valid responses.', icon: MessageSquare, color: '#EAB308' },
  ];

  // Game 1 State (Picture Match)
  const allMatchDefs = [
    { id: 'apple', label: 'APPLE', icon: Sun, color: '#DC2626' },
    { id: 'book', label: 'BOOK', icon: Book, color: '#9333EA' },
    { id: 'cup', label: 'CUP', icon: Coffee, color: '#EAB308' },
    { id: 'phone', label: 'PHONE', icon: Smartphone, color: '#0284C7' },
    { id: 'bus', label: 'BUS', icon: Bus, color: '#16A34A' },
    { id: 'flower', label: 'FLOWER', icon: Heart, color: '#DB2777' },
  ];
  const [g1Cards, setG1Cards] = useState([]);
  const [g1Flipped, setG1Flipped] = useState([]);
  const [g1Matched, setG1Matched] = useState([]);
  const [g1Moves, setG1Moves] = useState(0);

  // Game 2 State (Speak & Pop — 15+ Target Pool)
  const g2TargetPool = [
    { label: 'APPLE', icon: Sun, color: '#DC2626' },
    { label: 'BALL', icon: Brain, color: '#0284C7' },
    { label: 'BOOK', icon: Book, color: '#9333EA' },
    { label: 'CUP', icon: Coffee, color: '#EAB308' },
    { label: 'PHONE', icon: Smartphone, color: '#0284C7' },
    { label: 'MILK', icon: Coffee, color: '#16A34A' },
    { label: 'TEA', icon: Coffee, color: '#DB2777' },
    { label: 'WATER', icon: Droplet, color: '#0284C7' },
    { label: 'FOOD', icon: Utensils, color: '#EAB308' },
    { label: 'HELP', icon: AlertTriangle, color: '#DC2626' },
    { label: 'MEDICINE', icon: Sparkles, color: '#9333EA' },
    { label: 'TOILET', icon: Info, color: '#16A34A' },
    { label: 'FAMILY', icon: Heart, color: '#DB2777' },
    { label: 'DOCTOR', icon: UserCheck, color: '#059669' },
    { label: 'HOME', icon: Home, color: '#6366F1' },
  ];
  const [g2TargetIndex, setG2TargetIndex] = useState(0);
  const [g2Popped, setG2Popped] = useState(false);
  const [g2Feedback, setG2Feedback] = useState(null);

  // Game 3 State (Sentence Challenge — Requires Spoken Sentence)
  const [g3SelectedTokens, setG3SelectedTokens] = useState([]);
  const g3TargetSentence = 'I NEED WATER';
  const [g3ReadyToSpeak, setG3ReadyToSpeak] = useState(false);

  // Game 4 State (Scenario Response)
  const [g4SelectedChoice, setG4SelectedChoice] = useState(null);

  // Active Session Summary
  const [lastCompletedSummary, setLastCompletedSummary] = useState(null);

  // Profile metadata
  const profileName = session.user?.name || session.email?.split('@')[0] || 'Patient';
  const firstLetter = profileName.charAt(0).toUpperCase();

  // Voice Assistant Guidance
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (currentStep === 'menu' && lastSpokenRef.current !== 'menu') {
      lastSpokenRef.current = 'menu';
      speak(`${t('playAndPractice')}. Select a game to play.`);
    }
  }, [currentStep, voiceAssistant, speak, t]);

  // Launch Game 1
  const handleStartGame1 = () => {
    setActiveGameId('game1');
    const deck = [...allMatchDefs, ...allMatchDefs]
      .map((item, idx) => ({ ...item, instanceId: `${item.id}-${idx}` }))
      .sort(() => Math.random() - 0.5);

    setG1Cards(deck);
    setG1Flipped([]);
    setG1Matched([]);
    setG1Moves(0);
    setCurrentStep('play_game');
  };

  const handleG1CardClick = (idx) => {
    if (g1Flipped.length === 2 || g1Flipped.includes(idx) || g1Matched.includes(g1Cards[idx].id)) return;
    const nextFlipped = [...g1Flipped, idx];
    setG1Flipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setG1Moves((prev) => prev + 1);
      const card1 = g1Cards[nextFlipped[0]];
      const card2 = g1Cards[nextFlipped[1]];

      if (card1.id === card2.id) {
        setG1Matched((prev) => [...prev, card1.id]);
        setG1Flipped([]);
        if (speak) speak(t('greatJob'));

        if (g1Matched.length + 1 === allMatchDefs.length) {
          setTimeout(() => saveGameProgress('Picture Match', 6, 100), 600);
        }
      } else {
        setTimeout(() => setG1Flipped([]), 1100);
      }
    }
  };

  // Launch Game 2 (Speak & Pop — Enforced Validation)
  const handleStartGame2 = () => {
    setActiveGameId('game2');
    setG2TargetIndex(0);
    setG2Popped(false);
    setG2Feedback(null);
    setCurrentStep('play_game');
  };

  const handleG2TranscriptReceived = (rawTranscript) => {
    const currentTargetObj = g2TargetPool[g2TargetIndex % g2TargetPool.length];
    
    // ENFORCED VALIDATION SERVICE
    const res = validationService.validateAnswer(rawTranscript, {
      target: currentTargetObj.label,
      mode: 'exact',
    });

    if (res.isCorrect) {
      setG2Popped(true);
      setG2Feedback({ success: true, text: `💥 POP! 🎉 (${res.recognized})` });
      if (speak) speak(t('greatJob'));

      setTimeout(() => {
        if (g2TargetIndex + 1 < 5) {
          setG2TargetIndex((prev) => prev + 1);
          setG2Popped(false);
          setG2Feedback(null);
        } else {
          saveGameProgress('Speak & Pop', 5, 100);
        }
      }, 1200);
    } else {
      // Wrong answer -> target remains + retry (DO NOT POP)
      setG2Popped(false);
      setG2Feedback({ success: false, text: `❌ ${res.reason}` });
      if (speak) speak(t('didNotUnderstand'));
    }
  };

  // Launch Game 3 (Sentence Challenge — Requires Spoken Sentence)
  const handleStartGame3 = () => {
    setActiveGameId('game3');
    setG3SelectedTokens([]);
    setG3ReadyToSpeak(false);
    setCurrentStep('play_game');
  };

  const handleG3AddToken = (token) => {
    const nextTokens = [...g3SelectedTokens, token];
    setG3SelectedTokens(nextTokens);

    if (nextTokens.join(' ') === g3TargetSentence) {
      setG3ReadyToSpeak(true);
    }
  };

  const handleG3SentenceSpoken = (rawTranscript) => {
    const res = validationService.validateAnswer(rawTranscript, {
      target: g3TargetSentence,
      keywords: ['i', 'need', 'water'],
      mode: 'sentence',
    });

    if (res.isCorrect) {
      if (speak) speak(t('greatJob'));
      setTimeout(() => saveGameProgress('Sentence Challenge', 1, 100), 1200);
    } else {
      if (speak) speak(t('didNotUnderstand'));
    }
  };

  // Launch Game 4 (Scenario Response — Enforced Validation)
  const handleStartGame4 = () => {
    setActiveGameId('game4');
    setG4SelectedChoice(null);
    setCurrentStep('play_game');
  };

  const handleG4SelectChoice = (choice) => {
    setG4SelectedChoice(choice);
  };

  const handleG4ScenarioSpoken = (rawTranscript) => {
    const res = validationService.validateAnswer(rawTranscript, {
      category: 'tired',
      target: 'I AM TIRED',
      mode: 'scenario',
    });

    if (res.isCorrect) {
      if (speak) speak(t('greatJob'));
      setTimeout(() => saveGameProgress('Scenario Response', 1, 100), 1200);
    } else {
      if (speak) speak(t('didNotUnderstand'));
    }
  };

  const saveGameProgress = async (gameTitle, count, accuracy) => {
    const sessionData = {
      patientId: patientId,
      exercisesCompleted: count,
      accuracyScore: Math.min(100, Math.max(0, accuracy)),
      notes: `Game: ${gameTitle} (${language.toUpperCase()})`,
    };

    try {
      await therapyService.createTherapySession(sessionData);
      console.log(`✅ Saved Validated Game (${gameTitle}) Progress:`, sessionData);
    } catch (err) {
      console.warn('Backend game save notice:', err.message);
    }

    setLastCompletedSummary({ gameTitle, count, accuracy });
    setCurrentStep('complete');
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container games-container">

        {/* LEFT SLIDE NAVIGATION DRAWER */}
        <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
        <aside className={`drawer-panel ${isDrawerOpen ? 'open' : ''}`} aria-label="Navigation Drawer">
          <div className="drawer-header">
            <VoiceBackLogo variant="header" />
            <button type="button" className="btn-close-sheet" onClick={() => setIsDrawerOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="drawer-user-badge" onClick={onOpenProfile}>
            <div className="drawer-avatar-circle">
              <span>{firstLetter}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 className="drawer-user-name">{profileName}</h4>
              <span className="drawer-user-role">Patient</span>
            </div>
          </div>

          <nav className="drawer-menu-list">
            <button type="button" className="drawer-menu-item" onClick={onBackToDashboard}>
              <Home size={19} />
              <span>{t('dashboard')}</span>
            </button>
            <button type="button" className="drawer-menu-item active" onClick={() => setCurrentStep('menu')}>
              <Gamepad2 size={19} />
              <span>{t('playAndPractice')}</span>
            </button>
            <button type="button" className="drawer-menu-item" onClick={onOpenProfile}>
              <User size={19} />
              <span>{t('profile')}</span>
            </button>
          </nav>

          <div className="drawer-footer">
            <button type="button" className="drawer-logout-btn" onClick={onLogout}>
              <LogOut size={18} />
              <span>{t('logOut')}</span>
            </button>
          </div>
        </aside>

        {/* STEP 1: GAME HUB MENU */}
        {currentStep === 'menu' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button type="button" className="settings-btn" onClick={onBackToDashboard}>
                  <ArrowLeft size={22} />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  {t('playAndPractice')}
                </h1>
              </div>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
              <section className="welcome-compact-section">
                <p className="welcome-subtitle" style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
                  4 Validated Interactive Games for Speech & Memory
                </p>
              </section>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                {gamesList.map((g) => {
                  const GIcon = g.icon;
                  return (
                    <div
                      key={g.id}
                      className="action-card"
                      onClick={() => {
                        if (g.id === 'game1') handleStartGame1();
                        if (g.id === 'game2') handleStartGame2();
                        if (g.id === 'game3') handleStartGame3();
                        if (g.id === 'game4') handleStartGame4();
                      }}
                      style={{ padding: '1.2rem', cursor: 'pointer' }}
                    >
                      <div className="action-card-header">
                        <div className="action-icon-box" style={{ background: `${g.color}1E`, color: g.color }}>
                          <GIcon size={24} />
                        </div>
                        <ArrowRight size={20} className="action-arrow-icon" />
                      </div>
                      <div style={{ marginTop: '0.65rem' }}>
                        <h3 className="action-card-title" style={{ fontSize: '1.15rem' }}>{g.title}</h3>
                        <p className="action-card-desc">{g.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          </>
        )}

        {/* STEP 2: GAME RUNNER */}
        {currentStep === 'play_game' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="settings-btn" onClick={() => setCurrentStep('menu')}>
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                {gamesList.find((g) => g.id === activeGameId)?.title}
              </h1>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%', alignItems: 'center' }}>
              
              {/* GAME 1: PICTURE MATCH */}
              {activeGameId === 'game1' && (
                <div className="profile-section-card" style={{ width: '100%', padding: '1.2rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-blue-primary)', display: 'block', marginBottom: '0.75rem' }}>
                    {g1Matched.length} / {allMatchDefs.length} Pairs Found
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', width: '100%' }}>
                    {g1Cards.map((card, idx) => {
                      const isFlipped = g1Flipped.includes(idx) || g1Matched.includes(card.id);
                      const CardIcon = card.icon;
                      return (
                        <button
                          key={card.instanceId}
                          type="button"
                          onClick={() => handleG1CardClick(idx)}
                          style={{
                            aspectRatio: '1',
                            borderRadius: 16,
                            border: isFlipped ? `2px solid ${card.color}` : '2px dashed var(--border-color)',
                            background: isFlipped ? 'rgba(2, 132, 199, 0.08)' : 'var(--color-bg-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            cursor: 'pointer',
                            padding: '0.4rem',
                          }}
                        >
                          {isFlipped ? (
                            <>
                              <div style={{ width: 36, height: 36, borderRadius: 12, background: card.color, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CardIcon size={20} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                                {card.label}
                              </span>
                            </>
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Brain size={20} color="var(--color-brand-tagline)" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* GAME 2: SPEAK & POP (15+ TARGET POOL + ENFORCED VALIDATION) */}
              {activeGameId === 'game2' && (
                <div className="profile-section-card" style={{ width: '100%', padding: '1.5rem', textAlign: 'center', gap: '1.2rem' }}>
                  {(() => {
                    const currentObj = g2TargetPool[g2TargetIndex % g2TargetPool.length];
                    const TargetIcon = currentObj.icon;
                    return (
                      <>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9333EA' }}>
                          Target {g2TargetIndex + 1} of 5
                        </span>

                        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div
                            style={{
                              width: g2Popped ? 0 : 130,
                              height: g2Popped ? 0 : 130,
                              borderRadius: '50%',
                              background: `radial-gradient(circle at 30% 30%, ${currentObj.color}, #000)`,
                              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFF',
                              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            }}
                          >
                            <TargetIcon size={42} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 900, marginTop: '0.2rem' }}>{currentObj.label}</span>
                          </div>
                          {g2Popped && (
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#16A34A', animation: 'bounce 0.5s' }}>
                              💥 POP! 🎉
                            </div>
                          )}
                        </div>

                        <SpeechInputTrigger
                          onTranscriptReceived={handleG2TranscriptReceived}
                          targetIntent={currentObj.label}
                          buttonLabel={`🎙️ Speak "${currentObj.label}" to Pop!`}
                        />

                        {g2Feedback && (
                          <div style={{ padding: '0.85rem', borderRadius: 14, background: g2Feedback.success ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)', color: g2Feedback.success ? '#16A34A' : '#DC2626', fontWeight: 800 }}>
                            {g2Feedback.text}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* GAME 3: SENTENCE CHALLENGE (REQUIRES SPOKEN SENTENCE) */}
              {activeGameId === 'game3' && (
                <div className="profile-section-card" style={{ width: '100%', padding: '1.5rem', textAlign: 'center', gap: '1.2rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16A34A' }}>
                    Construct & speak sentence: "I NEED WATER"
                  </span>

                  {/* DISPLAY SLOTS */}
                  <div style={{ padding: '1.2rem', borderRadius: 16, background: 'rgba(22, 163, 74, 0.08)', border: '2px dashed #16A34A', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                    {g3SelectedTokens.length > 0 ? (
                      g3SelectedTokens.map((tok, i) => (
                        <span key={i} style={{ padding: '0.5rem 0.85rem', borderRadius: 10, background: '#16A34A', color: '#FFF', fontWeight: 800, fontSize: '1.1rem' }}>
                          {tok}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--color-brand-tagline)', fontWeight: 600 }}>Tap cards in order: NEED, I, WATER</span>
                    )}
                  </div>

                  {/* TOKEN CHOICES */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', width: '100%' }}>
                    {['NEED', 'I', 'WATER'].map((tok) => (
                      <button
                        key={tok}
                        type="button"
                        onClick={() => handleG3AddToken(tok)}
                        style={{ padding: '0.85rem 1.25rem', borderRadius: 14, border: '2px solid var(--border-color)', background: 'var(--color-bg-card)', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' }}
                      >
                        {tok}
                      </button>
                    ))}
                  </div>

                  {g3ReadyToSpeak && (
                    <div style={{ marginTop: '0.5rem', width: '100%' }}>
                      <SpeechInputTrigger
                        onTranscriptReceived={handleG3SentenceSpoken}
                        targetIntent="I NEED WATER"
                        buttonLabel={`🎙️ Speak Completed Sentence: "I NEED WATER"`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* GAME 4: SCENARIO RESPONSE (ENFORCED VALIDATION) */}
              {activeGameId === 'game4' && (
                <div className="profile-section-card" style={{ width: '100%', padding: '1.5rem', textAlign: 'center', gap: '1.2rem' }}>
                  <div style={{ padding: '1rem', borderRadius: 16, background: 'rgba(234, 179, 8, 0.1)', border: '1.5px solid #EAB308' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#EAB308', textTransform: 'uppercase' }}>Scenario</span>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: '0.2rem 0 0 0' }}>
                      "You are tired."
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                    {[
                      { id: 'tired', label: 'I AM TIRED', isCorrect: true },
                      { id: 'water', label: 'I NEED WATER', isCorrect: false }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleG4SelectChoice(opt)}
                        style={{
                          padding: '1.1rem',
                          borderRadius: 16,
                          border: g4SelectedChoice?.id === opt.id ? `3px solid ${opt.isCorrect ? '#16A34A' : '#DC2626'}` : '2px solid var(--border-color)',
                          background: g4SelectedChoice?.id === opt.id ? (opt.isCorrect ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)') : 'var(--color-bg-card)',
                          fontWeight: 800,
                          fontSize: '1.1rem',
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {g4SelectedChoice && (
                    <SpeechInputTrigger
                      onTranscriptReceived={handleG4ScenarioSpoken}
                      targetIntent={g4SelectedChoice.label}
                      buttonLabel={`🎙️ Speak Response: "${g4SelectedChoice.label}"`}
                    />
                  )}
                </div>
              )}

            </main>
          </>
        )}

        {/* STEP 3: GAME COMPLETE */}
        {currentStep === 'complete' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="settings-btn" onClick={() => setCurrentStep('menu')}>
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                {t('congratulations')}
              </h1>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <div className="profile-section-card" style={{ textAlign: 'center', width: '100%', padding: '2rem 1.25rem', gap: '1rem' }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(147, 51, 234, 0.12)', border: '3px solid #9333EA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <Trophy size={44} color="#9333EA" />
                </div>

                <div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brand-title)' }}>
                    {t('congratulations')}
                  </h2>
                  <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#9333EA', marginTop: '0.3rem' }}>
                    {lastCompletedSummary?.gameTitle}
                  </p>
                </div>

                {lastCompletedSummary && (
                  <div style={{ padding: '1rem', borderRadius: 16, background: 'rgba(147, 51, 234, 0.06)', border: '1.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-around' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>{t('exercisesCompletedText')}</span>
                      <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: '0.2rem 0 0 0' }}>{lastCompletedSummary.count}</h4>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-color)' }} />
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>{t('accuracyScoreText')}</span>
                      <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#9333EA', margin: '0.2rem 0 0 0' }}>{lastCompletedSummary.accuracy}%</h4>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', width: '100%' }}>
                  <button type="button" className="btn-continue" onClick={() => setCurrentStep('menu')} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#9333EA' }}>
                    <RotateCcw size={18} />
                    <span>{t('returnToGames')}</span>
                  </button>

                  <button type="button" className="btn-secondary-auth" onClick={onBackToDashboard} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Home size={18} />
                    <span>{t('returnToDashboard')}</span>
                  </button>
                </div>
              </div>
            </main>
          </>
        )}

      </div>

      <SettingsBottomSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default TherapyGamesModule;
