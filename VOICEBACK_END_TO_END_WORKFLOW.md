# VOICEBACK_END_TO_END_WORKFLOW

Canonical End-to-End Workflow Specification — Source-of-Truth Lock.

## Canonical Product Flow (12 Steps)

1. **User Authentication & Session Guard:**
   - Patient, Doctor, or Caregiver logs in via JWT authentication (`/api/v1/auth/login`).
   - Role-Based Access Control (RBAC) securely mounts the appropriate dashboard.
   - Authoritative profile data is loaded from MongoDB Atlas without duplicating or overwriting identities.

2. **Caregiver / Conversational Prompt (Optional Input):**
   - Caregiver speaks or inputs a contextual question/prompt (e.g., "Are you ready for lunch?") in Companion Mode.
   - This prompt can be any arbitrary, unseen question. It is NOT limited to a hardcoded dictionary.

3. **Primary Patient Speech Input:**
   - Patient speaks into the active microphone (weak, whispered, or dysarthric vocalization).
   - *Automatic Microphone Selection:* When the `VoiceBack-Neckband` BLE is connected, the PWA automatically sources audio from the physical INMP441 microphone (via I2S_NUM_1 on the ESP32). When disconnected, it automatically falls back to the browser microphone.
   - Both microphone paths feed the exact same downstream speech-processing pipeline.

4. **Speech-to-Text Layer (ElevenLabs Scribe):**
   - Captured audio is transcribed by **ElevenLabs Scribe** to yield a raw phonetic transcript.
   - The original raw transcript is retained for context.

5. **Speech Cleanup & Meaning Reconstruction (Gemini Context Engine):**
   - If the speech is clear, complete, and grammatical, it is preserved exactly as spoken.
   - If the speech is broken, slurred, incomplete, or phonetic, the Gemini LLM reconstructs the most likely intended meaning using the conversational history and clinical profile context.
   - *Companion Mode Rule:* If responding to a caregiver's prompt, the context engine dynamically generates relevant response choices.

6. **Patient Selection & Confirmation:**
   - The reconstructed meaning (or dynamic response choices) are presented to the patient.
   - Patient explicitly selects/confirms their intended response (Confirm / Change / Cancel).
   - *Rule:* The patient must confirm before audio generation occurs. Selecting "Cancel" immediately aborts the process and prevents TTS.

7. **Patient Voice ID Retrieval:**
   - The authenticated patient's stored Cartesia `voiceId` is retrieved from their MongoDB `VoiceProfile`.
   - *Rules:*
     - Voice ID belongs strictly to the authenticated patient.
     - Never duplicated across unrelated patients; never hardcoded.
     - Never exposed in frontend code.

8. **Voice Synthesis (Cartesia TTS):**
   - The confirmed text is synthesized into high-fidelity speech via Cartesia using the patient's specific voice clone.
   - Cartesia emotion capabilities may dynamically influence the vocal tone where applicable.

9. **Audio Resampling & BLE Transfer:**
   - The synthesized audio buffer is decoded via browser `AudioContext`.
   - Resampled to **16,000 Hz 16-bit Mono PCM**.
   - Sliced into chunks and streamed sequentially over Web Bluetooth to the ESP32 GATT server (`VoiceBack-Neckband`).

10. **Physical Speaker Output:**
    - ESP32 firmware receives PCM packets and forwards frames via I2S_NUM_0 DMA.
    - MAX98357A I2S Class-D amplifier drives the physical speaker on:
      - `BCLK = GPIO27`
      - `LRC/WS = GPIO14`
      - `DIN = GPIO22`
    - Audio plays cleanly in the patient's voice.

11. **Language Processing & Mapping:**
    - The system faithfully supports the spoken languages (e.g., Kannada input yields Kannada output; English input yields English output; mixed yields mixed). It does not invent support for unverified languages.

12. **Telemetry & Event Logging:**
    - An event record is safely persisted to `CommunicationHistory` in MongoDB Atlas for doctor/caregiver review.
    - *Note:* There is NO BioAmp, NO EMG, and NO hardware telemetry used in this pipeline.

---

## Failure & Fallback Handling

| Failure Point | Approved Handling Behavior | Prohibited Action |
| :--- | :--- | :--- |
| **No Internet / Cloud ASR Unavailable** | Prompt patient to retry or use on-screen quick phrase tiles. | Never fabricate synthetic transcripts. |
| **Cartesia TTS Unavailable** | Fall back to Browser Native SpeechSynthesis (`voiceService.js`). | Never fail silently without audio output. |
| **BLE Disconnected** | PWA automatically uses browser mic; plays synthesized speech through local device speaker. | Never crash BLE stack or block UI. |
| **MongoDB Atlas Unreachable** | Display clear connectivity alert with retry option. | Never insert mock/fake patient records into production. |

---

## Completion & Verification Gate

1. All MongoDB collections operational (`UserLogin`, `Patient`, `Doctor`, `Caregiver`, `VoiceProfile`, `TherapyProgress`, `CommunicationHistory`, `Appointment`, `EmergencySOS`).
2. Zero mock/fake patient records in production database.
3. INMP441 / Browser automatic mic switching established as primary speech input.
4. ElevenLabs Scribe verified as target STT layer.
5. Cartesia verified as target TTS layer using patient-specific `voiceId`.
6. MAX98357A firmware pinout verified: `GPIO27` (BCLK), `GPIO14` (LRC), `GPIO22` (DIN).
7. INMP441 firmware pinout verified: `GPIO26` (SCK), `GPIO25` (WS), `GPIO34` (SD).
8. Documentation 100% consistent across all repository files.
