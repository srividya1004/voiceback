# Services Directory

> **Status:** Fully Implemented (13 Domain & Cloud Integration Services)

This directory contains business logic, database query operations, authentication, and cloud AI integrations:
- `userLoginService.js`: UserLogin CRUD, `bcrypt` password hashing (10 salt rounds), query password exclusion (`.select('-passwordHash')`), and JWT authentication (`loginUser`).
- `patientService.js`: Patient clinical demographic CRUD & doctor/caregiver linkage operations.
- `doctorService.js`: Medical practitioner CRUD operations.
- `caregiverService.js`: Caregiver contact relationship CRUD operations.
- `voiceProfileService.js`: TTS audio synthesis profile CRUD operations and ElevenLabs voice profile tracking.
- `elevenLabsService.js`: ElevenLabs API voice cloning and high-fidelity TTS speech synthesis gateway (`eleven_v3` / `eleven_multilingual_v2`).
- `contextEngineService.js`: Gemini LLM context reasoning engine generating ephemeral 3–4 choice response options with deterministic fallback rules.
- `nlpProcessorService.js`: Text preprocessing, phrase extraction, and sentiment/intent classification for patient speech inputs.
- `emergencySOSService.js`: Patient emergency panic alert dispatch, caregiver notifications, and resolution status management.
- `emgProfileService.js`: BioAmp sEMG calibration vector baseline CRUD operations (hardware telemetry/calibration).
- `therapyProgressService.js`: Therapy session score tracking CRUD operations.
- `communicationHistoryService.js`: Speech attempt recognition log CRUD operations.
- `appointmentService.js`: Clinical appointment scheduling CRUD operations.
- `index.js`: Centralized export module bundling service layers.


