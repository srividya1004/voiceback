# VoiceBack Smart Neckband - ESP32 Firmware Documentation

This module contains the **ESP32 C++/Arduino firmware** for the VoiceBack Smart Neckband embedded hardware layer.

---

## 1. Production Hardware Architecture

The active hardware pipeline is:
**Microphone / Application → Bluetooth Low Energy (BLE) → ESP32 → I²S → MAX98357A → Physical Speaker**

The host device (smartphone/tablet/browser PWA) captures acoustic speech via microphone and processes speech recognition and synthesis. The synthesized audio is streamed over BLE to the ESP32, which forwards 16-bit mono PCM over I²S to the MAX98357A Class-D amplifier driving the physical speaker.

> [!NOTE]
> The legacy BioAmp/EMG analog sensor is **not part of this architecture** and is not initialized or sampled.

---

## 2. Hardware Wiring Matrix

| Hardware Module | Module Pin | ESP32 GPIO Pin | Function |
| :--- | :--- | :--- | :--- |
| **MAX98357A I2S Amp** | `BCLK` | `GPIO26` | I²S Bit Clock |
| | `LRC` / `WS` | `GPIO25` | I²S Left/Right Word Select Clock |
| | `DIN` / `DOUT` | `GPIO22` | I²S Serial PCM Audio Data |
| | `GAIN` | `GND` (12dB) / `3.3V` (6dB) | Amplifier Hardware Gain Configuration |
| | `VIN` | `3.3V` / `5V` | Positive Power Rail |
| | `GND` | `GND` | Common Ground Rail |
| **Mini Speaker** | `+` / `-` | `MAX98357A OUT` | Differential output driving 4Ω 3W dynamic speaker |

---

## 3. Bluetooth Low Energy (BLE) Specifications

- **Device Name**: `VoiceBack-Neckband`
- **Service UUID**: `4fa8c001-1278-472e-b997-63992e716a4d`

### Active Characteristics
1. **Audio Ingress Characteristic** (`cba1483e-36e1-4688-b7f5-ea07361b26b9` — Write / Write without response):
   - Accepts **16 kHz, 16-bit mono PCM** chunks directly from the VoiceBack application.
   - Forwards PCM data to the MAX98357A via I²S DMA buffers.
2. **Volume Control Characteristic** (`7b9e483e-36e1-4688-b7f5-ea07361b26c0` — Read / Write / Write without response):
   - Accepts volume level adjustments ($0 - 100\%$) and scales PCM digital amplitude.
3. **Inert Compatibility Characteristic** (`beb5483e-36e1-4688-b7f5-ea07361b26a8` — Read / Notify):
   - Retained strictly as an inert stub for Web Bluetooth GATT discovery compatibility with the existing client application.
   - Has zero hardware pin reads, zero ADC sampling, zero queues, and sends no notifications.

---

## 4. Building with PlatformIO

```bash
# Build firmware binary
pio run

# Upload to connected ESP32 board
pio run -t upload

# Open serial monitor (115200 baud)
pio device monitor -b 115200
```
