# VoiceBack – Project History & Milestone Timeline

> **Document Status:** Verified Chronological Record  
> **Source of Truth:** Repository History & Commit Logs  

---

## Chronological Milestones

The following timeline details verified milestones completed in the VoiceBack project.

| Milestone Date | Phase / Category | Confirmed Event & Accomplishment | Status |
| :--- | :--- | :--- | :--- |
| **2026-07-25** | **Concept & Domain** | **Project Idea Finalized:** Selected VoiceBack project concept focused on restoring real-time speech intent for aphasia patients using neck surface electromyography (sEMG) and localized audio feedback. | **Completed** |
| **2026-07-26** | **Infrastructure** | **Repository Created:** Initialized local workspace directory structure and initialized Git version control repository. | **Completed** |
| **2026-07-27** | **Infrastructure** | **GitHub Configured:** Configured remote GitHub repository synchronization to enable parity between Home PC and College PC workstations. | **Completed** |
| **2026-07-28** | **Documentation** | **Documentation Structure Created:** Created primary root documentation suite (`README.md`, `PROJECT_CONTEXT.md`) and initialized the `docs/` technical documentation directory. | **Completed** |
| **2026-07-29** | **Firmware** | **Firmware Initialized:** Created PlatformIO ESP32 project structure in `firmware/` with `platformio.ini`, configuring library dependencies for `ArduinoJson` and `NimBLE-Arduino`. | **Completed** |
| **2026-07-30** | **Firmware & Hardware** | **Phase 1 Implementation Complete:** Implemented modular C++ firmware drivers for AD620 EMG acquisition (`emg_sensor`), Exponential Moving Average filtering ($\alpha=0.15$), NimBLE GATT telemetry service streaming JSON (`ble_service`), and MAX98357A I2S audio driver with startup chime (`audio_driver`). | **Completed** |
| **2026-07-31** | **Backend & Database** | **Phase 2 Backend & Database Complete:** Implemented Node.js Express REST API, MongoDB Atlas database connection, 9 Mongoose schemas, full CRUD services & controllers, bcrypt password hashing (10 rounds), JWT login authentication service, environment variable configuration, and Postman API test suite. | **Completed** |

---

## Current Implementation Phase Summary

```
[Phase 1: ESP32 Firmware & Hardware Integration]  <-- COMPLETED
                       │
                       ▼
[Phase 2: Express REST API & JWT Authentication]  <-- COMPLETED
                       │
                       ▼
[Phase 4: MongoDB Atlas Database Integration]    <-- COMPLETED
                       │
                       ▼
[Phase 2 Client: React Progressive Web App (PWA)] <-- ACTIVE / PLANNED
                       │
                       ▼
[Phase 3: FastAPI AI Engine & Feature Pipeline]   <-- PLANNED
```

- **Active Phase:** Firmware, Backend API, and Database Tier Complete; transitioning to React Progressive Web App (PWA) client interface.
- **Verified Code Artifacts:**
  - **Firmware:** `firmware/platformio.ini`, `firmware/include/config.h`, `emg_sensor.h/cpp`, `ble_service.h/cpp`, `audio_driver.h/cpp`, `main.cpp`
  - **Backend API:** `backend/src/app.js`, `backend/src/server.js`, `backend/src/config/`, `backend/src/models/`, `backend/src/services/`, `backend/src/controllers/`, `backend/src/routes/`
  - **Environment & Scripts:** `backend/.env`, `backend/scripts/testModels.js`, `backend/scripts/testServices.js`, `backend/scripts/testRoutes.js`

