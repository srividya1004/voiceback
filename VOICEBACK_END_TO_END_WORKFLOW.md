# VOICEBACK_END_TO_END_WORKFLOW

Canonical End-to-End Workflow Specification — Source-of-Truth Lock.

## Canonical Product Flow (12 Steps)

1. **User Authentication & Session Guard:**
   - Patient, Doctor, or Caregiver logs in via JWT authentication (`/api/v1/auth/login`).
   - Role-Based Access Control (RBAC) securely mounts the appropriate dashboard.
   - Authoritative profile data is loaded from MongoDB Atlas without duplicating or overwriting identities.

2. **Caregiver / Conversational Prompt (Optional Input):**
   - Caregiver speaks or inputs a contextual question/prompt (e.g., "Are you ready for lunch?").

3. **Primary Patient Speech Input:**
   - Patient speaks into the **Physical Microphone** (weak, whispered, or dysarthric vocalization).
   - Audio is captured via browser `MediaRecorder` or native hardware audio stream.
   - *Invariant:* The physical microphone is the **PRIMARY** speech input. BioAmp is **NOT** used for speech recognition.

4. **Speech-to-Text Layer (Wispr Flow / Approved Provider):**
   - Captured audio is transcribed by **Wispr Flow** (or approved STT provider) to yield a raw transcript.
   - *Rule:* Wispr Flow is never called "Whisper", and OpenAI Whisper is not used.

5. **Speech Cleanup & Meaning Reconstruction:**
   - Dysarthric, noisy, or fragmented speech fragments are normalized into clear grammatical intent.

6. **Context & Intent Understanding (Gemini LLM):**
   - Cleaned transcript + conversational history + clinical profile context are analyzed by the Context Engine (`contextEngineService.js`).
   - If offline or API-limited, deterministic rule tables provide reliable intent categorization.

7. **Temporary Dynamic Response Choices (Ephemeral):**
   - 3 to 4 contextually relevant response options are dynamically generated and displayed to the patient.
   - *Invariant:* Dynamic response choices are **ephemeral**—they exist only during the active interaction and disappear immediately once the interaction is completed or cancelled. They **MUST NOT** become permanent dashboard content.

8. **Patient Selection & Confirmation:**
   - Patient selects their intended response card (via touch, assistive click, or input).
   - Patient explicitly confirms the selected response before audio generation is triggered.

9. **Patient Voice ID Retrieval:**
   - The authenticated patient's stored `voiceId` is retrieved from their MongoDB `VoiceProfile`.
   - *Rules:*
     - Voice ID belongs strictly to the authenticated patient.
     - Never duplicated across unrelated patients; never hardcoded.
     - Never re-clones per phrase.

10. **Voice Synthesis (ElevenLabs TTS):**
    - The confirmed text is synthesized into high-fidelity speech via ElevenLabs API (`eleven_v3` / `eleven_multilingual_v2`).
    - *Kannada PVC Policy:* ElevenLabs `eleven_v3` synthesizes Kannada, but ElevenLabs PVC does **NOT** list Kannada as an officially supported PVC training language. If patient-cloned voice is unavailable or unsupported for Kannada, the system uses an explicitly documented approved fallback voice rather than claiming unverified patient voice cloning.

11. **Audio Resampling & BLE Transfer:**
    - The synthesized MP3 audio buffer is decoded via browser `AudioContext`.
    - Resampled to **16,000 Hz 16-bit Mono PCM** via `OfflineAudioContext`.
    - Sliced into 180-byte chunks and streamed sequentially over Web Bluetooth to the ESP32 GATT server (`VoiceBack-Neckband`, Char UUID: `cba1483e-36e1-4688-b7f5-ea07361b26b9`).

12. **Physical Speaker Output:**
    - ESP32 firmware (`audio_driver.cpp`) receives PCM packets and forwards stereo frames via I2S DMA.
    - MAX98357A I2S Class-D amplifier drives the 4Ω 3W physical speaker on:
      - `BCLK = GPIO26`
      - `LRC = GPIO25`
      - `DOUT = GPIO22`
    - Audio plays cleanly in the patient's voice.
    - An event record is optionally persisted to `CommunicationHistory` in MongoDB Atlas.

---

## BioAmp EXG Pill Scope
- **Hardware Integration:** Surface electrodes → BioAmp EXG Pill → ESP32 `GPIO34` (ADC1_CH6) → EMA Filter (α = 0.15) → 50Hz BLE Telemetry (`beb5483e-36e1-4688-b7f5-ea07361b26a8`).
- **Telemetry Only:** Telemetry streams raw ADC values and filtered voltages for hardware calibration, muscle fatigue monitoring, and prototype demonstration.
- **No Speech Decoding:** BioAmp sEMG is **NOT** used for speech-to-text or silent speech decoding. The legacy CNN + Transformer + CTC model is permanently retired.

---

## Failure & Fallback Handling

| Failure Point | Approved Handling Behavior | Prohibited Action |
| :--- | :--- | :--- |
| **No Internet / Cloud ASR Unavailable** | Prompt patient to retry or use on-screen quick phrase tiles. | Never fabricate synthetic transcripts. |
| **ElevenLabs TTS Unavailable** | Fall back to Browser Native SpeechSynthesis (`voiceService.js`). | Never fail silently without audio output. |
| **Kannada Cloning Unsupported** | Use approved multilingual neural voice profile. | Never pretend output is patient's cloned voice. |
| **BLE Disconnected** | Play synthesized speech through local device/PWA speaker. | Never crash BLE stack or block UI. |
| **MongoDB Atlas Unreachable** | Display clear connectivity alert with retry option. | Never insert mock/fake patient records into production. |

---

## Completion & Verification Gate

1. All 10 MongoDB collections operational (`UserLogin`, `Patient`, `Doctor`, `Caregiver`, `VoiceProfile`, `EMGProfile`, `TherapyProgress`, `CommunicationHistory`, `Appointment`, `EmergencySOS`).
2. Zero mock/fake patient records in production database.
3. Physical microphone established as primary speech input.
4. Wispr Flow verified as target STT layer (no Whisper reintroduction).
5. Ephemeral dynamic choices disappear after interaction.
6. MAX98357A firmware pinout verified: `GPIO26` (BCLK), `GPIO25` (LRC), `GPIO22` (DOUT).
7. Documentation 100% consistent across all repository files.

