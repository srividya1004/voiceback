# Models Directory

> **Status:** Fully Implemented (9 Mongoose Schemas)

This directory contains Mongoose database models and schema definitions:
- `UserLogin.js`: Authentication, hashed passwords (`bcrypt`), and user roles (`Patient`, `Doctor`, `Caregiver`).
- `Patient.js`: Clinical demographic profile, age, aphasia type, and assigned practitioner IDs.
- `Doctor.js`: Medical practitioner credentials, specialization, hospital affiliation, and license number.
- `Caregiver.js`: Caregiver contact details, phone, and relationship to patient.
- `VoiceProfile.js`: TTS audio synthesis preferences (pitch, speed rate, gender, voice asset URL).
- `EMGProfile.js`: Calibrated sEMG baseline thresholds, MVC values, and baseline vectors.
- `TherapyProgress.js`: Clinical therapy session logs, exercises completed, and accuracy scores.
- `CommunicationHistory.js`: Real-time speech attempt event logs, attempt type, recognized text, and confidence score.
- `Appointment.js`: Clinical session scheduling, date, status, and clinical notes.
- `index.js`: Centralized export module bundling all 9 Mongoose models.

