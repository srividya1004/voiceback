import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { VoiceBackLogo } from '../../components/VoiceBackLogo';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { LogOut, UserCheck } from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { roleType } = useParams();
  const { role, logout, switchAccount } = useAuth();
  const { t } = useAccessibility();

  const currentRole = roleType || role || 'patient';
  const formattedRole = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  const handleLogout = () => {
    logout();
    navigate(`/${currentRole.toLowerCase()}/login`);
  };

  const handleSwitchAccount = () => {
    switchAccount();
    navigate('/role-selection');
  };

  return (
    <div className="center-view animate-fade-in" style={{ padding: '2rem 1rem' }}>
      <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <VoiceBackLogo width="220px" />
        </div>

        {/* Clean Master Spec Placeholder */}
        <h2 style={{ color: 'var(--color-blue)', marginBottom: '1rem', fontSize: 'var(--font-size-xl)' }}>
          {formattedRole} Dashboard – Phase 2
        </h2>

        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '2.2rem' }}>
          Phase 1 Authentication & Role Setup Completed.
        </p>

        {/* Action Buttons: Sign Out & Switch Account */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'center' }}>
          <Button
            onClick={handleLogout}
            variant="secondary"
            style={{ width: '100%', maxWidth: '280px' }}
          >
            <LogOut size={16} />
            <span>{t('signOut')}</span>
          </Button>

          <button
            onClick={handleSwitchAccount}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-blue)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            {t('switchAccount')}
          </button>
        </div>
      </Card>
    </div>
  );
};
