# VoiceBack Smart Neckband - ESP32 Firmware Documentation

This module contains the **ESP32 C++/Arduino firmware** for the VoiceBack Smart Neckband embedded hardware layer.

---

## 1. Production Hardware Architecture

The active hardware pipeline utilizes a **dual I2S architecture** allowing simultaneous audio capture and playback over Bluetooth Low Energy (BLE).

**A. Upstream Pipeline (Capture)**
**INMP441 Physical Microphone → ESP32 (I2S_NUM_1) → BLE Notify → Application (PWA)**

**B. Downstream Pipeline (Playback)**
**Application (PWA) → BLE Write → ESP32 (I2S_NUM_0) → MAX98357A → Physical Speaker**

The host device (smartphone/tablet/browser PWA) captures acoustic speech upstream from the neckband's microphone for ElevenLabs Scribe STT processing. The resulting synthesized Cartesia TTS audio is streamed back downstream over BLE to the ESP32, which forwards 16-bit mono PCM to the Class-D amplifier driving the physical speaker.

> **IMPORTANT: No BioAmp / EMG**
> The legacy BioAmp/EMG analog sensor is **not part of this architecture**, and all associated telemetry and calibration routines have been removed. GPIO34 is completely unused.

---

## 2. Hardware Wiring Matrix

The firmware operates on standard ESP32 development boards (e.g. ESP-WROOM-32).

### Microphone: INMP441 (I2S_NUM_1)
| Pin | ESP32 GPIO | Function |
| :--- | :--- | :--- |
| `SCK` | `GPIO32` | I2S_NUM_1 Clock |
| `WS` | `GPIO33` | I2S_NUM_1 Word Select |
| `SD` | `GPIO35` | I2S_NUM_1 Serial Data In |
| `VCC` | `3.3V` | Positive Power Rail |
| `GND` | `GND` | Common Ground Rail |
| `L/R` | `GND` | Left Channel Select |

### Speaker: MAX98357A I2S Amp (I2S_NUM_0)
| Pin | ESP32 GPIO | Function |
| :--- | :--- | :--- |
| `BCLK`| `GPIO26` | I2S_NUM_0 Bit Clock |
| `LRC` | `GPIO25` | I2S_NUM_0 Word Select Clock |
| `DIN` | `GPIO22` | I2S_NUM_0 Serial PCM Audio Data |
| `GAIN`| `GND` (12dB) / `3.3V` (6dB) | Amplifier Hardware Gain Configuration |
| `VIN` | `3.3V` / `5V` | Positive Power Rail |
| `GND` | `GND` | Common Ground Rail |
| `+` / `-` | `SPK` | Differential output driving 4Ω 3W dynamic speaker |

---

## 3. Bluetooth Low Energy (BLE) Specifications

- **Device Name**: `VoiceBack-Neckband`
- **Service UUID**: `4fa8c001-1278-472e-b997-63992e716a4d`
- **Audio Format**: 16 kHz, 16-bit Mono PCM

### Active Characteristics

1. **Microphone Control Characteristic** (`MIC_CTRL` UUID: *refer to `config.h`* — Write):
   - Accepts commands from the PWA to start (`0x01`) or stop (`0x00`) the INMP441 audio capture stream.
2. **Microphone Audio Characteristic** (`MIC_AUDIO` UUID: *refer to `config.h`* — Notify):
   - Streams captured 16kHz PCM audio chunks upstream to the PWA while capture is active.
3. **Speaker Audio Ingress Characteristic** (`cba1483e-36e1-4688-b7f5-ea07361b26b9` — Write without response):
   - Accepts 16kHz PCM chunks directly from the VoiceBack application and forwards them to the MAX98357A via I2S_NUM_0 DMA buffers.
4. **Volume Control Characteristic** (`7b9e483e-36e1-4688-b7f5-ea07361b26c0` — Read / Write / Write without response):
   - Accepts volume level adjustments ($0 - 100\%$) and scales PCM digital amplitude before playback.

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
