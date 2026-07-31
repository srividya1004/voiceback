# VoiceBack – Node.js Express REST API & MongoDB Atlas Service

> **Module Status:** Fully Implemented REST API & Database Service (v0.2.0)  
> **Environment:** Node.js (v18+) / Express.js / MongoDB Atlas / Mongoose ODM  

---

## 1. Directory Structure

```
backend/
├── package.json          # Dependencies & npm scripts (start, dev, test:models, test:routes, test:services)
├── .env                  # Active environment variables (PORT, MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN)
├── .env.example          # Environment variables template
├── README.md             # Setup guide & API reference documentation (this file)
│
├── scripts/              # Automated verification test scripts
│   ├── testModels.js     # Validates Mongoose schema definitions & instantiations
│   ├── testServices.js   # Validates database CRUD service layer, bcrypt hashing & JWT token generation
│   └── testRoutes.js     # Validates Express router endpoints & request handling
│
└── src/                  # Application source code
    ├── server.js         # HTTP server entry point & shutdown handlers
    ├── app.js            # Express setup, CORS, body parsers, route mounting, 404 & error handlers
    │
    ├── config/           # Centralized environment & database configuration
    │   ├── index.js      # Environment variables loader
    │   └── db.js         # Mongoose connection manager for MongoDB Atlas
    │
    ├── models/           # 9 Mongoose collection schemas
    │   ├── UserLogin.js, Patient.js, Doctor.js, Caregiver.js
    │   ├── VoiceProfile.js, EMGProfile.js, TherapyProgress.js
    │   ├── CommunicationHistory.js, Appointment.js, index.js
    │
    ├── services/         # Business logic layer & database operations
    │   ├── userLoginService.js (Authentication, bcrypt hashing & JWT generation)
    │   ├── patientService.js, doctorService.js, caregiverService.js
    │   ├── voiceProfileService.js, emgProfileService.js, therapyProgressService.js
    │   ├── communicationHistoryService.js, appointmentService.js, index.js
    │
    ├── controllers/      # HTTP Request/Response controllers
    │   ├── userLoginController.js, patientController.js, doctorController.js, caregiverController.js
    │   ├── voiceProfileController.js, emgProfileController.js, therapyProgressController.js
    │   ├── communicationHistoryController.js, appointmentController.js, healthController.js
    │
    ├── routes/           # Express REST API routes
    │   ├── userLoginRoutes.js, patientRoutes.js, doctorRoutes.js, caregiverRoutes.js
    │   ├── voiceProfileRoutes.js, emgProfileRoutes.js, therapyProgressRoutes.js
    │   ├── communicationHistoryRoutes.js, appointmentRoutes.js, healthRoutes.js, index.js
    │
    ├── middleware/       # Express middleware
    │   ├── logger.js     # HTTP request logging middleware
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
- **`mongoose` (`^9.9.0`)**: Mongoose ODM for MongoDB Atlas collection modeling.
- **`bcrypt` (`^6.0.0`)**: Password hashing library using 10 salt rounds for secure authentication.
- **`jsonwebtoken` (`^9.0.3`)**: JSON Web Token implementation for 7-day auth token generation and verification.
- **`cors` (`^2.8.5`)**: Middleware to enable Cross-Origin Resource Sharing (CORS) with frontend clients.
- **`dotenv` (`^16.3.1`)**: Environment variable management from `.env`.

### Development Dependencies:
- **`nodemon` (`^3.0.1`)**: Development hot-reloader restarting server on code edits.

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
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment parameters in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/voiceback
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_ORIGIN=*
   ```

4. Start development server (with hot-reload):
   ```bash
   npm run dev
   ```

5. Run local test scripts:
   ```bash
   npm run test:models    # Tests Mongoose schema validations
   npm run test:services  # Tests CRUD services & password hashing
   npm run test:routes    # Tests API route wiring
   ```

---

## 4. API Endpoint Reference

| Category | Endpoint | Method | Payload / Params | Description |
| :--- | :--- | :---: | :--- | :--- |
| **System** | `/health` | `GET` | None | Operational health check & uptime stats |
| **System** | `/` | `GET` | None | Root welcome message & API metadata |
| **Auth** | `/api/user-logins/login` | `POST` | `{ email, password }` | Authenticates user & returns JWT token |
| **UserLogins** | `/api/user-logins` | `GET` | None | Retrieves all UserLogin records (excluding passwordHash) |
| **UserLogins** | `/api/user-logins` | `POST` | `{ email, passwordHash, role }` | Hashes password & creates UserLogin record |
| **UserLogins** | `/api/user-logins/:id` | `GET` | `id` (ObjectId) | Retrieves single UserLogin document by ID |
| **UserLogins** | `/api/user-logins/:id` | `PUT` | `id`, `{ email, role }` | Updates UserLogin record |
| **UserLogins** | `/api/user-logins/:id` | `DELETE` | `id` (ObjectId) | Deletes UserLogin record |
| **Patients** | `/api/patients` | `GET`, `POST` | `{ userId, fullName, age, aphasiaType, ... }` | List or create Patient clinical profiles |
| **Patients** | `/api/patients/:id` | `GET`, `PUT`, `DELETE` | `id` (ObjectId) | Retrieve, update, or delete Patient profile |
| **Doctors** | `/api/doctors` | `GET`, `POST` | `{ userId, fullName, specialization, licenseNumber, ... }` | List or create Doctor records |
| **Doctors** | `/api/doctors/:id` | `GET`, `PUT`, `DELETE` | `id` (ObjectId) | Retrieve, update, or delete Doctor record |
| **Caregivers** | `/api/caregivers` | `GET`, `POST` | `{ userId, fullName, phone, relationshipToPatient }` | List or create Caregiver records |
| **Caregivers** | `/api/caregivers/:id` | `GET`, `PUT`, `DELETE` | `id` (ObjectId) | Retrieve, update, or delete Caregiver record |
| **Voice Profiles** | `/api/voice-profiles` | `GET`, `POST` | `{ patientId, pitch, speedRate, voiceGender }` | List or create TTS Voice Profiles |
| **Voice Profiles** | `/api/voice-profiles/:id` | `GET`, `PUT`, `DELETE` | `id` (ObjectId) | Retrieve, update, or delete Voice Profile |
| **EMG Profiles** | `/api/emg-profiles` | `GET`, `POST` | `{ patientId, baselineVoltage, maxVoluntaryContraction }` | List or create sEMG Calibration Profiles |
| **EMG Profiles** | `/api/emg-profiles/:id` | `GET`, `PUT`, `DELETE` | `id` (ObjectId) | Retrieve, update, or delete EMG Profile |
| **Therapy Progress** | `/api/therapy-progress` | `GET`, `POST` | `{ patientId, exercisesCompleted, accuracyScore }` | List or create Therapy Progress logs |
| **Therapy Progress** | `/api/therapy-progress/:id` | `GET`, `PUT`, `DELETE` | `id` (ObjectId) | Retrieve, update, or delete Therapy log |
| **Comm History** | `/api/communication-history` | `GET`, `POST` | `{ patientId, attemptType, recognizedText, confidenceScore }` | List or create Speech Attempt logs |
| **Comm History** | `/api/communication-history/:id` | `GET`, `PUT`, `DELETE` | `id` (ObjectId) | Retrieve, update, or delete Speech log |
| **Appointments** | `/api/appointments` | `GET`, `POST` | `{ patientId, doctorId, appointmentDate, status }` | List or schedule Appointments |
| **Appointments** | `/api/appointments/:id` | `GET`, `PUT`, `DELETE` | `id` (ObjectId) | Retrieve, update, or delete Appointment |

