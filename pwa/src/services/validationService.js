/**
 * VoiceBack Centralized Real Answer Validation Service
 */
export const validationService = {
  /**
   * Validate spoken transcript against expected targets
   * Returns consistent result contract:
   * {
   *   isCorrect: boolean,
   *   confidence: number,
   *   reason: string,
   *   expected: string,
   *   recognized: string,
   *   validationMode: 'exact' | 'phrase' | 'intent' | 'sentence'
   * }
   */
  validateAnswer: (rawTranscript, itemConfig = {}) => {
    const mode = itemConfig.mode || 'phrase';
    const expectedText = (itemConfig.target || itemConfig.label || '').toUpperCase();
    const recognizedText = (rawTranscript || '').trim();

    // STT Failure / Empty Transcript Guard
    if (!recognizedText || recognizedText.length === 0) {
      return {
        isCorrect: false,
        confidence: 0,
        reason: "STT failed or speech was silent. Please try speaking again.",
        expected: expectedText,
        recognized: '',
        validationMode: mode,
      };
    }

    const cleanInput = recognizedText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
    const cleanExpected = expectedText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();

    // 1. EXACT MODE
    if (mode === 'exact') {
      const isExact = cleanInput === cleanExpected;
      return {
        isCorrect: isExact,
        confidence: isExact ? 1.0 : 0.0,
        reason: isExact ? 'Exact word match' : `Spoke "${recognizedText}" instead of expected "${expectedText}"`,
        expected: expectedText,
        recognized: recognizedText,
        validationMode: 'exact',
      };
    }

    // 2. PHRASE MODE
    if (mode === 'phrase') {
      const keywords = itemConfig.keywords || [cleanExpected];
      const isPhraseMatch = keywords.some((kw) => {
        const cleanKw = kw.toLowerCase().trim();
        return cleanInput.includes(cleanKw) || cleanKw.includes(cleanInput);
      });

      return {
        isCorrect: isPhraseMatch,
        confidence: isPhraseMatch ? 0.9 : 0.1,
        reason: isPhraseMatch ? 'Phrase intent matched' : `Phrase "${recognizedText}" did not match "${expectedText}"`,
        expected: expectedText,
        recognized: recognizedText,
        validationMode: 'phrase',
      };
    }

    // 3. INTENT / SCENARIO MODE (12 DIVERSE SCENARIO CATEGORIES)
    if (mode === 'intent' || mode === 'scenario') {
      const category = itemConfig.category || 'water';
      const categoryDictionaries = {
        water: ['water', 'drink', 'thirsty', 'glass', 'need water', 'want water', 'give water', 'ನೀರು', 'पानी'],
        food: ['food', 'eat', 'hungry', 'plate', 'meal', 'dinner', 'lunch', 'ಆಹಾರ', 'ಊಟ', 'खाना', 'भोजन'],
        pain: ['pain', 'hurt', 'discomfort', 'sick', 'not well', 'headache', 'ನೋವು', 'दर्द', 'बीमार'],
        medicine: ['medicine', 'meds', 'pills', 'doctor', 'treatment', 'ಔಷಧ', 'ಮಾತ್ರೆ', 'दवा', 'औषधि'],
        caregiver: ['caregiver', 'nurse', 'call caregiver', 'help', 'family', 'ಪಾಲನೆದಾರರು', 'ಸಹಾಯ', 'ಮದದ್', 'मदद'],
        toilet: ['toilet', 'restroom', 'washroom', 'bathroom', 'ಶೌಚಾಲಯ', 'शौचालय'],
        tired: ['tired', 'rest', 'sleep', 'sleepy', 'ಆಯಾಸ', 'ವಿಶ್ರಾಂತಿ', 'थकान', 'आराम'],
        doctor: ['doctor', 'physician', 'better', 'fine', 'recovering', 'ವೈದ್ಯರು', 'डॉक्टर'],
        hot: ['hot', 'sweat', 'summer', 'cold water', 'ಬಿಸಿ', 'गर्मी'],
        cold: ['cold', 'blanket', 'shivering', 'ಚಳಿ', 'ठंड'],
        family: ['family', 'mom', 'mother', 'call family', 'ಕುಟುಂಬ', 'ಅಮ್ಮ', 'परिवार', 'मां'],
        apple: ['apple', 'fruit', 'hungry', 'ಸೇಬು', 'सेब']
      };

      const validList = categoryDictionaries[category] || itemConfig.keywords || [cleanExpected];
      const isIntentMatch = validList.some((kw) => cleanInput.includes(kw.toLowerCase().trim()));

      return {
        isCorrect: isIntentMatch,
        confidence: isIntentMatch ? 0.95 : 0.05,
        reason: isIntentMatch ? 'Scenario intent validated' : `Response "${recognizedText}" does not fit scenario "${category}"`,
        expected: expectedText,
        recognized: recognizedText,
        validationMode: 'intent',
      };
    }

    // 4. SENTENCE MODE
    if (mode === 'sentence') {
      const keywords = itemConfig.keywords || cleanExpected.split(' ');
      const matchedCount = keywords.filter((kw) => cleanInput.includes(kw.toLowerCase())).length;
      const isSentenceMatch = matchedCount >= Math.min(2, keywords.length);

      return {
        isCorrect: isSentenceMatch,
        confidence: isSentenceMatch ? 0.85 : 0.1,
        reason: isSentenceMatch ? 'Sentence key concepts matched' : `Key concepts missing from "${recognizedText}"`,
        expected: expectedText,
        recognized: recognizedText,
        validationMode: 'sentence',
      };
    }

    return {
      isCorrect: false,
      confidence: 0,
      reason: 'Validation failed',
      expected: expectedText,
      recognized: recognizedText,
      validationMode: mode,
    };
  },
};

export default validationService;
