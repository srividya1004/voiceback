# VoiceBack – Prioritized Development Roadmap & Next Steps

> **Document Status:** Active Roadmap  
> **Last Updated:** 2026-07-31  

---

## 1. Immediate Tasks (Phase 1 Validation & Bench Testing)

| Priority | Task Description | Target Module | Status |
| :---: | :--- | :--- | :---: |
| **P0** | **Hardware Bench Validation:** Connect AD620 EMG sensor module with gel electrodes to anterior neck muscle sites; verify 12-bit ADC readings in Serial Plotter. | `firmware/` | **Active** |
| **P0** | **BLE Stream Stability Test:** Verify NimBLE JSON telemetry payload reception (`raw`, `flt`, `vlt`) on nRF Connect / LightBlue mobile debugging tools. | `firmware/` | **Pending** |
| **P1** | **I2S Audio Clarity Testing:** Test audio playback through MAX98357A amp and 4Ω 3W speaker using clean 16kHz mono PCM samples. | `firmware/` | **Pending** |
| **P1** | **Dataset Collection Protocol:** Record baseline raw sEMG voltage traces for resting state vs active vocal muscle contractions (silent speech attempts). | `firmware/` | **Pending** |

---

## 2. Completed & Active Software Tasks (Phase 2 React PWA & Backend)

| Priority | Task Description | Target Module | Status |
| :---: | :--- | :--- | :---: |
| **P0** | **Node.js Express Backend & JWT Authentication:** Initialize Express server in `backend/`, configure bcrypt hashing, JWT auth, and connect MongoDB Atlas with 9 Mongoose collection schemas. | `backend/` | **Completed** |
| **P0** | **MongoDB Atlas Schema Integration & REST Endpoints:** Build 9 resource services, controllers, routes, `.env` config, and standalone Postman verification suite. | `backend/` | **Completed** |
| **P0** | **Initialize React PWA Architecture (Sprint 1):** Create Vite + React project structure in `pwa/` with Vanilla CSS design tokens, routing, theme, auth flows, splash screen, welcome experience, role selection, and accessibility foundation. | `pwa/` | **Completed (v0.3)** |
| **P0** | **Patient Persistent Login & Per-Session Auth:** Implement single-setup persistent device session for Patients and secure per-session auth for Doctors & Caregivers. | `pwa/` | **Completed (v0.3)** |
| **P0** | **Web Bluetooth BLE Client (Sprint 2):** Implement Web Bluetooth API manager to scan, pair, and subscribe to `VoiceBack-Neckband` GATT notifications directly from Chrome/Edge browsers. | `pwa/` | **`[Planned - Sprint 2]`** |
| **P1** | **Real-Time Signal Plotter (Sprint 2):** Build HTML5 Canvas / SVG real-time sEMG waveform graph component rendering filtered sEMG telemetry. | `pwa/` | **`[Planned - Sprint 2]`** |
| **P1** | **Web Speech Output (Sprint 2):** Integrate Web Speech API (Text-to-Speech synthesis) to speak recognized text commands locally on client devices. | `pwa/` | **`[Planned - Sprint 2]`** |

---

## 3. Medium-Term Tasks (Phase 3 AI Pipeline & Web Portals)

| Priority | Task Description | Target Module | Status |
| :---: | :--- | :--- | :---: |
| **P0** | **FastAPI AI Engine Setup:** Create Python 3.10 FastAPI service environment in `ai_engine/`. | `ai_engine/` | **`[Planned]`** |
| **P0** | **Sliding Window Feature Extractor:** Implement 200ms window (50ms overlap) feature calculation for MAV, RMS, ZCR, and Waveform Length (WL). | `ai_engine/` | **`[Planned]`** |
| **P1** | **ML Classifier Training:** Train lightweight Random Forest / CNN model on neck sEMG dataset to classify speech intent categories. | `ai_engine/` | **`[Planned]`** |
| **P1** | **Patient, Doctor & Caregiver Portals:** Build multi-role UI components within `pwa/` for clinical tracking, therapy metrics, and communication logs. | `pwa/` | **`[Planned]`** |

---

## 4. Long-Term Goals (Phase 4 Hardware Enclosure & Clinical Evaluation)

| Priority | Task Description | Target Module | Status |
| :---: | :--- | :--- | :---: |
| **P2** | **Ergonomic Neckband Enclosure:** 3D print dynamic neckband enclosure housing ESP32, TP4056 PMIC, battery, amplifier, and speaker. | `hardware/` | **`[TODO]`** |
| **P2** | **Clinical Pilot Testing:** Conduct trial evaluation with speech pathologists and aphasia patients for usability feedback. | Clinical | **`[Planned]`** |

