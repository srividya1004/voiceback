# VoiceBack – Final Product Requirements Document (PRD)

> **Document Status:** Active Production Baseline
> **Target Audience:** Engineering, Clinical Researchers, Product Teams
> **Architecture Release:** Dual-I2S Acoustic Restoration Architecture

---

## 1. Executive Summary

VoiceBack is an intelligent, wearable speech assistive ecosystem engineered to restore vocal agency for individuals suffering from speech impairments (such as Broca's aphasia, post-stroke dysarthria, or apraxia of speech). The system combines an embedded wearable neckband hardware module with cloud-based artificial intelligence:

1. **Acoustic Input:** Captures dysarthric, broken, or whispered vocal attempts via an on-device digital MEMS microphone (**INMP441** on `I2S_NUM_1`) or automatically via the client device microphone when disconnected.
2. **Speech Recognition:** Transcribes raw acoustic frames into uncorrected text using **ElevenLabs Scribe v2**.
3. **Context-Aware Reconstruction:** Leverages the **Gemini Context Engine** to reconstruct the patient's *exact intended utterance* from uncorrected phonemes and dysarthric patterns, strictly preserving patient voice intent without generating assistant replies, chatbot answers, or arbitrary fillers.
4. **Patient Verification Gate:** Presents the reconstructed candidate text directly to the patient for single-tap **Confirmation**, manual **Change** (in-place text editing), or **Cancellation**.
5. **Personalized Cloned Voice Output:** Synthesizes confirmed text in the patient's enrolled personal voice using **Cartesia Instant Voice Cloning (TTS)**.
6. **Acoustic Playback:** Streams 16kHz mono PCM audio back to the neckband's Class-D amplifier (**MAX98357A** on `I2S_NUM_0`) driving an integrated dynamic mini speaker.

---

## 2. Hardware Architecture & Pinout (Physical Source of Truth)

The hardware layer utilizes an ESP32 microcontroller with an isolated dual-I2S bus configuration.

### A. Microphone Subsystem (INMP441 MEMS Microphone)
The microphone runs on independent hardware controller **`I2S_NUM_1`**:
- **VDD:** `3.3V`
- **GND:** `GND`
- **L/R:** `GND` (Left Channel Mono)
- **SCK:** `GPIO26` (Bit Clock)
- **WS:** `GPIO25` (Word Select)
- **SD:** `GPIO34` (Serial Data In)
- **Sample Rate:** 16,000 Hz, 16-bit effective PCM resolution

### B. Speaker Subsystem (MAX98357A Class-D I2S Amplifier)
The audio amplifier runs on independent hardware controller **`I2S_NUM_0`**:
- **VIN:** `5V` (or regulated system rail)
- **GND:** `GND`
- **DIN:** `GPIO22` (Serial Data In from ESP32 `I2S_NUM_0`)
- **BCLK:** `GPIO27` (Bit Clock)
- **LRC:** `GPIO14` (Left/Right Word Select)
- **SD:** `3.3V` (SD/SD_MODE tied to 3.3V)
- **GAIN:** `GND` (12dB gain) or `3.3V` (6dB gain)
- **Transducer:** 4Ω 3W Dynamic Mini Speaker

### C. Bluetooth Low Energy (BLE GATT Interface)
- **Device Advertised Name:** `VoiceBack-Neckband`
- **Service UUID:** `4fa8c001-1278-472e-b997-63992e716a4d`
- **Speaker Audio Downstream Characteristic (`AUDIO_CMD`):** `cba1483e-36e1-4688-b7f5-ea07361b26b9` (Write Without Response)
- **Volume Control Characteristic (`VOLUME`):** `7b9e483e-36e1-4688-b7f5-ea07361b26c0` (Read / Write)
- **Microphone Control Characteristic (`MIC_CTRL`):** `e1f2a3b4-36e1-4688-b7f5-ea07361b26e1` (Write: `0x01` = Start Mic, `0x00` = Stop Mic)
- **Microphone Audio Notify Characteristic (`MIC_AUDIO`):** `f3d4e5a6-36e1-4688-b7f5-ea07361b26d1` (Notify: 16kHz 16-bit Mono PCM chunks)
- **Compatibility Characteristic (`EMG`):** `beb5483e-36e1-4688-b7f5-ea07361b26a8` (Inert discovery UUID)

> **Architectural Constraint:** BioAmp EXG and sEMG analog sensors have been completely purged from the system. No connection/disconnection audio chimes interrupt operations.

---

## 3. Core Software Modules & Data Pipelines

### A. Speech Reconstruction Engine (Patient Conversation Mode)
- **Objective:** Reconstruct what the patient *intended to say*.
- **Constraint:** Must NEVER turn patient speech into a chatbot answer, conversational reply, or assistant acknowledgment:
  - `"ಹಲೋ, ಚೆನ್ನಾಗಿದ್ದೀರಾ?"` → preserved as `"ಹಲೋ, ಚೆನ್ನಾಗಿದ್ದೀರಾ?"` (NEVER `"ನಾನು ಚೆನ್ನಾಗಿದ್ದೀನಿ."`)
  - `"How are you?"` → preserved as `"How are you?"` (NEVER `"I am fine."`)
  - `"I want water."` → preserved as `"I want water."`
  - `"Can you help me?"` → preserved as `"Can you help me?"`
  - Empty or silent input → yields `status: EMPTY` with ZERO fabricated sentences.
- **Language Fidelity:**
  - Kannada speech produces pure Kannada output.
  - English speech produces pure English output.
  - Mixed Kannada-English speech preserves both naturally without artificial translation.

### B. Candidate Change & Editing ("CHANGE")
- Tapping **CHANGE** transitions the candidate into an editable text field (`isEditingCorrection = true`).
- The action does **NOT** automatically rerun reconstruction or generate new AI text.
- The patient manually refines or types the intended sentence and confirms.
- Confirmed text is routed directly to Cartesia voice synthesis.

### C. Companion Speech Mode
- Caregiver or companion asks arbitrary, unseen spoken questions to the patient.
- ElevenLabs Scribe transcribes the question.
- Gemini Context Engine generates contextually appropriate, personalized multi-choice options.
- Tapping an option acts as patient selection and immediately synthesizes the response in the patient's Cartesia voice.

---

## 4. Verification & Testing Standards

1. **Reconstruction Suite:** Verified via `scripts/testReconstructionAndDynamicResponse.js` (65 passing unit assertions).
2. **Backend Services & Routes:** Verified via `npm run test:services`, `npm run test:models`, and `npm run test:routes`.
3. **Firmware Compilation:** Verified via PlatformIO (`pio run`) targeting ESP32 Dev Module with zero warnings or link errors.
4. **Physical Audio Pathways:** Dual-I2S hardware separation verified in pin mappings and driver allocations.
