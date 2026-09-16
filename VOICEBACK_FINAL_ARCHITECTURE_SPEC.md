# VOICEBACK_FINAL_ARCHITECTURE_SPEC

Canonical Architecture Specification — Source-of-Truth Lock for Final PRD Baseline.

## Purpose
This document defines the single canonical source of truth for the VoiceBack system architecture, product workflows, and hardware/software contracts. All system components (PWA frontend, Express REST API, MongoDB Atlas, ESP32 firmware) must conform strictly to this specification.

## Locked Product Architecture & Pipeline
The canonical end-to-end VoiceBack communication pipeline operates through the following sequence:

```text
Speech Input (Auto-switched INMP441 over BLE OR Browser Mic)
  └──> ElevenLabs Scribe (Speech-to-Text Layer)
        └──> Raw Transcript
              └──> Speech Cleanup & Meaning Reconstruction
                    └──> Context / Intent Understanding (Gemini LLM / Context Engine)
                          └──> Temporary Dynamic Response Choices (For Companion Mode)
                                └──> Patient Selects Response or Confirms Reconstructed Intent
                                      └──> Explicit Confirmation Gate (Cancel prevents TTS)
                                            └──> Stored Patient Voice ID (MongoDB VoiceProfile)
                                                  └──> Cartesia TTS (Patient Voice Cloning)
                                                        └──> Audio (16kHz 16-bit PCM Mono)
                                                              └──> BLE GATT Stream (VoiceBack-Neckband)
                                                                    └──> ESP32 Microcontroller
                                                                          └──> MAX98357A I2S DAC (I2S_NUM_0)
                                                                                └──> Physical Speaker
```

## Architectural Tenets & Invariants

1. **Primary Speech Input:** The physical microphone is the **PRIMARY** speech input mechanism. The PWA automatically selects the ESP32's physical INMP441 microphone when the BLE neckband is connected, and falls back to the browser microphone when disconnected. Both paths feed the identical downstream pipeline. No manual switching is required.
2. **Speech-to-Text Layer:** **ElevenLabs Scribe** is the designated speech recognition layer. Wispr Flow and OpenAI Whisper are completely purged and must not be reintroduced.
3. **Meaning Reconstruction:** The Gemini Context Engine dynamically reconstructs unclear, broken, or phonetic speech into intended meaning. Clear and grammatical speech must be preserved without distortion.
4. **Companion Mode Dynamics:** During Companion Mode, caregivers can ask arbitrary, unseen questions. The Context Engine dynamically generates ephemeral choices; it is NOT a hardcoded dictionary.
5. **No BioAmp / sEMG / Telemetry:** The legacy BioAmp EXG pill, EMG telemetry, and GPIO34 dependencies have been permanently purged. They must not be restored. The system relies entirely on acoustic speech capture.
6. **Patient Voice ID Security:** Stored patient `voiceId` values in MongoDB `VoiceProfile` map strictly to the patient's enrolled **Cartesia** voice clone. These IDs belong strictly to the authenticated patient, must never be duplicated across unrelated patients, and must never be hard-coded or exposed in frontend code. Cartesia emotion parameters may be passed dynamically where supported by the implementation.
7. **Clinical Identity Isolation:** Dedicated Doctor and Caregiver modules remain active in the application. However, Caregiver and Doctor modules **MUST NOT** create, overwrite, duplicate, or corrupt authoritative Patient identity or clinical profile data.
8. **Language Accuracy:** The pipeline supports the exact languages provided by the speech input (e.g., Kannada input to Kannada output, English input to English output). It does not invent or claim support for languages (like Punjabi or Hindi) unless explicitly verified by the underlying TTS/STT providers in the current codebase.
9. **Hardware Audio Interfaces:**
    - Microcontroller: ESP32 Dev Board (`VoiceBack-Neckband`).
    - Service UUID: `4fa8c001-1278-472e-b997-63992e716a4d`.
    - **Microphone (INMP441 / I2S_NUM_1):** `SCK = GPIO32`, `WS = GPIO33`, `SD = GPIO35`.
    - **Speaker (MAX98357A / I2S_NUM_0):** `BCLK = GPIO26`, `LRC/WS = GPIO25`, `DIN = GPIO22`.
    - Audio Format: 16kHz, 16-bit, Mono PCM.

## Final Scope
- Persistent, authoritative single-profile mapping per registered account (`Patient`, `Doctor`, `Caregiver`).
- Verified relational linkages (`UserLogin` ↔ `Patient` ↔ `Doctor` / `Caregiver`).
- Active Mongoose models in production MongoDB Atlas: `UserLogin`, `Patient`, `Doctor`, `Caregiver`, `VoiceProfile`, `TherapyProgress`, `CommunicationHistory`, `Appointment`, `EmergencySOS`.
- Ephemeral context-driven response suggestion engine powered by Gemini LLM (`contextEngineService.js`) handling both reconstruction and Companion Mode dynamic responses.
- Instant Voice Cloning via Cartesia TTS for enrolled patients.
- Automatic bi-directional BLE transmission for microphone ingress and speaker egress.
- Zero reliance on localhost or hardcoded credentials in production.

## Database & Relationship Rules
- Exactly one `UserLogin` per registered account.
- One authoritative `Patient`, `Doctor`, or `Caregiver` clinical record linked by stable MongoDB `ObjectId`.
- No identity inference from mutable display names.
- Zero destructive cleanup or record purging without explicit human authorization.

## Authentication & Security
- Mandatory JWT bearer token route protection across all REST endpoints.
- Passwords hashed with `bcrypt` (10 rounds) and excluded (`.select('-passwordHash')`) from query payloads.
- Environment-driven secrets (`.env` local, production variables in host environment) containing `ELEVENLABS_API_KEY`, `CARTESIA_API_KEY`, `GEMINI_API_KEY`, `MONGODB_URI`, `JWT_SECRET`. Secrets must NEVER be exposed to the client.

## Scope Control & PRD Alignment
All implementation, testing, and documentation preparation must follow this locked specification. No modifications to backend source code, PWA code, or firmware are permitted during documentation alignment.
