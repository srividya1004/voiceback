# VOICEBACK_END_TO_END_WORKFLOW

## Final product flow
1. User/profile authentication
2. Caregiver question
3. Context understanding
4. Dynamic response suggestions
5. Patient chooses OR Try Speaking/Other
6. EMG: electrodes → BioAmp → ESP32 ADC (microphone is development fallback)
7. Preprocess + 112-dim features
8. CNN → Transformer → CTC → text
9. Validate + interpret context/intent
10. Select patient cloned voice or age/gender/language fallback
11. ElevenLabs TTS
12. One clean playback → MAX98357A → speaker
13. Persist relevant history/progress/profile data in MongoDB Atlas
14. Cloud deployment
15. BioAmp physical integration without architecture redesign

## EMG data path
Muscle activity → electrodes → BioAmp → analog output → ESP32 ADC → digital samples → BLE → VoiceBack → preprocessing → CNN → Transformer → CTC → text.

## One-channel boundary
One-channel BioAmp proves physical acquisition/plumbing. Current Gaddy model is multi-channel and is not directly validated for one-channel input. Synthetic EMG tests transport/plumbing only.

## Voice workflow
Patient voice recording → clone → patient voiceId → arbitrary response text → TTS → single playback. Without clone: profile-appropriate fallback voice.

## Database workflow
UserLogin authenticates exactly one role profile. Relationships use stable IDs. VoiceProfile/EMGProfile/TherapyProgress/CommunicationHistory/Appointment reference the patient where applicable.

## Deployment workflow
Local stabilization → production configuration → cloud verification → hardware readiness → BioAmp arrival → live EMG integration → final end-to-end test.

## Final demo
Caregiver asks a natural question → dynamic relevant options appear → patient chooses or attempts silent speech → response is validated → synthesized in patient voice/fallback → one clean speaker output → event persisted.

## Failure handling
No DB = clear error, no fabricated data. No TTS = approved fallback. No patient voice = profile fallback. No EMG = development simulator/microphone only. Uncertain recognition = retry/selection, never silent invention.

## Change gate
Read master spec → inspect → modify only one subsystem → test → manual verify → reject unrelated changes.

## Final completion gate
Profiles persist/display; no duplicate authoritative identities; role relationships work; context flow dynamic; voice clone/fallback works; TTS clean; firmware ready; BioAmp produces real samples; deployment works without localhost dependencies; documentation matches implementation.
