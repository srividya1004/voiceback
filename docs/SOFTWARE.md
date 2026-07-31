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
│   ├── emg_sensor.h       # AD620 EMG acquisition & EMA filter interface
│   ├── ble_service.h      # NimBLE GATT Server & JSON telemetry interface
│   └── audio_driver.h     # MAX98357A I2S DAC driver interface
└── src/                   # Source Implementation Files
    ├── main.cpp           # Hardware setup & 50Hz telemetry loop
    ├── emg_sensor.cpp     # ADC sampling, EMA filter, baseline calibration
    ├── ble_service.cpp    # JSON serialization & BLE notify characteristic
    └── audio_driver.cpp   # ESP32 hardware I2S setup & sine tone generator
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
- **Pin Definitions:** `AD620_ANALOG_PIN` (`34`), `MAX98357_I2S_BCLK` (`4`), `MAX98357_I2S_LRC` (`5`), `MAX98357_I2S_DOUT` (`6`).
- **ADC Settings:** 12-bit resolution (`ADC_MAX_VALUE = 4095`), 3.3V reference voltage (`ADC_VREF_VOLTS = 3.3f`).
- **DSP Settings:** 50Hz loop interval (`SAMPLE_INTERVAL_MS = 20`), EMA filter coefficient (`EMA_ALPHA = 0.15f`).
- **BLE GATT UUIDs:** Device name (`VoiceBack-Neckband`), Service UUID (`4fa8c001-1278-472e-b997-63992e716a4d`), EMG Characteristic UUID (`beb5483e-36e1-4688-b7f5-ea07361b26a8`).
- **Audio Specs:** 16kHz sample rate, 16-bit mono PCM.

### `include/emg_sensor.h`
Declares the `EMGData` struct (`rawAnalog`, `filteredVal`, `voltageVolts`, `mav`) and the `EMGSensor` class providing `begin()`, `readData()`, `calibrateBaseline()`, and `getFilteredValue()`.

### `include/ble_service.h`
Declares `BLEServiceManager` inheriting from `BLEServerCallbacks`. Provides BLE server initialization, connection state management, and `sendEMGData()` packet streaming.

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
Notifies connected BLE client devices at 50Hz.

### `src/audio_driver.cpp`
Configures ESP32 hardware I2S driver (`i2s_driver_install`, `i2s_set_pin`). Generates a 440Hz sine wave test tone using mathematical $\sin()$ generation for hardware startup audio confirmation.

### `src/main.cpp`
System entry point. Executes `setup()` (serial CDC initialization, ADC calibration, BLE initialization, I2S startup chime) and non-blocking 50Hz `loop()` handling BLE state updates and telemetry serial logging (`>AD620_Raw:...,Filtered:...`).

---

## 5. Software Ecosystem Modules (Status Summary)

| Software Module | Directory | Technology | Implementation Status |
| :--- | :--- | :--- | :--- |
| **ESP32 Firmware** | `firmware/` | C++ / PlatformIO / Arduino | **Implemented (v0.1)** |
| **React Progressive Web App (PWA)** | `pwa/` | React / Vite / Web Bluetooth API / PWA Manifest | **`[Planned]`** |
| **Node.js Express Backend** | `backend/` | Node.js / Express / JWT Auth / Socket.io | **`[Planned]`** |
| **FastAPI AI Engine** | `ai_engine/` | Python 3.10 / FastAPI / Scikit-Learn | **`[Planned]`** |
| **MongoDB Atlas Database** | `backend/` | MongoDB Atlas (9 collections) | **`[Planned]`** |
