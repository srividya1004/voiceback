# VoiceBack – Artificial Intelligence & System Context

> **Document Version:** 1.0  
> **Status:** Active / Source of Truth  
> **Last Updated:** 2026-07-31  

---

## 1. Project Overview

**VoiceBack** is an embedded AI healthcare wearable prototype engineered to restore real-time speech intent for aphasia patients. The system captures surface electromyography (**sEMG**) neuromuscular signals from the anterior neck muscles, filters and processes signal features, decodes intended speech via an AI inference pipeline, and generates localized vocal audio output via an onboard I2S Class-D amplifier and speaker, alongside streaming telemetry to a mobile application interface.

---

## 2. Problem Statement

**Aphasia** is a severe neuro-cognitive language disorder caused by stroke, traumatic brain injury, or brain tumors. While affected individuals often lose the ability to articulate vocalized speech clearly, the underlying neuromuscular intent to speak remains active. Subtle laryngeal and vocal fold muscle contractions occur even when vocalizations are weak, whispered, silent, or unintelligible. Existing augmentative and alternative communication (AAC) devices rely on manual touchpads or eye-tracking, which are slow and unintuitive. VoiceBack addresses this by directly decoding non-invasive neck neuromuscular activity into spoken words.

---

## 3. Objectives

- **Primary Goal:** Decode non-invasive surface EMG neck muscle signals corresponding to speech intent into vocal audio output.
- **Hardware Integration:** Implement a low-power, ergonomic smart neckband utilizing ESP32 microcontroller, AD620 instrumentation amplifier, and MAX98357A I2S audio amplifier.
- **Low-Latency Wireless Streaming:** Stream real-time sEMG telemetry over Bluetooth Low Energy (BLE) using NimBLE GATT server protocols.
- **AI Classification [Planned]:** Train and deploy a lightweight machine learning classifier to categorize speech attempts into intended text phrases.
- **Ecosystem Integration [Planned]:** Connect wearable hardware with a cross-platform Mobile Application, Express REST API backend, FastAPI AI engine, and MongoDB clinical database.

---

## 4. Target Users

| Target User Group | Primary Use Case & Functionality |
| :--- | :--- |
| **Aphasia Patients** | Wearable neckband for real-time speech assistance and personalized voice feedback. |
| **Speech Pathologists & Doctors** | Clinical tracking of patient therapy progress, sEMG baseline calibration, and session logs `[Planned]`. |
| **Caregivers & Family** | Real-time monitoring of patient communication attempts and daily activity tracking `[Planned]`. |

---

## 5. Current Project Status

- **Overall Phase:** Prototype / Proof of Concept (Firmware v0.1 Implemented | Backend API v0.2 Implemented).
- **Firmware Subsystem:** Complete C++/Arduino implementation for ESP32 with 12-bit ADC acquisition, Exponential Moving Average (EMA) filtering, NimBLE GATT JSON telemetry streaming, and MAX98357A I2S DAC driver.
- **Backend Subsystem:** Complete Node.js Express REST API server connected to MongoDB Atlas with 9 Mongoose schemas, full CRUD services & controllers, bcrypt password hashing (10 rounds), JWT-based login auth service (`POST /api/user-logins/login`), `.env` configuration, and standalone Postman API test suite.
- **Hardware Subsystem:** Benchtop prototype wiring matrix validated (ESP32 Dev Board + AD620 EMG + MAX98357A Amp + 4Ω 3W Speaker). Ergonomic 3D neckband chassis physical fabrication is **`[TODO]`**.
- **Client & AI Subsystem:** React PWA and FastAPI AI Engine are **`[Planned]`**.

---

## 6. Repository Folder Structure

```
voiceback/
├── README.md               # Primary project summary & quick start index
├── PROJECT_CONTEXT.md      # Comprehensive specifications & source of truth
├── .gitignore              # PlatformIO, Node.js, Python & OS build ignores
│
├── docs/                   # Architectural & Technical Documentation Suite
│   ├── AI_CONTEXT.md       # AI & System Context specification (this document)
│   ├── PROJECT_HISTORY.md  # Verified project development log & milestones
│   ├── CHANGELOG.md        # Versioned release notes (Keep-a-Changelog format)
│   ├── NEXT_STEPS.md       # Prioritized task roadmap & development checklist
│   ├── HARDWARE.md         # Hardware components, pin assignments & wiring table
│   ├── SOFTWARE.md         # Firmware & Node.js Express backend documentation
│   ├── AI_PIPELINE.md      # Signal processing, feature extraction & ML pipeline
│   ├── DATABASE.md         # MongoDB Atlas schema specifications & verification
│   ├── DECISIONS.md        # Architecture Decision Records (ADRs)
│   └── MEETING_NOTES.md    # Confirmed meeting notes and milestone logs
│
├── firmware/               # [COMPLETED v0.1] ESP32 C++ PlatformIO Firmware Project
│   ├── platformio.ini      # Build configuration & library dependencies
│   ├── include/            # C++ Header files (config.h, emg_sensor.h, ble_service.h, audio_driver.h)
│   └── src/                # C++ Source files (main.cpp, emg_sensor.cpp, ble_service.cpp, audio_driver.cpp)
│
├── backend/                # [COMPLETED v0.2] Node.js Express REST API & MongoDB Atlas
│   ├── package.json        # Dependencies (Express, Mongoose, bcrypt, jsonwebtoken, dotenv, cors)
│   ├── .env                # Active environment variables (PORT, MONGODB_URI, JWT_SECRET)
│   ├── scripts/            # Test scripts (testModels.js, testRoutes.js, testServices.js)
│   └── src/                # Models, Controllers, Services, Routes, Utils, Middleware
│
├── pwa/                    # [Planned] React Progressive Web App (PWA - Patient/Doctor/Caregiver)
└── ai_engine/              # [Planned] FastAPI Python EMG Speech Classification Engine
```

---

## 7. Hardware Overview

The hardware baseline comprises accessible, high-performance prototype components:

- **Microcontroller:** ESP32 Development Board (ESP-WROOM-32, 240MHz dual-core CPU, 3.3V logic, built-in BLE 5.0).
- **sEMG Sensor Module:** AD620 Analog Instrumentation Amplifier Module reading differential neck muscle signals on GPIO34 (`ADC1_CH6`).
- **Audio Amplifier Subsystem:** MAX98357A I2S Class-D mono audio amplifier driven via ESP32 hardware I2S peripheral (BCLK: `GPIO4`, LRC/WS: `GPIO5`, DIN/DOUT: `GPIO6`).
- **Speaker:** 4Ω 3W dynamic mini speaker for localized voice playback.
- **Power Management:** TP4056 USB Lithium battery charger + 3.7V 800mAh Li-Po battery + SPST toggle switch.

---

## 8. Software Overview

- **Firmware (Implemented v0.1):** Developed using PlatformIO and Arduino framework. Integrates `ArduinoJson` (v6.21.3) and `NimBLE-Arduino` (v1.4.1). Includes a 50Hz fixed-interval sampling loop (20ms interval), Exponential Moving Average filtering ($\alpha = 0.15$), and I2S audio driver.
- **Backend API & Database (Implemented v0.2):** Node.js + Express REST API server with 9 Mongoose schemas connected to MongoDB Atlas, full CRUD controllers/services, bcrypt password hashing, and JWT login authentication (`POST /api/user-logins/login`).
- **React Progressive Web App `[Planned]`:** React PWA with Web Bluetooth API for sEMG telemetry reception, live waveform graphing, Web Speech TTS synthesis, and JWT multi-role access (Patient, Doctor, Caregiver).
- **AI Classification Service `[Planned]`:** FastAPI Python service running machine learning models for speech intent categorization.

---

## 9. AI Pipeline Overview

The intended VoiceBack processing pipeline flows as follows:

$$\text{EMG Signal} \longrightarrow \text{Signal Processing} \longrightarrow \text{Feature Extraction} \longrightarrow \text{Speech Generation} \longrightarrow \text{Audio Output}$$

1. **EMG Acquisition & Filtering (Implemented):** 12-bit ADC sampling at 50Hz (20ms interval) with Exponential Moving Average (EMA) smoothing:
   $$S_t = \alpha \cdot X_t + (1 - \alpha) \cdot S_{t-1} \quad (\alpha = 0.15)$$
2. **Signal Windowing & Feature Extraction `[Planned]`:** 200ms sliding window with 50ms overlap calculating Mean Absolute Value (MAV), Root Mean Square (RMS), Zero Crossing Rate (ZCR), and Waveform Length (WL).
3. **Speech Classification `[Planned]`:** Machine learning classifier (Random Forest / CNN) categorizing signals into speech attempt types (Silent, Whispered, Weak, Unclear).
4. **Speech Output Generation (Implemented Driver, TTS Planned):** Local playback via MAX98357A I2S DAC driver and neckband speaker.

---

## 10. Development Workflow & Repository Multi-Computer Parity

Development alternates between multiple workstations (**Home PC** and **College PC**). To prevent state loss:
1. **Permanent File Parity:** Code, configuration, and documentation in git repository serve as the sole source of truth.
2. **Pre-Session Pull:** Always execute `git pull` prior to making edits.
3. **Post-Session Commit:** Commit all modified files and update log files before pushing to GitHub.

---

## 11. Current Implementation Status Summary

| System Component | Implementation Status | Technologies / Modules |
| :--- | :--- | :--- |
| **ESP32 Firmware Core** | **Implemented (v0.1)** | PlatformIO, C++, ESP32 Dev Board |
| **AD620 EMG ADC Driver** | **Implemented** | GPIO34 (`ADC1_CH6`), 12-bit ADC |
| **EMA Signal Filter** | **Implemented** | $\alpha = 0.15$, 50Hz / 20ms sampling loop |
| **NimBLE BLE Server** | **Implemented** | Service & EMG Characteristic notify stream |
| **MAX98357A I2S Audio Driver** | **Implemented** | ESP32 Hardware `I2S_NUM_0`, 16kHz PCM, 440Hz Chime |
| **Node.js Express Backend** | **Implemented (v0.2)** | Node.js, Express, JWT Auth, bcrypt |
| **MongoDB Atlas Database** | **Implemented (v0.2)** | MongoDB Atlas (9 Mongoose schemas) |
| **Postman API Test Suite** | **Implemented (v0.2)** | Standalone test scripts & Postman collections |
| **Neckband Enclosure** | **`[TODO]`** | 3D Printed Wearable Enclosure |
| **React PWA Client** | **`[Planned]`** | React, Vite, Web Bluetooth API, PWA Manifest |
| **FastAPI AI Engine** | **`[Planned]`** | Python, FastAPI, Scikit-Learn / PyTorch |


---

## 12. Planned Future Work

1. **Phase 1 (Immediate):** Validate sEMG electrode placement on anterior neck muscles using gel electrodes; capture baseline sEMG recordings for silent speech attempts.
2. **Phase 2 (Short-Term):** Initialize Node.js Express backend in `backend/` with JWT authentication and MongoDB Atlas connection; initialize React PWA project in `pwa/` with Web Bluetooth telemetry subscriber.
3. **Phase 3 (Medium-Term):** Build `ai_engine/` FastAPI service; implement sliding window feature extractor (MAV, RMS, ZCR, WL); train baseline classification model.
4. **Phase 4 (Long-Term):** Expand Patient, Doctor, and Caregiver multi-role dashboards in `pwa/` for clinical tracking.
