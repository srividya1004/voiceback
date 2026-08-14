import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Brain,
  MessageSquare,
  Volume2,
  Droplet,
  Utensils,
  Sparkles,
  Info,
  AlertTriangle,
  Heart,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Home,
  RefreshCw,
  User,
  Settings,
  LogOut,
  Play,
  Trophy,
  Mic,
  HelpCircle,
  Lightbulb,
  Phone,
  Coffee,
  Smile,
  Book,
  Smartphone,
  Bus,
  Sun,
  Star,
  Thermometer,
  CloudSnow,
  Apple
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import SpeechInputTrigger from './SpeechInputTrigger';
import { useSettings } from '../context/SettingsContext';
import validationService from '../services/validationService';
import therapyService from '../services/therapyService';
import authService from '../services/authService';

export const TherapyExercisesModule = ({
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak, language } = useSettings();
  const [currentStep, setCurrentStep] = useState('levels'); // 'levels' | 'activity' | 'complete'
  const [activeLevelNum, setActiveLevelNum] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const lastSpokenRef = useRef(null);

  // Patient Session Data
  const [session] = useState(() => authService.getActiveSession() || {});
  const patientId = session.user?.id || session.patientId || '6a71fce81cb089a32ce1159d';

  // --- PERSISTENT UNLOCKED LEVELS (1 to 6) ---
  const [unlockedLevels, setUnlockedLevels] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voiceback_therapy_unlocked_levels') || '[1]');
      return Array.isArray(stored) && stored.length > 0 ? stored : [1];
    } catch (e) {
      return [1];
    }
  });

  const unlockLevel = (lvlNum) => {
    setUnlockedLevels((prev) => {
      if (!prev.includes(lvlNum)) {
        const next = [...prev, lvlNum].sort((a, b) => a - b);
        try { localStorage.setItem('voiceback_therapy_unlocked_levels', JSON.stringify(next)); } catch (e) {}
        return next;
      }
      return prev;
    });
  };

  // --- 12 DIVERSE REAL VISUAL SCENARIOS ("LOOK & RESPOND") & SPEAK & BUILD POOLS ---
  const levelDefinitions = [
    {
      level: 1,
      typeTitle: 'Speak & Build — Level 1: Single Words',
      keyTitle: 'level1Name',
      keyDesc: 'level1Desc',
      validationMode: 'exact',
      items: [
        { id: 'apple', label: 'APPLE', target: 'APPLE', hint: 'Say "APPLE"', icon: Apple, color: '#DC2626' },
        { id: 'book', label: 'BOOK', target: 'BOOK', hint: 'Say "BOOK"', icon: Book, color: '#9333EA' },
        { id: 'cup', label: 'CUP', target: 'CUP', hint: 'Say "CUP"', icon: Coffee, color: '#EAB308' },
        { id: 'chair', label: 'CHAIR', target: 'CHAIR', hint: 'Say "CHAIR"', icon: Home, color: '#16A34A' },
        { id: 'phone', label: 'PHONE', target: 'PHONE', hint: 'Say "PHONE"', icon: Smartphone, color: '#0284C7' },
      ]
    },
    {
      level: 2,
      typeTitle: 'Speak & Build — Level 2: Two-Word Phrases',
      keyTitle: 'level2Name',
      keyDesc: 'level2Desc',
      validationMode: 'phrase',
      items: [
        { id: 'need_water', label: 'NEED WATER', target: 'NEED WATER', keywords: ['need water', 'want water', 'water'], hint: 'Say "NEED WATER"', icon: Droplet, color: '#0284C7' },
        { id: 'want_food', label: 'WANT FOOD', target: 'WANT FOOD', keywords: ['want food', 'need food', 'food'], hint: 'Say "WANT FOOD"', icon: Utensils, color: '#EAB308' },
        { id: 'call_mom', label: 'CALL MOM', target: 'CALL MOM', keywords: ['call mom', 'call family', 'mom'], hint: 'Say "CALL MOM"', icon: Phone, color: '#DB2777' },
        { id: 'need_medicine', label: 'NEED MEDICINE', target: 'NEED MEDICINE', keywords: ['need medicine', 'medicine'], hint: 'Say "NEED MEDICINE"', icon: Sparkles, color: '#9333EA' },
      ]
    },
    {
      level: 3,
      typeTitle: 'Speak & Build — Level 3: Simple Sentences',
      keyTitle: 'level3Name',
      keyDesc: 'level3Desc',
      validationMode: 'sentence',
      items: [
        { id: 's_need_water', label: 'I NEED WATER', target: 'I NEED WATER', keywords: ['i', 'need', 'water'], hint: 'Say "I NEED WATER"', icon: Droplet, color: '#0284C7' },
        { id: 's_want_food', label: 'I WANT FOOD', target: 'I WANT FOOD', keywords: ['i', 'want', 'food'], hint: 'Say "I WANT FOOD"', icon: Utensils, color: '#EAB308' },
        { id: 's_need_medicine', label: 'I NEED MEDICINE', target: 'I NEED MEDICINE', keywords: ['i', 'need', 'medicine'], hint: 'Say "I NEED MEDICINE"', icon: Sparkles, color: '#9333EA' },
        { id: 's_call_mom', label: 'PLEASE CALL MOM', target: 'PLEASE CALL MOM', keywords: ['please', 'call', 'mom'], hint: 'Say "PLEASE CALL MOM"', icon: Phone, color: '#DB2777' },
      ]
    },
    {
      level: 4,
      typeTitle: 'Speak & Build — Level 4: Visual Sentences',
      keyTitle: 'level4Name',
      keyDesc: 'level4Desc',
      validationMode: 'sentence',
      items: [
        { id: 'v_water', label: 'I NEED WATER', target: 'I NEED WATER', keywords: ['i', 'need', 'water'], hint: 'Look at empty glass. Say "I NEED WATER"', icon: Droplet, color: '#0284C7' },
        { id: 'v_food', label: 'I WANT FOOD', target: 'I WANT FOOD', keywords: ['i', 'want', 'food'], hint: 'Look at empty plate. Say "I WANT FOOD"', icon: Utensils, color: '#EAB308' },
        { id: 'v_tired', label: 'I AM TIRED', target: 'I AM TIRED', keywords: ['i', 'am', 'tired'], hint: 'Say "I AM TIRED"', icon: HelpCircle, color: '#6366F1' },
      ]
    },
    {
      level: 5,
      typeTitle: 'LOOK & RESPOND — 12 Visual Scenarios',
      keyTitle: 'level5Name',
      keyDesc: 'level5Desc',
      validationMode: 'scenario',
      items: [
        { id: 'scen_1', promptKey: 'scen1EmptyGlass', category: 'water', target: 'WATER', hint: 'The glass is empty. They need water.', icon: Droplet, color: '#0284C7' },
        { id: 'scen_2', promptKey: 'scen2EmptyPlate', category: 'food', target: 'FOOD', hint: 'The plate is empty. They need food.', icon: Utensils, color: '#EAB308' },
        { id: 'scen_3', promptKey: 'scen3Discomfort', category: 'pain', target: 'PAIN', hint: 'Holding head in pain. They are in pain.', icon: AlertTriangle, color: '#DC2626' },
        { id: 'scen_4', promptKey: 'scen4MedicineBottle', category: 'medicine', target: 'MEDICINE', hint: 'Holding medicine bottle. They need medicine.', icon: Sparkles, color: '#9333EA' },
        { id: 'scen_5', promptKey: 'scen5CaregiverLeaving', category: 'caregiver', target: 'PLEASE CALL MY CAREGIVER', hint: 'Say "Please call my caregiver."', icon: Heart, color: '#DB2777' },
        { id: 'scen_6', promptKey: 'scen6ToiletSign', category: 'toilet', target: 'TOILET', hint: 'Restroom sign. They need toilet.', icon: Info, color: '#16A34A' },
        { id: 'scen_7', promptKey: 'scen7FeelingTiredInBed', category: 'tired', target: 'I AM TIRED', hint: 'In bed tired. Say "I am tired."', icon: HelpCircle, color: '#6366F1' },
        { id: 'scen_8', promptKey: 'scen8WaitingDoctor', category: 'doctor', target: 'PLEASE CALL DOCTOR', hint: 'Waiting for doctor. Say "Call doctor."', icon: UserCheck, color: '#059669' },
        { id: 'scen_9', promptKey: 'scen9HotDay', category: 'hot', target: 'COLD WATER', hint: 'Sweating in sun. Say "I need cold water."', icon: Thermometer, color: '#EAB308' },
        { id: 'scen_10', promptKey: 'scen10ColdDay', category: 'cold', target: 'I AM COLD', hint: 'Shivering in cold. Say "I am cold."', icon: CloudSnow, color: '#0284C7' },
        { id: 'scen_11', promptKey: 'scen11FamilyPhoto', category: 'family', target: 'I WANT MY FAMILY', hint: 'Looking at photo. Say "I want my family."', icon: Heart, color: '#DB2777' },
        { id: 'scen_12', promptKey: 'scen12FruitBowl', category: 'apple', target: 'I WANT AN APPLE', hint: 'Fruit bowl. Say "I want an apple."', icon: Apple, color: '#DC2626' },
      ]
    },
    {
      level: 6,
      typeTitle: 'Conversational Dialogues',
      keyTitle: 'level6Name',
      keyDesc: 'level6Desc',
      validationMode: 'scenario',
      items: [
        { id: 'c_doctor', promptKey: 'scen8DoctorConsult', category: 'doctor', target: 'I FEEL BETTER', hint: 'Respond to doctor: "I feel better."', icon: UserCheck, color: '#16A34A' },
      ]
    }
  ];

  // Active Runner State
  const [actIndex, setActIndex] = useState(0);
  const [actPhase, setActPhase] = useState('start'); // 'start' | 'your_turn' | 'feedback'
  const [attemptCount, setAttemptCount] = useState(1);
  const [totalPoints, setTotalPoints] = useState(0);
  const [actFeedback, setActFeedback] = useState(null);
  const [lastCompletedSummary, setLastCompletedSummary] = useState(null);

  // Profile metadata
  const profileName = session.user?.name || session.email?.split('@')[0] || 'Patient';
  const firstLetter = profileName.charAt(0).toUpperCase();

  // Voice Assistant Guidance
  useEffect(() => {
    if (!voiceAssistant || !speak) return;
    if (currentStep === 'levels' && lastSpokenRef.current !== 'levels') {
      lastSpokenRef.current = 'levels';
      speak(`${t('therapyExercises')}. Select a level to practice.`);
    }
  }, [currentStep, voiceAssistant, speak, t]);

  const handleSelectLevel = (lvlNum) => {
    if (!unlockedLevels.includes(lvlNum)) return;
    setActiveLevelNum(lvlNum);
    setActIndex(0);
    setAttemptCount(1);
    setTotalPoints(0);
    setActPhase('start');
    setActFeedback(null);
    setCurrentStep('activity');
  };

  const handleStartPractice = () => {
    setActPhase('your_turn');
    if (speak) speak(t('yourTurn'));
  };

  // CLEAN IN-PLACE RESET FOR NEXT ROUND / TRY AGAIN
  const handleResetForRetry = () => {
    setActPhase('your_turn');
    setActFeedback(null);
  };

  // ENFORCED REAL VALIDATION EVERYWHERE
  const handleTranscriptReceived = (rawTranscript) => {
    const activeLevelObj = levelDefinitions.find((l) => l.level === activeLevelNum);
    const item = activeLevelObj.items[actIndex % activeLevelObj.items.length];

    const res = validationService.validateAnswer(rawTranscript, {
      target: item.target || item.label,
      keywords: item.keywords,
      category: item.category,
      mode: activeLevelObj.validationMode,
    });

    if (res.isCorrect) {
      const earned = attemptCount === 1 ? 3 : attemptCount === 2 ? 2 : 1;
      setTotalPoints((prev) => prev + earned);

      setActFeedback({
        success: true,
        text: `✅ ${t('greatJob')} ("${res.recognized}")`,
        points: earned,
      });
      if (speak) speak(t('greatJob'));
      setActPhase('feedback');
    } else {
      if (attemptCount < 3) {
        const nextAttempt = attemptCount + 1;
        setAttemptCount(nextAttempt);
        setActFeedback({
          success: false,
          text: `❌ ${res.reason || t('didNotUnderstand')} (${t('attemptsUsed')} ${attemptCount}/3)`,
          hint: item.hint,
        });
        if (speak) speak(t('didNotUnderstand'));
      } else {
        setActFeedback({
          success: false,
          text: `❌ 0 Points. Expected: "${item.target}". ${t('movingToNext')}`,
          hint: item.hint,
        });
        if (speak) speak(t('movingToNext'));
        setActPhase('feedback');
      }
    }
  };

  // IN-PLACE CLEAN RESET FOR NEXT ITEM (No dashboard redirect!)
  const handleNextActivityItem = () => {
    const activeLevelObj = levelDefinitions.find((l) => l.level === activeLevelNum);
    const totalItems = activeLevelObj.items.length;
    const maxPossible = totalItems * 3;

    if (actIndex + 1 < totalItems) {
      setActIndex((prev) => prev + 1);
      setAttemptCount(1);
      setActPhase('start');
      setActFeedback(null);
    } else {
      const accuracyPct = Math.round((totalPoints / maxPossible) * 100);
      if (accuracyPct >= 60 && activeLevelNum < 6) unlockLevel(activeLevelNum + 1);
      saveLevelProgress(activeLevelNum, totalItems, accuracyPct, totalPoints);
    }
  };

  const saveLevelProgress = async (lvlNum, count, accuracy, pts) => {
    const activeLevelObj = levelDefinitions.find((l) => l.level === lvlNum);
    const sessionData = {
      patientId: patientId,
      exercisesCompleted: count,
      accuracyScore: Math.min(100, Math.max(0, accuracy)),
      notes: `${activeLevelObj?.typeTitle || `Therapy Level ${lvlNum}`} (${pts} pts)`,
    };

    try {
      await therapyService.createTherapySession(sessionData);
      console.log(`✅ Saved Validated Level ${lvlNum} Progress:`, sessionData);
    } catch (err) {
      console.warn('Backend therapy save notice:', err.message);
    }

    setLastCompletedSummary({ levelNum: lvlNum, title: activeLevelObj?.typeTitle, count, accuracy, pts, unlockedNext: accuracy >= 60 && lvlNum < 6 });
    setCurrentStep('complete');
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container therapy-container">

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
            <button type="button" className="drawer-menu-item active" onClick={() => setCurrentStep('levels')}>
              <Brain size={19} />
              <span>{t('therapyExercises')}</span>
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

        {/* STEP 1: LEVEL SELECTOR */}
        {currentStep === 'levels' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <button type="button" className="settings-btn" onClick={onBackToDashboard}>
                  <ArrowLeft size={22} />
                </button>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  {t('therapyExercises')}
                </h1>
              </div>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
              <section className="welcome-compact-section">
                <p className="welcome-subtitle" style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
                  SPEAK & BUILD & LOOK & RESPOND Therapy Levels
                </p>
              </section>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                {levelDefinitions.map((lvl) => {
                  const isUnlocked = unlockedLevels.includes(lvl.level);
                  const isCompleted = unlockedLevels.includes(lvl.level + 1) || (lvl.level === 6 && unlockedLevels.includes(6));
                  return (
                    <div
                      key={lvl.level}
                      onClick={() => isUnlocked && handleSelectLevel(lvl.level)}
                      style={{
                        padding: '1.2rem',
                        borderRadius: 20,
                        border: isUnlocked ? (isCompleted ? '2px solid #16A34A' : '2px solid var(--color-blue-primary)') : '2px solid var(--border-color)',
                        background: isUnlocked ? 'var(--color-bg-card)' : 'rgba(0,0,0,0.03)',
                        opacity: isUnlocked ? 1 : 0.65,
                        cursor: isUnlocked ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isUnlocked ? 'var(--color-blue-primary)' : 'var(--color-brand-tagline)' }}>
                          {lvl.typeTitle}
                        </span>
                        {isCompleted ? (
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#16A34A' }}>✅ {t('statusCompleted')}</span>
                        ) : isUnlocked ? (
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-blue-primary)' }}>▶ {t('statusCurrent')}</span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-brand-tagline)' }}>🔒 {t('statusLocked')}</span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: 0 }}>
                        {t(lvl.keyTitle)}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-brand-tagline)', margin: 0 }}>
                        {t(lvl.keyDesc)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </main>
          </>
        )}

        {/* STEP 2: LEVEL ACTIVITY RUNNER (IN-PLACE NEXT / RETRY RESET) */}
        {currentStep === 'activity' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="settings-btn" onClick={() => setCurrentStep('levels')}>
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                {levelDefinitions.find((l) => l.level === activeLevelNum)?.typeTitle}
              </h1>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EAB308', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <Star size={16} fill="#EAB308" /> {totalPoints} Pts
              </span>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%', alignItems: 'center' }}>
              {(() => {
                const activeLevelObj = levelDefinitions.find((l) => l.level === activeLevelNum);
                const item = activeLevelObj.items[actIndex % activeLevelObj.items.length];
                const ItemIcon = item.icon || MessageSquare;

                return (
                  <div className="profile-section-card" style={{ width: '100%', padding: '1.5rem', textAlign: 'center', gap: '1.2rem' }}>
                    
                    {/* VISUAL PROMPT / SCENARIO CARD */}
                    <div style={{ padding: '1.5rem', borderRadius: 20, background: 'rgba(2, 132, 199, 0.06)', border: '2px solid var(--color-blue-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      
                      {item.promptKey && (
                        <div style={{ padding: '0.75rem', borderRadius: 14, background: 'rgba(147, 51, 234, 0.1)', color: '#9333EA', fontWeight: 800, fontSize: '1rem', lineHeight: 1.4 }}>
                          🖼️ {t(item.promptKey)}
                        </div>
                      )}

                      <div style={{ width: 72, height: 72, borderRadius: 22, background: item.color, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ItemIcon size={38} />
                      </div>

                      <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: 0 }}>
                        {t(item.label) || item.label}
                      </h2>
                    </div>

                    {/* ATTEMPT HINTS */}
                    {attemptCount === 2 && (
                      <div style={{ width: '100%', padding: '0.85rem', borderRadius: 14, background: 'rgba(234, 179, 8, 0.12)', border: '1.5px solid #EAB308', color: '#B45309', fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lightbulb size={20} />
                        <div><strong>{t('attemptHintTitle')}:</strong> {item.hint}</div>
                      </div>
                    )}

                    {attemptCount === 3 && (
                      <div style={{ width: '100%', padding: '0.85rem', borderRadius: 14, background: 'rgba(2, 132, 199, 0.12)', border: '1.5px solid var(--color-blue-primary)', color: 'var(--color-blue-primary)', fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={20} />
                        <div><strong>{t('attemptHelpTitle')}:</strong> Speak target "{item.target}"</div>
                      </div>
                    )}

                    {/* PHASE 1: START */}
                    {actPhase === 'start' && (
                      <button
                        type="button"
                        className="btn-continue"
                        onClick={handleStartPractice}
                        style={{ width: '100%', padding: '1.1rem', fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <Play size={22} />
                        <span>{t('startPractice')}</span>
                      </button>
                    )}

                    {/* PHASE 2: YOUR TURN — REAL SPEECH VALIDATION */}
                    {actPhase === 'your_turn' && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: 14, background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <Mic size={22} />
                          <span>{t('yourTurn')} (Attempt {attemptCount}/3)</span>
                        </div>

                        <SpeechInputTrigger
                          onTranscriptReceived={handleTranscriptReceived}
                          targetIntent={item.target || item.label}
                          buttonLabel={`🎙️ ${t('tapToSpeak')}`}
                        />

                        {actFeedback && !actFeedback.success && (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div style={{ padding: '0.85rem', borderRadius: 14, background: 'rgba(220, 38, 38, 0.12)', border: '1.5px solid #DC2626', color: '#DC2626', fontWeight: 800 }}>
                              {actFeedback.text}
                            </div>
                            <button
                              type="button"
                              className="btn-secondary-auth"
                              onClick={handleResetForRetry}
                              style={{ width: '100%', padding: '0.75rem' }}
                            >
                              🔄 {t('tryAgain')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PHASE 3: FEEDBACK & IN-PLACE NEXT ITEM BUTTON */}
                    {actPhase === 'feedback' && actFeedback && (
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1.25rem', borderRadius: 16, background: actFeedback.success ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)', border: `2px solid ${actFeedback.success ? '#16A34A' : '#DC2626'}`, color: actFeedback.success ? '#16A34A' : '#DC2626', fontWeight: 800, fontSize: '1.2rem' }}>
                          {actFeedback.text}
                        </div>
                        <button
                          type="button"
                          className="btn-continue"
                          onClick={handleNextActivityItem}
                          style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                          <span>{t('nextItem')}</span>
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    )}

                  </div>
                );
              })()}
            </main>
          </>
        )}

        {/* STEP 3: LEVEL COMPLETE (IN-PLACE REPLAY / NEXT LEVEL) */}
        {currentStep === 'complete' && (
          <>
            <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="settings-btn" onClick={() => setCurrentStep('levels')}>
                <ArrowLeft size={20} />
              </button>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                {t('congratulations')}
              </h1>
            </header>

            <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <div className="profile-section-card" style={{ textAlign: 'center', width: '100%', padding: '2rem 1.25rem', gap: '1rem' }}>
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)', border: '3px solid #16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <Trophy size={44} color="#16A34A" />
                </div>

                <div>
                  <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-brand-title)' }}>
                    {t('congratulations')}
                  </h2>
                  <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-blue-primary)', marginTop: '0.3rem' }}>
                    {lastCompletedSummary?.title || `Level ${lastCompletedSummary?.levelNum}`}
                  </p>
                </div>

                {lastCompletedSummary?.unlockedNext && (
                  <div style={{ padding: '0.85rem', borderRadius: 14, background: 'rgba(22, 163, 74, 0.12)', border: '1.5px solid #16A34A', color: '#16A34A', fontWeight: 800, fontSize: '1.05rem' }}>
                    🎉 {t('levelUnlockedMsg')}
                  </div>
                )}

                {lastCompletedSummary && (
                  <div style={{ padding: '1rem', borderRadius: 16, background: 'rgba(2, 132, 199, 0.06)', border: '1.5px solid var(--border-color)', display: 'flex', justifyContent: 'space-around' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>{t('score')}</span>
                      <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EAB308', margin: '0.2rem 0 0 0' }}>{lastCompletedSummary.pts} Pts</h4>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-color)' }} />
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>{t('accuracyScoreText')}</span>
                      <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16A34A', margin: '0.2rem 0 0 0' }}>{lastCompletedSummary.accuracy}%</h4>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', width: '100%' }}>
                  <button type="button" className="btn-continue" onClick={() => handleSelectLevel(activeLevelNum)} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={18} />
                    <span>{t('replayLevel')}</span>
                  </button>

                  {lastCompletedSummary?.unlockedNext && activeLevelNum < 6 && (
                    <button type="button" className="btn-continue" onClick={() => handleSelectLevel(activeLevelNum + 1)} style={{ width: '100%', background: '#16A34A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <ArrowRight size={18} />
                      <span>{t('nextLevel')}</span>
                    </button>
                  )}

                  <button type="button" className="btn-secondary-auth" onClick={() => setCurrentStep('levels')} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Home size={18} />
                    <span>{t('returnToTherapy')}</span>
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

export default TherapyExercisesModule;
