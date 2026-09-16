# VoiceBack – Hardware Specifications & Wiring Matrix

> **Document Version:** 1.0  
> **Status:** Active Specification  
> **Target MCU:** ESP32 Development Board (ESP-WROOM-32 / ESP32-D0WDQ6)  

---

## 1. Selected Hardware Component Breakdown

The hardware architecture relies on accessible, low-power modules integrated into a wearable prototype utilizing a robust **dual-I2S** audio design.

### Microcontroller: ESP32 Development Board
- **Model:** ESP-WROOM-32 (ESP32-D0WDQ6 Dual-Core Tensilica LX6).
- **Clock Speed:** 240 MHz.
- **Wireless Connectivity:** Built-in Bluetooth Low Energy (BLE 5.0 / 4.2 BR/EDR).
- **Operating Logic Voltage:** 3.3V DC.
- **Audio Peripherals:** Two Hardware I2S controllers (`I2S_NUM_0` for Speaker output, `I2S_NUM_1` for Microphone input).

### Primary Acoustic Input: INMP441 Microphone (I2S_NUM_1)
- **Type:** Omnidirectional I2S MEMS Microphone.
- **Function:** **PRIMARY SPEECH INPUT.** Captures patient verbal attempts, whispered sounds, and dysarthric acoustic signals.
- **Connection Interface:** Hardware I2S (`I2S_NUM_1`).
- **Pins:** `SCK = GPIO32`, `WS = GPIO33`, `SD = GPIO35`.
- **Note:** The PWA automatically switches to this microphone when the BLE neckband is connected, otherwise falling back to the browser microphone.

### Speaker & Audio Subsystem: MAX98357A (I2S_NUM_0)
- **Audio Amplifier:** MAX98357A I2S Class-D Mono Audio Amplifier Module (3.2W output into 4Ω).
- **Function:** Receives 16kHz PCM audio downstream over BLE from the Cartesia TTS engine and drives the physical speaker.
- **Connection Interface:** Hardware I2S (`I2S_NUM_0`).
- **Pins:** `BCLK = GPIO26`, `LRC/WS = GPIO25`, `DIN = GPIO22`.
- **Gain Setting:** Wired to GND (12dB gain) or 3.3V (6dB gain).
- **Speaker:** 4Ω 3W Dynamic Mini Speaker.

### Bluetooth Low Energy (BLE)
- **Stack:** NimBLE-Arduino.
- **Role:** GATT Server (`VoiceBack-Neckband`).
- **Audio Receive (Speaker) Characteristic:** `cba1483e-36e1-4688-b7f5-ea07361b26b9` (Downstream Write Without Response).
- **Audio Transmit (Mic) Characteristic:** (Upstream Notify - *UUID in config.h*).

> **IMPORTANT:** The BioAmp EXG Pill, sEMG telemetry, and GPIO34 dependencies have been permanently removed. They are not part of the active hardware architecture.

---

## 2. Hardware Wiring Overview & Pin Matrix

```mermaid
graph TD
    subgraph Audio Capture Subsystem
        MIC[INMP441 Microphone] -- SCK GPIO32 --> ESP32[ESP32 Dev Board]
        MIC -- WS GPIO33 --> ESP32
        MIC -- SD GPIO35 --> ESP32
        ESP32 -- Upstream Audio over BLE --> HOST[Client PWA]
        HOST -- ElevenLabs Scribe STT --> CLOUD[Backend / Cartesia TTS]
    end

    subgraph Audio Playback Subsystem
        CLOUD -- Downstream Audio over BLE --> ESP32
        ESP32 -- BCLK (GPIO26) --> AMP[MAX98357A I2S Amp]
        ESP32 -- LRC/WS (GPIO25) --> AMP
        ESP32 -- DIN/DOUT (GPIO22) --> AMP
        AMP --> SPK[4 Ohm 3W Speaker]
    end

    subgraph Power Circuit
        USB[USB 5V Charger] --> CHG[TP4056 PMIC]
        CHG <--> BAT[3.7V 800mAh Li-Po Cell]
        CHG -- OUT+ --> SW[Power Switch] --> ESP32
    end
```

### Complete Hardware Pin Matrix Table (Compiled Firmware Baseline)

| Hardware Module | Module Pin Name | ESP32 GPIO Pin | Connection Type & Function |
| :--- | :--- | :--- | :--- |
| **INMP441 Mic** | `SCK` | `GPIO32` | I2S_NUM_1 Clock |
| | `WS` | `GPIO33` | I2S_NUM_1 Word Select |
| | `SD` | `GPIO35` | I2S_NUM_1 Serial Data In |
| | `VCC` | `3.3V` | Positive power supply rail |
| | `GND` | `GND` | Common ground rail |
| | `L/R` | `GND` | Left channel select |
| **MAX98357A I2S Amp** | `BCLK` | `GPIO26` | I2S_NUM_0 Bit Clock output |
| | `LRC` / `WS` | `GPIO25` | I2S_NUM_0 Word Select / Left-Right Clock |
| | `DIN` / `DOUT` | `GPIO22` | I2S_NUM_0 Serial PCM Data line |
| | `GAIN` | `GND` / `3.3V` | Hardware gain setting (GND = 12dB, 3.3V = 6dB) |
| | `VIN` | `3.3V` / `5V` | Amplifier power supply rail |
| | `GND` | `GND` | Common ground rail |
| **TP4056 PMIC** | `BAT+` / `BAT-` | Battery Terminals | 3.7V 800mAh Li-Po Cell Terminals |
| | `OUT+` | Power Switch | Switched battery positive output |
| | `OUT-` | `GND` | System ground rail |
| **Mini Speaker** | `+` / `-` | MAX98357A Speaker OUT | Differential audio output driving 4Ω 3W Speaker |

---

## 3. Hardware Status & TODOs

- **Benchtop Wiring Verification:** Implemented & Verified in Firmware.
- **Power Consumption Measurement:** **`[TODO]`**
- **3D Printed Neckband Enclosure:** **`[TODO]`**
- **Custom PCB Schematic & Layout:** **`[TODO]`**
