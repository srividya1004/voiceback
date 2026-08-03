import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('vb_lang') || 'en');
  const [isLargeText, setIsLargeText] = useState(() => localStorage.getItem('vb_largetext') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('vb_theme') || 'light');
  // Audio Guidance is OFF by default
  const [audioGuidance, setAudioGuidance] = useState(() => localStorage.getItem('vb_audioguidance') === 'true');
  const [vibration, setVibration] = useState(() => localStorage.getItem('vb_vibration') === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vb_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-large-text', isLargeText ? 'true' : 'false');
    localStorage.setItem('vb_largetext', isLargeText);
  }, [isLargeText]);

  useEffect(() => {
    localStorage.setItem('vb_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('vb_audioguidance', audioGuidance);
  }, [audioGuidance]);

  useEffect(() => {
    localStorage.setItem('vb_vibration', vibration);
  }, [vibration]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const toggleLargeText = () => setIsLargeText((prev) => !prev);
  const toggleAudioGuidance = () => setAudioGuidance((prev) => !prev);
  const toggleVibration = () => setVibration((prev) => !prev);

  // Audio Guidance Speech Synthesis Trigger (OFF by default, operates ONLY when enabled)
  const speakText = (text) => {
    if (audioGuidance && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Haptic Vibration Feedback Trigger
  const triggerHaptic = () => {
    if (vibration && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  // Full Internationalization Translation Function t(key)
  const t = (key) => {
    const langDict = translations[language] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
  };

  return (
    <AccessibilityContext.Provider
      value={{
        language,
        setLanguage,
        isLargeText,
        toggleLargeText,
        theme,
        toggleTheme,
        audioGuidance,
        toggleAudioGuidance,
        vibration,
        toggleVibration,
        speakText,
        triggerHaptic,
        t,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
