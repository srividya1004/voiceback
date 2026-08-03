import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import './styles/global.css';

export function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;
