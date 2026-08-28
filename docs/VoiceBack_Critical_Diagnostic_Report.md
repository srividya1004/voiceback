# VOICEBACK — CRITICAL CURRENT-BEHAVIOR DIAGNOSTIC REPORT

**Date:** August 26, 2026  
**Status:** Comprehensive Diagnostic Completed — No Code Modifications Made  
**Scope:** Patient Voice Fallback, BLE Connection Sequence, Unavailable UI Data Chains, and Dynamic Response Quality.

---

## A. CURRENT VOICE ARCHITECTURE

### 1. Instant Voice Cloning (IVC) Capabilities
- **Backend Service:** [`elevenLabsService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/services/elevenLabsService.js#L43-L88) exposes `createInstantVoiceClone()`. It accepts recorded WAV/WEBM patient audio samples and posts to ElevenLabs API (`POST https://api.elevenlabs.io/v1/voices/add`).
- **Voice Profile Persistence:** [`voiceProfileController.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/controllers/voiceProfileController.js#L104-L147) receives the generated `voice_id` from ElevenLabs and updates/creates a [`VoiceProfile`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/models/VoiceProfile.js) MongoDB document linked to the patient ID with `status: "Ready"`.
- **Speech Synthesis Pipeline:** [`voiceProfileController.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/controllers/voiceProfileController.js#L153-L218) looks up the patient's `VoiceProfile`. If a custom `voiceId` exists, it invokes [`elevenLabsService.generateSpeech()`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/services/elevenLabsService.js#L99-L157) using the `eleven_v3` model with emotion delivery tags (`[calm]`, `[urgent]`, `[happy]`).
- **Privacy Protection:** Temporary voice sample files uploaded to disk are automatically unlinked (`fs.unlinkSync`) immediately after cloning/transcription to safeguard patient privacy.

---

## B. CURRENT FALLBACK ARCHITECTURE & PROPOSED REPLACEMENT

### 1. Current Fallback Behavior
- **When IVC is unavailable** (no subscription, unconfigured API key, or quota exhausted):
  - In backend: [`voiceProfileController.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/controllers/voiceProfileController.js#L174-L180) defaults un-cloned patients to a hardcoded ElevenLabs voice ID (`EXAVITQu4vr4xnSDxMaL` - Bella).
  - In frontend: If ElevenLabs API fails or key is missing, [`voiceService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/voiceService.js#L94-L119) falls back to browser-native `SpeechSynthesisUtterance`.
  - **Current Voice Match Flaw:** [`voiceService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/voiceService.js#L108) matches voices ONLY by 2-letter language code (`v.lang.startsWith('en')`). It selects the first voice returned by the operating system, which is often a generic robotic default voice, ignoring age, gender, and emotional context.

### 2. Proposed Replacement Architecture (Without Removing IVC)

```
                       ┌─────────────────────────────────────────┐
                       │ Patient Expressive Speech Request       │
                       └────────────────────┬────────────────────┘
                                            │
                             Is Patient Voice Cloned (IVC)?
                                     /             \
                               YES  /               \  NO / Unsubscribed
                                   v                 v
                 ┌──────────────────────────┐   ┌──────────────────────────┐
                 │ ElevenLabs IVC Cloned    │   │ Profile-Aware Natural    │
                 │ Patient Voice (eleven_v3)│   │ Standard Voice Selection │
                 └──────────────────────────┘   └────────────┬─────────────┘
                                                             │
                                              Is ElevenLabs API Key Active?
                                                     /              \
                                               YES  /                \  NO
                                                   v                  v
                                   ┌──────────────────────┐   ┌──────────────────────┐
                                   │ ElevenLabs Standard  │   │ Profile-Calibrated   │
                                   │ Natural Voice Pool   │   │ Native Speech Engine │
                                   │ (Age/Gender/Language)│   │ (Pitch/Rate/Gender)  │
                                   └──────────────────────┘   └──────────────────────┘
```

- **Tier 1 (ElevenLabs Standard Natural Voice Pool):** Map patient profile metadata (`gender` + `ageGroup` + `language`) to ElevenLabs pre-made natural voice IDs (e.g. Adam/George for male adults, Rachel/Bella for female adults).
- **Tier 2 (Profile-Calibrated Native Speech Engine):** If completely offline:
  - Filter `window.speechSynthesis.getVoices()` for natural/premium markers (e.g., Google/Microsoft natural voices).
  - Dynamically adjust `pitch`, `rate`, and `volume` based on patient profile (`age`: younger = slightly higher pitch; `gender`: female = +0.2 pitch; `emotion`: urgent = 1.15x rate, calm = 0.9x rate).

---

## C. EXACT BLUETOOTH FAILURE POINT

### 1. Root Cause Analysis
1. **PWA Bluetooth API Absent:** [`deviceService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/deviceService.js#L86-L102) contains `if (navigator.bluetooth)` checks but **NEVER calls `navigator.bluetooth.requestDevice(...)`**. A search for `requestDevice` across the entire `pwa` directory returns **0 occurrences**.
2. **Missing GATT Connection Pipeline:** The frontend lacks `device.gatt.connect()`, `service.getCharacteristic()`, and `characteristic.startNotifications()`. The PWA was running a simulated timeout sequence that never presented the browser BLE pairing prompt.
3. **Firmware Advertising Structure:** In [`ble_service.cpp`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/src/ble_service.cpp#L38-L48), the device name `"VoiceBack-Neckband"` is placed in `scanResponseData`, while Service UUID `4fa8c001-1278-472e-b997-63992e716a4d` is in primary `advertisementData`. Chrome requires `optionalServices: ['4fa8c001-1278-472e-b997-63992e716a4d']` to be explicitly declared during request, otherwise GATT connection to the service is blocked by Chrome security.

### 2. Precise Bluetooth Diagnostic Checklist
- [ ] **PWA Check 1:** Implement `navigator.bluetooth.requestDevice({ filters: [{ name: 'VoiceBack-Neckband' }], optionalServices: ['4fa8c001-1278-472e-b997-63992e716a4d'] })` in `deviceService.js`.
- [ ] **PWA Check 2:** Execute `gattServer = await device.gatt.connect()` and listen for `gattserverdisconnected`.
- [ ] **PWA Check 3:** Retrieve service `4fa8c001...` and characteristic `beb5483e...`, then call `startNotifications()`.
- [ ] **PWA Check 4:** Attach `characteristicvaluechanged` event listener to parse JSON telemetry payload (`{"raw":..., "flt":..., "vlt":...}`).
- [ ] **Firmware Check 1:** Verify NimBLE stack notification payload size against negotiated MTU size.
- [ ] **Firmware Check 2:** Confirm `pEMGCharacteristic->notify()` check for `getSubscribedCount() > 0`.
- [ ] **Browser Security Check:** Ensure PWA is served via `https://` or `http://localhost` (Web Bluetooth is disabled on unsecure HTTP origins on physical mobile devices).

---

## D. EXACT SOURCE OF UNAVAILABLE UI FIELDS

### 1. MongoDB Atlas Network/IP Whitelist Failure
- When the Node.js backend starts, [`database.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/config/database.js#L14-L45) attempts to connect to `voicebackcluster.mpoeswq.mongodb.net`.
- Connection fails with `SSL routines: ssl3_read_bytes: tlsv1 alert internal error / IP Whitelist Error`.
- The backend operates in fallback mode without persistence, returning empty arrays (`[]`) for database queries.

### 2. Data Chain Breakdown Matrix

| UI Component | Field | API Endpoint | Service | DB Model | Root Cause of "N/A" / Empty |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient Profile** | Medical History / Emergency Contact | `GET /api/patients/:id` | `patientService.js` | `Patient` | Quick registration omitted optional fields; DB disconnected. |
| **Doctor Dashboard** | Patient List & Stats | `GET /api/doctors` & `/patients` | `doctorService.js` | `Doctor` | `Doctor.patients` array is empty in DB / DB unreachable. |
| **Caregiver Dashboard** | Linked Patient Name | `GET /api/caregivers` & `/patients` | `caregiverService.js` | `Caregiver` | `Caregiver.assignedPatients` array is empty / DB unreachable. |
| **Therapy Reports** | Practice Score / History | `GET /api/therapy-progress` | `therapyProgressService.js` | `TherapyProgress` | No `TherapyProgress` documents exist for current patient ID. |
| **Silent Speech Module** | Baseline Voltage & MVC | `GET /api/emg-profiles` | `deviceService.js` | `EMGProfile` | Initialized to `'Not Available'`; DB call fails or no `EMGProfile` saved. |

---

## E. EXACT REASON DYNAMIC RESPONSES ARE POOR

### 1. Context Engine Flow Diagnostic
1. Caregiver speaks -> Speech-to-text transcribes question.
2. Frontend calls [`contextService.generateOptions()`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/contextService.js) -> `POST /api/context/generate-options`.
3. [`contextEngineService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/services/contextEngineService.js#L494-L503) checks for `GEMINI_API_KEY`.
4. **Primary Failure Point:** If `GEMINI_API_KEY` is unconfigured/times out, execution falls back to [`getDeterministicFallback()`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/services/contextEngineService.js#L502).
5. Fallback matches keywords in [`DETERMINISTIC_RULES`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/services/contextEngineService.js#L189-L344) and returns static pre-scripted phrases.

### 2. Test Scenario Diagnostic Table

| Scenario Question | Matched Rule Keyword | Intent Context | Semantic Intent | Generated Response (EN) | Quality Diagnostic |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. "Did you eat your lunch?"** | `lunch` | `rule_meal` | `MEAL_COMPLETED` | *"Yes, I ate lunch."* | **Static Rule Phrase** |
| **2. "Do you need water?"** | Unmatched (rule has 'food' only) | `generic_fallback` | `YES` / `NO` | *"Yes"* / *"No"* | **Generic Fallback** |
| **3. "Are you feeling pain?"** | `pain` | `rule_pain` | `PAIN_NONE` | *"No, I am not in pain."* | **Static Rule Phrase** |
| **4. "Did you take your medicine?"**| `medicine` | `rule_medicine` | `MEDICINE_TAKEN` | *"Yes, I took my medicine."* | **Static Rule Phrase** |
| **5. "Do you want to go outside?"**| `outside` | `rule_outside` | `ACTIVITY_OUTSIDE_YES` | *"Yes, I want to go outside."* | **Static Rule Phrase** |
| **6. Emergency/help situation** | `help` | `rule_feeling` | `HELP` | *"I need help."* | **Static Rule Phrase** |

---

## F. RESPONSIBLE FILES FOR EACH ISSUE

1. **Patient Voice & Fallback:**
   - [`backend/src/services/elevenLabsService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/services/elevenLabsService.js#L99-L157)
   - [`backend/src/controllers/voiceProfileController.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/controllers/voiceProfileController.js#L153-L218)
   - [`pwa/src/services/voiceService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/voiceService.js#L72-L122)

2. **Bluetooth Connection:**
   - [`pwa/src/services/deviceService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/deviceService.js#L86-L102)
   - [`pwa/src/components/SilentSpeechModule.jsx`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/components/SilentSpeechModule.jsx#L113-L120)
   - [`firmware/src/ble_service.cpp`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/firmware/src/ble_service.cpp#L13-L55)

3. **Unavailable UI Data:**
   - [`backend/src/config/database.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/config/database.js#L14-L45)
   - [`pwa/src/services/authService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/authService.js#L209-L270)
   - [`pwa/src/components/DoctorDashboardScreen.jsx`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/components/DoctorDashboardScreen.jsx)
   - [`pwa/src/components/CaregiverDashboardScreen.jsx`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/components/CaregiverDashboardScreen.jsx)

4. **Dynamic Response Quality:**
   - [`backend/src/services/contextEngineService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/backend/src/services/contextEngineService.js#L186-L503)
   - [`pwa/src/components/CaregiverDashboardScreen.jsx`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/components/CaregiverDashboardScreen.jsx#L71-L113)

---

## G. MINIMAL CHANGES REQUIRED FOR FIX

1. **Voice Fallback:** Implement profile-based natural voice lookup table (`age` + `gender` + `language`) in `voiceService.js` and `elevenLabsService.js`.
2. **Bluetooth Connection:** Implement `navigator.bluetooth.requestDevice()` and GATT notification subscription in `deviceService.js`.
3. **Unavailable UI Data:** Whitelist deployment IP in MongoDB Atlas dashboard and run a database seeding script (`seed.js`) to populate initial patient-doctor-caregiver relationships and therapy records.
4. **Dynamic Response Quality:** Add missing keywords (e.g. `'water'`, `'drink'`) to `DETERMINISTIC_RULES` and update Gemini system prompt in `contextEngineService.js` to inject patient profile variables.

---

## H. WHAT CAN BE FIXED WITHOUT TOUCHING WORKING FUNCTIONALITY

- **MongoDB Atlas Connection:** Whitelisting IP address in MongoDB Atlas requires zero code changes.
- **Web Bluetooth GATT Connection:** Adding `requestDevice()` inside `deviceService.js` does not alter existing UI components or backend API endpoints.
- **Voice Selection Fallback:** Enhancing fallback logic inside `voiceService.js` maintains full compatibility with ElevenLabs IVC when subscribed/available.
- **Context Engine Prompt Expansion:** Adding keywords and refining the Gemini prompt in `contextEngineService.js` maintains existing JSON schema contracts with the frontend.
