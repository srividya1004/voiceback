import React from 'react';
import { ArrowLeft, User, Activity, CheckCircle } from 'lucide-react';
import VoiceBackLogo from './VoiceBackLogo';

export const PatientDashboardPlaceholder = ({ onLogout }) => {
  return (
    <div className="app-viewport">
      <div className="mobile-container" style={{ justifyContent: 'flex-start', gap: '1.5rem' }}>
        <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <VoiceBackLogo variant="header" />
          {onLogout && (
            <button
              type="button"
              className="btn-secondary-auth"
              style={{ width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
              onClick={onLogout}
            >
              Sign Out
            </button>
          )}
        </header>

        <main className="role-main" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div className="placeholder-card" style={{ width: '100%', maxWidth: '420px' }}>
            <span className="placeholder-badge">Patient Portal</span>
            <h1 className="placeholder-title" style={{ fontSize: '1.6rem', marginTop: '0.5rem' }}>
              Patient Dashboard
            </h1>
            <p className="placeholder-desc">
              Welcome to your VoiceBack recovery dashboard!
            </p>
            <div style={{ padding: '1rem', background: 'rgba(2, 132, 199, 0.08)', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.2)', marginBottom: '1.5rem' }}>
              <Activity size={32} color="var(--color-blue-primary)" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-title)' }}>
                Recovery & Therapy Module Coming Soon
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDashboardPlaceholder;
