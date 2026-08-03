import React from 'react';
import { X, Sun, Moon, Monitor, Globe, Eye, Volume2, Type } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

/**
 * Settings Bottom Sheet Modal Component
 * 
 * Directly binds theme, language, and voiceAssistant toggle state.
 */
export const SettingsBottomSheet = ({ isOpen, onClose }) => {
  const {
    settings,
    theme,
    language,
    voiceAssistant,
    setTheme,
    setLanguage,
    setVoiceAssistant,
    updateSettings,
    t
  } = useSettings();

  if (!isOpen) return null;

  const handleAccessibilityToggle = (key) => {
    if (key === 'voiceAssistance') {
      setVoiceAssistant(!voiceAssistant);
    } else {
      updateSettings({
        accessibility: {
          ...settings.accessibility,
          [key]: !settings.accessibility[key],
        },
      });
    }
  };

  return (
    <div
      className="settings-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="settings-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Header */}
        <div className="settings-sheet-header">
          <h2 id="settings-title" className="settings-sheet-title">
            <span>{t('settings')}</span>
          </h2>
          <button
            type="button"
            className="btn-close-sheet"
            onClick={onClose}
            aria-label={t('done')}
            data-speech={t('doneSpeech')}
          >
            <X size={22} />
          </button>
        </div>

        {/* Section 1: Theme */}
        <div className="settings-section">
          <h3 className="settings-section-title">{t('theme')}</h3>
          <div className="segmented-group" role="radiogroup" aria-label={t('theme')}>
            <button
              type="button"
              className={`segmented-btn ${theme === 'light' ? 'active' : ''}`}
              data-speech={t('lightThemeSpeech')}
              onClick={() => setTheme('light')}
            >
              <Sun size={16} />
              <span>{t('light')}</span>
            </button>
            <button
              type="button"
              className={`segmented-btn ${theme === 'dark' ? 'active' : ''}`}
              data-speech={t('darkThemeSpeech')}
              onClick={() => setTheme('dark')}
            >
              <Moon size={16} />
              <span>{t('dark')}</span>
            </button>
            <button
              type="button"
              className={`segmented-btn ${theme === 'system' ? 'active' : ''}`}
              data-speech={t('systemThemeSpeech')}
              onClick={() => setTheme('system')}
            >
              <Monitor size={16} />
              <span>{t('system')}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Language */}
        <div className="settings-section">
          <h3 className="settings-section-title">{t('language')}</h3>
          <div className="segmented-group" role="radiogroup" aria-label={t('language')}>
            <button
              type="button"
              className={`segmented-btn ${language === 'english' ? 'active' : ''}`}
              data-speech={t('englishLangSpeech')}
              onClick={() => setLanguage('english')}
            >
              <Globe size={15} />
              <span>English</span>
            </button>
            <button
              type="button"
              className={`segmented-btn ${language === 'kannada' ? 'active' : ''}`}
              data-speech={t('kannadaLangSpeech')}
              onClick={() => setLanguage('kannada')}
            >
              <span>ಕನ್ನಡ</span>
            </button>
            <button
              type="button"
              className={`segmented-btn ${language === 'hindi' ? 'active' : ''}`}
              data-speech={t('hindiLangSpeech')}
              onClick={() => setLanguage('hindi')}
            >
              <span>हिंदी</span>
            </button>
          </div>
        </div>

        {/* Section 3: Accessibility */}
        <div className="settings-section">
          <h3 className="settings-section-title">{t('accessibility')}</h3>
          <div className="accessibility-list">

            {/* Voice Assistance Toggle */}
            <label className="toggle-row" data-speech={t('voiceAssistanceToggleSpeech')}>
              <div className="toggle-label-box">
                <span className="toggle-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Volume2 size={17} />
                  <span>{t('voiceAssistance')}</span>
                </span>
                <span className="toggle-desc">{t('voiceAssistanceDesc')}</span>
              </div>
              <input
                type="checkbox"
                className="switch-input"
                checked={voiceAssistant}
                onChange={() => setVoiceAssistant(!voiceAssistant)}
              />
              <span className="switch-slider" />
            </label>

            {/* Larger Text */}
            <label className="toggle-row" data-speech={t('largerTextToggleSpeech')}>
              <div className="toggle-label-box">
                <span className="toggle-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Type size={17} />
                  <span>{t('largerText')}</span>
                </span>
                <span className="toggle-desc">{t('largerTextDesc')}</span>
              </div>
              <input
                type="checkbox"
                className="switch-input"
                checked={!!settings.accessibility?.largerText}
                onChange={() => handleAccessibilityToggle('largerText')}
              />
              <span className="switch-slider" />
            </label>

            {/* High Contrast */}
            <label className="toggle-row" data-speech={t('highContrastToggleSpeech')}>
              <div className="toggle-label-box">
                <span className="toggle-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Eye size={17} />
                  <span>{t('highContrast')}</span>
                </span>
                <span className="toggle-desc">{t('highContrastDesc')}</span>
              </div>
              <input
                type="checkbox"
                className="switch-input"
                checked={!!settings.accessibility?.highContrast}
                onChange={() => handleAccessibilityToggle('highContrast')}
              />
              <span className="switch-slider" />
            </label>

          </div>
        </div>

        {/* Done / Close Button */}
        <button
          type="button"
          className="btn-save-settings"
          data-speech={t('doneSpeech')}
          onClick={onClose}
        >
          {t('done')}
        </button>
      </div>
    </div>
  );
};

export default SettingsBottomSheet;
