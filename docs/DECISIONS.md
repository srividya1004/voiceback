# VoiceBack – Architecture Decision Records (ADRs)

> **Document Version:** 1.0  
> **Status:** Active Architectural Records  

This document records key engineering decisions made during the design and development of the VoiceBack project.

---

## ADR-001: Selection of ESP32 Microcontroller

### Context & Problem
The VoiceBack wearable smart neckband requires real-time signal processing of surface electromyography (sEMG) signals at 50Hz, simultaneous wireless data streaming to mobile devices, and direct digital hardware drive of an I2S audio amplifier for localized speech feedback, all within a low-power battery constraint.

### Decision
Select the **ESP32 Development Board (ESP-WROOM-32 / ESP32-D0WDQ6)** as the core microcontroller.

### Rationale
- **Dual-Core Processing:** 240MHz dual-core Xtensa LX6 architecture allows separating real-time DSP/sampling loops from BLE/Wi-Fi communication tasks across distinct cores.
- **Integrated Wireless:** Built-in Bluetooth Low Energy (BLE 5.0 / 4.2) eliminates the cost, PCB complexity, and power draw of external RF modules.
- **Hardware I2S Peripheral:** Dedicated hardware I2S peripheral (`I2S_NUM_0`) enables direct digital audio streaming to the MAX98357A amplifier without CPU-intensive bit-banging.
- **Cost & Accessibility:** Low module cost and high developer ecosystem adoption.

### Consequences
- **Positive:** Low bill-of-materials (BOM) cost, built-in wireless stack, hardware audio support.
- **Negative:** Non-linear ADC response near voltage rails requiring calibration and baseline tracking.

---

## ADR-002: Selection of Bluetooth Low Energy (BLE) for Wireless Telemetry

### Context & Problem
Real-time sEMG telemetry (`raw`, `flt`, `vlt`) must be transmitted from the wearable neckband to a mobile application for live signal plotting and AI classification with minimal latency and minimal battery consumption.

### Decision
Implement **Bluetooth Low Energy (BLE)** using the **NimBLE-Arduino** stack rather than Wi-Fi or Classic Bluetooth.

### Rationale
- **Low Power Consumption:** Dramatically extends the operating life of the 3.7V 800mAh Li-Po battery compared to Wi-Fi.
- **Throughput Adequacy:** At 50Hz sample rates (20ms interval), a 128-byte JSON notification payload fits within standard BLE MTU limits (~2.5 KB/s bandwidth required).
- **Mobile Compatibility:** Native, zero-pairing support on modern Android and iOS mobile platforms.
- **NimBLE Stack Optimization:** `NimBLE-Arduino` reduces memory footprint by >50% and flash consumption by >100KB compared to legacy ESP32 BLE libraries.

### Consequences
- **Positive:** Extended wearable battery life, fast auto-reconnection, low memory overhead.
- **Negative:** Limited to local proximity range (~10 meters).

---

## ADR-003: Selection of AD620 Surface EMG (sEMG) Sensing

### Context & Problem
Aphasia patients retain vocal muscle intent, but articulate weak, whispered, or silent speech. Capturing vocal muscle intent non-invasively requires detecting microvolt-level ($10\mu\text{V} - 5\text{mV}$) electrical activity from anterior neck muscles (thyrohyoid, sternohyoid, mylohyoid).

### Decision
Use the **AD620 Instrumentation Amplifier Analog Sensor Module** reading differential skin surface potentials.

### Rationale
- **Non-Invasive Sensing:** Allows continuous wearable speech intent capture without invasive needles or restricting patient movement.
- **High CMRR & Adjustable Gain:** The AD620 instrumentation amplifier provides high Common Mode Rejection Ratio (CMRR > 100dB) to suppress 50/60Hz power-line interference, and allows single-resistor gain adjustment.
- **Simplicity:** Outputs a single analog voltage waveform ($0 - 3.3\text{V}$) easily sampled by the ESP32 12-bit ADC (`GPIO34`).

### Consequences
- **Positive:** Direct physical detection of silent speech intent; low cost.
- **Negative:** Requires clean electrode-skin contact; sensitive to motion artifacts requiring active software filtering (Exponential Moving Average).

---

## ADR-004: Selection of PlatformIO as Build System & IDE Framework

### Context & Problem
Development occurs across multiple workstations (**Home PC** and **College PC**). Standard Arduino IDE suffers from manual library installation, lack of version lock, and workspace configuration drift.

### Decision
Adopt **PlatformIO IDE** (integrated with VS Code) with explicit library version pinning in `firmware/platformio.ini`.

### Rationale
- **Declarative Dependency Management:** `platformio.ini` explicitly pins versions (`ArduinoJson @ ^6.21.3`, `NimBLE-Arduino @ ^1.4.1`), guaranteeing byte-for-byte identical builds across workstations.
- **Structured Code Layout:** Enforces strict header (`include/`) and source (`src/`) code separation.
- **Command-Line & CI Compatibility:** Supports headless compilation via `platformio run`.

### Consequences
- **Positive:** Eliminates machine-dependent compilation failures; enables strict multi-workstation sync parity.
- **Negative:** Requires PlatformIO extension setup on developer workstations.

---

## ADR-005: Adoption of React Progressive Web App (PWA) Architecture & Web Bluetooth

### Context & Problem
The VoiceBack system previously planned a native React Native mobile application alongside separate React web portals for doctors and caregivers. Developing separate native mobile apps and web portals increases codebase complexity, deployment friction across app stores, and maintenance overhead for a student prototype. The application must run on Android, iPhone, tablets, and desktop browsers while remaining 100% free and open-source.

### Decision
Adopt a single, unified **React Progressive Web App (PWA)** in `pwa/` built with React and Vite, utilizing **Web Bluetooth API** for BLE neckband telemetry streaming and **JWT Authentication** for three distinct user roles (`Patient`, `Doctor`, `Caregiver`).

### Rationale
- **Cross-Platform Compatibility:** Runs seamlessly on Android, iOS/iPhone (where browser capabilities allow), tablets, and desktop browsers without native app store compilation.
- **PWA App Installation:** Supports Web App Manifest (`manifest.json`) and Service Workers for home-screen installation and offline shell caching.
- **Direct BLE Telemetry:** Web Bluetooth API allows direct wireless pairing and data reception from the ESP32 `VoiceBack-Neckband` GATT server in Chrome and Edge.
- **Unified Multi-Role Portal:** Consolidates Patient, Doctor, and Caregiver user flows into one maintainable frontend codebase secured by JWT role-based access control.
- **Zero Paid Dependencies:** Uses free, open-source web standards (Web Speech API, Web Bluetooth, HTML5 Canvas) suitable for a student prototype.

### Consequences
- **Positive:** Zero app store approval delays, instant cross-device access across Android, iPhone, tablets, and desktop browsers, single maintainable frontend repository, low friction for clinical demos.
- **Graceful Fallback:** Bluetooth communication with the ESP32 wearable is active on supported browsers (Chrome, Edge, Android/Desktop browsers). On unsupported browsers (e.g. standard iOS Safari), the PWA gracefully displays connection status while providing full access to all other application features including JWT authentication, patient dashboards, doctor/caregiver clinical tracking, therapy progress logs, Web Speech API TTS, and appointment scheduling.

---

## ADR-006: Selection of Node.js, Express, Mongoose, bcrypt, and JWT for Backend & Database Tier

### Context & Problem
The VoiceBack system requires a secure, clinical-grade backend REST API to manage 9 resource domains (`UserLogin`, `Patient`, `Doctor`, `Caregiver`, `VoiceProfile`, `EMGProfile`, `TherapyProgress`, `CommunicationHistory`, `Appointment`), handle user authentication, hash passwords securely, and interface with cloud NoSQL database storage (MongoDB Atlas).

### Decision
Implement the backend in `backend/` using **Node.js (v18+)**, **Express.js (v4.18)**, **Mongoose ODM (v9.9)**, **MongoDB Atlas**, **bcrypt (v6.0)** for password hashing, and **jsonwebtoken (v9.0)** for JWT-based login authentication.

### Rationale
- **Non-blocking Event-Driven I/O:** Node.js Express handles concurrent REST requests efficiently with low latency.
- **MongoDB Atlas Integration:** Cloud-hosted MongoDB Atlas NoSQL collection architecture handles flexible schema evolution for EMG arrays, clinical progress notes, and communication logs.
- **Mongoose Schema Security:** Mongoose ORM provides strict schema validation, type safety, and automatic password projection stripping (`.select('-passwordHash')`).
- **Cryptographic Security:** `bcrypt` with 10 salt rounds provides resistant password hashing against rainbow table attacks.
- **Stateless JWT Authentication:** JSON Web Tokens with 7-day validity allow stateless authentication across React PWA web sessions without server session state.

### Consequences
- **Positive:** Modular Layered Architecture (Routes -> Controllers -> Services -> Models), secure password handling, 100% testable via standalone Node scripts and Postman.
- **Negative:** Requires secret key management via `.env` (`MONGODB_URI`, `JWT_SECRET`).

