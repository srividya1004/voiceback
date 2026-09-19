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
    { id: 'apple', label: 'APPLE', labelKn: 'ಸೇಬು', icon: Sun, color: '#DC2626' },
    { id: 'book', label: 'BOOK', labelKn: 'ಪುಸ್ತಕ', icon: Book, color: '#9333EA' },
    { id: 'cup', label: 'CUP', labelKn: 'ಕಪ್', icon: Coffee, color: '#EAB308' },
    { id: 'phone', label: 'PHONE', labelKn: 'ದೂರವಾಣಿ', icon: Smartphone, color: '#0284C7' },
    { id: 'bus', label: 'BUS', labelKn: 'ಬಸ್', icon: Bus, color: '#16A34A' },
    { id: 'flower', label: 'FLOWER', labelKn: 'ಹೂವು', icon: Heart, color: '#DB2777' },
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

  // Game 3 State (Sentence Challenge — Progressive 3-Level Bank)
  const G3_LEVELS = [
    {
      level: 1, title: 'Basic Needs', titleKn: 'ಮೂಲಭೂತ ಅಗತ್ಯಗಳು',
      sentences: [
        { en: 'I NEED WATER', enCards: ['NEED', 'I', 'WATER'], kn: 'ನನಗೆ ನೀರು ಬೇಕು', knCards: ['ಬೇಕು', 'ನನಗೆ', 'ನೀರು'], translit: ['nanage neeru beku', 'nanage niru beku'] },
        { en: 'I WANT FOOD', enCards: ['WANT', 'FOOD', 'I'], kn: 'ನನಗೆ ಊಟ ಬೇಕು', knCards: ['ಊಟ', 'ಬೇಕು', 'ನನಗೆ'], translit: ['nanage oota beku', 'nanage uta beku'] },
        { en: 'I NEED HELP', enCards: ['HELP', 'I', 'NEED'], kn: 'ನನಗೆ ಸಹಾಯ ಬೇಕು', knCards: ['ಸಹಾಯ', 'ನನಗೆ', 'ಬೇಕು'], translit: ['nanage sahaya beku', 'nanage sahay beku'] },
        { en: 'I WANT REST', enCards: ['REST', 'I', 'WANT'], kn: 'ನನಗೆ ವಿಶ್ರಾಂತಿ ಬೇಕು', knCards: ['ವಿಶ್ರಾಂತಿ', 'ಬೇಕು', 'ನನಗೆ'], translit: ['nanage vishranti beku', 'nanage vishranthi beku'] },
      ],
    },
    {
      level: 2, title: 'Daily Activities', titleKn: 'ದೈನಂದಿನ ಚಟುವಟಿಕೆಗಳು',
      sentences: [
        { en: 'I WANT TO SLEEP', enCards: ['TO', 'SLEEP', 'I', 'WANT'], kn: 'ನನಗೆ ನಿದ್ರೆ ಬೇಕು', knCards: ['ನಿದ್ರೆ', 'ಬೇಕು', 'ನನಗೆ'], translit: ['nanage nidre beku', 'nanage nidra beku'] },
        { en: 'I WANT TO WALK', enCards: ['WALK', 'I', 'TO', 'WANT'], kn: 'ನನಗೆ ನಡಿಗೆ ಬೇಕು', knCards: ['ನಡಿಗೆ', 'ನನಗೆ', 'ಬೇಕು'], translit: ['nanage nadige beku'] },
        { en: 'I NEED MY MEDICINE', enCards: ['MY', 'MEDICINE', 'I', 'NEED'], kn: 'ನನಗೆ ನನ್ನ ಔಷಧಿ ಬೇಕು', knCards: ['ನನ್ನ', 'ಔಷಧಿ', 'ಬೇಕು', 'ನನಗೆ'], translit: ['nanage nanna aushadhi beku', 'nanage nanna aushadi beku'] },
        { en: 'I WANT TO GO HOME', enCards: ['GO', 'HOME', 'I', 'WANT', 'TO'], kn: 'ನಾನು ಮನೆಗೆ ಹೋಗಬೇಕು', knCards: ['ಮನೆಗೆ', 'ನಾನು', 'ಹೋಗಬೇಕು'], translit: ['naanu manege hogabeku', 'nanu manege hogabeku'] },
      ],
    },
    {
      level: 3, title: 'Communication & Comfort', titleKn: 'ಸಂವಹನ ಮತ್ತು ಸೌಕರ್ಯ',
      sentences: [
        { en: 'PLEASE HELP ME', enCards: ['HELP', 'PLEASE', 'ME'], kn: 'ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ', knCards: ['ನನಗೆ', 'ದಯವಿಟ್ಟು', 'ಮಾಡಿ', 'ಸಹಾಯ'], translit: ['dayavittu nanage sahaya madi', 'dayavittu nanage sahay madi'] },
        { en: 'I HAVE PAIN', enCards: ['PAIN', 'I', 'HAVE'], kn: 'ನನಗೆ ನೋವು ಇದೆ', knCards: ['ಇದೆ', 'ನನಗೆ', 'ನೋವು'], translit: ['nanage novu ide', 'nanage noovu ide'] },
        { en: 'I WANT TO TALK', enCards: ['TALK', 'TO', 'WANT', 'I'], kn: 'ನನಗೆ ಮಾತನಾಡಲು ಇಷ್ಟ', knCards: ['ಇಷ್ಟ', 'ಮಾತನಾಡಲು', 'ನನಗೆ'], translit: ['nanage matanadalu ishta', 'nanage mathanadalu ishta'] },
        { en: 'PLEASE GIVE ME WATER', enCards: ['GIVE', 'PLEASE', 'WATER', 'ME'], kn: 'ದಯವಿಟ್ಟು ನನಗೆ ನೀರು ಕೊಡಿ', knCards: ['ನೀರು', 'ಕೊಡಿ', 'ನನಗೆ', 'ದಯವಿಟ್ಟು'], translit: ['dayavittu nanage neeru kodi', 'dayavittu nanage niru kodi'] },
      ],
    },
  ];
  const [g3Level, setG3Level] = useState(1);
  const [g3SentenceIndex, setG3SentenceIndex] = useState(0);
  const [g3Language, setG3Language] = useState('en');
  const [g3SelectedCards, setG3SelectedCards] = useState([]);
  const [g3LevelCompleted, setG3LevelCompleted] = useState(false);
  const [g3Feedback, setG3Feedback] = useState(null);

  // Game 4 State (Scenario Response — Real-Life Clinical Scenarios with Video)
  const G4_SCENARIOS = [
    {
      id: 'scen_water',
      category: 'water',
      icon: '💧',
      color: '#0284C7',
      videoUrl: '/videos/scenarios/scenario_water.mp4',
      en: {
        title: 'Asking for Water',
        situation: 'You have been exercising and your throat feels very dry. You notice a water bottle on the table.',
        question: 'What would you say in this situation?',
        guidance: 'I need water',
        modelSpeech: 'I need water',
        acceptable: ['i need water', 'need water', 'please give me water', 'give me water', 'i want water', 'want water', 'water please', 'can i have water'],
        keywords: ['water', 'drink', 'thirsty'],
      },
      kn: {
        title: 'ನೀರು ಕೇಳುವುದು',
        situation: 'ನೀವು ವ್ಯಾಯಾಮ ಮಾಡಿದ್ದೀರಿ ಮತ್ತು ನಿಮ್ಮ ಗಂಟಲು ತುಂಬಾ ಒಣಗಿದೆ. ಮೇಜಿನ ಮೇಲೆ ನೀರಿನ ಬಾಟಲ್ ಇದೆ.',
        question: 'ಈ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?',
        guidance: 'ನನಗೆ ನೀರು ಬೇಕು',
        modelSpeech: 'ನನಗೆ ನೀರು ಬೇಕು',
        acceptable: ['ನನಗೆ ನೀರು ಬೇಕು', 'ನೀರು ಬೇಕು', 'ದಯವಿಟ್ಟು ನೀರು ಕೊಡಿ', 'ನೀರು ಕೊಡಿ', 'ದಯವಿಟ್ಟು ನನಗೆ ನೀರು ಕೊಡಿ', 'ನನಗೆ ನೀರು ಕೊಡಿ'],
        translit: ['nanage neeru beku', 'neeru beku', 'dayavittu neeru kodi', 'neeru kodi', 'nanage niru beku', 'niru beku', 'dayavittu niru kodi'],
        keywords: ['ನೀರು', 'ಕುಡಿಯಲು'],
      },
    },
    {
      id: 'scen_help',
      category: 'caregiver',
      icon: '🚨',
      color: '#DC2626',
      videoUrl: '/videos/scenarios/scenario_help.mp4',
      en: {
        title: 'Asking for Help After Falling',
        situation: 'You slipped on the floor and your walking stick fell down. You cannot get up alone.',
        question: 'What would you say in this situation?',
        guidance: 'Please help me',
        modelSpeech: 'Please help me',
        acceptable: ['please help me', 'help me', 'i need help', 'help please', 'help me up', 'please call someone', 'call for help'],
        keywords: ['help', 'assist'],
      },
      kn: {
        title: 'ಬಿದ್ದ ನಂತರ ಸಹಾಯ ಕೇಳುವುದು',
        situation: 'ನೀವು ನೆಲದ ಮೇಲೆ ಜಾರಿ ಬಿದ್ದಿದ್ದೀರಿ ಮತ್ತು ನಿಮ್ಮ ಊರುಗೋಲು ಕೆಳಗೆ ಬಿದ್ದಿದೆ. ಒಬ್ಬರೇ ಏಳಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ.',
        question: 'ಈ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?',
        guidance: 'ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ',
        modelSpeech: 'ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ',
        acceptable: ['ದಯವಿಟ್ಟು ನನಗೆ ಸಹಾಯ ಮಾಡಿ', 'ಸಹಾಯ ಮಾಡಿ', 'ನನಗೆ ಸಹಾಯ ಬೇಕು', 'ಸಹಾಯ ಬೇಕು', 'ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ'],
        translit: ['dayavittu nanage sahaya madi', 'sahaya madi', 'nanage sahaya beku', 'sahaya beku', 'dayavittu sahaya madi'],
        keywords: ['ಸಹಾಯ'],
      },
    },
    {
      id: 'scen_food',
      category: 'food',
      icon: '🍲',
      color: '#EAB308',
      videoUrl: '/videos/scenarios/scenario_food.mp4',
      en: {
        title: 'Asking for Food',
        situation: 'It is lunchtime and your stomach is rumbling. You smell food from the dining room.',
        question: 'What would you say in this situation?',
        guidance: 'I want food',
        modelSpeech: 'I want food',
        acceptable: ['i want food', 'i need food', 'i am hungry', 'give me food', 'food please', 'please give me lunch', 'time to eat'],
        keywords: ['food', 'hungry', 'lunch', 'eat'],
      },
      kn: {
        title: 'ಊಟ ಕೇಳುವುದು',
        situation: 'ಮಧ್ಯಾಹ್ನದ ಊಟದ ಸಮಯವಾಗಿದೆ ಮತ್ತು ನಿಮಗೆ ತುಂಬಾ ಹಸಿವಾಗುತ್ತಿದೆ. ಊಟದ ಕೋಣೆಯಿಂದ ಊಟದ ಪರಿಮಳ ಬರುತ್ತಿದೆ.',
        question: 'ಈ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?',
        guidance: 'ನನಗೆ ಊಟ ಬೇಕು',
        modelSpeech: 'ನನಗೆ ಊಟ ಬೇಕು',
        acceptable: ['ನನಗೆ ಊಟ ಬೇಕು', 'ಊಟ ಬೇಕು', 'ನನಗೆ ಹಸಿವಾಗಿದೆ', 'ಹಸಿವಾಗಿದೆ', 'ದಯವಿಟ್ಟು ಊಟ ಕೊಡಿ', 'ಊಟ ಕೊಡಿ'],
        translit: ['nanage oota beku', 'oota beku', 'nanage uta beku', 'uta beku', 'nanage hasivagide', 'dayavittu oota kodi'],
        keywords: ['ಊಟ', 'ಹಸಿವು'],
      },
    },
    {
      id: 'scen_pain',
      category: 'pain',
      icon: '🩺',
      color: '#DB2777',
      videoUrl: '/videos/scenarios/scenario_pain.mp4',
      en: {
        title: 'Expressing Pain',
        situation: 'You feel a sharp discomfort in your knee and walking is difficult right now.',
        question: 'What would you say in this situation?',
        guidance: 'I have pain',
        modelSpeech: 'I have pain',
        acceptable: ['i have pain', 'pain here', 'it hurts', 'i feel pain', 'my knee hurts', 'please call doctor', 'call doctor', 'i have pain in my knee'],
        keywords: ['pain', 'hurt', 'discomfort'],
      },
      kn: {
        title: 'ನೋವನ್ನು ವ್ಯಕ್ತಪಡಿಸುವುದು',
        situation: 'ನಿಮ್ಮ ಮೊಣಕಾಲಿನಲ್ಲಿ ತೀವ್ರ ನೋವು ಕಾಣಿಸಿಕೊಂಡಿದೆ ಮತ್ತು ಈಗ ನಡೆಯಲು ಕಷ್ಟವಾಗುತ್ತಿದೆ.',
        question: 'ಈ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?',
        guidance: 'ನನಗೆ ನೋವು ಇದೆ',
        modelSpeech: 'ನನಗೆ ನೋವು ಇದೆ',
        acceptable: ['ನನಗೆ ನೋವು ಇದೆ', 'ನೋವು ಇದೆ', 'ನನಗೆ ನೋವಾಗುತ್ತಿದೆ', 'ನೋವಾಗುತ್ತಿದೆ', 'ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ', 'ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ'],
        translit: ['nanage novu ide', 'novu ide', 'nanage novaguttide', 'dayavittu vaidyarannu kareyiri'],
        keywords: ['ನೋವು'],
      },
    },
    {
      id: 'scen_tired',
      category: 'tired',
      icon: '🛌',
      color: '#6366F1',
      videoUrl: '/videos/scenarios/scenario_tired.mp4',
      en: {
        title: 'Asking for Rest',
        situation: 'You finished walking exercises and your eyelids feel heavy. You want to lie down.',
        question: 'What would you say in this situation?',
        guidance: 'I am tired, I want to rest',
        modelSpeech: 'I am tired, I want to rest',
        acceptable: ['i am tired', 'i want to rest', 'i want to sleep', 'tired', 'i need rest', 'let me rest', 'i want sleep'],
        keywords: ['tired', 'rest', 'sleep'],
      },
      kn: {
        title: 'ವಿಶ್ರಾಂತಿ ಕೇಳುವುದು',
        situation: 'ನೀವು ನಡಿಗೆ ವ್ಯಾಯಾಮವನ್ನು ಮುಗಿಸಿದ್ದೀರಿ ಮತ್ತು ಕಣ್ಣುಗಳು ಭಾರವಾಗಿವೆ. ನೀವು ಮಲಗಲು ಬಯಸುತ್ತೀರಿ.',
        question: 'ಈ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?',
        guidance: 'ನನಗೆ ಆಯಾಸವಾಗಿದೆ, ವಿಶ್ರಾಂತಿ ಬೇಕು',
        modelSpeech: 'ನನಗೆ ಆಯಾಸವಾಗಿದೆ, ವಿಶ್ರಾಂತಿ ಬೇಕು',
        acceptable: ['ನನಗೆ ಆಯಾಸವಾಗಿದೆ', 'ಆಯಾಸವಾಗಿದೆ', 'ನನಗೆ ವಿಶ್ರಾಂತಿ ಬೇಕು', 'ವಿಶ್ರಾಂತಿ ಬೇಕು', 'ನನಗೆ ನಿದ್ರೆ ಬೇಕು', 'ನಿದ್ರೆ ಬೇಕು'],
        translit: ['nanage ayasavagide', 'nanage vishranti beku', 'vishranti beku', 'nanage nidre beku', 'nidre beku'],
        keywords: ['ಆಯಾಸ', 'ವಿಶ್ರಾಂತಿ', 'ನಿದ್ರೆ'],
      },
    },
    {
      id: 'scen_medicine',
      category: 'medicine',
      icon: '💊',
      color: '#10B981',
      videoUrl: '/videos/scenarios/scenario_medicine.mp4',
      en: {
        title: 'Asking for Medicine',
        situation: 'It is 8 PM and the nurse reminds you it is time for your evening tablet on the shelf.',
        question: 'What would you say in this situation?',
        guidance: 'I need my medicine',
        modelSpeech: 'I need my medicine',
        acceptable: ['i need my medicine', 'need medicine', 'please give medicine', 'give me my medicine', 'i want my pills', 'medicine please', 'tablet please'],
        keywords: ['medicine', 'tablet', 'pill'],
      },
      kn: {
        title: 'ಔಷಧಿ ಕೇಳುವುದು',
        situation: 'ರಾತ್ರಿ 8 ಗಂಟೆಯಾಗಿದೆ ಮತ್ತು ಕಪಾಟಿನಲ್ಲಿರುವ ನಿಮ್ಮ ಸಂಜೆಯ ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ.',
        question: 'ಈ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ನೀವು ಏನು ಹೇಳುತ್ತೀರಿ?',
        guidance: 'ನನಗೆ ನನ್ನ ಔಷಧಿ ಬೇಕು',
        modelSpeech: 'ನನಗೆ ನನ್ನ ಔಷಧಿ ಬೇಕು',
        acceptable: ['ನನಗೆ ನನ್ನ ಔಷಧಿ ಬೇಕು', 'ಔಷಧಿ ಬೇಕು', 'ದಯವಿಟ್ಟು ಔಷಧಿ ಕೊಡಿ', 'ಔಷಧಿ ಕೊಡಿ', 'ಮಾತ್ರೆ ಕೊಡಿ', 'ನನಗೆ ಮಾತ್ರೆ ಬೇಕು'],
        translit: ['nanage nanna aushadhi beku', 'aushadhi beku', 'dayavittu aushadhi kodi', 'matre kodi', 'nanage matre beku'],
        keywords: ['ಔಷಧಿ', 'ಮಾತ್ರೆ'],
      },
    },
  ];
  const [g4ScenarioIndex, setG4ScenarioIndex] = useState(0);
  const [g4Language, setG4Language] = useState(language === 'kn' || language === 'Kannada' ? 'kn' : 'en');
  useEffect(() => { setG4Language(language === 'kn' || language === 'Kannada' ? 'kn' : 'en'); }, [language]);
  const [g4Feedback, setG4Feedback] = useState(null);
  const [g4Completed, setG4Completed] = useState(false);
  const g4VideoRef = useRef(null);
  const [g4VideoPlaying, setG4VideoPlaying] = useState(false);
  const [g4VideoTime, setG4VideoTime] = useState(0);
  const [g4VideoDuration, setG4VideoDuration] = useState(0);
  const [g4VideoAvailable, setG4VideoAvailable] = useState(false);
  const [g4VideoLoading, setG4VideoLoading] = useState(false);

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

  // Launch Game 3 (Sentence Challenge — Progressive Levels)
  const handleStartGame3 = () => {
    setActiveGameId('game3');
    setG3Level(1);
    setG3SentenceIndex(0);
    setG3SelectedCards([]);
    setG3LevelCompleted(false);
    setG3Feedback(null);
    setCurrentStep('play_game');
  };

  const currentG3Level = G3_LEVELS.find((l) => l.level === g3Level) || G3_LEVELS[0];
  const currentG3Item = currentG3Level.sentences[g3SentenceIndex] || currentG3Level.sentences[0];
  const currentG3Target = g3Language === 'kn' ? currentG3Item.kn : currentG3Item.en;
  const currentG3CardPool = (g3Language === 'kn' ? currentG3Item.knCards : currentG3Item.enCards).map((text, idx) => ({ id: `${idx}-${text}`, text }));
  const g3AvailableCards = currentG3CardPool.filter((c) => !g3SelectedCards.some((sc) => sc.id === c.id));
  const g3ArrangedSentence = g3SelectedCards.map((c) => c.text).join(' ');
  const isG3AllCardsPlaced = g3SelectedCards.length === currentG3CardPool.length && currentG3CardPool.length > 0;

  const handleG3AddCard = (card) => {
    setG3SelectedCards((prev) => [...prev, card]);
    setG3Feedback(null);
  };

  const handleG3RemoveCard = (index) => {
    setG3SelectedCards((prev) => prev.filter((_, i) => i !== index));
    setG3Feedback(null);
  };

  const handleG3SentenceSpoken = async (rawTranscript) => {
    const res = validationService.validateAnswer(rawTranscript, {
      target: currentG3Target,
      arrangedSentence: g3ArrangedSentence,
      language: g3Language,
      acceptableTranscripts: [currentG3Target],
      translitVariants: g3Language === 'kn' ? (currentG3Item.translit || []) : [],
      mode: 'sentence',
    });

    if (res.isCorrect) {
      setG3Feedback({ success: true, text: g3Language === 'kn' ? '✓ ಅತ್ಯುತ್ತಮ! ವಾಕ್ಯ ಸರಿಯಾಗಿದೆ.' : '✓ Outstanding! Correct sentence.' });
      if (session.user?.id) {
        try {
          await voiceService.playSynthesizedAudio({
            text: currentG3Target,
            patientId: session.user.id,
            language: g3Language,
            gender: session.user.gender,
          });
        } catch {
          if (speak) speak(currentG3Target);
        }
      } else if (speak) {
        speak(currentG3Target);
      }

      setTimeout(() => {
        if (g3SentenceIndex + 1 < currentG3Level.sentences.length) {
          setG3SentenceIndex((prev) => prev + 1);
          setG3SelectedCards([]);
          setG3Feedback(null);
        } else {
          setG3LevelCompleted(true);
          setG3Feedback(null);
          if (g3Level >= G3_LEVELS.length) {
            handleGameComplete('game3', 100);
          }
        }
      }, 1400);
    } else {
      setG3Feedback({ success: false, text: `❌ ${res.reason || (g3Language === 'kn' ? 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ' : 'Try again!')}` });
      if (speak) speak(g3Language === 'kn' ? 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ' : 'Try again');
    }
  };

  const handleG3NextLevel = () => {
    if (g3Level < G3_LEVELS.length) {
      setG3Level((prev) => prev + 1);
      setG3SentenceIndex(0);
      setG3SelectedCards([]);
      setG3LevelCompleted(false);
      setG3Feedback(null);
    }
  };

  const handleG3RestartLevel = () => {
    setG3SentenceIndex(0);
    setG3SelectedCards([]);
    setG3LevelCompleted(false);
    setG3Feedback(null);
  };

  // Launch Game 4 (Scenario Response — Real-Life Clinical Scenarios with Video / Text Fallback)
  const handleStartGame4 = () => {
    setActiveGameId('game4');
    setG4ScenarioIndex(0);
    setG4Feedback(null);
    setG4Completed(false);
    setG4VideoPlaying(false);
    setG4VideoTime(0);
    setG4VideoDuration(0);
    setG4VideoAvailable(false);
    setG4VideoLoading(true);
    setCurrentStep('play_game');
  };

  const currentG4Item = G4_SCENARIOS[g4ScenarioIndex] || G4_SCENARIOS[0];
  const currentG4Content = g4Language === 'kn' ? currentG4Item.kn : currentG4Item.en;

  useEffect(() => {
    if (activeGameId === 'game4') {
      setG4VideoPlaying(false);
      setG4VideoTime(0);
      setG4VideoDuration(0);
      setG4VideoAvailable(false);
      setG4VideoLoading(true);
      if (g4VideoRef.current) {
        g4VideoRef.current.currentTime = 0;
        g4VideoRef.current.pause();
        g4VideoRef.current.load();
      }
    }
  }, [g4ScenarioIndex, activeGameId]);

  const handleG4PlayPause = () => {
    if (!g4VideoRef.current) return;
    if (g4VideoPlaying) {
      g4VideoRef.current.pause();
      setG4VideoPlaying(false);
    } else {
      g4VideoRef.current.play().then(() => {
        setG4VideoPlaying(true);
      }).catch(() => {
        setG4VideoPlaying(false);
      });
    }
  };

  const handleG4ReplayVideo = () => {
    if (!g4VideoRef.current) return;
    g4VideoRef.current.currentTime = 0;
    setG4VideoTime(0);
    g4VideoRef.current.play().then(() => {
      setG4VideoPlaying(true);
    }).catch(() => {
      setG4VideoPlaying(false);
    });
  };

  const handleG4SeekVideo = (e) => {
    const newTime = parseFloat(e.target.value);
    setG4VideoTime(newTime);
    if (g4VideoRef.current) {
      g4VideoRef.current.currentTime = newTime;
    }
  };

  const handleG4ScenarioSpoken = async (rawTranscript) => {
    if (g4VideoRef.current && g4VideoPlaying) {
      g4VideoRef.current.pause();
      setG4VideoPlaying(false);
    }

    const res = validationService.validateAnswer(rawTranscript, {
      category: currentG4Item.category,
      target: currentG4Content.modelSpeech,
      language: g4Language,
      acceptableAnswers: currentG4Content.acceptable,
      translitVariants: g4Language === 'kn' ? (currentG4Content.translit || []) : [],
      keywords: currentG4Content.keywords,
      mode: 'scenario',
    });

    if (res.isCorrect) {
      const successText = g4Language === 'kn'
        ? `✓ ಅತ್ಯುತ್ತಮ ಪ್ರತಿಕ್ರಿಯೆ! ಮಾದರಿ ವಾಕ್ಯ: "${currentG4Content.modelSpeech}"`
        : `✓ Great response! Model answer: "${currentG4Content.modelSpeech}"`;
      setG4Feedback({ success: true, text: successText });

      if (session.user?.id) {
        try {
          await voiceService.playSynthesizedAudio({
            text: currentG4Content.modelSpeech,
            patientId: session.user.id,
            language: g4Language,
            gender: session.user.gender,
          });
        } catch {
          if (speak) speak(currentG4Content.modelSpeech);
        }
      } else if (speak) {
        speak(currentG4Content.modelSpeech);
      }

      setTimeout(() => {
        if (g4ScenarioIndex + 1 < G4_SCENARIOS.length) {
          setG4ScenarioIndex((prev) => prev + 1);
          setG4Feedback(null);
        } else {
          setG4Completed(true);
          setG4Feedback(null);
          saveGameProgress('Scenario Response', G4_SCENARIOS.length, 100);
        }
      }, 1800);
    } else {
      const failText = g4Language === 'kn'
        ? `❌ ${res.reason || 'ಪ್ರತಿಕ್ರಿಯೆ ಸರಿಹೊಂದಿಲ್ಲ. ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.'}`
        : `❌ ${res.reason || 'Response does not match the situation. Please try again!'}`;
      setG4Feedback({ success: false, text: failText });
      if (speak) speak(g4Language === 'kn' ? 'ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ' : 'Try again');
    }
  };

  const handleG4Restart = () => {
    setG4ScenarioIndex(0);
    setG4Feedback(null);
    setG4Completed(false);
    setG4VideoPlaying(false);
    setG4VideoTime(0);
    setG4VideoDuration(0);
    setG4VideoAvailable(false);
    setG4VideoLoading(true);
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
                                {language === 'kn' || language === 'Kannada' ? (card.labelKn || card.label) : card.label}
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
                            {language === 'kn' || language === 'Kannada' ? `ಗುರಿ ${g2TargetIndex + 1} / 5` : `Target ${g2TargetIndex + 1} of 5`}
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
                              {language === 'kn' || language === 'Kannada' ? 'ಪಾಪ್ ಮಾಡಲು ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಕನ್ನಡದಲ್ಲಿ ಹೆಸರನ್ನು ಹೇಳಿ!' : 'Say the name in English or Kannada to pop!'}
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

              {/* GAME 3: SENTENCE CHALLENGE (PROGRESSIVE 3-LEVEL BANK) */}
              {activeGameId === 'game3' && (
                <div className="profile-section-card" style={{ width: '100%', padding: '1.5rem', textAlign: 'center', gap: '1.1rem' }}>
                  {/* HEADER WITH LANGUAGE TOGGLE & LEVEL STATUS */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>
                        Level {g3Level}: {g3Language === 'kn' ? currentG3Level.titleKn : currentG3Level.title}
                      </span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-tagline)' }}>
                        Sentence {g3SentenceIndex + 1} of {currentG3Level.sentences.length}
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', background: 'var(--color-bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 3, gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => { setG3Language('en'); setG3SelectedCards([]); setG3Feedback(null); }}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: 7, border: 'none', background: g3Language === 'en' ? '#16A34A' : 'transparent', color: g3Language === 'en' ? '#FFF' : 'inherit', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => { setG3Language('kn'); setG3SelectedCards([]); setG3Feedback(null); }}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: 7, border: 'none', background: g3Language === 'kn' ? '#16A34A' : 'transparent', color: g3Language === 'kn' ? '#FFF' : 'inherit', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        ಕನ್ನಡ
                      </button>
                    </div>
                  </div>

                  {g3LevelCompleted ? (
                    /* LEVEL COMPLETED SCREEN */
                    <div style={{ padding: '1.8rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                      <span style={{ fontSize: '2.5rem' }}>{g3Level >= G3_LEVELS.length ? '🏆' : '🎉'}</span>
                      <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-brand-title)' }}>
                        {g3Level >= G3_LEVELS.length
                          ? (g3Language === 'kn' ? 'ಎಲ್ಲಾ ಹಂತಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ! ಅಭಿನಂದನೆಗಳು!' : 'All Levels Completed! Outstanding achievement!')
                          : (g3Language === 'kn' ? `ಹಂತ ${g3Level} ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ!` : `Level ${g3Level} Completed! Great work!`)}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--color-brand-tagline)', fontSize: '0.9rem', maxWidth: 440 }}>
                        {g3Level >= G3_LEVELS.length
                          ? (g3Language === 'kn' ? 'ನೀವು ಎಲ್ಲಾ 3 ಹಂತಗಳ ವಾಕ್ಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮುಗಿಸಿದ್ದೀರಿ.' : "You have mastered all 3 sentence challenge levels.")
                          : (g3Language === 'kn' ? `ನೀವು ಹಂತ ${g3Level + 1} ಕ್ಕೆ ಹೋಗಲು ಸಿದ್ಧರಿದ್ದೀರಿ.` : `You are ready for Level ${g3Level + 1}.`)}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {g3Level < G3_LEVELS.length ? (
                          <button
                            type="button"
                            onClick={handleG3NextLevel}
                            style={{ padding: '0.75rem 1.6rem', borderRadius: 12, border: 'none', background: '#16A34A', color: '#FFF', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}
                          >
                            {g3Language === 'kn' ? `ಹಂತ ${g3Level + 1} ಆರಂಭಿಸಿ ➔` : `Next Level (Level ${g3Level + 1}) ➔`}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleStartGame3}
                            style={{ padding: '0.75rem 1.6rem', borderRadius: 12, border: 'none', background: '#16A34A', color: '#FFF', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
                          >
                            {g3Language === 'kn' ? 'ಮೊದಲಿಂದ ಪ್ರಾರಂಭಿಸಿ' : 'Play Again'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleG3RestartLevel}
                          style={{ padding: '0.75rem 1.2rem', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--color-bg-card)', color: 'inherit', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                          {g3Language === 'kn' ? 'ಮತ್ತೆ ಆಡಿ' : 'Replay Level'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ACTIVE SINGLE SENTENCE CHALLENGE */
                    <>
                      <div style={{ padding: '0.85rem 1.2rem', borderRadius: 14, background: 'rgba(22, 163, 74, 0.08)', border: '1.5px solid #16A34A', width: '100%' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>
                          {g3Language === 'kn' ? 'ಗುರಿ ವಾಕ್ಯ' : 'Target Sentence'}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: '0.2rem 0 0 0' }}>
                          "{currentG3Target}"
                        </h3>
                      </div>

                      {/* ANSWER AREA (TAP PLACED CARD TO REMOVE) */}
                      <div style={{ width: '100%', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-tagline)', marginLeft: 4 }}>
                          {g3Language === 'kn' ? 'ಜೋಡಿಸಲಾದ ವಾಕ್ಯ (ತೆಗೆದುಹಾಕಲು ಕ್ಲಿಕ್ ಮಾಡಿ):' : 'Arranged sentence (tap a card to remove):'}
                        </span>
                        <div style={{ padding: '0.9rem', borderRadius: 14, background: 'rgba(22, 163, 74, 0.05)', border: '2px dashed #16A34A', minHeight: 62, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.3rem', width: '100%' }}>
                          {g3SelectedCards.length > 0 ? (
                            g3SelectedCards.map((card, i) => (
                              <button
                                key={`${card.id}-${i}`}
                                type="button"
                                onClick={() => handleG3RemoveCard(i)}
                                title={g3Language === 'kn' ? 'ತೆಗೆದುಹಾಕಲು ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Tap to remove'}
                                style={{ padding: '0.45rem 0.85rem', borderRadius: 10, background: '#16A34A', color: '#FFF', fontWeight: 800, fontSize: '1.05rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <span>{card.text}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>✕</span>
                              </button>
                            ))
                          ) : (
                            <span style={{ color: 'var(--color-brand-tagline)', fontWeight: 600, fontSize: '0.88rem' }}>
                              {g3Language === 'kn' ? 'ಕೆಳಗಿನ ಕಾರ್ಡ್‌ಗಳನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಆಯ್ಕೆ ಮಾಡಿ' : 'Tap cards below to arrange into sentence'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AVAILABLE WORD CARDS */}
                      <div style={{ width: '100%', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-tagline)', marginLeft: 4 }}>
                          {g3Language === 'kn' ? 'ಲಭ್ಯವಿರುವ ಕಾರ್ಡ್‌ಗಳು:' : 'Available cards (tap to add):'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%', minHeight: 44, marginTop: '0.3rem' }}>
                          {g3AvailableCards.length > 0 ? (
                            g3AvailableCards.map((card) => (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => handleG3AddCard(card)}
                                style={{ padding: '0.75rem 1.15rem', borderRadius: 12, border: '2px solid var(--border-color)', background: 'var(--color-bg-card)', color: 'var(--color-brand-title)', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer' }}
                              >
                                {card.text}
                              </button>
                            ))
                          ) : (
                            <span style={{ color: '#16A34A', fontWeight: 700, fontSize: '0.85rem', alignSelf: 'center' }}>
                              {g3Language === 'kn' ? '✓ ಎಲ್ಲಾ ಪದಗಳನ್ನು ಇರಿಸಲಾಗಿದೆ! ಕೆಳಗೆ ಮಾತನಾಡಿ.' : '✓ All words placed! Speak the sentence below.'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* SPEAK ACTION TRIGGER (ENABLED ONLY ONCE ALL CARDS ARE ARRANGED) */}
                      {isG3AllCardsPlaced && (
                        <div style={{ marginTop: '0.35rem', width: '100%' }}>
                          <SpeechInputTrigger
                            key={`g3-trigger-${g3Level}-${g3SentenceIndex}-${g3Language}-${g3SelectedCards.map((c) => c.id).join('-')}`}
                            resetKey={`g3-reset-${g3Level}-${g3SentenceIndex}-${g3Language}`}
                            onTranscriptReceived={handleG3SentenceSpoken}
                            targetIntent={g3ArrangedSentence}
                            buttonLabel={g3Language === 'kn' ? `🎙️ ವಾಕ್ಯವನ್ನು ಹೇಳಿ: "${g3ArrangedSentence}"` : `🎙️ Speak Sentence: "${g3ArrangedSentence}"`}
                          />
                        </div>
                      )}

                      {/* FEEDBACK BANNER */}
                      {g3Feedback && (
                        <div style={{ padding: '0.75rem', borderRadius: 12, background: g3Feedback.success ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)', color: g3Feedback.success ? '#16A34A' : '#DC2626', fontWeight: 800, fontSize: '0.9rem' }}>
                          {g3Feedback.text}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* GAME 4: SCENARIO RESPONSE (REAL-LIFE CLINICAL SCENARIOS) */}
              {activeGameId === 'game4' && (
                <div className="profile-section-card" style={{ width: '100%', padding: '1.5rem', textAlign: 'center', gap: '1.1rem' }}>
                  {/* HEADER WITH LANGUAGE TOGGLE & PROGRESS */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: currentG4Item.color, textTransform: 'uppercase' }}>
                        Scenario {g4ScenarioIndex + 1} of {G4_SCENARIOS.length}
                      </span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-tagline)' }}>
                        {g4Language === 'kn' ? 'ನೈಜ ಪರಿಸ್ಥಿತಿಯ ಪ್ರತಿಕ್ರಿಯೆ' : 'Real-Life Response Practice'}
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', background: 'var(--color-bg-card)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 3, gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => { setG4Language('en'); setG4Feedback(null); }}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: 7, border: 'none', background: g4Language === 'en' ? currentG4Item.color : 'transparent', color: g4Language === 'en' ? '#FFF' : 'inherit', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => { setG4Language('kn'); setG4Feedback(null); }}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: 7, border: 'none', background: g4Language === 'kn' ? currentG4Item.color : 'transparent', color: g4Language === 'kn' ? '#FFF' : 'inherit', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        ಕನ್ನಡ
                      </button>
                    </div>
                  </div>

                  {g4Completed ? (
                    /* GAME 4 ALL SCENARIOS COMPLETED */
                    <div style={{ padding: '1.8rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                      <span style={{ fontSize: '2.8rem' }}>🏆</span>
                      <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-brand-title)' }}>
                        {g4Language === 'kn' ? 'ಎಲ್ಲಾ ಸನ್ನಿವೇಶಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ! ಅದ್ಭುತ!' : 'All Scenarios Completed! Great Job!'}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--color-brand-tagline)', fontSize: '0.92rem', maxWidth: 440 }}>
                        {g4Language === 'kn'
                          ? 'ನೀವು ಎಲ್ಲಾ ನೈಜ ಪರಿಸ್ಥಿತಿಗಳಿಗೆ ಯಶಸ್ವಿಯಾಗಿ ಮಾತನಾಡಿ ಪ್ರತಿಕ್ರಿಯಿಸಿದ್ದೀರಿ.'
                          : 'You successfully communicated appropriate spoken responses across all real-life scenarios.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleG4Restart}
                        style={{ padding: '0.75rem 1.6rem', borderRadius: 12, border: 'none', background: '#0284C7', color: '#FFF', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem' }}
                      >
                        {g4Language === 'kn' ? 'ಮತ್ತೆ ಅಭ್ಯಾಸ ಮಾಡಿ' : 'Practice Again'}
                      </button>
                    </div>
                  ) : (
                    /* ACTIVE SCENARIO PRESENTATION */
                    <>
                      {/* OFFSCREEN PROBE FOR OPTIONAL VIDEO ASSET PLAYABILITY (GUARANTEES BROWSER METADATA EVENT EMISSION) */}
                      <video
                        key={`g4-probe-${currentG4Item.id}`}
                        src={currentG4Item.videoUrl}
                        playsInline
                        muted
                        preload="metadata"
                        style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                        onLoadedMetadata={(e) => {
                          const dur = e.target.duration;
                          if (dur > 0 && !isNaN(dur)) {
                            setG4VideoDuration(dur);
                            setG4VideoAvailable(true);
                            setG4VideoLoading(false);
                          }
                        }}
                        onCanPlay={(e) => {
                          const dur = e.target.duration;
                          if (dur > 0 && !isNaN(dur)) {
                            setG4VideoDuration(dur);
                            setG4VideoAvailable(true);
                            setG4VideoLoading(false);
                          }
                        }}
                        onError={() => {
                          setG4VideoAvailable(false);
                          setG4VideoLoading(false);
                          setG4VideoPlaying(false);
                        }}
                      />

                      {/* 1. OPTIONAL VIDEO PRESENTATION (SHOWN ONLY WHEN VALID PLAYABLE MP4 IS CONFIRMED) */}
                      {g4VideoAvailable ? (
                        <div
                          style={{
                            width: '100%',
                            borderRadius: 16,
                            overflow: 'hidden',
                            border: `2px solid ${currentG4Item.color}`,
                            background: '#0F172A',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            textAlign: 'left',
                          }}
                        >
                          {/* VIDEO HEADER BADGE */}
                          <div
                            style={{
                              padding: '0.65rem 1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1.2rem' }}>{currentG4Item.icon}</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                {g4Language === 'kn' ? '🎬 ಸನ್ನಿವೇಶ ವೀಡಿಯೊ' : '🎬 Scenario Video'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: currentG4Item.color }}>
                              {currentG4Content.title}
                            </span>
                          </div>

                          {/* VIDEO ELEMENT CONTAINER */}
                          <div style={{ position: 'relative', width: '100%', background: '#000', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <video
                              ref={g4VideoRef}
                              key={`g4-player-${currentG4Item.id}`}
                              src={currentG4Item.videoUrl}
                              playsInline
                              muted
                              style={{ width: '100%', maxHeight: 260, objectFit: 'contain', display: 'block' }}
                              onTimeUpdate={() => {
                                if (g4VideoRef.current) {
                                  setG4VideoTime(g4VideoRef.current.currentTime);
                                }
                              }}
                              onEnded={() => setG4VideoPlaying(false)}
                            />
                          </div>

                          {/* ACCESSIBLE VIDEO CONTROLS BAR */}
                          <div
                            style={{
                              padding: '0.75rem 1rem',
                              background: 'rgba(15, 23, 42, 0.95)',
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '0.65rem',
                              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {/* PLAY / PAUSE BUTTON */}
                            <button
                              type="button"
                              onClick={handleG4PlayPause}
                              style={{
                                padding: '0.45rem 0.85rem',
                                borderRadius: 8,
                                border: 'none',
                                background: currentG4Item.color,
                                color: '#FFF',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <span>{g4VideoPlaying ? '⏸️' : '▶️'}</span>
                              <span>
                                {g4Language === 'kn'
                                  ? (g4VideoPlaying ? 'ವಿರಾಮ' : 'ಪ್ಲೇ ಮಾಡಿ')
                                  : (g4VideoPlaying ? 'Pause' : 'Play Video')}
                              </span>
                            </button>

                            {/* REPLAY BUTTON */}
                            <button
                              type="button"
                              onClick={handleG4ReplayVideo}
                              title={g4Language === 'kn' ? 'ವೀಡಿಯೊ ಮರುಪ್ಲೇ ಮಾಡಿ' : 'Replay video from beginning'}
                              style={{
                                padding: '0.45rem 0.85rem',
                                borderRadius: 8,
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#F8FAFC',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <span>↺</span>
                              <span>{g4Language === 'kn' ? 'ಮರುಪ್ಲೇ' : 'Replay'}</span>
                            </button>

                            {/* PROGRESS SLIDER */}
                            <input
                              type="range"
                              min="0"
                              max={g4VideoDuration || 10}
                              step="0.1"
                              value={g4VideoTime}
                              onChange={handleG4SeekVideo}
                              aria-label="Video timeline"
                              style={{
                                flex: 1,
                                minWidth: 100,
                                accentColor: currentG4Item.color,
                                cursor: 'pointer',
                              }}
                            />

                            {/* TIME INDICATOR */}
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, minWidth: 44, textAlign: 'right' }}>
                              {Math.floor(g4VideoTime)}s / {Math.floor(g4VideoDuration || 10)}s
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* 2. ORIGINAL TEXT-ONLY SCENARIO PRESENTATION (AUTOMATIC FALLBACK) */
                        <div
                          style={{
                            width: '100%',
                            padding: '1.5rem 1.25rem',
                            borderRadius: 16,
                            border: `2px solid ${currentG4Item.color}`,
                            background: 'var(--color-bg-card)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.85rem',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                          }}
                        >
                          <div style={{ fontSize: '2.8rem' }}>{currentG4Item.icon}</div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: currentG4Item.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {currentG4Content.title}
                          </span>
                          <div
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 600,
                              lineHeight: 1.55,
                              color: 'var(--color-brand-title)',
                              maxWidth: 520,
                              background: 'rgba(255, 255, 255, 0.04)',
                              padding: '1.1rem 1.35rem',
                              borderRadius: 12,
                              border: '1px solid var(--border-color)',
                              width: '100%',
                              textAlign: 'center',
                            }}
                          >
                            {currentG4Content.situation}
                          </div>
                        </div>
                      )}

                      {/* QUESTION PROMPT (POST-VIDEO) */}
                      <div style={{ width: '100%', textAlign: 'left', padding: '0.4rem 0.2rem 0 0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-brand-tagline)', textTransform: 'uppercase' }}>
                          {g4Language === 'kn' ? 'ಪ್ರಶ್ನೆ' : 'Question'}
                        </span>
                        <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                          {currentG4Content.question}
                        </h4>
                        <div style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(2, 132, 199, 0.08)', padding: '0.3rem 0.65rem', borderRadius: 8 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7' }}>
                            {g4Language === 'kn' ? 'ಸಲಹೆ ಮಾದರಿ:' : 'Helpful phrase:'} "{currentG4Content.guidance}"
                          </span>
                        </div>
                      </div>

                      {/* SPOKEN RESPONSE TRIGGER */}
                      <div style={{ marginTop: '0.4rem', width: '100%' }}>
                        <SpeechInputTrigger
                          key={`g4-trigger-${g4ScenarioIndex}-${g4Language}`}
                          resetKey={`g4-reset-${g4ScenarioIndex}-${g4Language}`}
                          onTranscriptReceived={handleG4ScenarioSpoken}
                          targetIntent={currentG4Content.modelSpeech}
                          buttonLabel={
                            g4Language === 'kn'
                              ? `🎙️ ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಮಾತನಾಡಿ`
                              : `🎙️ Speak Your Response`
                          }
                        />
                      </div>

                      {/* FEEDBACK & RETRY BANNER */}
                      {g4Feedback && (
                        <div
                          style={{
                            padding: '0.85rem',
                            borderRadius: 14,
                            background: g4Feedback.success ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                            color: g4Feedback.success ? '#16A34A' : '#DC2626',
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            width: '100%',
                          }}
                        >
                          {g4Feedback.text}
                        </div>
                      )}
                    </>
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
