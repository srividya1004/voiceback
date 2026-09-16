import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  Square,
  Volume2,
  CheckCircle2,
  ArrowLeft,
  Settings,
  Radio,
  Globe,
  RefreshCw,
  Check,
  AlertTriangle,
  Sparkles,
  X
} from 'lucide-react';
import SettingsBottomSheet from './SettingsBottomSheet';
import { useSettings } from '../context/SettingsContext';
import voiceService from '../services/voiceService';
import deviceService from '../services/deviceService';
import contextService from '../services/contextService';

/**
 * Companion Speech NLP Analysis Engine
 * Analyzes speech transcript, detects language/script/transliteration,
 * classifies semantic intent, and maps to clean native Unicode questions.
 */
export const analyzeCompanionSpeechNLP = (rawText, currentLanguage = 'English') => {
  if (!rawText || !rawText.trim()) {
    return {
      normalizedQuestion: currentLanguage === 'Kannada' ? 'ನೀವು ಹೇಗಿದ್ದೀರಾ?' : currentLanguage === 'Hindi' ? 'आप कैसे हैं?' : 'How are you feeling?',
      effectiveLanguage: currentLanguage,
      detectedIntent: 'WELLBEING_QUESTION',
      intentLabel: currentLanguage === 'Kannada' ? 'ಆರೋಗ್ಯ ವಿಚಾರಣೆ (Wellbeing)' : currentLanguage === 'Hindi' ? 'हालचाल पूछना (Wellbeing)' : 'Wellbeing Check'
    };
  }

  const clean = rawText
    .replace(/\[(pause|silence|cough|sigh|snort|laughter|music|clearing|throat-clearing|applause|cheering|noise|static)\]/gi, '')
    .replace(/^\[.*\]$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  const lower = clean.toLowerCase();

  // 1. Script checks
  const hasKnScript = /[\u0C80-\u0CFF]/.test(clean);
  const hasHiScript = /[\u0900-\u097F]/.test(clean);

  // 2. Romanized Kannada patterns
  const isRomanKn = /\b(niru|neeru|neer|kudi|kudithira|kudithiya|beka|beku|oota|uuta|thindi|tindi|aitha|aayitha|madidira|madthira|nov|novu|novag|novide|hegidira|hegiddira|hegiddiya|chennagiddira|chennagidya|arogya|chaha|kafi|matre|maathre|tagond|thagond|malag|malagthira|nidre|nidde|mandya|yavaga|hogona|nodona|sahaya|madla|ittidira|ittiddira|sowchalaya|cinema|chalanachitra|pusthaka|odona)\b/i.test(lower);

  // 2b. Mixed Kannada-English patterns
  const isMixedKn = /(\b(ge|alli|inda|annu|kooda|madla|madodu|nododu|beka|aitha)\b|\bdoctor\s+ge\b|\bcall\s+madla\b|\bhelp\s+beka\b|\bwalk\s+ge\b|\bmatch\s+gedd\b)/i.test(lower);

  // 3. Romanized Hindi patterns
  const isRomanHi = /(pani|paani|peena|khana|khaana|khaya|dard|taklif|dawa|goli|kaise|kaisa|haal|sona|aaram|thaka|chay|chai|bahar)/i.test(lower);

  let effectiveLanguage = currentLanguage;
  if (hasKnScript || isRomanKn || isMixedKn) {
    effectiveLanguage = 'Kannada';
  } else if (hasHiScript || (isRomanHi && !hasKnScript)) {
    effectiveLanguage = 'Hindi';
  }

  let detectedIntent = 'CONVERSATION_CHECK';
  let intentLabel = 'General Conversation';
  let normalizedQuestion = clean;

  // Movie / Cinema Invitation
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film') || lower.includes('ಸಿನಿಮಾ') || lower.includes('ಚಿತ್ರ') || lower.includes('hogona') || lower.includes('nodona') || lower.includes('ಹೋಗೋಣ')) {
    detectedIntent = 'MOVIE_INVITATION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಸಿನಿಮಾ ಆಹ್ವಾನ (Movie Invitation)' : effectiveLanguage === 'Hindi' ? 'फिल्म आमंत्रण (Movie Invitation)' : 'Movie / Cinema Invitation';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ನಾವು ಸಿನಿಮಾ ನೋಡಲು ಹೋಗೋಣವೇ?';
  }
  // Assistance Offer
  else if (lower.includes('sahaya') || lower.includes('help') || lower.includes('ಸಹಾಯ') || lower.includes('madla')) {
    detectedIntent = 'ASSISTANCE_OFFER';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಸಹಾಯ ನೀಡಿಕೆ (Assistance Offer)' : effectiveLanguage === 'Hindi' ? 'मदद की पेशकश (Assistance Offer)' : 'Assistance Offer';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲಾ?';
  }
  // Reason / Concern
  else if (lower.includes('yake') || lower.includes('chintha') || lower.includes('chinte') || lower.includes('ಯಾಕೆ') || lower.includes('ಚಿಂತೆ') || lower.includes('why')) {
    detectedIntent = 'REASON_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಕಾರಣ ವಿಚಾರಣೆ (Reason Inquiry)' : effectiveLanguage === 'Hindi' ? 'कारण पूछताछ (Reason Inquiry)' : 'Reason Inquiry';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ಯಾಕೆ ಇಷ್ಟು ಚಿಂತೆ ಮಾಡ್ತಿದ್ದೀರಿ?';
  }
  // Water / Hydration check
  else if (lower.includes('water') || lower.includes('drink') || lower.includes('thirst') || lower.includes('ನೀರು') || lower.includes('ಕುಡಿ') || lower.includes('ದಾಹ') || lower.includes('niru') || lower.includes('neer') || lower.includes('pani') || lower.includes('प्यास') || lower.includes('peena')) {
    detectedIntent = 'WATER_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ನೀರಿನ ವಿಚಾರಣೆ (Water)' : effectiveLanguage === 'Hindi' ? 'पानी की आवश्यकता (Water)' : 'Hydration Check (Water)';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ನಿಮಗೆ ನೀರು ಬೇಕೇ?';
    if (isRomanHi && !hasHiScript) normalizedQuestion = 'क्या आपको पानी चाहिए?';
  }
  // Meal completion / status check (Did you eat? / ಊಟ ಆಯ್ತಾ?)
  else if (
    lower.includes('oota aitha') || lower.includes('oota madid') || lower.includes('uuta aitha') ||
    lower.includes('ಊಟ ಆಯ್ತಾ') || lower.includes('ಊಟ ಮಾಡಿದ್ರಾ') || lower.includes('did you eat') ||
    lower.includes('have you eaten') || lower.includes('had lunch') || lower.includes('had dinner') || lower.includes('खाना खाया')
  ) {
    detectedIntent = 'MEAL_STATUS_CHECK';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಊಟದ ವಿಚಾರಣೆ (Meal Status)' : effectiveLanguage === 'Hindi' ? 'भोजन की स्थिति (Meal Status)' : 'Meal Status Check';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ಊಟ ಆಯ್ತಾ?';
    if (isRomanHi && !hasHiScript) normalizedQuestion = 'क्या आपने खाना खा लिया?';
  }
  // General Meal / Food / Hungry
  else if (lower.includes('eat') || lower.includes('food') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('hungry') || lower.includes('ಊಟ') || lower.includes('ತಿಂಡಿ') || lower.includes('ಹಸಿವು') || lower.includes('oota') || lower.includes('thindi') || lower.includes('thinnabeku') || lower.includes('ಖಾನಾ') || lower.includes('खाना') || lower.includes('भूख')) {
    detectedIntent = 'MEAL_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಆಹಾರ ವಿಚಾರಣೆ (Food)' : effectiveLanguage === 'Hindi' ? 'भोजन आवश्यकता (Food)' : 'Food Request (Meal)';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ನಿಮಗೆ ಏನು ತಿನ್ನಬೇಕು?';
    if (isRomanHi && !hasHiScript) normalizedQuestion = 'क्या आपको खाना चाहिए?';
  }
  // Medicine check
  else if (lower.includes('matre') || lower.includes('tablet') || lower.includes('medicine') || lower.includes('pill') || lower.includes('ಮಾತ್ರೆ') || lower.includes('ಔಷಧಿ') || lower.includes('दवा') || lower.includes('गोली')) {
    detectedIntent = 'MEDICINE_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಔಷಧಿ ವಿಚಾರಣೆ (Medicine)' : effectiveLanguage === 'Hindi' ? 'दवा की स्थिति (Medicine)' : 'Medicine Schedule';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿರಾ?';
    if (isRomanHi && !hasHiScript) normalizedQuestion = 'क्या आपने दवा ली?';
  }
  // Pain check
  else if (lower.includes('pain') || lower.includes('hurt') || lower.includes('ache') || lower.includes('sore') || lower.includes('ನೋವು') || lower.includes('ನೋವಾಗ್ತಿದೆ') || lower.includes('nov') || lower.includes('dard') || lower.includes('दर्द')) {
    detectedIntent = 'PAIN_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ನೋವಿನ ವಿಚಾರಣೆ (Pain Check)' : effectiveLanguage === 'Hindi' ? 'दर्द की जांच (Pain Check)' : 'Pain Assessment';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ನಿಮಗೆ ಎಲ್ಲಾದರೂ ನೋವಾಗುತ್ತಿದೆಯೇ?';
    if (isRomanHi && !hasHiScript) normalizedQuestion = 'क्या आपको कहीं दर्द हो रहा है?';
  }
  // Sleep / Rest check
  else if (lower.includes('sleep') || lower.includes('rest') || lower.includes('tired') || lower.includes('bed') || lower.includes('ಮಲಗ್') || lower.includes('ನಿದ್ರೆ') || lower.includes('malag') || lower.includes('nidre') || lower.includes('सोना') || lower.includes('आराम')) {
    detectedIntent = 'REST_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ವಿಶ್ರಾಂತಿ ವಿಚಾರಣೆ (Rest)' : effectiveLanguage === 'Hindi' ? 'आराम की आवश्यकता (Rest)' : 'Rest & Sleep Check';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಬಯಸುತ್ತೀರಾ?';
    if (isRomanHi && !hasHiScript) normalizedQuestion = 'क्या आप आराम करना चाहते हैं?';
  }
  // Tea / Coffee / Beverage
  else if (lower.includes('tea') || lower.includes('coffee') || lower.includes('chai') || lower.includes('chaha') || lower.includes('kafi') || lower.includes('ಚಹಾ') || lower.includes('ಕಾಫಿ') || lower.includes('चाय')) {
    detectedIntent = 'BEVERAGE_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಚಹಾ/ಕಾಫಿ (Tea & Coffee)' : effectiveLanguage === 'Hindi' ? 'चाय/कॉफ़ी (Beverage)' : 'Beverage Check';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ಚಹಾ ಬೇಕಾ ಅಥವಾ ಕಾಫಿ ಬೇಕಾ?';
    if (isRomanHi && !hasHiScript) normalizedQuestion = 'क्या आप चाय या कॉफ़ी लेंगे?';
  }
  // Travel / Destination (Mandya)
  else if (lower.includes('mandya') || lower.includes('travel') || lower.includes('yavaga') || lower.includes('ಮಂಡ್ಯ') || lower.includes('ಯಾವಾಗ') || lower.includes('ಪ್ರಯಾಣ')) {
    detectedIntent = 'TRAVEL_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಪ್ರಯಾಣ ವಿಚಾರಣೆ (Travel)' : effectiveLanguage === 'Hindi' ? 'यात्रा की जानकारी (Travel)' : 'Travel Inquiries';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ಮಂಡ್ಯಗೆ ಯಾವಾಗ ಹೋಗೋಣ?';
    if (isRomanHi && !hasHiScript) normalizedQuestion = 'मंड्या कब चलेंगे?';
  }
  // Washroom / Toilet
  else if (lower.includes('toilet') || lower.includes('bathroom') || lower.includes('washroom') || lower.includes('ಶೌಚಾಲಯ') || lower.includes('शौचालय')) {
    detectedIntent = 'WASHROOM_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಶೌಚಾಲಯ (Washroom)' : effectiveLanguage === 'Hindi' ? 'शौचालय (Washroom)' : 'Washroom Need';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ವಾಶ್‌ರೂಮ್‌ಗೆ ಹೋಗಬೇಕೇ?';
  }
  // Wellbeing / How are you
  else if (lower.includes('how are you') || lower.includes('hegidira') || lower.includes('hegiddira') || lower.includes('hegiddiya') || lower.includes('chennagiddira') || lower.includes('chennagidya') || lower.includes('heganistide') || lower.includes('ಹೇಗಿದ್ದೀರಾ') || lower.includes('ಚೆನ್ನಾಗಿದ್ದೀರಾ') || lower.includes('ಹೇಗನಿಸುತ್ತಿದೆ') || lower.includes('कैसे')) {
    detectedIntent = 'WELLBEING_QUESTION';
    intentLabel = effectiveLanguage === 'Kannada' ? 'ಆರೋಗ್ಯ ವಿಚಾರಣೆ (Wellbeing)' : effectiveLanguage === 'Hindi' ? 'हालचाल पूछना (Wellbeing)' : 'General Wellbeing';
    if (isRomanKn && !hasKnScript && !isMixedKn) normalizedQuestion = 'ನಿಮಗೆ ಈಗ ಹೇಗನಿಸುತ್ತಿದೆ?';
  }

  return {
    normalizedQuestion,
    effectiveLanguage,
    detectedIntent,
    intentLabel
  };
};

/**
 * Lightweight Deterministic Dynamic Question Classifier & Response Generator
 */
export const generateDynamicResponses = (questionText, language = 'English') => {
  const q = (questionText || '').toLowerCase().trim();

  // 0a. Specific What to Drink / WH-Drink Questions (What do you want to drink? / ಏನು ಕುಡಿಯಬೇಕು?)
  if (
    q.includes('what do you want to drink') || q.includes('what to drink') || q.includes('which drink') ||
    q.includes('what drink') || q.includes('want to drink') || q.includes('like to drink') ||
    q.includes('en kudi') || q.includes('enu kudi') || q.includes('en kudibeku') || q.includes('enu kudibeku') ||
    q.includes('ಏನು ಕುಡಿ') || q.includes('ಏನ್ ಕುಡಿ') || q.includes('ಏನು ಕುಡಿಯಬೇಕು') || q.includes('ಏನ್ ಕುಡಿಯಬೇಕು') ||
    q.includes('ಏನ್ ಬೇಕು ಕುಡಿಯೋಕೆ') || q.includes('ಏನು ಬೇಕು ಕುಡಿಯಲು') || q.includes('क्या पीना') || q.includes('क्या पियोगे')
  ) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ನೀರು ಬೇಕು', 'ನನಗೆ ಬಿಸಿ ಚಹಾ ಅಥವಾ ಕಾಫಿ ಬೇಕು', 'ನನಗೆ ಎಳೆನೀರು ಅಥವಾ ಹಾಲು ಬೇಕು', 'ಈಗ ಏನೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು'];
    } else if (language === 'Hindi') {
      return ['मुझे पानी चाहिए', 'मुझे गरम चाय या कॉफ़ी चाहिए', 'मुझे दूध या जूस चाहिए', 'अभी कुछ नहीं चाहिए'];
    }
    return ['I want water', 'I want hot tea or coffee', 'I want juice or warm milk', 'Nothing right now, thank you'];
  }

  // 0b. Pain / Discomfort / Hurt (Are you feeling any pain? / Does it hurt? / ನೋವಾಗ್ತಿದೆಯಾ?)
  if (
    q.includes('pain') || q.includes('hurt') || q.includes('ache') || q.includes('sore') ||
    q.includes('ouch') || q.includes('sick') || q.includes('ನೋವು') || q.includes('ನೋವ') ||
    q.includes('ನೋವಾಗ್ತಿದೆ') || q.includes('ನೋವಾಗುತ್ತಿದೆಯಾ') || q.includes('nov') ||
    q.includes('novag') || q.includes('novide') || q.includes('दर्द') || q.includes('तकलीफ़')
  ) {
    if (language === 'Kannada') {
      return ['ಇಲ್ಲ, ನನಗೆ ಯಾವುದೇ ನೋವಿಲ್ಲ', 'ಹೌದು, ಸ್ವಲ್ಪ ನೋವಾಗುತ್ತಿದೆ', 'ತುಂಬಾ ನೋವಾಗುತ್ತಿದೆ, ಸಹಾಯ ಮಾಡಿ', 'ನನಗೆ ನೋವಿನ ಔಷಧಿ ಕೊಡಿ'];
    } else if (language === 'Hindi') {
      return ['नहीं, मुझे कोई दर्द नहीं है', 'हाँ, थोड़ा दर्द हो रहा है', 'बहुत दर्द हो रहा है, मदद करो', 'मुझे दर्द की दवा दे दो'];
    }
    return ['No, I am not in pain', 'Yes, I have mild pain', 'Yes, severe pain, please help', 'Please give me pain medicine'];
  }

  // 0b2. General Binary Choice ("Do you want X or Y?" / "X ಅಥವಾ Y?")
  if (q.includes(' or ') || q.includes(' ಅಥವಾ ') || q.includes(' या ')) {
    const parts = q.includes(' ಅಥವಾ ')
      ? q.split(' ಅಥವಾ ')
      : q.includes(' या ')
      ? q.split(' या ')
      : q.split(' or ');

    if (parts.length >= 2) {
      let optA = parts[0].replace(/[?,.!]/g, '').trim().replace(/^(do you want|would you like|do you prefer|shall we have|shall we go to|is it|did you want)\s+/i, '').trim();
      let optB = parts[1].replace(/[?,.!]/g, '').trim();

      if (language === 'Kannada' || /[\u0C80-\u0CFF]/.test(q)) {
        optA = optA.replace(/^(ನಿಮಗೆ|ನೀವು|ದಯವಿಟ್ಟು|ನಿನಗೆ|ನಾವು)\s+/gu, '').replace(/(ಬೇಕಾ|ಇಷ್ಟಾನಾ|ತಗೋತೀರಾ|ಕುಡಿತೀರಾ|ತಿಂತೀರಾ|ಬೇಕೇ)$/gu, '').trim();
        optB = optB.replace(/^(ನಿಮಗೆ|ನೀವು|ದಯವಿಟ್ಟು|ನಿನಗೆ|ನಾವು)\s+/gu, '').replace(/(ಬೇಕಾ|ಇಷ್ಟಾನಾ|ತಗೋತೀರಾ|ಕುಡಿತೀರಾ|ತಿಂತೀರಾ|ಬೇಕೇ)$/gu, '').trim();
        if (optA.length > 0 && optA.length < 35 && optB.length > 0 && optB.length < 35) {
          return [`ನನಗೆ ${optA} ಬೇಕು.`, `ನನಗೆ ${optB} ಬೇಕು.`, 'ಎರಡೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು.', 'ಬೇರೆ ಏನಾದರೂ ಕುಡಿಯಲು ಸಿಗುತ್ತದೆಯಾ?'];
        }
      }

      if (optA.length > 0 && optA.length < 35 && optB.length > 0 && optB.length < 35) {
        if (language === 'Kannada') {
          return [`ನನಗೆ ${optA} ಬೇಕು.`, `ನನಗೆ ${optB} ಬೇಕು.`, 'ಎರಡೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು.', 'ಬೇರೆ ಏನಾದರೂ ಕುಡಿಯಲು ಸಿಗುತ್ತದೆಯಾ?'];
        } else if (language === 'Hindi') {
          return [`मुझे ${optA} पसंद है।`, `मुझे ${optB} पसंद है।`, 'कोई भी चलेगा।', 'दोनों में से कुछ नहीं, शुक्रिया।'];
        }
        return [`I would like ${optA}, please.`, `I'll have ${optB}.`, 'Either is fine with me.', 'Neither right now, thank you.'];
      }
    }
  }

  // 0b3. General Assistance / Caregiver Offer ("Can I help you with...", "Do you want me to...")
  if (
    /^(can i help you|do you want me to|shall i|may i help|can i get you|would you like me to|need me to)\b/i.test(q) ||
    q.includes('ಸಹಾಯ ಮಾಡಬೇಕಾ') || q.includes('ತರಲಾ') || q.includes('ತಂದುಕೊಡಲಾ') ||
    q.includes('ಸಹಾಯ ಮಾಡಲಾ') || q.includes('ಸಹಾಯ ಬೇಕಾ') || q.includes('help beka') || q.includes('madla') ||
    q.includes('ಮದತ್') || q.includes('मदद करूँ') || q.includes('ला दूँ')
  ) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ.', 'ತುಂಬಾ ಧನ್ಯವಾದಗಳು, ಹಾಗೇ ಮಾಡಿ.', 'ಇಲ್ಲ ಪರವಾಗಿಲ್ಲ, ನಾನೇ ಮಾಡಿಕೊಳ್ಳುತ್ತೇನೆ.', 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ, ಧನ್ಯವಾದಗಳು.'];
    } else if (language === 'Hindi') {
      return ['हाँ, कृपया मदद करें।', 'बहुत धन्यवाद, ऐसा ही करें।', 'नहीं शुक्रिया, मैं खुद कर लूँगा।', 'थोड़ी देर बाद, धन्यवाद।'];
    }
    return ["Yes please, that would be helpful.", "Thank you, I'd appreciate that.", "No thank you, I can manage.", "Maybe in a little while, thanks."];
  }

  // 0b4. General Activity / Outing Invitation ("Shall we read...", "Let's play...", "Why don't we sit...")
  if (
    /^(shall we|why don't we|come and|how about we)\b/i.test(q) ||
    q.includes('ಮಾಡೋಣ್ವಾ') || q.includes('ನೋಡೋಣ್ವಾ') || q.includes('ಕೇಳೋಣ್ವಾ') ||
    q.includes('ಮಾಡೋಣವೇ') || q.includes('ಹೋಗೋಣವೇ') || q.includes('ಓದೋಣವೇ') ||
    /ೋಣ(ವೇ|ವಾ|ಣ್ವಾ)?/.test(q) ||
    q.includes('ಮಾಡೋಣ') || q.includes('ಚಲೋ') || q.includes('करें क्या')
  ) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಖಂಡಿತ ಮಾಡೋಣ!', 'ಖಂಡಿತ, ನನಗೂ ತುಂಬಾ ಇಷ್ಟ.', 'ಇಲ್ಲ, ಈಗ ನನಗೆ ಸ್ವಲ್ಪ ಸುಸ್ತಾಗಿದೆ.', 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮಾಡೋಣ.', 'ಎಷ್ಟು ಹೊತ್ತಿಗೆ?'];
    } else if (language === 'Hindi') {
      return ['हाँ, ज़रूर करते हैं!', 'ज़रूर, मुझे बहुत खुशी होगी।', 'नहीं शुक्रिया, मैं थोड़ा आराम करूँगा।', 'थोड़ी देर बाद करते हैं।', 'किस समय?'];
    }
    return ["Yes, I would love to!", "Sure, that sounds wonderful.", "No thank you, I prefer to rest today.", "Maybe a little later.", "What time are you thinking?"];
  }

  // 0b5. Reason Questions ("Why are you looking worried?", "Why did you...")
  if (/^(why|how come)\b/i.test(q) || q.includes('ಯಾಕೆ') || q.includes('ಏಕೆ') || q.includes('ಕ್ಯೂಂ') || q.includes('क्यों') || q.includes('ಚಿಂತೆ') || q.includes('yake')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಸ್ವಲ್ಪ ಆಯಾಸವಾಗಿದೆ, ಅಷ್ಟೇ.', 'ಏನೂ ಇಲ್ಲ, ನಾನು ಆರಾಮಾಗಿದ್ದೇನೆ.', 'ನಾನು ಏನೋ ಯೋಚನೆ ಮಾಡುತ್ತಿದ್ದೆ.', 'ಸ್ವಲ್ಪ ಮಾತು ಸರಿಯಾಗಿ ಬರುತ್ತಿಲ್ಲ.'];
    } else if (language === 'Hindi') {
      return ['बस थोड़ी थकान महसूस हो रही है।', 'कुछ नहीं, मैं बिल्कुल ठीक हूँ।', 'मैं बस कुछ सोच रहा था।', 'शब्द ढूँढने में थोड़ी परेशानी हो रही है।'];
    }
    return ["I'm just feeling a bit tired today.", "Nothing is wrong, I am doing fine.", "I was just thinking about something.", "Just struggling a little to find words."];
  }

  // 0c. Food / Snack Preference Inquiry ("What would you like to eat?")
  if (
    q.includes('what would you like to eat') || q.includes('what do you want to eat') ||
    q.includes('want snacks') || q.includes('want some snacks') || q.includes('some snacks') ||
    q.includes('chips') || q.includes('popcorn') || q.includes('thindi beku') || q.includes('en thindi beku') ||
    q.includes('enu thindi') || q.includes('ಏನು ತಿಂಡಿ ಬೇಕು') || q.includes('ಏನ್ ತಿಂಡಿ') || q.includes('ಸ್ನ್ಯಾಕ್ಸ್') ||
    q.includes('ಏನು ತಿನ್ನಬೇಕು') || q.includes('ಏನ್ ತಿನ್ನಬೇಕು') || q.includes('enu thinnabeku') || q.includes('thinnabeku') ||
    q.includes('ತಿನ್ನಲು ಏನು ಬೇಕು') || q.includes('क्या खाना चाहते') || q.includes('क्या खाओगे') || q.includes('कुछ स्नैक्स')
  ) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಸ್ವಲ್ಪ ತಿಂಡಿ ಬೇಕು.', 'ನನಗೆ ಚಿಪ್ಸ್ ಬೇಕು.', 'ನನಗೆ ಸಿಹಿ ತಿಂಡಿ ಬೇಕು.', 'ನನಗೆ ಸ್ವಲ್ಪ ಹಣ್ಣು ಬೇಕು.', 'ಈಗ ಏನೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು.'];
    } else if (language === 'Hindi') {
      return ['मुझे कुछ स्नैक्स चाहिए।', 'क्या मुझे चिप्स मिल सकते हैं?', 'मुझे पॉपकॉर्न चाहिए।', 'मुझे कुछ मीठा खाना है।', 'अभी कुछ नहीं चाहिए, धन्यवाद।'];
    }
    return ["I'd like some snacks.", "Can I have chips?", "I want popcorn.", "I'd prefer something sweet.", "Nothing right now, thank you."];
  }

  // 0d. Feeling Better / Health Recovery ("Are you feeling better today?")
  if (
    q.includes('feeling better') || q.includes('feel better') || q.includes('feeling any better') ||
    q.includes('are you better') || q.includes('swalpa aram aitha') || q.includes('swalpa aram aagidya') || q.includes('aram aagidya') ||
    q.includes('ಹೇಗನಿಸುತ್ತಿದೆ') || q.includes('heganistide') || q.includes('hegiddira') || q.includes('ಹೇಗಿದ್ದೀರಾ') ||
    q.includes('ಸ್ವಲ್ಪ ಆರಾಮಾಗಿದೆಯಾ') || q.includes('ಆರಾಮಾಗಿದೆಯಾ') || q.includes('ಉಷಾರಾಗಿದ್ದೀರಾ') || q.includes('ಚೇತರಿಸಿಕೊಂಡಿದ್ದೀರಾ') ||
    q.includes('पहले से बेहतर') || q.includes('तबीयत ठीक है') || q.includes('अच्छा लग रहा है')
  ) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಈಗ ಚೆನ್ನಾಗಿದೆ.', 'ಸ್ವಲ್ಪ ಸುಧಾರಣೆಯಾಗಿದೆ.', 'ನನಗೆ ಇನ್ನೂ ಸ್ವಲ್ಪ ಅಸ್ವಸ್ಥವಾಗಿದೆ.', 'ನನಗೆ ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ಬೇಕು.'];
    } else if (language === 'Hindi') {
      return ['हाँ, मैं पहले से बेहतर महसूस कर रहा हूँ।', 'थोड़ा बेहतर लग रहा है।', 'नहीं, अभी भी तबियत ठीक नहीं है।', 'मुझे आराम की ज़रूरत है।'];
    }
    return ["Yes, I'm feeling better.", "A little better.", "No, I still don't feel well.", "I need some rest."];
  }

  // 1. Water / Hydration / Drink / Thirst (Yes/No Questions)
  if (
    q.includes('water') || q.includes('drink') || q.includes('thirst') || q.includes('hydrat') ||
    q.includes('ನೀರು') || q.includes('ಕುಡಿ') || q.includes('ದಾಹ') ||
    q.includes('neer') || q.includes('neeru') || q.includes('niru') || q.includes('kudi') ||
    q.includes('pani') || q.includes('paani') || q.includes('प्यास') || q.includes('पीना')
  ) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಸ್ವಲ್ಪ ನೀರು ಕೊಡಿ', 'ಇಲ್ಲ, ಈಗ ನನಗೆ ದಾಹವಿಲ್ಲ', 'ಸ್ವಲ್ಪ ಬಿಸಿ ನೀರು ಕೊಡ್ತೀರಾ?', 'ನನಗೆ ಚಹಾ ಅಥವಾ ಕಾಫಿ ಬೇಕು'];
    } else if (language === 'Hindi') {
      return ['हाँ, थोड़ा पानी देना!', 'नहीं, अभी मुझे प्यास नहीं लगी है', 'थोड़ा गुनगुना पानी दे दो', 'मुझे चाय या कॉफ़ी चाहिए'];
    }
    return ['Yeah, water please!', "No, I am not thirsty right now", 'Could I get some warm water?', 'I would prefer tea or coffee'];
  }

  // 1b. Meal Completion / Status Check (Did you eat? / ಊಟ ಆಯ್ತಾ? / oota aitha? / khana khaya?)
  if (
    q.includes('oota aitha') || q.includes('oota aayitha') || q.includes('uuta aitha') ||
    q.includes('oota madid') || q.includes('oota maadid') || q.includes('uuta madid') ||
    q.includes('ಊಟ ಆಯ್ತಾ') || q.includes('ಊಟ ಮಾಡಿದ್ರಾ') || q.includes('ಊಟ ಮಾಡಿದ್ದೀರಾ') ||
    q.includes('ತಿಂಡಿ ಆಯ್ತಾ') || q.includes('did you eat') || q.includes('have you eaten') ||
    q.includes('had lunch') || q.includes('had dinner') || q.includes('had food') ||
    q.includes('खाना खाया') || q.includes('खाना खा लिया')
  ) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ನಾನು ಊಟ ಮಾಡಿದ್ದೇನೆ', 'ಇಲ್ಲ, ಇನ್ನೂ ಊಟ ಮಾಡಿಲ್ಲ', 'ಸ್ವಲ್ಪ ಹಸಿವಾಗಿದೆ, ಊಟ ಕೊಡಿ', 'ಇಲ್ಲ, ಈಗ ಹಸಿವಿಲ್ಲ'];
    } else if (language === 'Hindi') {
      return ['हाँ, मैंने खाना खा लिया', 'नहीं, अभी नहीं खाया', 'थोड़ी भूख लगी है, खाना दे दो', 'अभी भूख नहीं है'];
    }
    return ['Yes, I have eaten', "No, I haven't eaten yet", "I'm hungry, please give me food", "I'm not hungry right now"];
  }

  // 1c. Medicine Status Check (Did you take medicine? / ಮಾತ್ರೆ ತಗೊಂಡ್ರಾ? / matre thagondra? / dawa li?)
  if (
    q.includes('matre tagond') || q.includes('matre thagond') || q.includes('tablet tagond') || q.includes('tablet thagond') ||
    q.includes('ಮಾತ್ರೆ ತಗೊಂಡ್ರಾ') || q.includes('ಔಷಧಿ ತಗೊಂಡ್ರಾ') || q.includes('ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡ್ರಾ') ||
    q.includes('took medicine') || q.includes('take your medicine') || q.includes('take your pill') ||
    q.includes('taken your medicine') || q.includes('taken medicine') || q.includes('dawa li') || q.includes('दवा ली')
  ) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ನಾನು ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ', 'ಇಲ್ಲ, ಇನ್ನೂ ತೆಗೆದುಕೊಂಡಿಲ್ಲ', 'ದಯವಿಟ್ಟು ನನಗೆ ಮಾತ್ರೆ ಕೊಡಿ', 'ನನಗೆ ನೆನಪಿಲ್ಲ'];
    } else if (language === 'Hindi') {
      return ['हाँ, मैंने दवा ले ली है', 'नहीं, अभी नहीं ली', 'कृपया मुझे दवा दे दो', 'मुझे याद नहीं है'];
    }
    return ['Yes, I took my medicine', "No, I haven't taken it yet", 'Please give me my medicine', "I don't remember"];
  }

  // 2. Comfort / Uncomfortable / Temperature / Position
  if (q.includes('comfort') || q.includes('uncomfort') || q.includes('hot') || q.includes('cold') || q.includes('warm') || q.includes('position') || q.includes('ಆರಾಮ') || q.includes('ಅಸೌಕರ್ಯ') || q.includes('ಚಳಿ') || q.includes('ಬಿಸಿ') || q.includes('aram') || q.includes('asoukarya') || q.includes('chali') || q.includes('bisi') || q.includes('आराम') || q.includes('असहज') || q.includes('गर्मी') || q.includes('ठंड')) {
    if (language === 'Kannada') {
      return ['ಸ್ವಲ್ಪ ಅಸೌಕರ್ಯವಾಗಿದೆ, ಸರಿ ಮಾಡಿ', 'ನನಗೆ ಸಖತ್ ಆರಾಮಾಗಿದೆ!', 'ಸ್ವಲ್ಪ ಚಳಿ ಆಗ್ತಿದೆ'];
    } else if (language === 'Hindi') {
      return ['थोड़ा असहज लग रहा है, सही कर दो', 'सब एकदम बढ़िया है!', 'मुझे थोड़ी ठंड लग रही है'];
    }
    return ['Feeling uncomfortable, please adjust me', "Yeah, I'm super comfortable!", 'Feeling a bit chilly/warm'];
  }

  // 3. Needs Help / Assistance / Emergency
  if (q.includes('help') || q.includes('assist') || q.includes('urgent') || q.includes('emergency') || q.includes('ಸಹಾಯ') || q.includes('sahaya') || q.includes('help beku') || q.includes('ಮದತ್') || q.includes('मदद') || q.includes('सहायता')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ತಕ್ಷಣ ಸಹಾಯ ಬೇಕು', 'ದಯವಿಟ್ಟು ಇಲ್ಲಿ ಬನ್ನಿ', 'ಸ್ವಲ್ಪ ಹೆಲ್ಪ್ ಮಾಡಿ ಪ್ಲೀಸ್'];
    } else if (language === 'Hindi') {
      return ['मुझे तुरंत मदद चाहिए', 'कृपया यहाँ आइए', 'थोड़ी सहायता करें'];
    }
    return ['I need help please', 'Could you come here right away?', 'Please help me'];
  }

  // 4. Wants Caregiver / Nurse / Attendant
  if (q.includes('caregiver') || q.includes('care taker') || q.includes('nurse') || q.includes('attendant') || q.includes('ನರ್ಸ್') || q.includes('ಕೇರ್‌ಗಿವರ್') || q.includes('ಪಾಲಕರು') || q.includes('ಆಯಮ್ಮ') || /(^|\s)ಆಯಾ(\s|[.,!?]|$)/.test(q) || q.includes('केयरगिवर') || q.includes('नर्स')) {
    if (language === 'Kannada') {
      return ['ಕೇರ್‌ಗಿವರ್ ಅವರನ್ನು ಕರೆಯಿರಿ', 'ನರ್ಸ್ ಬೇಕು ಪ್ಲೀಸ್', 'ನನಗೆ ಅವರ ಸಹಾಯ ಬೇಕು'];
    } else if (language === 'Hindi') {
      return ['केयरगिवर को बुलाओ', 'नर्स चाहिए प्लीज', 'मुझे उनकी मदद चाहिए'];
    }
    return ['Please call the caregiver', 'I need the nurse please', 'Could the caregiver come here?'];
  }

  // 5. Medicine / Pills / Doctor
  if (q.includes('medici') || q.includes('pill') || q.includes('tablet') || q.includes('dose') || q.includes('doct') || q.includes('ಮಾತ್ರೆ') || q.includes('ಔಷಧಿ') || q.includes('ಔಷಧ') || q.includes('ವೈದ್ಯ') || q.includes('matre') || q.includes('ausadhi') || q.includes('दवा') || q.includes('डॉक्टर') || q.includes('गोली')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಮಾತ್ರೆ/ಔಷಧಿ ಕೊಡಿ', 'ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಯಿತೇ?', 'ಡಾಕ್ಟರ್‌ಗೆ ಫೋನ್ ಮಾಡ್ತೀರಾ?'];
    } else if (language === 'Hindi') {
      return ['दवा दे दो प्लीज', 'दवा लेने का समय हो गया क्या?', 'डॉक्टर को फोन लगा दो'];
    }
    return ['Please give me my medicine', 'Is it time for my pills?', 'Could you call the doc?'];
  }

  // 7a. Specific What Food / WH-Food Questions (What food do you want? / ഏನ್ ಊಟ ಬೇಕು?)
  if (q.includes('what food') || q.includes('what to eat') || q.includes('which food') || q.includes('en uuta') || q.includes('en oota') || q.includes('enu uuta') || q.includes('enu thindi') || q.includes('ಏನ್ ಊಟ') || q.includes('ಏನು ಊಟ') || q.includes('ಏನು ತಿಂಡಿ') || q.includes('ಏನ್ ಬೇಕು')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ದೋಸೆ ಅಥವಾ ಇಡ್ಲಿ ಬೇಕು', 'ನನಗೆ ಬಿಸಿ ಬಿಸಿ ಅನ್ನ ಮತ್ತು ಸಾರು ಬೇಕು', 'ನನಗೆ ಚಪಾತಿ ಬೇಕು', 'ಸ್ವಲ್ಪ ಲಘು ಆಹಾರ ಅಥವಾ ಹಣ್ಣು ಕೊಡಿ'];
    }
    return ['I want dosa or idli, please', 'I want hot rice and sambar', 'I want chapati and curry', 'Just light snacks or fruit'];
  }

  // 7b. Food / Eat / Hungry / Meal / Wants Food
  if (q.includes('eat') || q.includes('food') || q.includes('hungr') || q.includes('lunch') || q.includes('dinner') || q.includes('meal') || q.includes('ಊಟ') || q.includes('ಹಸಿವು') || q.includes('ಹಸಿತಿದೆ') || q.includes('ಆಹಾರ') || q.includes('oota') || q.includes('uuta') || q.includes('uda') || q.includes('thindi') || q.includes('hasi') || q.includes('tin') || q.includes('खाना') || q.includes('भूख')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ನನಗೆ ಊಟ ಬೇಕು!', 'ತುಂಬಾ ಹಸಿತಿದೆ, ಊಟ ಕೊಡ್ತೀರಾ?', 'ಸ್ವಲ್ಪ ಸ್ನ್ಯಾಕ್ಸ್ ಅಥವಾ ಹಣ್ಣು ಕೊಡಿ'];
    } else if (language === 'Hindi') {
      return ['हाँ, मुझे खाना चाहिए!', 'बहुत भूख लगी है', 'थोड़ा स्नैक्स या फल दे दो'];
    }
    return ['Yes, I want food please!', "I am very hungry, could I have a meal?", 'Just a small snack or fruit, thanks!'];
  }

  // 8. Wants Family / Relatives (Son, Daughter, Spouse, Parents)
  if (q.includes('family') || q.includes('relative') || q.includes('maga') || q.includes('magalu') || q.includes('hendthi') || q.includes('ganda') || q.includes('amma') || q.includes('appa') || q.includes('son') || q.includes('daughter') || q.includes('wife') || q.includes('husband') || q.includes('mother') || q.includes('father') || q.includes('ಕುಟುಂಬ') || q.includes('ಮಗ') || q.includes('ಮಗಳು') || q.includes('ಗಂಡ') || q.includes('ಹೆಂಡತಿ') || q.includes('ತಾಯಿ') || q.includes('ತಂದೆ') || q.includes('परिवार')) {
    if (language === 'Kannada') {
      return ['ನನ್ನ ಕುಟುಂಬದವರೊಂದಿಗೆ ಮಾತನಾಡಬೇಕು', 'ಅವರಿಗೆ ಫೋನ್ ಮಾಡ್ತೀರಾ?', 'ಅವರು ಯಾವಾಗ ಬರ್ತಾರೆ?'];
    } else if (language === 'Hindi') {
      return ['मुझे परिवार से बात करनी है', 'उन्हें फोन लगा दो', 'वे कब आ रहे हैं?'];
    }
    return ['I want to talk to my family', 'Could you call them for me?', 'When are they visiting?'];
  }

  // 9. Toilet / Bathroom / Washroom
  if (q.includes('toilet') || q.includes('bathroom') || q.includes('washroom') || q.includes('ಶೌಚಾಲಯ') || q.includes('ಶೌಚ') || q.includes('washroom') || q.includes('शौचालय') || q.includes('बाथरूम')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ವಾಶ್‌ರೂಮ್‌ಗೆ ಹೋಗಬೇಕು', 'ಇಲ್ಲ, ಈಗ ಬೇಡ', 'ಸ್ವಲ್ಪ ಹೆಲ್ಪ್ ಮಾಡಿ'];
    } else if (language === 'Hindi') {
      return ['मुझे वॉशरूम जाना है', 'नहीं, अभी नहीं', 'थोड़ी मदद कर दो'];
    }
    return ['I need to use the washroom', 'Nope, not right now', 'Could you help me walk there?'];
  }

  // 10. Rest / Sleep / Bed / Tired
  if (q.includes('rest') || q.includes('sleep') || q.includes('bed') || q.includes('tir') || q.includes('exhaust') || q.includes('ವಿಶ್ರಾಂತಿ') || q.includes('ನಿದ್ರೆ') || q.includes('ಹಾಸಿಗೆ') || q.includes('ಆಯಾಸ') || q.includes('ಸುಸ್ತು') || q.includes('visranthi') || q.includes('nidre') || q.includes('malag') || q.includes('ayasa') || q.includes('susthu') || q.includes('सोना') || q.includes('आराम') || q.includes('थका')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಸ್ವಲ್ಪ ಮಲಗ್ತೀನಿ', 'ನಾನು ಫುಲ್ ಆರಾಮ್!', 'ಹಾಸಿಗೆ ಸ್ವಲ್ಪ ಸರಿ ಮಾಡಿ'];
    } else if (language === 'Hindi') {
      return ['हाँ, थोड़ा लेटना चाहता हूँ', 'मैं एकदम फर्स्ट क्लास हूँ!', 'बिस्तर ठीक कर दो'];
    }
    return ["Yeah, gonna lie down for a bit", "Nah, I'm full of energy!", 'Could you fluff my pillow?'];
  }

  // 7. Time / Clock
  if (q.includes('time') || q.includes('clock') || q.includes('hour') || q.includes('ಸಮಯ') || q.includes('ಗಂಟೆ') || q.includes('samaya') || q.includes('gante') || q.includes('समय')) {
    if (language === 'Kannada') {
      return ['ಸಮಯ ಎಷ್ಟಾಯಿತು?', 'ಇನ್ನೂ ಸಮಯವಿದೆ', 'ನನಗೆ ಗೊತ್ತಿಲ್ಲ'];
    } else if (language === 'Hindi') {
      return ['कितने बजे हैं?', 'अभी समय है', 'मुझे नहीं पता'];
    }
    return ['What time is it?', 'Is it afternoon already?', 'I am not sure'];
  }

  // 7b. Movie / Outing / Cinema Invitation ("Hi, let's go to see the movie.")
  if (
    q.includes('movie') || q.includes('cinema') || q.includes('theater') || q.includes('theatre') ||
    q.includes('film') || q.includes("let's go to see the movie") || q.includes("let's go to the movie") ||
    q.includes("let's go") || q.includes('shall we go') || q.includes('see the movie') ||
    q.includes('chalanachitra') || q.includes('hogona') || q.includes('nodona') ||
    q.includes('ಸಿನಿಮಾ') || q.includes('ಚಿತ್ರಮಂದಿರ') || q.includes('ಮೂವಿ') || q.includes('ಹೋಗೋಣ') ||
    q.includes('फ़िल्म') || q.includes('सिनेमा') || q.includes('मूवी') || q.includes('चलते हैं')
  ) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಹೋಗೋಣ!', 'ಖಂಡಿತ, ನನಗೂ ಇಷ್ಟ.', 'ಇಲ್ಲ, ನನಗೆ ಆಸಕ್ತಿ ಇಲ್ಲ.', 'ಇನ್ನೊಂದು ದಿನ ಹೋಗೋಣ.', 'ಯಾವ ಸಿನಿಮಾ ನೋಡೋಕೆ ಹೋಗ್ತೀವಿ?'];
    } else if (language === 'Hindi') {
      return ['हाँ, चलो चलते हैं!', 'ज़रूर, मुझे बहुत खुशी होगी।', 'नहीं, मेरा मन नहीं है।', 'किसी और दिन चलते हैं।', 'हम कौन सी फ़िल्म देखने जा रहे हैं?'];
    }
    return ["Yes, let's go!", "Sure, I'd love to.", "No, I'm not interested.", "Let's go another day.", "What movie are we going to see?"];
  }

  // 8. TV / Music / Entertainment / Watch / Media
  if (q.includes('tv') || q.includes('show') || q.includes('song') || q.includes('music') || q.includes('watch') || q.includes('ಟಿವಿ') || q.includes('ಹಾಡು') || q.includes('ನೋಡು') || q.includes('टीवी') || q.includes('गाना')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಟಿವಿ ನೋಡಬೇಕು', 'ಸ್ವಲ್ಪ ಮ್ಯೂಸಿಕ್ ಪ್ಲೇ ಮಾಡಿ', 'ಬೇಡ, ವಿಶ್ರಾಂತಿ ಪಡೆಯುತ್ತೇನೆ'];
    } else if (language === 'Hindi') {
      return ['टीवी चला दो प्लीज', 'थोड़ा गाना बजा दो', 'नहीं, अभी शांत रहने दो'];
    }
    return ['Could you turn on the TV?', 'Play some nice music', 'No, keep it quiet please'];
  }

  // 9. Tea / Coffee / Beverages ("Would you like tea or coffee?")
  if (
    (q.includes('tea') && q.includes('coffee')) || q.includes('tea or coffee') || q.includes('coffee or tea') ||
    q.includes('tea beka coffee beka') || q.includes('chaha beka coffee beka') ||
    q.includes('ಚಹಾ ಅಥವಾ ಕಾಫಿ') || q.includes('ಕಾಫಿ ಅಥವಾ ಚಹಾ') || q.includes('ಚಹಾ ಬೇಕಾ ಕಾಫಿ ಬೇಕಾ') ||
    q.includes('चाय या कॉफ़ी') || q.includes('कॉफ़ी या चाय')
  ) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಚಹಾ ಬೇಕು.', 'ನನಗೆ ಕಾಫಿ ಬೇಕು.', 'ಎರಡೂ ಬೇಡ, ಧನ್ಯವಾದಗಳು.', 'ಬೇರೆ ಏನಾದರೂ ಕುಡಿಯಲು ಸಿಗುತ್ತದೆಯಾ?'];
    } else if (language === 'Hindi') {
      return ['मुझे चाय चाहिए, प्लीज।', 'मुझे कॉफ़ी चाहिए।', 'दोनों में से कुछ नहीं, शुक्रिया।', 'क्या मुझे इसके बदले पानी मिल सकता है?'];
    }
    return ["I'd like tea, please.", "I want coffee.", "Neither, thank you.", "Can I have some water instead?"];
  }

  if (q.includes('tea') || q.includes('coffee') || q.includes('chai') || q.includes('ಚಹಾ') || q.includes('ಕಾಫಿ') || q.includes('chaha') || q.includes('चाय') || q.includes('कॉफ़ी')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಚಹಾ ಕೊಡಿ!', 'ನನಗೆ ಕಾಫಿ ಇಷ್ಟ', 'ಇಲ್ಲ, ಬರಿ ನೀರು ಸಾಕು'];
    } else if (language === 'Hindi') {
      return ['हाँ, चाय दे दो!', 'मुझे कॉफ़ी पसंद है', 'नहीं, सिर्फ पानी चलेगा'];
    }
    return ['Yeah, I would love some tea!', 'Coffee sounds great!', 'Nah, just water for me'];
  }

  // 10. Walk / Outdoor / Garden
  if (q.includes('walk') || q.includes('outside') || q.includes('garden') || q.includes('stroll') || q.includes('ನಡಿಗೆ') || q.includes('ಹೊರಗೆ') || q.includes('horage') || q.includes('nadigi') || q.includes('ಟहलना') || q.includes('बाहर')) {
    if (language === 'Kannada') {
      return ['ಹೊರಗೆ ನಡಿಗೆಗೆ ಹೋಗೋಣ!', 'ಇಲ್ಲ, ಒಳಗಡೆಯೇ ಇರ್ತೀನಿ', 'ಸ್ವಲ್ಪ ಹೆಲ್ಪ್ ಮಾಡಿ'];
    } else if (language === 'Hindi') {
      return ['बाहर टहलने चलते हैं!', 'नहीं, अंदर ही ठीक हूँ', 'थोड़ी मदद कर दो'];
    }
    return ['I would love to take a walk outside!', "Nah, I'd rather stay inside", 'Could you help me walk?'];
  }

  // 11.5 Item Location Questions ("Where did you put..." / "Where is your..." / "ಎಲ್ಲಿ ಇಟ್ಟಿದ್ದೀರಿ" / "ಎಲ್ಲಿದೆ" / "elli ittiddira")
  if (
    q.includes('ittiddira') || q.includes('ittidiri') || q.includes('ittidiya') ||
    q.includes('ಇಟ್ಟಿದ್ದೀರಿ') || q.includes('ಇಟ್ಟಿದ್ದೀರಾ') || q.includes('ಎಲ್ಲಿದೆ') ||
    (q.includes('where') && (q.includes('put') || q.includes('keep') || q.includes('kept') || q.includes('is your') || q.includes('glasses') || q.includes('spectacles') || q.includes('phone') || q.includes('keys')))
  ) {
    if (language === 'Kannada') {
      return ['ಮೇಜಿನ ಮೇಲೆ ಇಟ್ಟಿದ್ದೇನೆ.', 'ಕೋಣೆಯ ಡ್ರಾಯರ್‌ನಲ್ಲಿ ಇರಬಹುದು.', 'ನನಗೆ ನೆನಪಾಗುತ್ತಿಲ್ಲ, ಸ್ವಲ್ಪ ಹುಡುಕಿ.', 'ನನ್ನ ಕೈಚೀಲದಲ್ಲಿ ನೋಡಿ.'];
    } else if (language === 'Hindi') {
      return ['मेज़ पर रखा था।', 'कमरे की दराज में हो सकता है।', 'मुझे याद नहीं आ रहा, ढूँढने में मदद करें।', 'मेरे बैग में देखिए।'];
    }
    return ['I kept it on the table.', 'It might be in the drawer.', "I don't recall, please help me check.", 'Please check inside my bag.'];
  }

  // 12. Travel / Destination / Location / Mandya / City
  if (q.includes('mandya') || q.includes('barta') || q.includes('yavaga') || q.includes('travel') || q.includes('city') || q.includes('place') || q.includes('ಮಂಡ್ಯ') || q.includes('ಯಾವಾಗ') || q.includes('ಪ್ರಯಾಣ') || q.includes('ಸ್ಥಳ')) {
    if (language === 'Kannada') {
      return ['ನಾಳೆ ಮಂಡ್ಯಗೆ ಹೋಗೋಣ!', 'ನಾನು ಶೀಘ್ರದಲ್ಲೇ ಬರುತ್ತೇನೆ', 'ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ತೀರ್ಮಾನಿಸೋಣ'];
    } else if (language === 'Hindi') {
      return ['कल मंड्या चलेंगे!', 'मैं जल्द ही आऊँगा', 'थोड़ी देर बाद तय करते हैं'];
    }
    return ['Let us go to Mandya tomorrow!', "I will be coming very soon", 'Let us decide in a little while'];
  }

  // 13. Family Members (Son, Daughter, Spouse, Relative)
  if (q.includes('maga') || q.includes('magalu') || q.includes('hendthi') || q.includes('ganda') || q.includes('son') || q.includes('daughter') || q.includes('wife') || q.includes('husband') || q.includes('ಮಗ') || q.includes('ಮಗಳು') || q.includes('ಗಂಡ') || q.includes('ಹೆಂಡತಿ')) {
    if (language === 'Kannada') {
      return ['ಅವರಿಗೆ ಫೋನ್ ಮಾಡಿ ಮಾತನಾಡಿ!', 'ಅವರು ಯಾವಾಗ ಬರ್ತಾರೆ?', 'ನಾನು ಅವರೊಂದಿಗೆ ಮಾತನಾಡಬೇಕು'];
    } else if (language === 'Hindi') {
      return ['उन्हें फोन लगा दो!', 'वे कब आ रहे हैं?', 'मुझे उनसे बात करनी है'];
    }
    return ['Please call them right now!', 'When are they visiting?', 'I would love to talk to them'];
  }

  // 14. Specific Foods (Rice, Dosa, Idli, Roti, Fruits, Milk)
  if (q.includes('rice') || q.includes('dosa') || q.includes('idli') || q.includes('roti') || q.includes('fruit') || q.includes('milk') || q.includes('anna') || q.includes('dosae') || q.includes('haalu') || q.includes('hannu') || q.includes('ಅನ್ನ') || q.includes('ದೋಸೆ') || q.includes('ಇಡ್ಲಿ') || q.includes('ಹಾಲು') || q.includes('ಹಣ್ಣು')) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ದೋಸೆ/ಇಡ್ಲಿ ಕೊಡಿ!', 'ನನಗೆ ಬಿಸಿ ಬಿಸಿ ಹಾಲು ಬೇಕು', 'ಸ್ವಲ್ಪ ಹಣ್ಣುಗಳನ್ನು ಕತ್ತರಿಸಿ ಕೊಡಿ'];
    } else if (language === 'Hindi') {
      return ['हाँ, डोसा/इडली दे दो!', 'मुझे गरम दूध चाहिए', 'थोड़ा फल काट कर दे दो'];
    }
    return ['Yes, I would love dosa/idli!', 'Please give me warm milk', 'Could I get some fresh fruit?'];
  }

  // 15. Body Parts / Symptoms (Headache, Stomach, Leg, Arm)
  if (q.includes('head') || q.includes('stomach') || q.includes('leg') || q.includes('arm') || q.includes('tale') || q.includes('hotte') || q.includes('kaalu') || q.includes('kai') || q.includes('ತಲೆ') || q.includes('ಹೊಟ್ಟೆ') || q.includes('ಕಾಲು') || q.includes('ಕೈ')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಸ್ವಲ್ಪ ತಲೆನೋವು ಆಗ್ತಿದೆ', 'ಹೊಟ್ಟೆ ಸರಿ ಇಲ್ಲ', 'ಕಾಲುಗಳನ್ನು ಸ್ವಲ್ಪ ಮಸಾಜ್ ಮಾಡಿ'];
    } else if (language === 'Hindi') {
      return ['मुझे थोड़ा सिरदर्द हो रहा है', 'पेट ठीक नहीं लग रहा', 'पैरों की मालिश कर दो'];
    }
    return ['I have a slight headache', 'My stomach feels uneasy', 'Could you massage my legs?'];
  }

  // 16. Fan / AC / Blanket / Pillow / Chair
  if (q.includes('fan') || q.includes('ac') || q.includes('blanket') || q.includes('pillow') || q.includes('chair') || q.includes('dimbu') || q.includes('hodike') || q.includes('ಫ್ಯಾನ್') || q.includes('ದಿಂಬು') || q.includes('ಹೊದಿಕೆ') || q.includes('ಕುರ್ಚಿ')) {
    if (language === 'Kannada') {
      return ['ಫ್ಯಾನ್ ಆನ್/ಆಫ್ ಮಾಡಿ ಪ್ಲೀಸ್', 'ಹೊದಿಕೆ ಸ್ವಲ್ಪ ಸರಿ ಮಾಡಿ', 'ದಿಂಬು ಎತ್ತರಕ್ಕೆ ಇಡಿ'];
    } else if (language === 'Hindi') {
      return ['पंखा चला/बंद कर दो', 'कंबल सही कर दो', 'तकिया थोड़ा ऊपर कर दो'];
    }
    return ['Turn the fan on/off please', 'Adjust my blanket please', 'Fluff my pillow higher'];
  }

  // 17. Bath / Shower / Clean / Hygiene
  if (q.includes('bath') || q.includes('shower') || q.includes('wash') || q.includes('clean') || q.includes('snana') || q.includes('ಸ್ನಾನ') || q.includes('ಕೈ ತೊಳೆಯಿರಿ')) {
    if (language === 'Kannada') {
      return ['ನನಗೆ ಸ್ನಾನ ಮಾಡಬೇಕು', 'ಕೈ ತೊಳೆಯಲು ಸಹಾಯ ಮಾಡಿ', 'ಟವೆಲ್ ಕೊಡಿ ಪ್ಲೀಸ್'];
    } else if (language === 'Hindi') {
      return ['मुझे स्नान करना है', 'हाथ धोने में मदद करो', 'तौलिया दे दो प्लीज'];
    }
    return ['I want to take a bath/shower', 'Help me wash my hands', 'Hand me the towel please'];
  }

  // 18. Devotional / Music / Bhajans / Songs
  if (q.includes('bhajan') || q.includes('devotional') || q.includes('god') || q.includes('bhakthi') || q.includes('ದೇವರು') || q.includes('ಭಕ್ತಿ') || q.includes('ಹಾಡು')) {
    if (language === 'Kannada') {
      return ['ಭಕ್ತಿ ಗೀತೆಗಳನ್ನು ಪ್ಲೇ ಮಾಡಿ', 'ದೇವರ ಪ್ರಾರ್ಥನೆ ಮಾಡೋಣ', 'ಶಾಂತವಾದ ಹಾಡುಗಳನ್ನು ಹಾಕಿ'];
    } else if (language === 'Hindi') {
      return ['भक्ति भजन चला दो', 'भगवान की प्रार्थना करते हैं', 'शांत संगीत बजा दो'];
    }
    return ['Play some devotional songs', 'Let us pray together', 'Put on soft relaxing music'];
  }

  // 19. Time of Day (Morning, Evening, Night, Tomorrow)
  if (q.includes('morning') || q.includes('evening') || q.includes('night') || q.includes('tomorrow') || q.includes('beligge') || q.includes('ratri') || q.includes('naale') || q.includes('ಬೆಳಿಗ್ಗೆ') || q.includes('ಸಂಜೆ') || q.includes('ರಾತ್ರಿ') || q.includes('ನಾಳೆ')) {
    if (language === 'Kannada') {
      return ['ಶುಭ ಬೆಳಿಗ್ಗೆ/ಸಂಜೆ!', 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ ನೋಡೋಣ', 'ರಾತ್ರಿ ಬೇಗ ಮಲಗೋಣ'];
    } else if (language === 'Hindi') {
      return ['शुभ प्रभात/संध्या!', 'कल सुबह देखते हैं', 'रात को जल्दी सोयेंगे'];
    }
    return ['Good morning/evening to you!', 'Let us talk tomorrow morning', 'I will sleep early tonight'];
  }

  // 20. Gratitude & Courtesy (Thank you, Please, Namaskara)
  if (q.includes('thanks') || q.includes('thank') || q.includes('please') || q.includes('dhanyavada') || q.includes('namaskara') || q.includes('ಧನ್ಯವಾದಗಳು') || q.includes('ನಮಸ್ಕಾರ')) {
    if (language === 'Kannada') {
      return ['ತುಂಬಾ ಧನ್ಯವಾದಗಳು!', 'ನಮಸ್ಕಾರ, ನೀವು ತುಂಬಾ ಒಳ್ಳೆಯವರು', 'ಪರವಾಯಿಲ್ಲ, ಧನ್ಯವಾದಗಳು'];
    } else if (language === 'Hindi') {
      return ['बहुत बहुत धन्यवाद!', 'नमस्कार, आप बहुत अच्छे हैं', 'कोई बात नहीं, शुक्रिया'];
    }
    return ['Thank you so much!', 'You are very kind, thanks!', 'My pleasure, thank you!'];
  }

  // 21. Wellbeing & Activity Check (How are you? What are you doing? / ಚೆನ್ನಾಗಿದ್ದೀಯಾ? ಏನ್ ಮಾಡ್ತಾ ಇದ್ದೀಯಾ?)
  if (q.includes('how are you') || q.includes('doing') || q.includes('hal') || q.includes('chennagiddiya') || q.includes('madtha') || q.includes('hegiddiya') || q.includes('ಚೆನ್ನಾಗಿದ್ದೀಯಾ') || q.includes('ಏನ್ ಮಾಡ್ತಾ') || q.includes('ಹೇಗಿದ್ದೀಯಾ') || q.includes('ಏನು ಸಮಾಚಾರ')) {
    if (language === 'Kannada') {
      return ['ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು!', 'ವಿಶ್ರಾಂತಿ ತಗೋತಾ ಇದ್ದೀನಿ', 'ಸ್ವಲ್ಪ ಸುಧಾರಿಸಿದೆ', 'ಸ್ವಲ್ಪ ಆಯಾಸವಾಗಿದೆ, ವಿಶ್ರಾಂತಿ ಬೇಕು'];
    } else if (language === 'Hindi') {
      return ['मैं ठीक हूँ, आराम कर रहा हूँ', 'पहले से बेहतर लग रहा है', 'खाना खा रहा हूँ', 'मेरी तबियत थोड़ी ठीक नहीं है'];
    }
    return ["I'm doing well, just resting", "I'm feeling a bit better", "I'm having a meal", "I'm not feeling very well"];
  }

  // 21b. General Yes/No Questions ("Did you...", "Have you...", "Can you...", "Are you...", Kannada verb questions)
  if (
    /^(did you|have you|are you|do you|can you|could you|will you|would you|is it|was it)\b/i.test(q) ||
    (q.includes('?') && !/^(what|where|when|who|why|how)\b/i.test(q)) ||
    /(ಇದ್ದೀರಾ|ಮಾಡಿದ್ದೀರಾ|ಹೋಗಿದ್ದೀರಾ|ಆಯ್ತಾ|ತಗೊಂಡ್ರಾ|ಮಾಡಿದ್ರಾ|ಹೋದ್ರಾ|beka|aitha|madidra|hogidra|iddira)\b/i.test(q)
  ) {
    if (language === 'Kannada') {
      return ['ಹೌದು, ಸರಿ.', 'ಇಲ್ಲ, ಹಾಗಲ್ಲ.', 'ನನಗೆ ಖಚಿತವಿಲ್ಲ.', 'ಬಹುಶಃ ನಂತರ.'];
    } else if (language === 'Hindi') {
      return ['हाँ, बिल्कुल सही।', 'नहीं, ऐसा नहीं है।', 'मुझे पक्का नहीं पता।', 'शायद बाद में।'];
    }
    return ["Yes, that's right.", "No, not really.", "I'm not sure.", "Maybe later."];
  }

  // 22. Smart Contextual Fallback for any custom companion utterance or statement
  if (language === 'Kannada') {
    return [
      'ಕೇಳಲು ತುಂಬಾ ಸಂತೋಷವಾಯಿತು!',
      'ಹೌದು, ಅದು ತುಂಬಾ ಒಳ್ಳೆಯ ಸುದ್ದಿ.',
      'ಇನ್ನಷ್ಟು ವಿವರವಾಗಿ ಹೇಳಿ.',
      'ತಿಳಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು.'
    ];
  } else if (language === 'Hindi') {
    return [
      'यह सुनकर अच्छा लगा।',
      'हाँ, मैं समझ गया।',
      'मुझे इसके बारे में और बताइए।',
      'बताने के लिए धन्यवाद।'
    ];
  }
  return [
    'That sounds good.',
    'Yes, I understand.',
    'Could you tell me more?',
    'Thank you for letting me know.'
  ];
};

export const ConversationModeModule = ({
  onBackToDashboard,
  patientId,
  patientName = 'Patient',
  onOpenProfile,
  onLogout
}) => {
  const { voiceAssistant, speak, language: appLanguage } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Status: 'idle' | 'listening' | 'processing' | 'recognized' | 'confirming' | 'synthesizing' | 'completed' | 'error'
  const [status, setStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      const storedPref = (localStorage.getItem('voiceback_patient_language') || '').toLowerCase();
      if (storedPref.includes('kannada') || appLanguage === 'kannada') return 'Kannada';
      if (storedPref.includes('hindi') || appLanguage === 'hindi') return 'Hindi';
    } catch (e) {}
    return appLanguage === 'kannada' ? 'Kannada' : 'English';
  });

  // Ephemeral State
  const [isListening, setIsListening] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recognizedQuestion, setRecognizedQuestion] = useState('');
  const [nlpAnalysis, setNlpAnalysis] = useState(null);
  const [responseChoices, setResponseChoices] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [playbackResult, setPlaybackResult] = useState(null);
  const [isAutoReplyEnabled, setIsAutoReplyEnabled] = useState(false);
  const [caregiverTypedQuestion, setCaregiverTypedQuestion] = useState('');

  const [deviceStatus, setDeviceStatus] = useState(() => deviceService.getDeviceStatus());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const autoClearTimeoutRef = useRef(null);

  useEffect(() => {
    const unsubscribe = deviceService.subscribe((newStatus) => {
      setDeviceStatus(newStatus);
    });
    return () => {
      unsubscribe();
      if (autoClearTimeoutRef.current) clearTimeout(autoClearTimeoutRef.current);
    };
  }, []);

  // Automatic Ephemeral Cleanup
  const resetEphemeralState = () => {
    setRecognizedQuestion('');
    setNlpAnalysis(null);
    setResponseChoices([]);
    setSelectedChoice('');
    setPlaybackResult(null);
    setErrorMessage('');
    setStatus('idle');
    setStatusMessage('');
  };

  // Automatic Reply Execution Routine upon Speech Recognition
  const executeAutoReply = async (choiceText, langOverride) => {
    if (!choiceText || !choiceText.trim()) return;
    setSelectedChoice(choiceText);
    setIsSynthesizing(true);
    setStatus('synthesizing');
    setStatusMessage(`⚡ Auto-Reply: Recognized! Synthesizing patient voice audio for "${choiceText}"...`);

    const hasKn = /[\u0C80-\u0CFF]/.test(choiceText);
    const hasHi = /[\u0900-\u097F]/.test(choiceText);
    const targetLanguage = langOverride || (hasKn ? 'Kannada' : hasHi ? 'Hindi' : selectedLanguage);

    try {
      const result = await voiceService.playSynthesizedAudio({
        patientId: patientId || '',
        text: choiceText,
        language: targetLanguage,
        emotion: 'neutral',
      });

      setPlaybackResult(result);
      setStatus('completed');
      setStatusMessage(`⚡ Auto-Reply Delivered via ${result?.provider || 'ElevenLabs Voice Engine'}`);

      autoClearTimeoutRef.current = setTimeout(() => {
        resetEphemeralState();
      }, 3500);
    } catch (err) {
      console.error('Auto-Reply Voice Output Error:', err);
      setErrorMessage(`Auto-reply voice output notice: ${err.message}`);
      setStatus('completed');
      autoClearTimeoutRef.current = setTimeout(() => {
        resetEphemeralState();
      }, 4000);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Start Companion Recording
  const startListening = async () => {
    resetEphemeralState();
    if (autoClearTimeoutRef.current) clearTimeout(autoClearTimeoutRef.current);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone is not supported in this browser.');
      showTemporaryError('Microphone is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const chunks = audioChunksRef.current;
        if (!chunks || chunks.length === 0) {
          showTemporaryError("Could not hear speech. Please try again.");
          return;
        }

        setStatus('processing');
        setStatusMessage('Transcribing companion speech with ElevenLabs Scribe v2 STT...');

        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audioSample', audioBlob, 'companion_speech.webm');
          formData.append('language', selectedLanguage === 'Kannada' ? 'kn' : selectedLanguage === 'Hindi' ? 'hi' : 'en');

          const response = await voiceService.transcribeSpeech(formData);
          const transcript = response?.data?.text || response?.text || '';
          const rawText = (transcript || '').trim();

          // 1. NLP Deep Analysis Engine for Companion Speech
          const nlpResult = analyzeCompanionSpeechNLP(rawText, selectedLanguage);
          setNlpAnalysis(nlpResult);

          const finalQuestion = nlpResult.normalizedQuestion;
          const effectiveLang = nlpResult.effectiveLanguage;

          setRecognizedQuestion(finalQuestion);
          if (effectiveLang !== selectedLanguage) {
            setSelectedLanguage(effectiveLang);
          }

          // 2. Immediate 0ms contextual, accurate patient responses
          const instantChoices = generateDynamicResponses(finalQuestion, effectiveLang);
          setResponseChoices(instantChoices);

          if (isAutoReplyEnabled && instantChoices.length > 0) {
            executeAutoReply(instantChoices[0], effectiveLang);
          } else {
            setStatus('recognized');
            setStatusMessage(`Speech analyzed (${nlpResult.intentLabel}). Choose your response:`);
          }

          // 3. Asynchronously fetch context options in background to enhance choices without blocking UI
          (async () => {
            try {
              const langCode = effectiveLang === 'Kannada' ? 'kn' : effectiveLang === 'Hindi' ? 'hi' : 'en';
              const aiRes = await contextService.generateOptions({ caregiverQuestion: finalQuestion, language: langCode });
              const optList = aiRes?.options || aiRes?.data?.options || [];
              if (Array.isArray(optList) && optList.length > 0) {
                const aiChoices = optList.map((opt) => (typeof opt === 'string' ? opt : opt.text || opt.rawText));
                if (aiChoices.length > 0) {
                  // Safeguard: Never overwrite targeted dynamic responses with stale generic canned options
                  const hasUnrelatedCanned = aiChoices.some(c =>
                    typeof c === 'string' && (
                      c.includes('watching TV') ||
                      c.includes('resting right now')
                    )
                  );
                  if (!hasUnrelatedCanned && aiChoices.length > 0) {
                    setResponseChoices(aiChoices);
                  }
                }
              }
            } catch (e) {
              // Silently ignore, instantChoices is already displayed
            }
          })();
        } catch (sttErr) {
          console.error('ElevenLabs Scribe v2 STT Error:', sttErr.message);
          showTemporaryError(`Speech recognition failed: ${sttErr.message}`);
        } finally {
          setIsListening(false);
        }
      };

      mediaRecorder.start(250);
      setIsListening(true);
      setStatus('listening');
      setStatusMessage('Listening to companion speech...');
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone Access Error:', err);
      showTemporaryError('Microphone access denied or unavailable.');
    }
  };

  const stopListening = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    }
  };

  const showTemporaryError = (msg) => {
    setErrorMessage(msg);
    setStatus('error');
    setIsListening(false);
    autoClearTimeoutRef.current = setTimeout(() => {
      resetEphemeralState();
    }, 3500);
  };

  const handleSelectChoice = async (choiceText) => {
    // Prevent duplicate synthesis or duplicate playback from the same click
    if (!choiceText || !choiceText.trim() || isSynthesizing) return;

    // Use exact selected option text without alteration or reconstruction
    setSelectedChoice(choiceText);
    setIsSynthesizing(true);
    setStatus('synthesizing');
    setStatusMessage('Speaking selected response in patient voice...');

    try {
      // Determine language: Kannada if Kannada script, otherwise Hindi or selectedLanguage
      const isKn = /[\u0C80-\u0CFF]/.test(choiceText);
      const isHi = /[\u0900-\u097F]/.test(choiceText);
      const targetL = isKn ? 'Kannada' : isHi ? 'Hindi' : (selectedLanguage || 'English');

      // Immediately synthesize and play using correct patient-specific voice
      const result = await voiceService.playSynthesizedAudio({
        patientId: patientId || '',
        text: choiceText,
        language: targetL,
        emotion: 'neutral',
      });

      setPlaybackResult(result);
      setStatus('completed');
      setStatusMessage(`Spoken via: ${result?.provider || 'Physical Speaker'}`);

      // AUTOMATIC EPHEMERAL CLEANUP AFTER SUCCESSFUL PLAYBACK
      autoClearTimeoutRef.current = setTimeout(() => {
        resetEphemeralState();
      }, 3000);
    } catch (err) {
      // Handle synthesis failure safely without breaking the rest of the module
      console.error('Voice Output Error:', err);
      setErrorMessage(`Voice output notice: ${err.message}`);
      setStatus('completed');
      autoClearTimeoutRef.current = setTimeout(() => {
        resetEphemeralState();
      }, 4000);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-viewport">
      <div className="mobile-container dashboard-container" style={{ maxWidth: '520px' }}>
        
        {/* HEADER BAR */}
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="settings-btn"
              aria-label="Return to Dashboard"
              title="Return to Dashboard"
              onClick={onBackToDashboard}
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
              Companion Speech (Caregiver ➔ Patient)
            </h2>
          </div>

          <button
            type="button"
            className="settings-btn"
            aria-label="Open Settings"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* BLE DEVICE STATUS BAR */}
        <div
          style={{
            padding: '0.6rem 0.85rem',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={18} color={deviceStatus.isConnected ? '#16A34A' : '#DC2626'} />
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: deviceStatus.isConnected ? '#16A34A' : '#DC2626' }}>
              {deviceStatus.isConnected ? '🟢 VoiceBack-Neckband Connected' : '🔴 Device Disconnected'}
            </span>
          </div>

          {!deviceStatus.isConnected && (
            <button
              type="button"
              className="btn-secondary-auth"
              style={{ width: 'auto', padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
              onClick={() => deviceService.requestAndConnectBluetooth().catch((e) => console.warn(e.message))}
            >
              <span>Connect</span>
            </button>
          )}
        </div>

        {/* ERROR DISPLAY */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          
          {/* LANGUAGE & AUTO-REPLY CONTROL */}
          <section className="profile-section-card" style={{ padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={16} color="var(--color-blue-primary)" />
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                  Target Language
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['English', 'Kannada', 'Hindi'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    style={{
                      padding: '0.35rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedLanguage === lang ? 'var(--color-blue-primary)' : 'var(--border-color)',
                      background: selectedLanguage === lang ? 'rgba(2, 132, 199, 0.12)' : '#ffffff',
                      color: selectedLanguage === lang ? 'var(--color-blue-primary)' : 'var(--color-brand-tagline)',
                      fontWeight: selectedLanguage === lang ? 700 : 500,
                      fontSize: '0.775rem',
                      cursor: 'pointer',
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color={isAutoReplyEnabled ? '#16A34A' : '#64748B'} />
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
                  ⚡ Auto-Reply on Recognition
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoReplyEnabled(!isAutoReplyEnabled)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: isAutoReplyEnabled ? '#16A34A' : '#E2E8F0',
                  color: isAutoReplyEnabled ? '#FFFFFF' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isAutoReplyEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </section>

          {/* COMPANION SPEECH CAPTURE ACTION */}
          <section className="profile-section-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 className="profile-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mic size={18} color="var(--color-blue-primary)" />
                <span>Listen to Companion</span>
              </h3>
              {recognizedQuestion && (
                <button
                  type="button"
                  onClick={resetEphemeralState}
                  style={{ border: 'none', background: 'transparent', color: 'var(--color-brand-tagline)', cursor: 'pointer' }}
                  title="Clear temporary interaction"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {isListening ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
                <div className="listening-pulse-stage" style={{ margin: 0 }}>
                  <div className="listening-icon-circle">
                    <Mic size={32} strokeWidth={2.5} />
                  </div>
                  <div className="listening-pulse-ring-anim" />
                </div>
                <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'monospace' }}>
                  {formatTime(recordingTime)}
                </span>
                <button
                  type="button"
                  className="btn-continue"
                  onClick={stopListening}
                  style={{ width: '100%', background: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Square size={18} />
                  <span>Stop Listening</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-continue"
                onClick={startListening}
                disabled={status === 'processing' || isSynthesizing}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Mic size={18} />
                <span>{status === 'processing' ? 'Processing Speech...' : 'Start Listening to Companion Speech'}</span>
              </button>
            )}
          </section>

          {/* ULTRA IMPRESSIVE EPHEMERAL QUESTION & RESPONSE PANEL */}
          {recognizedQuestion && (
            <div className="ultra-ephemeral-panel">
              {/* HEADER BADGE & CLOSE */}
              <div className="ultra-ephemeral-header">
                <div className="ultra-pill-badge">
                  <div className="soundwave-bars">
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                    <span className="soundwave-bar" />
                  </div>
                  <span>SPEECH RECOGNIZED</span>
                </div>
                <button
                  type="button"
                  onClick={resetEphemeralState}
                  style={{ border: 'none', background: 'transparent', color: 'var(--color-brand-tagline)', cursor: 'pointer', opacity: 0.75 }}
                  title="Clear interaction"
                >
                  <X size={18} />
                </button>
              </div>

              {/* RECOGNIZED QUESTION TEXT */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-brand-tagline)' }}>
                    Companion Spoke:
                  </span>
                  {nlpAnalysis && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      background: 'rgba(2, 132, 199, 0.1)',
                      border: '1px solid rgba(2, 132, 199, 0.25)',
                      color: 'var(--color-blue-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      <Sparkles size={12} />
                      NLP: {nlpAnalysis.intentLabel}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: 0, lineHeight: 1.35, letterSpacing: '-0.01em' }}>
                  "{recognizedQuestion}"
                </p>
              </div>

              {/* DYNAMIC RESPONSE CHOICES */}
              {responseChoices.length > 0 && !selectedChoice && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-title)', margin: 0 }}>
                    What would you like to say? (Tap a choice)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {responseChoices.map((choiceText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectChoice(choiceText)}
                        disabled={isSynthesizing}
                        style={{
                          padding: '0.9rem 1.1rem',
                          borderRadius: '16px',
                          border: '1.5px solid var(--border-color)',
                          background: isSynthesizing ? 'rgba(241, 245, 249, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                          color: 'var(--color-brand-title)',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                          cursor: isSynthesizing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s ease',
                          opacity: isSynthesizing ? 0.6 : 1
                        }}
                      >
                        <span>{choiceText}</span>
                        <CheckCircle2 size={19} color="var(--color-blue-primary)" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SPEAKING / SPOKEN RESPONSE STAGE (ONE-TAP WITHOUT SECOND CONFIRM STEP) */}
              {selectedChoice && (
                <div className="ultra-response-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={15} />
                      {isSynthesizing ? 'Speaking in Patient Voice...' : 'Spoken in Patient Voice:'}
                    </span>
                    {isSynthesizing && (
                      <div className="soundwave-bars">
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                        <span className="soundwave-bar" />
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: '0.35rem 0 0.2rem 0', lineHeight: 1.3 }}>
                    "{selectedChoice}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STATUS & PLAYBACK RESULT */}
          {statusMessage && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(241, 245, 249, 0.9)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--color-brand-tagline)',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Status: {statusMessage}
            </div>
          )}

          {playbackResult && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1.5px solid var(--color-green-primary)',
                color: 'var(--color-green-primary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Volume2 size={20} />
              <span>{playbackResult.provider}</span>
            </div>
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

export default ConversationModeModule;
