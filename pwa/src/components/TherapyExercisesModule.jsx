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
  patientId: propPatientId,
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

  // Patient Session Data - dynamically resolved
  const [session] = useState(() => authService.getActiveSession() || {});
  const patientId = propPatientId || (session?.role === 'patient' ? (session?.user?.profile?._id || session?.user?.id || session?.patientId) : null);

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
      typeTitleKn: 'ಮಾತನಾಡಿ ಮತ್ತು ನಿರ್ಮಿಸಿ — ಹಂತ 1: ಒಂಟಿ ಪದಗಳು',
      keyTitle: 'level1Name',
      keyDesc: 'level1Desc',
      validationMode: 'exact',
      items: [
        { id: 'apple', label: 'APPLE', labelKn: 'ಸೇಬು', target: 'APPLE', targetKn: 'ಸೇಬು', hint: 'Say "APPLE"', hintKn: '"ಸೇಬು" ಎಂದು ಹೇಳಿ', icon: Apple, color: '#DC2626', keywords: ['apple', 'ಸೇಬು', 'seb', 'sebu'] },
        { id: 'book', label: 'BOOK', labelKn: 'ಪುಸ್ತಕ', target: 'BOOK', targetKn: 'ಪುಸ್ತಕ', hint: 'Say "BOOK"', hintKn: '"ಪುಸ್ತಕ" ಎಂದು ಹೇಳಿ', icon: Book, color: '#9333EA', keywords: ['book', 'ಪುಸ್ತಕ', 'pustaka'] },
        { id: 'cup', label: 'CUP', labelKn: 'ಕಪ್', target: 'CUP', targetKn: 'ಕಪ್', hint: 'Say "CUP"', hintKn: '"ಕಪ್" ಎಂದು ಹೇಳಿ', icon: Coffee, color: '#EAB308', keywords: ['cup', 'ಕಪ್', 'ಲೋಟ', 'lota'] },
        { id: 'chair', label: 'CHAIR', labelKn: 'ಕುರ್ಚಿ', target: 'CHAIR', targetKn: 'ಕುರ್ಚಿ', hint: 'Say "CHAIR"', hintKn: '"ಕುರ್ಚಿ" ಎಂದು ಹೇಳಿ', icon: Home, color: '#16A34A', keywords: ['chair', 'ಕುರ್ಚಿ', 'kurchi'] },
        { id: 'phone', label: 'PHONE', labelKn: 'ದೂರವಾಣಿ', target: 'PHONE', targetKn: 'ದೂರವಾಣಿ', hint: 'Say "PHONE"', hintKn: '"ದೂರವಾಣಿ" ಎಂದು ಹೇಳಿ', icon: Smartphone, color: '#0284C7', keywords: ['phone', 'ದೂರವಾಣಿ', 'ಫೋನ್'] },
      ]
    },
    {
      level: 2,
      typeTitle: 'Speak & Build — Level 2: Two-Word Phrases',
      typeTitleKn: 'ಮಾತನಾಡಿ ಮತ್ತು ನಿರ್ಮಿಸಿ — ಹಂತ 2: ವಾಕ್ಯಾಂಶ ಅಭ್ಯಾಸ',
      keyTitle: 'level2Name',
      keyDesc: 'level2Desc',
      validationMode: 'phrase',
      items: [
        { id: 'need_water', label: 'NEED WATER', labelKn: 'ನೀರು ಬೇಕು', target: 'NEED WATER', targetKn: 'ನೀರು ಬೇಕು', keywords: ['need water', 'want water', 'water', 'ನೀರು ಬೇಕು', 'ನೀರು'], hint: 'Say "NEED WATER"', hintKn: '"ನೀರು ಬೇಕು" ಎಂದು ಹೇಳಿ', icon: Droplet, color: '#0284C7' },
        { id: 'want_food', label: 'WANT FOOD', labelKn: 'ಊಟ ಬೇಕು', target: 'WANT FOOD', targetKn: 'ಊಟ ಬೇಕು', keywords: ['want food', 'need food', 'food', 'ಊಟ ಬೇಕು', 'ಊಟ', 'ತಿಂಡಿ'], hint: 'Say "WANT FOOD"', hintKn: '"ಊಟ ಬೇಕು" ಎಂದು ಹೇಳಿ', icon: Utensils, color: '#EAB308' },
        { id: 'call_mom', label: 'CALL MOM', labelKn: 'ಅಮ್ಮನಿಗೆ ಕರೆ ಮಾಡಿ', target: 'CALL MOM', targetKn: 'ಅಮ್ಮನಿಗೆ ಕರೆ ಮಾಡಿ', keywords: ['call mom', 'call family', 'mom', 'ಅಮ್ಮ', 'ಕರೆ ಮಾಡಿ'], hint: 'Say "CALL MOM"', hintKn: '"ಅಮ್ಮನಿಗೆ ಕರೆ ಮಾಡಿ" ಎಂದು ಹೇಳಿ', icon: Phone, color: '#DB2777' },
        { id: 'need_medicine', label: 'NEED MEDICINE', labelKn: 'ಮಾತ್ರೆ ಬೇಕು', target: 'NEED MEDICINE', targetKn: 'ಮಾತ್ರೆ ಬೇಕು', keywords: ['need medicine', 'medicine', 'ಮಾತ್ರೆ ಬೇಕು', 'ಮಾತ್ರೆ', 'ಔಷಧಿ'], hint: 'Say "NEED MEDICINE"', hintKn: '"ಮಾತ್ರೆ ಬೇಕು" ಎಂದು ಹೇಳಿ', icon: Sparkles, color: '#9333EA' },
      ]
    },
    {
      level: 3,
      typeTitle: 'Speak & Build — Level 3: Simple Sentences',
      typeTitleKn: 'ಮಾತನಾಡಿ ಮತ್ತು ನಿರ್ಮಿಸಿ — ಹಂತ 3: ಸರಳ ವಾಕ್ಯಗಳು',
      keyTitle: 'level3Name',
      keyDesc: 'level3Desc',
      validationMode: 'sentence',
      items: [
        { id: 's_need_water', label: 'I NEED WATER', labelKn: 'ನನಗೆ ನೀರು ಬೇಕು', target: 'I NEED WATER', targetKn: 'ನನಗೆ ನೀರು ಬೇಕು', keywords: ['i', 'need', 'water', 'ನನಗೆ', 'ನೀರು', 'ಬೇಕು'], hint: 'Say "I NEED WATER"', hintKn: '"ನನಗೆ ನೀರು ಬೇಕು" ಎಂದು ಹೇಳಿ', icon: Droplet, color: '#0284C7' },
        { id: 's_want_food', label: 'I WANT FOOD', labelKn: 'ನನಗೆ ಊಟ ಬೇಕು', target: 'I WANT FOOD', targetKn: 'ನನಗೆ ಊಟ ಬೇಕು', keywords: ['i', 'want', 'food', 'ನನಗೆ', 'ಊಟ', 'ಬೇಕು'], hint: 'Say "I WANT FOOD"', hintKn: '"ನನಗೆ ಊಟ ಬೇಕು" ಎಂದು ಹೇಳಿ', icon: Utensils, color: '#EAB308' },
        { id: 's_need_medicine', label: 'I NEED MEDICINE', labelKn: 'ನನಗೆ ಮಾತ್ರೆ ಬೇಕು', target: 'I NEED MEDICINE', targetKn: 'ನನಗೆ ಮಾತ್ರೆ ಬೇಕು', keywords: ['i', 'need', 'medicine', 'ನನಗೆ', 'ಮಾತ್ರೆ', 'ಬೇಕು'], hint: 'Say "I NEED MEDICINE"', hintKn: '"ನನಗೆ ಮಾತ್ರೆ ಬೇಕು" ಎಂದು ಹೇಳಿ', icon: Sparkles, color: '#9333EA' },
        { id: 's_call_mom', label: 'PLEASE CALL MOM', labelKn: 'ದಯವಿಟ್ಟು ಅಮ್ಮನಿಗೆ ಕರೆ ಮಾಡಿ', target: 'PLEASE CALL MOM', targetKn: 'ದಯವಿಟ್ಟು ಅಮ್ಮನಿಗೆ ಕರೆ ಮಾಡಿ', keywords: ['please', 'call', 'mom', 'ದಯವಿಟ್ಟು', 'ಅಮ್ಮನಿಗೆ', 'ಕರೆ'], hint: 'Say "PLEASE CALL MOM"', hintKn: '"ದಯವಿಟ್ಟು ಅಮ್ಮನಿಗೆ ಕರೆ ಮಾಡಿ" ಎಂದು ಹೇಳಿ', icon: Phone, color: '#DB2777' },
      ]
    },
    {
      level: 4,
      typeTitle: 'Speak & Build — Level 4: Visual Sentences',
      typeTitleKn: 'ಮಾತನಾಡಿ ಮತ್ತು ನಿರ್ಮಿಸಿ — ಹಂತ 4: ದೃಶ್ಯ ವಾಕ್ಯಗಳು',
      keyTitle: 'level4Name',
      keyDesc: 'level4Desc',
      validationMode: 'sentence',
      items: [
        { id: 'v_water', label: 'I NEED WATER', labelKn: 'ನನಗೆ ನೀರು ಬೇಕು', target: 'I NEED WATER', targetKn: 'ನನಗೆ ನೀರು ಬೇಕು', keywords: ['i', 'need', 'water', 'ನನಗೆ', 'ನೀರು', 'ಬೇಕು'], hint: 'Look at empty glass. Say "I NEED WATER"', hintKn: 'ಖಾಲಿ ಲೋಟ ನೋಡಿ. "ನನಗೆ ನೀರು ಬೇಕು" ಎಂದು ಹೇಳಿ', icon: Droplet, color: '#0284C7' },
        { id: 'v_food', label: 'I WANT FOOD', labelKn: 'ನನಗೆ ಊಟ ಬೇಕು', target: 'I WANT FOOD', targetKn: 'ನನಗೆ ಊಟ ಬೇಕು', keywords: ['i', 'want', 'food', 'ನನಗೆ', 'ಊಟ', 'ಬೇಕು'], hint: 'Look at empty plate. Say "I WANT FOOD"', hintKn: 'ಖಾಲಿ ತಟ್ಟೆ ನೋಡಿ. "ನನಗೆ ಊಟ ಬೇಕು" ಎಂದು ಹೇಳಿ', icon: Utensils, color: '#EAB308' },
        { id: 'v_tired', label: 'I AM TIRED', labelKn: 'ನನಗೆ ಆಯಾಸವಾಗಿದೆ', target: 'I AM TIRED', targetKn: 'ನನಗೆ ಆಯಾಸವಾಗಿದೆ', keywords: ['i', 'am', 'tired', 'ನನಗೆ', 'ಆಯಾಸವಾಗಿದೆ', 'ಆಯಾಸ'], hint: 'Say "I AM TIRED"', hintKn: '"ನನಗೆ ಆಯಾಸವಾಗಿದೆ" ಎಂದು ಹೇಳಿ', icon: HelpCircle, color: '#6366F1' },
      ]
    },
    {
      level: 5,
      typeTitle: 'LOOK & RESPOND — 12 Visual Scenarios',
      typeTitleKn: 'ನೋಡಿ ಮತ್ತು ಉತ್ತರಿಸಿ — 12 ದೃಶ್ಯ ಸನ್ನಿವೇಶಗಳು',
      keyTitle: 'level5Name',
      keyDesc: 'level5Desc',
      validationMode: 'scenario',
      items: [
        { id: 'scen_1', promptKey: 'scen1EmptyGlass', category: 'water', label: 'WATER', labelKn: 'ನೀರು', target: 'WATER', targetKn: 'ನೀರು', hint: 'The glass is empty. They need water.', hintKn: 'ಲೋಟ ಖಾಲಿಯಾಗಿದೆ. ಅವರಿಗೆ ನೀರು ಬೇಕು.', icon: Droplet, color: '#0284C7' },
        { id: 'scen_2', promptKey: 'scen2EmptyPlate', category: 'food', label: 'FOOD', labelKn: 'ಊಟ', target: 'FOOD', targetKn: 'ಊಟ', hint: 'The plate is empty. They need food.', hintKn: 'ತಟ್ಟೆ ಖಾಲಿಯಾಗಿದೆ. ಅವರಿಗೆ ಊಟ ಬೇಕು.', icon: Utensils, color: '#EAB308' },
        { id: 'scen_3', promptKey: 'scen3Discomfort', category: 'pain', label: 'PAIN', labelKn: 'ನೋವು', target: 'PAIN', targetKn: 'ನೋವು', hint: 'Holding head in pain. They are in pain.', hintKn: 'ತಲೆನೋವಿನಿಂದ ಬಳಲುತ್ತಿದ್ದಾರೆ. ಅವರಿಗೆ ನೋವಾಗುತ್ತಿದೆ.', icon: AlertTriangle, color: '#DC2626' },
        { id: 'scen_4', promptKey: 'scen4MedicineBottle', category: 'medicine', label: 'MEDICINE', labelKn: 'ಔಷಧಿ', target: 'MEDICINE', targetKn: 'ಔಷಧಿ', hint: 'Holding medicine bottle. They need medicine.', hintKn: 'ಔಷಧದ ಬಾಟಲಿ ಹಿಡಿದಿದ್ದಾರೆ. ಅವರಿಗೆ ಔಷಧಿ ಬೇಕು.', icon: Sparkles, color: '#9333EA' },
        { id: 'scen_5', promptKey: 'scen5CaregiverLeaving', category: 'caregiver', label: 'PLEASE CALL MY CAREGIVER', labelKn: 'ದಯವಿಟ್ಟು ಪಾಲನೆದಾರರನ್ನು ಕರೆಯಿರಿ', target: 'PLEASE CALL MY CAREGIVER', targetKn: 'ದಯವಿಟ್ಟು ಪಾಲನೆದಾರರನ್ನು ಕರೆಯಿರಿ', hint: 'Say "Please call my caregiver."', hintKn: '"ದಯವಿಟ್ಟು ಪಾಲನೆದಾರರನ್ನು ಕರೆಯಿರಿ" ಎಂದು ಹೇಳಿ.', icon: Heart, color: '#DB2777' },
        { id: 'scen_6', promptKey: 'scen6ToiletSign', category: 'toilet', label: 'TOILET', labelKn: 'ಶೌಚಾಲಯ', target: 'TOILET', targetKn: 'ಶೌಚಾಲಯ', hint: 'Restroom sign. They need toilet.', hintKn: 'ಶೌಚಾಲಯದ ಚಿಹ್ನೆ. ಅವರಿಗೆ ಶೌಚಾಲಯ ಬೇಕು.', icon: Info, color: '#16A34A' },
        { id: 'scen_7', promptKey: 'scen7FeelingTiredInBed', category: 'tired', label: 'I AM TIRED', labelKn: 'ನನಗೆ ಆಯಾಸವಾಗಿದೆ', target: 'I AM TIRED', targetKn: 'ನನಗೆ ಆಯಾಸವಾಗಿದೆ', hint: 'In bed tired. Say "I am tired."', hintKn: 'ಹಾಸಿಗೆಯಲ್ಲಿ ಆಯಾಸಗೊಂಡಿದ್ದಾರೆ. "ನನಗೆ ಆಯಾಸವಾಗಿದೆ" ಎಂದು ಹೇಳಿ.', icon: HelpCircle, color: '#6366F1' },
        { id: 'scen_8', promptKey: 'scen8WaitingDoctor', category: 'doctor', label: 'PLEASE CALL DOCTOR', labelKn: 'ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ', target: 'PLEASE CALL DOCTOR', targetKn: 'ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ', hint: 'Waiting for doctor. Say "Call doctor."', hintKn: 'ವೈದ್ಯರಿಗಾಗಿ ಕಾಯುತ್ತಿದ್ದಾರೆ. "ವೈದ್ಯರನ್ನು ಕರೆಯಿರಿ" ಎಂದು ಹೇಳಿ.', icon: UserCheck, color: '#059669' },
        { id: 'scen_9', promptKey: 'scen9HotDay', category: 'hot', label: 'COLD WATER', labelKn: 'ತಣ್ಣೀರು', target: 'COLD WATER', targetKn: 'ತಣ್ಣೀರು', hint: 'Sweating in sun. Say "I need cold water."', hintKn: 'ಬಿಸಿಲಿನಲ್ಲಿ ಬೆವರುತ್ತಿದ್ದಾರೆ. "ತಣ್ಣೀರು ಬೇಕು" ಎಂದು ಹೇಳಿ.', icon: Thermometer, color: '#EAB308' },
        { id: 'scen_10', promptKey: 'scen10ColdDay', category: 'cold', label: 'I AM COLD', labelKn: 'ನನಗೆ ಚಳಿಯಾಗುತ್ತಿದೆ', target: 'I AM COLD', targetKn: 'ನನಗೆ ಚಳಿಯಾಗುತ್ತಿದೆ', hint: 'Shivering in cold. Say "I am cold."', hintKn: 'ಚಳಿಯಲ್ಲಿ ನಡುಗುತ್ತಿದ್ದಾರೆ. "ನನಗೆ ಚಳಿಯಾಗುತ್ತಿದೆ" ಎಂದು ಹೇಳಿ.', icon: CloudSnow, color: '#0284C7' },
        { id: 'scen_11', promptKey: 'scen11FamilyPhoto', category: 'family', label: 'I WANT MY FAMILY', labelKn: 'ನನ್ನ ಕುಟುಂಬ ಬೇಕು', target: 'I WANT MY FAMILY', targetKn: 'ನನ್ನ ಕುಟುಂಬ ಬೇಕು', hint: 'Looking at photo. Say "I want my family."', hintKn: 'ಫೋಟೋ ನೋಡುತ್ತಿದ್ದಾರೆ. "ನನ್ನ ಕುಟುಂಬ ಬೇಕು" ಎಂದು ಹೇಳಿ.', icon: Heart, color: '#DB2777' },
        { id: 'scen_12', promptKey: 'scen12FruitBowl', category: 'apple', label: 'I WANT AN APPLE', labelKn: 'ನನಗೆ ಸೇಬು ಬೇಕು', target: 'I WANT AN APPLE', targetKn: 'ನನಗೆ ಸೇಬು ಬೇಕು', hint: 'Fruit bowl. Say "I want an apple."', hintKn: 'ಹಣ್ಣಿನ ಬೌಲ್. "ನನಗೆ ಸೇಬು ಬೇಕು" ಎಂದು ಹೇಳಿ.', icon: Apple, color: '#DC2626' },
      ]
    },
    {
      level: 6,
      typeTitle: 'Conversational Dialogues',
      typeTitleKn: 'ಸಂಭಾಷಣೆ ಭಾಷಣ',
      keyTitle: 'level6Name',
      keyDesc: 'level6Desc',
      validationMode: 'scenario',
      items: [
        { id: 'c_doctor', promptKey: 'scen8DoctorConsult', category: 'doctor', label: 'I FEEL BETTER', labelKn: 'ನನಗೆ ಗುಣಮುಖವೆನಿಸುತ್ತಿದೆ', target: 'I FEEL BETTER', targetKn: 'ನನಗೆ ಗುಣಮುಖವೆನಿಸುತ್ತಿದೆ', hint: 'Respond to doctor: "I feel better."', hintKn: 'ವೈದ್ಯರಿಗೆ ಉತ್ತರಿಸಿ: "ನನಗೆ ಗುಣಮುಖವೆನಿಸುತ್ತಿದೆ."', icon: UserCheck, color: '#16A34A' },
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

  // Localization helper functions
  const isKn = language === 'kn' || language === 'Kannada';
  const getItemLabel = (item) => (isKn && item?.labelKn ? item.labelKn : (t(item?.label) || item?.label || ''));
  const getItemTarget = (item) => (isKn && item?.targetKn ? item.targetKn : item?.target || '');
  const getItemHint = (item) => (isKn && item?.hintKn ? item.hintKn : item?.hint || '');
  const getLevelTypeTitle = (lvl) => (isKn && lvl?.typeTitleKn ? lvl.typeTitleKn : lvl?.typeTitle || '');

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
    const currentTarget = getItemTarget(item);

    const res = validationService.validateAnswer(rawTranscript, {
      target: currentTarget || getItemLabel(item),
      keywords: item.keywords ? [...item.keywords, currentTarget, item.targetKn].filter(Boolean) : [currentTarget],
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
          hint: getItemHint(item),
        });
        if (speak) speak(t('didNotUnderstand'));
      } else {
        setActFeedback({
          success: false,
          text: isKn
            ? `❌ ೦ ಅಂಕಗಳು. ನಿರೀಕ್ಷಿತ: "${currentTarget}". ${t('movingToNext')}`
            : `❌ 0 Points. Expected: "${currentTarget}". ${t('movingToNext')}`,
          hint: getItemHint(item),
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
                          {getLevelTypeTitle(lvl)}
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
                {getLevelTypeTitle(levelDefinitions.find((l) => l.level === activeLevelNum))}
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
                        {getItemLabel(item)}
                      </h2>
                    </div>

                    {/* ATTEMPT HINTS */}
                    {attemptCount === 2 && (
                      <div style={{ width: '100%', padding: '0.85rem', borderRadius: 14, background: 'rgba(234, 179, 8, 0.12)', border: '1.5px solid #EAB308', color: '#B45309', fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Lightbulb size={20} />
                        <div><strong>{t('attemptHintTitle')}:</strong> {getItemHint(item)}</div>
                      </div>
                    )}

                    {attemptCount === 3 && (
                      <div style={{ width: '100%', padding: '0.85rem', borderRadius: 14, background: 'rgba(2, 132, 199, 0.12)', border: '1.5px solid var(--color-blue-primary)', color: 'var(--color-blue-primary)', fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={20} />
                        <div><strong>{t('attemptHelpTitle')}:</strong> {isKn ? `ಗುರಿಯನ್ನು ಮಾತನಾಡಿ "${getItemTarget(item)}"` : `Speak target "${getItemTarget(item)}"`}</div>
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
                          targetIntent={getItemTarget(item) || getItemLabel(item)}
                          buttonLabel={`🎙️ ${t('tapToSpeak')}`}
                          language={isKn ? 'kn' : 'en'}
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
                    {lastCompletedSummary?.title ? (t(lastCompletedSummary.title) || lastCompletedSummary.title) : (isKn ? `ಹಂತ ${lastCompletedSummary?.levelNum}` : `Level ${lastCompletedSummary?.levelNum}`)}
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
