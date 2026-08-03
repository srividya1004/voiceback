import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  registerPatientProfile,
  registerDoctorProfile,
  registerCaregiverProfile,
} from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem('vb_user_role') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('vb_logged_in') === 'true');
  const [loading, setLoading] = useState(true);

  // Restore authenticated session state from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('vb_auth_token');
      const storedUser = localStorage.getItem('vb_user');
      const storedRole = localStorage.getItem('vb_user_role');
      const storedLoggedIn = localStorage.getItem('vb_logged_in') === 'true';

      if (storedToken && storedUser && storedLoggedIn && storedRole) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Select access role
  const selectRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('vb_user_role', newRole);
  };

  // Authenticate login for target role
  const login = async (email, password, expectedRole) => {
    const data = await loginUser(email, password);

    if (expectedRole && data.user.role !== expectedRole) {
      throw new Error(`Account role '${data.user.role}' does not match expected role '${expectedRole}'`);
    }

    setToken(data.token);
    setUser(data.user);
    setRole(data.user.role);
    setIsLoggedIn(true);

    localStorage.setItem('vb_auth_token', data.token);
    localStorage.setItem('vb_user', JSON.stringify(data.user));
    localStorage.setItem('vb_user_role', data.user.role);
    localStorage.setItem('vb_logged_in', 'true');
    localStorage.setItem('vb_onboarding_completed', 'true');

    return data;
  };

  // Patient Registration
  const registerPatient = async (formData) => {
    const loginRes = await registerUser({
      email: formData.email,
      passwordHash: formData.password,
      role: 'Patient',
    });

    const createdUserId = loginRes.data._id || loginRes.data.id;

    await registerPatientProfile({
      userId: createdUserId,
      fullName: formData.fullName,
      age: Number(formData.age),
      aphasiaType: formData.aphasiaType,
    });

    localStorage.setItem('vb_patient_intro_completed', 'true');
    return loginRes.data;
  };

  // Doctor Registration
  const registerDoctor = async (formData) => {
    const loginRes = await registerUser({
      email: formData.email,
      passwordHash: formData.password,
      role: 'Doctor',
    });

    const createdUserId = loginRes.data._id || loginRes.data.id;

    await registerDoctorProfile({
      userId: createdUserId,
      fullName: formData.fullName,
      specialization: formData.specialization,
      hospital: formData.hospital,
      contactNumber: formData.contactNumber,
    });

    return loginRes.data;
  };

  // Caregiver Registration
  const registerCaregiver = async (formData) => {
    const loginRes = await registerUser({
      email: formData.email,
      passwordHash: formData.password,
      role: 'Caregiver',
    });

    const createdUserId = loginRes.data._id || loginRes.data.id;

    await registerCaregiverProfile({
      userId: createdUserId,
      fullName: formData.fullName,
      relationship: formData.relationship,
      contactNumber: formData.contactNumber,
    });

    return loginRes.data;
  };

  // Log Out (remains in current role for login)
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsLoggedIn(false);
    localStorage.setItem('vb_logged_in', 'false');
    localStorage.removeItem('vb_auth_token');
    localStorage.removeItem('vb_user');
  };

  // Switch Account (clears role to show Role Selection)
  const switchAccount = () => {
    logout();
    setRole(null);
    localStorage.removeItem('vb_user_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoggedIn,
        loading,
        selectRole,
        login,
        registerPatient,
        registerDoctor,
        registerCaregiver,
        logout,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
