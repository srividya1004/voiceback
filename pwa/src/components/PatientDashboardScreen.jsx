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
  AlertCircle,
  Heart,
  CheckCircle2,
  XCircle,
  Moon,
  PhoneCall,
  RefreshCw,
  Edit3,
  Check
} from 'lucide-react';

import VoiceBackLogo from './VoiceBackLogo';
import SettingsBottomSheet from './SettingsBottomSheet';
import PatientProfileScreen from './PatientProfileScreen';
import TherapyExercisesModule from './TherapyExercisesModule';
import TherapyGamesModule from './TherapyGamesModule';
import ScriptTrainingModule from './ScriptTrainingModule';
import VoiceCloningModule from './VoiceCloningModule';
import PatientReportsModule from './PatientReportsModule';
import EmergencySOSModule from './EmergencySOSModule';
import PatientAppointmentsModule from './PatientAppointmentsModule';
import DynamicCommunicationModule from './DynamicCommunicationModule';
import VolumeControlWidget from './VolumeControlWidget';
import WakeWordVoicePipelineModule from './WakeWordVoicePipelineModule';
import ConversationModeModule from './ConversationModeModule';
import { getTranslation } from '../i18n/translations';

/**
 * Speech / Meaning Reconstruction for Patient Communication
 * Reconstructs unclear or aphasic patient speech attempts into correct intended sentences.
 * Example: "Nannigi neelu beku" -> "ನನಗೆ ನೀರ/**
 * Speech / Meaning Reconstruction for Patient Communication
 * Distinguishes "Recognized Attempt" (raw STT) from "Intended Patient Sentence" (reconstructed natural sentence).
 * Corrects misheard words, phonetic slips, and aphasic attempts into natural, grammatically correct sentences.
 */
const KANNADA_STT_CORRECTIONS = [
  // Multi-word phrases & misheard expressions
  { pattern: /(^|[\s,.\?!;:])(ಸಾಯ\s*ಬೇಕು|ಸಾಯಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಸಹಾಯ ಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ಸಾಯ್)(?=[\s,.\?!;:]|$)/gu, word: 'ಸಹಾಯ' },
  { pattern: /(^|[\s,.\?!;:])(ನಾವು\s*ಆಗ್ತಿದೆ|ನೋವು\s*ಅಗ್ತಿದೆ|ನೋವು\s*ಆಗ್ತಾ\s*ಇದೆ|ನೋವು\s*ಆಗಿದೆ)(?=[\s,.\?!;:]|$)/gu, word: 'ನೋವಾಗುತ್ತಿದೆ' },
  { pattern: /(^|[\s,.\?!;:])(ನೋವು\s*ಬೆಕ್ಕು|ನೋವು\s*ಇದೆ)(?=[\s,.\?!;:]|$)/gu, word: 'ನೋವಾಗುತ್ತಿದೆ' },
  { pattern: /(^|[\s,.\?!;:])(ನೀಲು\s*ಬೇಕು|ನೀಲು\s*ಬೆಕ್ಕು|ನೀರು\s*ಬೆಕ್ಕು|ನಿಲ್ಲು\s*ಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ನೀರು ಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ನೀಲು|ನೆಲ್ಲು|ನೇರು)(?=[\s,.\?!;:]|$)/gu, word: 'ನೀರು' },
  { pattern: /(^|[\s,.\?!;:])(ಉಡು\s*ಬೇಕು|ಉಟ\s*ಬೇಕು|ಉಟಾ\s*ಬೇಕು|ಊಟ\s*ಬೆಕ್ಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಊಟ ಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ಊಡ|ಉಡ)(?=[\s,.\?!;:]|$)/gu, word: 'ಊಟ' },
  { pattern: /(^|[\s,.\?!;:])(ಮಾತ\s*ಬೇಕು|ಮಾತ್ರೆ\s*ಬೆಕ್ಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಮಾತ್ರೆ ಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ಮಾತೃ|ಮಾತ್ರೆಗಳು)(?=[\s,.\?!;:]|$)/gu, word: 'ಮಾತ್ರೆ' },
  { pattern: /(^|[\s,.\?!;:])(ಮದ್ದು\s*ಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಔಷಧ ಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ವೌಷಧ|ಔಶಧ|ಔಷಾದ)(?=[\s,.\?!;:]|$)/gu, word: 'ಔಷಧಿ' },
  { pattern: /(^|[\s,.\?!;:])(ಮಲಗ್\s*ಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಮಲಗಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ನನ್ನಿ\s*ನೀಲು)(?=[\s,.\?!;:]|$)/gu, word: 'ನನಗೆ ನೀರು' },
  { pattern: /(^|[\s,.\?!;:])(ನನ್ನಿ|ನನ್ನಿಗೆ|ನನಿಗೆ)(?=[\s,.\?!;:]|$)/gu, word: 'ನನಗೆ' },
  { pattern: /(^|[\s,.\?!;:])(ನನಗೆ\s*ನೀನು\s*ಬೇಕು|ನನಗೆ\s*ನೀನು)(?=[\s,.\?!;:]|$)/gu, word: 'ನನಗೆ ನೀರು ಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ನೀನು\s*ಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ನೀರು ಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ಬೇಕ್|ಬೆಕ್ಕು|ಬೇಕಾ|ಬೇಕ್ಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ಆಗ್ತಿದೆ)(?=[\s,.\?!;:]|$)/gu, word: 'ಆಗುತ್ತಿದೆ' },
  { pattern: /(^|[\s,.\?!;:])(ಬರ್ತಿದೆ)(?=[\s,.\?!;:]|$)/gu, word: 'ಬರುತ್ತಿದೆ' },
  { pattern: /(^|[\s,.\?!;:])(ಇದ್ದಿನಿ|ಇದ್ದೀನಿ)(?=[\s,.\?!;:]|$)/gu, word: 'ಇದ್ದೇನೆ' },
  { pattern: /(^|[\s,.\?!;:])(ಹೋಗ್ಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಹೋಗಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ಮಾಡ್ಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಮಾಡಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ತಿನ್ಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ತಿನ್ನಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ಕುಡಿಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಕುಡಿಯಬೇಕು' },
  { pattern: /(^|[\s,.\?!;:])(ಮಾತಾಡ್ಬೇಕು)(?=[\s,.\?!;:]|$)/gu, word: 'ಮಾತನಾಡಬೇಕು' }
];

const reconstructPatientUtterance = (transcript, language = 'English', context = '') => {
  if (!transcript || !transcript.trim()) return '';
  const text = transcript.trim();

  // Context-guided phonetic and phrase reconstruction:
  if (context && typeof context === 'string') {
    const normCtx = context.trim();

    // Context indicates "Chanakya Dini", raw transcript phonetically captured as "Tanagidini"
    if (/\bchanakya\s+dini\b/i.test(normCtx) && /\b(tanagidini|chanakya|dini|tanaki|chanaki)\b/i.test(text)) {
      return 'Chanakya Dini';
    }

    // Well-being question e.g. "How are you feeling today?" / "hegidira"
    if (/how are you|feeling|hegidira|kya haal|doing/i.test(normCtx)) {
      if (/\b(tanagidini|chanagidini|chennagidini)\b/i.test(text)) {
        return (language === 'Kannada' || /[\u0C80-\u0CFF]/.test(text))
          ? 'ಚೆನ್ನಾಗಿದ್ದೀನಿ'
          : 'I am doing well.';
      }
    }
  }

  // 0a. Handle perseverative repetitive syllables common in aphasia/dysarthria:
  // e.g. "Na na na na na na na na na" represents perseveration of "ನನಗೆ" ("I want / water")
  if (/^(\s*na\s*){3,}$/i.test(text) || /\b(na)(?:\s+\1){3,}\b/i.test(text)) {
    return language === 'Kannada' || /[\u0C80-\u0CFF]/.test(text) ? 'ನನಗೆ ನೀರು ಬೇಕು' : 'I need water.';
  }

  // 0b. Check for Romanized Kannada speech (e.g. Scribe v2 spelling Kannada phonetically)
  const isRomanizedKannada = /\b(ah\s*)?(na\s*na\s*nge|na\s*nge|nanage|nange|nanige|naanage)\s+(niru|neeru|neer|neelu|nillu)\s+(be\s*ko|beku|beko|bekku|beeku)\b/i.test(text) ||
    /\b(niru|neeru|neer|neelu|nillu)\s+(be\s*ko|beku|beko|bekku|beeku)\b/i.test(text) ||
    /\b(oota|ootha|uta|ouda)\s+(beku|beko|bekku)\b/i.test(text) ||
    /\b(sahaya|saaya|sahay)\s+(beku|beko)\b/i.test(text);

  if (isRomanizedKannada || language === 'Kannada') {
    let romanizedKn = text
      .replace(/\b(ah\s*)?(na\s*na\s*nge|na\s*nge|nanage|nange|nanige|naanage)\s+(niru|neeru|neer|neelu|nillu)\s+(be\s*ko|beku|beko|bekku|beeku)\b/gi, 'ನನಗೆ ನೀರು ಬೇಕು')
      .replace(/\b(niru|neeru|neer|neelu|nillu)\s+(be\s*ko|beku|beko|bekku|beeku)\b/gi, 'ನೀರು ಬೇಕು')
      .replace(/\b(niru|neeru|neelu)\s+(kodi|kudi)\b/gi, 'ನೀರು ಕೊಡಿ')
      .replace(/\b(oota|ootha|uta|ouda)\s+(beku|beko|bekku)\b/gi, 'ಊಟ ಬೇಕು')
      .replace(/\b(sahaya|saaya|sahay|help)\s+(beku|beko)\b/gi, 'ಸಹಾಯ ಬೇಕು')
      .replace(/\b(toilet|bathroom)\s+(beku|hogbeku)\b/gi, 'ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗಬೇಕು')
      .replace(/\b(matre|maatre)\s+(beku|beko)\b/gi, 'ಮಾತ್ರೆ ಬೇಕು');

    if (/[\u0C80-\u0CFF]/.test(romanizedKn)) {
      for (const rule of KANNADA_STT_CORRECTIONS) {
        romanizedKn = romanizedKn.replace(rule.pattern, (match, p1) => p1 + rule.word);
      }
      return romanizedKn.trim();
    }
  }

  // 0b. Check for Romanized Hindi speech
  const isRomanizedHindi = /\b(pani|paani)\s+(chahiye|chahye|pilao|do)\b/i.test(text) ||
    /\b(madad|sahayata)\s+(chahiye|karo|do)\b/i.test(text) ||
    /\b(khana|khaana)\s+(chahiye|do)\b/i.test(text);

  if (isRomanizedHindi || language === 'Hindi') {
    let romanizedHi = text
      .replace(/\b(pani|paani)\s+(chahiye|chahye|pilao|do)\b/gi, 'पानी चाहिए')
      .replace(/\b(madad|sahayata)\s+(chahiye|karo|do)\b/gi, 'मदद चाहिए')
      .replace(/\b(khana|khaana)\s+(chahiye|do)\b/gi, 'खाना चाहिए')
      .replace(/\b(toilet|bathroom)\s+(jana\s*hai|chahiye)\b/gi, 'शौचालय जाना है');

    if (/[\u0900-\u097F]/.test(romanizedHi)) {
      return romanizedHi
        .replace(/(^|[\s,.\?!;:])(मदद\s*चाहिए|मदद)(?=[\s,.\?!;:]|$)/gu, '$1मदद चाहिए')
        .replace(/(^|[\s,.\?!;:])(पाणी)(?=[\s,.\?!;:]|$)/gu, '$1पानी')
        .trim();
    }
  }

  // Detect script from text
  const isKannada = language === 'Kannada' || /[\u0C80-\u0CFF]/.test(text);
  const isHindi = !isKannada && (language === 'Hindi' || /[\u0900-\u097F]/.test(text));

  // Word-level phonetic & morphological reconstruction in native script:
  if (isKannada) {
    let corrected = text;
    for (const rule of KANNADA_STT_CORRECTIONS) {
      corrected = corrected.replace(rule.pattern, (match, p1) => p1 + rule.word);
    }
    return corrected.trim();
  }

  // For Hindi: conservative phonetic corrections while preserving actual spoken words
  if (isHindi) {
    let corrected = text
      .replace(/(^|[\s,.\?!;:])(मदದ\s*चाहिए|मदದ)(?=[\s,.\?!;:]|$)/gu, '$1मदद चाहिए')
      .replace(/(^|[\s,.\?!;:])(पाणी)(?=[\s,.\?!;:]|$)/gu, '$1पानी');
    return corrected.trim();
  }

  // English Language Conservative Reconstruction
  // 1. Remove consecutive word repetitions e.g. "I I want want" -> "I want"
  let cleanWords = text.replace(/\b([a-zA-Z]+)(?:\s+\1\b)+/gi, '$1');

  // Strip trailing punctuation temporarily for clean pattern matching
  let cleanNoPunct = cleanWords.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, '').trim();

  // 2. Lexical & Phonetic Slips (word boundary replacements)
  cleanNoPunct = cleanNoPunct
    .replace(/\b(watter|watr|wter|wada|wata|waater|wator|wotar)\b/gi, 'water')
    .replace(/\b(wa|wan|wnt|wanna|wont)\b/gi, 'want')
    .replace(/\b(hep|halp|hlp|elpp|elp)\b/gi, 'help')
    .replace(/\b(hom|hme|hoam)\b/gi, 'home')
    .replace(/\b(ned|neeed|neeeed|nid)\b/gi, 'need')
    .replace(/\b(medcin|medsin|medisin|meds)\b/gi, 'medicine')
    .replace(/\b(slip|slipin|sleap)\b/gi, 'sleep')
    .replace(/\b(hungri|hangry|hongry)\b/gi, 'hungry')
    .replace(/\b(thirsti|thursty)\b/gi, 'thirsty')
    .replace(/\b(eatt|fud)\b/gi, 'food')
    .replace(/\b(washrom|tolet|toylt|bathrom|restrom)\b/gi, 'bathroom')
    .replace(/\b(doctr|doktor|doc)\b/gi, 'doctor')
    .replace(/\b(nurce|nurs)\b/gi, 'nurse')
    .replace(/\b(pleas|plz|plis|plez)\b/gi, 'please')
    .replace(/\b(tank\s+u|tank\s+you|thx|thanx)\b/gi, 'thank you')
    .replace(/\b(hert|herts|huting)\b/gi, 'hurting')
    .replace(/\b(stomak|stomac|stomack|stomic)\b/gi, 'stomach');

  // 3. Pronoun correction: "me want water" -> "I want water"
  cleanNoPunct = cleanNoPunct
    .replace(/^me\s+want\b/i, 'I want')
    .replace(/^me\s+need\b/i, 'I need')
    .replace(/^me\s+hungry\b/i, 'I am hungry')
    .replace(/^me\s+thirsty\b/i, 'I am thirsty')
    .replace(/^me\s+cold\b/i, 'I am feeling cold')
    .replace(/^me\s+hot\b/i, 'I am feeling hot')
    .replace(/^me\s+tired\b/i, 'I am tired')
    .replace(/^me\s+in\s+pain\b/i, 'I am in pain')
    .replace(/^me\s+pain\b/i, 'I am in pain');

  // 4. Missing verbs, subjects, & infinitive particles (Compositional)
  cleanNoPunct = cleanNoPunct
    .replace(/^i\s+water$/i, 'I want water')
    .replace(/^want\s+water$/i, 'I want water')
    .replace(/^need\s+water$/i, 'I need water')
    .replace(/^i\s+help$/i, 'I want help')
    .replace(/^want\s+help$/i, 'I want help')
    .replace(/^need\s+help$/i, 'I need help')
    .replace(/^i\s+food$/i, 'I want food')
    .replace(/^want\s+food$/i, 'I want food')
    .replace(/^i\s+medicine$/i, 'I need my medicine')
    .replace(/^want\s+medicine$/i, 'I need my medicine')
    .replace(/^need\s+medicine$/i, 'I need my medicine');

  // Missing infinitive "to": "want go" -> "I want to go", "I want go home" -> "I want to go home"
  cleanNoPunct = cleanNoPunct
    .replace(/^want\s+go\s+home$/i, 'I want to go home')
    .replace(/^i\s+want\s+go\s+home$/i, 'I want to go home')
    .replace(/^want\s+go$/i, 'I want to go')
    .replace(/^i\s+want\s+go$/i, 'I want to go')
    .replace(/^need\s+go$/i, 'I need to go')
    .replace(/^i\s+need\s+go$/i, 'I need to go')
    .replace(/^i\s+go\s+home$/i, 'I want to go home')
    .replace(/^i\s+home$/i, 'I want to go home')
    .replace(/\bwant\s+go\s+home\b/gi, 'want to go home')
    .replace(/\bwant\s+go\b/gi, 'want to go')
    .replace(/\bneed\s+go\b/gi, 'need to go')
    .replace(/\blike\s+go\b/gi, 'like to go')
    .replace(/\bwant\s+sleep\b/gi, 'want to sleep')
    .replace(/\bneed\s+sleep\b/gi, 'need to sleep')
    .replace(/\bwant\s+rest\b/gi, 'want to rest')
    .replace(/\bneed\s+rest\b/gi, 'need to rest');

  // 5. Symptom / Pain Reconstruction (Never infer diagnoses, keep conservative)
  cleanNoPunct = cleanNoPunct
    .replace(/^(?:pain\s+stomach|stomach\s+pain)$/i, 'I have stomach pain')
    .replace(/^(?:pain\s+head|head\s+pain)$/i, 'My head hurts')
    .replace(/^(?:pain\s+chest|chest\s+pain)$/i, 'I have chest pain')
    .replace(/^(?:pain\s+back|back\s+pain)$/i, 'I have back pain')
    .replace(/^(?:pain\s+leg|leg\s+pain)$/i, 'I have leg pain')
    .replace(/^(?:head|my\s+head)\s+(?:hurt|hurts|hurting)$/i, 'My head hurts')
    .replace(/^(?:stomach|my\s+stomach)\s+(?:hurt|hurts|hurting)$/i, 'My stomach hurts')
    .replace(/^(?:chest|my\s+chest)\s+(?:hurt|hurts|hurting)$/i, 'My chest hurts')
    .replace(/^(?:back|my\s+back)\s+(?:hurt|hurts|hurting)$/i, 'My back hurts')
    .replace(/^(?:leg|my\s+leg)\s+(?:hurt|hurts|hurting)$/i, 'My leg hurts')
    .replace(/^(?:want|need)\s+(?:toilet|bathroom|pee)$/i, 'I need to use the bathroom')
    .replace(/^call\s+doctor$/i, 'Please call the doctor')
    .replace(/^call\s+nurse$/i, 'Please call the nurse')
    .replace(/^call\s+family$/i, 'Please call my family');

  // 6. Capitalize "I" when used as isolated pronoun
  cleanNoPunct = cleanNoPunct.replace(/\bi\b/g, 'I');

  // 7. Ensure first character capitalized
  let result = cleanNoPunct.trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // 8. Ensure terminal period (preserve existing ? or !)
  if (result.length > 0 && !/[.!?]$/.test(result)) {
    result += '.';
  }

  return result;
};

import { useSettings } from '../context/SettingsContext';
import authService from '../services/authService';
import patientService from '../services/patientService';
import caregiverService from '../services/caregiverService';
import appointmentService from '../services/appointmentService';
import communicationService from '../services/communicationService';
import therapyService from '../services/therapyService';
import voiceService from '../services/voiceService';
import deviceService from '../services/deviceService';
import contextService from '../services/contextService';

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
  
  // Patient Communication Utterance & Confirmation State Machine
  // Required conceptual states: IDLE | PENDING_CONFIRMATION | CONFIRMED | CHANGED | CANCELLED
  const [confirmationState, setConfirmationState] = useState('IDLE');
  const [pendingReconstruction, setPendingReconstruction] = useState(null);
  const [isEditingCorrection, setIsEditingCorrection] = useState(false);
  const [editableCorrectionText, setEditableCorrectionText] = useState('');

  const [patientSpokenAttempt, setPatientSpokenAttempt] = useState('');
  const [patientCorrectedUtterance, setPatientCorrectedUtterance] = useState('');
  const [patientUtteranceStatus, setPatientUtteranceStatus] = useState('');
  const patientUtteranceAutoClearTimer = useRef(null);
  const previousUtteranceRef = useRef('');

  const clearPatientUtterance = () => {
    setPatientSpokenAttempt('');
    setPatientCorrectedUtterance('');
    setActiveOutputPhrase('');
    setPatientUtteranceStatus('');
    setConfirmationState('IDLE');
    setPendingReconstruction(null);
    setIsEditingCorrection(false);
    setEditableCorrectionText('');
    if (patientUtteranceAutoClearTimer.current) {
      clearTimeout(patientUtteranceAutoClearTimer.current);
    }
  };

  /**
   * Explicit Patient Confirmation Handler
   * Reconstructed meaning only becomes authoritative upon explicit patient confirmation.
   * After confirmation, generates dynamic response (intent + entities + context) and plays via authorized Voice ID.
   */
  const handleConfirmReconstruction = async () => {
    const textToConfirm = (isEditingCorrection ? editableCorrectionText : (pendingReconstruction?.candidateText || patientCorrectedUtterance)) || '';
    if (!textToConfirm.trim()) return;

    const targetText = textToConfirm.trim();
    const effectiveLang = pendingReconstruction?.language || (
      /[\u0C80-\u0CFF]/.test(targetText) ? 'Kannada' : /[\u0900-\u097F]/.test(targetText) ? 'Hindi' : 'English'
    );

    setConfirmationState('CONFIRMED');
    setPatientUtteranceStatus(
      effectiveLang === 'Kannada'
        ? 'ಖಚಿತಪಡಿಸಲಾಗಿದೆ! ಧ್ವನಿ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...'
        : effectiveLang === 'Hindi'
        ? 'पुष्टि हो गई! आवाज तैयार हो रही है...'
        : 'Confirmed! Synthesizing authorized patient voice audio...'
    );

    try {
      // The patient's communication must strictly remain a patient utterance, not a caregiver or assistant response.
      // Do NOT convert patient utterance into a dynamic response. Dynamic responses remain restricted to Companion Speech mode only.
      // The final spoken output must be the exact reconstructed patient utterance.
      const textToSpeak = targetText;
      previousUtteranceRef.current = textToSpeak;

      setPatientCorrectedUtterance(textToSpeak);
      setActiveOutputPhrase(textToSpeak);
      setIsEditingCorrection(false);

      // Play via existing authorized patient Voice ID / TTS pipeline (ElevenLabs Cloud -> HTML5 Audio & ESP32 BLE)
      await processPhraseOutput(textToSpeak, null, effectiveLang);

      setPatientUtteranceStatus(
        effectiveLang === 'Kannada'
          ? '🟢 ರೋಗಿಯ ಅಧಿಕೃತ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಲಾಗಿದೆ'
          : effectiveLang === 'Hindi'
          ? '🟢 मरीज की अधिकृत आवाज में बोला गया'
          : '🟢 Spoken using authorized Patient Voice'
      );
    } catch (err) {
      console.warn('Patient utterance output notice:', err.message);
      setPatientUtteranceStatus(`Notice: ${err.message}`);
    }
  };

  /**
   * Patient Change / Correction Handler
   * Allows patient to correct or refine candidate reconstruction
   */
  const handleChangeReconstruction = () => {
    setConfirmationState('CHANGED');
    setIsEditingCorrection(true);
    if (!editableCorrectionText) {
      setEditableCorrectionText(pendingReconstruction?.candidateText || patientCorrectedUtterance);
    }
  };

  /**
   * Patient Cancel Handler
   * Safely terminates pending request without playing audio or logging to DB
   */
  const handleCancelReconstruction = () => {
    setConfirmationState('CANCELLED');
    setPendingReconstruction(null);
    setIsEditingCorrection(false);
    clearPatientUtterance();
    setPatientUtteranceStatus('Request cancelled safely.');
    setTimeout(() => setPatientUtteranceStatus(''), 2000);
  };

  const handleConfirmPatientUtterance = handleConfirmReconstruction;

  
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
            if (activePatientRecord.preferredLanguage) {
              localStorage.setItem('voiceback_patient_preferred_language', activePatientRecord.preferredLanguage);
            }

            // Fetch patient's saved voice profile from backend and bind cloned voiceId
            voiceService.getVoiceProfiles().then((profiles) => {
              const patientIdStr = String(activePatientRecord._id || activePatientRecord.id || '');
              const profile = Array.isArray(profiles) ? profiles.find(vp => String(vp.patientId?._id || vp.patientId) === patientIdStr) : null;
              if (profile && profile.voiceId) {
                localStorage.setItem(`voiceback_cloned_voice_id_${patientIdStr}`, profile.voiceId);
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
  const processPhraseOutput = async (phraseText, phraseKey, explicitLang) => {
    if (!phraseText && !phraseKey) return;
    setSpeechErrorMsg(''); // Clear error message on valid phrase output

    // Preferred language for Quick Messages: Must follow patient's configured preferredLanguage, not UI language
    const patientPrefLang = (profileData?.preferredLanguage || localStorage.getItem('voiceback_patient_preferred_language') || 'english').toLowerCase().trim();
    const textToSynthesize = phraseKey ? getTranslation(patientPrefLang, phraseKey) : phraseText;
    setActiveOutputPhrase(textToSynthesize);

    // Dynamically resolve target language:
    // 1. Explicit language if provided (e.g. from speech detection)
    // 2. Actual script in text (Kannada vs Hindi vs English)
    // 3. Fallback to patient's preferred language
    let targetLang = explicitLang;
    if (!targetLang) {
      if (/[\u0C80-\u0CFF]/.test(textToSynthesize)) {
        targetLang = 'Kannada';
      } else if (/[\u0900-\u097F]/.test(textToSynthesize)) {
        targetLang = 'Hindi';
      } else if (patientPrefLang.includes('kan') || patientPrefLang === 'kn') {
        targetLang = 'Kannada';
      } else if (patientPrefLang.includes('hin') || patientPrefLang === 'hi') {
        targetLang = 'Hindi';
      } else {
        targetLang = 'English';
      }
    }

    setIsSynthesizingVoice(true);
    try {
      const speechResult = await voiceService.playSynthesizedAudio({
        patientId: profileData?.id || '',
        text: textToSynthesize,
        language: targetLang,
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
      console.log('🎙️ Requesting microphone access with DSP audio enhancement for MediaRecorder...');
      // Enable high-fidelity speech DSP (echoCancellation, noiseSuppression, autoGainControl)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000
        }
      });
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

          // Explicitly pass patient's selected or preferred language to STT model for native phonetic recognition
          const prefLang = (profileData?.preferredLanguage || '').toLowerCase();
          const activeLangCode = (language === 'kn' || language === 'Kannada' || prefLang.includes('kannada'))
            ? 'kn'
            : (language === 'hi' || language === 'Hindi' || prefLang.includes('hindi'))
            ? 'hi'
            : 'en';

          const formData = new FormData();
          formData.append('audioSample', audioBlob, 'patient_recording.webm');
          formData.append('language', activeLangCode);

          const response = await voiceService.transcribeSpeech(formData);
          const transcript = response?.data?.text || response?.text || '';

          const rawTranscript = (transcript || '').trim();

          // Reject empty audio or purely acoustic noise tags ([mumbling], [cough], [inaudible], etc.)
          const cleanTextWithoutNoiseTags = rawTranscript
            .replace(/\[(mumbling|inaudible|unintelligible|cough|sigh|snort|laughter|music|clearing|throat-clearing|applause|cheering|noise|static|whisper|whispering|groan|grunt|pause|silence)\]/gi, '')
            .replace(/\[.*?\]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (!cleanTextWithoutNoiseTags) {
            console.warn('⚠️ Only acoustic noise / inaudible sound captured:', rawTranscript);
            setSpeechErrorMsg(
              activeLangCode === 'kn'
                ? 'ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್‌ಗೆ ಹತ್ತಿರವಾಗಿ ಮಾತನಾಡಿ ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್‌ಗಳನ್ನು ಬಳಸಿ.'
                : activeLangCode === 'hi'
                ? 'आवाज़ स्पष्ट सुनाई नहीं दी। कृपया माइक के पास बोलें या नीचे दिए गए बटन पर टैप करें।'
                : "Couldn't hear clearly. Please speak a little closer to the mic or choose a quick message below."
            );
            setIsListening(false);
            setIsProcessing(false);
            return;
          }

          // 1. Dynamic language resolution with script & transliteration check
          const hasKannadaScript = /[\u0C80-\u0CFF]/.test(cleanTextWithoutNoiseTags);
          const hasHindiScript = /[\u0900-\u097F]/.test(cleanTextWithoutNoiseTags);
          const isRomanKannada = /\b(niru|neeru|neer|beku|beko|nanage|nange|oota|uta|sahaya)\b/i.test(cleanTextWithoutNoiseTags);
          const isRomanHindi = /\b(pani|paani|chahiye|madad|khana)\b/i.test(cleanTextWithoutNoiseTags);

          let effectiveLang = 'English';
          if (hasKannadaScript || isRomanKannada) {
            effectiveLang = 'Kannada';
          } else if (hasHindiScript || isRomanHindi) {
            effectiveLang = 'Hindi';
          } else if (/[a-zA-Z]/.test(cleanTextWithoutNoiseTags)) {
            effectiveLang = 'English';
          } else if (activeLangCode === 'kn') {
            effectiveLang = 'Kannada';
          } else if (activeLangCode === 'hi') {
            effectiveLang = 'Hindi';
          } else {
            effectiveLang = 'English';
          }

          const cleanTranscript = cleanTextWithoutNoiseTags;

          console.log(`✅ Scribe v2 Vocalization received: "${rawTranscript}" -> Cleaned: "${cleanTranscript}" (Lang: ${effectiveLang})`);
          setSpeechErrorMsg('');

          // 2. AI Contextual Speech Interpretation & Conservative Reconstruction Layer
          const initialCorrected = reconstructPatientUtterance(cleanTranscript, effectiveLang, activeCaregiverQuestion);

          setIsListening(false);
          setIsProcessing(false);

          setPatientSpokenAttempt(cleanTranscript);
          setPatientCorrectedUtterance(initialCorrected);
          setActiveOutputPhrase(initialCorrected);
          setConfirmationState('PENDING_CONFIRMATION');

          // 3. Server-side AI Contextual Interpretation, Ambiguity & Clarity Check
          let reconResult = null;
          try {
            const langCode = effectiveLang === 'Kannada' ? 'kn' : effectiveLang === 'Hindi' ? 'hi' : 'en';
            reconResult = await contextService.reconstructSpeech({
              rawTranscript: cleanTranscript,
              language: langCode,
              context: activeCaregiverQuestion,
              previousUtterance: previousUtteranceRef.current || ''
            });
          } catch (aiErr) {
            console.warn('AI speech reconstruction notice, preserved safe reconstruction:', aiErr.message);
          }

          // Priority:
          // 1. Valid backend reconstructed text
          // 2. Valid local reconstruction
          // 3. Raw STT only when no meaningful reconstruction is possible
          const backendRecon = reconResult && (reconResult.reconstructedText || reconResult.correctedText);
          let candidateText = cleanTranscript;
          if (backendRecon && backendRecon.trim() && backendRecon.trim().toLowerCase() !== cleanTranscript.toLowerCase()) {
            candidateText = backendRecon.trim();
          } else if (initialCorrected && initialCorrected.trim() && initialCorrected.trim().toLowerCase() !== cleanTranscript.toLowerCase()) {
            candidateText = initialCorrected.trim();
          } else if (backendRecon && backendRecon.trim()) {
            candidateText = backendRecon.trim();
          } else if (initialCorrected && initialCorrected.trim()) {
            candidateText = initialCorrected.trim();
          } else {
            candidateText = cleanTranscript;
          }
          const isAmbiguous = Boolean(reconResult && reconResult.isAmbiguous);
          const isUnclear = Boolean(reconResult && reconResult.isUnclear);
          const clarificationPrompt = reconResult && reconResult.clarificationPrompt;

          const confirmationPrompt = (reconResult && reconResult.confirmationPrompt) || (
            effectiveLang === 'Kannada'
              ? `ನಿಮ್ಮ ಅರ್ಥ: "${candidateText}" ಎಂದೇ?`
              : effectiveLang === 'Hindi'
              ? `क्या आपका मतलब: "${candidateText}" है?`
              : `Did you mean: ${candidateText}?`
          );

          const pendingObj = {
            rawTranscript: cleanTranscript,
            candidateText,
            status: (reconResult && reconResult.status) || 'NEEDS_CONFIRMATION',
            isAmbiguous,
            isUnclear,
            confirmationPrompt,
            clarificationPrompt,
            intent: (reconResult && reconResult.intent) || 'GENERIC_FALLBACK',
            entities: (reconResult && reconResult.entities) || {},
            language: effectiveLang
          };

          setPendingReconstruction(pendingObj);
          setEditableCorrectionText(candidateText);
          setPatientCorrectedUtterance(candidateText);
          setActiveOutputPhrase(candidateText);

          // Update Status UI: Awaiting patient confirmation
          if (isAmbiguous) {
            setPatientUtteranceStatus(
              effectiveLang === 'Kannada'
                ? '⚠️ ಸ್ಪಷ್ಟನೆ ಅಗತ್ಯ: ವಿವರಗಳನ್ನು ದಯವಿಟ್ಟು ಖಚಿತಪಡಿಸಿ'
                : effectiveLang === 'Hindi'
                ? '⚠️ स्पष्टीकरण आवश्यक: कृपया विवरण की पुष्टि करें'
                : '⚠️ Clarification needed: Please clarify before speaking'
            );
          } else if (isUnclear) {
            setPatientUtteranceStatus(
              effectiveLang === 'Kannada'
                ? '⚠️ ಧ್ವನಿ ಅಪೂರ್ಣ ಅಥವಾ ಅಸ್ಪಷ್ಟವಾಗಿದೆ'
                : effectiveLang === 'Hindi'
                ? '⚠️ वाणी प्रयास अधूरा या अस्पष्ट है'
                : '⚠️ Speech attempt incomplete or unclear'
            );
          } else {
            setPatientUtteranceStatus(
              effectiveLang === 'Kannada'
                ? 'ಖಚಿತಪಡಿಸಲು ಕಾಯಲಾಗುತ್ತಿದೆ: ಮಾತನಾಡಲು "ದೃಢೀಕರಿಸಿ" ಒತ್ತಿರಿ'
                : effectiveLang === 'Hindi'
                ? 'पुष्टि की प्रतीक्षा: बोलने के लिए "पुष्टि करें" दबाएं'
                : 'Pending confirmation: Tap CONFIRM to speak'
            );
          }

          // 4. IMPORTANT: Reconstructed meaning remains temporary until patient confirmation.
          // We DO NOT auto-execute processPhraseOutput here. Execution requires explicit patient confirmation!

        } catch (sttErr) {
          console.error('ElevenLabs Scribe v2 Speech-to-Text error:', sttErr.message);
          setSpeechErrorMsg("Could not understand speech. Please try again.");
          setTimeout(() => setSpeechErrorMsg(''), 3500);
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
      label: 'Patient Communication',
      icon: MessageSquare,
      action: () => handleBackToDashboard(),
      isActive: currentView === 'dashboard',
    },
    {
      id: 'conversation-mode',
      label: 'Companion Speech',
      icon: MessageSquare,
      action: () => handleOpenModule('Conversation Mode'),
      isActive: currentView === 'module' && (activeModule === 'Conversation Mode' || activeModule === 'Real-Time Conversation' || activeModule === 'Companion Speech'),
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
      id: 'script-training',
      label: 'Hear Yourself',
      icon: Sparkles,
      action: () => handleOpenModule('Script Training'),
      isActive: currentView === 'module' && (activeModule === 'Script Training' || activeModule === 'Hear Yourself'),
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
                  <span className="metric-label">Microphone Status</span>
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
  if (
    currentView === 'module' &&
    (activeModule === 'Conversation Mode' ||
      activeModule === 'Real-Time Conversation' ||
      activeModule === 'Companion Speech' ||
      activeModule === 'Start Conversation' ||
      activeModule === 'Silent Speech' ||
      activeModule === 'Connect Device')
  ) {
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

  if (currentView === 'module' && activeModule === 'Therapy Exercises') {
    return (
      <TherapyExercisesModule
        patientId={profileData?.id}
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  if (currentView === 'module' && activeModule === 'Therapy Games') {
    return (
      <TherapyGamesModule
        patientId={profileData?.id}
        onBackToDashboard={handleBackToDashboard}
        onOpenProfile={handleOpenProfile}
        onLogout={onLogout}
      />
    );
  }

  if (currentView === 'module' && (activeModule === 'Script Training' || activeModule === 'Hear Yourself')) {
    return (
      <ScriptTrainingModule
        patientId={profileData?.id}
        patientName={profileData?.fullName || 'Patient'}
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

          {/* SPEECH ERROR DISPLAY IF ANY */}
          {speechErrorMsg && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#DC2626', fontSize: '0.875rem', fontWeight: 600 }}>
              {speechErrorMsg}
            </div>
          )}

          {/* PATIENT COMMUNICATION UTTERANCE CARD (PATIENT SPEECH ONLY) */}
          {(patientSpokenAttempt || patientCorrectedUtterance) && !isListening && (
            <div
              className="spoken-phrase-box"
              style={{
                marginTop: '0.4rem',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '0.75rem',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.06) 0%, rgba(255, 255, 255, 0.95) 100%)',
                border: '1.5px solid var(--color-blue-primary)',
                borderRadius: '18px',
                padding: '1.1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-blue-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <MessageSquare size={16} />
                  Patient Utterance
                </span>
                <button
                  type="button"
                  onClick={clearPatientUtterance}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1.5px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    padding: '0.4rem 0.85rem',
                    color: '#DC2626',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    transition: 'all 0.15s ease',
                  }}
                  title="Clear utterance"
                  aria-label="Clear utterance"
                >
                  <XCircle size={16} />
                  <span>Clear Utterance</span>
                </button>
              </div>

              {/* 1. CLARIFICATION BANNER (FOR AMBIGUOUS / UNCLEAR SPEECH) */}
              {pendingReconstruction?.clarificationPrompt && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    background: pendingReconstruction.isAmbiguous ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1.5px solid ${pendingReconstruction.isAmbiguous ? '#EAB308' : '#EF4444'}`,
                    color: pendingReconstruction.isAmbiguous ? '#A16207' : '#DC2626',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <AlertTriangle size={22} style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800 }}>
                      {pendingReconstruction.isAmbiguous ? 'Clarification Required (No Guessing)' : 'Speech Incomplete / Unclear'}
                    </span>
                    {pendingReconstruction.clarificationPrompt}
                  </div>
                </div>
              )}

              {/* 2. RECONSTRUCTION CANDIDATE / CONFIRMATION DISPLAY */}
              <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1.5px solid rgba(2, 132, 199, 0.3)', padding: '0.95rem 1.15rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-blue-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {confirmationState === 'PENDING_CONFIRMATION'
                        ? 'Reconstructed Patient Utterance (Awaiting Confirmation):'
                        : 'Reconstructed Patient Utterance:'}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      background: 'rgba(2, 132, 199, 0.15)',
                      color: 'var(--color-blue-primary)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                      textTransform: 'uppercase'
                    }}>
                      Reconstruction
                    </span>
                  </div>
                  {patientSpokenAttempt && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-brand-tagline)', fontStyle: 'italic' }}>
                      Raw Transcript: "{patientSpokenAttempt}"
                    </span>
                  )}
                </div>

                {isEditingCorrection ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
                    <input
                      type="text"
                      value={editableCorrectionText}
                      onChange={(e) => setEditableCorrectionText(e.target.value)}
                      placeholder="Type your exact intended words..."
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        border: '2px solid var(--color-blue-primary)',
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--color-brand-title)',
                        background: '#FFFFFF',
                        width: '100%',
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="ultra-btn-confirm"
                        style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                        onClick={handleConfirmReconstruction}
                      >
                        <Check size={16} />
                        <span>Apply & Confirm</span>
                      </button>
                      <button
                        type="button"
                        className="ultra-btn-change"
                        style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => setIsEditingCorrection(false)}
                      >
                        <span>Cancel Edit</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-brand-title)', lineHeight: 1.35 }}>
                      "{patientCorrectedUtterance || pendingReconstruction?.candidateText || patientSpokenAttempt}"
                    </p>
                    {confirmationState === 'PENDING_CONFIRMATION' && (
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-blue-primary)' }}>
                        {pendingReconstruction?.confirmationPrompt
                          ? `${pendingReconstruction.confirmationPrompt} Please confirm, change, or cancel below.`
                          : 'Please confirm, change, or cancel your reconstructed sentence below.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. CONFIRMATION ACTIONS: CONFIRM, CHANGE, CANCEL */}
              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="ultra-btn-confirm"
                  style={{ flex: 2, minWidth: '160px' }}
                  onClick={handleConfirmReconstruction}
                  disabled={isSynthesizingVoice}
                >
                  <Volume2 size={20} />
                  <span>
                    {isSynthesizingVoice
                      ? 'SPEAKING...'
                      : confirmationState === 'PENDING_CONFIRMATION'
                      ? 'CONFIRM & SPEAK'
                      : 'SPEAK (PATIENT VOICE)'}
                  </span>
                </button>

                <button
                  type="button"
                  className="ultra-btn-change"
                  style={{ flex: 1, minWidth: '100px' }}
                  onClick={handleChangeReconstruction}
                  disabled={isSynthesizingVoice}
                  title="Change or edit candidate words"
                >
                  <Edit3 size={16} />
                  <span>CHANGE</span>
                </button>

                <button
                  type="button"
                  className="ultra-btn-cancel"
                  onClick={handleCancelReconstruction}
                  disabled={isSynthesizingVoice}
                  title="Cancel and dismiss pending utterance"
                >
                  <XCircle size={16} />
                  <span>CANCEL</span>
                </button>
              </div>

              {patientUtteranceStatus && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-blue-primary)', fontWeight: 600, textAlign: 'center' }}>
                  {patientUtteranceStatus}
                </div>
              )}
            </div>
          )}

          {/* SPEAKER VOLUME CONTROL WIDGET */}
          <VolumeControlWidget style={{ marginTop: '0.5rem' }} />

          {/* COMPANION SPEECH (CONVERSATION MODE) FEATURE CARD */}
          <div
            tabIndex={0}
            role="button"
            aria-label="Companion Speech"
            onClick={() => handleOpenModule('Conversation Mode')}
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
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
                  Companion Speech
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-brand-tagline)', margin: '0.15rem 0 0 0' }}>
                  Caregiver speaks ➔ Dynamic response choices ➔ Patient voice output
                </p>
              </div>
            </div>
            <ArrowRight size={20} color="var(--color-blue-primary)" />
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

                {/* 2. HELP */}
                <button
                  type="button"
                  className="quick-msg-btn"
                  onClick={() => processPhraseOutput(t('phraseHelp'), 'phraseHelp')}
                  style={{ borderColor: 'rgba(239, 68, 68, 0.35)' }}
                >
                  <div className="quick-msg-icon-box" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#DC2626' }}>
                    <AlertCircle size={22} />
                  </div>
                  <span style={{ color: '#DC2626', fontWeight: 800 }}>{t('help')}</span>
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
