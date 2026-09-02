import apiClient from './apiClient';
import { deviceService } from './deviceService';

/**
 * VoiceBack Voice Profiles API Service
 */

export const voiceService = {
  // ============================================================
  // VOICE PROFILES
  // ============================================================

  getVoiceProfiles: async () => {
    try {
      const response =
        await apiClient.get(
          '/voice-profiles'
        );

      const profiles = response.data?.data || [];
      if (Array.isArray(profiles) && profiles.length > 0) {
        const readyProfile = profiles.find((p) => p.status === 'Ready' && p.voiceId) || profiles.find((p) => p.voiceId);
        if (readyProfile && readyProfile.voiceId && typeof window !== 'undefined') {
          localStorage.setItem('voiceback_cloned_voice_id', readyProfile.voiceId);
        }
      }
      return profiles;
    } catch (error) {
      console.warn(
        'Failed to fetch voice profiles:',
        error.message
      );

      return [];
    }
  },

  // ============================================================
  // CREATE VOICE PROFILE
  // ============================================================

  createVoiceProfile: async (payload) => {
    const response =
      await apiClient.post(
        '/voice-profiles',
        payload
      );

    return response.data;
  },

  // ============================================================
  // UPLOAD + CLONE VOICE
  // ============================================================

  uploadAndCloneVoice: async (formData) => {
    const response =
      await apiClient.post(
        '/voice-profiles/clone-voice',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },

          timeout: 90000,
        }
      );

    return response.data;
  },

  // ============================================================
  // SYNTHESIZE SPEECH
  // ============================================================

  synthesizeSpeech: async ({
    patientId,
    voiceId,
    gender,
    ageGroup,
    text,
    language,
    emotion,
  }) => {
    const activeClonedVoiceId = voiceId || (typeof window !== 'undefined' ? localStorage.getItem('voiceback_cloned_voice_id') : null);
    const activeGender = gender || (typeof window !== 'undefined' ? localStorage.getItem('voiceback_patient_gender') : null) || 'female';
    const activeAgeGroup = ageGroup || (typeof window !== 'undefined' ? localStorage.getItem('voiceback_patient_age_group') : null) || 'adult';

    const response = await apiClient.post(
      '/voice-profiles/synthesize',
      {
        patientId,
        voiceId: activeClonedVoiceId,
        gender: activeGender,
        ageGroup: activeAgeGroup,
        text,
        language,
        emotion,
      },
      {
        responseType: 'blob',
        timeout: 45000,
      }
    );

    return response.data;
  },

  // ============================================================
  // TRANSCRIBE SPEECH
  // ============================================================

  transcribeSpeech: async (
    formData
  ) => {
    const response =
      await apiClient.post(
        '/voice-profiles/transcribe',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },

          timeout: 60000,
        }
      );

    return response.data;
  },

  // ============================================================
  // BROWSER VOICES
  // ============================================================

  getAvailableVoices: () => {
    return new Promise((resolve) => {
      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window)
      ) {
        resolve([]);
        return;
      }

      let voices =
        window.speechSynthesis.getVoices();

      if (
        voices &&
        voices.length > 0
      ) {
        resolve(voices);
        return;
      }

      let resolved = false;

      const handleVoicesChanged = () => {
        if (resolved) return;

        resolved = true;

        voices =
          window.speechSynthesis.getVoices();

        if (
          window.speechSynthesis
            .onvoiceschanged ===
          handleVoicesChanged
        ) {
          window.speechSynthesis.onvoiceschanged =
            null;
        }

        window.speechSynthesis.removeEventListener(
          'voiceschanged',
          handleVoicesChanged
        );

        resolve(voices || []);
      };

      window.speechSynthesis.addEventListener(
        'voiceschanged',
        handleVoicesChanged
      );

      window.speechSynthesis.onvoiceschanged =
        handleVoicesChanged;

      setTimeout(() => {
        if (!resolved) {
          resolved = true;

          voices =
            window.speechSynthesis.getVoices();

          resolve(voices || []);
        }
      }, 500);
    });
  },

  // ============================================================
  // SELECT BEST BROWSER VOICE
  // ============================================================

  selectBestVoice: (
    voices,
    language = 'English'
  ) => {
    if (
      !voices ||
      voices.length === 0
    ) {
      return null;
    }

    const langLower =
      (language || '').toLowerCase();

    if (
      langLower.includes('hindi') ||
      langLower.includes('hi')
    ) {
      const hiVoice =
        voices.find((v) =>
          v.lang
            .toLowerCase()
            .replace('_', '-')
            .includes('hi')
        );

      if (hiVoice) return hiVoice;
    } else if (
      langLower.includes('kannada') ||
      langLower.includes('kn')
    ) {
      const knVoice =
        voices.find((v) =>
          v.lang
            .toLowerCase()
            .replace('_', '-')
            .includes('kn')
        );

      if (knVoice) return knVoice;
    }

    // Prioritize High-Quality Human / Neural / Natural Voices
    const neuralOrNatural = (list) => list.find(v => {
      const name = (v.name || '').toLowerCase();
      return name.includes('natural') || name.includes('neural') || name.includes('google') || name.includes('online');
    }) || list[0];

    const enInVoice = voices.filter((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      return l.includes('en-in') || l.includes('en_in');
    });

    if (enInVoice.length > 0) {
      return neuralOrNatural(enInVoice);
    }

    const enUsVoice = voices.filter((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      return l.includes('en-us') || l.includes('en_us');
    });

    if (enUsVoice.length > 0) {
      return neuralOrNatural(enUsVoice);
    }

    const anyEnVoice = voices.filter((v) => {
      const l = v.lang.toLowerCase().replace('_', '-');
      return l.startsWith('en');
    });

    if (anyEnVoice.length > 0) {
      return neuralOrNatural(anyEnVoice);
    }

    return voices[0];
  },

  // ============================================================
  // NATIVE BROWSER TTS
  //
  // Kept unchanged as fallback.
  // This plays through browser/laptop, NOT ESP32.
  // ============================================================

  speakNativeTTS: async (
    text,
    options = {}
  ) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      console.warn(
        '⚠️ Web Speech API is not supported.'
      );

      return {
        success: false,
        provider: 'Speech Unsupported',
        audioUrl: null,
      };
    }

    if (
      !text ||
      !text.trim()
    ) {
      return {
        success: false,
        provider: 'None',
        audioUrl: null,
      };
    }

    const {
      language = 'English',
      emotion = 'neutral',
      rate,
      pitch,
      volume,
    } = options;

    if (
      window.speechSynthesis.paused
    ) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.cancel();

    const voices =
      await voiceService.getAvailableVoices();

    const selectedVoice =
      voiceService.selectBestVoice(
        voices,
        language
      );

    return new Promise((resolve) => {
      let resolved = false;

      const utterance =
        new SpeechSynthesisUtterance(
          text.trim()
        );

      if (selectedVoice) {
        utterance.voice =
          selectedVoice;

        utterance.lang =
          selectedVoice.lang;
      } else {
        utterance.lang =
          language === 'Hindi' ||
            language === 'hi'
            ? 'hi-IN'
            : language === 'Kannada' ||
              language === 'kn'
              ? 'kn-IN'
              : 'en-US';
      }

      utterance.volume =
        typeof volume === 'number'
          ? volume
          : 1.0;

      if (typeof rate === 'number') {
        utterance.rate = rate;
      } else if (
        emotion === 'urgent'
      ) {
        utterance.rate = 1.15;
      } else if (
        emotion === 'calm'
      ) {
        utterance.rate = 0.9;
      } else {
        utterance.rate = 1.0;
      }

      if (
        typeof pitch === 'number'
      ) {
        utterance.pitch = pitch;
      } else if (
        emotion === 'urgent'
      ) {
        utterance.pitch = 1.1;
      } else if (
        emotion === 'calm'
      ) {
        utterance.pitch = 0.95;
      } else {
        utterance.pitch = 1.0;
      }

      const voiceInfoStr =
        selectedVoice
          ? `(${selectedVoice.name} - ${selectedVoice.lang})`
          : `(Default - ${utterance.lang})`;

      const providerName =
        `Browser Native TTS ${voiceInfoStr}`;

      const finishSuccess = () => {
        if (resolved) return;

        resolved = true;

        console.log(
          `🔊 [VoiceOutput] Browser speech active: ${providerName}`
        );

        resolve({
          success: true,
          provider: providerName,
          audioUrl: null,
        });
      };

      utterance.onstart =
        () => {
          finishSuccess();
        };

      utterance.onerror =
        (err) => {
          console.warn(
            '⚠️ SpeechSynthesis error:',
            err
          );

          if (!resolved) {
            resolved = true;

            resolve({
              success: false,
              provider:
                `${providerName} (Error)`,
              audioUrl: null,
            });
          }
        };

      utterance.onend =
        () => {
          if (!resolved) {
            finishSuccess();
          }
        };

      window.speechSynthesis.speak(
        utterance
      );

      if (
        window.speechSynthesis.paused
      ) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.resume();

      setTimeout(() => {
        if (!resolved) {
          finishSuccess();
        }
      }, 800);
    });
  },

  // ============================================================
  // PLAY SYNTHESIZED AUDIO
  // ============================================================

  playSynthesizedAudio: async ({
    patientId,
    voiceId,
    text,
    language = 'English',
    emotion = 'neutral',
  }) => {
    const normLang = (language === 'kn' || language === 'kannada') ? 'Kannada' : (language === 'hi' || language === 'hindi') ? 'Hindi' : (language || 'English');
    if (
      !text ||
      !text.trim()
    ) {
      return {
        success: false,
        provider: 'None',
      };
    }

    // ----------------------------------------------------------
    // 1. ELEVENLABS
    // ----------------------------------------------------------

    try {
      console.log(
        '🔊 [VoiceOutput] Requesting ElevenLabs synthesized audio...'
      );

      const activeClonedVoiceId = voiceId || (typeof window !== 'undefined' ? localStorage.getItem('voiceback_cloned_voice_id') : null);

      const blob =
        await voiceService.synthesizeSpeech({
          patientId,
          voiceId: activeClonedVoiceId,
          text,
          language: normLang,
          emotion,
        });

      if (blob && blob.type && blob.type.includes('json')) {
        const textPayload = await blob.text();
        console.warn('🔊 [VoiceOutput] Received fallback JSON payload from backend:', textPayload);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language === 'Kannada' || language === 'kn' ? 'kn-IN' : language === 'Hindi' || language === 'hi' ? 'hi-IN' : 'en-US';
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
          return {
            success: true,
            provider: 'Web Speech TTS (ElevenLabs Notice Fallback)',
            audioUrl: null,
          };
        }
      }

      if (blob && blob.size > 100) {
        console.log(`🔊 [VoiceOutput] Audio payload received: ${blob.size} bytes (type: ${blob.type})`);

        // Ensure proper audio MIME type
        const audioBlob = blob.type && blob.type.includes('audio')
          ? blob
          : new Blob([blob], { type: 'audio/mpeg' });

        const audioUrl = URL.createObjectURL(audioBlob);

        // 1. Play synthesized audio blob out loud immediately via HTML5 Audio element
        let localPlaySuccess = false;
        try {
          const audio = new Audio();
          audio.src = audioUrl;

          if (typeof audio.setSinkId === 'function' && window.selectedAudioDeviceId) {
            try {
              await audio.setSinkId(window.selectedAudioDeviceId);
            } catch (sinkErr) {
              console.warn('🔊 HTML5 setSinkId physical device selection notice:', sinkErr.message);
            }
          }

          await audio.play();
          localPlaySuccess = true;
          console.log('🔊 [VoiceOutput] ElevenLabs human voice playback started out loud successfully.');
        } catch (playErr) {
          console.warn('🔊 HTML5 Audio play notice:', playErr.message);
        }

        // 2. If ESP32 BLE neckband is connected, stream audio in background asynchronously
        let bleTransferred = false;
        if (deviceService.getDeviceStatus().isConnected) {
          deviceService.sendAudioToESP32(audioBlob).then((result) => {
            console.log(`🔊 [VoiceOutput] Audio transferred to ESP32 MAX98357A neckband speaker (${result?.bytes || 0} bytes).`);
          }).catch((bleErr) => {
            console.warn('⚠️ [VoiceOutput] ESP32 BLE audio stream notice:', bleErr.message);
          });
          bleTransferred = true;
        }

        if (localPlaySuccess) {
          return {
            success: true,
            provider: bleTransferred
              ? 'ElevenLabs Human Voice → Speaker & ESP32 Neckband'
              : 'ElevenLabs Human Voice → Speaker Output',
            audioUrl,
          };
        }

        // 3. Fallback to Web Speech API Utterance if HTML5 autoplay is blocked by browser interaction rules
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = (language === 'Kannada' || language === 'kn') ? 'kn-IN' : (language === 'Hindi' || language === 'hi') ? 'hi-IN' : 'en-US';
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
          return {
            success: true,
            provider: 'Web Speech TTS Fallback',
            audioUrl: null,
          };
        }
      }

      throw new Error('Audio payload empty or invalid.');
    } catch (err) {
      console.warn('⚠️ [VoiceOutput] ElevenLabs synthesis notice:', err.message);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'Kannada' || language === 'kn' ? 'kn-IN' : language === 'Hindi' || language === 'hi' ? 'hi-IN' : 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
        return {
          success: true,
          provider: 'Web Speech TTS (Notice Fallback)',
          audioUrl: null
        };
      }
      return {
        success: false,
        provider: 'ElevenLabs Output Notice: ' + err.message,
        audioUrl: null
      };
    }
  },

  // ============================================================
  // SPEECH SYNTHESIS SUPPORT CHECK
  // ============================================================

  isSpeechSynthesisSupported: () => {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    );
  },
};

export default voiceService;