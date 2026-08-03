# VoiceBack – Changelog

All notable changes to the VoiceBack project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Sprint 2 UI Portals (Patient Dashboard, Doctor Dashboard, Caregiver Dashboard, Web Bluetooth sEMG streaming, Speech Therapy).
- FastAPI Python AI classification engine for sEMG feature extraction and model inference (`ai_engine/`).

---

## [0.3.0] - 2026-08-01

### Added & Corrected
- **Exact Official Logo Image Rendering (`VoiceBackLogo.jsx`, `pwa/public/voiceback-logo.jpg`):**
  - Replaced all SVG/placeholder representations with the exact uploaded official VoiceBack logo image file (`voiceback-logo.jpg`), rendered consistently across Splash, Welcome, Role Selection, Patient Auth, Doctor Auth, and Caregiver Auth views.
- **Completely Silent Application Opening (`SplashPage.jsx`, `WelcomePage.jsx`):**
  - Removed all automatic speech synthesis and voice narration on application launch. The application now opens completely silently. Audio Guidance operates strictly when enabled via Accessibility Settings.
- **4-Step Splash & Navigation Flow (`AppRoutes.jsx`, `SplashPage.jsx`, `WelcomePage.jsx`):**
  - Enforced exact sequence: Splash Screen (2.5s) $\rightarrow$ Professional Animated Introduction with Avatar & Encouraging Message (no voice) $\rightarrow$ Role Selection $\rightarrow$ Login / Registration.
- **Exact Authentication Error Handling (`authService.js`, `translations.js`):**
  - Backend unavailable: *"Unable to connect to the server. Please try again later."*
  - Email already exists: *"This email is already registered."*
  - Password incorrect: *"Incorrect password."*
  - Field-level red outlines (`.field-error`) with inline error helper text and form value retention.

---

## [0.2.0] - 2026-07-31

### Added
- **Node.js Express REST API Core (`backend/src/app.js`, `backend/src/server.js`):** Built HTTP server with CORS support, JSON body parsers, HTTP request logging (`logger.js`), and centralized error handling middleware (`errorHandler.js`).
- **MongoDB Atlas Database Integration (`backend/src/config/`):** Integrated Mongoose (v9.9.0) database connection lifecycle targeting MongoDB Atlas via `.env` configuration.
- **9 Mongoose Collection Schemas (`backend/src/models/`):** Implemented schema models for `UserLogin`, `Patient`, `Doctor`, `Caregiver`, `VoiceProfile`, `EMGProfile`, `TherapyProgress`, `CommunicationHistory`, and `Appointment`.
- **Full CRUD Business Services (`backend/src/services/`):** Implemented service layer with Mongoose queries, input validation, and automatic password hash projection stripping (`.select('-passwordHash')`).
- **REST Controller Layer (`backend/src/controllers/`):** Built controllers handling HTTP status formatting (`sendSuccess`, `sendError`), validation errors (400), not found (404), and internal errors (500).
- **REST Router Modules (`backend/src/routes/`):** Registered Express routers under `/api` for all 9 data resources.
- **User Authentication Stack (`userLoginService.js`, `userLoginController.js`):**
  - Integrated `bcrypt` password hashing (10 salt rounds) on user creation.
  - Implemented JWT authentication endpoint `POST /api/user-logins/login` generating signed JSON Web Tokens valid for 7 days (`expiresIn: "7d"`).
- **Environment Configuration (`backend/.env`, `backend/.env.example`):** Parameterized `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN`.
- **Automated Verification & Testing (`backend/scripts/`):** Created standalone test scripts (`testModels.js`, `testRoutes.js`, `testServices.js`) and Postman HTTP testing suite.

---


## [0.1.0] - 2026-07-30

### Added
- **PlatformIO Configuration (`firmware/platformio.ini`):** Configured ESP32 environment (`esp32dev`, `espressif32`) with 240MHz CPU clock and libraries (`ArduinoJson @ ^6.21.3`, `NimBLE-Arduino @ ^1.4.1`).
- **Hardware Configuration (`firmware/include/config.h`):** Pin definitions for AD620 sEMG input (`GPIO34`), MAX98357A I2S audio (`GPIO4` BCLK, `GPIO5` LRC, `GPIO6` DOUT), NimBLE GATT service and characteristic UUIDs.
- **AD620 EMG Sensor Subsystem (`firmware/include/emg_sensor.h`, `firmware/src/emg_sensor.cpp`):**
  - 12-bit ADC reading (`0 - 4095`) on GPIO34.
  - Exponential Moving Average (EMA) signal filtering with coefficient $\alpha = 0.15$.
  - ADC voltage scaling ($0.0\text{V} - 3.3\text{V}$) and deviation-based MAV calculation.
  - Automatic baseline calibration sampling loop.
- **BLE Telemetry Subsystem (`firmware/include/ble_service.h`, `firmware/src/ble_service.cpp`):**
  - NimBLE GATT Server under device name `VoiceBack-Neckband`.
  - JSON packet serialization (`raw`, `flt`, `vlt`) streaming over BLE notify characteristic.
  - Automatic re-advertising loop on central device disconnect.
- **I2S Audio Subsystem (`firmware/include/audio_driver.h`, `firmware/src/audio_driver.cpp`):**
  - MAX98357A I2S DAC driver initialization (16kHz, 16-bit mono PCM).
  - Test tone generator emitting a 440Hz sine wave startup chime (300ms).
  - Raw PCM buffer write method for localized playback.
- **Main Loop Architecture (`firmware/src/main.cpp`):** Fixed 50Hz / 20ms sample interval timing loop with Serial Monitor telemetry logging (`>AD620_Raw:...,Filtered:...`).
- **Project Context & Architectural Spec (`README.md`, `PROJECT_CONTEXT.md`):** Complete ecosystem diagrams, hardware wiring matrices, and multi-machine sync guidelines.

### Changed
- Standardized hardware GPIO mappings: GPIO34 for AD620 sEMG input, GPIO4/5/6 for I2S audio amplifier.

### Fixed
- Fixed analog input initialization by wait-looping for serial USB CDC startup and warming up ADC prior to baseline calibration.

### Known Issues
- Floating ADC readings occur on GPIO34 when sEMG gel electrodes are disconnected from skin. (Requires active skin contact).
- High serial output baud volume at 50Hz may cause minor I2S DMA buffer underrun clicks during test tone playback.
- Mobile application and AI inference engine are not yet connected to the BLE telemetry stream `[Planned]`.
