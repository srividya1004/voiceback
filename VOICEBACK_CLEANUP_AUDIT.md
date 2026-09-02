# VOICEBACK — FINAL REPOSITORY CLEANUP AUDIT REPORT
**Execution Mode:** READ-ONLY AUDIT  
**Target Architecture:** Microphone → Wispr Flow → Cleaned Transcript → Context/Response Engine → Temp Choices → Select & Confirm → Patient ElevenLabs Voice ID → ElevenLabs TTS (`eleven_v3`) → BLE/Audio Transfer → ESP32 → MAX98357A → Physical Speaker

---

## 1. REPOSITORY INVENTORY

```
voiceback/
├── .gitignore                          [A] Active Git ignore file
├── .env.example                        [B] Workspace root / template config reference
├── PROJECT_CONTEXT.md                  [B] Core project documentation & system context
├── README.md                           [B] Primary repository documentation
├── VOICEBACK_END_TO_END_WORKFLOW.md    [B] End-to-end workflow documentation
├── VOICEBACK_FINAL_ARCHITECTURE_SPEC.md [B] Final production architecture specification
├── backend/                            [A] Express.js REST API & MongoDB Atlas database backend
│   ├── .env                            [H] Active local secrets (Git-ignored)
│   ├── .env.example                    [B] Backend environment variable template
│   ├── package.json                    [A] Node.js dependencies & scripts
│   ├── package-lock.json               [A] Backend dependency lockfile
│   ├── backups/                        [E] Local database snapshot folder (Git-ignored)
│   ├── scripts/                        [C] 25 automated backend test & verification scripts
│   ├── temp_uploads/                   [D] Ephemeral audio test recordings & generated TTS files
│   └── src/                            [A] Application source code
│       ├── app.js                      [A] Express application setup & middleware configuration
│       ├── server.js                   [A] HTTP server entrypoint
│       ├── config/                     [A] Database & environment configuration
│       ├── controllers/                [A] 12 REST API Controllers (Patient, Doctor, Caregiver, etc.)
│       ├── middleware/                 [A] Auth, Error, Logger, & Multer upload middleware
│       ├── models/                     [A] 10 Mongoose schemas (including EMGProfile)
│       ├── routes/                     [A] 12 Express API router modules
│       ├── services/                   [A] 12 Business logic & third-party service integrations
│       └── utils/                      [A] Response formatters & validation helpers
├── pwa/                                [A] Vite + React 19 Progressive Web Application
│   ├── .env                            [H] Active frontend local environment variables (Git-ignored)
│   ├── .env.example                    [B] Frontend environment variable template
│   ├── .gitignore                      [A] Frontend Git ignore configuration
│   ├── .oxlintrc.json                  [A] Linter configuration
│   ├── index.html                      [A] HTML entrypoint
│   ├── package.json                    [A] React & Vite dependency manifest
│   ├── package-lock.json               [A] Frontend dependency lockfile
│   ├── vite.config.js                  [A] Vite build configuration
│   ├── README.md                       [B] PWA documentation
│   ├── dist/                           [D] Compiled production build output (Git-ignored)
│   ├── public/                         [A] Static PWA assets (favicon, icons, logo)
│   └── src/                            [A] Application source code
│       ├── App.css                     [A] App styling
│       ├── App.jsx                     [A] Root component & screen router with RBAC protection
│       ├── index.css                   [A] Global design system & styles
│       ├── main.jsx                    [A] React application entrypoint
│       ├── assets/                     [A] Static image assets
│       ├── components/                 [A] 29 UI Screen & Module components
│       ├── context/                    [A] SettingsContext (i18n & app settings state)
│       ├── i18n/                       [A] Multilingual translations dictionary
│       └── services/                   [A] 12 Frontend API services (Auth, Voice, Device, etc.)
├── firmware/                           [A] ESP32 PlatformIO C++ Firmware
│   ├── .gitignore                      [A] Firmware Git ignore configuration
│   ├── platformio.ini                  [A] PlatformIO project & ESP32 hardware build configuration
│   ├── compile_commands.json           [D] Generated C++ intellisense compilation database (Git-tracked)
│   ├── playground-1.mongodb.js         [D] Temporary MongoDB VS Code extension draft file
│   ├── README.md                       [B] Firmware documentation & hardware setup guide
│   ├── code_bkup/                      [E] Backup folder containing old src/main.cpp
│   ├── New folder/                     [E] Empty leftover folder
│   ├── test_assets/                    [C] Local audio WAV test samples (h.wav, test.wav, test2.wav)
│   ├── include/                        [A] 6 C++ Header files (audio, ble, config, emg, wifi)
│   └── src/                            [A] 5 C++ Source files (audio_driver, ble, emg, wifi, main)
├── emg-ai/                             [G] Legacy sEMG Speech Recognition AI Module
│   ├── README.md                       [B] EMG AI documentation reference
│   ├── data/                           [G] Raw sEMG datasets (hundreds of .npy & .json files)
│   ├── experiments/                    [G] Model training & pipeline evaluation scripts
│   ├── features/                       [G] Feature extraction placeholder directory
│   ├── models/                         [G] GRU/BiLSTM & CNN-Transformer PyTorch model definitions & checkpoints
│   ├── notebooks/                      [G] Jupyter notebooks directory
│   ├── preprocessing/                  [G] Signal processing, dataset loaders, & legacy FastAPI inference service
│   └── tests/                          [C] Pytest suite for legacy EMG inference
├── docs/                               [B] 21 Project Architecture & Audit Markdown Documents
└── .venv/                              [D] Root Python virtual environment (~2.5GB, Git-ignored)
```

---

## 2. KEEP LIST (Classified as A or B)

The following components MUST remain in the production codebase to support the primary architecture, clinical management modules, and hardware communication:

### A. Frontend PWA (`pwa/`)
- **Core Entry & Config:** `index.html`, `vite.config.js`, `package.json`, `package-lock.json`, `.oxlintrc.json`, `App.css`, `index.css`, `main.jsx`, `App.jsx`.
- **Role & Auth Screens:** `SplashScreen.jsx`, `RoleSelectionScreen.jsx`, `PatientIntroScreen.jsx`, `PatientRegistrationScreen.jsx`, `PatientLoginScreen.jsx`, `DoctorLoginScreen.jsx`, `DoctorRegistrationScreen.jsx`, `CaregiverLoginScreen.jsx`, `CaregiverRegistrationScreen.jsx`.
- **Dashboards:** `PatientDashboardScreen.jsx`, `DoctorDashboardScreen.jsx`, `CaregiverDashboardScreen.jsx`.
- **Patient Modules:** `PatientProfileScreen.jsx`, `VoiceCloningModule.jsx`, `UniversalSpeechInput.jsx`, `ConversationModeModule.jsx`, `WakeWordVoicePipelineModule.jsx`, `EmergencySOSModule.jsx`, `PatientAppointmentsModule.jsx`, `PatientReportsModule.jsx`, `TherapyExercisesModule.jsx`, `TherapyGamesModule.jsx`, `DynamicCommunicationModule.jsx`, `VolumeControlWidget.jsx`, `SettingsBottomSheet.jsx`, `VoiceBackLogo.jsx`, `PasswordInput.jsx`, `SpeechInputTrigger.jsx`.
- **Services & State:** `SettingsContext.jsx`, `translations.js`, `apiClient.js`, `apiService.js`, `authService.js`, `voiceService.js`, `contextService.js`, `deviceService.js`, `patientService.js`, `doctorService.js`, `caregiverService.js`, `appointmentService.js`, `communicationService.js`, `therapyService.js`, `validationService.js`.

### B. Backend API (`backend/`)
- **Core Application:** `server.js`, `app.js`, `config/database.js`, `config/index.js`, `middleware/errorHandler.js`, `middleware/logger.js`, `middleware/uploadMiddleware.js`, `utils/responseFormatter.js`, `utils/validationHelper.js`.
- **Mongoose Data Models (All 10 Intact):** `UserLogin.js`, `Patient.js`, `Doctor.js`, `Caregiver.js`, `VoiceProfile.js`, `CommunicationHistory.js`, `TherapyProgress.js`, `Appointment.js`, `EmergencySOS.js`, `EMGProfile.js`.
- **Controllers & Services:** `userLoginController.js`, `patientController.js`, `doctorController.js`, `caregiverController.js`, `voiceProfileController.js`, `contextController.js`, `communicationHistoryController.js`, `therapyProgressController.js`, `appointmentController.js`, `emergencySOSController.js`, `healthController.js`, `emgProfileController.js`, `elevenLabsService.js`, `nlpProcessorService.js`, `contextEngineService.js`, `userLoginService.js`, `patientService.js`, `doctorService.js`, `caregiverService.js`, `voiceProfileService.js`, `communicationHistoryService.js`, `therapyProgressService.js`, `appointmentService.js`, `emergencySOSService.js`, `emgProfileService.js`.

### C. ESP32 Firmware (`firmware/`)
- **Build Configuration:** `platformio.ini`, `firmware/.gitignore`, `firmware/README.md`.
- **Headers (`firmware/include/`):** `audio_driver.h`, `ble_service.h`, `config.h`, `emg_sensor.h`, `wifi_ap_service.h`, `test_audio.h`.
- **Source Files (`firmware/src/`):** `main.cpp`, `audio_driver.cpp` (MAX98357A I2S driver), `ble_service.cpp` (BLE GATT transfer), `wifi_ap_service.cpp` (Fallback AP), `emg_sensor.cpp` (BioAmp EXG reader).

### D. Documentation & Environment Templates
- Root documentation: `README.md`, `PROJECT_CONTEXT.md`, `VOICEBACK_END_TO_END_WORKFLOW.md`, `VOICEBACK_FINAL_ARCHITECTURE_SPEC.md`.
- Environment templates: `backend/.env.example`, `pwa/.env.example`.
- All 21 architectural and diagnostic guide files in `docs/`.

---

## 3. ARCHIVE LIST (Classified as B - Required Archive / Documentation)

The following components represent legacy EMG speech-recognition ML architectures. While superseded by the primary **Microphone + Wispr Flow** pipeline, they contain valuable DSP algorithms and training methodologies that should be preserved in an `archive/` or `legacy/` reference folder:

1. `emg-ai/models/baseline_model.py` — Legacy PyTorch GRU/BiLSTM neural network definition.
2. `emg-ai/models/cnn_transformer_model.py` — Legacy CNN-Transformer sEMG speech recognition architecture.
3. `emg-ai/preprocessing/dataset.py`, `features.py`, `gaddy_adapter.py`, `gaddy_dataset.py`, `metrics.py`, `record_utility.py` — sEMG signal processing, envelope extraction, STFT feature engineering, and WER metrics calculation.
4. `emg-ai/preprocessing/emg_inference_service.py` — Legacy FastAPI local sEMG model server.
5. `emg-ai/experiments/evaluate_pipeline.py`, `train_baseline.py`, `train_gaddy_cnn_transformer.py` — Offline ML training and evaluation scripts.
6. `pwa/src/components/SilentSpeechModule.jsx` — Legacy EMG sEMG real-time calibration & training UI screen.

---

## 4. REMOVE CANDIDATES (Classified as C, D, E, F, G, H)

Each candidate identified for potential deletion is itemized below:

| Path | Classification | Why Unused / Obsolete | What References / Imports It | Deletion Risk | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `emg-ai/data/` | **G / E** | Huge raw `.npy` arrays and `.json` files from Gaddy dataset. Obsolete since EMG is not the primary speech recognition path. | `gaddy_dataset.py`, `download_gaddy.py` | **None** (Ignored by Git, not used by backend/PWA). | **Delete / Purge** |
| `emg-ai/models/best_baseline.pt` | **G / D** | 45MB PyTorch binary weights file for legacy GRU/BiLSTM EMG model. | `emg_inference_service.py` | **None** | **Delete** |
| `emg-ai/models/checkpoints/` | **G / D** | Intermediate model checkpoints from past training runs. | None | **None** | **Delete** |
| `emg-ai/models/__pycache__/`, `emg-ai/preprocessing/__pycache__/`, `emg-ai/tests/__pycache__/` | **D** | Compiled Python bytecode. | Python runtime | **None** | **Delete** |
| `emg-ai/preprocessing/download_gaddy.py`, `validate_gaddy_dataset.py`, `validate_target_dataset.py`, `verify_dataset.py` | **G** | Dataset acquisition and validation scripts for Gaddy dataset. | None | **None** | **Delete** |
| `emg-ai/models/feature_scaler.json` | **G** | Feature normalization metadata for legacy EMG model. | `emg_inference_service.py` | **None** | **Delete** |
| `emg-ai/tests/test_emg_inference.py` | **C / G** | Pytest test script for legacy EMG inference service. | None | **None** | **Delete** |
| `.venv/` | **D** | Root Python virtual environment (~2.5GB) created for EMG PyTorch training. | Local shell | **None** (Node backend & Vite PWA run on Node.js). | **Delete / Exclude** |
| `firmware/code_bkup/src/main.cpp` | **E** | Duplicate backup file of old firmware `main.cpp`. | None | **None** | **Delete** |
| `firmware/New folder/` | **E** | Empty accidental directory in firmware folder. | None | **None** | **Delete** |
| `firmware/test_assets/` (`h.wav`, `test.wav`, `test2.wav`) | **C / D** | Audio WAV test samples used during initial MAX98357A I2S driver testing. | None | **None** | **Delete** |
| `firmware/playground-1.mongodb.js` | **D / G** | Misplaced temporary VS Code MongoDB Extension playground draft inside firmware directory. | None | **None** | **Delete** |
| `firmware/compile_commands.json` | **D** | 6.5MB C++ Intellisense compilation database accidentally committed to Git. | VS Code C++ extension | **None** (Re-generated automatically by build tools). | **Remove from Git tracking** |
| `pwa/dist/` | **D** | Compiled production build output directory. | Vite build tool | **None** (Re-created via `npm run build`). | **Delete from working copy** |
| `backend/temp_uploads/*.mp3`, `backend/temp_uploads/*.webm` | **D / C** | 12+ generated test audio recordings and TTS output files accumulated during testing. | Dynamically generated at runtime | **None** (Keep `temp_uploads/.gitkeep`). | **Delete files, retain `.gitkeep`** |
| `backend/backups/` | **E / D** | Local database snapshot dump folder. | None | **None** | **Delete** |

---

## 5. SECURITY FINDINGS

### Secrets & Environment Files Inspection

1. **`backend/.env` (Local Real Configuration):**
   - Contains: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`.
   - **Git Status:** **NOT TRACKED** (Confirmed via `git ls-files`).
   - **Ignore Status:** Covered by line 10 (`.env`) in root `.gitignore`.
   - **Secret Exposure Risk:** **ZERO**. Real API keys and connection strings are securely stored locally.

2. **`pwa/.env` (Local Real Configuration):**
   - Contains: `VITE_API_BASE_URL`.
   - **Git Status:** **NOT TRACKED** (Confirmed via `git ls-files`).
   - **Ignore Status:** Covered by line 10 (`.env`) in root `.gitignore`.
   - **Secret Exposure Risk:** **ZERO**.

3. **`backend/.env.example` & `pwa/.env.example` (Tracked Templates):**
   - **Git Status:** **TRACKED** (Confirmed via `git ls-files`).
   - **Content Audit:** Contains strictly clean placeholder names:
     - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/voiceback`
     - `JWT_SECRET=<your_jwt_secret_key>`
     - `ELEVENLABS_API_KEY=<sk_elevenlabs_key>`
     - `VITE_API_BASE_URL=http://localhost:5000/api/v1`
   - **Secret Exposure Risk:** **ZERO**.

4. **Hardcoded Codebase Secrets Audit:**
   - Evaluated all `.js`, `.jsx`, `.cpp`, `.h`, `.py` source files.
   - **Result:** No active secrets, passwords, or API keys are hardcoded in tracked application source code.

### Security Hygiene Recommendation
- Add `.env` and `.env.local` explicitly to `pwa/.gitignore` to ensure secondary defense-in-depth even if root `.gitignore` is overridden.

---

## 6. DUPLICATE / DEAD-CODE FINDINGS

1. **`firmware/code_bkup/src/main.cpp`:** Backup file duplicating old firmware initialization.
2. **`firmware/playground-1.mongodb.js`:** Misplaced MongoDB draft file in the ESP32 C++ firmware folder.
3. **`firmware/compile_commands.json`:** 6.5MB generated IDE output file tracked in Git.
4. **`pwa/src/components/SilentSpeechModule.jsx`:** Legacy sEMG calibration module imported in `PatientDashboardScreen.jsx` (lines 40 & 756) but obsolete under the **Microphone + Wispr Flow** primary speech input architecture.
5. **`backend/temp_uploads/`:** Accumulation of 12 temporary `.mp3` and `.webm` test audio files from previous TTS test scripts.

---

## 7. DEPENDENCY & REFERENCE VERIFICATION

1. **Package Manifest Audit:**
   - `backend/package.json`: Dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcrypt`, `axios`, `multer`, `socket.io`, `dotenv`, `cors`, `form-data`) are 100% active and essential.
   - `pwa/package.json`: Dependencies (`react` v19, `react-dom`, `lucide-react`, `axios`, `vite`, `oxlint`) are active and lightweight.

2. **Route Alignment Verification:**
   - **Backend API Routes:** All 12 router modules (`patientRoutes`, `doctorRoutes`, `caregiverRoutes`, `voiceProfileRoutes`, `contextRoutes`, `communicationHistoryRoutes`, `therapyProgressRoutes`, `appointmentRoutes`, `emergencySOSRoutes`, `userLoginRoutes`, `healthRoutes`, `emgProfileRoutes`) match production requirements.
   - **Frontend App Router:** `App.jsx` handles 12 primary view screens protected by Role-Based Access Control (`patient`, `doctor`, `caregiver`).

3. **Firmware Dependencies:**
   - PlatformIO config targets `esp32dev` with standard libraries for I2S audio (`driver/i2s.h`), BLE GATT (`BLEDevice.h`), and BioAmp analog sampling. All dependencies intact.

---

## 8. EXACT PROPOSED DELETION LIST

The following exact files/folders are proposed for removal:

```bash
# 1. Firmware cleanup
firmware/code_bkup/
firmware/New folder/
firmware/test_assets/
firmware/playground-1.mongodb.js

# 2. Temporary audio upload cleanup
backend/temp_uploads/output_voice_en.mp3
backend/temp_uploads/output_voice_hi.mp3
backend/temp_uploads/output_voice_kn.mp3
backend/temp_uploads/output_voice_sample.mp3
backend/temp_uploads/pipeline_step10_en.mp3
backend/temp_uploads/pipeline_step10_hi.mp3
backend/temp_uploads/pipeline_step10_kn.mp3
backend/temp_uploads/test_kannada_eleven_v3.mp3
backend/temp_uploads/voice-sample-*.webm

# 3. Local database dumps & venv
backend/backups/
.venv/

# 4. EMG AI datasets & generated binaries
emg-ai/data/
emg-ai/models/best_baseline.pt
emg-ai/models/checkpoints/
emg-ai/models/__pycache__/
emg-ai/preprocessing/__pycache__/
emg-ai/tests/__pycache__/
emg-ai/models/feature_scaler.json
emg-ai/tests/test_emg_inference.py
```

---

## 9. EXACT PROPOSED ARCHIVE LIST

The following exact files/folders are proposed to be moved to `archive/legacy_emg_ai/` for reference:

```bash
archive/legacy_emg_ai/
├── README.md
├── models/
│   ├── baseline_model.py
│   └── cnn_transformer_model.py
├── preprocessing/
│   ├── dataset.py
│   ├── emg_inference_service.py
│   ├── features.py
│   ├── gaddy_adapter.py
│   ├── gaddy_dataset.py
│   ├── metrics.py
│   └── record_utility.py
├── experiments/
│   ├── evaluate_pipeline.py
│   ├── train_baseline.py
│   └── train_gaddy_cnn_transformer.py
└── pwa_components/
    └── SilentSpeechModule.jsx
```

---

## 10. RISKS & SAFEGUARDS

1. **Risk 1 — UI Routing Breakage:** Removing `SilentSpeechModule.jsx` will break `PatientDashboardScreen.jsx` if lines 40 & 753-763 are not cleaned up simultaneously.
   - *Safeguard:* When executing cleanup in future steps, remove the import and update the `activeModule === 'Silent Speech'` check to redirect to `UniversalSpeechInput.jsx` or `ConversationModeModule.jsx`.
2. **Risk 2 — Upload Directory Failure:** Deleting all files in `backend/temp_uploads/` could cause Multer upload failures if the directory itself is deleted.
   - *Safeguard:* Keep `backend/temp_uploads/.gitkeep` intact so the folder structure is retained.
3. **Risk 3 — Git Cache Bloat:** `firmware/compile_commands.json` (6.5MB) is currently tracked in Git history.
   - *Safeguard:* Untrack with `git rm --cached firmware/compile_commands.json` and add `compile_commands.json` to `firmware/.gitignore`.
4. **Zero Impact Guarantee:**
   - Doctor & Caregiver modules remain 100% untouched.
   - Patient authentication, login, profile, and data models remain 100% untouched.
   - ElevenLabs voice cloning & TTS service integration (`eleven_v3`) remain 100% untouched.
   - ESP32 firmware and MAX98357A I2S speaker drivers remain 100% untouched.
