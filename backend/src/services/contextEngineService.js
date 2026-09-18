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
  HELP: 'HELP',

  // Companion Activities & Invitations
  MOVIE_YES: 'ACTIVITY_WANT',
  MOVIE_DECLINE: 'ACTIVITY_DECLINE',
  MOVIE_LATER: 'ACTIVITY_RESCHEDULE',
  MOVIE_ASK: 'ACTIVITY_QUESTION',
  ACCEPTANCE: 'YES',
  CLARIFICATION: 'REPEAT',
  POSTPONEMENT: 'ACTIVITY_RESCHEDULE',
  DECLINE: 'NO',

  // Food & Snacks
  FOOD_SNACK: 'MEAL_REQUEST',
  FOOD_CHIPS: 'MEAL_REQUEST',
  FOOD_POPCORN: 'MEAL_REQUEST',
  FOOD_SWEET: 'MEAL_REQUEST',
  SPECIFIC_FOOD_CHOICE: 'MEAL_REQUEST',
  GENERAL_FOOD_PREFERENCE: 'MEAL_REQUEST',
  SWEET_PREFERENCE: 'MEAL_REQUEST',
  NO_FOOD_DESIRED: 'MEAL_DECLINED',

  // Beverages
  CHOICE_TEA: 'BEVERAGE_TEA',
  CHOICE_COFFEE: 'BEVERAGE_COFFEE',
  CHOICE_WATER: 'WATER_REQUEST',
  CHOICE_NEITHER: 'BEVERAGE_NONE',
  BEVERAGE_TEA: 'BEVERAGE_TEA',
  BEVERAGE_COFFEE: 'BEVERAGE_COFFEE',
  BEVERAGE_WATER: 'WATER_REQUEST',
  BEVERAGE_NONE: 'BEVERAGE_NONE',

  // Feelings & Wellbeing
  AFFIRMATIVE_BETTER: 'FEELING_GOOD',
  PARTIAL_BETTER: 'FEELING_GOOD',
  NEGATIVE_STILL_SICK: 'FEELING_BAD',
  NEED_REST: 'FEELING_TIRED',
  FEELING_BETTER: 'FEELING_GOOD',
  FEELING_PARTIAL: 'FEELING_GOOD',
  FEELING_NOT_BETTER: 'FEELING_BAD',
  FEELING_NEED_REST: 'FEELING_TIRED',

  // Yes / No & Statements
  AFFIRMATIVE_YES: 'YES',
  NEGATIVE_NO: 'NO',
  TENTATIVE_DELAYED: 'UNSURE',
  REST_NEED: 'FEELING_TIRED',
  YES_CONFIRM: 'YES',
  NO_DECLINE: 'NO',
  AGREE: 'YES',
  DISAGREE: 'NO',
  PREFERENCE: 'ACTIVITY_WANT',
  CONCERN: 'HELP'
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
    category: 'movie_invitation',
    keywords: [
      'movie', 'cinema', 'theater', 'theatre', 'film',
      "let's go to see the movie", "let's go to the movie", "watch a movie", "watch the movie", "go to the movie", "see the movie",
      'chalanachitra', 'hogona', 'nodona', 'chithramandira',
      'ನಾವು ಸಿನಿಮಾ ನೋಡಲು ಹೋಗೋಣವೇ', 'ಸಿನಿಮಾ ನೋಡಲು ಹೋಗೋಣವೇ', 'ಸಿನಿಮಾ ನೋಡಲು', 'ಸಿನಿಮಾ', 'ಚಿತ್ರಮಂದಿರ', 'ಮೂವಿ', 'ಫಿಲ್ಮ್', 'ಸಿನಿಮಾಗೆ', 'ಸಿನಿಮಾ ನೋಡೋಣ', 'ಹೋಗೋಣ',
      'फ़िल्म', 'सिनेमा', 'मूवी', 'चलते हैं'
    ],
    options: {
      en: [
        { id: 'opt_mov_1', intent: 'MOVIE_YES', text: "Yes, let's go!" },
        { id: 'opt_mov_2', intent: 'MOVIE_YES', text: "Sure, I'd love to." },
        { id: 'opt_mov_3', intent: 'MOVIE_DECLINE', text: "No, I'm not interested." },
        { id: 'opt_mov_4', intent: 'MOVIE_LATER', text: "Let's go another day." },
        { id: 'opt_mov_5', intent: 'MOVIE_ASK', text: "What movie are we going to see?" }
      ],
      kn: [
        { id: 'opt_mov_1', intent: 'MOVIE_YES', text: "ಹೌದು, ಹೋಗೋಣ!" },
        { id: 'opt_mov_2', intent: 'MOVIE_YES', text: "ಸರಿ, ನನಗೆ ಇಷ್ಟ." },
        { id: 'opt_mov_3', intent: 'MOVIE_DECLINE', text: "ಬೇಡ, ನನಗೆ ಆಸಕ್ತಿ ಇಲ್ಲ." },
        { id: 'opt_mov_4', intent: 'MOVIE_LATER', text: "ಇನ್ನೊಂದು ದಿನ ಹೋಗೋಣ." },
        { id: 'opt_mov_5', intent: 'MOVIE_ASK', text: "ನಾವು ಯಾವ ಸಿನಿಮಾ ನೋಡಲು ಹೋಗುತ್ತಿದ್ದೇವೆ?" }
      ],
      hi: [
        { id: 'opt_mov_1', intent: 'MOVIE_YES', text: "हाँ, चलो चलते हैं!" },
        { id: 'opt_mov_2', intent: 'MOVIE_YES', text: "ज़रूर, मुझे बहुत खुशी होगी।" },
        { id: 'opt_mov_3', intent: 'MOVIE_DECLINE', text: "नहीं, मेरा मन नहीं है।" },
        { id: 'opt_mov_4', intent: 'MOVIE_LATER', text: "किसी और दिन चलते हैं।" },
        { id: 'opt_mov_5', intent: 'MOVIE_ASK', text: "हम कौन सी फ़िल्म देखने जा रहे हैं?" }
      ]
    }
  },
  {
    category: 'snack_preference',
    keywords: [
      'what would you like to eat', 'what do you want to eat', 'want snacks', 'want some snacks', 'some snacks',
      'chips', 'popcorn', 'thindi beku', 'en thindi beku', 'enu thindi',
      'ನಿಮಗೆ ಏನು ತಿನ್ನಬೇಕು', 'ಏನು ತಿನ್ನಬೇಕು', 'ಏನ್ ತಿನ್ನಬೇಕು', 'ಏನು ತಿಂಡಿ ಬೇಕು', 'ಏನ್ ತಿಂಡಿ', 'ಸ್ನ್ಯಾಕ್ಸ್', 'ತಿನ್ನಲು ಏನು ಬೇಕು',
      'क्या खाना चाहते', 'क्या खाओगे', 'कुछ स्नैक्स'
    ],
    options: {
      en: [
        { id: 'opt_snk_1', intent: 'FOOD_SNACK', text: "I'd like some snacks." },
        { id: 'opt_snk_2', intent: 'FOOD_CHIPS', text: "Can I have chips?" },
        { id: 'opt_snk_3', intent: 'FOOD_POPCORN', text: "I want popcorn." },
        { id: 'opt_snk_4', intent: 'FOOD_SWEET', text: "I'd prefer something sweet." },
        { id: 'opt_snk_5', intent: 'MEAL_DECLINED', text: "Nothing right now, thank you." }
      ],
      kn: [
        { id: 'opt_snk_1', intent: 'FOOD_SNACK', text: "ನನಗೆ ಸ್ವಲ್ಪ ತಿಂಡಿ ಬೇಕು." },
        { id: 'opt_snk_2', intent: 'FOOD_CHIPS', text: "ನನಗೆ ಚಿಪ್ಸ್ ಬೇಕು." },
        { id: 'opt_snk_3', intent: 'FOOD_SWEET', text: "ನನಗೆ ಸಿಹಿ ತಿಂಡಿ ಬೇಕು." },
        { id: 'opt_snk_4', intent: 'FOOD_FRUIT', text: "ನನಗೆ ಸ್ವಲ್ಪ ಹಣ್ಣು ಬೇಕು." },
        { id: 'opt_snk_5', intent: 'MEAL_DECLINED', text: "ಈಗ ಏನೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು." }
      ],
      hi: [
        { id: 'opt_snk_1', intent: 'FOOD_SNACK', text: "मुझे कुछ स्नैक्स चाहिए।" },
        { id: 'opt_snk_2', intent: 'FOOD_CHIPS', text: "क्या मुझे चिप्स मिल सकते हैं?" },
        { id: 'opt_snk_3', intent: 'FOOD_POPCORN', text: "मुझे पॉपकॉर्न चाहिए।" },
        { id: 'opt_snk_4', intent: 'FOOD_SWEET', text: "मुझे कुछ मीठा खाना है।" },
        { id: 'opt_snk_5', intent: 'MEAL_DECLINED', text: "अभी कुछ नहीं चाहिए, धन्यवाद।" }
      ]
    }
  },
  {
    category: 'tea_or_coffee',
    keywords: [
      'tea or coffee', 'coffee or tea', 'tea beka coffee beka', 'chaha beka coffee beka',
      'ನಿಮಗೆ ಚಹಾ ಬೇಕಾ ಅಥವಾ ಕಾಫಿ ಬೇಕಾ', 'ಚಹಾ ಬೇಕಾ ಅಥವಾ ಕಾಫಿ ಬೇಕಾ', 'ಕಾಫಿ ಬೇಕಾ ಅಥವಾ ಚಹಾ ಬೇಕಾ', 'ಚಹಾ ಅಥವಾ ಕಾಫಿ', 'ಕಾಫಿ ಅಥವಾ ಚಹಾ',
      'चाय या कॉफ़ी', 'कॉफ़ी या चाय'
    ],
    options: {
      en: [
        { id: 'opt_tc_1', intent: 'BEVERAGE_TEA', text: "I'd like tea, please." },
        { id: 'opt_tc_2', intent: 'BEVERAGE_COFFEE', text: "I want coffee." },
        { id: 'opt_tc_3', intent: 'BEVERAGE_NONE', text: "Neither, thank you." },
        { id: 'opt_tc_4', intent: 'WATER_REQUEST', text: "Can I have some water instead?" }
      ],
      kn: [
        { id: 'opt_tc_1', intent: 'BEVERAGE_TEA', text: "ನನಗೆ ಚಹಾ ಬೇಕು." },
        { id: 'opt_tc_2', intent: 'BEVERAGE_COFFEE', text: "ನನಗೆ ಕಾಫಿ ಬೇಕು." },
        { id: 'opt_tc_3', intent: 'BEVERAGE_NONE', text: "ಎರಡೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು." },
        { id: 'opt_tc_4', intent: 'BEVERAGE_OTHER', text: "ಬೇರೆ ಏನಾದರೂ ಕುಡಿಯಲು ಸಿಗುತ್ತದೆಯಾ?" }
      ],
      hi: [
        { id: 'opt_tc_1', intent: 'BEVERAGE_TEA', text: "मुझे चाय चाहिए, प्लीज।" },
        { id: 'opt_tc_2', intent: 'BEVERAGE_COFFEE', text: "मुझे कॉफ़ी चाहिए।" },
        { id: 'opt_tc_3', intent: 'BEVERAGE_NONE', text: "दोनों में से कुछ नहीं, शुक्रिया।" },
        { id: 'opt_tc_4', intent: 'WATER_REQUEST', text: "क्या मुझे इसके बदले पानी मिल सकता है?" }
      ]
    }
  },
  {
    category: 'feeling_better',
    keywords: [
      'feeling better', 'feel better', 'feeling any better', 'are you better', 'swalpa aram aitha', 'swalpa aram aagidya', 'aram aagidya',
      'ನಿಮಗೆ ಈಗ ಹೇಗನಿಸುತ್ತಿದೆ', 'ಹೇಗನಿಸುತ್ತಿದೆ', 'ಹೇಗನಿಸ್ತಿದೆ', 'ಸ್ವಲ್ಪ ಆರಾಮಾಗಿದೆಯಾ', 'ಆರಾಮಾಗಿದೆಯಾ', 'ಉಷಾರಾಗಿದ್ದೀರಾ', 'ಚೇತರಿಸಿಕೊಂಡಿದ್ದೀರಾ',
      'पहले से बेहतर', 'तबीयत ठीक है', 'अच्छा लग रहा है'
    ],
    options: {
      en: [
        { id: 'opt_fb_1', intent: 'FEELING_BETTER', text: "Yes, I'm feeling better." },
        { id: 'opt_fb_2', intent: 'FEELING_PARTIAL', text: "A little better." },
        { id: 'opt_fb_3', intent: 'FEELING_NOT_BETTER', text: "No, I still don't feel well." },
        { id: 'opt_fb_4', intent: 'FEELING_NEED_REST', text: "I need some rest." }
      ],
      kn: [
        { id: 'opt_fb_1', intent: 'FEELING_BETTER', text: "ನನಗೆ ಈಗ ಚೆನ್ನಾಗಿದೆ." },
        { id: 'opt_fb_2', intent: 'FEELING_PARTIAL', text: "ಸ್ವಲ್ಪ ಸುಧಾರಣೆಯಾಗಿದೆ." },
        { id: 'opt_fb_3', intent: 'FEELING_NOT_BETTER', text: "ನನಗೆ ಇನ್ನೂ ಸ್ವಲ್ಪ ಅಸ್ವಸ್ಥವಾಗಿದೆ." },
        { id: 'opt_fb_4', intent: 'FEELING_NEED_REST', text: "ನನಗೆ ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ಬೇಕು." }
      ],
      hi: [
        { id: 'opt_fb_1', intent: 'FEELING_BETTER', text: "हाँ, मैं पहले से बेहतर महसूस कर रहा हूँ।" },
        { id: 'opt_fb_2', intent: 'FEELING_PARTIAL', text: "थोड़ा बेहतर लग रहा है।" },
        { id: 'opt_fb_3', intent: 'FEELING_NOT_BETTER', text: "नहीं, अभी भी तबियत ठीक नहीं है।" },
        { id: 'opt_fb_4', intent: 'FEELING_NEED_REST', text: "मुझे आराम की ज़रूरत है।" }
      ]
    }
  },
  {
    category: 'assistance_offer',
    keywords: [
      'can i help you', 'do you want me to help', 'need any help', 'may i help', 'can i assist',
      'ಸಹಾಯ ಮಾಡಲಾ', 'ಸಹಾಯ ಬೇಕಾ', 'ಸಹಾಯ ಮಾಡ್ಲಾ', 'ಸಹಾಯ ಮಾಡಬೇಕಾ', 'sahaya madla', 'sahaya beka', 'help beka', 'मदद करूँ'
    ],
    options: {
      en: [
        { id: 'opt_as_1', intent: 'ACCEPT', text: "Yes please, that would be helpful." },
        { id: 'opt_as_2', intent: 'ACCEPT', text: "Thank you, I'd appreciate that." },
        { id: 'opt_as_3', intent: 'DECLINE', text: "No thank you, I can manage." },
        { id: 'opt_as_4', intent: 'LATER', text: "Maybe in a little while, thanks." }
      ],
      kn: [
        { id: 'opt_as_1', intent: 'ACCEPT', text: "ಹೌದು, ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ." },
        { id: 'opt_as_2', intent: 'DECLINE', text: "ಧನ್ಯವಾದಗಳು, ನಾನೇ ಮಾಡಿಕೊಳ್ಳುತ್ತೇನೆ." },
        { id: 'opt_as_3', intent: 'LATER', text: "ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮಾಡಿ." },
        { id: 'opt_as_4', intent: 'ACCEPT', text: "ತುಂಬಾ ಧನ್ಯವಾದಗಳು, ಹಾಗೇ ಮಾಡಿ." }
      ],
      hi: [
        { id: 'opt_as_1', intent: 'ACCEPT', text: "हाँ, कृपया मदद कर दीजिए।" },
        { id: 'opt_as_2', intent: 'DECLINE', text: "धन्यवाद, मैं खुद कर लूँगा।" },
        { id: 'opt_as_3', intent: 'LATER', text: "थोड़ी देर बाद करना।" },
        { id: 'opt_as_4', intent: 'ACCEPT', text: "बहुत धन्यवाद, ऐसा ही करें।" }
      ]
    }
  },
  {
    category: 'item_location',
    keywords: [
      'where did you leave', 'where did you put', 'where is your', 'where are your',
      'ಎಲ್ಲಿ ಇಟ್ಟಿದ್ದೀರಿ', 'ಎಲ್ಲಿ ಇಟ್ಟೆ', 'ಎಲ್ಲಿದೆ', 'ಕನ್ನಡಕ ಎಲ್ಲಿ', 'ಕನ್ನಡಕ ಎಲ್ಲಿದೆ', 'elli itt', 'elli ide'
    ],
    options: {
      en: [
        { id: 'opt_loc_1', intent: 'LOC_TABLE', text: "I think I left them on the table." },
        { id: 'opt_loc_2', intent: 'LOC_BED', text: "They might be next to my bed." },
        { id: 'opt_loc_3', intent: 'LOC_UNSURE', text: "I don't remember, could you help me look?" },
        { id: 'opt_loc_4', intent: 'LOC_ROOM', text: "They must be in the room." }
      ],
      kn: [
        { id: 'opt_loc_1', intent: 'LOC_TABLE', text: "ಮೇಜಿನ ಮೇಲೆ ಇಟ್ಟಿದ್ದೇನೆ ಅನಿಸುತ್ತದೆ." },
        { id: 'opt_loc_2', intent: 'LOC_BED', text: "ಹಾಸಿಗೆಯ ಪಕ್ಕ ಇರಬಹುದು." },
        { id: 'opt_loc_3', intent: 'LOC_UNSURE', text: "ನನಗೆ ನೆನಪಿಲ್ಲ, ಹುಡುಕಲು ಸಹಾಯ ಮಾಡ್ತೀರಾ?" },
        { id: 'opt_loc_4', intent: 'LOC_ROOM', text: "ಕೋಣೆಯಲ್ಲೇ ಇರಬೇಕು." }
      ],
      hi: [
        { id: 'opt_loc_1', intent: 'LOC_TABLE', text: "लगता है मेज पर रखा है।" },
        { id: 'opt_loc_2', intent: 'LOC_BED', text: "बिस्तर के पास हो सकता है।" },
        { id: 'opt_loc_3', intent: 'LOC_UNSURE', text: "मुझे याद नहीं, ढूँढने में मदद करेंगे?" },
        { id: 'opt_loc_4', intent: 'LOC_ROOM', text: "कमरे में ही होगा।" }
      ]
    }
  },
  {
    category: 'general_invitation',
    keywords: [
      'shall we', "why don't we", 'would you like to', 'how about we',
      'ಓದೋಣವೇ', 'ಓದೋಣ್ವಾ', 'ಓದೋಣ', 'ಮಾಡೋಣವೇ', 'ಮಾಡೋಣ್ವಾ', 'ಹೋಗೋಣವೇ', 'ಕೇಳೋಣವೇ'
    ],
    options: {
      en: [
        { id: 'opt_inv_1', intent: 'ACCEPT', text: "Yes, I would love to!" },
        { id: 'opt_inv_2', intent: 'ACCEPT', text: "Sure, that sounds wonderful." },
        { id: 'opt_inv_3', intent: 'DECLINE', text: "No thank you, I prefer to rest today." },
        { id: 'opt_inv_4', intent: 'LATER', text: "Maybe a little later." }
      ],
      kn: [
        { id: 'opt_inv_1', intent: 'ACCEPT', text: "ಹೌದು, ಖಂಡಿತ ಮಾಡೋಣ!" },
        { id: 'opt_inv_2', intent: 'ACCEPT', text: "ಖಂಡಿತ, ನನಗೂ ತುಂಬಾ ಇಷ್ಟ." },
        { id: 'opt_inv_3', intent: 'DECLINE', text: "ಬೇಡ, ನನಗೆ ಸ್ವಲ್ಪ ಆಯಾಸವಾಗಿದೆ." },
        { id: 'opt_inv_4', intent: 'LATER', text: "ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮಾಡೋಣ." }
      ],
      hi: [
        { id: 'opt_inv_1', intent: 'ACCEPT', text: "हाँ, मुझे बहुत अच्छा लगेगा!" },
        { id: 'opt_inv_2', intent: 'ACCEPT', text: "ज़रूर, बहुत बढ़िया रहेगा।" },
        { id: 'opt_inv_3', intent: 'DECLINE', text: "नहीं शुक्रिया, मैं थोड़ा आराम करना चाहता हूँ।" },
        { id: 'opt_inv_4', intent: 'LATER', text: "थोड़ी देर बाद करते हैं।" }
      ]
    }
  },
  {
    category: 'reason_question',
    keywords: [
      'why are you', 'why do you', 'why did you', 'what makes you',
      'ಯಾಕೆ ಇಷ್ಟು', 'ಯಾಕೆ ಸುಮ್ಮನೆ', 'ಚಿಂತೆ ಮಾಡ್ತಿದ್ದೀರಿ', 'ಏಕೆ', 'ಯಾಕೆ', 'ಯಾತಕ್ಕೆ', 'ಕ್ಯೂಂ'
    ],
    options: {
      en: [
        { id: 'opt_rsn_1', intent: 'EXPLAIN_TIRED', text: "I'm just feeling a bit tired today." },
        { id: 'opt_rsn_2', intent: 'EXPLAIN_FINE', text: "Nothing is wrong, I am doing fine." },
        { id: 'opt_rsn_3', intent: 'EXPLAIN_THINKING', text: "I was just thinking about something." },
        { id: 'opt_rsn_4', intent: 'EXPLAIN_WORDS', text: "Just struggling a little to find words." }
      ],
      kn: [
        { id: 'opt_rsn_1', intent: 'EXPLAIN_TIRED', text: "ಸ್ವಲ್ಪ ಆಯಾಸವಾಗಿದೆ, ಅಷ್ಟೇ." },
        { id: 'opt_rsn_2', intent: 'EXPLAIN_FINE', text: "ಏನೂ ಇಲ್ಲ, ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ." },
        { id: 'opt_rsn_3', intent: 'EXPLAIN_THINKING', text: "ನಾನು ಏನೋ ಯೋಚನೆ ಮಾಡುತ್ತಿದ್ದೆ." },
        { id: 'opt_rsn_4', intent: 'EXPLAIN_WORDS', text: "ಸ್ವಲ್ಪ ಮಾತು ಸರಿಯಾಗಿ ಬರುತ್ತಿಲ್ಲ." }
      ],
      hi: [
        { id: 'opt_rsn_1', intent: 'EXPLAIN_TIRED', text: "बस थोड़ी थकान महसूस हो रही है।" },
        { id: 'opt_rsn_2', intent: 'EXPLAIN_FINE', text: "कुछ नहीं, मैं बिल्कुल ठीक हूँ।" },
        { id: 'opt_rsn_3', intent: 'EXPLAIN_THINKING', text: "मैं बस कुछ सोच रहा था।" },
        { id: 'opt_rsn_4', intent: 'EXPLAIN_WORDS', text: "शब्द ढूँढने में थोड़ी परेशानी हो रही है।" }
      ]
    }
  },
  {
    category: 'what_drink',
    keywords: [
      'what do you want to drink', 'what to drink', 'which drink', 'what drink', 'want to drink', 'like to drink',
      'en kudi', 'enu kudi', 'en kudibeku', 'enu kudibeku',
      'ಏನು ಕುಡಿ', 'ಏನ್ ಕುಡಿ', 'ಏನು ಕುಡಿಯಬೇಕು', 'ಏನ್ ಕುಡಿಯಬೇಕು', 'ಏನ್ ಬೇಕು ಕುಡಿಯೋಕೆ', 'ಏನು ಬೇಕು ಕುಡಿಯಲು',
      'क्या पीना', 'क्या पियोगे', 'क्या पीना चाहते'
    ],
    options: {
      en: [
        { id: 'opt_wd_1', intent: 'DRINK_WATER', text: 'I want water.' },
        { id: 'opt_wd_2', intent: 'DRINK_TEA', text: 'I want hot tea or coffee.' },
        { id: 'opt_wd_3', intent: 'DRINK_JUICE', text: 'I want juice or warm milk.' },
        { id: 'opt_wd_4', intent: 'DRINK_NONE', text: 'Nothing right now, thank you.' }
      ],
      kn: [
        { id: 'opt_wd_1', intent: 'DRINK_WATER', text: 'ನನಗೆ ನೀರು ಬೇಕು.' },
        { id: 'opt_wd_2', intent: 'DRINK_TEA', text: 'ನನಗೆ ಬಿಸಿ ಚಹಾ ಅಥವಾ ಕಾಫಿ ಬೇಕು.' },
        { id: 'opt_wd_3', intent: 'DRINK_JUICE', text: 'ನನಗೆ ಎಳೆನೀರು ಅಥವಾ ಹಾಲು ಬೇಕು.' },
        { id: 'opt_wd_4', intent: 'DRINK_NONE', text: 'ಈಗ ಏನೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು.' }
      ],
      hi: [
        { id: 'opt_wd_1', intent: 'DRINK_WATER', text: 'मुझे पानी चाहिए।' },
        { id: 'opt_wd_2', intent: 'DRINK_TEA', text: 'मुझे गरम चाय या कॉफ़ी चाहिए।' },
        { id: 'opt_wd_3', intent: 'DRINK_JUICE', text: 'मुझे दूध या जूस चाहिए।' },
        { id: 'opt_wd_4', intent: 'DRINK_NONE', text: 'अभी कुछ नहीं चाहिए।' }
      ]
    }
  },
  {
    category: 'pain',
    keywords: [
      'pain', 'hurt', 'aches', 'sore', 'ouch', 'sick',
      'ನೋವು', 'ನೋವ', 'ನೋವಾಗ್ತಿದೆ', 'ನೋವಾಗುತ್ತಿದೆಯಾ', 'nov', 'novag', 'novide', 'ಕಷ್ಟ',
      'दर्द', 'तकलीफ़'
    ],
    options: {
      en: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'No, I am not in pain.' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'I have mild pain.' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'Yes, severe pain.' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'I need my pain medicine.' }
      ],
      kn: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'ಇಲ್ಲ, ನನಗೆ ನೋವಿಲ್ಲ.' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'ಸ್ವಲ್ಪ ನೋವಿದೆ.' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'ಹೌದು, ಹೆಚ್ಚು ನೋವಿದೆ.' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'ನನಗೆ ನೋವಿನ ಔಷಧಿ ಕೊಡಿ.' }
      ],
      hi: [
        { id: 'opt_pain_1', intent: 'PAIN_NONE', text: 'नहीं, मुझे दर्द नहीं है।' },
        { id: 'opt_pain_2', intent: 'PAIN_MILD', text: 'थोड़ा दर्द है।' },
        { id: 'opt_pain_3', intent: 'PAIN_SEVERE', text: 'हाँ, बहुत दर्द है।' },
        { id: 'opt_pain_4', intent: 'HELP', text: 'मुझे दर्द की दवा दे दो।' }
      ]
    }
  },
  {
    category: 'water',
    keywords: [
      'water', 'drink', 'thirsty', 'hydration', 'cup', 'glass',
      'neer', 'neeru', 'niru', 'kudi', 'kudithira', 'kudibeka', 'beka',
      'pani', 'paani', 'peena', 'pila',
      'ಕುಡಿಯಲು', 'ನೀರು', 'ದಾಹ', 'पानी', 'प्यास', 'पिऊंगा', 'पीना'
    ],
    options: {
      en: [
        { id: 'opt_water_1', intent: 'WATER_REQUEST', text: 'Yes, please give me water.' },
        { id: 'opt_water_2', intent: 'NO', text: 'No, I am not thirsty right now.' },
        { id: 'opt_water_3', intent: 'WATER_WARM', text: 'Could I get some warm water?' },
        { id: 'opt_water_4', intent: 'HELP', text: 'I need help drinking.' }
      ],
      kn: [
        { id: 'opt_water_1', intent: 'WATER_REQUEST', text: 'ಹೌದು, ದಯವಿಟ್ಟು ನನಗೆ ನೀರು ಕೊಡಿ.' },
        { id: 'opt_water_2', intent: 'NO', text: 'ಇಲ್ಲ, ಈಗ ನನಗೆ ದಾಹವಿಲ್ಲ.' },
        { id: 'opt_water_3', intent: 'WATER_WARM', text: 'ಸ್ವಲ್ಪ ಬಿಸಿ ನೀರು ಕೊಡ್ತೀರಾ?' },
        { id: 'opt_water_4', intent: 'HELP', text: 'ನನಗೆ ಕುಡಿಯಲು ಸಹಾಯ ಬೇಕು.' }
      ],
      hi: [
        { id: 'opt_water_1', intent: 'WATER_REQUEST', text: 'हाँ, कृपया मुझे पानी दीजिए।' },
        { id: 'opt_water_2', intent: 'NO', text: 'नहीं, अभी मुझे प्यास नहीं लगी है।' },
        { id: 'opt_water_3', intent: 'WATER_WARM', text: 'थोड़ा गुनगुना पानी दे दो।' },
        { id: 'opt_water_4', intent: 'HELP', text: 'मुझे पीने में मदद चाहिए।' }
      ]
    }
  },
  {
    category: 'beverage',
    keywords: [
      'tea', 'coffee', 'chai', 'chaha', 'kafi', 'chaha beka', 'coffee beka',
      'ಚಹಾ', 'ಕಾಫಿ', 'ಚಾಯ್', 'चाय', 'कॉफ़ी'
    ],
    options: {
      en: [
        { id: 'opt_bev_1', intent: 'BEVERAGE_TEA', text: 'Yes, hot tea please!' },
        { id: 'opt_bev_2', intent: 'BEVERAGE_COFFEE', text: 'I would love some coffee.' },
        { id: 'opt_bev_3', intent: 'BEVERAGE_WATER', text: 'No, just water is fine.' },
        { id: 'opt_bev_4', intent: 'BEVERAGE_NONE', text: 'Nothing right now, thank you.' }
      ],
      kn: [
        { id: 'opt_bev_1', intent: 'BEVERAGE_TEA', text: 'ಹೌದು, ಬಿಸಿ ಚಹಾ ಕೊಡಿ!' },
        { id: 'opt_bev_2', intent: 'BEVERAGE_COFFEE', text: 'ನನಗೆ ಕಾಫಿ ಬೇಕು.' },
        { id: 'opt_bev_3', intent: 'BEVERAGE_WATER', text: 'ಇಲ್ಲ, ಬರಿ ನೀರು ಸಾಕು.' },
        { id: 'opt_bev_4', intent: 'BEVERAGE_NONE', text: 'ಈಗ ಏನೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು.' }
      ],
      hi: [
        { id: 'opt_bev_1', intent: 'BEVERAGE_TEA', text: 'हाँ, गरम चाय दे दो!' },
        { id: 'opt_bev_2', intent: 'BEVERAGE_COFFEE', text: 'मुझे कॉफ़ी चाहिए।' },
        { id: 'opt_bev_3', intent: 'BEVERAGE_WATER', text: 'नहीं, सिर्फ पानी चलेगा।' },
        { id: 'opt_bev_4', intent: 'BEVERAGE_NONE', text: 'अभी कुछ नहीं चाहिए, शुक्रिया।' }
      ]
    }
  },
  {
    category: 'meal_check',
    keywords: [
      'oota aitha', 'oota aayitha', 'uuta aitha', 'oota madid', 'oota maadid',
      'did you eat', 'have you eaten', 'had lunch', 'had dinner', 'had food',
      'ಊಟ ಆಯ್ತಾ', 'ಊಟ ಮಾಡಿದ್ರಾ', 'ಊಟ ಮಾಡಿದ್ದೀರಾ', 'ತಿಂಡಿ ಆಯ್ತಾ',
      'खाना खाया', 'खाना खा लिया'
    ],
    options: {
      en: [
        { id: 'opt_mc_1', intent: 'MEAL_COMPLETED', text: 'Yes, I have eaten.' },
        { id: 'opt_mc_2', intent: 'MEAL_NOT_EATEN', text: "No, I haven't eaten yet." },
        { id: 'opt_mc_3', intent: 'MEAL_HUNGRY', text: "I am hungry, please give me food." },
        { id: 'opt_mc_4', intent: 'MEAL_DECLINED', text: 'I am not hungry right now.' }
      ],
      kn: [
        { id: 'opt_mc_1', intent: 'MEAL_COMPLETED', text: 'ಹೌದು, ನಾನು ಊಟ ಮಾಡಿದ್ದೇನೆ.' },
        { id: 'opt_mc_2', intent: 'MEAL_NOT_EATEN', text: 'ಇಲ್ಲ, ನಾನು ಇನ್ನೂ ಊಟ ಮಾಡಿಲ್ಲ.' },
        { id: 'opt_mc_3', intent: 'MEAL_HUNGRY', text: 'ಸ್ವಲ್ಪ ಹಸಿವಾಗಿದೆ, ಊಟ ಕೊಡಿ.' },
        { id: 'opt_mc_4', intent: 'MEAL_DECLINED', text: 'ಇಲ್ಲ, ಈಗ ಹಸಿವಿಲ್ಲ.' }
      ],
      hi: [
        { id: 'opt_mc_1', intent: 'MEAL_COMPLETED', text: 'हाँ, मैंने खाना खा लिया।' },
        { id: 'opt_mc_2', intent: 'MEAL_NOT_EATEN', text: 'नहीं, मैंने अभी नहीं खाया।' },
        { id: 'opt_mc_3', intent: 'MEAL_HUNGRY', text: 'थोड़ी भूख लगी है, खाना दे दो।' },
        { id: 'opt_mc_4', intent: 'MEAL_DECLINED', text: 'अभी भूख नहीं है।' }
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
    keywords: [
      'eat', 'food', 'lunch', 'dinner', 'breakfast', 'meal', 'hungry',
      'oota', 'uuta', 'thindi', 'tindi', 'hasi', 'tinna', 'tinnu',
      'ಊಟ', 'ತಿಂಡಿ', 'ಆಹಾರ', 'ಹಸಿವು', 'ತಿನ್ನ', 'ತಿನ್ನಲು', 'ತಿನ್ನಲಿ', 'ತಿನ್ನು', 'खाना', 'लंच', 'भोजन', 'भूख'
    ],
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
    category: 'travel_mandya',
    keywords: [
      'mandya', 'mysore', 'travel', 'barta', 'barthira', 'yavaga', 'yavag', 'city', 'hogona',
      'ಮಂಡ್ಯ', 'ಮೈಸೂರು', 'ಯಾವಾಗ', 'ಪ್ರಯಾಣ'
    ],
    options: {
      en: [
        { id: 'opt_tm_1', intent: 'TRAVEL_TOMORROW', text: 'Let us go to Mandya tomorrow!' },
        { id: 'opt_tm_2', intent: 'TRAVEL_SOON', text: 'I will be coming very soon.' },
        { id: 'opt_tm_3', intent: 'TRAVEL_LATER', text: 'Let us decide in a little while.' },
        { id: 'opt_tm_4', intent: 'TRAVEL_CANT', text: 'I cannot travel right now.' }
      ],
      kn: [
        { id: 'opt_tm_1', intent: 'TRAVEL_TOMORROW', text: 'ನಾಳೆ ಮಂಡ್ಯಗೆ ಹೋಗೋಣ!' },
        { id: 'opt_tm_2', intent: 'TRAVEL_SOON', text: 'ನಾನು ಶೀಘ್ರದಲ್ಲೇ ಬರುತ್ತೇನೆ.' },
        { id: 'opt_tm_3', intent: 'TRAVEL_LATER', text: 'ಸ್ವಲ್ಪ ದಿನಗಳ ನಂತರ ತೀರ್ಮಾನಿಸೋಣ.' },
        { id: 'opt_tm_4', intent: 'TRAVEL_CANT', text: 'ನನಗೆ ಈಗ ಪ್ರಯಾಣ ಮಾಡಲು ಆಗುವುದಿಲ್ಲ.' }
      ],
      hi: [
        { id: 'opt_tm_1', intent: 'TRAVEL_TOMORROW', text: 'कल मंड्या चलेंगे!' },
        { id: 'opt_tm_2', intent: 'TRAVEL_SOON', text: 'मैं जल्द ही आऊँगा।' },
        { id: 'opt_tm_3', intent: 'TRAVEL_LATER', text: 'थोड़ी देर बाद तय करते हैं।' },
        { id: 'opt_tm_4', intent: 'TRAVEL_CANT', text: 'मैं अभी यात्रा नहीं कर सकता।' }
      ]
    }
  },
  {
    category: 'medicine_check',
    keywords: [
      'matre tagond', 'matre thagond', 'tablet tagond', 'tablet thagond',
      'take your medicine', 'took medicine', 'taken medicine', 'take your pill',
      'ಮಾತ್ರೆ ತಗೊಂಡ್ರಾ', 'ಔಷಧಿ ತಗೊಂಡ್ರಾ', 'ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡ್ರಾ',
      'dawa li', 'दवा ली'
    ],
    options: {
      en: [
        { id: 'opt_medc_1', intent: 'MEDICINE_TAKEN', text: 'Yes, I took my medicine.' },
        { id: 'opt_medc_2', intent: 'MEDICINE_NOT_TAKEN', text: "No, I haven't taken it yet." },
        { id: 'opt_medc_3', intent: 'MEDICINE_NEED', text: 'Please give me my medicine.' },
        { id: 'opt_medc_4', intent: 'MEDICINE_UNSURE', text: "I don't remember." }
      ],
      kn: [
        { id: 'opt_medc_1', intent: 'MEDICINE_TAKEN', text: 'ಹೌದು, ನಾನು ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ.' },
        { id: 'opt_medc_2', intent: 'MEDICINE_NOT_TAKEN', text: 'ಇಲ್ಲ, ನಾನು ಇನ್ನೂ ತೆಗೆದುಕೊಂಡಿಲ್ಲ.' },
        { id: 'opt_medc_3', intent: 'MEDICINE_NEED', text: 'ದಯವಿಟ್ಟು ನನಗೆ ಮಾತ್ರೆ ಕೊಡಿ.' },
        { id: 'opt_medc_4', intent: 'MEDICINE_UNSURE', text: 'ನನಗೆ ನೆನಪಿಲ್ಲ.' }
      ],
      hi: [
        { id: 'opt_medc_1', intent: 'MEDICINE_TAKEN', text: 'हाँ, मैंने दवा ले ली है।' },
        { id: 'opt_medc_2', intent: 'MEDICINE_NOT_TAKEN', text: 'नहीं, मैंने अभी नहीं ली।' },
        { id: 'opt_medc_3', intent: 'MEDICINE_NEED', text: 'कृपया मुझे दवा दे दो।' },
        { id: 'opt_medc_4', intent: 'MEDICINE_UNSURE', text: 'मुझे याद नहीं है।' }
      ]
    }
  },
  {
    category: 'help',
    keywords: ['emergency', 'urgent', 'help me', 'need help', 'call doctor', 'call ambulance', 'ಸಹಾಯ ಬೇಕು', 'ಮದತ್ ಬೇಕು', 'मदद चाहिए', 'सहायता चाहिए'],
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
    keywords: ['how are you feeling', 'how do you feel', 'how are you', 'how you feel', 'feeling today', 'ಚೆನ್ನಾಗಿದ್ದೀರಾ', 'ಹೇಗಿದ್ದೀರಾ', 'ಆರೋಗ್ಯ ಹೇಗಿದೆ', 'कैसे हो', 'हाल कैसा', 'कैसा महसूस'],
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

const findDeterministicMatch = (question, language = 'en') => {
  const normalizedLang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';
  const qLower = (question || '').toLowerCase();

  for (const rule of DETERMINISTIC_RULES) {
    if (rule.keywords.some((kw) => qLower.includes(kw.toLowerCase()))) {
      const canonicalOptions = (rule.options[normalizedLang] || rule.options.en).map((opt) => {
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
  return null;
};

/**
 * Execute local deterministic reasoning engine
 */
const getDeterministicFallback = (question, language = 'en') => {
  const normalizedLang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';

  const match = findDeterministicMatch(question, normalizedLang);
  if (match) return match;

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

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const modelCandidates = Array.from(new Set([
    primaryModel,
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest'
  ])).filter(Boolean);
  const normalizedLang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';
  const sanitizedQuestion = (question || '').trim();

  const contextSnippet = patientContext
    ? `Patient Context: Name=${patientContext.fullName || 'Patient'}, Age=${patientContext.age || 'Adult'}, Gender=${patientContext.gender || 'unspecified'}.`
    : '';

  const systemPrompt = `You are an expressive, context-aware speech generation engine for an aphasia patient application (VoiceBack).
Companion Utterance: "${sanitizedQuestion}"
Target Language: "${normalizedLang}" (en = English, kn = Kannada, hi = Hindi)
${contextSnippet}

Task:
Dynamically understand the exact meaning, intent, question, emotion, and context of the companion's utterance (which can be ANY question, invitation, suggestion, preference inquiry, observation, story, check-in, or statement).
Generate 4 to 5 short, natural, patient-friendly response options that directly and contextually answer, react to, or continue the conversation with the companion.

Language & Script Guidance:
- When Target Language is "kn" (Kannada):
  * All response options MUST be written in clean, natural, grammatically correct native Kannada script (ಕನ್ನಡ ಲಿಪಿ).
  * The companion's speech may be in Kannada script, Romanized/phonetic Kannada (e.g. "chaha beka coffee beka", "oota aitha", "thindi beku", "cinema nodonva", "swalpa aram aitha"), or mixed Kannada-English (e.g. "Doctor ge call madla?", "Sweater hakalu help beka?"). Accurately decipher the intended meaning and emotion.
  * Responses MUST reflect authentic colloquial spoken Kannada from the patient's first-person perspective:
    - For invitations ("ನಾವು ಸಿನಿಮಾ ನೋಡಲು ಹೋಗೋಣವೇ?", "ಹೊರಗೆ ಹೋಗೋಣ್ವಾ?"): e.g. "ಹೌದು, ಹೋಗೋಣ!", "ಸರಿ, ನನಗೆ ಇಷ್ಟ.", "ಬೇಡ, ನನಗೆ ಆಸಕ್ತಿ ಇಲ್ಲ.", "ಇನ್ನೊಂದು ದಿನ ಹೋಗೋಣ.", "ನಾವು ಯಾವ ಸಿನಿಮಾ ನೋಡಲು ಹೋಗುತ್ತಿದ್ದೇವೆ?"
    - For food/snack preferences ("ನಿಮಗೆ ಏನು ತಿನ್ನಬೇಕು?", "ಏನ್ ಊಟ ಬೇಕು?"): e.g. "ನನಗೆ ಸ್ವಲ್ಪ ತಿಂಡಿ ಬೇಕು.", "ನನಗೆ ಚಿಪ್ಸ್ ಬೇಕು.", "ನನಗೆ ಸಿಹಿ ತಿಂಡಿ ಬೇಕು.", "ನನಗೆ ಸ್ವಲ್ಪ ಹಣ್ಣು ಬೇಕು.", "ಈಗ ಏನೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು."
    - For choices ("ನಿಮಗೆ ಚಹಾ ಬೇಕಾ ಅಥವಾ ಕಾಫಿ ಬೇಕಾ?", "X ಅಥವಾ Y?"): e.g. "ನನಗೆ ಚಹಾ ಬೇಕು.", "ನನಗೆ ಕಾಫಿ ಬೇಕು.", "ಎರಡೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು.", "ಬೇರೆ ಏನಾದರೂ ಕುಡಿಯಲು ಸಿಗುತ್ತದೆಯಾ?"
    - For wellbeing ("ನಿಮಗೆ ಈಗ ಹೇಗನಿಸುತ್ತಿದೆ?", "ಸ್ವಲ್ಪ ಆರಾಮಾಗಿದೆಯಾ?"): e.g. "ನನಗೆ ಈಗ ಚೆನ್ನಾಗಿದೆ.", "ಸ್ವಲ್ಪ ಸುಧಾರಣೆಯಾಗಿದೆ.", "ನನಗೆ ಇನ್ನೂ ಸ್ವಲ್ಪ ಅಸ್ವಸ್ಥವಾಗಿದೆ.", "ನನಗೆ ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ಬೇಕು."
    - For assistance offers ("ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲಾ?", "ಸ್ವೆಟರ್ ಹಾಕಲು ಸಹಾಯ ಬೇಕಾ?"): e.g. "ಹೌದು, ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ.", "ಧನ್ಯವಾದಗಳು, ನಾನೇ ಮಾಡಿಕೊಳ್ಳುತ್ತೇನೆ.", "ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮಾಡಿ."
    - For location inquiries ("ನಿಮ್ಮ ಕನ್ನಡಕ ಎಲ್ಲಿ ಇಟ್ಟಿದ್ದೀರಿ?"): e.g. "ಮೇಜಿನ ಮೇಲೆ ಇಟ್ಟಿದ್ದೇನೆ ಅನಿಸುತ್ತದೆ.", "ಹಾಸಿಗೆಯ ಪಕ್ಕ ಇರಬಹುದು.", "ನನಗೆ ನೆನಪಿಲ್ಲ, ಹುಡುಕಲು ಸಹಾಯ ಮಾಡ್ತೀರಾ?"
    - For reason questions ("ಯಾಕೆ ಇಷ್ಟು ಚಿಂತೆ ಮಾಡ್ತಿದ್ದೀರಿ?", "ಯಾಕೆ ಸುಮ್ಮನೆ ಕುಳಿತಿದ್ದೀರಿ?"): e.g. "ಸ್ವಲ್ಪ ಆಯಾಸವಾಗಿದೆ, ಅಷ್ಟೇ.", "ಏನೂ ಇಲ್ಲ, ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ.", "ನಾನು ಏನೋ ಯೋಚನೆ ಮಾಡುತ್ತಿದ್ದೆ."
    - For news/observations ("ನಿಮ್ಮ ಮೊಮ್ಮಗ ಇವತ್ತು ಮ್ಯಾಚ್ ಗೆದ್ದಿದ್ದಾನೆ", "ಹೂವುಗಳು ಅರಳಿವೆ"): e.g. "ಕೇಳಿ ತುಂಬಾ ಸಂತೋಷವಾಯಿತು!", "ಅವನು ತುಂಬಾ ಚೆನ್ನಾಗಿ ಆಡಿದ್ದಾನೆ.", "ಹೌದು, ತುಂಬಾ ಸುಂದರವಾಗಿವೆ."
    - For general yes/no questions ("ನೀವು ಬೆಳಗ್ಗೆ ವಾಕಿಂಗ್ ಹೋಗಿದ್ದೀರಾ?"): e.g. "ಹೌದು, ನಾನು ಹೋಗಿದ್ದೆ.", "ಇಲ್ಲ, ನಾನು ಇನ್ನೂ ಹೋಗಿಲ್ಲ.", "ಸ್ವಲ್ಪ ಹೊತ್ತಿನ ನಂತರ ಹೋಗುತ್ತೇನೆ."
  * Never return unrelated placeholders (never say "ನಾನು ಟಿವಿ ನೋಡುತ್ತಿದ್ದೇನೆ" or generic health options unless that was the actual topic).

Rules:
1. Options MUST be first-person PATIENT responses directly addressing what the companion just said.
2. NEVER generate caregiver or assistant replies (NEVER "How can I help you?", "I am here for you", etc.).
3. Each option MUST include:
   - "id": string unique identifier (e.g., "opt_1", "opt_2")
   - "intent": UPPERCASE language-independent semantic intent code (e.g., "ACCEPT", "DECLINE", "PREFERENCE", "STATUS", "CLARIFY", "AGREE", "YES", "NO")
   - "text": natural, conversational response sentence written strictly in the target language (${normalizedLang}) using only native script (Kannada for kn, Devanagari for hi, English for en). Do not mix scripts.
4. Return ONLY a raw valid JSON object with NO markdown codeblocks or extra text.

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
          timeout: 7000
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
 * Intelligent utterance language detector
 * Detects native Unicode script, Romanized/phonetic patterns, or mixed speech
 */
const detectUtteranceLanguage = (text, defaultLang = 'en') => {
  if (!text || typeof text !== 'string') return defaultLang;
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Native Unicode script detection
  if (/[\u0C80-\u0CFF]/.test(clean)) return 'kn';
  if (/[\u0900-\u097F]/.test(clean)) return 'hi';

  // 2. Romanized / Phonetic Kannada keywords & inflectional morphemes
  const romanKnPattern = /\b(niru|neeru|neer|kudi|kudithira|kudithiya|beka|beku|beda|oota|uuta|thindi|tindi|aitha|aayitha|madid|madidira|madthira|madla|madodu|madona|nodona|hogona|nodalu|hogonva|kelona|nov|novu|novag|novide|hegidira|hegiddira|hegide|heganisthide|chennag|aram|arogya|chaha|kafi|matre|maathre|tagond|thagond|malag|malagthira|nidre|nidde|mandya|yavaga|sowchalaya|nanna|nimage|nanage|neevu|naavu|ellaru|elli|enu|en|yake|yaake|eke|yathakke|bekagidya|swalpa|ivathu|nale|sahaya|tara|barla|baralla|idu|adhu|yaru|yaaru)\b/i;

  // 3. Mixed Kannada-English speech patterns
  const mixedKnPattern = /(\bdoctor\s+ge\b|\bcall\s+madla\b|\bhelp\s+beka\b|\bwalk\s+ge\b|\bcoffee\s+kudithira\b|\btea\s+kudithira\b|\bmatch\s+gedd\b|\bbook\s+od\b|\bcinema\s+nod\b|\bmovie\s+nod\b|\bge\s+call\b|\bge\s+hog\b|\bge\s+bar\b|\bhakalu\s+sahaya\b|\bhakalu\s+help\b)/i;

  if (romanKnPattern.test(lower) || mixedKnPattern.test(lower)) {
    return 'kn';
  }

  // 4. Romanized Hindi patterns
  const romanHiPattern = /\b(pani|paani|peena|khana|khaana|khaya|dard|taklif|dawa|goli|kaise|kaisa|haal|sona|aaram|thaka|chay|chai|bahar|chahiye|karo|batao)\b/i;
  if (romanHiPattern.test(lower)) {
    return 'hi';
  }

  return defaultLang;
};

/**
 * Main Context Engine Service entry point
 * Attempts Gemini API call first, falls back gracefully to local deterministic engine
 */
const generateResponseOptions = async ({ question, caregiverQuestion, language = 'en', patientContext = null }) => {
  const actualQuestion = question || caregiverQuestion;
  let normalizedLang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';

  // Dynamic Language Detection: detect native Kannada/Hindi script, Romanized, or mixed speech
  const detectedLang = detectUtteranceLanguage(actualQuestion, normalizedLang);
  if (detectedLang !== normalizedLang) {
    normalizedLang = detectedLang;
  }

  if (!actualQuestion || typeof actualQuestion !== 'string' || !actualQuestion.trim()) {
    return {
      question: '',
      language: normalizedLang,
      intentContext: 'empty_question',
      options: SAFE_GENERIC_FALLBACKS[normalizedLang]
    };
  }

  let rawResult = null;

  // 1. Attempt Gemini dynamic contextual generation first
  if (process.env.GEMINI_API_KEY) {
    try {
      rawResult = await callGeminiAPI(actualQuestion, normalizedLang, patientContext);
    } catch (err) {
      console.warn(`[ContextEngine] Gemini dynamic generation bypassed (${err.message}). Using contextual fallback.`);
    }
  }

  // 2. Safe contextual fallback if Gemini generation failed or unavailable
  if (!rawResult || !Array.isArray(rawResult.options) || rawResult.options.length === 0) {
    rawResult = getDeterministicFallback(actualQuestion, normalizedLang);
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

/**
 * Contextual Aphasia Speech Interpretation, Reconstruction & Confirmation Layer
 * Corrects misheard words, phonetic slips, and dysarthric/aphasic speech attempts conservatively.
 * Detects ambiguity (e.g. "bring med") and unclear speech (e.g. "wa...ter... pl...") without fabricating data.
 * Keeps reconstructed meaning candidate until explicit patient confirmation.
 */
const correctAphasicSpeech = async (params = {}) => {
  const rawInput = params.rawTranscript !== undefined ? params.rawTranscript : (params.rawText !== undefined ? params.rawText : '');
  const language = params.language || 'en';
  const context = params.context || '';
  const previousUtterance = params.previousUtterance || '';

  if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
    return {
      rawText: rawInput || '',
      rawTranscript: rawInput || '',
      correctedText: '',
      reconstructedText: '',
      status: 'EMPTY',
      isAmbiguous: false,
      isUnclear: true,
      reconstructionReason: 'No speech input detected',
      confirmationPrompt: null,
      clarificationPrompt: 'No clear speech was detected. Please try speaking again.',
      intent: 'GENERIC_FALLBACK',
      entities: {},
      confidence: 0,
      language: 'en',
      requiresConfirmation: false
    };
  }

  const text = rawInput.trim();
  const normalizedLang = ['en', 'kn', 'hi'].includes(language)
    ? language
    : /[\u0C80-\u0CFF]/.test(text)
    ? 'kn'
    : /[\u0900-\u097F]/.test(text)
    ? 'hi'
    : 'en';

  // Check for acoustic-only or noise bracket tags (e.g. "[silence]", "[cough]", "...")
  const cleanStripped = text
    .replace(/\[(pause|silence|cough|sigh|snort|laughter|music|clearing|throat-clearing|applause|cheering|noise|static)\]/gi, '')
    .trim();

  if (!cleanStripped || cleanStripped === '.' || cleanStripped === '...' || cleanStripped === '…') {
    return {
      rawText: text,
      rawTranscript: text,
      correctedText: '',
      reconstructedText: '',
      status: 'EMPTY',
      isAmbiguous: false,
      isUnclear: true,
      reconstructionReason: 'No audible patient vocalization detected',
      confirmationPrompt: null,
      clarificationPrompt: normalizedLang === 'kn'
        ? 'ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ.'
        : normalizedLang === 'hi'
        ? 'कोई आवाज नहीं सुनाई दी। कृपया दोबारा बोलें।'
        : 'No clear speech was detected. Please try speaking again.',
      intent: 'GENERIC_FALLBACK',
      entities: {},
      confidence: 0,
      language: normalizedLang,
      requiresConfirmation: false
    };
  }

  // Step 1: Deterministic Speech Clarity & Fragmentation Check
  const clarityCheck = nlpProcessorService.assessSpeechClarity(text);
  if (clarityCheck.isUnclear) {
    const clarificationPrompt = normalizedLang === 'kn'
      ? 'ಧ್ವನಿ ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.'
      : normalizedLang === 'hi'
      ? 'आवाज साफ समझ नहीं आई। कृपया दोबारा स्पष्ट रूप से बोलें।'
      : 'Speech was fragmented or unclear. Could you please repeat that?';

    return {
      rawText: text,
      rawTranscript: text,
      correctedText: text,
      reconstructedText: text,
      status: 'UNCLEAR',
      isAmbiguous: false,
      isUnclear: true,
      reconstructionReason: 'Speech contains trailing ellipses or broken phonetic fragments without sufficient acoustic information',
      confirmationPrompt: null,
      clarificationPrompt,
      intent: 'GENERIC_FALLBACK',
      entities: {},
      confidence: 0.35,
      language: normalizedLang,
      requiresConfirmation: true
    };
  }

  // Step 2: Deterministic Entity & Ambiguity Analysis
  const initialClass = nlpProcessorService.classifyIntentNLP(text, normalizedLang);
  const entities = nlpProcessorService.extractEntitiesNLP(text, normalizedLang);
  const ambiguityCheck = nlpProcessorService.detectAmbiguity(text, initialClass.intent, entities, normalizedLang);

  if (ambiguityCheck.isAmbiguous) {
    return {
      rawText: text,
      rawTranscript: text,
      correctedText: text,
      reconstructedText: text,
      status: 'AMBIGUOUS',
      isAmbiguous: true,
      isUnclear: false,
      reconstructionReason: `Underspecified patient request lacking required ${ambiguityCheck.missingEntity || 'entity'}`,
      confirmationPrompt: null,
      clarificationPrompt: ambiguityCheck.clarificationPrompt,
      missingEntity: ambiguityCheck.missingEntity,
      intent: initialClass.intent,
      entities,
      confidence: 0.65,
      language: normalizedLang,
      requiresConfirmation: true
    };
  }

  // Helper for generating localized "Did you mean: X?" confirmation prompt
  const formatConfirmationPrompt = (reconstructed, lang) => {
    if (lang === 'kn') return `ನಿಮ್ಮ ಅರ್ಥ: "${reconstructed}" ಎಂದೇ?`;
    if (lang === 'hi') return `क्या आपका मतलब: "${reconstructed}" है?`;
    return `Did you mean: ${reconstructed}?`;
  };

  // Step 2b: Clear Speech Guard — Clear speech MUST NOT be reconstructed or altered
  if (nlpProcessorService.isSpeechClear(text, normalizedLang)) {
    return {
      rawText: text,
      rawTranscript: text,
      correctedText: text,
      reconstructedText: text,
      status: 'CLEAR',
      isAmbiguous: false,
      isUnclear: false,
      reconstructionReason: 'Input speech is already clear and meaningful',
      confirmationPrompt: null,
      clarificationPrompt: null,
      intent: initialClass.intent,
      entities,
      confidence: 1.0,
      language: normalizedLang,
      requiresConfirmation: false
    };
  }

  // Step 3: Attempt Server-side Gemini LLM contextual reconstruction
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const modelCandidates = Array.from(new Set([primaryModel, 'gemini-3.6-flash', 'gemini-flash-latest'])).filter(Boolean);

    const systemPrompt = `You are an expert assistive AI for an aphasia, dysarthria, and neurological speech reconstruction system (VoiceBack).
The patient speaks with dysarthria, slurred pronunciation, omitted syllables, sound substitutions, or phonetic recognition errors from speech-to-text (STT).

YOUR ABSOLUTE CORE MISSION:
Infer ONLY what THE PATIENT INTENDED TO SAY.
Output MUST strictly be the patient's own intended words.

CRITICAL RULES — NEVER ANSWER THE PATIENT:
1. THE RECONSTRUCTION ENGINE MUST NEVER ANSWER THE PATIENT'S UTTERANCE:
   - You are NOT a chatbot. You are NOT a caregiver. You are NOT having a conversation with the patient.
   - You are the patient's speech prosthetic repairing their acoustic signal into what THEY wanted to say.
   - NEVER generate a reply, answer, caregiver response, assistant reaction, or conversational reaction.

2. PRESERVE THE EXACT SPEECH ACT:
   - Question -> Question: If the patient asks "How are you?" or "ಹಲೋ, ಚೆನ್ನಾಗಿದ್ದೀರಾ?", reconstruct "How are you?" or "ಹಲೋ, ಚೆನ್ನಾಗಿದ್ದೀರಾ?". NEVER output "I am fine" or "ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ".
   - Request -> Request: If the patient asks "Can you help me?", reconstruct "Can you help me?". NEVER output "Yes, I can help you".
   - Need/Desire -> Need/Desire: If the patient says "I want water." or "I wa wa water", reconstruct "I want water.". NEVER output "Here is some water".

3. CLEAR SPEECH MUST REMAIN UNCHANGED:
   - If the raw transcript is already clear, grammatical, and meaningful, return it EXACTLY as-is.

4. NO HARDCODED SENTENCE MAPPING:
   - NEVER map arbitrary repeated syllables (such as "na na na na") to "I need water" or "ನನಗೆ ನೀರು ಬೇಕು".
   - Clean up stuttering by collapsing repeated words/syllables conservatively without inventing facts.

5. TARGET LANGUAGE & SCRIPT:
   - Target Language: "${normalizedLang}" (en = English, kn = Kannada, hi = Hindi).
   - For Kannada: Kannada Unicode script only. NEVER translate to English!
   - For Hindi: Devanagari script only. NEVER translate to English!
   - For English: Natural English.
   - For mixed Kannada/English: Preserve natural mixed phrasing.

Raw Transcription from STT: "${text}"
${context ? `Surrounding Context: "${context}"` : ''}
${previousUtterance ? `Previous Utterance: "${previousUtterance}"` : ''}

Return ONLY a valid JSON object matching this schema:
{
  "reconstructedText": "<clear, grammatically correct intended patient utterance in native script>",
  "isAmbiguous": <boolean>,
  "isUnclear": <boolean>,
  "clarificationQuestion": <string or null>,
  "intent": "<CANONICAL_INTENT e.g. WATER_REQUEST, MEAL_REQUEST, PAIN_PRESENT, MEDICINE_REQUEST, HELP_REQUEST, GENERIC_FALLBACK>",
  "entities": {
    "item": "<string or null>",
    "medicineName": "<string or null>",
    "person": "<string or null>",
    "location": "<string or null>",
    "painLocation": "<string or null>"
  },
  "confidence": <number between 0.0 and 1.0>,
  "requiresConfirmation": <boolean>
}`;

    for (const modelName of modelCandidates) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          apiUrl,
          {
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 2000 }
        );

        const rawJson = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const cleaned = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);

          if (parsed && (parsed.reconstructedText || parsed.clarificationQuestion)) {
            const reconstructed = (parsed.reconstructedText || text).trim();

            // Ambiguous speech handling from Gemini
            if (parsed.isAmbiguous) {
              return {
                rawText: text,
                rawTranscript: text,
                correctedText: reconstructed,
                reconstructedText: reconstructed,
                status: 'AMBIGUOUS',
                isAmbiguous: true,
                isUnclear: false,
                reconstructionReason: `Underspecified patient request lacking required entity`,
                confirmationPrompt: null,
                clarificationPrompt: parsed.clarificationQuestion || ambiguityCheck.clarificationPrompt,
                intent: parsed.intent || initialClass.intent,
                entities: parsed.entities || entities,
                confidence: parsed.confidence || 0.7,
                language: normalizedLang,
                requiresConfirmation: true
              };
            }

            // Unclear speech handling from Gemini: Preserve inferred best candidate so patient is not forced to press CHANGE
            if (parsed.isUnclear) {
              const bestCandidate = (parsed.reconstructedText && parsed.reconstructedText.trim() !== text)
                ? parsed.reconstructedText.trim()
                : null;

              if (bestCandidate) {
                return {
                  rawText: text,
                  rawTranscript: text,
                  correctedText: bestCandidate,
                  reconstructedText: bestCandidate,
                  status: 'NEEDS_CONFIRMATION',
                  isAmbiguous: false,
                  isUnclear: true,
                  reconstructionReason: 'Inferred best candidate from unclear speech and context',
                  confirmationPrompt: formatConfirmationPrompt(bestCandidate, normalizedLang),
                  clarificationPrompt: parsed.clarificationQuestion || null,
                  intent: parsed.intent || initialClass.intent,
                  entities: parsed.entities || entities,
                  confidence: parsed.confidence || 0.55,
                  language: normalizedLang,
                  requiresConfirmation: true
                };
              }

              return {
                rawText: text,
                rawTranscript: text,
                correctedText: text,
                reconstructedText: text,
                status: 'UNCLEAR',
                isAmbiguous: false,
                isUnclear: true,
                reconstructionReason: 'Speech was unclear or incomplete without recoverable candidate',
                confirmationPrompt: null,
                clarificationPrompt: parsed.clarificationQuestion || 'Speech was unclear. Could you please repeat?',
                intent: 'GENERIC_FALLBACK',
                entities: {},
                confidence: parsed.confidence || 0.4,
                language: normalizedLang,
                requiresConfirmation: true
              };
            }

            // Script validation
            let validScript = true;
            if (normalizedLang === 'kn' && !/[\u0C80-\u0CFF]/.test(reconstructed)) validScript = false;
            if (normalizedLang === 'hi' && !/[\u0900-\u097F]/.test(reconstructed)) validScript = false;

            // Caregiver / Assistant reply rejection: The output must strictly remain a patient utterance
            const isCaregiverStyle = /^(sure,?\s*(i'll|i\s+will)|i'm\s+right\s+here|i\s+understand,?\s*i\s+will|let\s+me\s+get|don't\s+worry,?\s*i|of\s+course,?\s*i|here\s+(is|are)|yes,?\s*i\s+can|ಖಂಡಿತ,?\s*ನಾನು|ನಾನು\s*ಇಲ್ಲೇ\s*ಇದ್ದೇನೆ|ನನಗೆ\s*ಅರ್ಥವಾಯಿತು,?\s*ನಿಮ್ಮ|ಇದೋ\s*ತರುತ್ತೇನೆ|ಹೌದು,?\s*ನಾನು|जरूर,?\s*मैं|मैं\s*यहीं\s*हूँ|मैं\s*समझता\s*हूँ|हाँ,?\s*मैं)/i.test(reconstructed);

            // Speech act check: If raw was a question, the reconstruction MUST remain a question and NEVER an answer
            const rawWasQuestion = /[?]$/.test(text.trim()) ||
              /^(ಹಲೋ,?\s*)?(ಹೇಗಿದ್ದೀರಾ|ಚೆನ್ನಾಗಿದ್ದೀರಾ|ಏನು|ಎಲ್ಲಿ|ಯಾವಾಗ|ಯಾರು|ಹೇಗೆ|ಏಕೆ|how|what|where|when|who|why|can\s+you|could\s+you|are\s+you|is\s+there|do\s+you)/iu.test(text.trim());
            const reconIsAnswerToQuestion = rawWasQuestion && (
              /\b(ನಾನು\s*ಚೆನ್ನಾಗಿದ್ದೀನಿ|ಚೆನ್ನಾಗಿದ್ದೀನಿ|i\s+am\s+fine|i\s+am\s+doing\s+well|i'm\s+fine|i'm\s+good|i\s+am\s+good|yes|sure)\b/i.test(reconstructed) ||
              !/[?]$/.test(reconstructed.trim())
            );

            if (validScript && !isCaregiverStyle && !reconIsAnswerToQuestion) {
              let finalRecon = reconstructed.trim();

              // Prefer complete local conservative reconstruction if Gemini returned a fragment
              const localRecon = nlpProcessorService.reconstructSpeechConservative(text, normalizedLang, context, previousUtterance);
              if (localRecon && localRecon !== text) {
                const isGeminiFragment = !/^(I\b|My\b|Please\b|Can\b|Could\b|ನನಗೆ\b|ನಾನು\b|ನನ್ನ\b|ದಯವಿಟ್ಟು\b|मुझे\b|मेरे\b|कृपया\b)/i.test(finalRecon) &&
                  /^(I\b|My\b|Please\b|Can\b|Could\b|ನನಗೆ\b|ನಾನು\b|ನನ್ನ\b|ದಯವಿಟ್ಟು\b|मुझे\b|मेरे\b|कृपया\b)/i.test(localRecon);
                if (isGeminiFragment) {
                  finalRecon = localRecon;
                }
              }

              // Ensure terminal punctuation
              if (finalRecon.length > 0 && !/[.!?]$/.test(finalRecon)) {
                finalRecon += (rawWasQuestion ? '?' : '.');
              }

              const hasChanged = finalRecon.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') !==
                text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

              const needsConfirm = parsed.requiresConfirmation !== false || hasChanged;

              return {
                rawText: text,
                rawTranscript: text,
                correctedText: finalRecon,
                reconstructedText: finalRecon,
                status: needsConfirm ? 'NEEDS_CONFIRMATION' : 'CLEAR',
                isAmbiguous: false,
                isUnclear: false,
                reconstructionReason: hasChanged ? 'Contextual LLM speech reconstruction applied' : 'Input speech is clear',
                confirmationPrompt: needsConfirm ? formatConfirmationPrompt(finalRecon, normalizedLang) : null,
                clarificationPrompt: null,
                intent: parsed.intent || initialClass.intent,
                entities: parsed.entities || entities,
                confidence: parsed.confidence || 0.9,
                language: normalizedLang,
                requiresConfirmation: needsConfirm
              };
            }
          }
        }
      } catch (err) {
        if (err.response?.status === 429) {
          console.warn('[ContextEngine] Gemini API quota reached (429). Switching instantly to local deterministic NLP engine.');
          break;
        }
        if (err.response?.status === 404) {
          console.warn(`[ContextEngine] Gemini speech reconstruction model ${modelName} not found (404). Trying next or fallback...`);
          continue;
        }
        console.warn(`[ContextEngine] Gemini speech reconstruction model ${modelName} notice: ${err.message}. Trying fallback...`);
      }
    }
  }

  // Step 4: Deterministic Local Linguistic Reconstruction Engine
  const finalReconstructed = nlpProcessorService.reconstructSpeechConservative(text, normalizedLang, context, previousUtterance) || text;
  const hasChanged = finalReconstructed.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') !==
    text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');

  return {
    rawText: text,
    rawTranscript: text,
    correctedText: finalReconstructed,
    reconstructedText: finalReconstructed,
    status: hasChanged ? 'NEEDS_CONFIRMATION' : 'CLEAR',
    isAmbiguous: false,
    isUnclear: false,
    reconstructionReason: hasChanged ? 'Deterministic grammar, missing word, and phoneme reconstruction applied' : 'Input speech is clear',
    confirmationPrompt: hasChanged ? formatConfirmationPrompt(finalReconstructed, normalizedLang) : null,
    clarificationPrompt: null,
    intent: initialClass.intent,
    entities,
    confidence: hasChanged ? 0.88 : 0.98,
    language: normalizedLang,
    requiresConfirmation: hasChanged
  };
};

/**
 * Generate Dynamic Expressive Response after confirmation
 * Takes confirmed meaning, intent, entities, language, and context,
 * then generates a natural conversational response to be spoken via authorized Voice ID.
 */
const generateDynamicResponse = async ({ confirmedText, intent, entities = {}, language = 'en', context = '' }) => {
  const normLang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';

  // 1. Water Request handling
  if (intent === 'WATER_REQUEST' || entities.item === 'water') {
    return {
      responseText: normLang === 'kn'
        ? 'ಖಂಡಿತ, ನಾನು ನಿಮಗೆ ಸ್ವಲ್ಪ ನೀರು ತರುತ್ತೇನೆ.'
        : normLang === 'hi'
        ? 'जरूर, मैं आपके लिए पानी लाता हूँ।'
        : "Sure, I'll get you some water.",
      intent: 'WATER_REQUEST',
      entities,
      language: normLang,
      source: 'dynamic_response'
    };
  }

  // 2. Help Request handling
  if (intent === 'HELP_REQUEST') {
    return {
      responseText: normLang === 'kn'
        ? 'ನಾನು ಇಲ್ಲೇ ಇದ್ದೇನೆ, ನಿಮಗೆ ತಕ್ಷಣ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.'
        : normLang === 'hi'
        ? 'मैं यहीं हूँ, मैं तुरंत आपकी मदद करता हूँ।'
        : "I'm right here, I will help you right away.",
      intent: 'HELP_REQUEST',
      entities,
      language: normLang,
      source: 'dynamic_response'
    };
  }

  // 3. Pain handling
  if (intent === 'PAIN_PRESENT') {
    return {
      responseText: normLang === 'kn'
        ? 'ನನಗೆ ಅರ್ಥವಾಯಿತು, ನಿಮ್ಮ ನೋವನ್ನು ಕಡಿಮೆ ಮಾಡಲು ನಾನು ತಕ್ಷಣ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.'
        : normLang === 'hi'
        ? 'मैं समझता हूँ, आपके दर्द के लिए मैं तुरंत मदद करता हूँ।'
        : "I understand, I will help you with your pain right away.",
      intent: 'PAIN_PRESENT',
      entities,
      language: normLang,
      source: 'dynamic_response'
    };
  }

  // 4. Meal / Hunger Request
  if (intent === 'MEAL_REQUEST' || entities.item === 'food') {
    return {
      responseText: normLang === 'kn'
        ? 'ಖಂಡಿತ, ನಾನು ನಿಮಗೆ ಊಟ ತರುತ್ತೇನೆ.'
        : normLang === 'hi'
        ? 'जरूर, मैं आपके लिए खाना लाता हूँ।'
        : "Sure, I will get you something to eat right away.",
      intent: 'MEAL_REQUEST',
      entities,
      language: normLang,
      source: 'dynamic_response'
    };
  }

  // 5. Bathroom / Toilet Request
  if (intent === 'BATHROOM_REQUEST') {
    return {
      responseText: normLang === 'kn'
        ? 'ನಾನು ನಿಮ್ಮನ್ನು ತಕ್ಷಣ ಶೌಚಾಲಯಕ್ಕೆ ಕರೆದೊಯ್ಯುತ್ತೇನೆ.'
        : normLang === 'hi'
        ? 'मैं तुरंत आपको शौचालय ले जाने में मदद करता हूँ।'
        : "Let me assist you to the restroom right away.",
      intent: 'BATHROOM_REQUEST',
      entities,
      language: normLang,
      source: 'dynamic_response'
    };
  }

  // 6. Rest / Sleep Want
  if (intent === 'REST_WANT') {
    return {
      responseText: normLang === 'kn'
        ? 'ನಾನು ನಿಮಗೆ ಆರಾಮವಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.'
        : normLang === 'hi'
        ? 'मैं आपको आराम करने में मदद करता हूँ।'
        : "Let me help you get comfortable and rest.",
      intent: 'REST_WANT',
      entities,
      language: normLang,
      source: 'dynamic_response'
    };
  }

  // 7. Comfort / Temperature Check
  if (intent === 'COMFORT_CHECK') {
    return {
      responseText: normLang === 'kn'
        ? 'ನಾನು ನಿಮಗೆ ಹಿತಕರವಾಗಿರುವಂತೆ ಹೊಂದಿಸುತ್ತೇನೆ.'
        : normLang === 'hi'
        ? 'मैं आपके आराम की व्यवस्था करता हूँ।'
        : "Let me adjust things to make you comfortable.",
      intent: 'COMFORT_CHECK',
      entities,
      language: normLang,
      source: 'dynamic_response'
    };
  }

  // 8. Family / Call
  if (intent === 'FAMILY_CALL' || entities.person === 'family') {
    return {
      responseText: normLang === 'kn'
        ? 'ನಾನು ತಕ್ಷಣ ನಿಮ್ಮ ಕುಟುಂಬದವರನ್ನು ಸಂಪರ್ಕಿಸುತ್ತೇನೆ.'
        : normLang === 'hi'
        ? 'मैं तुरंत आपके परिवार से संपर्क करता हूँ।'
        : "I will contact your family for you right away.",
      intent: 'FAMILY_CALL',
      entities,
      language: normLang,
      source: 'dynamic_response'
    };
  }

  // 3. Check if LLM can craft a specific response
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && confirmedText && confirmedText.length > 2) {
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
    const systemPrompt = `You are an assistive communication and response engine for VoiceBack.
The patient has just explicitly confirmed: "${confirmedText}".
Intent: "${intent || 'GENERIC'}"
Language: "${normLang}" (en = English, kn = Kannada, hi = Hindi)
${context ? `Context / Question: "${context}"` : ''}

Generate a concise, polite, dynamic conversational response (3 to 8 words).
Output strictly in the native script:
- Kannada Unicode for Kannada
- Devanagari for Hindi
- Natural English for English
Return ONLY a JSON object: {"responseText": "<response>"}`;

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        apiUrl,
        {
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 2000 }
      );

      const rawJson = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson.replace(/```json/gi, '').replace(/```/g, '').trim());
        if (parsed && parsed.responseText && typeof parsed.responseText === 'string') {
          return {
            responseText: parsed.responseText.trim(),
            intent,
            entities,
            language: normLang,
            source: 'gemini_dynamic'
          };
        }
      }
    } catch (e) {
      console.warn('[ContextEngine] Dynamic response LLM notice:', e.message);
    }
  }

  // 4. Deterministic Fallback
  const dynamicText = nlpProcessorService.generateDynamicPatientResponse({
    intent,
    entities,
    language: normLang,
    context,
    confirmedText
  });

  return {
    responseText: dynamicText,
    intent,
    entities,
    language: normLang,
    source: 'deterministic_nlp'
  };
};


module.exports = {
  generateResponseOptions,
  transcribeAndRecognizeWithGemini,
  getDeterministicFallback,
  validateLanguageScript,
  normalizeSemanticIntent,
  correctAphasicSpeech,
  generateDynamicResponse,
  detectUtteranceLanguage,
  CANONICAL_INTENT_MAP,
  SAFE_GENERIC_FALLBACKS
};
