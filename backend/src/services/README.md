# Services Directory

> **Status:** Fully Implemented (Domain & Cloud Integration Services)

This directory contains business logic, database query operations, authentication, and cloud AI integrations:
- `userLoginService.js`: UserLogin CRUD, `bcrypt` password hashing (10 salt rounds), query password exclusion (`.select('-passwordHash')`), and JWT authentication (`loginUser`).
- `patientService.js`: Patient clinical demographic CRUD & doctor/caregiver linkage operations.
- `doctorService.js`: Medical practitioner CRUD operations.
- `caregiverService.js`: Caregiver contact relationship CRUD operations.
- `voiceProfileService.js`: TTS audio synthesis profile CRUD operations and Cartesia voice profile tracking.
- `elevenLabsService.js`: Gateway integration for ElevenLabs Scribe Speech-to-Text (STT) phonetic transcription.
- `cartesiaService.js` (or integrated voice synthesis gateway): Cartesia Instant Voice Cloning integration for high-fidelity speech synthesis using the patient's `voiceId` and dynamic emotion parameters.
- `contextEngineService.js`: Gemini LLM context reasoning engine responsible for reconstructing unclear/broken speech and generating ephemeral response options for Companion Mode questions.
- `nlpProcessorService.js`: Text preprocessing, phrase extraction, and sentiment/intent classification for patient speech inputs.
- `emergencySOSService.js`: Patient emergency panic alert dispatch, caregiver notifications, and resolution status management.
- `therapyProgressService.js`: Therapy session score tracking CRUD operations.
- `communicationHistoryService.js`: Speech attempt recognition log CRUD operations.
- `appointmentService.js`: Clinical appointment scheduling CRUD operations.
- `index.js`: Centralized export module bundling service layers.

*(Note: The legacy `emgProfileService.js` has been retired from the active production architecture).*
