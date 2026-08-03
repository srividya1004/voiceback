import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const PasswordField = ({
  label,
  name = 'password',
  value,
  onChange,
  placeholder = '••••••••',
  error = false,
  errorMsg = null,
  required = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="form-group" style={{ position: 'relative', width: '100%' }}>
      <label className="form-label">{label} {required && '*'}</label>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          className={`form-input ${error ? 'field-error' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{ paddingRight: '2.8rem' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide Password' : 'Show Password'}
          style={{
            position: 'absolute',
            right: '0.8rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.2rem',
          }}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {error && errorMsg && <span className="field-error-msg">{errorMsg}</span>}
    </div>
  );
};
