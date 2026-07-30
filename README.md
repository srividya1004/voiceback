# VoiceBack – Embedded AI Healthcare System for Aphasia Patients

> **Project Status:** Competition & Innovation Prototype  
> **Source of Truth:** Project Files (Synchronized between Home PC & College PC via Git)  
> **Primary Documentation Suite:** [PROJECT_CONTEXT.md](file:///c:/Users/DELL/Desktop/voiceback/PROJECT_CONTEXT.md) | [PROJECT_HISTORY.md](file:///c:/Users/DELL/Desktop/voiceback/PROJECT_HISTORY.md) | [CHANGELOG.md](file:///c:/Users/DELL/Desktop/voiceback/CHANGELOG.md) | [NEXT_STEPS.md](file:///c:/Users/DELL/Desktop/voiceback/NEXT_STEPS.md) | [DEVELOPER_HANDOVER.md](file:///c:/Users/DELL/Desktop/voiceback/DEVELOPER_HANDOVER.md)

---

## 1. Overview

**VoiceBack** is an embedded AI healthcare wearable prototype designed to assist aphasia patients (individuals suffering from speech impairment following stroke or brain injury).

The system captures surface electromyography (**sEMG**) speech muscle activity from the neck using an **AD620 Instrumentation Amplifier Module**, recognizes speech attempts (silent, whispered, weak, or unclear), decodes intended text via an AI inference model, and outputs personalized speech locally via an onboard **MAX98357A I2S amplifier and neckband speaker** as well as through a mobile application.

```
+-----------------------------------------------------------------------------------+
|                                 VOICEBACK ECOSYSTEM                               |
|                                                                                   |
|  [Neck Electrodes] -> [AD620 EMG] -> [ESP32 MCU] ----(BLE)----> [Mobile App]      |
|                                         |                            |            |
|                                    (I2S Audio)                  (REST / WSS)      |
|                                         v                            v            |
|                                   [MAX98357A Amp]            [Node.js API]        |
|                                         |                            |            |
|                                   [3W Speaker]             +---------+---------+  |
|                                                            |                   |  |
|                                                    [FastAPI AI Engine]  [MongoDB] |
+-----------------------------------------------------------------------------------+
```

---

## 2. Repository Architecture & Directory Index

```
voiceback/
├── README.md               # Main project overview & index (this file)
├── PROJECT_CONTEXT.md      # Full architecture, medical context, hardware/DB specs
├── PROJECT_HISTORY.md      # Chronological development log & milestone history
├── CHANGELOG.md            # Versioned changes following Keep-a-Changelog format
├── NEXT_STEPS.md           # Active task checklist, roadmap & pending work
├── DEVELOPER_HANDOVER.md   # Multi-computer sync instructions (Home <-> College PC)
│
├── firmware/               # ESP32 C++ Arduino Firmware (PlatformIO Project)
│   ├── platformio.ini      # Build parameters & NimBLE/ArduinoJson dependencies
│   ├── include/            # Pin definitions (config.h), EMG, BLE, & Audio headers
│   └── src/                # ADC sampling, EMA filter, BLE streaming, I2S DAC driver
│
├── mobile/                 # [Planned] React Native / Cross-Platform Mobile App
├── backend/                # [Planned] Node.js + Express API & 9 MongoDB Atlas Schemas
├── ai_engine/              # [Planned] FastAPI Python EMG Speech Classification Engine
└── web_portals/            # [Planned] Doctor & Caregiver Web Dashboards
```

---

## 3. Core Hardware Stack & BOM

| Component | Part / Module | Function |
| :--- | :--- | :--- |
| **Microcontroller** | ESP32 Development Board (ESP-WROOM-32) | Built-in Wi-Fi & BLE 5.0, 240MHz dual-core |
| **EMG Sensor** | AD620 Analog EMG Sensor Module | High-gain differential neck sEMG signal input |
| **Audio Amplifier** | MAX98357A I2S Class-D Amp | Digital-to-analog audio output (3.2W) |
| **Speaker** | 4Ω 3W Dynamic Mini Speaker | Neckband localized voice feedback |
| **Power System** | TP4056 Charger + 3.7V Li-Po Battery | USB rechargeable 1A power circuit with SPST switch |
| **Chassis** | Ergonomic Smart Neckband | 3D-printed wearable enclosure |

For full wiring matrices and pin assignments, consult [PROJECT_CONTEXT.md](file:///c:/Users/DELL/Desktop/voiceback/PROJECT_CONTEXT.md#2-hardware-architecture--wiring-matrix).

---

## 4. Multi-Computer Synchronization & Handover

This project is actively developed across multiple workstations (**Home PC** & **College PC**). To maintain code and documentation parity:

1. **Project Files are Permanent Source of Truth**: All project state, progress, and architectural decisions are recorded in repository files rather than transient session memory.
2. **Before Leaving Workstation**: Run `git status`, commit all changes, update [DEVELOPER_HANDOVER.md](file:///c:/Users/DELL/Desktop/voiceback/DEVELOPER_HANDOVER.md), and push to GitHub.
3. **Upon Arriving at Workstation**: Pull latest updates with `git pull` before beginning work.

Read [DEVELOPER_HANDOVER.md](file:///c:/Users/DELL/Desktop/voiceback/DEVELOPER_HANDOVER.md) for step-by-step handover protocols.

---

## 5. Firmware Quick Start Guide

### Building with PlatformIO (Recommended)
1. Open the [firmware/](file:///c:/Users/DELL/Desktop/voiceback/firmware) directory in VS Code with the **PlatformIO** extension.
2. Connect ESP32 via USB.
3. Execute `PlatformIO: Build` and `PlatformIO: Upload`.
4. Open Serial Monitor at **115200 baud** to view real-time AD620 telemetry and EMA filter graphs.

For building with Arduino IDE or troubleshooting, see [firmware/README.md](file:///c:/Users/DELL/Desktop/voiceback/firmware/README.md).
