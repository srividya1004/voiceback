import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { VoiceBackLogo } from '../../components/VoiceBackLogo';
import { useAccessibility } from '../../context/AccessibilityContext';
import { UserCheck, ArrowRight, Sparkles } from 'lucide-react';

export const IntroPage = () => {
  const navigate = useNavigate();
  const { t, audioGuidance, speakText } = useAccessibility();

  // Approved Patient Introduction speech subtitle lines
  const subtitleLines = [
    "Hello!",
    "Welcome to VoiceBack.",
    "Communication is a part of who we are.",
    "Together, we'll help you reconnect with your voice.",
    "Let's begin your journey.",
  ];

  const [activeLineIndex, setActiveLineIndex] = useState(0);

  useEffect(() => {
    // If Voice Assistance is ON, speak current subtitle line
    if (audioGuidance) {
      speakText(subtitleLines[activeLineIndex]);
    }

    const lineTimer = setInterval(() => {
      setActiveLineIndex((prev) => (prev < subtitleLines.length - 1 ? prev + 1 : prev));
    }, 2200);

    return () => clearInterval(lineTimer);
  }, [activeLineIndex, audioGuidance, subtitleLines]);

  const handleContinue = () => {
    // Patient Introduction -> Patient Registration
    navigate('/patient/register');
  };

  return (
    <div className="center-view animate-fade-in" style={{ padding: '1.5rem 0.5rem' }}>
      <Card style={{ maxWidth: '540px', width: '100%', textAlign: 'center', padding: '2rem 1.4rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <VoiceBackLogo width="180px" />
        </div>

        {/* Friendly Healthcare Assistant Avatar */}
        <div style={{
          position: 'relative',
          width: '90px',
          height: '90px',
          margin: '0 auto 1.2rem auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-blue-light)',
            color: 'var(--color-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            animation: 'pulseGlow 3s ease-in-out infinite',
            border: '2px solid var(--color-blue)',
          }}>
            <UserCheck size={40} />
          </div>
          <Sparkles
            size={18}
            color="var(--color-green)"
            style={{ position: 'absolute', top: 2, right: 2, animation: 'fadeIn 1s infinite alternate' }}
          />
        </div>

        {/* Subtitles Box */}
        <div style={{
          minHeight: '100px',
          padding: '1rem 1.2rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-app)',
          border: '1.5px solid var(--border-subtle)',
          marginBottom: '1.8rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 700,
            color: 'var(--color-blue)',
            lineHeight: '1.4',
            transition: 'opacity 0.4s ease',
          }}>
            {subtitleLines[activeLineIndex]}
          </p>
        </div>

        {/* Continue Button -> Registration */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleContinue}
            size="large"
            style={{ width: '100%', maxWidth: '320px' }}
          >
            <span>{t('continueAction')}</span>
            <ArrowRight size={18} />
          </Button>
        </div>
      </Card>
    </div>
  );
};
