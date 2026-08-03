import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'large',
  type = 'button',
  disabled = false,
  loading = false,
  loadingText = null,
  className = '',
  style = {},
  speakTextOnHover = null,
}) => {
  const { speakText, triggerHaptic } = useAccessibility();

  const handleClick = (e) => {
    if (disabled || loading) return;
    triggerHaptic();
    if (onClick) onClick(e);
  };

  const handleMouseEnter = () => {
    if (speakTextOnHover && !disabled && !loading) {
      speakText(speakTextOnHover);
    }
  };

  const btnClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';

  return (
    <button
      type={type}
      className={`${btnClass} ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled || loading}
      style={style}
    >
      {loading ? (
        <>
          <div className="spinner" />
          <span>{loadingText || 'Loading...'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
