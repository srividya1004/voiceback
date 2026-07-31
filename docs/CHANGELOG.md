# VoiceBack – Changelog

All notable changes to the VoiceBack project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- React Native mobile application for Android/iOS with BLE client subscriber interface (`mobile/`).
- FastAPI Python AI classification engine for EMG feature extraction and model inference (`ai_engine/`).
- Node.js Express REST API backend server with Socket.io real-time relay (`backend/`).
- MongoDB Atlas database deployment with 9 clinical collection schemas (`backend/`).
- Doctor and Caregiver web dashboards (`web_portals/`).

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
