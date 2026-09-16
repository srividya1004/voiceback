import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Reusable VoiceBack Microphone Capture Hook
 * Encapsulates the canonical VoiceBack MediaRecorder and getUserMedia capture pattern.
 * Provides start/stop controls, recording timer, permission error handling,
 * and reliable audio Blob delivery with proper MediaStream track cleanup.
 *
 * @param {Object} options
 * @param {Function} [options.onAudioCaptured] - Callback invoked with the final recorded audio Blob
 * @param {Function} [options.onError] - Callback invoked on microphone/recording errors
 * @returns {Object} { isRecording, recordingDuration, error, startRecording, stopRecording, clearError }
 */
export const useMicrophoneCapture = ({ onAudioCaptured, onError } = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState('');

  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const onAudioCapturedRef = useRef(onAudioCaptured);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onAudioCapturedRef.current = onAudioCaptured;
    onErrorRef.current = onError;
  }, [onAudioCaptured, onError]);

  // Clean up tracks and interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Notice stopping MediaRecorder:', err.message);
      }
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    audioChunksRef.current = [];
    setRecordingDuration(0);

    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errMsg = 'Microphone access is not supported in this browser.';
      setError(errMsg);
      if (onErrorRef.current) onErrorRef.current(errMsg);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        }
      });
      mediaStreamRef.current = stream;

      const mimeType = (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported)
        ? (MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '')
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Stop all tracks to immediately turn off physical mic indicator
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        const chunks = audioChunksRef.current;
        if (!chunks || chunks.length === 0) {
          const errMsg = 'No audio was captured. Please speak clearly into the microphone.';
          setError(errMsg);
          if (onErrorRef.current) onErrorRef.current(errMsg);
          return;
        }

        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (onAudioCapturedRef.current) {
          onAudioCapturedRef.current(audioBlob);
        }
      };

      recorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission/capture error:', err.message);
      const errMsg = 'Microphone permission denied. Please allow microphone access to practice.';
      setError(errMsg);
      setIsRecording(false);
      if (onErrorRef.current) onErrorRef.current(errMsg);
    }
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return {
    isRecording,
    recordingDuration,
    error,
    startRecording,
    stopRecording,
    clearError,
  };
};

export default useMicrophoneCapture;
