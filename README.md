# VoiceBack – Embedded AI Healthcare System for Aphasia Patients

> **Project Status:** Production Candidate (Firmware v1.0 | Backend API v1.0 | React PWA v1.0)
> **Source of Truth:** [VOICEBACK_FINAL_ARCHITECTURE_SPEC.md](VOICEBACK_FINAL_ARCHITECTURE_SPEC.md) | [VOICEBACK_END_TO_END_WORKFLOW.md](VOICEBACK_END_TO_END_WORKFLOW.md)
> **Technical Guides:** [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | [docs/HARDWARE.md](docs/HARDWARE.md) | [docs/SOFTWARE.md](docs/SOFTWARE.md) | [firmware/README.md](firmware/README.md) | [backend/README.md](backend/README.md) | [pwa/README.md](pwa/README.md)

---

## 1. What is VoiceBack?

**VoiceBack** is an integrated assistive healthcare wearable system engineered to empower individuals with aphasia (speech impairment resulting from stroke or traumatic brain injury) to regain verbal communication. It uses an ESP32-based neckband, a progressive web app, and cloud AI to capture weak or dysarthric speech, reconstruct intended meaning using context, and synthesize speech in the patient's own cloned voice.

## 2. Current System Architecture

The current end-to-end VoiceBack pipeline features a bi-directional audio path over BLE.

### A. Upstream Pipeline (Speech Input)
```text
Physical Microphone (INMP441 or Browser Mic)
  └──> ESP32 Microcontroller (if INMP441)
        └──> BLE GATT Stream (VoiceBack-Neckband)
              └──> PWA (React)
                    └──> ElevenLabs Scribe (STT)
                          └──> Raw Transcript
```

### B. Cognitive Pipeline (Reconstruction & Companion Mode)
```text
Raw Transcript
  └──> Gemini LLM (Context Engine)
        └──> Reconstructed Meaning (if speech was broken/slurred) OR Dynamic Caregiver Options
              └──> Patient Confirmation (Confirm / Change / Cancel)
```

### C. Downstream Pipeline (Voice Output)
```text
Confirmed Meaning
  └──> Cartesia (Patient Voice Cloning TTS)
        └──> Audio (16kHz 16-bit Mono PCM)
              └──> PWA
                    └──> BLE GATT Stream
                          └──> ESP32 Microcontroller
                                └──> MAX98357A I2S DAC (I2S_NUM_0)
                                      └──> Physical Speaker
```

## 3. Core Features & Workflows

### Patient Communication Flow
1. **Input:** The patient speaks into the active microphone.
2. **STT:** ElevenLabs Scribe generates a raw transcript.
3. **Reconstruction:** If the speech is clear and complete, the text is preserved perfectly. If it is broken, phonetic, incomplete, or slurred, the Gemini Context Engine reconstructs the most likely intended meaning without inventing new facts.
4. **Patient Agency:** The patient must explicitly Confirm, Change, or Cancel the reconstructed output. Cancelling prevents TTS entirely.
5. **TTS:** Upon confirmation, the text is synthesized using the patient's assigned Cartesia cloned voice ID (with available emotion capabilities).

### Companion Mode Flow
1. A caregiver asks arbitrary/unseen questions to the patient.
2. STT processes the caregiver's question.
3. The Gemini Context Engine dynamically generates contextually relevant response options (it is NOT a hardcoded dictionary).
4. The patient selects a response, which acts as implicit confirmation.
5. The system speaks the response using the patient's Cartesia cloned voice.

### Language Behavior
- **Kannada input** results in Kannada output.
- **English input** results in English output.
- **Mixed Kannada + English input** results in natural mixed-language output.

## 4. Hardware & Web Bluetooth (BLE)

- **Device Name:** `VoiceBack-Neckband`
- **Service UUID:** `4fa8c001-1278-472e-b997-63992e716a4d`
- **Audio Format:** 16kHz, 16-bit, Mono PCM

### Microphone (INMP441 via I2S_NUM_1)
- `SCK = GPIO32`
- `WS = GPIO33`
- `SD = GPIO35`
- *Auto-Switching:* When the BLE neckband is connected, the PWA automatically uses the physical INMP441. When disconnected, it automatically falls back to the browser microphone. No manual switching is required.

### Speaker (MAX98357A via I2S_NUM_0)
- `BCLK = GPIO26`
- `WS/LRC = GPIO25`
- `DIN = GPIO22`

> **Note:** The VoiceBack architecture uses **NO BioAmp, NO EMG, and NO GPIO34.** Any references to muscle calibration or 50Hz EMG telemetry belong to retired prototypes.

## 5. Security & Architecture Notes
- **Patient Voice Mapping:** Each patient securely maps to a specific Cartesia voice ID in the MongoDB database. Voice IDs are never hardcoded.
- **No Secrets in Frontend:** API keys (ElevenLabs, Cartesia, Gemini, MongoDB) are strictly maintained on the backend.
- **Database:** Uses MongoDB Atlas for clinical profiles, history, and voice profiles.

## 6. Setup & Execution Instructions

### A. Node.js Backend API
1. Navigate to backend: `cd backend`
2. Install dependencies: `npm install`
3. Configure `.env` with appropriate environment variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `ELEVENLABS_API_KEY`, `CARTESIA_API_KEY`, `GEMINI_API_KEY`. (Do not commit actual keys).
4. Start backend: `npm run dev`

### B. React Progressive Web App (PWA)
1. Navigate to PWA: `cd pwa`
2. Install dependencies: `npm install`
3. Start local Vite development server: `npm run dev`

### C. ESP32 Firmware (PlatformIO)
1. Open `firmware/` in VS Code with PlatformIO extension.
2. Build and upload: `PlatformIO: Build` and `PlatformIO: Upload`.
