# VoiceBack – Embedded AI Healthcare System for Aphasia Patients

> **Project Status:** Production Candidate / Innovation System (Firmware v1.0 | Backend API v1.0 | React PWA v1.0)  
> **Source of Truth:** [VOICEBACK_FINAL_PRD.md](VOICEBACK_FINAL_PRD.md) (Version 1.0) | [VOICEBACK_FINAL_ARCHITECTURE_SPEC.md](VOICEBACK_FINAL_ARCHITECTURE_SPEC.md) | [VOICEBACK_END_TO_END_WORKFLOW.md](VOICEBACK_END_TO_END_WORKFLOW.md) | [firmware/README.md](firmware/README.md) | [docs/DATABASE.md](docs/DATABASE.md)  
> **Technical Guides:** [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | [docs/HARDWARE.md](docs/HARDWARE.md) | [docs/SOFTWARE.md](docs/SOFTWARE.md) | [backend/README.md](backend/README.md) | [pwa/README.md](pwa/README.md)

---

## 1. Overview & Locked Architecture

**VoiceBack** is an integrated assistive healthcare wearable system engineered to empower individuals with aphasia (speech impairment resulting from stroke or traumatic brain injury) to regain verbal communication.

### Canonical End-to-End Communication Pipeline
The system utilizes a physical microphone as the primary speech input, paired with Wispr Flow speech recognition, contextual reasoning, and voice cloning:

```
Physical Microphone
  └──> Wispr Flow / approved STT provider
        └──> Raw Transcript
              └──> Speech Cleanup + Meaning Reconstruction
                    └──> Context / Intent Understanding (Gemini LLM)
                          └──> Temporary Dynamic Response Choices (Ephemeral)
                                └──> Patient Selects Response
                                      └──> Patient Confirms
                                            └──> Stored Patient Voice ID (MongoDB VoiceProfile)
                                                  └──> ElevenLabs TTS (eleven_v3 / eleven_multilingual_v2)
                                                        └──> Audio (16kHz 16-bit Mono PCM)
                                                              └──> BLE GATT Stream (VoiceBack-Neckband)
                                                                    └──> ESP32 Microcontroller
                                                                          └──> MAX98357A I2S DAC (GPIO26/25/22)
                                                                                └──> Physical Speaker
```

### Core Architectural Invariants
1. **Primary Speech Input:** The **physical microphone** is the primary speech input mechanism capturing patient vocalizations (weak, whispered, or dysarthric speech).
2. **Speech-to-Text Layer:** **Wispr Flow** (or approved STT provider) is the intended speech recognition layer. Wispr Flow is never referred to as "Whisper", and OpenAI Whisper is not used.
3. **No sEMG Speech Recognition:** Legacy CNN + Transformer + CTC sEMG speech-recognition models have been permanently purged and are not active.
4. **BioAmp EXG Pill Scope:** The BioAmp EXG Pill (analog input on ESP32 `GPIO34`) is utilized strictly for hardware telemetry, baseline muscle calibration, and prototype demonstration.
5. **Ephemeral Dynamic Choices:** Contextually generated response options exist temporarily during an active interaction and disappear immediately once the interaction is completed or cancelled.
6. **Patient Voice ID Security:** Stored patient `voiceId` belongs strictly to the authenticated patient, is never duplicated across unrelated patients, and is never hardcoded.
7. **Kannada PVC Limitation & Fallback:** ElevenLabs `eleven_v3` supports Kannada speech synthesis, but ElevenLabs Professional Voice Cloning (PVC) does not list Kannada as an officially supported PVC training language. Kannada patient-voice cloning is not claimed as guaranteed; an approved fallback voice is used when patient voice cloning is unavailable.

---

## 2. Repository Architecture & Directory Index

```
voiceback/
├── VOICEBACK_FINAL_PRD.md              # [PRIMARY SOURCE OF TRUTH] Product Requirements Document (v1.0)
├── VOICEBACK_FINAL_ARCHITECTURE_SPEC.md# [CANONICAL] System architecture specification
├── VOICEBACK_END_TO_END_WORKFLOW.md    # [CANONICAL] End-to-end 12-step workflow contract
├── README.md                           # Main repository guide (this file)
├── PROJECT_CONTEXT.md                  # Comprehensive context, hardware & database specs
│
├── docs/                               # Technical & Reference Documentation Suite
│   ├── DATABASE.md                     # [CANONICAL] MongoDB Atlas schema specification
│   ├── HARDWARE.md                     # Hardware wiring matrix & GPIO26/25/22 pin specs
│   ├── SOFTWARE.md                     # Firmware & Express REST API architecture
│   ├── MongoDB_Production_Network_Setup.md # Network & Atlas cluster configuration
│   ├── VoiceBack_Environment_Independence_Guide.md # Environment variable guidelines
│   ├── reports/                        # Audit, diagnostic, verification, and implementation reports
│   └── archive/                        # Historical research, legacy designs, and decision logs
│
├── firmware/                           # ESP32 C++ Arduino Firmware (PlatformIO)
│   ├── platformio.ini                  # Build parameters & NimBLE/ArduinoJson dependencies
│   ├── README.md                       # [CANONICAL] Firmware documentation & hardware setup
│   ├── include/                        # config.h (pins 26/25/22/34), audio, ble, emg headers
│   └── src/                            # audio_driver, ble_service, emg_sensor, wifi, main
│
├── backend/                            # Node.js + Express REST API & MongoDB Atlas
│   ├── README.md                       # API endpoints & service architecture
│   ├── package.json                    # Dependencies & test scripts
│   ├── .env.example                    # Environment variable template
│   ├── scripts/                        # 35 automated verification test scripts
│   └── src/                            # Models (10), Controllers (12), Services (13), Routes (12)
│
└── pwa/                                # React 19 + Vite Progressive Web Application
    ├── README.md                       # PWA component guide & Web Bluetooth GATT documentation
    ├── package.json                    # React, Vite, Lucide icons dependencies
    ├── index.html                      # HTML entrypoint & meta headers
    └── src/                            # Components (29), Services (12), Context, i18n
```

---

## 3. Implementation Status Summary

| Ecosystem Layer | Module / Service | Tech Stack | Status |
| :--- | :--- | :--- | :---: |
| **Wearable Firmware** | ESP32 Smart Neckband Core | C++ / PlatformIO / NimBLE | **Verified & Operational** |
| **Backend REST API** | Express REST API Service | Node.js / Express | **Verified & Operational** |
| **Database Tier** | MongoDB Atlas Cloud Cluster | Mongoose (10 Collections) | **Verified & Operational** |
| **User Authentication** | RBAC Auth & JWT Guard | bcrypt (10 rounds) / JWT (7d) | **Verified & Operational** |
| **Speech-to-Text** | Wispr Flow Primary STT | Cloud STT API | **Target Architecture** |
| **Context Engine** | Dynamic Ephemeral Suggestions | Gemini LLM + Rule Fallback | **Verified & Operational** |
| **Voice Synthesis** | ElevenLabs Cloned Voice / TTS | `eleven_v3` / `eleven_multilingual_v2` | **Verified & Operational** |
| **Audio Transmission** | Web Bluetooth 16kHz PCM Stream | Web Bluetooth GATT API | **Verified & Operational** |
| **Physical Audio** | MAX98357A I2S DAC Output | GPIO26 (BCLK), 25 (LRC), 22 (DOUT) | **Verified & Operational** |
| **Client Frontend** | Role-Gated Progressive Web App | React 19 / Vite / Vanilla CSS | **Verified & Operational** |

---

## 4. Hardware Pin Mapping (Verified Firmware Baseline)

| Hardware Module | Module Pin | ESP32 GPIO Pin | Function |
| :--- | :--- | :--- | :--- |
| **BioAmp EXG Pill** | `OUT` (Analog) | `GPIO34` (ADC1_CH6) | sEMG analog telemetry (500Hz sample, 50Hz BLE notify) |
| | `VCC` | `3.3V` | System positive power rail |
| | `GND` | `GND` | Common system ground |
| **MAX98357A I2S Amp** | `BCLK` | `GPIO26` | I2S Bit Clock |
| | `LRC` / `WS` | `GPIO25` | I2S Word Select Clock |
| | `DIN` / `DOUT` | `GPIO22` | Serial PCM Audio Data |
| | `GAIN` | `GND` / `3.3V` | Hardware gain setting (12dB / 6dB) |
| | `VIN` | `3.3V` / `5V` | Amplifier power supply rail |
| **TP4056 PMIC** | `BAT+` / `BAT-` | Battery Terminals | 3.7V 800mAh Li-Po Cell Connection |
| | `OUT+` | Power Switch -> `5V/VIN` | Switched battery positive rail |
| **Mini Speaker** | `+` / `-` | MAX98357A OUT | Differential audio driving 4Ω 3W dynamic speaker |

---

## 5. Quick Start Guides

### A. Node.js Backend API
1. Navigate to backend:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env` (`PORT=5000`, `MONGODB_URI`, `JWT_SECRET`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`).
3. Start backend:
   ```bash
   npm run dev
   ```

### B. React Progressive Web App (PWA)
1. Navigate to PWA:
   ```bash
   cd pwa
   npm install
   ```
2. Start local Vite development server:
   ```bash
   npm run dev
   ```

### C. ESP32 Firmware (PlatformIO)
1. Open `firmware/` in VS Code with PlatformIO extension.
2. Build and upload: `PlatformIO: Build` and `PlatformIO: Upload`.
3. Open Serial Monitor at **115200 baud** to view real-time BioAmp telemetry.


