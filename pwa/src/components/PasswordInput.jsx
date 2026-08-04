import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Reusable Password Input Component with Accessibility & Toggle Visibility
 */
export const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '••••••••',
  required = false,
  autoComplete = 'current-password',
  style,
  className = 'form-input',
  leftIcon = null,
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="password-input-wrapper" style={{ position: 'relative', width: '100%' }}>
      {leftIcon && (
        <div
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-brand-tagline)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {leftIcon}
        </div>
      )}

      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        className={`${className} password-input`}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        style={{
          width: '100%',
          paddingLeft: leftIcon ? '2.5rem' : undefined,
          paddingRight: '2.75rem',
          ...style,
        }}
      />

      <button
        type="button"
        className="password-toggle-btn"
        onClick={toggleVisibility}
        aria-label={showPassword ? 'Hide Password' : 'Show Password'}
        title={showPassword ? 'Hide Password' : 'Show Password'}
        tabIndex={0}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-brand-tagline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.2rem',
          borderRadius: '6px',
          zIndex: 2,
        }}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
