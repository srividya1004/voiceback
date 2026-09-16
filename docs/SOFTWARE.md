# VoiceBack – Software Architecture & Firmware Documentation

> **Document Version:** 1.0  
> **Status:** Active Specification  
> **Primary Firmware Environment:** PlatformIO / ESP32 C++ Arduino Framework  

---

## 1. Firmware Architecture

The VoiceBack smart neckband firmware is written in modular C++ for the ESP32 microcontroller using the Arduino framework under PlatformIO.

```
firmware/
├── platformio.ini         # PlatformIO build configuration & library dependencies
├── include/               # Header Files
│   ├── config.h           # Constants, pin mappings, BLE GATT UUIDs, sampling rate
│   ├── emg_sensor.h       # BioAmp EXG telemetry acquisition & EMA filter interface
│   ├── ble_service.h      # NimBLE GATT Server & JSON telemetry / audio packet interface
│   └── audio_driver.h     # MAX98357A I2S DAC driver interface
└── src/                   # Source Implementation Files
    ├── main.cpp           # Hardware setup & 50Hz telemetry loop
    ├── emg_sensor.cpp     # ADC sampling (GPIO34), EMA filter, baseline calibration
    ├── ble_service.cpp    # JSON telemetry serialization & BLE audio receiver
    └── audio_driver.cpp   # ESP32 hardware I2S setup & 16kHz PCM audio playback
```

---

## 2. PlatformIO Project Configuration (`platformio.ini`)

The firmware build system is managed via PlatformIO. The `platformio.ini` configuration defines build parameters, CPU frequencies, and library dependencies:

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
- **Pin Definitions:** `BIOAMP_ANALOG_PIN` (`34`), `MAX98357_I2S_BCLK` (`26`), `MAX98357_I2S_LRC` (`25`), `MAX98357_I2S_DOUT` (`22`).
- **ADC Settings:** 12-bit resolution (`ADC_MAX_VALUE = 4095`), 3.3V reference voltage (`ADC_VREF_VOLTS = 3.3f`), 500Hz sampling rate (`EMG_SAMPLE_RATE_HZ = 500`).
- **DSP Settings:** 50Hz BLE transmission interval (`BLE_NOTIFY_INTERVAL_MS = 20`), EMA filter coefficient (`EMA_ALPHA = 0.15f`).
- **BLE GATT UUIDs:**
  - Device Name: `VoiceBack-Neckband`
  - Service UUID: `4fa8c001-1278-472e-b997-63992e716a4d`
  - Telemetry Characteristic UUID: `beb5483e-36e1-4688-b7f5-ea07361b26a8` (Notify & Read)
  - Audio Command Characteristic UUID: `cba1483e-36e1-4688-b7f5-ea07361b26b9` (Write)
- **Audio Specs:** 16kHz sample rate, 16-bit mono PCM.

### `include/emg_sensor.h`
Declares the `EMGData` struct (`rawAnalog`, `filteredVal`, `voltageVolts`, `mav`) and the `EMGSensor` class providing `begin()`, `readData()`, `calibrateBaseline()`, and `getFilteredValue()`. *Used strictly for hardware telemetry and calibration.*

### `include/ble_service.h`
Declares `BLEServiceManager` inheriting from `BLEServerCallbacks`. Provides BLE server initialization, connection state management, `sendEMGData()` telemetry streaming, and `AudioCommandCallbacks` receiving 180-byte PCM audio chunks.

### `include/audio_driver.h`
Declares `AudioDriver` managing hardware I2S peripheral (`I2S_NUM_0`). Provides `begin()`, `playTestTone()`, `writePCM()`, and `stop()`.

---

## 4. Firmware Source Files (`src/`)

### `src/emg_sensor.cpp`
Implements 12-bit ADC reading on GPIO34. Computes Exponential Moving Average (EMA) smoothing:
$$S_t = \alpha \cdot X_t + (1 - \alpha) \cdot S_{t-1}$$
Computes voltage conversion and baseline deviation (MAV proxy).

### `src/ble_service.cpp`
Implements NimBLE GATT Server creation and advertising. Formats 128-byte JSON payload via `ArduinoJson`:
```json
{ "raw": 1842, "flt": 1835.45, "vlt": 1.479 }
```
Notifies connected BLE client devices at 50Hz. Also processes incoming 180-byte audio chunks from the PWA, streaming them to `AudioDriver`.

### `src/audio_driver.cpp`
Configures ESP32 hardware I2S driver (`i2s_driver_install`, `i2s_set_pin`) on `GPIO26`, `GPIO25`, `GPIO22`. Converts incoming mono PCM samples to stereo I2S frames and writes them directly to DMA buffers.

### `src/main.cpp`
System entry point. Executes `setup()` (serial initialization, ADC calibration, BLE initialization, I2S driver setup) and non-blocking 50Hz `loop()` handling BLE state updates and telemetry serial logging (`>BioAmp_Raw:...,Filtered:...`).

---

## 5. Node.js Express Backend Architecture (`backend/`)

The VoiceBack backend is a modular Node.js Express REST API server connected to MongoDB Atlas.

```
backend/
├── package.json          # Node.js dependencies (express, mongoose, bcrypt, jsonwebtoken, dotenv, cors)
├── .env                  # Environment configuration (PORT, MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN)
├── .env.example          # Environment configuration template
├── README.md             # Backend setup & API reference documentation
│
├── scripts/              # Standalone verification test scripts
│   ├── testModels.js     # Validates all 10 Mongoose schema definitions
│   ├── testServices.js   # Validates database CRUD services & bcrypt hashing
│   └── testRoutes.js     # Validates Express route handlers
│
└── src/                  # Application source code
    ├── server.js         # HTTP server entry point & graceful shutdown listeners
    ├── app.js            # Express app, CORS, body parsers, route registration, 404 & error handlers
    │
    ├── config/           # Centralized configuration & MongoDB connection loader
    │   ├── index.js      # Central environment config
    │   └── db.js         # Mongoose connection manager
    │
    ├── models/           # 10 Mongoose collection schemas
    │   ├── UserLogin.js, Patient.js, Doctor.js, Caregiver.js
    │   ├── VoiceProfile.js, EMGProfile.js, TherapyProgress.js
    │   ├── CommunicationHistory.js, Appointment.js, EmergencySOS.js, index.js
    │
    ├── services/         # Business logic & cloud integration layer
    │   ├── userLoginService.js (Auth, bcrypt hashing & JWT token generation)
    │   ├── patientService.js, doctorService.js, caregiverService.js
    │   ├── voiceProfileService.js, emgProfileService.js, therapyProgressService.js
    │   ├── communicationHistoryService.js, appointmentService.js, emergencySOSService.js
    │   ├── contextEngineService.js, nlpProcessorService.js, elevenLabsService.js, index.js
    │
    ├── controllers/      # Request/Response orchestration layer
    │   ├── userLoginController.js, patientController.js, doctorController.js, caregiverController.js
    │   ├── voiceProfileController.js, emgProfileController.js, therapyProgressController.js
    │   ├── communicationHistoryController.js, appointmentController.js, emergencySOSController.js
    │   ├── contextController.js, healthController.js
    │
    ├── routes/           # REST API Route definitions
    │   ├── userLoginRoutes.js, patientRoutes.js, doctorRoutes.js, caregiverRoutes.js
    │   ├── voiceProfileRoutes.js, emgProfileRoutes.js, therapyProgressRoutes.js
    │   ├── communicationHistoryRoutes.js, appointmentRoutes.js, emergencySOSRoutes.js
    │   ├── contextRoutes.js, healthRoutes.js, index.js
    │
    ├── middleware/       # Custom middleware modules
    │   ├── logger.js     # HTTP request logging middleware
    │   ├── authMiddleware.js # JWT authentication guard
    │   └── errorHandler.js# Centralized error handler middleware
    │
    └── utils/            # Helper utilities
        ├── validationHelper.js  # ObjectId validation helper
        └── responseFormatter.js # Standardized JSON success/error response formatters
```

---

## 6. Authentication & API Endpoint Reference

### User Authentication (`POST /api/user-logins/login`)
- **Password Hashing:** Passwords hashed using `bcrypt` with 10 salt rounds upon creation (`userLoginService.create`).
- **Query Exclusion:** `passwordHash` field automatically stripped from database queries via `.select('-passwordHash')`.
- **JWT Generation:** Validates user credentials and issues a signed JSON Web Token valid for 7 days (`expiresIn: "7d"`).

### REST API Endpoints Overview

| Resource | Base Endpoint | Supported HTTP Methods | Description |
| :--- | :--- | :--- | :--- |
| **Health Check** | `/health` | `GET` | Server health and operational stats |
| **User Login** | `/api/user-logins` | `GET`, `POST`, `PUT`, `DELETE` | User credential & role CRUD |
| **Auth Login** | `/api/user-logins/login` | `POST` | Authenticate user & issue JWT token |
| **Patients** | `/api/patients` | `GET`, `POST`, `PUT`, `DELETE` | Patient clinical profile CRUD |
| **Doctors** | `/api/doctors` | `GET`, `POST`, `PUT`, `DELETE` | Doctor practitioner record CRUD |
| **Caregivers** | `/api/caregivers` | `GET`, `POST`, `PUT`, `DELETE` | Caregiver contact record CRUD |
| **Voice Profiles** | `/api/voice-profiles` | `GET`, `POST`, `PUT`, `DELETE` | TTS audio preference & cloning CRUD |
| **Voice Synthesis**| `/api/v1/voice-profiles/synthesize` | `POST` | ElevenLabs TTS synthesis via stored `voiceId` |
| **Context Engine** | `/api/v1/context/generate-responses` | `POST` | Ephemeral response options generation via Gemini |
| **EMG Profiles** | `/api/emg-profiles` | `GET`, `POST`, `PUT`, `DELETE` | sEMG baseline calibration CRUD |
| **Therapy Progress** | `/api/therapy-progress` | `GET`, `POST`, `PUT`, `DELETE` | Session exercise & score logs CRUD |
| **Comm History** | `/api/communication-history`| `GET`, `POST`, `PUT`, `DELETE` | Real-time speech recognition event logs CRUD |
| **Appointments** | `/api/appointments` | `GET`, `POST`, `PUT`, `DELETE` | Clinical appointment scheduling CRUD |
| **Emergency SOS** | `/api/emergency-sos` | `GET`, `POST`, `PUT` | Emergency alert dispatch & logging |

---

## 7. Software Ecosystem Modules (Status Summary)

| Software Module | Directory | Technology | Implementation Status |
| :--- | :--- | :--- | :--- |
| **ESP32 Firmware** | `firmware/` | C++ / PlatformIO / NimBLE / I2S DMA | **Verified & Operational** |
| **Node.js Express Backend** | `backend/` | Node.js / Express / JWT Auth / bcrypt | **Verified & Operational** |
| **MongoDB Atlas Database** | `backend/` | MongoDB Atlas (10 collections via Mongoose) | **Verified & Operational** |
| **Context Engine** | `backend/src/services/` | Gemini LLM + Rule Fallback | **Verified & Operational** |
| **ElevenLabs Voice Gateway**| `backend/src/services/` | ElevenLabs API (`eleven_v3`) | **Verified & Operational** |
| **React Progressive Web App** | `pwa/` | React 19 / Vite / Web Bluetooth GATT | **Verified & Operational** |


