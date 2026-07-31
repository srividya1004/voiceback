# VoiceBack – Confirmed Meeting Notes & Architectural Logs

> **Document Version:** 1.0  
> **Status:** Confirmed Historical Record  

This document logs architectural discussions and sprint milestone decisions confirmed during project setup.

---

## Meeting 1: Concept & System Architecture Finalization

- **Date:** 2026-07-25
- **Attendees:** Core Engineering & Architecture Team
- **Status:** Approved & Finalized

### Agenda & Key Decisions
1. **Domain Focus:** Selected aphasia speech restoration using non-invasive surface electromyography (sEMG) from anterior neck muscles.
2. **Hardware Selection:**
   - **MCU:** ESP32 Development Board (ESP-WROOM-32) selected for built-in BLE and hardware I2S peripheral.
   - **EMG Sensor:** AD620 Instrumentation Amplifier Module selected for analog sEMG neck signal acquisition.
   - **Audio Playback:** MAX98357A I2S Class-D mono amplifier and 4Ω 3W dynamic speaker selected for localized neckband voice feedback.
   - **Power:** TP4056 PMIC + 3.7V 800mAh Li-Po battery + SPST toggle switch selected for wearable power.

---

## Meeting 2: Repository Framework & Multi-Machine Parity Protocol

- **Date:** 2026-07-27
- **Attendees:** Core Development Team
- **Status:** Approved & Finalized

### Agenda & Key Decisions
1. **Repository Setup:** Git repository initialized and configured with GitHub remote tracking.
2. **Multi-Workstation Sync Policy:** Established mandatory sync protocol between **Home PC** and **College PC**:
   - Repository code and docs are the permanent source of truth.
   - `git pull` mandatory before starting work; `git commit` and `git push` mandatory before leaving workstation.
   - Session progress documented in `DEVELOPER_HANDOVER.md` and `PROJECT_HISTORY.md`.
3. **Documentation Suite Architecture:** Defined primary context documents (`README.md`, `PROJECT_CONTEXT.md`) and standardized `docs/` subdirectory structure.

---

## Meeting 3: Firmware Phase 1 Sprint & Driver Integration

- **Date:** 2026-07-30
- **Attendees:** Firmware Engineering Team
- **Status:** Approved & Finalized

### Agenda & Key Decisions
1. **PlatformIO Environment:** Configured `firmware/platformio.ini` targeting `esp32dev` with `ArduinoJson @ ^6.21.3` and `NimBLE-Arduino @ ^1.4.1`.
2. **AD620 Subsystem Implementation:**
   - Mapped AD620 analog VOUT to ESP32 `GPIO34` (12-bit ADC).
   - Implemented Exponential Moving Average (EMA) smoothing filter ($\alpha = 0.15$).
   - Implemented baseline calibration routine in `EMGSensor::calibrateBaseline()`.
3. **NimBLE Telemetry Service:**
   - Created GATT Server under device name `VoiceBack-Neckband`.
   - Defined JSON notification characteristic streaming `raw`, `flt`, and `vlt` telemetry at 50Hz (20ms interval).
4. **MAX98357A I2S Driver:**
   - Configured hardware I2S peripheral (`I2S_NUM_0`) with BCLK on `GPIO4`, LRC on `GPIO5`, DOUT on `GPIO6`.
   - Implemented startup 440Hz sine wave chime test tone (300ms duration) to verify audio DAC hardware upon startup.
