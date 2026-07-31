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

---

## Current Implementation Phase Summary

```
[Phase 1: ESP32 Firmware & Hardware Integration]  <-- COMPLETED
                       │
                       ▼
[Phase 2: React PWA & Express JWT Backend]       <-- PLANNED (NEXT)
                       │
                       ▼
[Phase 3: AI Inference Engine & Feature Pipeline] <-- PLANNED
                       │
                       ▼
[Phase 4: MongoDB Atlas Integration & Portals]    <-- PLANNED
```

- **Active Phase:** Phase 1 complete; transitioning to Phase 2 (React PWA & Express JWT Backend API).
- **Verified Code Artifacts:**
  - `firmware/platformio.ini`
  - `firmware/include/config.h`
  - `firmware/include/emg_sensor.h` & `firmware/src/emg_sensor.cpp`
  - `firmware/include/ble_service.h` & `firmware/src/ble_service.cpp`
  - `firmware/include/audio_driver.h` & `firmware/src/audio_driver.cpp`
  - `firmware/src/main.cpp`
