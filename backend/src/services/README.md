# Services Directory

> **Status:** Fully Implemented (9 Domain Services + Auth Service)

This directory contains business logic, database query operations, and authentication logic:
- `userLoginService.js`: UserLogin CRUD, `bcrypt` password hashing (10 salt rounds), query password exclusion (`.select('-passwordHash')`), and JWT authentication (`loginUser`).
- `patientService.js`: Patient clinical demographic CRUD & doctor/caregiver linkage operations.
- `doctorService.js`: Medical practitioner CRUD operations.
- `caregiverService.js`: Caregiver contact relationship CRUD operations.
- `voiceProfileService.js`: TTS audio synthesis profile CRUD operations.
- `emgProfileService.js`: sEMG calibration vector baseline CRUD operations.
- `therapyProgressService.js`: Therapy session score tracking CRUD operations.
- `communicationHistoryService.js`: Speech attempt recognition log CRUD operations.
- `appointmentService.js`: Clinical appointment scheduling CRUD operations.
- `index.js`: Centralized export module bundling all service layers.

