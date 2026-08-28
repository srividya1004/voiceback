# VOICEBACK — CRITICAL HARDWARE CONSISTENCY AUDIT REPORT
### BioAmp EXG Pill Integration & Stale AD620 Reference Analysis

**Date:** August 26, 2026  
**Status:** Audit Complete — Zero Source Code Modifications Performed  
**Scope:** Physical Hardware Signal Path, Firmware Pin Matrix, AD620 Stale Reference Mapping, BioAmp EXG Pill Compatibility, and Pre-Power-On Electrical Safety Checklist.

---

## A. CURRENT ACTUAL HARDWARE SIGNAL PATH

The physical prototype assembly uses the **BioAmp EXG Pill** for surface electromyography (sEMG) acquisition without an external AD620 module:

```
┌─────────────────────────────────────────┐
│ BioAmp EXG Pill                         │
│ - 3 Surface Electrodes (Neck/Jaw)       │
│ - Onboard Bandpass Filter + Gain Stage  │
│ - Analog Signal Output (0.0V - 3.3V)    │
└────────────────────┬────────────────────┘
                     │ Analog OUT Wire
                     v
┌─────────────────────────────────────────┐
│ ESP32 Microcontroller                   │
│ - Input Pin: GPIO34 (ADC1_CH6)          │
│ - Sampling Rate: 50 Hz (20ms loop)      │
│ - DSP: EMA Filter (α = 0.15)            │
└────────────────────┬────────────────────┘
                     │ FreeRTOS Queue (Core 0)
                     v
┌─────────────────────────────────────────┐
│ NimBLE GATT Telemetry Server            │
│ - Service: 4fa8c001-1278-472e-b997-...  │
│ - Char:    beb5483e-36e1-4688-b7f5-...  │
└────────────────────┬────────────────────┘
                     │ BLE JSON Notification
                     v
┌─────────────────────────────────────────┐
│ VoiceBack PWA Frontend                  │
└─────────────────────────────────────────┘
```

---

## B. EXACT ADC PIN

- **ESP32 Pin:** **GPIO34**
- **Internal ADC Peripheral:** `ADC1_CH6` (Input-only, non-capacitive, not shared with Wi-Fi ADC2).
- **Resolution:** `12-bit` (Range: `0` to `4095`, corresponding to `0.0V` to `3.3V`).

---

## C. ALL AD620 REFERENCES AND WHERE THEY OCCUR

A total search across the workspace identified **22 files** containing stale `AD620` text strings. Below is the precise breakdown:

### 1. Active Firmware Source Code & Headers

| File Path | Line # | Reference Text / Symbol | Classification |
| :--- | :---: | :--- | :--- |
| [`firmware/include/config.h`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/include/config.h#L16-L17) | 16-17 | `// AD620 Analog EMG Sensor Input`<br>`#define AD620_ANALOG_PIN 34` | **Active Macro Symbol & Comment** |
| [`firmware/include/emg_sensor.h`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/include/emg_sensor.h#L2-L28) | 2, 28 | `* AD620 EMG Sensor Interface`<br>`EMGSensor(uint8_t pin = AD620_ANALOG_PIN, ...)` | **Constructor Default & Header Comment** |
| [`firmware/src/emg_sensor.cpp`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/src/emg_sensor.cpp#L2) | 2 | `* AD620 EMG Sensor Implementation` | **File Header Comment** |
| [`firmware/src/main.cpp`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/src/main.cpp#L5) | 5 | `* AD620 Analog EMG Sensor Module (GPIO34)` | **File Header Comment** |
| [`firmware/src/main.cpp`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/src/main.cpp#L20) | 20 | `EMGSensor emgSensor(AD620_ANALOG_PIN, EMA_ALPHA);` | **Active Code Constructor Call** |
| [`firmware/src/main.cpp`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/src/main.cpp#L37) | 37 | `Serial.println("[Init] Initializing AD620 EMG Sensor...");` | **Runtime Serial Log String** |
| [`firmware/src/main.cpp`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/src/main.cpp#L85) | 85 | `Serial.printf(">AD620_Raw:%d,...")` | **Serial Plotter Telemetry Format Header** |

### 2. Firmware Documentation & Backup Files

| File Path | Description | Classification |
| :--- | :--- | :--- |
| [`firmware/README.md`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/README.md#L9) | Hardware wiring table ("AD620 EMG Sensor"), directory tree, & plotter guide. | **Stale Engineering Documentation** |
| `firmware/code_bkup/*` | Legacy backup files of firmware headers and sources. | **Inactive Legacy Backup** |

### 3. Project Documentation Files

| File Path | Description | Classification |
| :--- | :--- | :--- |
| [`docs/HARDWARE.md`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/docs/HARDWARE.md#L21) | Component breakdown, Mermaid block diagram, & wiring matrix listing AD620. | **Stale Hardware Specification** |
| `README.md` & `PROJECT_CONTEXT.md` | Overview documentation mentioning AD620 sensor module. | **Stale System Overview Docs** |
| `docs/VoiceBack_Master_Architecture_v1.md` | System architecture text reference. | **Stale Architecture Spec** |

---

## D. WHETHER ANY AD620 CODE IS ACTUALLY ACTIVE

- **Hardware Dependency:** **NONE.** No code relies on hardware features unique to an AD620 chip (such as SPI/I2C registers or specific gain potentiometers).
- **Code Execution:** The firmware executes standard ESP32 ADC reads (`analogRead(34)`), EMA digital filtering equations, and voltage scaling (`voltage = raw / 4095 * 3.3V`).
- **Conclusion:** The `AD620` occurrences are **purely naming/labeling artifacts** (`AD620_ANALOG_PIN` macro, serial print statements, and header comments). No external AD620 hardware is expected or required by the C++ code.

---

## E. WHETHER CURRENT FIRMWARE IS COMPATIBLE WITH BIOAMP EXG PILL

- **Compatibility Status:** **100% COMPATIBLE.**
- **Technical Justification:**
  1. The BioAmp EXG Pill outputs a single-ended analog voltage (0V to 3.3V centered around a ~1.65V virtual ground) proportional to neck muscular contraction.
  2. The firmware `EMGSensor` class reads GPIO34 as an analog pin (`pinMode(GPIO34, INPUT)`), applies 12-bit sampling (`analogReadResolution(12)`), smooths the signal via Exponential Moving Average (EMA), and computes baseline offset (`mav = abs(filtered - baseline)`).
  3. This math is identical for the BioAmp EXG Pill analog output.

---

## F. EXACT FILES THAT NEED UPDATING (FOR FUTURE RENAMING)

When approval is granted to update labeling, the following files should be updated to replace `AD620` with `BioAmp`:

1. **`firmware/include/config.h`:** Rename `#define AD620_ANALOG_PIN` to `#define BIOAMP_ANALOG_PIN`.
2. **`firmware/include/emg_sensor.h`:** Update default parameter to `BIOAMP_ANALOG_PIN` and update header comment.
3. **`firmware/src/emg_sensor.cpp`:** Update top docstring header.
4. **`firmware/src/main.cpp`:** Update constructor argument, startup Serial log message, and Serial Plotter string (`>BioAmp_Raw:%d`).
5. **`firmware/README.md`:** Update wiring matrix table and directory overview.
6. **`docs/HARDWARE.md`:** Update component specs, Mermaid diagram, and pin matrix table.
7. **`README.md` & `PROJECT_CONTEXT.md`:** Update overview architecture descriptions.

---

## G. ELECTRICAL & POWER SAFETY CHECKLIST (BEFORE POWERING HARDWARE)

> [!WARNING]
> Perform these physical measurements with a multimeter BEFORE turning on the power switch or connecting the USB cable:

- [ ] **Check 1: Common Ground Continuity (GND Rail):** Verify with a continuity meter that ESP32 `GND`, BioAmp EXG Pill `GND`, MAX98357A `GND`, and TP4056 `OUT-` share a solid, zero-resistance common ground connection.
- [ ] **Check 2: BioAmp Power Supply Rail:** Ensure BioAmp EXG Pill `VCC` is connected to the ESP32 **`3.3V` regulated rail** (do NOT connect raw 3.7V battery voltage directly to BioAmp VCC).
- [ ] **Check 3: BioAmp Analog Output Voltage Limit:** Verify BioAmp `OUT` signal pin is connected directly to **GPIO34**. Ensure voltage on GPIO34 strictly stays between **`0.0V` and `3.3V`** (ESP32 GPIO pins are not 5V tolerant).
- [ ] **Check 4: Battery & TP4056 PMIC Wiring:** Confirm TP4056 `OUT+` is wired through the mechanical power switch to ESP32 **`VIN` / `5V` pin** (enabling the onboard 3.3V LDO regulator) rather than directly to the 3.3V rail.
- [ ] **Check 5: Speaker Load Impedance:** Confirm the mini speaker connected across MAX98357A `OUT+` and `OUT-` has a nominal impedance of **4Ω** or **8Ω** (ensure no accidental short circuit between speaker outputs).

---

### Final Architecture Representation:

$$\text{BioAmp EXG Pill (Analog OUT)} \longrightarrow \text{ESP32 GPIO34 (ADC1\_CH6)} \longrightarrow \text{EMA Processing} \longrightarrow \text{BLE GATT} \longrightarrow \text{VoiceBack PWA}$$
