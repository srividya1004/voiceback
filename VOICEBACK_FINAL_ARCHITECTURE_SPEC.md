# VOICEBACK_FINAL_ARCHITECTURE_SPEC

Canonical Architecture Specification — Source-of-Truth Lock for Final PRD Baseline.

## Purpose
This document defines the single canonical source of truth for the VoiceBack system architecture, product workflows, and hardware/software contracts. All system components (PWA frontend, Express REST API, MongoDB Atlas, ESP32 firmware) must conform strictly to this specification.

## Locked Product Architecture & Pipeline
The canonical end-to-end VoiceBack communication pipeline operates through the following sequence:

```
Physical Microphone (Primary Speech Input)
  └──> Wispr Flow (Speech-to-Text Layer)
        └──> Raw Transcript
              └──> Speech Cleanup (Noise tag stripping & normalization)
                    └──> Unclear-Word Correction (Phonetic & dysarthric normalization)
                          └──> Meaning Reconstruction (Semantic plausibility inferencing)
                                └──> Context / Intent Understanding (Gemini LLM / Context Engine)
                                      └──> Temporary Dynamic Response Choices (Ephemeral in RAM)
                                            └──> Patient Selects Response
                                                  └──> Patient Confirms (Explicit confirmation gate)
                                                        └──> Stored Patient Voice ID (MongoDB VoiceProfile)
                                                              └──> ElevenLabs TTS (eleven_v3 / eleven_multilingual_v2)
                                                                    └──> Audio (16kHz 16-bit PCM Mono)
                                                                          └──> BLE GATT Stream (VoiceBack-Neckband)
                                                                                └──> ESP32 Microcontroller
                                                                                      └──> MAX98357A I2S DAC (GPIO26/25/22)
                                                                                            └──> Physical Speaker
```

## Architectural Tenets & Invariants

1. **Primary Speech Input:** The physical microphone is the **PRIMARY** speech input mechanism for capturing patient vocalizations (weak, whispered, or dysarthric speech).
2. **Speech-to-Text Layer:** **Wispr Flow** (or an approved speech-to-text provider) is the designated speech recognition layer. It must **never** be referred to as "Whisper", and OpenAI Whisper must not be reintroduced.
3. **No sEMG Speech Recognition:** The retired 1D Temporal CNN + 2-layer Transformer + CTC greedy decoding sEMG speech-recognition architecture is completely purged and must not be restored.
4. **BioAmp EXG Pill Role:** The BioAmp EXG Pill (analog input on ESP32 `GPIO34` / `ADC1_CH6`) is utilized solely for hardware telemetry, baseline calibration, and prototype demonstration. It is **NOT** the primary speech-recognition mechanism.
5. **Clinical Identity Isolation:** Dedicated Doctor and Caregiver modules remain active in the application. However, Caregiver and Doctor modules **MUST NOT** create, overwrite, duplicate, or corrupt authoritative Patient identity or clinical profile data.
6. **Dynamic Choice Ephemerality:** Temporary dynamic response suggestions are generated strictly during an active conversational interaction and **MUST NOT** become permanent patient dashboard content. Suggestions disappear immediately once the interaction is completed or cancelled.
7. **Production Data Integrity:** No synthetic, demo, or test patient records exist or may be created in the production MongoDB Atlas database. No fake communication histories or test audio metadata may be persisted.
8. **Patient Voice ID Security:** Stored patient `voiceId` values in MongoDB `VoiceProfile` belong strictly to the authenticated patient, must never be duplicated across unrelated patients, and must never be hard-coded.
9. **Kannada Voice Cloning & PVC Fallback Policy:**
   - ElevenLabs `eleven_v3` supports Kannada speech synthesis.
   - However, current ElevenLabs Professional Voice Cloning (PVC) documentation does **NOT** list Kannada as an officially supported PVC training language.
   - Therefore, Kannada patient-voice cloning must **not** be documented or claimed as guaranteed.
   - When a patient's cloned voice cannot be used for Kannada, the system must utilize an explicitly documented approved fallback voice (e.g., standard multilingual neural profile) rather than misrepresenting output as the patient's personal cloned voice.
10. **Hardware Audio Interface:**
    - Microcontroller: ESP32 Dev Board (`VoiceBack-Neckband`).
    - Audio DAC/Amp: MAX98357A I2S Class-D amplifier.
    - Compiled Firmware Pinout: `BCLK = GPIO26`, `LRC = GPIO25`, `DOUT = GPIO22`.
    - BioAmp Sensor Pin: `OUT = GPIO34`.

## Final Scope
- Persistent, authoritative single-profile mapping per registered account (`Patient`, `Doctor`, `Caregiver`).
- Verified relational linkages (`UserLogin` ↔ `Patient` ↔ `Doctor` / `Caregiver`).
- 10 Mongoose models in production MongoDB Atlas: `UserLogin`, `Patient`, `Doctor`, `Caregiver`, `VoiceProfile`, `EMGProfile`, `TherapyProgress`, `CommunicationHistory`, `Appointment`, `EmergencySOS`.
- Ephemeral context-driven response suggestion engine powered by Gemini LLM (`contextEngineService.js`) with deterministic fallback rules.
- Instant Voice Cloning via ElevenLabs for enrolled patients with verified English voice samples.
- Seamless BLE transmission of resampled 16kHz PCM audio packets to ESP32 for physical speaker output.
- Zero reliance on localhost or hardcoded credentials in production.

## Database & Relationship Rules
- Exactly one `UserLogin` per registered account.
- One authoritative `Patient`, `Doctor`, or `Caregiver` clinical record linked by stable MongoDB `ObjectId`.
- No identity inference from mutable display names.
- Zero destructive cleanup or record purging without explicit human authorization.

## Authentication & Security
- Mandatory JWT bearer token route protection across all REST endpoints.
- Passwords hashed with `bcrypt` (10 rounds) and excluded (`.select('-passwordHash')`) from query payloads.
- Environment-driven secrets (`.env` local, production variables in host environment).

## Scope Control & PRD Alignment
All implementation, testing, and PRD preparation must follow this locked specification. No modifications to backend source code, PWA code, or firmware are permitted during documentation alignment.
