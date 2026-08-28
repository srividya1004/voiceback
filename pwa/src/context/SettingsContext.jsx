import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '../i18n/translations';
import voiceService from '../services/voiceService';

const SETTINGS_STORAGE_KEY = 'voiceback_settings';

// Development Defaults (localhost & default startup):
// Theme = Light, Language = English, Voice Assistant = OFF
const defaultSettings = {
  theme: 'light',
  language: 'english',
  voiceAssistant: false,
  accessibility: {
    largerText: false,
    highContrast: false,
  },
};

const SettingsContext = createContext({
  settings: defaultSettings,
  theme: 'light',
  language: 'english',
  voiceAssistant: false,
  setTheme: () => {},
  setLanguage: () => {},
  setVoiceAssistant: () => {},
  updateSettings: () => {},
  t: (key) => key,
  speak: () => {},
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          theme: parsed.theme || 'light',
          language: parsed.language || 'english',
          voiceAssistant: typeof parsed.voiceAssistant === 'boolean' ? parsed.voiceAssistant : (parsed.accessibility?.voiceAssistance ?? false),
          accessibility: {
            ...defaultSettings.accessibility,
            ...(parsed.accessibility || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to read settings from localStorage:', e);
    }
    return defaultSettings;
  });

  const theme = settings.theme || 'light';
  const language = settings.language || 'english';
  const voiceAssistant = !!settings.voiceAssistant;

  // Persist settings and apply active theme / accessibility to DOM
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage:', e);
    }

    const root = document.documentElement;

    // Apply Theme
    let activeTheme = 'light';
    if (theme === 'dark') {
      activeTheme = 'dark';
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', activeTheme);

    // Apply Accessibility attributes
    root.setAttribute('data-large-text', settings.accessibility?.largerText ? 'true' : 'false');
    root.setAttribute('data-high-contrast', settings.accessibility?.highContrast ? 'true' : 'false');
    root.setAttribute('data-language', language);
    root.setAttribute('data-voice-assistant', voiceAssistant ? 'true' : 'false');

    // Stop speech if voice assistant is toggled off
    if (!voiceAssistant && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [settings, theme, language, voiceAssistant]);

  // Set individual settings helpers
  const setTheme = (newTheme) => {
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  /**
   * Global `speak(text, overrideLang)` helper using Web Speech API.
   * 
   * Infrastructure Rules:
   * - If voiceAssistant == false: return immediately (app stays silent).
   * - Locales: English -> en-IN, Kannada -> kn-IN, Hindi -> hi-IN.
   * - Fallback: If kn-IN voice is unavailable, fall back to en-IN.
   */
  const speak = (text, overrideLang) => {
    if (!voiceAssistant || !text) {
      return;
    }

    const targetLang = overrideLang || language;
    voiceService.speakNativeTTS(text, { language: targetLang }).catch((e) => {
      console.warn('⚠️ Voice Assistant TTS playback error:', e);
    });
  };

  const setLanguage = (newLang) => {
    setSettings((prev) => ({ ...prev, language: newLang }));

    // Speak confirmation ONLY if Voice Assistant is ON
    if (voiceAssistant && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const confirmationText = getTranslation(newLang, 'languageChangedConfirmation');
      if (confirmationText) {
        speak(confirmationText, newLang);
      }
    }
  };

  const setVoiceAssistant = (enabled) => {
    setSettings((prev) => ({
      ...prev,
      voiceAssistant: enabled,
      accessibility: {
        ...prev.accessibility,
        voiceAssistance: enabled,
      },
    }));

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (enabled) {
        const text = getTranslation(language, 'voiceAssistantEnabled');
        speak(text, language);
      } else {
        const text = getTranslation(language, 'voiceAssistantDisabled');
        // Temporarily speak disable message before closing
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'hindi' ? 'hi-IN' : language === 'kannada' ? 'kn-IN' : 'en-IN';
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const updatedVoiceAssistant = typeof newSettings.voiceAssistant === 'boolean' 
        ? newSettings.voiceAssistant 
        : (newSettings.accessibility?.voiceAssistance ?? prev.voiceAssistant);

      return {
        ...prev,
        ...newSettings,
        voiceAssistant: updatedVoiceAssistant,
        accessibility: {
          ...prev.accessibility,
          ...(newSettings.accessibility || {}),
          voiceAssistance: updatedVoiceAssistant,
        },
      };
    });
  };

  // Translation helper function
  const t = (key) => getTranslation(language, key);

  return (
    <SettingsContext.Provider value={{
      settings,
      theme,
      language,
      voiceAssistant,
      setTheme,
      setLanguage,
      setVoiceAssistant,
      updateSettings,
      t,
      speak,
      speakText: speak,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
export default SettingsContext;
