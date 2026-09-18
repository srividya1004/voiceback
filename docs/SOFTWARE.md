# VoiceBack – Software Architecture & Firmware Documentation

> **Document Version:** 1.0  
> **Status:** Active Specification  
> **Primary Firmware Environment:** PlatformIO / ESP32 C++ Arduino Framework  

---

## 1. Firmware Architecture

The VoiceBack smart neckband firmware is written in modular C++ for the ESP32 microcontroller using the Arduino framework under PlatformIO. It leverages a dual-I2S architecture to simultaneously handle microphone ingress and speaker egress.

```text
firmware/
├── platformio.ini         # PlatformIO build configuration & library dependencies
├── include/               # Header Files
│   ├── config.h           # Constants, pin mappings, BLE GATT UUIDs, sampling rates
│   ├── mic_driver.h       # INMP441 I2S_NUM_1 driver interface
│   ├── ble_service.h      # NimBLE GATT Server & bi-directional audio packet interface
│   └── audio_driver.h     # MAX98357A I2S_NUM_0 DAC driver interface
└── src/                   # Source Implementation Files
    ├── main.cpp           # Hardware setup & loop execution
    ├── mic_driver.cpp     # I2S hardware setup for INMP441 capture
    ├── ble_service.cpp    # BLE Upstream/Downstream audio streaming
    └── audio_driver.cpp   # I2S hardware setup for MAX98357A playback
```

> **IMPORTANT:** BioAmp, EMG, and related ADC/EMA filters (`emg_sensor.h`, `emg_sensor.cpp`) have been permanently removed.

---

## 2. PlatformIO Project Configuration (`platformio.ini`)

The firmware build system is managed via PlatformIO:

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
board_build.f_cpu = 240000000L
board_build.f_flash = 80000000L
board_build.flash_mode = qio

lib_deps =
    bblanchon/ArduinoJson @ ^6.21.3
    h2zero/NimBLE-Arduino @ ^1.4.1
```

---

## 3. Firmware Header Files (`include/`)

### `include/config.h`
Defines system-wide constants:
- **Pin Definitions:** 
  - Speaker: `MAX98357_I2S_BCLK` (`27`), `MAX98357_I2S_LRC` (`14`), `MAX98357_I2S_DOUT` (`22`).
  - Microphone: `INMP441_I2S_SCK` (`26`), `INMP441_I2S_WS` (`25`), `INMP441_I2S_SD` (`34`).
- **BLE GATT UUIDs:**
  - Device Name: `VoiceBack-Neckband`
  - Service UUID: `4fa8c001-1278-472e-b997-63992e716a4d`
  - Audio Downstream Command Characteristic UUID: `cba1483e-36e1-4688-b7f5-ea07361b26b9` (Write Without Response)
  - Volume Control UUID: `7b9e483e-36e1-4688-b7f5-ea07361b26c0`
  - Microphone Control Characteristic UUID: `e1f2a3b4-36e1-4688-b7f5-ea07361b26e1` (Write Without Response)
  - Microphone Audio Notify Characteristic UUID: `f3d4e5a6-36e1-4688-b7f5-ea07361b26d1` (Notify)
- **Audio Specs:** 16kHz sample rate, 16-bit mono PCM.

### `include/mic_driver.h`
Declares the I2S capture driver for the INMP441 microphone on `I2S_NUM_1`.

### `include/ble_service.h`
Declares `BLEServiceManager` inheriting from `BLEServerCallbacks`. Provides BLE server initialization, connection state management, upstream microphone audio notification loops, and `AudioCommandCallbacks` for receiving downstream PCM audio chunks from the PWA.

### `include/audio_driver.h`
Declares `AudioDriver` managing hardware I2S peripheral (`I2S_NUM_0`). Provides `writePCM()` and audio output functionality for the MAX98357A.

---

## 4. Firmware Source Files (`src/`)

### `src/mic_driver.cpp`
Configures the ESP32 hardware I2S driver on `GPIO26`, `GPIO25`, and `GPIO34`. Captures mono PCM samples via I2S_NUM_1 and streams them upstream over BLE notifications.

### `src/ble_service.cpp`
Implements NimBLE GATT Server creation and advertising. 
- **Upstream:** Streams captured INMP441 microphone audio chunks back to the PWA over BLE Notify characteristics.
- **Downstream:** Processes incoming 16kHz PCM audio chunks from the PWA, streaming them to the `AudioDriver`.

### `src/audio_driver.cpp`
Configures ESP32 hardware I2S driver on `GPIO27`, `GPIO14`, `GPIO22`. Converts incoming mono PCM samples from BLE to stereo I2S frames and writes them directly to DMA buffers.

### `src/main.cpp`
System entry point initializing serial, BLE, mic driver, and audio driver.

---

## 5. Node.js Express Backend Architecture (`backend/`)

The VoiceBack backend is a modular Node.js Express REST API server connected to MongoDB Atlas.

```text
backend/
├── package.json          # Node.js dependencies
├── .env                  # Environment configuration
├── README.md             # Backend setup & API reference documentation
│
└── src/                  
    ├── server.js         # HTTP server entry point
    ├── app.js            # Express app, CORS, routes
    │
    ├── config/           # Centralized DB & Environment config
    │
    ├── models/           # 9 Mongoose collection schemas
    │   ├── UserLogin.js, Patient.js, Doctor.js, Caregiver.js
    │   ├── VoiceProfile.js, TherapyProgress.js
    │   ├── CommunicationHistory.js, Appointment.js, EmergencySOS.js
    │
    ├── services/         # Business logic layer
    │   ├── userLoginService.js, contextEngineService.js, elevenLabsService.js, etc.
    │
    ├── controllers/      # Orchestration layer
    │
    ├── routes/           # REST API Route definitions
    │
    ├── middleware/       # Custom middleware (JWT auth, error handler)
    │
    └── utils/            # Helper utilities
```

---

## 6. Authentication & API Endpoint Reference

### User Authentication (`POST /api/user-logins/login`)
- **Password Hashing:** Passwords hashed using `bcrypt` with 10 salt rounds.
- **JWT Generation:** Validates user credentials and issues a signed JSON Web Token valid for 7 days.

### Core Architecture APIs

| Category | Endpoint | Method | Description |
| :--- | :--- | :---: | :--- |
| **STT Gateway** | `/api/voice-profiles/transcribe` | `POST` | Transcribes patient audio via ElevenLabs Scribe. |
| **Context Engine** | `/api/context/generate-responses` | `POST` | Gemini LLM dynamically reconstructs meaning or generates Companion Mode choices. |
| **Voice Synthesis**| `/api/voice-profiles/synthesize` | `POST` | Cartesia TTS speech generation using the patient's assigned `voiceId`. |
| **Auth Login** | `/api/user-logins/login` | `POST` | Authenticate user & issue JWT token. |

---

## 7. Software Ecosystem Modules (Status Summary)

| Software Module | Directory | Technology | Implementation Status |
| :--- | :--- | :--- | :--- |
| **ESP32 Firmware** | `firmware/` | C++ / NimBLE / Dual I2S DMA | **Verified & Operational** |
| **Node.js Express Backend** | `backend/` | Node.js / Express / JWT Auth | **Verified & Operational** |
| **MongoDB Atlas Database** | `backend/` | MongoDB Atlas (9 collections) | **Verified & Operational** |
| **Context Engine** | `backend/src/services/` | Gemini LLM | **Verified & Operational** |
| **Cartesia TTS Gateway**| `backend/src/services/` | Cartesia API | **Verified & Operational** |
| **ElevenLabs STT Gateway**| `backend/src/services/` | ElevenLabs Scribe STT API | **Verified & Operational** |
| **React Progressive Web App** | `pwa/` | React 19 / Vite / Web Bluetooth | **Verified & Operational** |
