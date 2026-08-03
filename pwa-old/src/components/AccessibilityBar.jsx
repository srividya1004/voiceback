import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { VoiceBackLogo } from './VoiceBackLogo';
import { Settings, X, Globe, Sun, Moon, Volume2, VolumeX, Smartphone } from 'lucide-react';

export const AccessibilityBar = () => {
  const {
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
    triggerHaptic,
    t,
  } = useAccessibility();

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.4rem 1rem',
      height: '52px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
    }}>
      {/* Single Official Logo Asset */}
      <VoiceBackLogo width="130px" style={{ margin: 0 }} />

      {/* Single Compact Settings Action Icon */}
      <button
        onClick={() => {
          triggerHaptic();
          setShowSettingsModal(true);
        }}
        title="Settings & Accessibility"
        aria-label="Settings & Accessibility"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-app)',
          color: 'var(--text-main)',
          cursor: 'pointer',
        }}
      >
        <Settings size={18} />
      </button>

      {/* Settings Modal (Language, Theme, Accessibility) */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '1rem',
        }}>
          <div className="glass-card animate-fade-in" style={{ maxWidth: '380px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>Application Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Language Selection */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Globe size={16} color="var(--color-blue)" />
                  <span>Language</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    triggerHaptic();
                  }}
                  className="form-select"
                >
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  {theme === 'dark' ? <Moon size={16} color="var(--color-blue)" /> : <Sun size={16} color="#f39c12" />}
                  <span>Theme</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => { if (theme !== 'light') { toggleTheme(); triggerHaptic(); } }}
                    className={`btn-secondary`}
                    style={{
                      flex: 1,
                      minHeight: '40px',
                      border: theme === 'light' ? '2px solid var(--color-blue)' : '1px solid var(--border-subtle)',
                      fontWeight: theme === 'light' ? 700 : 500,
                    }}
                  >
                    Light Theme
                  </button>
                  <button
                    onClick={() => { if (theme !== 'dark') { toggleTheme(); triggerHaptic(); } }}
                    className={`btn-secondary`}
                    style={{
                      flex: 1,
                      minHeight: '40px',
                      border: theme === 'dark' ? '2px solid var(--color-blue)' : '1px solid var(--border-subtle)',
                      fontWeight: theme === 'dark' ? 700 : 500,
                    }}
                  >
                    Dark Theme
                  </button>
                </div>
              </div>

              {/* Voice Assistance Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {audioGuidance ? <Volume2 size={16} color="var(--color-blue)" /> : <VolumeX size={16} color="var(--text-muted)" />}
                  Voice Assistance
                </span>
                <input
                  type="checkbox"
                  checked={audioGuidance}
                  onChange={() => {
                    toggleAudioGuidance();
                    triggerHaptic();
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-blue)', cursor: 'pointer' }}
                />
              </label>

              {/* Large Text */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', fontWeight: 600, cursor: 'pointer' }}>
                <span>Large Text Mode</span>
                <input
                  type="checkbox"
                  checked={isLargeText}
                  onChange={() => {
                    toggleLargeText();
                    triggerHaptic();
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-green)', cursor: 'pointer' }}
                />
              </label>

              {/* Vibration */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', fontWeight: 600, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Smartphone size={16} />
                  Haptic Vibration
                </span>
                <input
                  type="checkbox"
                  checked={vibration}
                  onChange={() => {
                    toggleVibration();
                    triggerHaptic();
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-green)', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
