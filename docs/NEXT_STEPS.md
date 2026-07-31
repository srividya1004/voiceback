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

## 2. Short-Term Tasks (Phase 2 Mobile Application)

| Priority | Task Description | Target Module | Status |
| :---: | :--- | :--- | :---: |
| **P0** | **Initialize Mobile App:** Create React Native project structure using TypeScript in `mobile/`. | `mobile/` | **`[Planned]`** |
| **P0** | **BLE Client Integration:** Implement `react-native-ble-plx` manager to scan, pair, and subscribe to `VoiceBack-Neckband` GATT notifications. | `mobile/` | **`[Planned]`** |
| **P1** | **Real-Time Signal Plotter:** Build canvas / SVG real-time sEMG waveform graph component rendering filtered sEMG telemetry. | `mobile/` | **`[Planned]`** |
| **P1** | **Mobile Speech Output:** Integrate native Text-to-Speech (TTS) engine to speak recognized text commands locally on the mobile phone. | `mobile/` | **`[Planned]`** |

---

## 3. Medium-Term Tasks (Phase 3 AI Pipeline & Backend API)

| Priority | Task Description | Target Module | Status |
| :---: | :--- | :--- | :---: |
| **P0** | **FastAPI AI Engine Setup:** Create Python 3.10 FastAPI service environment in `ai_engine/`. | `ai_engine/` | **`[Planned]`** |
| **P0** | **Sliding Window Feature Extractor:** Implement 200ms window (50ms overlap) feature calculation for MAV, RMS, ZCR, and Waveform Length (WL). | `ai_engine/` | **`[Planned]`** |
| **P1** | **ML Classifier Training:** Train lightweight Random Forest / CNN model on neck sEMG dataset to classify speech intent categories. | `ai_engine/` | **`[Planned]`** |
| **P1** | **Node.js REST API Server:** Implement Express server in `backend/` handling authentication and Socket.io streaming relays. | `backend/` | **`[Planned]`** |

---

## 4. Long-Term Goals (Phase 4 Database, Web Portals & Clinical Evaluation)

| Priority | Task Description | Target Module | Status |
| :---: | :--- | :--- | :---: |
| **P0** | **MongoDB Atlas Deployment:** Provision database instance and define 9 collections (`UserLogin`, `Patient`, `Doctor`, `Caregiver`, `VoiceProfile`, `EMGProfile`, `TherapyProgress`, `CommunicationHistory`, `Appointment`). | `backend/` | **`[Planned]`** |
| **P1** | **Doctor & Caregiver Web Dashboards:** Build React web application in `web_portals/` for clinical therapy progress tracking. | `web_portals/` | **`[Planned]`** |
| **P2** | **Ergonomic Neckband Enclosure:** 3D print dynamic neckband enclosure housing ESP32, TP4056 PMIC, battery, amplifier, and speaker. | `hardware/` | **`[TODO]`** |
| **P2** | **Clinical Pilot Testing:** Conduct trial evaluation with speech pathologists and aphasia patients for usability feedback. | Clinical | **`[Planned]`** |
