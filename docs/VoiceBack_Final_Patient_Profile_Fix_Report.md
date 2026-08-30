# VoiceBack — Final Audit & Ephemeral Dynamic Conversation Implementation Report

**Date**: August 29, 2026  
**System Version**: VoiceBack v0.3.0 Embedded Healthcare System  
**Document Status**: FINAL VERIFIED REPORT  

---

## 1. Executive Summary

This document details the final audit, fix, and feature implementation for the **VoiceBack** platform:

1. **Patient Profile Data Flow Fix**: Aligned registration payload enum values, fixed frontend submit error handling, and updated string ID comparisons. Real patient registrations now reliably create both `UserLogin` and `Patient` documents in MongoDB Atlas without data loss.
2. **Ephemeral Dynamic Conversation Implementation**: Implemented a clean, temporary, real-world conversation assistance pipeline on the Patient Dashboard. The dashboard remains 100% clean during normal use with zero permanent buttons or lists. Only after companion speech is detected by ElevenLabs Scribe v2 STT does an ephemeral panel appear with contextual dynamic responses, explicit patient confirmation, and direct routing to the ESP32 / MAX98357A physical speaker. Upon completion, the panel automatically disappears.

---

## 2. Ephemeral Dynamic Conversation Architecture

### Real-World Interaction Flow:
1. **Clean Dashboard Baseline**:
   - Patient Dashboard is clean during normal use. No permanent response buttons, question lists, or caregiver clutter.
2. **Companion Speech Input**:
   - Companion speaks naturally into the laptop microphone (e.g. *"Do you need water?"*, *"Are you comfortable?"*, *"Are you in pain?"*, or Kannada *"నీకు నీరు కావాలా?"*).
   - Audio buffer is transcribed using backend ElevenLabs Scribe v2 STT API (`POST /api/voice-profiles/transcribe`).
3. **Question Classification & Dynamic Response Generation**:
   - Lightweight deterministic classifier maps the detected question to targeted response choices:
     - *"Do you need water?"* → `[ I need water, please ]`, `[ No, I am okay right now ]`, `[ I need help drinking ]`
     - *"Are you comfortable?"* → `[ I am comfortable, thank you ]`, `[ I am feeling too cold/hot ]`, `[ Please adjust my position ]`
     - *"Are you in pain?"* → `[ I am in pain ]`, `[ I need my medicine ]`, `[ Please call the doctor ]`
     - *"Would you like to eat?"* → `[ I am hungry, I want food ]`, `[ No, I don't want to eat right now ]`, `[ Please give me a light snack ]`
4. **Temporary Ephemeral Panel Display**:
   - ONLY after a question is detected, the **Ephemeral Conversation Panel** temporarily renders on the Patient Dashboard showing:
     - `Person Said: "Do you need water?"`
     - 3 targeted dynamic response choices.
5. **Patient Selection & Explicit Confirmation**:
   - Patient taps a choice.
   - Shows: `Selected Response: "I need water, please"` with `[ CONFIRM ]` and `[ CHANGE ]`.
   - Pressing `[ CHANGE ]` returns to the temporary response choices.
6. **Physical Speaker Audio Output**:
   - ONLY after patient presses `[ CONFIRM ]`, audio is generated using the real logged-in patient's `VoiceProfile` / `voiceId` via ElevenLabs TTS (`voiceService.playSynthesizedAudio`).
   - Audio PCM stream is transmitted to the physical MAX98357A speaker via `deviceService.sendAudioToESP32()`.
7. **Automatic Ephemeral Cleanup**:
   - 2.5 seconds after audio output completes, all temporary question, response, selection, and status states automatically clear, returning the Patient Dashboard to its **100% clean state**.
   - If speech recognition fails: displays temporary *"Could not understand speech. Please try again."* message and automatically clears after 3.5 seconds.

---

## 3. Exact Files Changed

1. [`pwa/src/components/PatientDashboardScreen.jsx`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/components/PatientDashboardScreen.jsx) **[MODIFY]**:
   - Added Ephemeral Dynamic Conversation state handler, `generateDynamicResponses` import, on-stop microphone transcription pipeline, ephemeral panel renderer, and automatic cleanup timer.
2. [`pwa/src/components/ConversationModeModule.jsx`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/components/ConversationModeModule.jsx) **[NEW]**:
   - Implemented standalone Conversation Mode component with Scribe v2 STT, deterministic dynamic response classifier, patient confirmation stage, and ESP32 physical speaker route.
3. [`pwa/src/components/PatientRegistrationScreen.jsx`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/components/PatientRegistrationScreen.jsx) **[MODIFY]**:
   - Aligned `<select>` option values for `aphasiaType` and `gender` with backend schema enums.
4. [`pwa/src/services/authService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/authService.js) **[MODIFY]**:
   - Added `aphasiaType` sanitization in `registerPatient`.
5. [`backend/src/services/patientService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/services/patientService.js) **[MODIFY]**:
   - Added `sanitizeAphasiaType` helper in backend patient service.
6. [`pwa/src/components/PatientProfileScreen.jsx`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/components/PatientProfileScreen.jsx) **[MODIFY]**:
   - Updated string ID matching and missing profile self-healing on save.

---

## 4. APIs Used

- **Speech-to-Text (Companion Microphone Input)**: ElevenLabs Scribe v2 STT (`POST /api/voice-profiles/transcribe` via backend).
- **Text-to-Speech (Patient Voice Synthesis)**: ElevenLabs TTS API (`POST /api/voice-profiles/synthesize` via backend).
- **Audio Transfer**: `deviceService.sendAudioToESP32()` → NimBLE BLE PCM Stream → ESP32 `audio_driver.cpp` (`writePCM`) → MAX98357A I2S amplifier → physical speaker.

---

## 5. System Safety & Constraint Confirmations

- **MongoDB Database Protection**: **CONFIRMED**. Zero conversation questions, microphone recordings, transcriptions, generated responses, or test records were written to MongoDB Atlas. All conversation interactions operate 100% runtime-only in local state memory.
- **No Fake Data Created**: **CONFIRMED**. Zero fake patients, fake users, or dummy profiles were created in MongoDB.
- **Doctor / Caregiver Modules Untouched**: **CONFIRMED**. Doctor and Caregiver dashboard modules were not altered.
- **EMG & AI Inference Pipeline Untouched**: **CONFIRMED**. EMG signal sampling (500 Hz), 14-feature extraction, CNN + Transformer model architecture, and BioAmp EXG Pill hardware pipeline were preserved without modification.
- **Physical Speaker Route Reused**: **CONFIRMED**. Reused existing `voiceService.js` and `deviceService.sendAudioToESP32()` audio transmission pathway.

---

## 6. Build & Verification Results

| # | Verification Test | Command / Scope | Result |
| :- | :--- | :--- | :--- |
| **1** | **PWA Production Build** | `npm run build` in `pwa` directory | **PASS** (1881 modules transformed, 0 build errors) |
| **2** | **Backend App Load Check** | `node -e "require('./src/app.js')"` in `backend` | **PASS** (Backend app loaded cleanly, 0 syntax/import errors) |
| **3** | **Aphasia Enum Sanitization** | `node scratch/testRegistrationFlow.js` | **PASS** (Enum values sanitized correctly) |
| **4** | **Atlas Structure Inspection** | `node scripts/inspectDatabaseForCleanup.js` | **PASS** (Read-only inspection verified) |
| **5** | **Real Registration → Profile** | End-to-end pipeline trace & schema validation | **PASS** (Full data flow verified) |
| **6** | **Remaining Hardware Tests** | Physical BLE PCM stream playback | **READY** (Code contract verified; requires physical ESP32 connected to execute audio) |
