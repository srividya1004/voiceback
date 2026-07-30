# VoiceBack Smart Neckband - Firmware Engineering Documentation

This module contains the complete **ESP32 C++/Arduino firmware project** for the VoiceBack Smart Neckband embedded prototype.

## Hardware Wiring Table

| Hardware Module | Module Pin | ESP32 GPIO Pin | Function |
| :--- | :--- | :--- | :--- |
| **AD620 EMG Sensor** | `VOUT` (Analog) | `GPIO34` (ADC1_CH6) | High-gain differential neck EMG input |
| | `VCC` | `3.3V` / `5V` | System power |
| | `GND` | `GND` | System ground |
| **MAX98357A I2S Amp** | `BCLK` | `GPIO4` | Bit Clock |
| | `LRC` / `WS` | `GPIO5` | Left/Right Word Select Clock |
| | `DIN` / `DOUT`| `GPIO6` | Serial PCM Audio Data |
| | `GAIN` | `GND` (12dB) / `3.3V` (6dB) | Gain control |
| | `VIN` | `3.3V` / `5V` | Amp power rail |
| **TP4056 Charger** | `BAT+` / `BAT-` | Battery Terminal | 3.7V 800mAh Li-Po Cell |
| | `OUT+` | Power Switch -> `5V/VIN` | Switched battery power rail |

---

## Firmware Directory Architecture

```
firmware/
├── platformio.ini         # PlatformIO build configuration & library dependencies
├── include/
│   ├── config.h           # Pin definitions, BLE UUIDs, sampling rate, EMA alpha
│   ├── emg_sensor.h       # AD620 EMG acquisition & EMA filter interface
│   ├── ble_service.h      # NimBLE GATT server & EMG telemetry manager
│   └── audio_driver.h     # MAX98357A I2S DAC audio driver interface
├── src/
│   ├── emg_sensor.cpp     # ADC read, EMA smoothing equation, voltage scaling
│   ├── ble_service.cpp    # JSON packetization, BLE notifications, reconnect loop
│   ├── audio_driver.cpp   # ESP32 I2S initialization & sine wave test tone generator
│   └── main.cpp           # System startup orchestrator & 50Hz telemetry loop
└── README.md              # Engineering documentation
```

---

## Bluetooth Low Energy (BLE) Specifications

- **Device Name**: `VoiceBack-Neckband`
- **Service UUID**: `4fa8c001-1278-472e-b997-63992e716a4d`
- **EMG Telemetry Characteristic**: `beb5483e-36e1-4688-b7f5-ea07361b26a8` (Notify & Read)
- **JSON Notification Packet Format**:
  ```json
  {
    "raw": 1842,
    "flt": 1835.45,
    "vlt": 1.479
  }
  ```

---

## How to Build & Flash

### Method 1: Using PlatformIO (Recommended)
1. Open the `firmware/` directory in VS Code with PlatformIO extension installed.
2. Connect your ESP32 board via USB.
3. Run `PlatformIO: Build` and `PlatformIO: Upload`.
4. Open Serial Monitor at **115200 baud** to view real-time AD620 raw telemetry and filter graphs (`>AD620_Raw:...,Filtered:...`).

### Method 2: Using Arduino IDE
1. Copy files in `include/` and `src/` into a single sketch folder named `firmware.ino`.
2. Install `ArduinoJson` (v6.x) library via Library Manager.
3. Select Board: **ESP32 Dev Module**.
4. Compile and Upload.
