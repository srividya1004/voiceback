import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export const Card = ({
  children,
  onClick,
  className = '',
  style = {},
  selected = false,
  speakTextOnHover = null,
}) => {
  const { speakText, triggerHaptic } = useAccessibility();

  const handleClick = (e) => {
    triggerHaptic();
    if (onClick) onClick(e);
  };

  const handleMouseEnter = () => {
    if (speakTextOnHover) {
      speakText(speakTextOnHover);
    }
  };

  return (
    <div
      className={`glass-card ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        border: selected ? '2px solid var(--color-green)' : '1px solid var(--border-subtle)',
        background: selected ? 'var(--color-green-light)' : 'var(--bg-card)',
        transform: selected ? 'scale(1.02)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
