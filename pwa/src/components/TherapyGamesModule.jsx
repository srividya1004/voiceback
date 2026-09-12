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
  Star,
  Apple
} from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import SpeechInputTrigger from './SpeechInputTrigger';
import { useSettings } from '../context/SettingsContext';
import validationService from '../services/validationService';
import therapyService from '../services/therapyService';
import authService from '../services/authService';
import voiceService from '../services/voiceService';

// Dedicated Object Picture SVG Component for Speak & Pop
const ObjectPicture = ({ id, color, size = 110 }) => {
  if (id === 'apple') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 24C52 14 59 10 65 8" stroke="#78350F" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M52 18C60 14 68 18 69 22C64 26 55 24 52 18Z" fill="#22C55E" />
        <path d="M50 32C42 22 20 22 16 42C12 60 26 88 47 88C49 88 50 86 50 86C50 86 51 88 53 88C74 88 88 60 84 42C80 22 58 22 50 32Z" fill="url(#appleGrad)" />
        <path d="M26 38C22 46 22 58 28 66" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        <defs>
          <linearGradient id="appleGrad" x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EF4444" />
            <stop offset="0.7" stopColor="#DC2626" />
            <stop offset="1" stopColor="#991B1B" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (id === 'mango') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M46 22C48 14 52 10 56 6" stroke="#78350F" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M48 16C58 12 66 16 68 22C62 26 52 24 48 16Z" fill="#16A34A" />
        <path d="M46 24C32 24 22 36 22 52C22 72 38 88 54 88C70 88 78 76 78 60C78 40 64 24 46 24Z" fill="url(#mangoGrad)" />
        <path d="M30 40C26 48 28 60 36 68" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
        <defs>
          <linearGradient id="mangoGrad" x1="25" y1="25" x2="75" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="0.4" stopColor="#FBBF24" />
            <stop offset="0.85" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (id === 'water') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 26L34 84C34.5 87 37 89 40 89H60C63 89 65.5 87 66 84L72 26H28Z" fill="url(#glassGrad)" stroke="#38BDF8" strokeWidth="3" />
        <path d="M31 38L34 84C34.5 87 37 89 40 89H60C63 89 65.5 87 66 84L69 38C64 41 58 37 50 38C42 39 36 36 31 38Z" fill="url(#waterGrad)" />
        <ellipse cx="50" cy="38" rx="19" ry="4" fill="#7DD3FC" opacity="0.6" />
        <path d="M35 32L38 80" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <defs>
          <linearGradient id="glassGrad" x1="50" y1="26" x2="50" y2="89" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E0F2FE" stopOpacity="0.4" />
            <stop offset="1" stopColor="#BAE6FD" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="50" y1="38" x2="50" y2="89" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0284C7" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (id === 'book') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 74C28 70 46 72 50 78C54 72 72 70 86 74V30C72 26 54 28 50 34C46 28 28 26 14 30V74Z" fill="#7E22CE" stroke="#581C87" strokeWidth="2.5" />
        <path d="M16 70C28 66 46 68 50 74C54 68 72 66 84 70V28C72 24 54 26 50 32C46 26 28 24 16 28V70Z" fill="#F8FAFC" />
        <line x1="50" y1="32" x2="50" y2="75" stroke="#9333EA" strokeWidth="2" />
        <line x1="22" y1="38" x2="44" y2="38" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="46" x2="44" y2="46" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="54" x2="40" y2="54" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="56" y1="38" x2="78" y2="38" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="56" y1="46" x2="78" y2="46" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="56" y1="54" x2="74" y2="54" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M49 28V52L53 48L57 52V28" fill="#EF4444" />
      </svg>
    );
  }
  if (id === 'cup') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="80" rx="36" ry="7" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2" />
        <ellipse cx="50" cy="78" rx="28" ry="5" fill="#F1F5F9" />
        <path d="M64 42C76 42 78 64 64 66" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M26 36H70L65 72C64 76 60 78 56 78H40C36 78 32 76 31 72L26 36Z" fill="url(#cupGrad)" stroke="#D97706" strokeWidth="2.5" />
        <ellipse cx="48" cy="38" rx="19" ry="4" fill="#78350F" />
        <path d="M42 28C40 22 46 18 44 12" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <path d="M52 26C54 20 48 16 50 10" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <defs>
          <linearGradient id="cupGrad" x1="26" y1="36" x2="70" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (id === 'milk') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M34 30H66L62 84C61.5 87 59 89 56 89H44C41 89 38.5 87 38 84L34 30Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2.5" />
        <path d="M36 44H64L62 84C61.5 87 59 89 56 89H44C41 89 38.5 87 38 84L36 44Z" fill="#E2E8F0" />
        <ellipse cx="50" cy="44" rx="14" ry="3" fill="#FFFFFF" />
        <line x1="56" y1="18" x2="48" y2="60" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'tea') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="80" rx="34" ry="6" fill="#FCE7F3" stroke="#F472B6" strokeWidth="2" />
        <path d="M64 44C74 44 76 62 64 64" stroke="#DB2777" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M28 38H68L64 72C63 76 59 78 55 78H41C37 78 33 76 32 72L28 38Z" fill="#FDF2F8" stroke="#DB2777" strokeWidth="2.5" />
        <ellipse cx="48" cy="40" rx="18" ry="4" fill="#9D174D" />
        <path d="M48 28C46 22 52 18 50 12" stroke="#F472B6" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      </svg>
    );
  }
  return <Droplet size={size * 0.6} color={color || '#9333EA'} />;
};

export const TherapyGamesModule = ({
  patientId: propPatientId,
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

  // Patient Session Data - dynamically resolved
  const [session] = useState(() => authService.getActiveSession() || {});
  const patientId = propPatientId || (session?.role === 'patient' ? (session?.user?.profile?._id || session?.user?.id || session?.patientId) : null);

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

  // Game 2 State (Speak & Pop — Bilingual Object Pictures with Kannada & English Support)
  const g2TargetPool = [
    {
      id: 'apple',
      en: 'Apple',
      kn: 'ಸೇಬು',
      label: 'Apple / ಸೇಬು',
      color: '#DC2626',
      enVariants: ['apple', 'an apple', 'red apple', 'green apple', 'apples', 'apl', 'appel', 'aple', 'appil', 'epple', 'appl'],
      knVariants: ['ಸೇಬು', 'ಸೇಬು ಹಣ್ಣು', 'ಸೇಬುಹಣ್ಣು', 'ಸೇಬುಗಳು', 'ಸೇಬ್'],
      translitVariants: ['sebu', 'seebu', 'seeb', 'seb', 'saybu', 'sebu hannu', 'seebu hannu'],
    },
    {
      id: 'mango',
      en: 'Mango',
      kn: 'ಮಾವಿನಹಣ್ಣು',
      label: 'Mango / ಮಾವಿನಹಣ್ಣು',
      color: '#F59E0B',
      enVariants: ['mango', 'a mango', 'yellow mango', 'mangoes', 'mangos', 'mangu', 'maango'],
      knVariants: ['ಮಾವಿನಹಣ್ಣು', 'ಮಾವಿನ ಹಣ್ಣು', 'ಮಾವು', 'ಮಾವಿನಕಾಯಿ', 'ಮಾವ್'],
      translitVariants: ['mavina hannu', 'mavinahannu', 'mavina', 'mavu', 'maavu', 'maavina', 'mav', 'mavin'],
    },
    {
      id: 'water',
      en: 'Water',
      kn: 'ನೀರು',
      label: 'Water / ನೀರು',
      color: '#0284C7',
      enVariants: ['water', 'a water', 'drink water', 'glass of water', 'cold water', 'wotar', 'watar'],
      knVariants: ['ನೀರು', 'ನೀರ್', 'ತಣ್ಣೀರು', 'ಕುಡಿಯುವ ನೀರು'],
      translitVariants: ['neeru', 'niru', 'neer', 'nir', 'kudiyuva neeru', 'thanniru'],
    },
    {
      id: 'book',
      en: 'Book',
      kn: 'ಪುಸ್ತಕ',
      label: 'Book / ಪುಸ್ತಕ',
      color: '#9333EA',
      enVariants: ['book', 'a book', 'the book', 'reading book', 'books', 'buk', 'bok', 'boook', 'bouk', 'bukk'],
      knVariants: ['ಪುಸ್ತಕ', 'ಪುಸ್ತಕ್', 'ಪುಸ್ತಕಗಳು', 'ಪುಸ್ತಕವನ್ನು', 'ಪುಸ್ತಕಾ', 'ಬುಕ್', 'ಬುಕ್ಕು', 'ಬುಕ್ಸ್', 'ಗ್ರಂಥ'],
      translitVariants: ['pustaka', 'pusthaka', 'pustak', 'pusthak', 'pustakam', 'pusthakam', 'pustaku', 'book', 'buk', 'bukku'],
    },
    {
      id: 'cup',
      en: 'Cup',
      kn: 'ಕಪ್',
      label: 'Cup / ಕಪ್',
      color: '#EAB308',
      enVariants: ['cup', 'a cup', 'the cup', 'tea cup', 'coffee cup', 'cups'],
      knVariants: ['ಕಪ್', 'ಕಪ್ಪು', 'ಕಪ್ಗಳು', 'ಲೋಟ', 'ಲೋಟ್', 'ಟೀ ಕಪ್'],
      translitVariants: ['lota', 'loota', 'kappu', 'kap', 'cup'],
    },
    {
      id: 'milk',
      en: 'Milk',
      kn: 'ಹಾಲು',
      label: 'Milk / ಹಾಲು',
      color: '#10B981',
      enVariants: ['milk', 'a milk', 'glass of milk', 'hot milk', 'milkk'],
      knVariants: ['ಹಾಲು', 'ಹಾಲ್', 'ಬಿಸಿ ಹಾಲು'],
      translitVariants: ['haalu', 'halu', 'haal'],
    },
    {
      id: 'tea',
      en: 'Tea',
      kn: 'ಚಹಾ',
      label: 'Tea / ಚಹಾ',
      color: '#DB2777',
      enVariants: ['tea', 'a tea', 'cup of tea', 'hot tea', 'chai', 'tee'],
      knVariants: ['ಚಹಾ', 'ಟೀ', 'ಚಾಯ್'],
      translitVariants: ['chaha', 'chaa', 'tii'],
    },
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

  const handleG2TranscriptReceived = async (rawTranscript) => {
    const currentTargetObj = g2TargetPool[g2TargetIndex % g2TargetPool.length];
    
    // BILINGUAL OBJECT VALIDATION (ENGLISH & KANNADA WITH PHONETIC & CLOSE PRONUNCIATION TOLERANCE)
    const res = validationService.validateAnswer(rawTranscript, {
      id: currentTargetObj.id,
      en: currentTargetObj.en,
      kn: currentTargetObj.kn,
      enVariants: currentTargetObj.enVariants,
      knVariants: currentTargetObj.knVariants,
      translitVariants: currentTargetObj.translitVariants,
      mode: 'bilingual_object',
    });

    if (res.isCorrect) {
      setG2Popped(true);
      const spokenWord = res.spokenTarget || (res.detectedLanguage === 'Kannada' ? currentTargetObj.kn : currentTargetObj.en);
      setG2Feedback({ success: true, text: `💥 POP! 🎉 "${spokenWord}"` });

      // Speak target using patient's cloned voice with exact language routing
      const effectiveLang = res.detectedLanguage || (language === 'kn' || language === 'kannada' ? 'Kannada' : 'English');
      try {
        await voiceService.playSynthesizedAudio({
          patientId,
          text: spokenWord,
          language: effectiveLang,
          emotion: 'cheerful',
        });
      } catch (voiceErr) {
        console.warn('Speak & Pop cloned voice playback notice:', voiceErr.message);
      }

      // Automatically advance to the next picture after voice playback is triggered
      setTimeout(() => {
        if (g2TargetIndex + 1 < 5) {
          setG2TargetIndex((prev) => prev + 1);
          setG2Popped(false);
          setG2Feedback(null);
        } else {
          saveGameProgress('Speak & Pop', 5, 100);
        }
      }, 1500);
    } else {
      // Wrong answer -> target remains + retry (DO NOT POP, DO NOT ADVANCE)
      setG2Popped(false);
      setG2Feedback({ success: false, text: `❌ ${res.reason || 'Try again!'}` });
      if (speak) speak(language === 'kn' ? 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ' : 'Try again');
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

              {/* GAME 2: SPEAK & POP (BILINGUAL OBJECT PICTURE REDESIGN) */}
              {activeGameId === 'game2' && (
                <div className="profile-section-card" style={{ width: '100%', padding: '1.5rem', textAlign: 'center', gap: '1.2rem' }}>
                  {(() => {
                    const currentObj = g2TargetPool[g2TargetIndex % g2TargetPool.length];
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 0.25rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9333EA' }}>
                            Target {g2TargetIndex + 1} of 5
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(147, 51, 234, 0.1)', color: '#9333EA', padding: '0.2rem 0.6rem', borderRadius: 12 }}>
                            English & ಕನ್ನಡ
                          </span>
                        </div>

                        {/* SINGLE OBJECT PICTURE DISPLAY */}
                        <div style={{ position: 'relative', width: 170, height: 170, margin: '0.3rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div
                            style={{
                              width: g2Popped ? 0 : 160,
                              height: g2Popped ? 0 : 160,
                              borderRadius: '24px',
                              background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                              border: `2.5px solid ${currentObj.color || '#9333EA'}`,
                              boxShadow: `0 12px 28px ${currentObj.color ? currentObj.color + '25' : 'rgba(147, 51, 234, 0.15)'}`,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.8rem',
                              opacity: g2Popped ? 0 : 1,
                              transform: g2Popped ? 'scale(0.1)' : 'scale(1)',
                              transition: 'all 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            }}
                          >
                            <ObjectPicture id={currentObj.id} color={currentObj.color} size={110} />
                          </div>

                          {g2Popped && (
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#16A34A', animation: 'bounce 0.5s', textAlign: 'center' }}>
                              💥 POP! 🎉
                            </div>
                          )}
                        </div>

                        {/* BILINGUAL TARGET LABELS */}
                        {!g2Popped && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', margin: '-0.2rem 0 0.4rem 0' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.01em' }}>
                                {currentObj.en}
                              </span>
                              <span style={{ fontSize: '1.2rem', color: '#94A3B8', fontWeight: 600 }}>/</span>
                              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: currentObj.color || '#9333EA' }}>
                                {currentObj.kn}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                              Say the name in English or Kannada to pop!
                            </span>
                          </div>
                        )}

                        <SpeechInputTrigger
                          key={`g2-trigger-${g2TargetIndex}`}
                          resetKey={`g2-target-${g2TargetIndex}`}
                          onTranscriptReceived={handleG2TranscriptReceived}
                          targetIntent={`${currentObj.en} / ${currentObj.kn}`}
                          buttonLabel={`🎙️ Say "${currentObj.en}" or "${currentObj.kn}"`}
                        />

                        {g2Feedback && (
                          <div style={{ padding: '0.85rem', borderRadius: 14, background: g2Feedback.success ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)', color: g2Feedback.success ? '#16A34A' : '#DC2626', fontWeight: 800, fontSize: '0.92rem' }}>
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
