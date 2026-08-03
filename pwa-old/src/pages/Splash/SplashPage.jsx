import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoiceBackLogo } from '../../components/VoiceBackLogo';
import { WaveformAnimation } from '../../components/WaveformAnimation';
import { useAccessibility } from '../../context/AccessibilityContext';

export const SplashPage = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();

  useEffect(() => {
    // Exactly 2.5 seconds Splash Screen on EVERY application launch
    const timer = setTimeout(() => {
      const storedRole = localStorage.getItem('vb_user_role');
      const isLoggedIn = localStorage.getItem('vb_logged_in') === 'true' && localStorage.getItem('vb_auth_token');
      const isFirstAppOpen = !storedRole;

      if (isFirstAppOpen) {
        // CASE 1: First Time User -> Splash -> Role Selection
        navigate('/role-selection');
      } else if (isLoggedIn) {
        // CASE 3: Existing User (Logged In) -> Splash -> Dashboard for remembered role
        navigate(`/dashboard/${storedRole.toLowerCase()}`);
      } else {
        // CASE 2: Existing User (Logged Out) -> Splash -> Login for remembered role
        navigate(`/${storedRole.toLowerCase()}/login`);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="center-view animate-fade-in" style={{
      minHeight: '100vh',
      width: '100%',
      justifyContent: 'center',
      padding: '2rem 1rem',
      backgroundColor: 'var(--bg-app)',
    }}>
      {/* Single Official VoiceBack Logo */}
      <VoiceBackLogo width="220px" />

      {/* sEMG Signal Waveform Animation */}
      <div style={{ margin: '1.5rem 0', width: '100%', maxWidth: '380px' }}>
        <WaveformAnimation height={75} />
      </div>

      {/* Tagline */}
      <p style={{
        fontSize: 'var(--font-size-lg)',
        fontWeight: 600,
        color: 'var(--color-blue)',
        maxWidth: '420px',
        margin: '0 auto',
        fontStyle: 'italic',
      }}>
        "{t('tagline')}"
      </p>
    </div>
  );
};
