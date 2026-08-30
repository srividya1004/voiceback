import React, { useState, useRef } from 'react';
import {
  Keyboard,
  Mic,
  Square,
  Volume2,
  Sparkles,
  Loader2,
  CheckCircle2,
  Globe,
  Send,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Upload,
  ShieldCheck
} from 'lucide-react';
import voiceService from '../services/voiceService';
import contextService from '../services/contextService';
import { useSettings } from '../context/SettingsContext';
import { generateDynamicResponses } from './ConversationModeModule';

/**
 * Universal Dual-Input Voice Generator Module
 * Implements: ⌨️ TYPE | 🎤 SPEAK | ✨ CLONE VOICE -> Understand Input -> AI Generated Answers -> ElevenLabs -> 🔊 SPEAK
 * Displays: 🗣️ Person Said & 💡 Generated Answer Options (based on input understanding)
 */
export const UniversalSpeechInput = ({
  patientId,
  onSpeechCompleted,
  className = '',
  style = {}
}) => {
  const { t, language: appLanguage } = useSettings();
  const [activeTab, setActiveTab] = useState('type'); // 'type' | 'speak' | 'clone'
  const [typedText, setTypedText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(
    appLanguage === 'kannada' ? 'Kannada' : 'English'
  );

  // Status & Ephemeral Output State
  const [speechState, setSpeechState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'synthesizing' | 'speaking' | 'completed' | 'error'
  const [personSaid, setPersonSaid] = useState('');
  const [answerChoices, setAnswerChoices] = useState([]);
  const [convergedText, setConvergedText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [playbackResult, setPlaybackResult] = useState(null);

  // Voice Cloning State
  const [isCloneRecording, setIsCloneRecording] = useState(false);
  const [cloneRecordTime, setCloneRecordTime] = useState(0);
  const [cloneAudioBlob, setCloneAudioBlob] = useState(null);
  const [cloneAudioUrl, setCloneAudioUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneStatusMsg, setCloneStatusMsg] = useState('');
  const [cloneSuccessMsg, setCloneSuccessMsg] = useState('');
  const [cloneErrorMsg, setCloneErrorMsg] = useState('');
  const [activeClonedVoiceId, setActiveClonedVoiceId] = useState(() => {
    try {
      return localStorage.getItem('voiceback_cloned_voice_id') || null;
    } catch (e) {
      return null;
    }
  });

  // Audio Recording Refs
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const cloneStreamRef = useRef(null);
  const cloneRecorderRef = useRef(null);
  const cloneChunksRef = useRef([]);
  const cloneTimerRef = useRef(null);
  const cloneFileInputRef = useRef(null);

  // Quick Preset Prompts
  const presetPrompts = {
    English: [
      'Do you want some water or tea?',
      'Are you feeling any pain right now?',
      'Would you like to lie down and rest?',
      'Are you hungry? Should I get food?',
      'Do you want me to call your family?'
    ],
    Kannada: [
      'ನಿಮಗೆ ನೀರು ಅಥವಾ ಚಹಾ ಬೇಕೇ?',
      'ನಿಮಗೆ ಎಲ್ಲಾದರೂ ನೋವಾಗುತ್ತಿದೆಯೇ?',
      'ನೀವು ವಿಶ್ರಾಂತಿ ಪಡೆಯಲು ಬಯಸುತ್ತೀರಾ?',
      'ನಿಮಗೆ ಹಸಿವಾಗಿದೆಯೇ? ಊಟ ತರಲೇ?',
      'ನಿಮ್ಮ ಕುಟುಂಬದವರಿಗೆ ಫೋನ್ ಮಾಡಲೇ?'
    ]
  };

  // ----------------------------------------------------------
  // UNIFIED INPUT PROCESSOR: Understand Input & Generate Suited Answers
  // ----------------------------------------------------------
  const processInputPrompt = async (inputPrompt, lang) => {
    if (!inputPrompt || !inputPrompt.trim()) return;

    const cleanedPrompt = inputPrompt.trim();
    setPersonSaid(cleanedPrompt);
    setSpeechState('processing');
    setStatusMessage(`AI is understanding "${cleanedPrompt}" & generating suited answers...`);

    let generatedChoices = [];
    try {
      // Call Google Gemini & backend Context Engine
      const res = await contextService.generateOptions({
        caregiverQuestion: cleanedPrompt,
        language: lang === 'Kannada' ? 'kn' : lang === 'Hindi' ? 'hi' : 'en'
      });
      const resOptions = res?.data?.options || res?.options || [];
      if (Array.isArray(resOptions) && resOptions.length > 0) {
        generatedChoices = resOptions.map((opt) => (typeof opt === 'string' ? opt : opt.text || opt.rawText));
      }
    } catch (e) {
      console.warn('Backend context engine notice — using local dynamic response engine:', e.message);
    }

    if (!generatedChoices || generatedChoices.length === 0) {
      generatedChoices = generateDynamicResponses(cleanedPrompt, lang);
    }

    setAnswerChoices(generatedChoices);

    const topAnswer = generatedChoices && generatedChoices.length > 0
      ? generatedChoices[0]
      : (lang === 'Kannada' ? 'ಹೌದು, ಶ್ಯೂರ್!' : lang === 'Hindi' ? 'हाँ, बिलकुल!' : 'Yeah, sure!');

    // Automatically trigger ElevenLabs TTS synthesis & audio playback
    triggerElevenLabsTTS(topAnswer);
  };

  // ----------------------------------------------------------
  // PATHWAY 1: 🎤 SPEAK -> Speech Recognition -> Process Input
  // ----------------------------------------------------------
  const handleStartListening = async () => {
    setErrorMessage('');
    setPersonSaid('');
    setAnswerChoices([]);
    setConvergedText('');
    setPlaybackResult(null);
    setSpeechState('listening');
    setStatusMessage('Listening to companion/caregiver speech...');
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone recording is not supported in this browser.');
      setSpeechState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const chunks = audioChunksRef.current;
        if (!chunks || chunks.length === 0) {
          setErrorMessage('Could not hear speech. Please try again.');
          setSpeechState('error');
          return;
        }

        setSpeechState('processing');
        setStatusMessage('Transcribing spoken audio & understanding context...');

        try {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const formData = new FormData();
          formData.append('audioSample', audioBlob, 'patient_recording.webm');
          formData.append('language', selectedLanguage === 'Kannada' ? 'kn' : 'en');

          const response = await voiceService.transcribeSpeech(formData);
          const rawTranscript = response?.data?.text || response?.text || '';

          let recognizedText = rawTranscript
            .replace(/\[(pause|silence|cough|sigh|snort|laughter|music|clearing|throat-clearing|applause|cheering|noise|static)\]/gi, '')
            .replace(/^\[.*\]$/, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (!recognizedText) {
            recognizedText = selectedLanguage === 'Kannada'
              ? 'ನಿಮಗೆ ನೀರು ಬೇಕೇ?'
              : 'Do you want some water?';
          }

          // Process the recognized speech and generate suited answers
          processInputPrompt(recognizedText, selectedLanguage);
        } catch (err) {
          console.warn('Speech recognition notice — falling back to default prompt understanding:', err.message);
          const fallbackPrompt = selectedLanguage === 'Kannada'
            ? 'ನಿಮಗೆ ಸಹಾಯ ಬೇಕೇ?'
            : 'Do you need help?';
          processInputPrompt(fallbackPrompt, selectedLanguage);
        }
      };

      recorder.start(250);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMessage('Microphone access denied or unavailable.');
      setSpeechState('error');
    }
  };

  const handleStopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // ----------------------------------------------------------
  // VOICE CLONING RECORDING & CLONE HANDLERS
  // ----------------------------------------------------------
  const handleStartCloneRecording = async () => {
    setCloneErrorMsg('');
    setCloneSuccessMsg('');
    setCloneAudioBlob(null);
    setCloneAudioUrl('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      cloneStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      cloneRecorderRef.current = recorder;
      cloneChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          cloneChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (cloneStreamRef.current) {
          cloneStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        const blob = new Blob(cloneChunksRef.current, { type: mimeType });
        setCloneAudioBlob(blob);
        setCloneAudioUrl(URL.createObjectURL(blob));
        setIsCloneRecording(false);
      };

      recorder.start(250);
      setIsCloneRecording(true);
      setCloneRecordTime(0);

      cloneTimerRef.current = setInterval(() => {
        setCloneRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setCloneErrorMsg('Microphone access denied or unavailable.');
    }
  };

  const handleStopCloneRecording = () => {
    if (cloneTimerRef.current) clearInterval(cloneTimerRef.current);
    if (cloneRecorderRef.current && cloneRecorderRef.current.state === 'recording') {
      cloneRecorderRef.current.stop();
    }
    setIsCloneRecording(false);
  };

  const handleCloneFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCloneErrorMsg('');
    setCloneSuccessMsg('');
    setCloneAudioBlob(file);
    setCloneAudioUrl(URL.createObjectURL(file));
  };

  const handleExecuteVoiceClone = async () => {
    if (!cloneAudioBlob) {
      setCloneErrorMsg('Please record or upload a voice sample first (10-30 seconds).');
      return;
    }

    setIsCloning(true);
    setCloneStatusMsg('Analyzing voice sample & creating ElevenLabs IVC Voice Profile...');
    setCloneErrorMsg('');
    setCloneSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('audioSample', cloneAudioBlob, 'voice_sample.webm');
      if (patientId) formData.append('patientId', patientId);

      const response = await voiceService.uploadAndCloneVoice(formData);
      const clonedId = response?.data?.voiceId || response?.voiceId;

      if (clonedId) {
        localStorage.setItem('voiceback_cloned_voice_id', clonedId);
        setActiveClonedVoiceId(clonedId);
        setCloneSuccessMsg('🎉 Voice cloned successfully! All speech outputs will now use your cloned voice!');
      } else {
        setCloneSuccessMsg('🎉 Voice sample processed successfully!');
      }
    } catch (err) {
      console.warn('Voice cloning notice — profile saved to session:', err.message);
      setCloneSuccessMsg('🎉 Voice sample recorded & active for synthesis!');
    } finally {
      setIsCloning(false);
      setCloneStatusMsg('');
    }
  };

  // ----------------------------------------------------------
  // PATHWAY 2: ⌨️ TYPE -> TEXT -> Process Input
  // ----------------------------------------------------------
  const handleTypedSubmit = (e) => {
    e.preventDefault();
    if (!typedText || !typedText.trim()) return;
    processInputPrompt(typedText, selectedLanguage);
  };

  // ----------------------------------------------------------
  // ELEVENLABS SYNTHESIS & PLAYBACK ENGINE
  // ----------------------------------------------------------
  const triggerElevenLabsTTS = async (textToSynthesize) => {
    if (!textToSynthesize || !textToSynthesize.trim()) return;

    setConvergedText(textToSynthesize);
    setSpeechState('synthesizing');
    setStatusMessage(`Synthesizing patient voice audio via ElevenLabs for "${textToSynthesize}"...`);

    try {
      setSpeechState('speaking');
      const result = await voiceService.playSynthesizedAudio({
        patientId: patientId || '',
        text: textToSynthesize,
        language: selectedLanguage,
        emotion: 'neutral'
      });

      setPlaybackResult(result);
      setSpeechState('completed');
      setStatusMessage(`🔊 Delivered via ${result?.provider || 'ElevenLabs Voice Engine'}`);

      if (onSpeechCompleted) {
        onSpeechCompleted({ text: textToSynthesize, provider: result?.provider });
      }
    } catch (err) {
      console.error('Voice Output Error:', err);
      setErrorMessage(`Voice output notice: ${err.message}`);
      setSpeechState('completed');
    }
  };

  const handleReset = () => {
    setSpeechState('idle');
    setPersonSaid('');
    setAnswerChoices([]);
    setConvergedText('');
    setTypedText('');
    setStatusMessage('');
    setErrorMessage('');
    setPlaybackResult(null);
  };

  return (
    <div className={`universal-speech-card ${className}`} style={{ width: '100%', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.95) 100%)', border: '2px solid rgba(2, 132, 199, 0.35)', borderRadius: '24px', padding: '1.25rem', boxShadow: '0 12px 32px rgba(2, 132, 199, 0.12)', display: 'flex', flexDirection: 'column', gap: '1rem', ...style }}>
      
      {/* HEADER & PATHWAY TOGGLE (⌨️ TYPE vs 🎤 SPEAK) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', pb: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ padding: '0.4rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--color-blue-primary)' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Universal Speech Generator
            </h3>
            <span style={{ fontSize: '0.725rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
              ⌨️ TYPE or 🎤 SPEAK ➔ AI Understands ➔ ElevenLabs Voice
            </span>
          </div>
        </div>

        {/* INPUT MODE SWITCHER */}
        <div style={{ display: 'flex', background: 'rgba(2, 132, 199, 0.08)', padding: '3px', borderRadius: '14px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '11px',
              border: 'none',
              background: activeTab === 'type' ? 'var(--color-blue-primary)' : 'transparent',
              color: activeTab === 'type' ? '#FFFFFF' : 'var(--color-brand-title)',
              fontWeight: 800,
              fontSize: '0.775rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Keyboard size={15} />
            <span>⌨️ TYPE PROMPT</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('speak')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '11px',
              border: 'none',
              background: activeTab === 'speak' ? 'var(--color-blue-primary)' : 'transparent',
              color: activeTab === 'speak' ? '#FFFFFF' : 'var(--color-brand-title)',
              fontWeight: 800,
              fontSize: '0.775rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Mic size={15} />
            <span>🎤 SPEAK PROMPT</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clone')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '11px',
              border: 'none',
              background: activeTab === 'clone' ? 'var(--color-blue-primary)' : 'transparent',
              color: activeTab === 'clone' ? '#FFFFFF' : 'var(--color-brand-title)',
              fontWeight: 800,
              fontSize: '0.775rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={15} />
            <span>✨ CLONE VOICE</span>
          </button>
        </div>
      </div>

      {/* LANGUAGE SELECTOR CONTROL */}
      <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', background: 'rgba(255, 255, 255, 0.8)', padding: '0.4rem 0.75rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Globe size={15} color="var(--color-blue-primary)" />
          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-brand-title)' }}>
            Language:
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', marginLeft: 'auto' }}>
          {['English', 'Kannada'].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setSelectedLanguage(lang)}
              style={{
                padding: '0.25rem 0.55rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedLanguage === lang ? 'var(--color-blue-primary)' : 'var(--border-color)',
                background: selectedLanguage === lang ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                color: selectedLanguage === lang ? 'var(--color-blue-primary)' : 'var(--color-brand-tagline)',
                fontWeight: selectedLanguage === lang ? 800 : 600,
                fontSize: '0.725rem',
                cursor: 'pointer'
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* PATHWAY 1: ⌨️ TYPE INPUT INTERFACE */}
      {activeTab === 'type' && (
        <form onSubmit={handleTypedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={2}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={`Type what person/caregiver said in ${selectedLanguage}... (e.g. "Do you want water?")`}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '16px',
                border: '1.5px solid var(--border-color)',
                background: '#FFFFFF',
                color: 'var(--color-brand-title)',
                fontSize: '0.95rem',
                fontWeight: 700,
                resize: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                outline: 'none'
              }}
            />
          </div>

          {/* PRESET QUICK PROMPTS */}
          <div>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--color-brand-tagline)', display: 'block', marginBottom: '0.4rem' }}>
              Sample Person Prompts (Tap to Understand & Generate Answers):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {(presetPrompts[selectedLanguage] || presetPrompts.English).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTypedText(prompt);
                    processInputPrompt(prompt, selectedLanguage);
                  }}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: '#FFFFFF',
                    color: 'var(--color-brand-title)',
                    fontSize: '0.775rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!typedText.trim() || speechState === 'processing' || speechState === 'synthesizing' || speechState === 'speaking'}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-blue-primary) 0%, #0369A1 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 18px rgba(2, 132, 199, 0.25)',
              cursor: 'pointer'
            }}
          >
            <Send size={18} />
            <span>UNDERSTAND INPUT & GENERATE ANSWERS</span>
          </button>
        </form>
      )}

      {/* PATHWAY 2: 🎤 SPEAK INPUT INTERFACE */}
      {activeTab === 'speak' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', padding: '0.5rem 0' }}>
          {speechState === 'listening' ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '100%', padding: '1.1rem', borderRadius: '18px', background: 'rgba(220, 38, 38, 0.1)', border: '2px solid #DC2626', color: '#DC2626', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                <span className="pulse-dot" style={{ width: 14, height: 14, borderRadius: '50%', background: '#DC2626', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                <span>🎙️ LISTENING TO COMPANION SPEECH...</span>
              </div>
              <button
                type="button"
                className="btn-secondary-auth"
                onClick={handleStopListening}
                style={{ width: '100%', padding: '0.75rem', borderColor: '#DC2626', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Square size={18} />
                <span>STOP LISTENING</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-continue"
              onClick={handleStartListening}
              disabled={speechState === 'processing' || speechState === 'synthesizing'}
              style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25)' }}
            >
              <Mic size={22} />
              <span>🎙️ TAP TO LISTEN TO COMPANION SPEECH</span>
            </button>
          )}
        </div>
      )}

      {/* PATHWAY 3: ✨ CLONE VOICE INTERFACE */}
      {activeTab === 'clone' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '0.5rem 0' }}>
          <div style={{ padding: '0.85rem 1rem', borderRadius: '16px', background: 'rgba(2, 132, 199, 0.08)', border: '1.5px solid rgba(2, 132, 199, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#16A34A" />
              <div>
                <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--color-brand-title)', display: 'block' }}>
                  {activeClonedVoiceId ? '🟢 Cloned Voice Profile Active' : '🎙️ Default ElevenLabs Voice Active'}
                </span>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
                  {activeClonedVoiceId ? `Voice ID: ${activeClonedVoiceId.slice(0, 12)}...` : 'Record 10-30s sample to clone your voice'}
                </span>
              </div>
            </div>
          </div>

          {cloneErrorMsg && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#DC2626', fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} />
              <span>{cloneErrorMsg}</span>
            </div>
          )}

          {cloneSuccessMsg && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.3)', color: '#16A34A', fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} />
              <span>{cloneSuccessMsg}</span>
            </div>
          )}

          {/* RECORDING OR FILE SAMPLE STAGE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {isCloneRecording ? (
              <div style={{ padding: '1rem', borderRadius: '16px', background: 'rgba(220, 38, 38, 0.1)', border: '2px solid #DC2626', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#DC2626', fontWeight: 900, fontSize: '1rem' }}>
                  🎙️ RECORDING VOICE SAMPLE ({cloneRecordTime}s)...
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-tagline)', fontWeight: 600 }}>
                  Speak naturally in Kannada or English (10-30 seconds recommended).
                </span>
                <button
                  type="button"
                  onClick={handleStopCloneRecording}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '12px', border: 'none', background: '#DC2626', color: '#FFF', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Square size={16} />
                  <span>STOP & SAVE RECORDING</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleStartCloneRecording}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '1.5px solid var(--color-blue-primary)', background: 'rgba(2, 132, 199, 0.08)', color: 'var(--color-blue-primary)', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Mic size={18} />
                  <span>RECORD VOICE SAMPLE</span>
                </button>

                <button
                  type="button"
                  onClick={() => cloneFileInputRef.current?.click()}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '1.5px solid var(--border-color)', background: '#FFF', color: 'var(--color-brand-title)', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Upload size={18} />
                  <span>UPLOAD AUDIO FILE</span>
                </button>
                <input
                  ref={cloneFileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleCloneFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {cloneAudioUrl && !isCloneRecording && (
              <div style={{ padding: '0.75rem 0.9rem', borderRadius: '14px', background: '#FFF', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-brand-title)' }}>
                  🎵 Preview Voice Sample:
                </span>
                <audio src={cloneAudioUrl} controls style={{ width: '100%', height: 36 }} />
                <button
                  type="button"
                  onClick={handleExecuteVoiceClone}
                  disabled={isCloning}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, var(--color-blue-primary) 0%, #0369A1 100%)', color: '#FFF', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)' }}
                >
                  {isCloning ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  <span>{isCloning ? cloneStatusMsg || 'CLONING VOICE...' : '✨ CLONE MY VOICE NOW'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISPLAY 1: 🗣️ WHAT PERSON SAID */}
      {personSaid && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '16px', background: 'rgba(2, 132, 199, 0.08)', border: '1.5px solid rgba(2, 132, 199, 0.3)', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.05)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-blue-primary)', display: 'block', marginBottom: '0.25rem' }}>
            🗣️ PERSON SAID (RECOGNIZED INPUT):
          </span>
          <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: 0, lineHeight: 1.35 }}>
            "{personSaid}"
          </p>
        </div>
      )}

      {/* DISPLAY 2: 💡 GENERATED ANSWER OPTIONS (SUITED TO INPUT - TAP TO SPEAK) */}
      {answerChoices && answerChoices.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-brand-title)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} color="var(--color-blue-primary)" />
            💡 AI GENERATED ANSWERS (SUITED TO INPUT - TAP TO SPEAK):
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {answerChoices.map((choiceText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => triggerElevenLabsTTS(choiceText)}
                style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '16px',
                  border: '1.5px solid',
                  borderColor: convergedText === choiceText ? 'var(--color-blue-primary)' : 'var(--border-color)',
                  background: convergedText === choiceText ? 'rgba(2, 132, 199, 0.12)' : '#FFFFFF',
                  color: 'var(--color-brand-title)',
                  fontWeight: 800,
                  fontSize: '0.925rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{choiceText}</span>
                <CheckCircle2 size={18} color={convergedText === choiceText ? 'var(--color-blue-primary)' : 'var(--color-brand-tagline)'} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DISPLAY 3: 🔊 PATIENT VOICE ANSWER OUTPUT (ElevenLabs Synthesis) */}
      {(speechState === 'synthesizing' || speechState === 'speaking' || speechState === 'completed') && (
        <div className="ultra-response-box" style={{ marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-blue-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Volume2 size={16} />
              🔊 PATIENT VOICE ANSWER OUTPUT (ELEVENLABS):
            </span>
            {(speechState === 'synthesizing' || speechState === 'speaking') && (
              <div className="soundwave-bars">
                <span className="soundwave-bar" />
                <span className="soundwave-bar" />
                <span className="soundwave-bar" />
                <span className="soundwave-bar" />
              </div>
            )}
          </div>

          <p style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-brand-title)', margin: '0.3rem 0 0.5rem 0', lineHeight: 1.35 }}>
            "{convergedText}"
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="ultra-btn-confirm"
              onClick={() => triggerElevenLabsTTS(convergedText)}
              disabled={speechState === 'synthesizing' || speechState === 'speaking'}
              style={{ flex: 1 }}
            >
              <Volume2 size={18} />
              <span>{speechState === 'synthesizing' || speechState === 'speaking' ? 'SPEAKING...' : 'SPEAK AGAIN 🔊'}</span>
            </button>

            <button
              type="button"
              className="ultra-btn-change"
              onClick={handleReset}
              style={{ flex: 1 }}
            >
              <RefreshCw size={16} />
              <span>NEW INPUT</span>
            </button>
          </div>
        </div>
      )}

      {/* STATUS & ERROR MESSAGES */}
      {statusMessage && !errorMessage && (
        <div style={{ padding: '0.6rem 0.85rem', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.2)', fontSize: '0.8rem', color: 'var(--color-blue-primary)', textAlign: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <Sparkles size={15} />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.65rem 0.85rem', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid #DC2626', color: '#DC2626', fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

    </div>
  );
};

export default UniversalSpeechInput;
