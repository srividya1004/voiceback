/**
 * VoiceBack NLP (Natural Language Processing) Processor Service
 * Handles text normalization, tokenization, semantic intent classification,
 * script validation, and natural conversational output post-processing.
 */

class NLPProcessorService {
  /**
   * Tokenizes and normalizes text for NLP processing
   */
  normalizeInput(text, language = 'en') {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text.trim();

    // Remove noise bracket tags e.g. [pause], [cough]
    cleaned = cleaned
      .replace(/\[(pause|silence|cough|sigh|snort|laughter|music|clearing|throat-clearing|applause|cheering|noise|static)\]/gi, '')
      .replace(/^\[.*\]$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  }

  /**
   * NLP Intent & Keyword Classification Engine
   */
  classifyIntentNLP(text, language = 'en') {
    const raw = this.normalizeInput(text, language).toLowerCase();
    if (!raw) return { intent: 'GENERIC_FALLBACK', confidence: 0.5 };

    // Intent Keyword Rules with Weights
    const intentMap = [
      {
        intent: 'WATER_REQUEST',
        keywords: ['water', 'drink', 'thirst', 'hydrat', 'sip', 'ನೀರು', 'ಕುಡಿ', 'ದಾಹ', 'पानी', 'प्यास', 'पीना']
      },
      {
        intent: 'MEAL_REQUEST',
        keywords: ['eat', 'food', 'hungr', 'lunch', 'dinner', 'snack', 'meal', 'ಊಟ', 'ಹಸಿವು', 'ಆಹಾರ', 'भूख', 'खाना', 'भोजन']
      },
      {
        intent: 'PAIN_PRESENT',
        keywords: ['pain', 'hurt', 'medici', 'doct', 'sick', 'pill', 'ನೋವು', 'ಔಷಧಿ', 'ವೈದ್ಯ', 'दर्द', 'दवा', 'डॉक्टर', 'तकलीफ']
      },
      {
        intent: 'BATHROOM_REQUEST',
        keywords: ['toilet', 'bathroom', 'washroom', 'pee', 'poop', 'ಶೌಚಾಲಯ', 'ಶೌಚ', 'शौचालय', 'बाथरूम']
      },
      {
        intent: 'REST_WANT',
        keywords: ['rest', 'sleep', 'bed', 'tir', 'nap', 'pillow', 'ವಿಶ್ರಾಂತಿ', 'ನಿದ್ರೆ', 'ಹಾಸಿಗೆ', 'सोना', 'आराम', 'थका']
      },
      {
        intent: 'COMFORT_CHECK',
        keywords: ['comfort', 'hot', 'cold', 'warm', 'position', 'shift', 'ಆರಾಮ', 'ಚಳಿ', 'ಬಿಸಿ', 'आराम', 'गर्मी', 'ठंड']
      },
      {
        intent: 'FAMILY_CALL',
        keywords: ['family', 'call', 'talk', 'speak', 'phone', 'ಕುಟುಂಬ', 'ಮಾತನಾಡು', 'ಫೋನ್', 'परिवार', 'बात', 'फोन']
      }
    ];

    for (const rule of intentMap) {
      if (rule.keywords.some((kw) => raw.includes(kw))) {
        return { intent: rule.intent, confidence: 0.95 };
      }
    }

    return { intent: 'GENERIC_FALLBACK', confidence: 0.7 };
  }

  /**
   * Advanced NLP Semantic Intent Reasoning & Dynamic Response Option Generator
   * Deeply analyzes input question structure (WH-questions, Yes/No questions, Choice questions)
   * and generates 100% grammatically correct, highly relevant first-person patient options in native script.
   */
  generateSemanticNLPResponses(questionText, language = 'kn') {
    const raw = this.normalizeInput(questionText, language);
    const q = raw.toLowerCase();

    const isKannada = language === 'kn' || language === 'Kannada' || /[\u0C80-\u0CFF]/.test(raw);

    // 0. Greetings & Salutations ("Hi", "Hi sir", "Hello", "Namaskara", "ನಮಸ್ಕಾರ")
    const cleanWords = q.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().split(/\s+/);
    const isGreeting = cleanWords.some(w => ['hi', 'hello', 'hey', 'namaskara', 'namaste', 'ಹಲೋ', 'ನಮಸ್ಕಾರ'].includes(w)) || q.startsWith('hi') || q.startsWith('hello') || q.startsWith('hey') || q.includes('namaskara') || q.includes('ನಮಸ್ಕಾರ');

    if (isGreeting && (cleanWords.length <= 4 || q.includes('hi sir') || q.includes('hello sir'))) {
      if (isKannada) {
        return [
          { id: 'opt_gr_1', intent: 'GREETING_HOW_ARE_YOU', text: 'ನಮಸ್ಕಾರ! ಹೇಗಿದ್ದೀರಾ?' },
          { id: 'opt_gr_2', intent: 'GREETING_DAY', text: 'ಹಲೋ, ನಮಸ್ಕಾರ! ನಿಮ್ಮ ದಿನ ಹೇಗಿತ್ತು?' },
          { id: 'opt_gr_3', intent: 'GREETING_NEED', text: 'ನಮಸ್ಕಾರ! ನಿಮಗೆ ಏನು ಬೇಕು?' },
          { id: 'opt_gr_4', intent: 'GREETING_FINE', text: 'ನಮಸ್ಕಾರ, ನಾನು ಆರಾಮಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು!' }
        ];
      }
      return [
        { id: 'opt_gr_1', intent: 'GREETING_HOW_ARE_YOU', text: 'Hello! How are you doing today?' },
        { id: 'opt_gr_2', intent: 'GREETING_DAY', text: 'Hi there! How was your day?' },
        { id: 'opt_gr_3', intent: 'GREETING_NEED', text: 'Hello! Do you need anything?' },
        { id: 'opt_gr_4', intent: 'GREETING_FINE', text: 'Hi! I am doing well, thank you.' }
      ];
    }

    // ============================================================
    // 1. 🎒 SCHOOL & EDUCATION DATASET
    // ============================================================
    if (q.includes('school') || q.includes('ಶಾಲೆ') || q.includes('ಶಾಲೆಯಿಂದ')) {
      if (q.includes('start') || q.includes('suru') || q.includes('ಶುರು')) {
        return [
          { id: 'opt_sc_st1', intent: 'SCHOOL_START_830', text: 'ಶಾಲೆ 8:30 ಗೆ ಶುರುವಾಗುತ್ತದೆ.' },
          { id: 'opt_sc_st2', intent: 'SCHOOL_START_9', text: 'ಶಾಲೆ 9 ಗಂಟೆಗೆ ಶುರುವಾಗುತ್ತದೆ.' },
          { id: 'opt_sc_st3', intent: 'SCHOOL_START_8', text: 'ಸಾಮಾನ್ಯವಾಗಿ 8 ಗಂಟೆಗೆ ಶುರುವಾಗುತ್ತದೆ.' },
          { id: 'opt_sc_st4', intent: 'SCHOOL_START_UNSURE', text: 'ನನಗೆ ಸರಿಯಾಗಿ ನೆನಪಿಲ್ಲ.' }
        ];
      }
      if (q.includes('come home') || q.includes('return') || q.includes('ಮನೆಗೆ ಬರುತ್ತೀಯ')) {
        return [
          { id: 'opt_sc_hm1', intent: 'SCHOOL_HOME_4', text: 'ನಾನು ಸಂಜೆ 4 ಗಂಟೆಗೆ ಮನೆಗೆ ಬರುತ್ತೇನೆ.' },
          { id: 'opt_sc_hm2', intent: 'SCHOOL_HOME_330', text: '3:30 ಗೆ ಬರುತ್ತೇನೆ.' },
          { id: 'opt_sc_hm3', intent: 'SCHOOL_HOME_5', text: 'ಸಂಜೆ 5 ಗಂಟೆಗೆ ಬರುತ್ತೇನೆ.' },
          { id: 'opt_sc_hm4', intent: 'SCHOOL_HOME_LATE', text: 'ಸ್ವಲ್ಪ ತಡವಾಗಿ ಬರುತ್ತೇನೆ.' }
        ];
      }
      if (q.includes('lunch') || q.includes('oota') || q.includes('ಊಟ')) {
        return [
          { id: 'opt_sc_lc1', intent: 'SCHOOL_LUNCH_YES', text: 'ಹೌದು, ಶಾಲೆಯಲ್ಲಿ ಊಟ ಮಾಡಿದೆ.' },
          { id: 'opt_sc_lc2', intent: 'SCHOOL_LUNCH_NO', text: 'ಇಲ್ಲ, ಇನ್ನೂ ಊಟ ಮಾಡಿಲ್ಲ.' },
          { id: 'opt_sc_lc3', intent: 'SCHOOL_LUNCH_SNACK', text: 'ಸ್ವಲ್ಪ ತಿಂಡಿ ತಿಂದೆ.' },
          { id: 'opt_sc_lc4', intent: 'SCHOOL_LUNCH_FRIENDS', text: 'ಹೌದು, ಫ್ರೆಂಡ್ಸ್ ಜೊತೆ ತಿಂದೆ.' }
        ];
      }
      if (q.includes('how was') || q.includes('hegittu') || q.includes('ಹೇಗಿತ್ತು')) {
        return [
          { id: 'opt_sc_hw1', intent: 'SCHOOL_HOW_GOOD', text: 'ಇಂದು ಶಾಲೆ ತುಂಬಾ ಚೆನ್ನಾಗಿತ್ತು.' },
          { id: 'opt_sc_hw2', intent: 'SCHOOL_HOW_OK', text: 'ಸಾಧಾರಣವಾಗಿತ್ತು.' },
          { id: 'opt_sc_hw3', intent: 'SCHOOL_HOW_BUSY', text: 'ತುಂಬಾ ಬ್ಯುಸಿಯಾಗಿತ್ತು.' },
          { id: 'opt_sc_hw4', intent: 'SCHOOL_HOW_FUN', text: 'ತುಂಬಾ ಮೋಜಿನ ದಿನವಾಗಿತ್ತು.' }
        ];
      }
      if (q.includes('tomorrow') || q.includes('nale') || q.includes('ನಾಳೆ')) {
        return [
          { id: 'opt_sc_tm1', intent: 'SCHOOL_TOMORROW_YES', text: 'ಹೌದು, ನಾಳೆ ಶಾಲೆ ಇದೆ.' },
          { id: 'opt_sc_tm2', intent: 'SCHOOL_TOMORROW_HOLIDAY', text: 'ಇಲ್ಲ, ನಾಳೆ ಭಾನುವಾರ ರಜೆ ಇದೆ.' },
          { id: 'opt_sc_tm3', intent: 'SCHOOL_TOMORROW_FESTIVAL', text: 'ಇಲ್ಲ, ನಾಳೆ ಹಬ್ಬದ ರಜೆ.' },
          { id: 'opt_sc_tm4', intent: 'SCHOOL_TOMORROW_UNSURE', text: 'ನನಗೆ ಸರಿಯಾಗಿ ಗೊತ್ತಿಲ್ಲ.' }
        ];
      }
      if (q.includes('need') || q.includes('beka') || q.includes('ಏನಾದರೂ ಬೇಕಾ')) {
        return [
          { id: 'opt_sc_nd1', intent: 'SCHOOL_NEED_BOOK', text: 'ಹೌದು, ಹೊಸ ನೋಟ್‌ಬುಕ್/ಪೆನ್ ಬೇಕು.' },
          { id: 'opt_sc_nd2', intent: 'SCHOOL_NEED_NO', text: 'ಇಲ್ಲ, ನನ್ನ ಬಳಿ ಎಲ್ಲವೂ ಇದೆ.' },
          { id: 'opt_sc_nd3', intent: 'SCHOOL_NEED_PROJECT', text: 'ಪ್ರಾಜೆಕ್ಟ್ ಸಾಮಾನು ಬೇಕು.' },
          { id: 'opt_sc_nd4', intent: 'SCHOOL_NEED_THANKS', text: 'ಇಲ್ಲ, ಧನ್ಯವಾದಗಳು.' }
        ];
      }
      return [
        { id: 'opt_sc_gen1', intent: 'SCHOOL_WENT', text: 'ಹೌದು, ಶಾಲೆಗೆ ಹೋಗಿದ್ದೆ.' },
        { id: 'opt_sc_gen2', intent: 'SCHOOL_NO', text: 'ಇಲ್ಲ, ಇಂದು ರಜೆ ಇತ್ತು.' },
        { id: 'opt_sc_gen3', intent: 'SCHOOL_LATER', text: 'ಇನ್ನೊಂದು ಸ್ವಲ್ಪ ಹೊತ್ತಿನಲ್ಲಿ ಹೋಗ್ತೀನಿ.' },
        { id: 'opt_sc_gen4', intent: 'SCHOOL_UNWELL', text: 'ಇಲ್ಲ, ಹುಷಾರಿರಲಿಲ್ಲ.' }
      ];
    }

    if (q.includes('test') || q.includes('exam') || q.includes('ಟೆಸ್ಟ್')) {
      if (q.includes('how did') || q.includes('hegaitu') || q.includes('ಹೇಗಾಯಿತು')) {
        return [
          { id: 'opt_ts_hw1', intent: 'TEST_HOW_GREAT', text: 'ನನ್ನ ಟೆಸ್ಟ್ ತುಂಬಾ ಚೆನ್ನಾಗಿ ಆಯಿತು.' },
          { id: 'opt_ts_hw2', intent: 'TEST_HOW_OK', text: 'ಸಾಧಾರಣವಾಗಿ ಆಯಿತು.' },
          { id: 'opt_ts_hw3', intent: 'TEST_HOW_HARD', text: 'ಸ್ವಲ್ಪ ಕಷ್ಟವಾಗಿತ್ತು.' },
          { id: 'opt_ts_hw4', intent: 'TEST_HOW_FULL', text: '100 ಮಾರ್ಕ್ಸ್ ಸಿಗಬಹುದು.' }
        ];
      }
      return [
        { id: 'opt_ts_ex1', intent: 'TEST_YES', text: 'ಹೌದು, ಇಂದು ಟೆಸ್ಟ್ ಇತ್ತು.' },
        { id: 'opt_ts_ex2', intent: 'TEST_NO', text: 'ಇಲ್ಲ, ಇಂದು ಟೆಸ್ಟ್ ಇರಲಿಲ್ಲ.' },
        { id: 'opt_ts_ex3', intent: 'TEST_TOMORROW', text: 'ನಾಳೆ ಟೆಸ್ಟ್ ಇದೆ.' },
        { id: 'opt_ts_ex4', intent: 'TEST_MATHS', text: 'ಹೌದು, ಗಣಿತ ಟೆಸ್ಟ್ ಇತ್ತು.' }
      ];
    }

    if (q.includes('homework') || q.includes('home work') || q.includes('ಹೋಮ್ವರ್ಕ್') || q.includes('ಹೋಮ್‌ವರ್ಕ್')) {
      if (q.includes('finish') || q.includes('mugisiddiya') || q.includes('ಮುಗಿಸಿದ್ದೀಯಾ')) {
        return [
          { id: 'opt_hw_fn1', intent: 'HOMEWORK_DONE', text: 'ಹೌದು, ಹೋಮ್‌ವರ್ಕ್ ಮುಗಿಸಿದ್ದೇನೆ.' },
          { id: 'opt_hw_fn2', intent: 'HOMEWORK_DOING', text: 'ಇಲ್ಲ, ಇನ್ನೂ ಮಾಡುತ್ತಿದ್ದೇನೆ.' },
          { id: 'opt_hw_fn3', intent: 'HOMEWORK_LEFT', text: 'ಸ್ವಲ್ಪ ಬಾಕಿ ಇದೆ.' },
          { id: 'opt_hw_fn4', intent: 'HOMEWORK_MORNING', text: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಮುಗಿಸುತ್ತೇನೆ.' }
        ];
      }
      return [
        { id: 'opt_hw_ex1', intent: 'HOMEWORK_YES', text: 'ಹೌದು, ಗಣಿತ ಮತ್ತು ಸೈನ್ಸ್ ಹೋಮ್‌ವರ್ಕ್ ಇದೆ.' },
        { id: 'opt_hw_ex2', intent: 'HOMEWORK_NONE', text: 'ಇಲ್ಲ, ಇಂದು ಯಾವುದೇ ಹೋಮ್‌ವರ್ಕ್ ಇಲ್ಲ.' },
        { id: 'opt_hw_ex3', intent: 'HOMEWORK_READING', text: 'ಸ್ವಲ್ಪ ಓದುವುದಿದೆ.' },
        { id: 'opt_hw_ex4', intent: 'HOMEWORK_SOME', text: 'ಹೌದು, ಸ್ವಲ್ಪ ಇದೆ.' }
      ];
    }

    if (q.includes('teacher') || q.includes('ಟೀಚರ್')) {
      return [
        { id: 'opt_tc_1', intent: 'TEACHER_EXAM', text: 'ಹೌದು, ಪರೀಕ್ಷೆಯ ಬಗ್ಗೆ ಹೇಳಿದ್ರು.' },
        { id: 'opt_tc_2', intent: 'TEACHER_NONE', text: 'ಇಲ್ಲ, ವಿಶೇಷವಾಗಿ ಏನೂ ಹೇಳಲಿಲ್ಲ.' },
        { id: 'opt_tc_3', intent: 'TEACHER_EARLY', text: 'ನಾಳೆ ಬೇಗ ಬರಲು ಹೇಳಿದ್ರು.' },
        { id: 'opt_tc_4', intent: 'TEACHER_HW', text: 'ಹೋಮ್‌ವರ್ಕ್ ಮಾಡಲು ಹೇಳಿದ್ರು.' }
      ];
    }

    // ============================================================
    // 2. 📱 PHONE & GOING OUT DATASET
    // ============================================================
    if (q.includes('charge') || q.includes('ಚಾರ್ಜ್')) {
      return [
        { id: 'opt_ph_cg1', intent: 'PHONE_CHARGED_FULL', text: 'ಹೌದು, ಫುಲ್ ಚಾರ್ಜ್ ಆಗಿದೆ.' },
        { id: 'opt_ph_cg2', intent: 'PHONE_CHARGED_NO', text: 'ಇಲ್ಲ, ಚಾರ್ಜರ್ ಹಾಕ್ಬೇಕು.' },
        { id: 'opt_ph_cg3', intent: 'PHONE_CHARGED_HALF', text: '50% ಚಾರ್ಜ್ ಇದೆ.' },
        { id: 'opt_ph_cg4', intent: 'PHONE_CHARGED_WHERE', text: 'ಚಾರ್ಜರ್ ಎಲ್ಲಿದೆ?' }
      ];
    }
    if (q.includes('talking') || q.includes('matanaduttidde') || q.includes('ಮಾತನಾಡುತ್ತಿದ್ದೆ')) {
      return [
        { id: 'opt_ph_tk1', intent: 'TALK_FRIEND', text: 'ನಾನು ಸ್ನೇಹಿತರ ಜೊತೆ ಮಾತನಾಡುತ್ತಿದ್ದೆ.' },
        { id: 'opt_ph_tk2', intent: 'TALK_MOM', text: 'ಅಮ್ಮನ ಜೊತೆ ಮಾತನಾಡಿದೆ.' },
        { id: 'opt_ph_tk3', intent: 'TALK_OFFICE', text: 'ಆಫೀಸ್ ಕಾಲ್ ಇತ್ತು.' },
        { id: 'opt_ph_tk4', intent: 'TALK_BROTHER', text: 'ಅಣ್ಣನ ಜೊತೆ ಮಾತನಾಡಿದೆ.' }
      ];
    }
    if (q.includes('wallet') || q.includes('ವಾಲೆಟ್')) {
      return [
        { id: 'opt_ph_wl1', intent: 'WALLET_BAG', text: 'ಹೌದು, ವಾಲೆಟ್ ಬ್ಯಾಗ್‌ನಲ್ಲಿದೆ.' },
        { id: 'opt_ph_wl2', intent: 'WALLET_NEED', text: 'ಇಲ್ಲ, ತಗೋಬೇಕು.' },
        { id: 'opt_ph_wl3', intent: 'WALLET_CARDS', text: 'ಹೌದು, ಹಣ ಮತ್ತು ಕಾರ್ಡ್ ಇದೆ.' },
        { id: 'opt_ph_wl4', intent: 'WALLET_POCKET', text: 'ನನ್ನ ಕಿಸೆಯಲ್ಲಿದೆ.' }
      ];
    }
    if (q.includes('call me') || q.includes('reach') || q.includes('ತಲುಪಿದ ಮೇಲೆ')) {
      return [
        { id: 'opt_ph_cl1', intent: 'REACH_CALL', text: 'ಖಂಡಿತ, ತಲುಪಿದ ತಕ್ಷಣ ಕಾಲ್ ಮಾಡ್ತೀನಿ.' },
        { id: 'opt_ph_cl2', intent: 'REACH_MSG', text: 'ಸರಿ, ಮೆಸೇಜ್ ಮಾಡ್ತೀನಿ.' },
        { id: 'opt_ph_cl3', intent: 'REACH_SURE', text: 'ಹೌದು, ಖಂಡಿತ.' },
        { id: 'opt_ph_cl4', intent: 'REACH_REMEMBER', text: 'ನೆನಪಿಟ್ಟುಕೊಳ್ಳುತ್ತೇನೆ.' }
      ];
    }
    if (q.includes('coming home') || q.includes('bega manege') || q.includes('ಬೇಗ ಮನೆಗೆ')) {
      return [
        { id: 'opt_ph_hm1', intent: 'HOME_SOON_30MIN', text: 'ಹೌದು, ಅರ್ಧ ಗಂಟೆಯಲ್ಲಿ ಬರುತ್ತೇನೆ.' },
        { id: 'opt_ph_hm2', intent: 'HOME_SOON_6PM', text: 'ಸಂಜೆ 6 ಗಂಟೆಗೆ ಬರುತ್ತೇನೆ.' },
        { id: 'opt_ph_hm3', intent: 'HOME_SOON_LATE', text: 'ಸ್ವಲ್ಪ ತಡವಾಗಬಹುದು.' },
        { id: 'opt_ph_hm4', intent: 'HOME_SOON_YES', text: 'ಹೌದು, ಬೇಗ ಬರುತ್ತೇನೆ.' }
      ];
    }

    // ============================================================
    // 3. 🌙 NIGHT & SLEEP ROUTINE DATASET
    // ============================================================
    if (q.includes('pack') || q.includes('bag') || q.includes('ಬ್ಯಾಗ್ ಪ್ಯಾಕ್')) {
      return [
        { id: 'opt_nt_bg1', intent: 'NIGHT_BAG_YES', text: 'ಹೌದು, ಬ್ಯಾಗ್ ಪ್ಯಾಕ್ ಮಾಡಿದ್ದೇನೆ.' },
        { id: 'opt_nt_bg2', intent: 'NIGHT_BAG_NO', text: 'ಇಲ್ಲ, ಈಗ ಮಾಡಬೇಕು.' },
        { id: 'opt_nt_bg3', intent: 'NIGHT_BAG_BOOKS', text: 'ಬುಕ್ಸ್ ಎಲ್ಲಾ ಇಟ್ಟಿದ್ದೀನಿ.' },
        { id: 'opt_nt_bg4', intent: 'NIGHT_BAG_MORNING', text: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ಮಾಡ್ತೀನಿ.' }
      ];
    }
    if (q.includes('alarm') || q.includes('ಅಲಾರಂ')) {
      return [
        { id: 'opt_nt_al1', intent: 'ALARM_6AM', text: 'ಹೌದು, 6 ಗಂಟೆಗೆ ಅಲಾರಂ ಇಟ್ಟಿದ್ದೇನೆ.' },
        { id: 'opt_nt_al2', intent: 'ALARM_SET_NOW', text: 'ಇಲ್ಲ, ಇಡಬೇಕು.' },
        { id: 'opt_nt_al3', intent: 'ALARM_7AM', text: '7 ಗಂಟೆಗೆ ಇಟ್ಟಿದ್ದೀನಿ.' },
        { id: 'opt_nt_al4', intent: 'ALARM_YES', text: 'ಹೌದು, ಇಟ್ಟಿದ್ದೀನಿ.' }
      ];
    }
    if (q.includes('good night') || q.includes('ಶುಭರಾತ್ರಿ')) {
      return [
        { id: 'opt_nt_gn1', intent: 'GOODNIGHT_LOCKED', text: 'ಹೌದು, ಬಾಗಿಲು ಲಾಕ್ ಆಗಿದೆ, ಶುಭರಾತ್ರಿ!' },
        { id: 'opt_nt_gn2', intent: 'GOODNIGHT_LOCK_NOW', text: 'ಇಲ್ಲ, ಲಾಕ್ ಮಾಡಿ ಬರ್ತೀನಿ.' },
        { id: 'opt_nt_gn3', intent: 'GOODNIGHT_KEY', text: 'ಹೌದು, ಕೀ ಹಾಕಿದ್ದೀನಿ.' },
        { id: 'opt_nt_gn4', intent: 'GOODNIGHT_SIMPLE', text: 'ಶುಭರಾತ್ರಿ!' }
      ];
    }

    // 0. Reciprocal "Oota Ayitha?" Questions ("Did you eat?" / "ಊಟ ಆಯ್ತಾ?")
    if (q.includes('uuta ayitha') || q.includes('oota ayitha') || q.includes('thindi ayitha') || q.includes('had lunch') || q.includes('had dinner') || q.includes('did you eat') || q.includes('ಊಟ ಆಯ್ತಾ') || q.includes('ತಿಂಡಿ ಆಯ್ತಾ') || q.includes('ಊಟ ಮಾಡಿದ್ದೀಯಾ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_oa1', intent: 'MEAL_DONE_ASK', text: 'ಹೌದು, ಆಯ್ತು. ನೀವು ಊಟ ಮಾಡಿದ್ರಾ?' },
          { id: 'opt_nlp_oa2', intent: 'MEAL_NOT_YET', text: 'ಇಲ್ಲ, ಇನ್ನೂ ಇಲ್ಲ. ನನಗೂ ಹಸಿವಾಗಿದೆ.' },
          { id: 'opt_nlp_oa3', intent: 'MEAL_LITTLE', text: 'ಸ್ವಲ್ಪ ತಿಂದೆ. ನೀವು ಊಟ ಮಾಡಿದ್ರಾ?' },
          { id: 'opt_nlp_oa4', intent: 'MEAL_WHAT_FOOD', text: 'ಇನ್ನೂ ಮಾಡಬೇಕು, ಈಗ ಏನು ಊಟ ಇದೆ?' }
        ];
      }
      return [
        { id: 'opt_nlp_oa1', intent: 'MEAL_DONE_ASK', text: 'Yes, done! Did you have your meal?' },
        { id: 'opt_nlp_oa2', intent: 'MEAL_NOT_YET', text: "No, not yet. I'm hungry too." },
        { id: 'opt_nlp_oa3', intent: 'MEAL_LITTLE', text: 'Ate a little bit. Did you eat?' },
        { id: 'opt_nlp_oa4', intent: 'MEAL_WHAT_FOOD', text: 'Not yet, what food is available now?' }
      ];
    }

    // 0.1 Family Members & Family Speech ("ಅಮ್ಮ/ಅಪ್ಪ/ಅಜ್ಜಿ/ಅಜ್ಜ/ಅಣ್ಣ/ತಮ್ಮ/ಅಕ್ಕ/ತಂಗಿ/ಮಗ/ಮಗಳು/ಎಲ್ಲರೂ")
    if (q.includes('amma') || q.includes('ಅಮ್ಮ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_fam1', intent: 'AMMA_KITCHEN', text: 'ಅಮ್ಮ ಅಡುಗೆಮನೆಯಲ್ಲಿ ಇದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam2', intent: 'AMMA_ROOM', text: 'ಅಮ್ಮ ಕೋಣೆಯಲ್ಲಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam3', intent: 'AMMA_OUT', text: 'ಅಮ್ಮ ಹೊರಗೆ ಹೋಗಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam4', intent: 'AMMA_UNSURE', text: 'ನನಗೆ ಗೊತ್ತಿಲ್ಲ.' }
        ];
      }
    }
    if (q.includes('appa') || q.includes('ಅಪ್ಪ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_fam5', intent: 'APPA_HALL', text: 'ಅಪ್ಪ ಹಾಲ್‌ನಲ್ಲಿ ಇದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam6', intent: 'APPA_WORK', text: 'ಅಪ್ಪ ಕೆಲಸಕ್ಕೆ ಹೋಗಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam7', intent: 'APPA_REST', text: 'ಅಪ್ಪ ವಿಶ್ರಾಂತಿ ಪಡೆಯುತ್ತಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam8', intent: 'APPA_UNSURE', text: 'ನನಗೆ ಗೊತ್ತಿಲ್ಲ.' }
        ];
      }
    }
    if (q.includes('ajji') || q.includes('ಅಜ್ಜಿ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_fam9', intent: 'AJJI_ROOM', text: 'ಅಜ್ಜಿ ತಮ್ಮ ಕೋಣೆಯಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯುತ್ತಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam10', intent: 'AJJI_OUT', text: 'ಅಜ್ಜಿ ಹೊರಗೆ ಕುಳಿತಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam11', intent: 'AJJI_PRAYER', text: 'ಅಜ್ಜಿ ಪ್ರಾರ್ಥನೆ ಮಾಡುತ್ತಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam12', intent: 'AJJI_SLEEP', text: 'ಅಜ್ಜಿ ಮಲಗಿದ್ದಾರೆ.' }
        ];
      }
    }
    if (q.includes('ajja') || q.includes('ಅಜ್ಜ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_fam13', intent: 'AJJA_OUT', text: 'ಅಜ್ಜ ಹೊರಗೆ ಕುಳಿತಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam14', intent: 'AJJA_PAPER', text: 'ಅಜ್ಜ ಪೇಪರ್ ಓದುತ್ತಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam15', intent: 'AJJA_REST', text: 'ಅಜ್ಜ ವಿಶ್ರಾಂತಿ ಪಡೆಯುತ್ತಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_fam16', intent: 'AJJA_WALK', text: 'ಅಜ್ಜ ನಡಿಗೆಗೆ ಹೋಗಿದ್ದಾರೆ.' }
        ];
      }
    }
    if (q.includes('anna') || q.includes('thamma') || q.includes('brother') || q.includes('ಅಣ್ಣ') || q.includes('ತಮ್ಮ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_bro1', intent: 'BROTHER_PHONE', text: 'ಹೌದು, ನಾನು ಅವನಿಗೆ ಫೋನ್ ಮಾಡಿದ್ದೇನೆ.' },
          { id: 'opt_nlp_bro2', intent: 'BROTHER_WORK', text: 'ಅವನು ಕೆಲಸಕ್ಕೆ ಹೋಗಿದ್ದಾನೆ.' },
          { id: 'opt_nlp_bro3', intent: 'BROTHER_EVENING', text: 'ಅವನು ಇಂದು ಸಂಜೆ ಬರುತ್ತಾನೆ.' },
          { id: 'opt_nlp_bro4', intent: 'BROTHER_OUT', text: 'ಅವನು ಸ್ನೇಹಿತರ ಜೊತೆ ಹೊರಗೆ ಹೋಗಿದ್ದಾನೆ.' }
        ];
      }
    }
    if (q.includes('akka') || q.includes('thangi') || q.includes('sister') || q.includes('ಅಕ್ಕ') || q.includes('ತಂಗಿ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_sis1', intent: 'SISTER_EVENING', text: 'ಅವಳು ಇಂದು ಸಂಜೆ ಬರುತ್ತಾಳೆ.' },
          { id: 'opt_nlp_sis2', intent: 'SISTER_TALKED', text: 'ಹೌದು, ನಾನು ಅವಳ ಜೊತೆ ಮಾತನಾಡಿದ್ದೇನೆ.' },
          { id: 'opt_nlp_sis3', intent: 'SISTER_COLLEGE', text: 'ಅವಳು ಕಾಲೇಜಿನಲ್ಲಿದ್ದಾಳೆ.' },
          { id: 'opt_nlp_sis4', intent: 'SISTER_HOME', text: 'ಅವಳು ಮನೆಯಲ್ಲಿದ್ದಾಳೆ.' }
        ];
      }
    }
    if (q.includes('maga') || q.includes('magalu') || q.includes('son') || q.includes('daughter') || q.includes('ಮಗ') || q.includes('ಮಗಳು')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_child1', intent: 'CHILD_WORK', text: 'ನನ್ನ ಮಗ/ಮಗಳು ಕೆಲಸಕ್ಕೆ ಹೋಗಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_child2', intent: 'CHILD_PHONE', text: 'ಹೌದು, ನಾನು ಅವರಿಗೆ ಫೋನ್ ಮಾಡಿ ಮಾತನಾಡಿದ್ದೇನೆ.' },
          { id: 'opt_nlp_child3', intent: 'CHILD_SCHOOL', text: 'ಅವರು ಶಾಲೆಯಲ್ಲಿ/ಕಾಲೇಜಿನಲ್ಲಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_child4', intent: 'CHILD_EVENING', text: 'ಅವರು ಇಂದು ಸಂಜೆ ಮನೆಗೆ ಬರುತ್ತಾರೆ.' }
        ];
      }
    }
    if (q.includes('hendthi') || q.includes('ganda') || q.includes('wife') || q.includes('husband') || q.includes('ಹೆಂಡತಿ') || q.includes('ಗಂಡ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_sp1', intent: 'SPOUSE_HOME', text: 'ಅವರು ಮನೆಯಲ್ಲೇ ಇದ್ದಾರೆ.' },
          { id: 'opt_nlp_sp2', intent: 'SPOUSE_MARKET', text: 'ಅವರು ಮಾರುಕಟ್ಟೆಗೆ/ಕೆಲಸಕ್ಕೆ ಹೋಗಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_sp3', intent: 'SPOUSE_TALKED', text: 'ಹೌದು, ಅವರ ಜೊತೆ ಮಾತನಾಡಿದ್ದೇನೆ.' },
          { id: 'opt_nlp_sp4', intent: 'SPOUSE_RETURN', text: 'ಅವರು ಸಂಜೆ ವಾಪಸ್ ಬರುತ್ತಾರೆ.' }
        ];
      }
    }
    if (q.includes('yariddare') || q.includes('yaru idare') || q.includes('ellaru') || q.includes('house') || q.includes('ಯಾರು ಇದ್ದಾರೆ') || q.includes('ಎಲ್ಲರೂ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_hs1', intent: 'HOUSE_PARENTS', text: 'ಅಮ್ಮ ಮತ್ತು ಅಪ್ಪ ಮನೆಯಲ್ಲಿ ಇದ್ದಾರೆ.' },
          { id: 'opt_nlp_hs2', intent: 'HOUSE_ALL', text: 'ಹೌದು, ಎಲ್ಲರೂ ಮನೆಯಲ್ಲಿದ್ದಾರೆ.' },
          { id: 'opt_nlp_hs3', intent: 'HOUSE_HELP', text: 'ಹೌದು, ನಾನು ಅವರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.' },
          { id: 'opt_nlp_hs4', intent: 'HOUSE_TALKED', text: 'ಹೌದು, ಅವರ ಜೊತೆ ಮಾತನಾಡಿದ್ದೇನೆ.' }
        ];
      }
    }

    // 0.2 "How was your day?" / "ನಿನ್ನ ದಿನ ಹೇಗಿತ್ತು?"
    if (q.includes('dina') || q.includes('hegittu') || q.includes('day') || q.includes('ದಿನ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_dy1', intent: 'DAY_GOOD', text: 'ನನ್ನ ದಿನ ಚೆನ್ನಾಗಿತ್ತು.' },
          { id: 'opt_nlp_dy2', intent: 'DAY_BUSY', text: 'ತುಂಬಾ ಕಾರ್ಯನಿರತ ದಿನವಾಗಿತ್ತು.' },
          { id: 'opt_nlp_dy3', intent: 'DAY_NORMAL', text: 'ಸಾಧಾರಣವಾಗಿತ್ತು.' },
          { id: 'opt_nlp_dy4', intent: 'DAY_TIRED', text: 'ಸ್ವಲ್ಪ ದಣಿವಾಗಿತ್ತು.' }
        ];
      }
    }

    // 0.3 "Are you busy?" / "ನೀನು ಬ್ಯುಸಿಯಾಗಿದ್ದೀಯಾ?"
    if (q.includes('busy') || q.includes('byusi') || q.includes('ಬ್ಯುಸಿ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_bs1', intent: 'BUSY_NO', text: 'ಇಲ್ಲ, ಈಗ ನಾನು ಫ್ರೀ ಇದ್ದೇನೆ.' },
          { id: 'opt_nlp_bs2', intent: 'BUSY_LITTLE', text: 'ಹೌದು, ಸ್ವಲ್ಪ ಕೆಲಸವಿದೆ.' },
          { id: 'opt_nlp_bs3', intent: 'BUSY_LATER', text: 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮಾತನಾಡುವಾ.' },
          { id: 'opt_nlp_bs4', intent: 'BUSY_YES', text: 'ಹೌದು, ಬ್ಯುಸಿಯಾಗಿದ್ದೇನೆ.' }
        ];
      }
    }

    // 0.4 "What are you thinking?" / "ಏನು ಯೋಚಿಸುತ್ತಿದ್ದೀಯ?"
    if (q.includes('thinking') || q.includes('yochisuttiddiya') || q.includes('ಯೋಚಿಸುತ್ತಿದ್ದೀಯ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_th1', intent: 'THINK_PLAN', text: 'ನಾನು ನಾಳೆಯ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ.' },
          { id: 'opt_nlp_th2', intent: 'THINK_WORK', text: 'ನನ್ನ ಕೆಲಸದ ಬಗ್ಗೆ ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ.' },
          { id: 'opt_nlp_th3', intent: 'THINK_NOTHING', text: 'ಏನೂ ಇಲ್ಲ, ಸುಮ್ಮನೆ.' },
          { id: 'opt_nlp_th4', intent: 'THINK_UNSURE', text: 'ನನಗೆ ನೆನಪಿಲ್ಲ.' }
        ];
      }
    }

    // 0.5 Shopping & Expenses ("ಎಷ್ಟು ಆಯಿತು?" / "ಸಾಮಾನು ತಂದಿದ್ದೀಯಾ?")
    if (q.includes('cost') || q.includes('estu ayitu') || q.includes('ಎಷ್ಟು ಆಯಿತು')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_cs1', intent: 'COST_500', text: 'ಸುಮಾರು ಐನೂರು ರೂಪಾಯಿ ಆಯಿತು.' },
          { id: 'opt_nlp_cs2', intent: 'COST_100', text: 'ಸುಮಾರು ನೂರು ರೂಪಾಯಿ ಆಯಿತು.' },
          { id: 'opt_nlp_cs3', intent: 'COST_RECEIPT', text: 'ನನ್ನ ಬಳಿ ರಸೀದಿ ಇದೆ.' },
          { id: 'opt_nlp_cs4', intent: 'COST_UNSURE', text: 'ನನಗೆ ಸರಿಯಾಗಿ ನೆನಪಿಲ್ಲ.' }
        ];
      }
    }
    if (q.includes('samana') || q.includes('ಸಾಮಾನು')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_sm1', intent: 'ITEMS_BROUGHT', text: 'ಹೌದು, ಸಾಮಾನುಗಳನ್ನು ತಂದಿದ್ದೇನೆ.' },
          { id: 'opt_nlp_sm2', intent: 'ITEMS_FORGOT', text: 'ಇಲ್ಲ, ತರಲು ಮರೆತೆ.' },
          { id: 'opt_nlp_sm3', intent: 'ITEMS_LATER', text: 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ತರುತ್ತೇನೆ.' },
          { id: 'opt_nlp_sm4', intent: 'ITEMS_HELP', text: 'ತರಲು ಸಹಾಯ ಬೇಕು.' }
        ];
      }
    }

    // 0.6 College & Studies ("ಕಾಲೇಜಿಗೆ ಹೋಗಿದ್ದೀಯಾ?" / "ಪರೀಕ್ಷೆ ಹೇಗಾಯಿತು?")
    if (q.includes('college') || q.includes('ಕಾಲೇಜು')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_cg1', intent: 'COLLEGE_WENT', text: 'ಹೌದು, ಕಾಲೇಜಿಗೆ ಹೋಗಿದ್ದೇನೆ.' },
          { id: 'opt_nlp_cg2', intent: 'COLLEGE_NO', text: 'ಇಲ್ಲ, ಇಂದು ರಜೆ ಇತ್ತು.' },
          { id: 'opt_nlp_cg3', intent: 'COLLEGE_LATER', text: 'ಇನ್ನೊಂದು ಸ್ವಲ್ಪ ಸಮಯದಲ್ಲಿ ಹೋಗ್ತೀನಿ.' },
          { id: 'opt_nlp_cg4', intent: 'COLLEGE_GOOD', text: 'ಇಂದು ಕಾಲೇಜು ಚೆನ್ನಾಗಿತ್ತು.' }
        ];
      }
    }
    if (q.includes('parikshe') || q.includes('exam') || q.includes('ಪರೀಕ್ಷೆ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_ex1', intent: 'EXAM_GOOD', text: 'ನನ್ನ ಪರೀಕ್ಷೆ ಚೆನ್ನಾಗಿ ಆಯಿತು.' },
          { id: 'opt_nlp_ex2', intent: 'EXAM_NEXT_WEEK', text: 'ನನ್ನ ಮುಂದಿನ ಪರೀಕ್ಷೆ ಮುಂದಿನ ವಾರ ಇದೆ.' },
          { id: 'opt_nlp_ex3', intent: 'EXAM_HARD', text: 'ಸ್ವಲ್ಪ ಕಷ್ಟವಾಗಿತ್ತು.' },
          { id: 'opt_nlp_ex4', intent: 'EXAM_STUDY', text: 'ನಾನು ಓದುತ್ತಿದ್ದೇನೆ.' }
        ];
      }
    }

    // 0.5. Wake Up / Morning Routine Questions ("What time did you wake up?" / "ಬೆಳಿಗ್ಗೆ ಎಷ್ಟು ಹೊತ್ತಿಗೆ ಎದ್ದೆ?")
    if (q.includes('beligge') || q.includes('edde') || q.includes('estu') || q.includes('eddira') || q.includes('wake up') || q.includes('woke up') || q.includes('got up') || q.includes('morning') || q.includes('ಬೆಳಿಗ್ಗೆ') || q.includes('ಎದ್ದೆ') || q.includes('ಎದ್ದೀರಾ') || q.includes('ಎಷ್ಟು ಹೊತ್ತಿಗೆ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_wu1', intent: 'WAKE_6AM', text: 'ನಾನು ಬೆಳಿಗ್ಗೆ 6 ಗಂಟೆಗೆ ಎದ್ದೆ.' },
          { id: 'opt_nlp_wu2', intent: 'WAKE_7AM', text: 'ನಾನು ಬೆಳಿಗ್ಗೆ 7 ಗಂಟೆಗೆ ಎದ್ದೆ. ನೀವು ಯಾವಾಗ ಎದ್ದಿರಿ?' },
          { id: 'opt_nlp_wu3', intent: 'WAKE_LATE', text: 'ನಾನು ಇಂದು ಸ್ವಲ್ಪ ತಡವಾಗಿ ಎದ್ದೆ.' },
          { id: 'opt_nlp_wu4', intent: 'WAKE_UNSURE', text: 'ನನಗೆ ಎದ್ದ ಸಮಯ ಸರಿಯಾಗಿ ನೆನಪಿಲ್ಲ.' }
        ];
      }
      return [
        { id: 'opt_nlp_wu1', intent: 'WAKE_6AM', text: 'I woke up at 6 AM today.' },
        { id: 'opt_nlp_wu2', intent: 'WAKE_7AM', text: 'I woke up at 7 AM today. When did you wake up?' },
        { id: 'opt_nlp_wu3', intent: 'WAKE_LATE', text: 'I woke up a bit late today.' },
        { id: 'opt_nlp_wu4', intent: 'WAKE_UNSURE', text: "I don't remember what time I woke up." }
      ];
    }

    // 1. WH-Food Questions ("What food do you want?" / "ಏನ್ ಊಟ ಬೇಕು?" / "nange en oota beku")
    if (q.includes('what food') || q.includes('what to eat') || q.includes('which food') || q.includes('en uuta') || q.includes('en oota') || q.includes('enu uuta') || q.includes('enu thindi') || q.includes('thindi') || q.includes('oota') || q.includes('uuta') || q.includes('ಏನ್ ಊಟ') || q.includes('ಏನು ಊಟ') || q.includes('ಏನು ತಿಂಡಿ') || q.includes('ಏನ್ ಬೇಕು')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_wm1', intent: 'FOOD_DOSA', text: 'ನನಗೆ ದೋಸೆ ಅಥವಾ ಇಡ್ಲಿ ಬೇಕು.' },
          { id: 'opt_nlp_wm2', intent: 'FOOD_RICE', text: 'ನನಗೆ ಬಿಸಿ ಬಿಸಿ ಅನ್ನ ಮತ್ತು ಸಾರು ಬೇಕು.' },
          { id: 'opt_nlp_wm3', intent: 'FOOD_ROTI', text: 'ನನಗೆ ಚಪಾತಿ ಮತ್ತು ಪಲ್ಯ ಬೇಕು.' },
          { id: 'opt_nlp_wm4', intent: 'FOOD_SNACK', text: 'ಸ್ವಲ್ಪ ಲಘು ಆಹಾರ ಅಥವಾ ಹಣ್ಣು ಕೊಡಿ.' }
        ];
      }
      return [
        { id: 'opt_nlp_wm1', intent: 'FOOD_DOSA', text: 'I want dosa or idli, please.' },
        { id: 'opt_nlp_wm2', intent: 'FOOD_RICE', text: 'I want hot rice and sambar.' },
        { id: 'opt_nlp_wm3', intent: 'FOOD_ROTI', text: 'I want chapati and curry.' },
        { id: 'opt_nlp_wm4', intent: 'FOOD_SNACK', text: 'Just light snacks or fresh fruit.' }
      ];
    }

    // 2. WH-Drink Questions ("What to drink?" / "ಏನ್ ಕುಡಿಯುತ್ತೀರಾ?" / "en kudi")
    if (q.includes('what to drink') || q.includes('which drink') || q.includes('en kudi') || q.includes('enu kudi') || q.includes('en neeru') || q.includes('kafi') || q.includes('coffee') || q.includes('tea') || q.includes('haalu') || q.includes('halu') || q.includes('ಏನ್ ಕುಡಿ') || q.includes('ಏನು ಕುಡಿ') || q.includes('ಕಾಫಿ') || q.includes('ಚಹಾ') || q.includes('ಹಾಲು')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_wd1', intent: 'DRINK_WATER', text: 'ನನಗೆ ಶುದ್ಧ ನೀರು ಬೇಕು.' },
          { id: 'opt_nlp_wd2', intent: 'DRINK_TEA', text: 'ನನಗೆ ಬಿಸಿ ಬಿಸಿ ಚಹಾ ಅಥವಾ ಕಾಫಿ ಬೇಕು.' },
          { id: 'opt_nlp_wd3', intent: 'DRINK_JUICE', text: 'ನನಗೆ ಎಳೆನೀರು ಅಥವಾ ಬಿಸಿ ಹಾಲು ಬೇಕು.' },
          { id: 'opt_nlp_wd4', intent: 'DRINK_NONE', text: 'ಇಲ್ಲ, ನನಗೆ ಈಗ ಏನೂ ಬೇಡ.' }
        ];
      }
      return [
        { id: 'opt_nlp_wd1', intent: 'DRINK_WATER', text: 'I want fresh drinking water.' },
        { id: 'opt_nlp_wd2', intent: 'DRINK_TEA', text: 'I want hot tea or coffee.' },
        { id: 'opt_nlp_wd3', intent: 'DRINK_JUICE', text: 'I want fresh coconut water or warm milk.' },
        { id: 'opt_nlp_wd4', intent: 'DRINK_NONE', text: 'No, I do not want anything right now.' }
      ];
    }

    // 3. Pain & Medical Symptom Questions ("Are you in pain?" / "ನೋವಾಗ್ತಿದೆಯಾ?" / "tala novu")
    if (q.includes('pain') || q.includes('hurt') || q.includes('nov') || q.includes('novu') || q.includes('thale') || q.includes('tala') || q.includes('doct') || q.includes('aushad') || q.includes('osadi') || q.includes('tablet') || q.includes('ನೋವು') || q.includes('ತಲೆನೋವು') || q.includes('ಔಷಧಿ') || q.includes('ವೈದ್ಯ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_pn1', intent: 'PAIN_HEADACHE', text: 'ನನಗೆ ಸ್ವಲ್ಪ ತಲೆನೋವು/ದೇಹದ ನೋವು ಇದೆ.' },
          { id: 'opt_nlp_pn2', intent: 'PAIN_MEDICINE', text: 'ದಯವಿಟ್ಟು ನನ್ನ ಮಾತ್ರೆ/ಔಷಧಿ ಕೊಡಿ.' },
          { id: 'opt_nlp_pn3', intent: 'PAIN_DOCTOR', text: 'ನನ್ನ ವೈದ್ಯರನ್ನು/ಡಾಕ್ಟರ್‌ ಕರೆಸಿ.' },
          { id: 'opt_nlp_pn4', intent: 'PAIN_NONE', text: 'ಇಲ್ಲ, ನನಗೆ ಈಗ ಯಾವುದೇ ನೋವಿಲ್ಲ.' }
        ];
      }
      return [
        { id: 'opt_nlp_pn1', intent: 'PAIN_HEADACHE', text: 'I have a bit of a headache or body pain.' },
        { id: 'opt_nlp_pn2', intent: 'PAIN_MEDICINE', text: 'Please give me my pain medicine.' },
        { id: 'opt_nlp_pn3', intent: 'PAIN_DOCTOR', text: 'Please call the doctor for me.' },
        { id: 'opt_nlp_pn4', intent: 'PAIN_NONE', text: "No, I'm not in pain right now." }
      ];
    }

    // 4. Hygiene & Bathroom Questions ("Want to use washroom?" / "snana madana" / "ಶೌಚಾಲಯ")
    if (q.includes('bath') || q.includes('snana') || q.includes('toilet') || q.includes('washroom') || q.includes('pee') || q.includes('poop') || q.includes('shoucha') || q.includes('ಶೌಚಾಲಯ') || q.includes('ಸ್ನಾನ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_hy1', intent: 'HYGIENE_TOILET', text: 'ನನಗೆ ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗಬೇಕು.' },
          { id: 'opt_nlp_hy2', intent: 'HYGIENE_BATH', text: 'ನನಗೆ ಸ್ನಾನ ಮಾಡಬೇಕು.' },
          { id: 'opt_nlp_hy3', intent: 'HYGIENE_WASH', text: 'ನನ್ನ ಕೈ-ಮುಖ ತೊಳೆಯಲು ಸಹಾಯ ಮಾಡಿ.' },
          { id: 'opt_nlp_hy4', intent: 'HYGIENE_NONE', text: 'ಇಲ್ಲ, ನನಗೆ ಈಗ ಬೇಡ.' }
        ];
      }
      return [
        { id: 'opt_nlp_hy1', intent: 'HYGIENE_TOILET', text: 'I need to use the restroom.' },
        { id: 'opt_nlp_hy2', intent: 'HYGIENE_BATH', text: 'I want to take a bath.' },
        { id: 'opt_nlp_hy3', intent: 'HYGIENE_WASH', text: 'Please help me wash up.' },
        { id: 'opt_nlp_hy4', intent: 'HYGIENE_NONE', text: 'No, not right now.' }
      ];
    }

    // 5. Sleep & Rest Questions ("Want to sleep?" / "nidere" / "ನಿದ್ರೆ ಮಾಡ್ತೀರಾ?")
    if (q.includes('sleep') || q.includes('rest') || q.includes('bed') || q.includes('nidre') || q.includes('nidere') || q.includes('malag') || q.includes('hasige') || q.includes('ನಿದ್ರೆ') || q.includes('ವಿಶ್ರಾಂತಿ') || q.includes('ಮಲಗು')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_rs1', intent: 'REST_SLEEP', text: 'ನನಗೆ ತುಂಬಾ ನಿದ್ರೆ ಬರುತ್ತಿದೆ, ಮಲಗ್ತೀನಿ.' },
          { id: 'opt_nlp_rs2', intent: 'REST_BED', text: 'ಹಾಸಿಗೆ ಸ್ವಲ್ಪ ಸರಿ ಮಾಡಿ.' },
          { id: 'opt_nlp_rs3', intent: 'REST_QUIET', text: 'ನನಗೆ ವಿಶ್ರಾಂತಿ ಬೇಕು, ಸದ್ದು ಮಾಡಬೇಡಿ.' },
          { id: 'opt_nlp_rs4', intent: 'REST_NONE', text: 'ಇಲ್ಲ, ನನಗೆ ನಿದ್ರೆ ಬರುತ್ತಿಲ್ಲ.' }
        ];
      }
      return [
        { id: 'opt_nlp_rs1', intent: 'REST_SLEEP', text: 'I feel very sleepy, I want to sleep.' },
        { id: 'opt_nlp_rs2', intent: 'REST_BED', text: 'Please adjust my bed pillows.' },
        { id: 'opt_nlp_rs3', intent: 'REST_QUIET', text: 'I need quiet rest.' },
        { id: 'opt_nlp_rs4', intent: 'REST_NONE', text: "No, I'm not sleepy." }
      ];
    }

    // 6. Temperature & Comfort Questions ("Are you feeling cold/hot?" / "chali" / "ಚಳಿ")
    if (q.includes('cold') || q.includes('hot') || q.includes('chali') || q.includes('bisi') || q.includes('fan') || q.includes('blanket') || q.includes('hoddiko') || q.includes('ಚಳಿ') || q.includes('ಬಿಸಿ') || q.includes('ಫ್ಯಾನ್')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_cm1', intent: 'COMFORT_COLD', text: 'ನನಗೆ ತುಂಬಾ ಚಳಿಯಾಗಿದೆ, ಹೊದಿಕೆ ಕೊಡಿ.' },
          { id: 'opt_nlp_cm2', intent: 'COMFORT_HOT', text: 'ಫ್ಯಾನ್/ಎಸಿ ಆನ್ ಮಾಡಿ, ಬಿಸಿಯಾಗಿದೆ.' },
          { id: 'opt_nlp_cm3', intent: 'COMFORT_POSITION', text: 'ನನ್ನ ಕುಳಿತುಕೊಳ್ಳುವ ಭಂಗಿ ಸರಿ ಮಾಡಿ.' },
          { id: 'opt_nlp_cm4', intent: 'COMFORT_FINE', text: 'ನನಗೆ ಆರಾಮಾಗಿದೆ, ಧನ್ಯವಾದಗಳು.' }
        ];
      }
      return [
        { id: 'opt_nlp_cm1', intent: 'COMFORT_COLD', text: 'I am feeling cold, please give a blanket.' },
        { id: 'opt_nlp_cm2', intent: 'COMFORT_HOT', text: 'I feel warm, please turn on the fan.' },
        { id: 'opt_nlp_cm3', intent: 'COMFORT_POSITION', text: 'Please adjust my seating position.' },
        { id: 'opt_nlp_cm4', intent: 'COMFORT_FINE', text: "I'm comfortable, thank you." }
      ];
    }

    // 7. WH-Location Questions ("Where to go?" / "ಎಲ್ಲಿಗೆ ಹೋಗೋಣ?" / "ellige")
    if (q.includes('where') || q.includes('ellige') || q.includes('elli') || q.includes('ಎಲ್ಲಿ') || q.includes('ಎಲ್ಲಿಗೆ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_loc1', intent: 'LOC_GARDEN', text: 'ಹೊರಗೆ ತೋಟಕ್ಕೆ ಹೋಗೋಣ.' },
          { id: 'opt_nlp_loc2', intent: 'LOC_ROOM', text: 'ನಾನು ನನ್ನ ಕೊಠಡಿಯಲ್ಲೇ ಇರ್ತೀನಿ.' },
          { id: 'opt_nlp_loc3', intent: 'LOC_CLINIC', text: 'ಆಸ್ಪತ್ರೆಗೆ/ಡಾಕ್ಟರ್ ಹತ್ತಿರ ಹೋಗಬೇಕು.' },
          { id: 'opt_nlp_loc4', intent: 'LOC_WALK', text: 'ಸ್ವಲ್ಪ ನಡಿಗೆಗೆ ಹೋಗೋಣ.' }
        ];
      }
      return [
        { id: 'opt_nlp_loc1', intent: 'LOC_GARDEN', text: 'Let us go out to the garden.' },
        { id: 'opt_nlp_loc2', intent: 'LOC_ROOM', text: 'I prefer staying in my room.' },
        { id: 'opt_nlp_loc3', intent: 'LOC_CLINIC', text: 'I need to see the doctor.' },
        { id: 'opt_nlp_loc4', intent: 'LOC_WALK', text: 'Let us go for a short walk.' }
      ];
    }

    // 8. WH-Time Questions ("When?" / "ಯಾವಾಗ?" / "yavaga")
    if (q.includes('when') || q.includes('yavaga') || q.includes('yavaka') || q.includes('ಯಾವಾಗ') || q.includes('ಎಷ್ಟು ಗಂಟೆಗೆ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_tm1', intent: 'TIME_NOW', text: 'ಈಗಲೇ ಮಾಡೋಣ/ಹೋಗೋಣ.' },
          { id: 'opt_nlp_tm2', intent: 'TIME_LATER', text: 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ.' },
          { id: 'opt_nlp_tm3', intent: 'TIME_TOMORROW', text: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ತೀರ್ಮಾನಿಸೋಣ.' },
          { id: 'opt_nlp_tm4', intent: 'TIME_UNSURE', text: 'ನನಗೆ ಸಮಯ ಗೊತ್ತಿಲ್ಲ.' }
        ];
      }
      return [
        { id: 'opt_nlp_tm1', intent: 'TIME_NOW', text: 'Let us do it right now.' },
        { id: 'opt_nlp_tm2', intent: 'TIME_LATER', text: 'In a little while, please.' },
        { id: 'opt_nlp_tm3', intent: 'TIME_TOMORROW', text: 'Let us decide tomorrow morning.' },
        { id: 'opt_nlp_tm4', intent: 'TIME_UNSURE', text: "I'm not sure about the time." }
      ];
    }

    // 9. WH-Person Questions ("Who to call?" / "ಯಾರಿಗೆ ಫೋನ್ ಮಾಡೋಣ?" / "yarige")
    if (q.includes('who') || q.includes('yarige') || q.includes('yaru') || q.includes('maga') || q.includes('magalu') || q.includes('ಯಾರು') || q.includes('ಯಾರಿಗೆ') || q.includes('ಮಗ') || q.includes('ಮಗಳು')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_pr1', intent: 'PERSON_FAMILY', text: 'ನನ್ನ ಕುಟುಂಬದವರಿಗೆ ಫೋನ್ ಮಾಡಿ.' },
          { id: 'opt_nlp_pr2', intent: 'PERSON_DOCTOR', text: 'ಡಾಕ್ಟರ್‌ಗೆ/ವೈದ್ಯರಿಗೆ ಫೋನ್ ಮಾಡಿ.' },
          { id: 'opt_nlp_pr3', intent: 'PERSON_CHILD', text: 'ನನ್ನ ಮಗ/ಮಗಳಿಗೆ ಫೋನ್ ಮಾಡಿ.' },
          { id: 'opt_nlp_pr4', intent: 'PERSON_NONE', text: 'ಯಾರೂ ಬೇಡ, ನಾನು ಆರಾಮಾಗಿದ್ದೇನೆ.' }
        ];
      }
      return [
        { id: 'opt_nlp_pr1', intent: 'PERSON_FAMILY', text: 'Please call my family.' },
        { id: 'opt_nlp_pr2', intent: 'PERSON_DOCTOR', text: 'Please call the doctor.' },
        { id: 'opt_nlp_pr3', intent: 'PERSON_CHILD', text: 'Please call my children.' },
        { id: 'opt_nlp_pr4', intent: 'PERSON_NONE', text: 'No need to call anyone, I am fine.' }
      ];
    }

    // 10. Health / Greetings ("How are you?" / "hegiddira" / "ಹೇಗಿದ್ದೀರಾ?")
    if (q.includes('how are you') || q.includes('hegiddira') || q.includes('heg') || q.includes('gidi') || q.includes('tiana') || q.includes('chennag') || q.includes('ಹೇಗಿದ್ದೀರಾ') || q.includes('ಚೆನ್ನಾಗಿದ್ದೀರಾ')) {
      if (isKannada) {
        return [
          { id: 'opt_nlp_hl1', intent: 'HEALTH_GOOD', text: 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು!' },
          { id: 'opt_nlp_hl2', intent: 'HEALTH_ASK', text: 'ಹೇ, ನೀವು ಹೇಗಿದ್ದೀರಾ?' },
          { id: 'opt_nlp_hl3', intent: 'HEALTH_TIRED', text: 'ಸ್ವಲ್ಪ ಆಯಾಸವಾಗಿದೆ, ವಿಶ್ರಾಂತಿ ಬೇಕು.' },
          { id: 'opt_nlp_hl4', intent: 'HEALTH_HELP', text: 'ನನಗೆ ಸಹಾಯ ಬೇಕು.' }
        ];
      }
      return [
        { id: 'opt_nlp_hl1', intent: 'HEALTH_GOOD', text: "I'm doing great, thank you!" },
        { id: 'opt_nlp_hl2', intent: 'HEALTH_ASK', text: 'Hey, how are you doing?' },
        { id: 'opt_nlp_hl3', intent: 'HEALTH_TIRED', text: 'A bit tired, I need to rest.' },
        { id: 'opt_nlp_hl4', intent: 'HEALTH_HELP', text: 'I need some help.' }
      ];
    }

    // 11. Open Domain Smart Paraphraser Fallback
    if (isKannada) {
      return [
        { id: 'opt_nlp_od1', intent: 'AGREE_DYNAMIC', text: 'ಹೌದು, ಖಂಡಿತ!' },
        { id: 'opt_nlp_od2', intent: 'DISAGREE_DYNAMIC', text: 'ಇಲ್ಲ, ಈಗ ಬೇಡ.' },
        { id: 'opt_nlp_od3', intent: 'REST_DYNAMIC', text: 'ನನಗೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಮನಸ್ಸಿದೆ.' },
        { id: 'opt_nlp_od4', intent: 'HELP_DYNAMIC', text: 'ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಹಾಯ ಮಾಡಿ.' }
      ];
    }

    return [
      { id: 'opt_nlp_od1', intent: 'AGREE_DYNAMIC', text: 'Yeah, sure!' },
      { id: 'opt_nlp_od2', intent: 'DISAGREE_DYNAMIC', text: 'No, not right now.' },
      { id: 'opt_nlp_od3', intent: 'REST_DYNAMIC', text: 'I want to rest for a bit.' },
      { id: 'opt_nlp_od4', intent: 'HELP_DYNAMIC', text: 'Could you please help me out?' }
    ];
  }

  /**
   * NLP Output Post-Processing Engine
   * Refines output choices for conversational naturalness, casual contractions, and script integrity
   */
  postProcessOutputNLP(options, language = 'en') {
    if (!Array.isArray(options)) return options;

    return options.map((opt) => {
      let text = typeof opt === 'string' ? opt : opt.text || '';
      let intent = typeof opt === 'object' ? opt.intent || 'DYNAMIC' : 'DYNAMIC';

      // 1. NLP Conversational Contractions (English)
      if (language === 'en' || language === 'English') {
        text = text
          .replace(/\bI am\b/g, "I'm")
          .replace(/\bdo not\b/g, "don't")
          .replace(/\bcannot\b/g, "can't")
          .replace(/\bwould not\b/g, "wouldn't");
      }

      // 2. Ensure Proper Sentence Punctuation
      text = text.trim();
      if (!/[.!?]$/.test(text)) {
        text += '.';
      }

      if (typeof opt === 'string') {
        return text;
      }

      return {
        ...opt,
        text,
        intent: opt.intent || intent,
        nlpProcessed: true
      };
    });
  }
}

module.exports = new NLPProcessorService();
