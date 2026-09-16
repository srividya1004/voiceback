/**
 * VoiceBack Centralized Real Answer Validation Service
 */

const getPhoneticKey = (str) => {
  return (str || '')
    .toLowerCase()
    .replace(/w/g, 'v')
    .replace(/ph/g, 'f')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/ch/g, 'c')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/ou/g, 'u')
    .replace(/([a-z])\1+/g, '$1')
    .trim();
};

const calculateLevenshtein = (a, b) => {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;
  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1
        );
      }
    }
  }
  return matrix[bn][an];
};

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

    // 3. INTENT / SCENARIO MODE (12 DIVERSE SCENARIO CATEGORIES + GAME 4 ENHANCED VALIDATION)
    if (mode === 'intent' || mode === 'scenario') {
      const category = itemConfig.category || 'water';
      const language = itemConfig.language || 'en';
      const categoryDictionaries = {
        water: ['water', 'drink', 'thirsty', 'glass', 'need water', 'want water', 'give water', 'ನೀರು', 'पानी'],
        food: ['food', 'eat', 'hungry', 'plate', 'meal', 'dinner', 'lunch', 'ಆಹಾರ', 'ಊಟ', 'खाना', 'भोजन'],
        pain: ['pain', 'hurt', 'discomfort', 'sick', 'not well', 'headache', 'ನೋವು', 'दर्द', 'बीमार'],
        medicine: ['medicine', 'meds', 'pills', 'doctor', 'treatment', 'ಔಷಧ', 'ಮಾತ್ರೆ', 'दवा', 'औषधि'],
        caregiver: ['caregiver', 'nurse', 'call caregiver', 'help', 'family', 'ಪಾಲನೆದಾರರು', 'ಸಹಾಯ', 'ಮದದ್', 'मदद'],
        toilet: ['toilet', 'restroom', 'washroom', 'bathroom', 'ಶೌಚಾಲಯ', 'शौचालय'],
        tired: ['tired', 'rest', 'sleep', 'sleepy', 'ಆಯಾಸ', 'ವಿಶ್ರಾಂತಿ', 'थकान', 'ಆರಾಮ'],
        doctor: ['doctor', 'physician', 'better', 'fine', 'recovering', 'ವೈದ್ಯರು', 'डॉक्टर'],
        hot: ['hot', 'sweat', 'summer', 'cold water', 'ಬಿಸಿ', 'गर्मी'],
        cold: ['cold', 'blanket', 'shivering', 'ಚಳಿ', 'ठंड'],
        family: ['family', 'mom', 'mother', 'call family', 'ಕುಟುಂಬ', 'ಅಮ್ಮ', 'परिवार', 'मां'],
        apple: ['apple', 'fruit', 'hungry', 'ಸೇಬು', 'सेब']
      };

      // Enhanced Game 4 validation when acceptableAnswers or translitVariants provided
      if (itemConfig.acceptableAnswers || itemConfig.translitVariants) {
        const acceptableAnswers = (itemConfig.acceptableAnswers || []).map((a) =>
          a.toLowerCase().normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
        );
        const translitVariants = (itemConfig.translitVariants || []).map((t) => t.toLowerCase().trim());
        const expectedKeywords = (itemConfig.keywords || []).map((k) => k.toLowerCase().trim());
        const wrongCategories = Object.keys(categoryDictionaries).filter((c) => c !== category);

        // Check if user spoke an explicit term from a different scenario category
        const hasWrongCategory = wrongCategories.some((wc) =>
          categoryDictionaries[wc].some((term) =>
            cleanInput.includes(term.toLowerCase().trim()) &&
            !acceptableAnswers.some((ans) => ans.includes(term)) &&
            !expectedKeywords.some((ek) => ek.includes(term))
          )
        );

        const isExactOrSubMatch = acceptableAnswers.some((ans) =>
          cleanInput === ans || cleanInput.includes(ans) || (cleanInput.length >= 6 && ans.includes(cleanInput))
        );
        const isTranslitMatch = translitVariants.some((tr) =>
          cleanInput === tr || cleanInput.includes(tr) || (cleanInput.length >= 6 && tr.includes(cleanInput))
        );
        const hasKeywords = expectedKeywords.length > 0 && expectedKeywords.some((kw) => cleanInput.includes(kw));

        const isCorrect = (isExactOrSubMatch || isTranslitMatch || hasKeywords) && !hasWrongCategory && cleanInput.length >= 3;

        return {
          isCorrect,
          confidence: isCorrect ? 0.95 : 0.1,
          reason: isCorrect
            ? 'Scenario response validated'
            : (language === 'kn'
                ? `ಪ್ರತಿಕ್ರಿಯೆ "${recognizedText}" ಈ ಸನ್ನಿವೇಶಕ್ಕೆ ಸರಿಯಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಸೂಕ್ತ ಉತ್ತರ ನೀಡಿ.`
                : `Response "${recognizedText}" does not fit this scenario. Please try an appropriate response.`),
          expected: expectedText,
          recognized: recognizedText,
          validationMode: 'scenario',
        };
      }

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

    // 4. SENTENCE MODE (GAME 3: SENTENCE CHALLENGE)
    if (mode === 'sentence') {
      const language = itemConfig.language || 'en';
      const arrangedSentence = itemConfig.arrangedSentence ? itemConfig.arrangedSentence.trim() : null;

      const cleanNormExpected = cleanExpected
        .toLowerCase()
        .normalize('NFC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // 1. Check arranged word order if provided
      if (arrangedSentence) {
        const cleanArranged = arrangedSentence
          .toLowerCase()
          .normalize('NFC')
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanArranged !== cleanNormExpected) {
          return {
            isCorrect: false,
            confidence: 0,
            reason: language === 'kn'
              ? 'ಪದಗಳ ಜೋಡಣೆ ತಪ್ಪಾಗಿದೆ. ಕಾರ್ಡ್‌ಗಳನ್ನು ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ ನಂತರ ಮಾತನಾಡಿ.'
              : 'The arranged word order is incorrect. Please tap cards to rearrange into the correct order.',
            expected: expectedText,
            arranged: arrangedSentence,
            recognized: recognizedText,
            validationMode: 'sentence',
          };
        }
      }

      // 2. Validate spoken sentence
      const cleanNormInput = recognizedText
        .toLowerCase()
        .normalize('NFC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Check exact match
      if (cleanNormInput === cleanNormExpected) {
        return {
          isCorrect: true,
          confidence: 1.0,
          reason: 'Complete sentence matched perfectly',
          expected: expectedText,
          recognized: recognizedText,
          validationMode: 'sentence',
        };
      }

      // Check configured acceptable transcripts
      const acceptableTranscripts = (itemConfig.acceptableTranscripts || []).map((t) =>
        t.toLowerCase().normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '').replace(/\s+/g, ' ').trim()
      );

      for (const acc of acceptableTranscripts) {
        if (cleanNormInput === acc || cleanNormInput.includes(acc)) {
          return {
            isCorrect: true,
            confidence: 0.95,
            reason: 'Sentence matched acceptable speech variation',
            expected: expectedText,
            recognized: recognizedText,
            validationMode: 'sentence',
          };
        }
      }

      // Check transliteration variants for Kannada
      const translitVariants = (itemConfig.translitVariants || []).map((t) =>
        t.toLowerCase().trim()
      );
      for (const tr of translitVariants) {
        if (cleanNormInput === tr || cleanNormInput.includes(tr)) {
          return {
            isCorrect: true,
            confidence: 0.92,
            reason: 'Kannada sentence transliteration matched',
            expected: expectedText,
            recognized: recognizedText,
            validationMode: 'sentence',
          };
        }
      }

      // Strip conversational sentence fillers
      const sentenceFillers = [
        'i said', 'i want to say', 'please', 'can i have', 'can i get',
        'ದಯವಿಟ್ಟು', 'ಹೇಳಿ', 'ನಾನು ಹೇಳಿದೆ',
      ];
      let strippedSentence = cleanNormInput;
      for (const f of sentenceFillers) {
        if (strippedSentence.startsWith(f + ' ')) {
          strippedSentence = strippedSentence.slice(f.length).trim();
          break;
        }
      }

      if (strippedSentence === cleanNormExpected) {
        return {
          isCorrect: true,
          confidence: 0.95,
          reason: 'Sentence matched after removing filler',
          expected: expectedText,
          recognized: recognizedText,
          validationMode: 'sentence',
        };
      }

      // Complete keyword coverage: ALL keywords must be represented
      const keywords = (itemConfig.keywords || cleanNormExpected.split(/\s+/)).map((k) => k.toLowerCase().trim());
      const inputWords = strippedSentence.split(/\s+/);
      const matchedKeywords = keywords.filter((kw) =>
        inputWords.includes(kw) || strippedSentence.includes(kw)
      );

      // Do NOT allow single word or incomplete sentence match
      if (keywords.length >= 2 && matchedKeywords.length < keywords.length) {
        // Levenshtein phonetic tolerance on the complete sentence
        const lev = calculateLevenshtein(cleanNormInput, cleanNormExpected);
        if (lev <= 2 || (cleanNormExpected.length > 8 && lev / cleanNormExpected.length <= 0.18)) {
          return {
            isCorrect: true,
            confidence: 0.88,
            reason: 'Sentence matched within close pronunciation tolerance',
            expected: expectedText,
            recognized: recognizedText,
            validationMode: 'sentence',
          };
        }

        return {
          isCorrect: false,
          confidence: 0.2,
          reason: language === 'kn'
            ? `ಸಂಪೂರ್ಣ ವಾಕ್ಯವನ್ನು ಹೇಳಿಲ್ಲ ("${recognizedText}"). ದಯವಿಟ್ಟು ಸಂಪೂರ್ಣ ವಾಕ್ಯವನ್ನು ಮಾತನಾಡಿ.`
            : `Spoke incomplete sentence ("${recognizedText}"). Please speak the complete sentence: "${expectedText}".`,
          expected: expectedText,
          recognized: recognizedText,
          validationMode: 'sentence',
        };
      }

      // If all keywords are present
      if (matchedKeywords.length === keywords.length) {
        return {
          isCorrect: true,
          confidence: 0.9,
          reason: 'All sentence key concepts validated',
          expected: expectedText,
          recognized: recognizedText,
          validationMode: 'sentence',
        };
      }

      return {
        isCorrect: false,
        confidence: 0.1,
        reason: language === 'kn'
          ? `ಹೇಳಿದ ವಾಕ್ಯವು ನಿರೀಕ್ಷಿತ ವಾಕ್ಯಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ.`
          : `Spoken sentence did not match expected "${expectedText}". Please try again!`,
        expected: expectedText,
        recognized: recognizedText,
        validationMode: 'sentence',
      };
    }

    // 5. BILINGUAL OBJECT MODE (GAME 2: SPEAK & POP)
    if (mode === 'bilingual_object' || mode === 'speak_and_pop') {
      const targetEn = itemConfig.en || itemConfig.targetEn || expectedText;
      const targetKn = itemConfig.kn || itemConfig.targetKn || '';
      const targetKey = (itemConfig.id || itemConfig.label || targetEn).toLowerCase().trim();

      const unrelatedBlacklist = {
        water: ['waiter', 'winter', 'weather', 'white', 'writer'],
        apple: ['table', 'staple', 'purple', 'people'],
        cup: ['cap', 'cop', 'cut', 'cub', 'car', 'can'],
        book: ['back', 'bark', 'bike', 'bake', 'hook', 'look'],
        mango: ['money', 'monkey', 'magic', 'many', 'mangoose'],
        milk: ['silk', 'walk', 'mask', 'mill'],
        tea: ['tree', 'free', 'sea', 'pea', 'key'],
        ball: ['call', 'fall', 'tall', 'wall', 'doll', 'bell'],
        phone: ['fine', 'stone', 'bone', 'cone'],
        flower: ['flour', 'floor', 'lower', 'power'],
      };

      const cleanNormalized = recognizedText
        .toLowerCase()
        .normalize('NFC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
        .trim();

      // Check blacklist
      const blacklist = unrelatedBlacklist[targetKey] || [];
      for (const b of blacklist) {
        if (cleanNormalized === b || cleanNormalized.split(/\s+/).includes(b)) {
          return {
            isCorrect: false,
            confidence: 0,
            reason: `Unrelated word "${recognizedText}" rejected.`,
            expected: `${targetEn} / ${targetKn}`,
            recognized: recognizedText,
            validationMode: 'bilingual_object',
          };
        }
      }

      // Strip conversational conversational fillers
      const fillers = ['it is an', 'it is a', 'it is', 'its an', 'its a', 'its', 'this is an', 'this is a', 'this is', 'that is', 'a', 'an', 'the', 'one', 'ಇದು ಒಂದು', 'ಇದು', 'ಒಂದು'];
      let strippedInput = cleanNormalized;
      for (const f of fillers) {
        if (strippedInput.startsWith(f + ' ')) {
          strippedInput = strippedInput.slice(f.length).trim();
          break;
        }
      }

      const inputWords = strippedInput.split(/\s+/);
      const hasKnScript = /[\u0C80-\u0CFF]/.test(cleanNormalized);

      const knVariants = itemConfig.knVariants || (targetKn ? [targetKn] : []);
      const enVariants = itemConfig.enVariants || (targetEn ? [targetEn] : []);
      const translitVariants = itemConfig.translitVariants || [];

      // 1. Kannada script check
      if (hasKnScript) {
        for (const knVar of knVariants) {
          const cleanKn = knVar.toLowerCase().normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '').trim();
          if (cleanNormalized.includes(cleanKn) || cleanKn.includes(cleanNormalized) || strippedInput === cleanKn) {
            return {
              isCorrect: true,
              confidence: 0.98,
              reason: 'Kannada word validated',
              detectedLanguage: 'Kannada',
              spokenTarget: targetKn || cleanKn,
              expected: `${targetEn} / ${targetKn}`,
              recognized: recognizedText,
              validationMode: 'bilingual_object',
            };
          }
          for (const w of inputWords) {
            if (w === cleanKn || cleanKn.includes(w) || w.includes(cleanKn)) {
              return {
                isCorrect: true,
                confidence: 0.95,
                reason: 'Kannada word token validated',
                detectedLanguage: 'Kannada',
                spokenTarget: targetKn || cleanKn,
                expected: `${targetEn} / ${targetKn}`,
                recognized: recognizedText,
                validationMode: 'bilingual_object',
              };
            }
            // Stem check for inflected Kannada words (e.g. ಪುಸ್ತಕ -> ಪುಸ್ತ)
            if (cleanKn.length >= 4 && w.length >= 4 && w.startsWith(cleanKn.slice(0, 4))) {
              return {
                isCorrect: true,
                confidence: 0.92,
                reason: 'Kannada word stem validated',
                detectedLanguage: 'Kannada',
                spokenTarget: targetKn || cleanKn,
                expected: `${targetEn} / ${targetKn}`,
                recognized: recognizedText,
                validationMode: 'bilingual_object',
              };
            }
          }
        }
      }

      // 2. English variants check
      for (const enVar of enVariants) {
        const cleanEn = enVar.toLowerCase().trim();
        if (strippedInput === cleanEn || inputWords.includes(cleanEn) || strippedInput.includes(cleanEn)) {
          return {
            isCorrect: true,
            confidence: 0.98,
            reason: 'English word validated',
            detectedLanguage: 'English',
            spokenTarget: targetEn,
            expected: `${targetEn} / ${targetKn}`,
            recognized: recognizedText,
            validationMode: 'bilingual_object',
          };
        }
        const pkEn = getPhoneticKey(cleanEn);
        for (const w of inputWords) {
          const pkW = getPhoneticKey(w);
          if (pkW === pkEn) {
            return {
              isCorrect: true,
              confidence: 0.92,
              reason: 'Phonetic match validated',
              detectedLanguage: 'English',
              spokenTarget: targetEn,
              expected: `${targetEn} / ${targetKn}`,
              recognized: recognizedText,
              validationMode: 'bilingual_object',
            };
          }
          if (cleanEn.length >= 4 && pkW.length >= 3 && pkW[0] === pkEn[0] && calculateLevenshtein(pkW, pkEn) <= 1) {
            return {
              isCorrect: true,
              confidence: 0.88,
              reason: 'Close pronunciation match validated',
              detectedLanguage: 'English',
              spokenTarget: targetEn,
              expected: `${targetEn} / ${targetKn}`,
              recognized: recognizedText,
              validationMode: 'bilingual_object',
            };
          }
        }
      }

      // 3. Kannada transliterations check
      for (const trVar of translitVariants) {
        const cleanTr = trVar.toLowerCase().trim();
        if (strippedInput === cleanTr || inputWords.includes(cleanTr) || strippedInput.includes(cleanTr)) {
          return {
            isCorrect: true,
            confidence: 0.95,
            reason: 'Kannada transliteration validated',
            detectedLanguage: 'Kannada',
            spokenTarget: targetKn || cleanTr,
            expected: `${targetEn} / ${targetKn}`,
            recognized: recognizedText,
            validationMode: 'bilingual_object',
          };
        }
        const pkTr = getPhoneticKey(cleanTr);
        for (const w of inputWords) {
          const pkW = getPhoneticKey(w);
          if (pkW === pkTr) {
            return {
              isCorrect: true,
              confidence: 0.9,
              reason: 'Kannada transliteration phonetic match validated',
              detectedLanguage: 'Kannada',
              spokenTarget: targetKn || cleanTr,
              expected: `${targetEn} / ${targetKn}`,
              recognized: recognizedText,
              validationMode: 'bilingual_object',
            };
          }
          if (cleanTr.length >= 4 && pkW.length >= 3 && pkW[0] === pkTr[0] && calculateLevenshtein(pkW, pkTr) <= 1) {
            return {
              isCorrect: true,
              confidence: 0.85,
              reason: 'Kannada transliteration close pronunciation validated',
              detectedLanguage: 'Kannada',
              spokenTarget: targetKn || cleanTr,
              expected: `${targetEn} / ${targetKn}`,
              recognized: recognizedText,
              validationMode: 'bilingual_object',
            };
          }
          // Transliteration stem check (e.g. pustak -> pustaka / pusthak)
          if (cleanTr.length >= 6 && w.length >= 6 && w.startsWith(cleanTr.slice(0, 5))) {
            return {
              isCorrect: true,
              confidence: 0.88,
              reason: 'Kannada transliteration stem validated',
              detectedLanguage: 'Kannada',
              spokenTarget: targetKn || cleanTr,
              expected: `${targetEn} / ${targetKn}`,
              recognized: recognizedText,
              validationMode: 'bilingual_object',
            };
          }
        }
      }

      return {
        isCorrect: false,
        confidence: 0.1,
        reason: `Spoke "${recognizedText}" instead of expected "${targetEn} / ${targetKn}". Please try again!`,
        expected: `${targetEn} / ${targetKn}`,
        recognized: recognizedText,
        validationMode: 'bilingual_object',
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
