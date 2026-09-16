import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Mic,
  Square,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Volume2,
  Heart,
  Calendar,
  User,
  MessageSquare,
  AlertCircle,
  Loader2,
  HelpCircle
} from 'lucide-react';
import scriptService from '../services/scriptService';
import authService from '../services/authService';
import { useSettings } from '../context/SettingsContext';
import { useMicrophoneCapture } from '../hooks/useMicrophoneCapture';

/**
 * Hear-Yourself Script Training Therapy Module
 * Enables patients to practice personally meaningful sentences, receive AI speech
 * reconstruction with closeness scoring, and hear their attempt played back in their
 * own cloned voice (or honest demographic fallback).
 */
export const ScriptTrainingModule = ({
  patientId: propPatientId,
  patientName = 'Patient',
  onBackToDashboard,
  onOpenProfile,
  onLogout
}) => {
  const { t, voiceAssistant, speak } = useSettings();

  // Active View: 'list' | 'add' | 'practice' | 'result'
  const [viewState, setViewState] = useState('list');

  // Authenticated Patient Resolution
  const [session] = useState(() => authService.getActiveSession() || {});
  const effectivePatientId = propPatientId ||
    (session?.role === 'patient' ? (session?.user?.profile?._id || session?.user?.id || session?.patientId) : null);

  // Scripts List State
  const [scripts, setScripts] = useState([]);
  const [isLoadingScripts, setIsLoadingScripts] = useState(true);
  const [scriptErrorMessage, setScriptErrorMessage] = useState('');

  // Add Script Form State
  const [newScriptText, setNewScriptText] = useState('');
  const [newScriptCategory, setNewScriptCategory] = useState('general');
  const [isSavingScript, setIsSavingScript] = useState(false);

  // Active Practice Script
  const [activeScript, setActiveScript] = useState(null);

  // Attempt & Playback State
  const [isProcessingAttempt, setIsProcessingAttempt] = useState(false);
  const [practiceError, setPracticeError] = useState('');
  const [attemptResult, setAttemptResult] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const currentAudioRef = useRef(null);

  // Reusable VoiceBack Microphone Capture Hook
  const {
    isRecording,
    recordingDuration: recordingSeconds,
    error: micError,
    startRecording: handleStartRecording,
    stopRecording: handleStopRecording,
    clearError: clearMicError
  } = useMicrophoneCapture({
    onAudioCaptured: async (audioBlob) => {
      setIsProcessingAttempt(true);
      setPracticeError('');
      try {
        const response = await scriptService.submitAttempt(activeScript._id, audioBlob);
        setAttemptResult(response);
        setViewState('result');
      } catch (err) {
        console.warn('Script attempt notice:', err.message);
        setPracticeError(err.message || 'Could not process practice attempt. Please try speaking again.');
      } finally {
        setIsProcessingAttempt(false);
      }
    },
    onError: (errMsg) => {
      setPracticeError(errMsg);
    }
  });

  // Quick categories
  const categories = [
    { id: 'general', label: 'General' },
    { id: 'family', label: 'Family' },
    { id: 'daily_routine', label: 'Daily Routine' },
    { id: 'identity', label: 'Identity' },
  ];

  // Example personalized prompt ideas for inspiration
  const sampleSuggestions = [
    'I love my daughter Meera.',
    'I want to go home.',
    'I would like some water.',
    'I am feeling happy today.',
    'Thank you for helping me.'
  ];

  // 1. Fetch Scripts on Mount
  const loadScripts = async () => {
    if (!effectivePatientId) {
      setIsLoadingScripts(false);
      return;
    }
    setIsLoadingScripts(true);
    setScriptErrorMessage('');
    try {
      const data = await scriptService.getScripts(effectivePatientId);
      setScripts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load personal scripts:', err.message);
      setScriptErrorMessage('Could not load scripts. Please try again.');
    } finally {
      setIsLoadingScripts(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, [effectivePatientId]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  // Handler: Start Practice for a Script
  const handleStartPractice = (script) => {
    setActiveScript(script);
    setAttemptResult(null);
    setPracticeError('');
    clearMicError();
    setViewState('practice');
    if (voiceAssistant && speak) {
      speak(`Practice sentence: ${script.text}`);
    }
  };

  // Handler: Save New Script
  const handleSaveScript = async (e) => {
    if (e) e.preventDefault();
    if (!newScriptText.trim()) return;

    setIsSavingScript(true);
    setScriptErrorMessage('');
    try {
      const created = await scriptService.createScript(
        effectivePatientId,
        newScriptText.trim(),
        newScriptCategory
      );
      setScripts((prev) => [created, ...prev]);
      setNewScriptText('');
      setNewScriptCategory('general');
      setViewState('list');
      if (voiceAssistant && speak) {
        speak('Personal script saved.');
      }
    } catch (err) {
      console.warn('Save script notice:', err.message);
      setScriptErrorMessage(err.message || 'Failed to save script.');
    } finally {
      setIsSavingScript(false);
    }
  };

  // Handler: Delete Script (Soft Deactivate)
  const handleDeleteScript = async (scriptId, e) => {
    if (e) e.stopPropagation();
    try {
      await scriptService.deleteScript(scriptId);
      setScripts((prev) => prev.filter((s) => s._id !== scriptId));
    } catch (err) {
      console.warn('Delete script notice:', err.message);
    }
  };

  // Handler: Play Audio Returned from Attempt (No Duplicate TTS Generation)
  const handlePlayReturnedAudio = () => {
    if (!attemptResult || !attemptResult.audioBase64) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    try {
      const audio = new Audio(attemptResult.audioBase64);
      currentAudioRef.current = audio;

      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);

      audio.play().catch((err) => {
        console.warn('Audio play notice:', err.message);
        setIsPlayingAudio(false);
      });
    } catch (e) {
      console.warn('Audio playback error:', e.message);
      setIsPlayingAudio(false);
    }
  };

  // Helper: Friendly Feedback for Closeness Score
  const getScoreFeedback = (score) => {
    if (score >= 90) {
      return { label: 'Great match!', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.12)' };
    }
    if (score >= 70) {
      return { label: 'Excellent progress!', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)' };
    }
    if (score >= 40) {
      return { label: "You're getting closer!", color: '#CA8A04', bg: 'rgba(202, 138, 4, 0.12)' };
    }
    return { label: 'Keep practicing!', color: '#9333EA', bg: 'rgba(147, 51, 234, 0.12)' };
  };

  // ============================================================
  // RENDER: SCREEN A — SCRIPT LIST
  // ============================================================
  if (viewState === 'list') {
    return (
      <div className="app-viewport">
        <div className="mobile-container dashboard-container">
          <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="settings-btn"
              onClick={onBackToDashboard}
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
            >
              <ArrowLeft size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={20} color="var(--color-blue-primary)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Hear Yourself</h2>
            </div>
            <div style={{ width: 22 }} />
          </header>

          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
            {/* Intro Hero Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
                border: '1.5px solid var(--color-blue-primary)',
                borderRadius: '20px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                  Script Training
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', margin: '0.25rem 0 0 0' }}>
                  Practice meaningful sentences and hear your intended words spoken aloud in your own voice.
                </p>
              </div>
              <button
                type="button"
                className="btn-continue"
                onClick={() => setViewState('add')}
                style={{
                  padding: '0.65rem 1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus size={18} />
                <span>Add Script</span>
              </button>
            </div>

            {scriptErrorMessage && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#DC2626', fontSize: '0.85rem', fontWeight: 600 }}>
                {scriptErrorMessage}
              </div>
            )}

            {/* Script List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-brand-tagline)' }}>
                  Your Practice Sentences ({scripts.length})
                </span>
              </div>

              {isLoadingScripts ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-brand-tagline)' }}>
                  <Loader2 size={32} className="spin-anim" style={{ margin: '0 auto 0.5rem auto' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading your personal scripts...</p>
                </div>
              ) : scripts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1.5rem',
                    background: '#FFFFFF',
                    borderRadius: '18px',
                    border: '1.5px dashed var(--border-color)'
                  }}
                >
                  <MessageSquare size={36} color="var(--color-brand-tagline)" style={{ margin: '0 auto 0.6rem auto', opacity: 0.6 }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                    No personal scripts yet
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', margin: '0.3rem 0 1.25rem 0' }}>
                    Add phrases you want to practice — like "I love my family" or "I want water".
                  </p>
                  <button
                    type="button"
                    className="btn-continue"
                    onClick={() => setViewState('add')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
                  >
                    <Plus size={18} />
                    <span>Create Your First Script</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {scripts.map((script) => (
                    <div
                      key={script._id}
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '18px',
                        padding: '1.1rem 1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '8px',
                              background: 'rgba(2, 132, 199, 0.08)',
                              color: 'var(--color-blue-primary)',
                              marginBottom: '0.35rem'
                            }}
                          >
                            {script.category || 'General'}
                          </span>
                          <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-brand-title)', lineHeight: 1.35 }}>
                            "{script.text}"
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteScript(script._id, e)}
                          title="Delete script"
                          aria-label="Delete script"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <button
                          type="button"
                          className="ultra-btn-confirm"
                          onClick={() => handleStartPractice(script)}
                          style={{ flex: 1, padding: '0.65rem 1rem', fontSize: '0.9rem' }}
                        >
                          <Mic size={18} />
                          <span>Practice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: SCREEN B — ADD SCRIPT
  // ============================================================
  if (viewState === 'add') {
    return (
      <div className="app-viewport">
        <div className="mobile-container dashboard-container">
          <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="settings-btn"
              onClick={() => setViewState('list')}
              aria-label="Cancel"
              title="Cancel"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Add Personal Script</h2>
            <div style={{ width: 22 }} />
          </header>

          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.75rem' }}>
            <form onSubmit={handleSaveScript} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand-title)', marginBottom: '0.4rem' }}>
                  Sentence You Want to Practice:
                </label>
                <textarea
                  value={newScriptText}
                  onChange={(e) => setNewScriptText(e.target.value)}
                  placeholder="e.g. I love my daughter Meera."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    border: '2px solid var(--border-color)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--color-brand-title)',
                    background: '#FFFFFF',
                    resize: 'none',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              {/* Category Pills */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-brand-title)', marginBottom: '0.4rem' }}>
                  Category:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewScriptCategory(cat.id)}
                      style={{
                        padding: '0.5rem 0.85rem',
                        borderRadius: '12px',
                        border: newScriptCategory === cat.id ? '2px solid var(--color-blue-primary)' : '1.5px solid var(--border-color)',
                        background: newScriptCategory === cat.id ? 'rgba(2, 132, 199, 0.1)' : '#FFFFFF',
                        color: newScriptCategory === cat.id ? 'var(--color-blue-primary)' : 'var(--color-brand-title)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-brand-tagline)', marginBottom: '0.4rem' }}>
                  Need ideas? Tap to select:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {sampleSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewScriptText(suggestion)}
                      style={{
                        textAlign: 'left',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '10px',
                        background: 'rgba(2, 132, 199, 0.04)',
                        border: '1px solid rgba(2, 132, 199, 0.15)',
                        fontSize: '0.9rem',
                        color: 'var(--color-brand-title)',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn-continue"
                  disabled={!newScriptText.trim() || isSavingScript}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {isSavingScript ? <Loader2 size={18} className="spin-anim" /> : <CheckCircle2 size={18} />}
                  <span>{isSavingScript ? 'Saving...' : 'Save Script'}</span>
                </button>
                <button
                  type="button"
                  className="ultra-btn-cancel"
                  onClick={() => setViewState('list')}
                  style={{ padding: '0.8rem 1.25rem' }}
                >
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: SCREEN C — PRACTICE
  // ============================================================
  if (viewState === 'practice') {
    return (
      <div className="app-viewport">
        <div className="mobile-container dashboard-container">
          <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="settings-btn"
              onClick={() => {
                handleStopRecording();
                setViewState('list');
              }}
              aria-label="Back to Scripts"
              title="Back to Scripts"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Practice Sentence</h2>
            <div style={{ width: 22 }} />
          </header>

          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.75rem', alignItems: 'center' }}>
            {/* Target Script Card */}
            <div
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%)',
                border: '2px solid var(--color-blue-primary)',
                borderRadius: '20px',
                padding: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.06)'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-blue-primary)', display: 'block', marginBottom: '0.5rem' }}>
                Target Sentence
              </span>
              <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-brand-title)', lineHeight: 1.35 }}>
                "{activeScript?.text}"
              </h3>
            </div>

            {/* Prompt Instruction */}
            <p style={{ fontSize: '0.95rem', color: 'var(--color-brand-tagline)', textAlign: 'center', margin: '0 0.5rem' }}>
              Tap the microphone and try speaking the sentence above at your own pace.
            </p>

            {practiceError && (
              <div style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 14, background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid #EF4444', color: '#DC2626', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
                {practiceError}
              </div>
            )}

            {/* Microphone State Stage */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              {isProcessingAttempt ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem' }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'rgba(2, 132, 199, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-blue-primary)'
                    }}
                  >
                    <Loader2 size={40} className="spin-anim" />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-brand-title)', margin: 0 }}>
                    Analyzing Speech...
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', margin: 0 }}>
                    Reconstructing your words and preparing your voice.
                  </p>
                </div>
              ) : isRecording ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div
                    onClick={handleStopRecording}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      background: '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      boxShadow: '0 0 0 12px rgba(220, 38, 38, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Square size={36} fill="#FFFFFF" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>
                      Listening... {recordingSeconds}s
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', margin: '0.2rem 0 0 0' }}>
                      Tap the red button when finished.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div
                    onClick={handleStartRecording}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: '50%',
                      background: 'var(--color-blue-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <Mic size={40} strokeWidth={2.5} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                      Tap to Speak
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', margin: '0.2rem 0 0 0' }}>
                      Say: "{activeScript?.text}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="ultra-btn-cancel"
              onClick={() => {
                handleStopRecording();
                setViewState('list');
              }}
              style={{ marginTop: '1.5rem', width: '100%', maxWidth: '240px' }}
            >
              <span>Back to Scripts</span>
            </button>
          </main>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: SCREEN D — RESULT
  // ============================================================
  if (viewState === 'result') {
    const feedback = getScoreFeedback(attemptResult?.closenessScore || 0);

    return (
      <div className="app-viewport">
        <div className="mobile-container dashboard-container">
          <header className="role-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="settings-btn"
              onClick={() => setViewState('list')}
              aria-label="Back to Scripts"
              title="Back to Scripts"
            >
              <ArrowLeft size={22} />
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Practice Results</h2>
            <div style={{ width: 22 }} />
          </header>

          <main className="role-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.75rem' }}>
            {/* Closeness Score Banner */}
            <div
              style={{
                background: feedback.bg,
                border: `2px solid ${feedback.color}`,
                borderRadius: '20px',
                padding: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: feedback.color }}>
                {feedback.label}
              </span>
              <h3 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: feedback.color }}>
                {attemptResult?.closenessScore ?? 0}%
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
                Closeness to target sentence
              </span>
            </div>

            {/* Target vs Attempt vs Reconstructed Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Target Sentence */}
              <div style={{ padding: '0.85rem 1rem', borderRadius: 14, background: '#FFFFFF', border: '1.5px solid var(--border-color)' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-brand-tagline)', marginBottom: '0.2rem' }}>
                  Target Sentence:
                </span>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  "{activeScript?.text}"
                </p>
              </div>

              {/* Raw STT Attempt (De-emphasized) */}
              <div style={{ padding: '0.75rem 1rem', borderRadius: 14, background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--border-color)' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-brand-tagline)', marginBottom: '0.2rem' }}>
                  What was heard (raw audio):
                </span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-brand-tagline)', fontStyle: 'italic' }}>
                  "{attemptResult?.rawTranscript || '—'}"
                </p>
              </div>

              {/* Reconstructed Intended Sentence (Prominent) */}
              <div style={{ padding: '1rem 1.1rem', borderRadius: 16, background: 'rgba(2, 132, 199, 0.08)', border: '1.5px solid var(--color-blue-primary)' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-blue-primary)', marginBottom: '0.25rem' }}>
                  VoiceBack Understood:
                </span>
                <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-brand-title)', lineHeight: 1.35 }}>
                  "{attemptResult?.reconstructedText}"
                </p>
              </div>
            </div>

            {/* Play Audio Button (Plays pre-generated audio, NO second TTS call) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="ultra-btn-confirm"
                onClick={handlePlayReturnedAudio}
                disabled={isPlayingAudio || !attemptResult?.audioBase64}
                style={{
                  padding: '1rem 1.25rem',
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem'
                }}
              >
                <Volume2 size={24} />
                <span>
                  {isPlayingAudio
                    ? 'Playing...'
                    : attemptResult?.isClonedVoice
                    ? 'Play in my voice'
                    : 'Play response'}
                </span>
              </button>

              {/* Honest Voice Attribution Label */}
              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-brand-tagline)' }}>
                {attemptResult?.isClonedVoice ? (
                  <span style={{ color: '#16A34A', fontWeight: 700 }}>
                    ✨ Generated in your personal cloned voice
                  </span>
                ) : (
                  <span>
                    ℹ️ Using natural demographic speech preset
                  </span>
                )}
              </div>
            </div>

            {/* Actions: Practice Again or Return to List */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn-continue"
                onClick={() => setViewState('practice')}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <RotateCcw size={18} />
                <span>Practice Again</span>
              </button>
              <button
                type="button"
                className="ultra-btn-change"
                onClick={() => setViewState('list')}
                style={{ padding: '0.75rem 1.25rem' }}
              >
                <span>Back to Scripts</span>
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return null;
};

export default ScriptTrainingModule;
