import React from 'react';
import officialLogoImg from '../assets/voiceback-logo.jpg';

/**
 * Official VoiceBack Brand Logo Component
 * Renders the official uploaded logo image maintaining original aspect ratio.
 * Never stretched, never cropped, never overflowing.
 */
export const VoiceBackLogo = ({ width = '220px', className = '', style = {} }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden', padding: '0.2rem' }}>
      <img
        src={officialLogoImg}
        alt="VoiceBack - Every Voice Deserves to Be Heard"
        className={`voiceback-official-logo ${className}`}
        style={{
          width: width,
          maxWidth: '100%',
          height: 'auto',
          maxHeight: '160px',
          objectFit: 'contain',
          display: 'block',
          borderRadius: '8px',
          ...style,
        }}
      />
    </div>
  );
};
