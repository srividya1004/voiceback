import React, { useEffect, useRef } from 'react';
import VoiceBackLogo from './VoiceBackLogo';
import { useSettings } from '../context/SettingsContext';

/**
 * Screen 1 - Premium Healthcare Splash Screen
 * 
 * Uses shared VoiceBackLogo component with variant="splash" (180-220px).
 */
export const SplashScreen = ({ onComplete }) => {
  const { t } = useSettings();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="splash-screen-container" role="banner" aria-label="VoiceBack Splash Screen">
      <div className="splash-content">
        <div className="splash-logo-wrapper">
          <VoiceBackLogo variant="splash" />
        </div>
        <p className="splash-tagline">{t('splashWelcomeMessage')}</p>
      </div>

      <footer className="splash-footer">
        <span className="splash-version">{t('version')}</span>
      </footer>
    </div>
  );
};

export default SplashScreen;
