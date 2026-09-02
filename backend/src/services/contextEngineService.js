/**
 * VoiceBack Phase C - Context Engine Service
 * Handles LLM contextual reasoning (via Gemini API) and deterministic local fallbacks
 * to generate dynamic, patient-friendly response options with language-independent semantic intents.
 * Includes script validation and a canonical semantic-intent normalization layer.
 */

const axios = require('axios');
const nlpProcessorService = require('./nlpProcessorService');

/**
 * Script contamination validator
 * Ensures output text uses strictly expected script for the target language.
 */
const validateLanguageScript = (text, language = 'en') => {
  if (!text || typeof text !== 'string') return false;

  const devanagariPattern = /[\u0900-\u097F]/;
  const kannadaPattern = /[\u0C80-\u0CFF]/;
  const foreignScriptPattern = /[\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF]/; // Korean / CJK

  if (language === 'kn') {
    // Kannada script check — ensure it contains Kannada characters or valid punctuation
    if (foreignScriptPattern.test(text)) return false;
    return kannadaPattern.test(text) || /[a-zA-Z0-9]/.test(text);
  }

  if (language === 'hi') {
    // Hindi Devanagari script check
    if (foreignScriptPattern.test(text)) return false;
    return devanagariPattern.test(text) || /[a-zA-Z0-9]/.test(text);
  }

  if (language === 'en') {
    if (devanagariPattern.test(text) || kannadaPattern.test(text) || foreignScriptPattern.test(text)) {
      return false;
    }
    return true;
  }

  return true;
};

/**
 * Canonical Semantic Intent Mapping Table
 * Maps raw/provider intent strings and context text to canonical, language-independent semantic intents.
 */
const CANONICAL_INTENT_MAP = {
  // Water & Hydration
  WATER_REQUEST: 'WATER_REQUEST',
  THIRSTY: 'WATER_REQUEST',
  WANT_WATER: 'WATER_REQUEST',
  DRINK_WATER: 'WATER_REQUEST',
  NEED_WATER: 'WATER_REQUEST',

  // Meals
  MEAL_COMPLETED: 'MEAL_COMPLETED',
  MEAL_ATE: 'MEAL_COMPLETED',
  AFFIRMATIVE_MEAL: 'MEAL_COMPLETED',
  MEAL_CHECK: 'MEAL_COMPLETED',

  MEAL_NOT_EATEN: 'MEAL_NOT_EATEN',
  MEAL_NOT_YET: 'MEAL_NOT_EATEN',
  NEGATIVE_MEAL: 'MEAL_NOT_EATEN',

  MEAL_HUNGRY: 'MEAL_REQUEST',
  WANT_FOOD: 'MEAL_REQUEST',
  FEELING_HUNGRY: 'MEAL_REQUEST',
  HUNGRY: 'MEAL_REQUEST',
  MEAL_REQUEST: 'MEAL_REQUEST',

  NOT_HUNGRY: 'MEAL_DECLINED',
  MEAL_DECLINED: 'MEAL_DECLINED',
  NEGATIVE_NOT_HUNGRY: 'MEAL_DECLINED',
  NO_FOOD: 'MEAL_DECLINED',
  EAT_LATER: 'MEAL_DECLINED',

  MEAL_UNSURE: 'MEAL_STATUS_UNKNOWN',
  MEAL_STATUS_UNKNOWN: 'MEAL_STATUS_UNKNOWN',

  // Feelings
  FEELING_GOOD: 'FEELING_GOOD',
  FEELING_FINE: 'FEELING_GOOD',

  FEELING_TIRED: 'FEELING_TIRED',
  TIRED: 'FEELING_TIRED',
  SLEEP_NEED: 'FEELING_TIRED',

  FEELING_UNCOMFORTABLE: 'FEELING_UNCOMFORTABLE',
  UNCOMFORTABLE: 'FEELING_UNCOMFORTABLE',

  FEELING_BAD: 'FEELING_BAD',
  FEELING_NOT_TIRED: 'FEELING_GOOD',
  SICK: 'FEELING_BAD',

  // Medicine
  MEDICINE_TAKEN: 'MEDICINE_TAKEN',
  MEDICINE_NOT_TAKEN: 'MEDICINE_NOT_TAKEN',
  MEDICINE_UNSURE: 'MEDICINE_UNKNOWN',
  MEDICINE_UNKNOWN: 'MEDICINE_UNKNOWN',
  MEDICINE_NEED: 'MEDICINE_REQUEST',
  MEDICINE_REQUEST: 'MEDICINE_REQUEST',

  // Pain
  PAIN_NONE: 'PAIN_NONE',
  NO_PAIN: 'PAIN_NONE',
  PAIN_MILD: 'PAIN_PRESENT',
  PAIN_SEVERE: 'PAIN_PRESENT',
  PAIN_YES: 'PAIN_PRESENT',
  PAIN_PRESENT: 'PAIN_PRESENT',
  PAIN_UNKNOWN: 'PAIN_UNKNOWN',

  // Activity
  ACTIVITY_REST: 'ACTIVITY_WANT',
  ACTIVITY_OUTSIDE: 'ACTIVITY_WANT',
  ACTIVITY_OUTSIDE_YES: 'ACTIVITY_WANT',
  ACTIVITY_TV: 'ACTIVITY_WANT',
  ACTIVITY_WANT: 'ACTIVITY_WANT',

  ACTIVITY_NOTHING: 'ACTIVITY_DECLINE',
  ACTIVITY_OUTSIDE_NO: 'ACTIVITY_DECLINE',
  ACTIVITY_DECLINE: 'ACTIVITY_DECLINE',

  // Generic
  YES: 'YES',
  AFFIRMATIVE: 'YES',
  NO: 'NO',
  NEGATIVE: 'NO',
  UNSURE: 'UNSURE',
  REPEAT: 'REPEAT',
  HELP: 'HELP'
};

/**
 * Normalizes raw/provider intent labels to canonical language-independent semantic intents
 */
const normalizeSemanticIntent = (rawIntent, text = '') => {
  if (!rawIntent) rawIntent = 'UNKNOWN';
  const cleanRaw = rawIntent.toString().trim().toUpperCase();

  if (CANONICAL_INTENT_MAP[cleanRaw]) {
    return CANONICAL_INTENT_MAP[cleanRaw];
  }

  // Text keyword heuristics if raw intent key is unmapped
  const textLower = (text || '').toLowerCase();
  if (textLower.includes('ate') || textLower.includes('ಮಾಡಿದೆ') || textLower.includes('खा लिया')) {
    return 'MEAL_COMPLETED';
  }
  if (textLower.includes('hungry') || textLower.includes('ಹಸಿವು') || textLower.includes('भूख')) {
    return 'MEAL_REQUEST';
  }
  if (textLower.includes('not hungry') || textLower.includes('ಬೇಡ') || textLower.includes('नहीं खाया') || textLower.includes('later')) {
    return 'MEAL_DECLINED';
  }

  // Allow extensible expansion for unknown/custom intents
  return cleanRaw;
};

/**
 * Safe generic fallback options per language
 */
const SAFE_GENERIC_FALLBACKS = {
  en: [
    { id: 'opt_yes', rawIntent: 'YES', intent: 'YES', semanticIntent: 'YES', text: 'Yes' },
    { id: 'opt_no', rawIntent: 'NO', intent: 'NO', semanticIntent: 'NO', text: 'No' },
    { id: 'opt_unsure', rawIntent: 'UNSURE', intent: 'UNSURE', semanticIntent: 'UNSURE', text: "I don't know" },
    { id: 'opt_repeat', rawIntent: 'REPEAT', intent: 'REPEAT', semanticIntent: 'REPEAT', text: 'Please repeat' },
    { id: 'opt_help', rawIntent: 'HELP', intent: 'HELP', semanticIntent: 'HELP', text: 'I need help' }
  ],
  kn: [
    { id: 'opt_yes', rawIntent: 'YES', intent: 'YES', semanticIntent: 'YES', text: 'ಹೌದು' },
    { id: 'opt_no', rawIntent: 'NO', intent: 'NO', semanticIntent: 'NO', text: 'ಇಲ್ಲ' },
    { id: 'opt_unsure', rawIntent: 'UNSURE', intent: 'UNSURE', semanticIntent: 'UNSURE', text: 'ನನಗೆ ಗೊತ್ತಿಲ್ಲ' },
    { id: 'opt_repeat', rawIntent: 'REPEAT', intent: 'REPEAT', semanticIntent: 'REPEAT', text: 'ದಯವಿಟ್ಟು ಇನ್ನೊಮ್ಮೆ ಹೇಳಿ' },
    { id: 'opt_help', rawIntent: 'HELP', intent: 'HELP', semanticIntent: 'HELP', text: 'ನನಗೆ ಸಹಾಯ ಬೇಕು' }
  ],
  hi: [
    { id: 'opt_yes', rawIntent: 'YES', intent: 'YES', semanticIntent: 'YES', text: 'हाँ' },
    { id: 'opt_no', rawIntent: 'NO', intent: 'NO', semanticIntent: 'NO', text: 'नहीं' },
    { id: 'opt_unsure', rawIntent: 'UNSURE', intent: 'UNSURE', semanticIntent: 'UNSURE', text: 'मुझे नहीं पता' },
    { id: 'opt_repeat', rawIntent: 'REPEAT', intent: 'REPEAT', semanticIntent: 'REPEAT', text: 'कृपया दोबारा कहें' },
    { id: 'opt_help', rawIntent: 'HELP', intent: 'HELP', semanticIntent: 'HELP', text: 'मुझे मदद चाहिए' }
  ]
};

/**
 * Deterministic local context reasoning rules
 */
const DETERMINISTIC_RULES = [
  {
    category: 'water',
    keywords: ['water', 'drink', 'thirsty', 'hydration', 'cup', 'glass', 'ಕುಡಿಯಲು', 'ನೀರು', 'ದಾಹ', 'पानी', 'प्यास', 'पिऊंगा', 'पीना'],
    options: {
      en: [
        { id: 'opt_water_1', intent: 'WATER_REQUEST', text: 'Yes, please give me water.' },
        { id: 'opt_water_2', intent: 'NO', text: 'No, I am not thirsty.' },
        { id: 'opt_water_3', intent: 'HELP', text: 'I need help drinking.' }
      ],
      kn: [
        { id: 'opt_water_1', intent: 'WATER_REQUEST', text: 'ಹೌದು, ದಯವಿಟ್ಟು ನನಗೆ ನೀರು ಕೊಡಿ.' },
        { id: 'opt_water_2', intent: 'NO', text: 'ಇಲ್ಲ, ನನಗೆ ದಾಹವಿಲ್ಲ.' },
        { id: 'opt_water_3', intent: 'HELP', text: 'ನನಗೆ ಸಹಾಯ ಬೇಕು.' }
      ],
      hi: [
        { id: 'opt_water_1', intent: 'WATER_REQUEST', text: 'हाँ, कृपया मुझे पानी दीजिए।' },
        { id: 'opt_water_2', intent: 'NO', text: 'नहीं, मुझे प्यास नहीं लगी है।' },
        { id: 'opt_water_3', intent: 'HELP', text: 'मुझे मदद चाहिए।' }
      ]
    }
  },
  {
    category: 'what_meal',
    keywords: ['what food', 'what to eat', 'which food', 'what dish', 'en uuta', 'en oota', 'enu uuta', 'enu thindi', 'ಏನ್ ಊಟ', 'ಏನು ಊಟ', 'ಏನು ತಿಂಡಿ', 'ಏನ್ ಬೇಕು', 'ಯಾವ ಊಟ', 'ಯಾವ ತಿಂಡಿ'],
    options: {
      en: [
        { id: 'opt_wm_1', intent: 'SPECIFIC_FOOD_1', text: 'I want dosa or idli, please.' },
        { id: 'opt_wm_2', intent: 'SPECIFIC_FOOD_2', text: 'I want hot rice and sambar.' },
        { id: 'opt_wm_3', intent: 'SPECIFIC_FOOD_3', text: 'I want chapati and curry.' },
        { id: 'opt_wm_4', intent: 'SPECIFIC_FOOD_4', text: 'Just light snacks or fresh fruit.' }
      ],
      kn: [
        { id: 'opt_wm_1', intent: 'SPECIFIC_FOOD_1', text: 'ನನಗೆ ದೋಸೆ ಅಥವಾ ಇಡ್ಲಿ ಬೇಕು.' },
        { id: 'opt_wm_2', intent: 'SPECIFIC_FOOD_2', text: 'ನನಗೆ ಬಿಸಿ ಬಿಸಿ ಅನ್ನ ಮತ್ತು ಸಾರು ಬೇಕು.' },
        { id: 'opt_wm_3', intent: 'SPECIFIC_FOOD_3', text: 'ನನಗೆ ಚಪಾತಿ ಮತ್ತು ಪಲ್ಯ ಬೇಕು.' },
        { id: 'opt_wm_4', intent: 'SPECIFIC_FOOD_4', text: 'ಸ್ವಲ್ಪ ಲಘು ಆಹಾರ ಅಥವಾ ಹಣ್ಣು ಕೊಡಿ.' }
      ],
      hi: [
        { id: 'opt_wm_1', intent: 'SPECIFIC_FOOD_1', text: 'मुझे डोसा या इडली चाहिए।' },
        { id: 'opt_wm_2', intent: 'SPECIFIC_FOOD_2', text: 'मुझे गरम चावल और सांभर चाहिए।' },
        { id: 'opt_wm_3', intent: 'SPECIFIC_FOOD_3', text: 'मुझे चपाती और सब्जी चाहिए।' },
        { id: 'opt_wm_4', intent: 'SPECIFIC_FOOD_4', text: 'थोड़ा हल्का खाना या फल दे दो।' }
      ]
    }
  },
  {
    category: 'meal',
    keywords: ['eat', 'food', 'lunch', 'dinner', 'breakfast', 'meal', 'hungry', 'ಊಟ', 'ತಿಂಡಿ', 'ಆಹಾರ', 'ಹಸಿವು', 'खाना', 'लंच', 'भोजन', 'भूख'],
    options: {
      en: [
        { id: 'opt_meal_1', intent: 'MEAL_COMPLETED', text: 'Yes, I ate lunch.' },
        { id: 'opt_meal_2', intent: 'MEAL_NOT_EATEN', text: "No, I haven't eaten yet." },
        { id: 'opt_meal_3', intent: 'MEAL_UNSURE', text: "I don't remember." },
        { id: 'opt_meal_4', intent: 'MEAL_HUNGRY', text: 'I am hungry.' }
      ],
      kn: [
        { id: 'opt_meal_1', intent: 'MEAL_COMPLETED', text: 'ಹೌದು, ನಾನು ಊಟ ಮಾಡಿದ್ದೇನೆ.' },
        { id: 'opt_meal_2', intent: 'MEAL_NOT_EATEN', text: 'ಇಲ್ಲ, ನಾನು ಇನ್ನೂ ಊಟ ಮಾಡಿಲ್ಲ.' },
        { id: 'opt_meal_3', intent: 'MEAL_UNSURE', text: 'ನನಗೆ ನೆನಪಿಲ್ಲ.' },
        { id: 'opt_meal_4', intent: 'MEAL_HUNGRY', text: 'ನನಗೆ ಹಸಿವಾಗಿದೆ.' }
      ],
      hi: [
        { id: 'opt_meal_1', intent: 'MEAL_COMPLETED', text: 'हाँ, मैंने खाना खा लिया।' },
        { id: 'opt_meal_2', intent: 'MEAL_NOT_EATEN', text: 'नहीं, मैंने अभी नहीं खाया।' },
        { id: 'opt_meal_3', intent: 'MEAL_UNSURE', text: 'मुझे याद नहीं है।' },
        { id: 'opt_meal_4', intent: 'MEAL_HUNGRY', text: 'मुझे भूख लगी है।' }
      ]
    }
  },
  {
    category: 'pain',
    keywords: ['pain', 'hurt', 'aches', 'sore', 'ನೋವು', 'ಕಷ್ಟ', 'दर्द', 'तकलीफ़'],
    options: {
      en: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'No, I am not in pain.' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'I have mild pain.' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'Yes, severe pain.' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'I need immediate help.' }
      ],
      kn: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'ಇಲ್ಲ, ನನಗೆ ನೋವಿಲ್ಲ.' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'ಸ್ವಲ್ಪ ನೋವಿದೆ.' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'ಹೌದು, ಹೆಚ್ಚು ನೋವಿದೆ.' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'ನನಗೆ ತಕ್ಷಣ ಸಹಾಯ ಬೇಕು.' }
      ],
      hi: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'नहीं, मुझे दर्द नहीं है।' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'थोड़ा दर्द है।' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'हाँ, बहुत दर्द है।' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'मुझे तुरंत मदद चाहिए।' }
      ]
    }
  },
  {
    category: 'help',
    keywords: ['help', 'emergency', 'assist', 'urgent', 'ಸಹಾಯ', 'ಮದತ್', 'मदद', 'सहायता'],
    options: {
      en: [
        { id: 'opt_help_1', intent: 'HELP', text: 'I need immediate help.' },
        { id: 'opt_help_2', intent: 'PAIN_PRESENT', text: 'I am in pain, please help.' },
        { id: 'opt_help_3', intent: 'MEDICINE_REQUEST', text: 'I need my emergency medicine.' }
      ],
      kn: [
        { id: 'opt_help_1', intent: 'HELP', text: 'ನನಗೆ ತಕ್ಷಣ ಸಹಾಯ ಬೇಕು.' },
        { id: 'opt_help_2', intent: 'PAIN_PRESENT', text: 'ನನಗೆ ನೋವಿದೆ, ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ.' },
        { id: 'opt_help_3', intent: 'MEDICINE_REQUEST', text: 'ನನಗೆ ತುರ್ತು ಔಷಧಿ ಬೇಕು.' }
      ],
      hi: [
        { id: 'opt_help_1', intent: 'HELP', text: 'मुझे तुरंत मदद चाहिए।' },
        { id: 'opt_help_2', intent: 'PAIN_PRESENT', text: 'मुझे दर्द हो रहा है, कृपया मदद करें।' },
        { id: 'opt_help_3', intent: 'MEDICINE_REQUEST', text: 'मुझे मेरी आपातकालीन दवा चाहिए।' }
      ]
    }
  },
  {
    category: 'feeling',
    keywords: ['feeling', 'feel', 'how are you', 'today', 'ಚೆನ್ನಾಗಿದ್ದೀರಾ', 'ಹೇಗಿದ್ದೀರಾ', 'ಆರೋಗ್ಯ', 'कैसे', 'हाल', 'महसूस'],
    options: {
      en: [
        { id: 'opt_feel_1', intent: 'FEELING_GOOD', text: 'I am feeling fine.' },
        { id: 'opt_feel_2', intent: 'FEELING_TIRED', text: 'I am tired.' },
        { id: 'opt_feel_3', intent: 'FEELING_UNCOMFORTABLE', text: 'I am uncomfortable.' },
        { id: 'opt_feel_4', intent: 'HELP', text: 'I need help.' }
      ],
      kn: [
        { id: 'opt_feel_1', intent: 'FEELING_GOOD', text: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ.' },
        { id: 'opt_feel_2', intent: 'FEELING_TIRED', text: 'ನನಗೆ ಆಯಾಸವಾಗಿದೆ.' },
        { id: 'opt_feel_3', intent: 'FEELING_UNCOMFORTABLE', text: 'ನನಗೆ ಅಸೌಕರ್ಯವಾಗಿದೆ.' },
        { id: 'opt_feel_4', intent: 'HELP', text: 'ನನಗೆ ಸಹಾಯ ಬೇಕು.' }
      ],
      hi: [
        { id: 'opt_feel_1', intent: 'FEELING_GOOD', text: 'मैं ठीक महसूस कर रहा हूँ।' },
        { id: 'opt_feel_2', intent: 'FEELING_TIRED', text: 'मैं थक गया हूँ।' },
        { id: 'opt_feel_3', intent: 'FEELING_UNCOMFORTABLE', text: 'मुझे असहज लग रहा है।' },
        { id: 'opt_feel_4', intent: 'HELP', text: 'मुझे मदद चाहिए।' }
      ]
    }
  },
  {
    category: 'medicine',
    keywords: ['medicine', 'medication', 'pill', 'dose', 'tablet', 'ಔಷಧಿ', 'ಮಾತ್ರೆ', 'दवा', 'गोली'],
    options: {
      en: [
        { id: 'opt_med_1', intent: 'MEDICINE_TAKEN', text: 'Yes, I took my medicine.' },
        { id: 'opt_med_2', intent: 'MEDICINE_NOT_TAKEN', text: "No, I haven't taken it." },
        { id: 'opt_med_3', intent: 'MEDICINE_UNSURE', text: "I don't remember." },
        { id: 'opt_med_4', intent: 'MEDICINE_NEED', text: 'I need my medicine.' }
      ],
      kn: [
        { id: 'opt_med_1', intent: 'MEDICINE_TAKEN', text: 'ಹೌದು, ನಾನು ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ.' },
        { id: 'opt_med_2', intent: 'MEDICINE_NOT_TAKEN', text: 'ಇಲ್ಲ, ನಾನು ತೆಗೆದುಕೊಂಡಿಲ್ಲ.' },
        { id: 'opt_med_3', intent: 'MEDICINE_UNSURE', text: 'ನನಗೆ ನೆನಪಿಲ್ಲ.' },
        { id: 'opt_med_4', intent: 'MEDICINE_NEED', text: 'ನನಗೆ ಔಷಧಿ ಬೇಕು.' }
      ],
      hi: [
        { id: 'opt_med_1', intent: 'MEDICINE_TAKEN', text: 'हाँ, मैंने दवा ले ली है।' },
        { id: 'opt_med_2', intent: 'MEDICINE_NOT_TAKEN', text: 'नहीं, मैंने दवा नहीं ली।' },
        { id: 'opt_med_3', intent: 'MEDICINE_UNSURE', text: 'मुझे याद नहीं है।' },
        { id: 'opt_med_4', intent: 'MEDICINE_NEED', text: 'मुझे मेरी दवा चाहिए।' }
      ]
    }
  },
  {
    category: 'pain',
    keywords: ['pain', 'hurt', 'aches', 'sore', 'ನೋವು', 'ಕಷ್ಟ', 'दर्द', 'तकलीफ़'],
    options: {
      en: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'No, I am not in pain.' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'I have mild pain.' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'Yes, severe pain.' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'I need immediate help.' }
      ],
      kn: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'ಇಲ್ಲ, ನನಗೆ ನೋವಿಲ್ಲ.' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'ಸ್ವಲ್ಪ ನೋವಿದೆ.' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'ಹೌದು, ಹೆಚ್ಚು ನೋವಿದೆ.' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'ನನಗೆ ತಕ್ಷಣ ಸಹಾಯ ಬೇಕು.' }
      ],
      hi: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'नहीं, मुझे दर्द नहीं है।' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'थोड़ा दर्द है।' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'हाँ, बहुत दर्द है।' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'मुझे तुरंत मदद चाहिए।' }
      ]
    }
  },
  {
    category: 'activity',
    keywords: ['like to do', 'would you like', 'want to do', 'what do you want', 'ಏನು ಮಾಡಲು', 'ಇಷ್ಟ', 'क्या करना', 'चाहते'],
    options: {
      en: [
        { id: 'opt_act_1', intent: 'ACTIVITY_REST', text: 'I want to rest.' },
        { id: 'opt_act_2', intent: 'ACTIVITY_OUTSIDE', text: 'I want to go outside.' },
        { id: 'opt_act_3', intent: 'ACTIVITY_TV', text: 'I want to watch TV.' },
        { id: 'opt_act_4', intent: 'ACTIVITY_NOTHING', text: 'Nothing right now.' }
      ],
      kn: [
        { id: 'opt_act_1', intent: 'ACTIVITY_REST', text: 'ನಾನು ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಬಯಸುತ್ತೇನೆ.' },
        { id: 'opt_act_2', intent: 'ACTIVITY_OUTSIDE', text: 'ನಾನು ಹೊರಗೆ ಹೋಗಲು ಬಯಸುತ್ತೇನೆ.' },
        { id: 'opt_act_3', intent: 'ACTIVITY_TV', text: 'ನಾನು ಟಿವಿ ನೋಡಲು ಬಯಸುತ್ತೇನೆ.' },
        { id: 'opt_act_4', intent: 'ACTIVITY_NOTHING', text: 'ಈಗ ಏನೂ ಬೇಡ.' }
      ],
      hi: [
        { id: 'opt_act_1', intent: 'ACTIVITY_REST', text: 'मैं आराम करना चाहता हूँ।' },
        { id: 'opt_act_2', intent: 'ACTIVITY_OUTSIDE', text: 'मैं बाहर जाना चाहता हूँ।' },
        { id: 'opt_act_3', intent: 'ACTIVITY_TV', text: 'मैं टीवी देखना चाहता हूँ।' },
        { id: 'opt_act_4', intent: 'ACTIVITY_NOTHING', text: 'अभी कुछ नहीं।' }
      ]
    }
  },
  {
    category: 'outside',
    keywords: ['outside', 'go out', 'walk', 'ಹೊರಗೆ', 'ವಾಕ್', 'बाहर', 'टहलने'],
    options: {
      en: [
        { id: 'opt_out_1', intent: 'ACTIVITY_OUTSIDE_YES', text: 'Yes, I want to go outside.' },
        { id: 'opt_out_2', intent: 'ACTIVITY_OUTSIDE_NO', text: 'No, I prefer staying inside.' },
        { id: 'opt_out_3', intent: 'FEELING_TIRED', text: 'I am too tired.' }
      ],
      kn: [
        { id: 'opt_out_1', intent: 'ACTIVITY_OUTSIDE_YES', text: 'ಹೌದು, ನಾನು ಹೊರಗೆ ಹೋಗಲು ಬಯಸುತ್ತೇನೆ.' },
        { id: 'opt_out_2', intent: 'ACTIVITY_OUTSIDE_NO', text: 'ಇಲ್ಲ, ನಾನು ಒಳಗಿರಲು ಬಯಸುತ್ತೇನೆ.' },
        { id: 'opt_out_3', intent: 'FEELING_TIRED', text: 'ನನಗೆ ತುಂಬಾ ಆಯಾಸವಾಗಿದೆ.' }
      ],
      hi: [
        { id: 'opt_out_1', intent: 'ACTIVITY_OUTSIDE_YES', text: 'हाँ, मैं बाहर जाना चाहता हूँ।' },
        { id: 'opt_out_2', intent: 'ACTIVITY_OUTSIDE_NO', text: 'नहीं, मैं अंदर ही रहना चाहता हूँ।' },
        { id: 'opt_out_3', intent: 'FEELING_TIRED', text: 'मैं बहुत थका हुआ हूँ।' }
      ]
    }
  },
  {
    category: 'tired',
    keywords: ['tired', 'sleep', 'sleepy', 'exhausted', 'ಆಯಾಸ', 'ನಿದ್ರೆ', 'थका', 'नींद'],
    options: {
      en: [
        { id: 'opt_tired_1', intent: 'FEELING_TIRED', text: 'Yes, I am tired.' },
        { id: 'opt_tired_2', intent: 'FEELING_NOT_TIRED', text: 'No, I feel fine.' },
        { id: 'opt_tired_3', intent: 'SLEEP_NEED', text: 'I want to sleep.' }
      ],
      kn: [
        { id: 'opt_tired_1', intent: 'FEELING_TIRED', text: 'ಹೌದು, ನನಗೆ ಆಯಾಸವಾಗಿದೆ.' },
        { id: 'opt_tired_2', intent: 'FEELING_NOT_TIRED', text: 'ಇಲ್ಲ, ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ.' },
        { id: 'opt_tired_3', intent: 'SLEEP_NEED', text: 'ನಾನು ನಿದ್ರಿಸಲು ಬಯಸುತ್ತೇನೆ.' }
      ],
      hi: [
        { id: 'opt_tired_1', intent: 'FEELING_TIRED', text: 'हाँ, मैं थका हुआ हूँ।' },
        { id: 'opt_tired_2', intent: 'FEELING_NOT_TIRED', text: 'नहीं, मैं ठीक हूँ।' },
        { id: 'opt_tired_3', intent: 'SLEEP_NEED', text: 'मैं सोना चाहता हूँ।' }
      ]
    }
  }
];

/**
 * Execute local deterministic reasoning engine
 */
const getDeterministicFallback = (question, language = 'en') => {
  const normalizedLang = ['en', 'kn'].includes(language) ? language : 'en';
  const qLower = (question || '').toLowerCase();

  for (const rule of DETERMINISTIC_RULES) {
    if (rule.keywords.some((kw) => qLower.includes(kw.toLowerCase()))) {
      const canonicalOptions = rule.options[normalizedLang].map((opt) => {
        const rawIntent = (opt.intent || 'UNKNOWN').toUpperCase();
        const canonicalIntent = normalizeSemanticIntent(rawIntent, opt.text);
        return {
          id: opt.id,
          rawIntent: rawIntent,
          intent: canonicalIntent,
          semanticIntent: canonicalIntent,
          text: opt.text
        };
      });

      return {
        question: question,
        language: normalizedLang,
        intentContext: `rule_${rule.category}`,
        options: canonicalOptions
      };
    }
  }

  // Advanced NLP Semantic Reasoning Engine when Gemini rate-limits or rule unmatched
  const nlpOptions = nlpProcessorService.generateSemanticNLPResponses(question, normalizedLang);

  return {
    question: question,
    language: normalizedLang,
    intentContext: 'nlp_semantic_reasoning',
    options: nlpOptions
  };
};

/**
 * Call Gemini API for dynamic LLM context reasoning
 */
const callGeminiAPI = async (question, language = 'en', patientContext = null) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const modelCandidates = Array.from(new Set([primaryModel, 'gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-3.6-flash']));
  const normalizedLang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';
  const sanitizedQuestion = (question || '').trim();

  const contextSnippet = patientContext
    ? `Patient Context: Name=${patientContext.fullName || 'Patient'}, Age=${patientContext.age || 'Adult'}, Gender=${patientContext.gender || 'unspecified'}.`
    : '';

  const systemPrompt = `You are an expressive, context-aware speech generation engine for an aphasia patient application (VoiceBack).
Caregiver Question: "${sanitizedQuestion}"
Target Language: "${normalizedLang}" (en = English, kn = Kannada, hi = Hindi)
${contextSnippet}

Task:
Understand the caregiver question and generate 3 to 5 short, natural, patient-friendly response options appropriate for an aphasia patient to select.
Rules:
1. Options MUST be short, simple, first-person sentences (e.g., "Yes, I ate lunch", "No, I haven't eaten yet", "I am thirsty").
2. Each option MUST include:
   - "id": string unique identifier (e.g., "opt_1", "opt_2")
   - "intent": UPPERCASE language-independent semantic intent code (e.g., "MEAL_COMPLETED", "MEAL_NOT_EATEN", "WATER_REQUEST", "MEDICINE_TAKEN", "PAIN_NONE", "PAIN_PRESENT", "ACTIVITY_WANT", "YES", "NO", "HELP")
   - "text": natural response sentence written strictly in the target language (${normalizedLang}) using only native script (Kannada for kn, Devanagari for hi, English for en). Do not mix scripts.
3. Return ONLY a raw valid JSON object with NO markdown codeblocks or extra text.

JSON Schema:
{
  "question": "${sanitizedQuestion}",
  "language": "${normalizedLang}",
  "intentContext": "<short context label>",
  "options": [
    { "id": "opt_1", "intent": "INTENT_CODE", "text": "Response text" }
  ]
}`;

  let response = null;
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      response = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [{ text: systemPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000
        }
      );
      if (response && response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        break; // Successfully got response from modelName
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      console.warn(`[ContextEngine] Gemini model ${modelName} notice (${status}): ${msg}. Trying next candidate...`);
    }
  }

  if (!response || !response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error(lastError ? (lastError.response?.data?.error?.message || lastError.message) : 'All Gemini model candidates failed');
  }

  const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response payload received from Gemini API');
  }

  // Parse JSON response safely
  const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanedText);

  // Validate output structure
  if (!parsed || !Array.isArray(parsed.options) || parsed.options.length === 0) {
    throw new Error('Invalid JSON structure from Gemini API');
  }

  // Ensure every option has required fields, script validation, and canonical intent mapping
  const validOptions = parsed.options.map((opt, index) => {
    const rawOptText = typeof opt === 'string' ? opt : opt.text || 'Response option';
    const cleanText = (rawOptText && rawOptText.trim().length > 0) ? rawOptText.trim() : 'Yes.';

    const rawIntent = (opt.intent || 'UNKNOWN_INTENT').toUpperCase();
    const canonicalIntent = normalizeSemanticIntent(rawIntent, cleanText);

    return {
      id: opt.id || `opt_${index + 1}`,
      rawIntent: rawIntent,
      intent: canonicalIntent, // for backward compatibility
      semanticIntent: canonicalIntent, // canonical language-independent intent
      text: cleanText
    };
  });

  return {
    question: parsed.question || sanitizedQuestion,
    language: parsed.language || normalizedLang,
    intentContext: parsed.intentContext || 'gemini_dynamic',
    options: validOptions
  };
};

/**
 * Main Context Engine Service entry point
 * Attempts Gemini API call first, falls back gracefully to local deterministic engine
 */
const generateResponseOptions = async ({ question, language = 'en', patientContext = null }) => {
  const normalizedLang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';

  if (!question || typeof question !== 'string' || !question.trim()) {
    return {
      question: '',
      language: normalizedLang,
      intentContext: 'empty_question',
      options: SAFE_GENERIC_FALLBACKS[normalizedLang]
    };
  }

  let rawResult;
  try {
    if (process.env.GEMINI_API_KEY) {
      rawResult = await callGeminiAPI(question, normalizedLang, patientContext);
    }
  } catch (err) {
    console.warn(`[ContextEngine] Gemini API call failed/bypassed: ${err.message}. Using local deterministic engine.`);
  }

  if (!rawResult) {
    rawResult = getDeterministicFallback(question, normalizedLang);
  }

  // Apply NLP Output Post-Processing Engine
  const nlpOptions = nlpProcessorService.postProcessOutputNLP(rawResult.options, normalizedLang);

  return {
    ...rawResult,
    options: nlpOptions,
    nlpProcessed: true
  };
};

/**
 * Multimodal Audio Speech Recognition & Intent Response reasoning using Google Gemini
 */
const transcribeAndRecognizeWithGemini = async ({ audioBase64, mimeType = 'audio/webm', language = 'en' }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const normalizedLang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';

  const systemPrompt = `You are Google Gemini VoiceBack Multimodal Speech & Intent Engine for an aphasia patient application.
Listen to this audio recording of a caregiver or patient speaking.
Target Language: "${normalizedLang}" (en = English, kn = Kannada, hi = Hindi)

Tasks:
1. Transcribe the spoken speech into clean text. If speech is distorted or unintelligible due to aphasia, output a gentle summary like "Speech Attempt Detected".
2. Identify the intent context.
3. Generate 3 to 5 short patient-friendly response options written in native script (Kannada for kn, Devanagari for hi, English for en).

Return ONLY valid JSON:
{
  "transcript": "Transcribed speech text",
  "language": "${normalizedLang}",
  "intentContext": "context_label",
  "options": [
    { "id": "opt_1", "intent": "INTENT_CODE", "text": "Native script response" }
  ]
}`;

  const parts = [{ text: systemPrompt }];

  if (audioBase64) {
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: audioBase64
      }
    });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await axios.post(
    apiUrl,
    {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 25000 }
  );

  const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response payload from Gemini Multimodal Audio API');
  }

  const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanedText);

  return {
    transcript: parsed.transcript || 'Speech Attempt Recognized',
    language: parsed.language || normalizedLang,
    intentContext: parsed.intentContext || 'gemini_multimodal',
    options: Array.isArray(parsed.options) ? parsed.options : SAFE_GENERIC_FALLBACKS[normalizedLang]
  };
};

module.exports = {
  generateResponseOptions,
  transcribeAndRecognizeWithGemini,
  getDeterministicFallback,
  validateLanguageScript,
  normalizeSemanticIntent,
  CANONICAL_INTENT_MAP,
  SAFE_GENERIC_FALLBACKS
};
