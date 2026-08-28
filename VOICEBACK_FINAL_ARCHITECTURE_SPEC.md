# VOICEBACK_FINAL_ARCHITECTURE_SPEC

Frozen planning document — 19 Aug 2026 baseline; final deadline 27 Aug 2026.

## Purpose
This is the single source of truth for VoiceBack. Antigravity must modify only the explicitly requested section and must not redesign unrelated UI, database, AI, firmware, or deployment components.

## Final scope
- Patient/Doctor/Caregiver profile persistence and display.
- One authoritative profile per registered account; no duplicate profile creation.
- Real-ID Doctor↔Patient and Caregiver↔Patient relationships.
- Appointments, Medical Team, CommunicationHistory, VoiceProfile, EMGProfile, TherapyProgress, SOS.
- Dynamic context-aware response suggestions for arbitrary caregiver questions.
- Patient voice cloning when an authorized patient recording exists.
- Age/gender/language-appropriate fallback voice when cloning is unavailable.
- Natural TTS, explicit language selection, clear spacing, one playback path.
- CNN + Transformer + CTC EMG architecture stays frozen.
- ESP32 + BioAmp EXG Pill interface ready; BioAmp is the remaining physical dependency.
- Production deployment with environment variables and no localhost dependency in production.
- Responsive UI.

## Frozen AI pipeline
EMG input → preprocessing → 112-dim features → 1D Temporal CNN → sinusoidal positional encoding → 2-layer Transformer Encoder → linear projection/log-softmax → CTC greedy decoding → text/intent.

## Frozen voice pipeline
Authorized patient recording → ElevenLabs Instant Voice Clone → patientId↔voiceId → arbitrary response text → ElevenLabs TTS → single clean audio playback. If no patient recording, choose fallback voice by age+gender+language. Browser SpeechSynthesis is emergency/offline fallback only.

## Context-aware communication
Caregiver question → context understanding → dynamic relevant suggestions → patient selects OR Try Speaking/Other → recognition + validation → intent/semantic interpretation → response text → patient/fallback voice → speaker. Suggestions are not the patient’s actual answer until selected.

## EMG hardware
Surface electrodes → BioAmp EXG Pill (1 channel prototype) → ESP32 ADC → BLE telemetry → VoiceBack input. The one-channel prototype demonstrates physical EMG acquisition and plumbing; the existing Gaddy checkpoint is a multi-channel model and must not be claimed as directly validated for 1-channel input.

## Simulation
Synthetic EMG may test transport, buffering, waveform UI, APIs, and integration plumbing. It must not be used as evidence of patient silent-speech recognition accuracy. Microphone remains a development fallback until BioAmp integration.

## Firmware target
Keep current ADC/BLE foundation; finish reliable stream into software and finish MAX98357A audio path. Do not redesign cloud/app interfaces for a specific board.

## Database rules
One UserLogin per registered account; one authoritative Patient/Doctor/Caregiver profile per account; stable IDs for relationships; no identity from display names; no destructive cleanup without explicit approval.

## Authentication/security
Add JWT route protection before production deployment. Keep secrets only in environment variables; never commit `.env`.

## Deployment
PWA → cloud backend/API → MongoDB Atlas; backend → ElevenLabs; ESP32/BioAmp → EMG input interface. Production API URL and secrets are environment-driven.

## Keep / Archive / Remove
**KEEP:** finalized AI model, preprocessing, PWA/backend, DB models, voice profile/TTS, firmware foundation, deployment config.
**ARCHIVE:** legacy baseline model, historical audits, raw dataset archives, useful verification scripts.
**REMOVE after audit:** proven-unused duplicate implementations, dead routes, temporary UI, redundant voice paths, one-off scripts.
**DO NOT DELETE YET:** MongoDB documents or files before read-only reference audit.

## Antigravity scope-control rule
“Follow VOICEBACK_FINAL_ARCHITECTURE_SPEC.md. Modify only the explicitly requested section. Do not redesign, delete, refactor, or change unrelated architecture, UI, database schema, AI model, firmware, or deployment behavior. Stop and report if the requested change conflicts with this specification.”

## Timeline
19–20 Aug: freeze/stabilize. 21 Aug: context flow. 21–22 Aug: voice/TTS fixes. 22–23 Aug: deployment. 23–24 Aug: firmware/hardware readiness. 24 Aug: BioAmp expected. 25–26 Aug: integration/testing. 27 Aug: final validation/presentation.
