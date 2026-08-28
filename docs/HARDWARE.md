# VoiceBack – Hardware Specifications & Wiring Matrix

> **Document Version:** 1.0  
> **Status:** Active Specification  
> **Target MCU:** ESP32 Development Board (ESP-WROOM-32 / ESP32-D0WDQ6)  

---

## 1. Selected Hardware Component Breakdown

The hardware architecture relies on accessible, low-power modules integrated into a wearable prototype:

### Microcontroller: ESP32 Development Board
- **Model:** ESP-WROOM-32 (ESP32-D0WDQ6 Dual-Core Tensilica LX6).
- **Clock Speed:** 240 MHz.
- **Wireless Connectivity:** Built-in Bluetooth Low Energy (BLE 5.0 / 4.2 BR/EDR) and 802.11 b/g/n Wi-Fi.
- **Operating Logic Voltage:** 3.3V DC.
- **Analog-to-Digital Converter (ADC):** 12-bit resolution (`0 - 4095`), ADC1_CH6 mapped to GPIO34.
- **Audio Peripheral:** Hardware I2S controller (`I2S_NUM_0`).

### EMG Sensor: AD620 Analog Instrumentation Amplifier Module
- **Type:** Surface Electromyography (sEMG) Signal Conditioning Module.
- **Amplifier Core:** AD620 Instrumentation Amplifier with low noise and high Common Mode Rejection Ratio (CMRR).
- **Electrodes:** 3-lead surface snap electrodes (2 differential sensing electrodes placed on anterior neck muscles, 1 reference/ground electrode placed on neutral bone surface).
- **Signal Output:** Analog voltage proportional to muscular contraction amplitude connected to `GPIO34`.

### Bluetooth Low Energy (BLE)
- **Stack:** NimBLE-Arduino (v1.4.1).
- **Role:** GATT Server (`VoiceBack-Neckband`).
- **Telemetry Protocol:** JSON format packets notified over Characteristic `beb5483e-36e1-4688-b7f5-ea07361b26a8` at 50Hz interval (20ms).

### Speaker & Audio Subsystem
- **Audio Amplifier:** MAX98357A I2S Class-D Mono Audio Amplifier Module (3.2W output into 4Ω).
- **Gain Setting:** Wired to GND (12dB gain) or 3.3V (6dB gain).
- **Speaker:** 4Ω 3W Dynamic Mini Speaker (40mm diameter) for localized speech feedback.

---

## 2. Hardware Wiring Overview & Pin Matrix

```mermaid
graph TD
    subgraph Sensors & Conditioning
        E1[sEMG Electrodes] --> E2[BioAmp EXG Pill]
        E2 -- OUT (Analog) --> MCU[ESP32 Dev Board GPIO34]
    end

    subgraph Audio Playback
        MCU -- BCLK (GPIO26) --> AMP[MAX98357A I2S Amp]
        MCU -- LRC/WS (GPIO25) --> AMP
        MCU -- DIN/DOUT (GPIO22) --> AMP
        AMP --> SPK[4 Ohm 3W Speaker]
    end

    subgraph Power Circuit
        USB[USB 5V Charger] --> CHG[TP4056 PMIC]
        CHG <--> BAT[3.7V 800mAh Li-Po Cell]
        CHG -- OUT+ --> SW[Power Switch] --> MCU
    end
```

### Complete Hardware Pin Matrix Table

| Hardware Module | Module Pin Name | ESP32 GPIO Pin | Connection Type & Function |
| :--- | :--- | :--- | :--- |
| **BioAmp EXG Pill** | `OUT` | `GPIO34` | Analog input (ADC1_CH6 - Input only pin) |
| | `VCC` | `3.3V` / `5V` | System positive power supply rail |
| | `GND` | `GND` | Common system ground rail |
| **MAX98357A I2S Amp** | `BCLK` | `GPIO4` | I2S Bit Clock output |
| | `LRC` / `WS` | `GPIO5` | I2S Word Select / Left-Right Clock |
| | `DIN` / `DOUT` | `GPIO6` | I2S Serial PCM Data line |
| | `GAIN` | `GND` / `3.3V` | Hardware gain setting (GND = 12dB) |
| | `VIN` | `3.3V` / `5V` | Amplifier power supply rail |
| | `GND` | `GND` | Common system ground rail |
| **TP4056 PMIC** | `BAT+` / `BAT-` | Battery Terminals | 3.7V 800mAh Li-Po Cell Terminals |
| | `OUT+` | Power Switch | Switched battery positive output |
| | `OUT-` | `GND` | System ground rail |
| **Mini Speaker** | `+` / `-` | MAX98357A Speaker OUT | Differential audio output driving 4Ω 3W Speaker |

---

## 3. Hardware Status & TODOs

- **Benchtop Wiring Verification:** Implemented & Verified in Firmware.
- **Power Consumption Measurement:** **`[TODO]`**
- **Electrode Signal CMRR Tuning:** **`[TODO]`**
- **3D Printed Neckband Enclosure:** **`[TODO]`**
- **Custom PCB Schematic & Layout:** **`[TODO]`**
