# VoiceBack – Node.js Express REST API & MongoDB Atlas Service

> **Module Status:** Fully Implemented REST API & Database Service  
> **Environment:** Node.js (v18+) / Express.js / MongoDB Atlas / Mongoose ODM  
> **Canonical System Specification:** [VOICEBACK_FINAL_ARCHITECTURE_SPEC.md](../VOICEBACK_FINAL_ARCHITECTURE_SPEC.md)

---

## 1. Directory Structure

```text
backend/
├── package.json          # Dependencies & npm scripts
├── .env                  # Active environment variables (PORT, MONGODB_URI, JWT_SECRET, ELEVENLABS_API_KEY, CARTESIA_API_KEY, GEMINI_API_KEY)
├── .env.example          # Environment variables template
├── README.md             # Setup guide & API reference documentation (this file)
│
├── scripts/              # Automated verification test scripts
│
└── src/                  # Application source code
    ├── server.js         # HTTP server entry point & shutdown handlers
    ├── app.js            # Express setup, CORS, body parsers, route mounting, 404 & error handlers
    │
    ├── config/           # Centralized environment & database configuration
    │   ├── index.js      # Environment variables loader
    │   └── database.js   # Mongoose connection manager for MongoDB Atlas
    │
    ├── models/           # 9 Mongoose collection schemas
    │   ├── UserLogin.js, Patient.js, Doctor.js, Caregiver.js
    │   ├── VoiceProfile.js, TherapyProgress.js
    │   ├── CommunicationHistory.js, Appointment.js, EmergencySOS.js, index.js
    │
    ├── services/         # Business logic & cloud integration layer
    │   ├── userLoginService.js (Authentication, bcrypt hashing & JWT generation)
    │   ├── patientService.js, doctorService.js, caregiverService.js
    │   ├── voiceProfileService.js, therapyProgressService.js
    │   ├── communicationHistoryService.js, appointmentService.js, emergencySOSService.js
    │   ├── contextEngineService.js, nlpProcessorService.js, elevenLabsService.js, index.js
    │
    ├── controllers/      # HTTP Request/Response controllers
    │   ├── userLoginController.js, patientController.js, doctorController.js, caregiverController.js
    │   ├── voiceProfileController.js, therapyProgressController.js
    │   ├── communicationHistoryController.js, appointmentController.js, emergencySOSController.js
    │   ├── contextController.js, healthController.js
    │
    ├── routes/           # Express REST API routes
    │   ├── userLoginRoutes.js, patientRoutes.js, doctorRoutes.js, caregiverRoutes.js
    │   ├── voiceProfileRoutes.js, therapyProgressRoutes.js
    │   ├── communicationHistoryRoutes.js, appointmentRoutes.js, emergencySOSRoutes.js
    │   ├── contextRoutes.js, healthRoutes.js, index.js
    │
    ├── middleware/       # Express middleware
    │   ├── logger.js     # HTTP request logging middleware
    │   ├── authMiddleware.js # JWT authentication verification
    │   └── errorHandler.js# Global error handling middleware
    │
    └── utils/            # Helper functions
        ├── validationHelper.js  # MongoDB ObjectId validator
        └── responseFormatter.js # Standardized JSON response formatters
```

---

## 2. Dependencies & Core Stack

### Production Dependencies:
- **`express` (`^4.18.2`)**: Fast, unopinionated Web framework for Node.js.
- **`mongoose` (`^9.9.0`)**: Mongoose ODM for MongoDB Atlas collection modeling (9 models).
- **`bcrypt` (`^6.0.0`)**: Password hashing library using 10 salt rounds for secure authentication.
- **`jsonwebtoken` (`^9.0.3`)**: JSON Web Token implementation for 7-day auth token generation and verification.
- **`cors` (`^2.8.5`)**: Middleware to enable Cross-Origin Resource Sharing.
- **`dotenv` (`^16.3.1`)**: Environment variable management from `.env`.

---

## 3. Core Backend Responsibilities

1. **Authentication & Authorization:** Securely managing Patient, Doctor, and Caregiver roles using bcrypt passwords and JWT.
2. **Speech-to-Text (STT):** Relaying patient microphone audio to **ElevenLabs Scribe** to generate raw phonetic transcripts.
3. **Meaning Reconstruction & Context Processing:** Utilizing **Gemini LLM** to reconstruct broken/slurred speech into clear intent while perfectly preserving grammatically clear speech.
4. **Companion Mode Dynamics:** Generating contextual responses via Gemini based on unseen caregiver prompts.
5. **Patient Voice Profile Lookup:** Managing the secure linkage between a `Patient` and their Cartesia `voiceId`.
6. **Voice Synthesis (TTS):** Routing confirmed text and patient `voiceId` to **Cartesia Instant Voice Cloning** to produce high-fidelity PCM audio with dynamic emotion parameters.

> **Security Note:** All API keys (`ELEVENLABS_API_KEY`, `CARTESIA_API_KEY`, `GEMINI_API_KEY`) reside exclusively in the backend `.env`. They are never exposed to the frontend PWA.

---

## 4. Quick Start & Setup Instructions

### Setup Steps
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```
2. Configure environment parameters in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@voicebackcluster.mpoeswq.mongodb.net/voiceback
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_ORIGIN=*
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   CARTESIA_API_KEY=your_cartesia_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

---

## 5. API Endpoint Reference

| Category | Endpoint | Method | Description |
| :--- | :--- | :---: | :--- |
| **System** | `/health` | `GET` | Operational health check & uptime stats |
| **Auth** | `/api/user-logins/login` | `POST` | Authenticates user & returns JWT token |
| **UserLogins** | `/api/user-logins` | `GET`, `POST`, `PUT`, `DELETE` | User credential & role CRUD |
| **Patients** | `/api/patients` | `GET`, `POST`, `PUT`, `DELETE` | Patient clinical profile CRUD |
| **Doctors** | `/api/doctors` | `GET`, `POST`, `PUT`, `DELETE` | Doctor practitioner record CRUD |
| **Caregivers** | `/api/caregivers` | `GET`, `POST`, `PUT`, `DELETE` | Caregiver contact record CRUD |
| **Voice Profiles** | `/api/voice-profiles` | `GET`, `POST`, `PUT`, `DELETE` | Voice cloning configuration & Cartesia TTS settings |
| **Voice Synthesis**| `/api/voice-profiles/synthesize` | `POST` | Cartesia TTS speech generation using stored `voiceId` |
| **Speech-to-Text** | `/api/voice-profiles/transcribe` | `POST` | Transcribes audio via ElevenLabs Scribe |
| **Context Engine** | `/api/context/generate-responses` | `POST` | Context/Reconstruction generated via Gemini LLM |
| **Therapy Progress** | `/api/therapy-progress` | `GET`, `POST`, `PUT`, `DELETE` | Clinical Therapy session progress logs |
| **Comm History** | `/api/communication-history`| `GET`, `POST`, `PUT`, `DELETE` | Real-time speech recognition event logs |
| **Appointments** | `/api/appointments` | `GET`, `POST`, `PUT`, `DELETE` | Clinical appointment scheduling |
| **Emergency SOS** | `/api/emergency-sos` | `GET`, `POST`, `PUT` | Emergency alert dispatch & status resolution |
