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

      return response.data?.data || [];
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
    text,
    language,
    emotion,
  }) => {
    const response =
      await apiClient.post(
        '/voice-profiles/synthesize',

        {
          patientId,
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

    const enInVoice =
      voices.find((v) => {
        const l =
          v.lang
            .toLowerCase()
            .replace('_', '-');

        return (
          l.includes('en-in') ||
          l.includes('en_in')
        );
      });

    if (enInVoice) {
      return enInVoice;
    }

    const enUsVoice =
      voices.find((v) => {
        const l =
          v.lang
            .toLowerCase()
            .replace('_', '-');

        return (
          l.includes('en-us') ||
          l.includes('en_us')
        );
      });

    if (enUsVoice) {
      return enUsVoice;
    }

    const anyEnVoice =
      voices.find((v) => {
        const l =
          v.lang
            .toLowerCase()
            .replace('_', '-');

        return l.startsWith('en');
      });

    if (anyEnVoice) {
      return anyEnVoice;
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
    text,
    language = 'English',
    emotion = 'neutral',
  }) => {
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

      const blob =
        await voiceService.synthesizeSpeech({
          patientId,
          text,
          language,
          emotion,
        });

      if (
        blob &&
        blob.size > 200 &&
        blob.type.includes('audio')
      ) {
        console.log(
          `🔊 [VoiceOutput] ElevenLabs audio received: ${blob.size} bytes`
        );

        if (deviceService.getDeviceStatus().isConnected) {
          const result =
            await deviceService.sendAudioToESP32(
              blob
            );

          console.log(
            '🔊 [VoiceOutput] Audio successfully transferred to ESP32 MAX98357A physical speaker.'
          );

          return {
            success: true,

            provider:
              'ElevenLabs IVC → ESP32 MAX98357A Physical Speaker',

            audioUrl: null,

            bytes:
              result.bytes,

            packets:
              result.packets,

            sampleRate:
              result.sampleRate,
          };
        } else {
          // Play audio blob through physical output device via HTML5 setSinkId if configured
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);

          if (typeof audio.setSinkId === 'function' && window.selectedAudioDeviceId) {
            try {
              await audio.setSinkId(window.selectedAudioDeviceId);
            } catch (sinkErr) {
              console.warn('🔊 HTML5 setSinkId physical device selection notice:', sinkErr.message);
            }
          }

          await audio.play();

          return {
            success: true,
            provider: 'ElevenLabs IVC → Physical Audio Device',
            audioUrl,
          };
        }
      }

      throw new Error(
        'ElevenLabs returned invalid audio data.'
      );
    } catch (err) {
      console.warn(
        '⚠️ [VoiceOutput] ElevenLabs/ESP32 audio path failed:',
        err.message
      );

      // Keep the existing browser fallback.
      // This is only a fallback and will play on the laptop.
    }

    // ----------------------------------------------------------
    // 2. EXISTING BROWSER FALLBACK
    // ----------------------------------------------------------

    return await voiceService.speakNativeTTS(
      text,
      {
        language,
        emotion,
      }
    );
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