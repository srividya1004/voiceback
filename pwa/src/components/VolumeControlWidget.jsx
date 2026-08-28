import React, { useState, useEffect } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import deviceService from '../services/deviceService';

export const VolumeControlWidget = ({ style = {} }) => {
  const [deviceStatus, setDeviceStatus] = useState(() => deviceService.getDeviceStatus());

  useEffect(() => {
    const unsubscribe = deviceService.subscribe((status) => {
      setDeviceStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const currentVolume = deviceStatus.volume ?? 70;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    deviceService.setVolume(val);
  };

  const handleVolumeDown = () => {
    deviceService.volumeDown(10);
  };

  const handleVolumeUp = () => {
    deviceService.volumeUp(10);
  };

  return (
    <div
      className="volume-control-card"
      style={{
        width: '100%',
        background: '#0F172A',
        borderRadius: '16px',
        padding: '1rem',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        ...style,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {currentVolume === 0 ? (
            <VolumeX size={20} color="#EF4444" />
          ) : currentVolume < 50 ? (
            <Volume1 size={20} color="#38BDF8" />
          ) : (
            <Volume2 size={20} color="#38BDF8" />
          )}
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.02em' }}>
            Speaker Volume
          </span>
        </div>
        <span
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#38BDF8',
            fontFamily: 'monospace',
            background: 'rgba(56, 189, 248, 0.15)',
            padding: '0.2rem 0.65rem',
            borderRadius: '8px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}
        >
          {currentVolume}%
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={handleVolumeDown}
          aria-label="Volume Down"
          title="Decrease Volume"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '0.6rem 0.85rem',
            color: '#F8FAFC',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            touchAction: 'manipulation',
            transition: 'background 0.15s ease',
          }}
        >
          <Volume1 size={18} />
          <span>Vol -</span>
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={currentVolume}
            onChange={handleSliderChange}
            aria-label="Speaker Volume Slider"
            style={{
              width: '100%',
              height: '8px',
              accentColor: '#38BDF8',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleVolumeUp}
          aria-label="Volume Up"
          title="Increase Volume"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '0.6rem 0.85rem',
            color: '#F8FAFC',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            touchAction: 'manipulation',
            transition: 'background 0.15s ease',
          }}
        >
          <Volume2 size={18} />
          <span>Vol +</span>
        </button>
      </div>
    </div>
  );
};

export default VolumeControlWidget;
