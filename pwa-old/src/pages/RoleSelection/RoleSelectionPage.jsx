import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { VoiceBackLogo } from '../../components/VoiceBackLogo';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { User, Stethoscope, Heart, ArrowRight } from 'lucide-react';

export const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { t } = useAccessibility();
  const { selectRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState('Patient');

  const roles = [
    {
      id: 'Patient',
      title: t('rolePatientTitle'),
      description: t('rolePatientDesc'),
      icon: User,
      color: 'var(--color-blue)',
    },
    {
      id: 'Doctor',
      title: t('roleDoctorTitle'),
      description: t('roleDoctorDesc'),
      icon: Stethoscope,
      color: 'var(--color-green)',
    },
    {
      id: 'Caregiver',
      title: t('roleCaregiverTitle'),
      description: t('roleCaregiverDesc'),
      icon: Heart,
      color: 'var(--color-danger)',
    },
  ];

  const handleProceed = () => {
    selectRole(selectedRole);

    if (selectedRole === 'Patient') {
      // Patient -> Patient Introduction
      navigate('/patient/intro');
    } else if (selectedRole === 'Doctor') {
      // Doctor -> Doctor Registration
      navigate('/doctor/register');
    } else if (selectedRole === 'Caregiver') {
      // Caregiver -> Caregiver Registration
      navigate('/caregiver/register');
    }
  };

  return (
    <div className="center-view animate-fade-in" style={{ padding: '1.5rem 0.5rem' }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'center' }}>
          <VoiceBackLogo width="220px" />
        </div>

        <h1 style={{ textAlign: 'center', color: 'var(--color-blue)', marginBottom: '0.4rem' }}>
          {t('selectRoleTitle')}
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {t('selectRoleSubtitle')}
        </p>

        {/* Three Role Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.2rem',
          marginBottom: '2.2rem',
        }}>
          {roles.map((r) => {
            const IconComp = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <Card
                key={r.id}
                selected={isSelected}
                onClick={() => setSelectedRole(r.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1.8rem 1.2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? r.color : 'var(--bg-app)',
                  color: isSelected ? '#ffffff' : r.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  transition: 'all 0.3s ease',
                }}>
                  <IconComp size={30} />
                </div>
                <h3 style={{ marginBottom: '0.4rem' }}>{r.title}</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                  {r.description}
                </p>
              </Card>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleProceed}
            size="large"
            style={{ width: '100%', maxWidth: '340px' }}
          >
            <span>{t('submitContinue')}</span>
            <ArrowRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};
