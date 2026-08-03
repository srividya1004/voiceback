import React, { useEffect, useRef } from 'react';

/**
 * Animated Voice Waveform Component
 * Renders smooth sEMG silent speech waveforms with blue/green brand gradient curves.
 */
export const WaveformAnimation = ({ isPlaying = true, height = 100 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const centerY = canvas.height / 2;

      const waves = [
        { amplitude: 22, frequency: 0.02, speed: 0.06, color: 'rgba(0, 94, 184, 0.85)' },
        { amplitude: 16, frequency: 0.03, speed: 0.04, color: 'rgba(26, 188, 156, 0.75)' },
        { amplitude: 10, frequency: 0.015, speed: 0.03, color: 'rgba(52, 152, 219, 0.5)' },
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = wave.color;

        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * wave.frequency + phase * wave.speed) * wave.amplitude * envelope;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      if (isPlaying) {
        phase += 1;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || 400;
        canvas.height = height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, height]);

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '1rem auto' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', borderRadius: '16px' }} />
    </div>
  );
};
