import React from 'react';
import officialLogo from '../assets/voiceback-logo.png';

/**
 * Shared Official VoiceBack Logo Component
 * 
 * Rules:
 * - Uses exact uploaded transparent PNG logo
 * - Never placed inside a white square, border, or container
 * - Preserves transparent background and original aspect ratio
 * - Responsive sizing:
 *   - splash: 180–220 px
 *   - header: 48–56 px
 *   - dashboard: 40–48 px
 */
export const VoiceBackLogo = ({ variant = 'header', size, className = '', style = {} }) => {
  let defaultStyle = {};

  if (variant === 'splash') {
    defaultStyle = {
      width: size || '200px',
      maxWidth: '220px',
      minWidth: '180px',
      height: 'auto',
      objectFit: 'contain',
    };
  } else if (variant === 'dashboard') {
    defaultStyle = {
      height: size || '44px',
      maxHeight: '48px',
      minHeight: '40px',
      width: 'auto',
      objectFit: 'contain',
    };
  } else {
    // Default 'header' variant (Role Selection, Auth, Settings, etc.)
    defaultStyle = {
      height: size || '40px',
      maxHeight: '44px',
      minHeight: '36px',
      width: 'auto',
      objectFit: 'contain',
    };
  }

  return (
    <img
      src={officialLogo}
      alt="VoiceBack Official Logo"
      className={`voiceback-official-logo ${className}`}
      style={{
        display: 'block',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        ...defaultStyle,
        ...style,
      }}
    />
  );
};

export default VoiceBackLogo;
