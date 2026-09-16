# VoiceBack – Node.js Express REST API & MongoDB Atlas Service

> **Module Status:** Fully Implemented REST API & Database Service  
> **Environment:** Node.js (v18+) / Express.js / MongoDB Atlas / Mongoose ODM  
> **Canonical System Specification:** [VOICEBACK_FINAL_ARCHITECTURE_SPEC.md](../VOICEBACK_FINAL_ARCHITECTURE_SPEC.md)

---

## 1. Directory Structure

```
backend/
├── package.json          # Dependencies & npm scripts (start, dev, test:models, test:routes, test:services)
├── .env                  # Active environment variables (PORT, MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN, ELEVENLABS_API_KEY, GEMINI_API_KEY)
├── .env.example          # Environment variables template
├── README.md             # Setup guide & API reference documentation (this file)
│
├── scripts/              # Automated verification test scripts
│   ├── testModels.js     # Validates all 10 Mongoose schema definitions & instantiations
│   ├── testServices.js   # Validates database CRUD service layer, bcrypt hashing & JWT token generation
│   └── testRoutes.js     # Validates Express router endpoints & request handling
│
└── src/                  # Application source code
    ├── server.js         # HTTP server entry point & shutdown handlers
    ├── app.js            # Express setup, CORS, body parsers, route mounting, 404 & error handlers
    │
    ├── config/           # Centralized environment & database configuration
    │   ├── index.js      # Environment variables loader
    │   └── database.js   # Mongoose connection manager for MongoDB Atlas
    │
    ├── models/           # 10 Mongoose collection schemas
    │   ├── UserLogin.js, Patient.js, Doctor.js, Caregiver.js
    │   ├── VoiceProfile.js, EMGProfile.js, TherapyProgress.js
    │   ├── CommunicationHistory.js, Appointment.js, EmergencySOS.js, index.js
    │
    ├── services/         # Business logic & cloud integration layer
    │   ├── userLoginService.js (Authentication, bcrypt hashing & JWT generation)
    │   ├── patientService.js, doctorService.js, caregiverService.js
    │   ├── voiceProfileService.js, emgProfileService.js, therapyProgressService.js
    │   ├── communicationHistoryService.js, appointmentService.js, emergencySOSService.js
    │   ├── contextEngineService.js, nlpProcessorService.js, elevenLabsService.js, index.js
    │
    ├── controllers/      # HTTP Request/Response controllers
    │   ├── userLoginController.js, patientController.js, doctorController.js, caregiverController.js
    │   ├── voiceProfileController.js, emgProfileController.js, therapyProgressController.js
    │   ├── communicationHistoryController.js, appointmentController.js, emergencySOSController.js
    │   ├── contextController.js, healthController.js
    │
    ├── routes/           # Express REST API routes
    │   ├── userLoginRoutes.js, patientRoutes.js, doctorRoutes.js, caregiverRoutes.js
    │   ├── voiceProfileRoutes.js, emgProfileRoutes.js, therapyProgressRoutes.js
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
        └── responseFormatter.js # Standardized JSON response formatters (sendSuccess, sendError)
```

---

## 2. Dependencies & Core Stack

### Production Dependencies:
- **`express` (`^4.18.2`)**: Fast, unopinionated Web framework for Node.js.
- **`mongoose` (`^9.9.0`)**: Mongoose ODM for MongoDB Atlas collection modeling (10 models).
- **`bcrypt` (`^6.0.0`)**: Password hashing library using 10 salt rounds for secure authentication.
- **`jsonwebtoken` (`^9.0.3`)**: JSON Web Token implementation for 7-day auth token generation and verification.
- **`cors` (`^2.8.5`)**: Middleware to enable Cross-Origin Resource Sharing (CORS) with frontend clients.
- **`dotenv` (`^16.3.1`)**: Environment variable management from `.env`.

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)
- Active MongoDB Atlas connection URI

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
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Run automated test suites:
   ```bash
   npm run test:models    # Validates all 10 Mongoose schemas
   npm run test:services  # Validates CRUD services & password hashing
   npm run test:routes    # Validates REST API route wiring
   ```

---

## 4. API Endpoint Reference

| Category | Endpoint | Method | Description |
| :--- | :--- | :---: | :--- |
| **System** | `/health` | `GET` | Operational health check & uptime stats |
| **System** | `/` | `GET` | Root welcome message & API metadata |
| **Auth** | `/api/user-logins/login` | `POST` | Authenticates user & returns JWT token |
| **UserLogins** | `/api/user-logins` | `GET`, `POST` | User credential & role CRUD |
| **UserLogins** | `/api/user-logins/:id` | `GET`, `PUT`, `DELETE` | Single user credential retrieval & updates |
| **Patients** | `/api/patients` | `GET`, `POST` | List or create Patient clinical profiles |
| **Patients** | `/api/patients/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete Patient profile |
| **Doctors** | `/api/doctors` | `GET`, `POST` | List or create Doctor records |
| **Doctors** | `/api/doctors/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete Doctor record |
| **Caregivers** | `/api/caregivers` | `GET`, `POST` | List or create Caregiver records |
| **Caregivers** | `/api/caregivers/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete Caregiver record |
| **Voice Profiles** | `/api/voice-profiles` | `GET`, `POST` | List or create Voice Profiles |
| **Voice Profiles** | `/api/voice-profiles/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete Voice Profile |
| **Voice Synthesis**| `/api/v1/voice-profiles/synthesize` | `POST` | ElevenLabs TTS speech generation using stored `voiceId` |
| **Context Engine** | `/api/v1/context/generate-responses` | `POST` | Ephemeral response choices generated via Gemini LLM |
| **EMG Profiles** | `/api/emg-profiles` | `GET`, `POST` | List or create sEMG baseline profiles |
| **EMG Profiles** | `/api/emg-profiles/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete EMG profile |
| **Therapy Progress** | `/api/therapy-progress` | `GET`, `POST` | List or create Therapy Progress logs |
| **Therapy Progress** | `/api/therapy-progress/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete Therapy log |
| **Comm History** | `/api/communication-history` | `GET`, `POST` | List or create speech recognition attempt logs |
| **Comm History** | `/api/communication-history/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete speech log |
| **Appointments** | `/api/appointments` | `GET`, `POST` | List or schedule Appointments |
| **Appointments** | `/api/appointments/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete Appointment |
| **Emergency SOS** | `/api/emergency-sos` | `GET`, `POST`, `PUT` | Emergency alert dispatch & status resolution |


