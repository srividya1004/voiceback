# VoiceBack – Artificial Intelligence & Signal Processing Pipeline

> **Document Version:** 1.0  
> **Status:** Active Specification  

---

## 1. End-to-End Processing Pipeline Overview

The VoiceBack signal processing and AI inference architecture transforms raw neuromuscular throat surface electromyography (sEMG) signals into vocal speech output:

$$\begin{matrix}
\text{EMG Signal} \\ \text{(Neck sEMG)}
\end{matrix}
\longrightarrow
\begin{matrix}
\text{Signal Processing} \\ \text{(ADC & EMA Filter)}
\end{matrix}
\longrightarrow
\begin{matrix}
\text{Feature Extraction} \\ \text{(MAV, RMS, ZCR, WL)}
\end{matrix}
\longrightarrow
\begin{matrix}
\text{Speech Generation} \\ \text{(ML Classification & TTS)}
\end{matrix}
\longrightarrow
\begin{matrix}
\text{Audio Output} \\ \text{(I2S Amp & Speaker)}
\end{matrix}$$

---

## 2. Current Implementation (Firmware Level)

The following components are **fully implemented** inside `firmware/`:

### A. EMG Signal Acquisition
- **Hardware:** AD620 Instrumentation Amplifier reading surface muscle potentials via differential neck electrodes.
- **Sampling Rate:** 50 Hz loop interval ($20\text{ms}$ interval enforced in `main.cpp`).
- **ADC Resolution:** 12-bit ADC (`0 to 4095`) on ESP32 `GPIO34`.

### B. Onboard Signal Conditioning (EMA Filtering)
- **Digital Filter:** Exponential Moving Average (EMA) applied sample-by-sample:
  $$S_t = \alpha \cdot X_t + (1 - \alpha) \cdot S_{t-1}$$
  where $\alpha = 0.15$ (`EMA_ALPHA` in `config.h`).
- **Voltage Scaling:** Converts filtered ADC values to equivalent analog voltage ($0.0\text{V} - 3.3\text{V}$):
  $$V = \left(\frac{S_t}{4095}\right) \times 3.3$$
- **Proxy MAV:** Calculates deviation from baseline voltage:
  $$\text{MAV}_{\text{proxy}} = |S_t - V_{\text{baseline}}|$$

### C. Wireless Telemetry Packetization
- **Serialization:** Packs raw, filtered, and voltage data into JSON via `ArduinoJson`:
  ```json
  { "raw": 1842, "flt": 1835.45, "vlt": 1.479 }
  ```
- **Transmission:** Streams payload over NimBLE BLE notify characteristic (`beb5483e-36e1-4688-b7f5-ea07361b26a8`).

### D. Audio DAC Output Driver
- **Peripheral:** ESP32 Hardware I2S (`I2S_NUM_0`) driving MAX98357A Class-D mono amp.
- **Audio Format:** 16kHz, 16-bit mono PCM.
- **Test Tone Generator:** Synthesizes 440Hz sine wave tone for hardware readiness verification.

---

## 3. Planned Features (AI Engine & Classification Pipeline)

The following components are **`[Planned]`** for implementation in `ai_engine/` and `mobile/`:

```
+-----------------------------------------------------------------------------------+
|                            PLANNED AI INFERENCE ENGINE                            |
|                                                                                   |
|  [BLE Telemetry Stream]                                                           |
|           │                                                                       |
|           ▼                                                                       |
|  [200ms Sliding Windowing (50ms overlap)]                                         |
|           │                                                                       |
|           ▼                                                                       |
|  [Feature Vector Calculation]                                                     |
|   ├── Mean Absolute Value (MAV) = (1/N) * Σ |x_i|                                  |
|   ├── Root Mean Square (RMS)     = sqrt((1/N) * Σ x_i^2)                          |
|   ├── Zero Crossing Rate (ZCR)   = Count of sign flips                            |
|   └── Waveform Length (WL)       = Σ |x_{i+1} - x_i|                                |
|           │                                                                       |
|           ▼                                                                       |
|  [FastAPI Machine Learning Classifier] (Random Forest / CNN)                      |
|   ├── Class 0: Silent Speech Intent                                               |
|   ├── Class 1: Whispered Speech Attempt                                           |
|   ├── Class 2: Weak Speech Attempt                                                |
|   └── Class 3: Unclear Speech Attempt                                             |
|           │                                                                       |
|           ▼                                                                       |
|  [Speech Generation Engine]                                                       |
|   ├── Mobile Text-to-Speech (TTS) Engine Output                                   |
|   └── Streamed 16kHz PCM back to MAX98357A Neckband Speaker                       |
+-----------------------------------------------------------------------------------+
```

### Planned Signal Feature Extraction Equations
1. **Mean Absolute Value (MAV):**
   $$\text{MAV} = \frac{1}{N} \sum_{n=1}^{N} |x_n|$$
2. **Root Mean Square (RMS):**
   $$\text{RMS} = \sqrt{\frac{1}{N} \sum_{n=1}^{N} x_n^2}$$
3. **Zero Crossing Rate (ZCR):**
   $$\text{ZCR} = \sum_{n=1}^{N-1} \mathbb{I}\left(x_n \cdot x_{n+1} < 0\right)$$
4. **Waveform Length (WL):**
   $$\text{WL} = \sum_{n=1}^{N-1} |x_{n+1} - x_n|$$

---

## 4. Pipeline Component Status Summary

| Pipeline Stage | Module / Component | Implementation Status | Location |
| :--- | :--- | :--- | :--- |
| **sEMG Sensor Acquisition** | AD620 12-bit ADC (50Hz) | **Implemented** | `firmware/src/emg_sensor.cpp` |
| **Digital Signal Filtering** | Exponential Moving Average ($\alpha=0.15$) | **Implemented** | `firmware/src/emg_sensor.cpp` |
| **BLE Data Telemetry** | NimBLE GATT JSON Notify Stream | **Implemented** | `firmware/src/ble_service.cpp` |
| **Hardware Audio Output** | MAX98357A I2S DAC Driver | **Implemented** | `firmware/src/audio_driver.cpp` |
| **Sliding Windowing (200ms)** | Buffer Manager | **`[Planned]`** | `ai_engine/` |
| **Feature Extraction (MAV/RMS/ZCR/WL)** | Signal DSP Engine | **`[Planned]`** | `ai_engine/` |
| **Speech Intent Classifier** | ML Model (Random Forest / CNN) | **`[Planned]`** | `ai_engine/` |
| **Text-to-Speech Synthesis** | Mobile TTS / Server PCM Stream | **`[Planned]`** | `mobile/` |
