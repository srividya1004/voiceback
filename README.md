# VoiceBack – Embedded AI Healthcare System for Aphasia Patients

> **Project Status:** Competition & Innovation Prototype (Firmware v0.1 Implemented | Backend API v0.2 Implemented)  
> **Source of Truth:** Project Files (Synchronized between Home PC & College PC via Git)  
> **Primary Documentation Suite:** [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | [PROJECT_HISTORY.md](docs/PROJECT_HISTORY.md) | [CHANGELOG.md](docs/CHANGELOG.md) | [NEXT_STEPS.md](docs/NEXT_STEPS.md) | [SOFTWARE.md](docs/SOFTWARE.md) | [DATABASE.md](docs/DATABASE.md)

---

## 1. Overview

**VoiceBack** is an embedded AI healthcare wearable prototype designed to assist aphasia patients (individuals suffering from speech impairment following stroke or brain injury).

The system captures surface electromyography (**sEMG**) speech muscle activity from the neck using an **AD620 Instrumentation Amplifier Module**, recognizes speech attempts (silent, whispered, weak, or unclear), decodes intended text via an AI inference model, and outputs personalized speech locally via an onboard **MAX98357A I2S amplifier and neckband speaker** as well as through a Progressive Web App (PWA).

```
+-----------------------------------------------------------------------------------+
|                                 VOICEBACK ECOSYSTEM                               |
|                                                                                   |
|  [Neck Electrodes] -> [AD620 EMG] -> [ESP32 MCU] ---(Web Bluetooth)---> [React PWA]
|                                         |                            |            |
|                                    (I2S Audio)                  (REST / WSS)      |
|                                         v                            v            |
|                                   [MAX98357A Amp]       [Node.js Express API]     |
|                                         |                            |            |
|                                   [3W Speaker]             +---------+---------+  |
|                                                            |                   |  |
|                                                    [FastAPI AI Engine] [MongoDB Atlas]|
+-----------------------------------------------------------------------------------+
```

---

## 2. Repository Architecture & Directory Index

```
voiceback/
├── README.md               # Main project overview & index (this file)
├── PROJECT_CONTEXT.md      # Full architecture, medical context, hardware/DB specs
│
├── docs/                   # Complete Technical & Clinical Documentation Suite
│   ├── AI_CONTEXT.md       # AI System Context & Overview
│   ├── AI_PIPELINE.md      # Feature extraction & ML model specifications
│   ├── CHANGELOG.md        # Versioned changelog (Keep-a-Changelog format)
│   ├── DATABASE.md         # MongoDB Atlas schema specifications & verification
│   ├── DECISIONS.md        # Architecture Decision Records (ADRs)
│   ├── HARDWARE.md         # Complete hardware wiring matrix & pin specifications
│   ├── MEETING_NOTES.md    # Confirmed meeting notes & architectural decisions
│   ├── NEXT_STEPS.md       # Prioritized task roadmap & development checklist
│   ├── PROJECT_HISTORY.md  # Milestone timeline & phase status
│   └── SOFTWARE.md         # Firmware & Node.js Express backend documentation
│
├── firmware/               # [COMPLETED v0.1] ESP32 C++ Arduino Firmware (PlatformIO)
│   ├── platformio.ini      # Build parameters & NimBLE/ArduinoJson dependencies
│   ├── include/            # Pin definitions (config.h), EMG, BLE, & Audio headers
│   └── src/                # ADC sampling, EMA filter, BLE streaming, I2S DAC driver
│
├── backend/                # [COMPLETED v0.2] Node.js + Express REST API & MongoDB Atlas
│   ├── package.json        # Dependencies (Express, Mongoose, bcrypt, jsonwebtoken, dotenv, cors)
│   ├── .env                # Active environment variables (PORT, MONGODB_URI, JWT_SECRET)
│   ├── scripts/            # Standalone test scripts (testModels, testRoutes, testServices)
│   └── src/                # Models, Controllers, Services, Routes, Utils, Middleware
│
├── pwa/                    # [PLANNED] React Progressive Web App (Patient/Doctor/Caregiver Portals)
└── ai_engine/              # [PLANNED] FastAPI Python sEMG Speech Classification Engine
```

---

## 3. Implementation Progress Summary

| Ecosystem Layer | Module / Service | Tech Stack | Status |
| :--- | :--- | :--- | :---: |
| **Wearable Firmware** | ESP32 Smart Neckband Core | C++ / PlatformIO / NimBLE | **Completed (v0.1)** |
| **Backend REST API** | Express REST API Service | Node.js / Express | **Completed (v0.2)** |
| **Database Tier** | Clinical & System Database | MongoDB Atlas (9 Collections) | **Completed (v0.2)** |
| **User Authentication** | UserLogin Auth & JWT Service | bcrypt (10 rounds) / JWT (7d) | **Completed (v0.2)** |
| **API Test Suite** | Automated Scripts & Postman | JavaScript / Postman HTTP | **Completed (v0.2)** |
| **Client Frontend** | React Progressive Web App | React / Vite / Web Bluetooth | **Completed (v0.3 - Sprint 1)** |
| **AI Inference** | sEMG Speech Classifier Engine | Python / FastAPI / Scikit-Learn | **`[Planned]`** |

---

## 4. Core Hardware Stack & BOM

| Component | Part / Module | Function |
| :--- | :--- | :--- |
| **Microcontroller** | ESP32 Development Board (ESP-WROOM-32) | Built-in Wi-Fi & BLE 5.0, 240MHz dual-core |
| **EMG Sensor** | AD620 Analog EMG Sensor Module | High-gain differential neck sEMG signal input |
| **Audio Amplifier** | MAX98357A I2S Class-D Amp | Digital-to-analog audio output (3.2W) |
| **Speaker** | 4Ω 3W Dynamic Mini Speaker | Neckband localized voice feedback |
| **Power System** | TP4056 Charger + 3.7V Li-Po Battery | USB rechargeable 1A power circuit with SPST switch |
| **Chassis** | Ergonomic Smart Neckband | 3D-printed wearable enclosure |

For full wiring matrices and pin assignments, consult [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md#2-hardware-architecture--wiring-matrix) and [docs/HARDWARE.md](docs/HARDWARE.md).

---

## 5. Quick Start Guides

### A. Node.js Backend API Quick Start
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env` file (verify `MONGODB_URI`, `JWT_SECRET`, and `PORT=5000`).
4. Start development server:
   ```bash
   npm run dev
   ```
5. Test API endpoints via Postman or script suite:
   ```bash
   npm run test:services
   ```

### B. Firmware Quick Start Guide (PlatformIO)
1. Open the [firmware/](firmware) directory in VS Code with the **PlatformIO** extension.
2. Connect ESP32 via USB.
3. Execute `PlatformIO: Build` and `PlatformIO: Upload`.
4. Open Serial Monitor at **115200 baud** to view real-time AD620 telemetry and EMA filter graphs.

For building with Arduino IDE or troubleshooting, see [firmware/README.md](firmware/README.md).

---

## 6. Multi-Computer Synchronization & Handover

This project is actively developed across multiple workstations (**Home PC** & **College PC**). To maintain code and documentation parity:

1. **Project Files are Permanent Source of Truth**: All project state, progress, and architectural decisions are recorded in repository files rather than transient session memory.
2. **Before Leaving Workstation**: Run `git status`, commit all changes, and push to GitHub.
3. **Upon Arriving at Workstation**: Pull latest updates with `git pull` before beginning work.

