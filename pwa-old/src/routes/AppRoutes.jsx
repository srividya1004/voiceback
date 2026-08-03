import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { SplashPage } from '../pages/Splash/SplashPage';
import { IntroPage } from '../pages/Intro/IntroPage';
import { RoleSelectionPage } from '../pages/RoleSelection/RoleSelectionPage';
import { PatientRegisterPage } from '../pages/PatientAuth/PatientRegisterPage';
import { PatientLoginPage } from '../pages/PatientAuth/PatientLoginPage';
import { DoctorRegisterPage } from '../pages/DoctorAuth/DoctorRegisterPage';
import { DoctorLoginPage } from '../pages/DoctorAuth/DoctorLoginPage';
import { CaregiverRegisterPage } from '../pages/CaregiverAuth/CaregiverRegisterPage';
import { CaregiverLoginPage } from '../pages/CaregiverAuth/CaregiverLoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';

export const AppRoutes = () => {
  return (
    <MainLayout>
      <Routes>
        {/* Splash Screen */}
        <Route path="/" element={<SplashPage />} />

        {/* Role Selection */}
        <Route path="/role-selection" element={<RoleSelectionPage />} />

        {/* Patient Introduction (ONLY for Patients) */}
        <Route path="/patient/intro" element={<IntroPage />} />

        {/* Patient Authentication */}
        <Route path="/patient/register" element={<PatientRegisterPage />} />
        <Route path="/patient/login" element={<PatientLoginPage />} />

        {/* Doctor Authentication */}
        <Route path="/doctor/register" element={<DoctorRegisterPage />} />
        <Route path="/doctor/login" element={<DoctorLoginPage />} />

        {/* Caregiver Authentication */}
        <Route path="/caregiver/register" element={<CaregiverRegisterPage />} />
        <Route path="/caregiver/login" element={<CaregiverLoginPage />} />

        {/* Placeholder Dashboards */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/:roleType" element={<DashboardPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};
