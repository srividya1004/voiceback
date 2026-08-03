import React from 'react';
import { useLocation } from 'react-router-dom';
import { AccessibilityBar } from '../components/AccessibilityBar';
import { useAccessibility } from '../context/AccessibilityContext';

export const MainLayout = ({ children }) => {
  const { t } = useAccessibility();
  const location = useLocation();

  const isSplashPage = location.pathname === '/';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Header displayed on all pages except Splash */}
      {!isSplashPage && <AccessibilityBar />}

      <main className="app-container" style={{ padding: isSplashPage ? 0 : undefined }}>
        {children}
      </main>

      {!isSplashPage && (
        <footer style={{
          textAlign: 'center',
          padding: '1rem',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto',
        }}>
          {t('footerText')}
        </footer>
      )}
    </div>
  );
};
