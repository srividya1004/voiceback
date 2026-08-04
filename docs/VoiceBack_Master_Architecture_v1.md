# VoiceBack Master Architecture v1.0

**Version:** 1.0

**Project Name:** VoiceBack – AI Powered Silent Speech Communication System for Aphasia Patients

**Last Updated:** 04 August 2026

**Current Status:** Sprint 3 Completed

---

# 1. Project Vision

VoiceBack is an AI-powered wearable communication system designed to restore the voice of people with aphasia.

The system captures silent speech using EMG (Electromyography) signals from a wearable neckband, interprets the intended speech using Artificial Intelligence, and regenerates it in the patient's own cloned voice.

The platform also provides therapy support, doctor monitoring, caregiver collaboration, and emergency communication in a secure and user-friendly healthcare ecosystem.

---

# 2. Problem Statement

Millions of people affected by aphasia struggle to communicate after losing their natural speech due to stroke, neurological disorders, or brain injuries.

Existing communication methods often rely on text selection or robotic text-to-speech systems, which lack personalization and emotional connection.

VoiceBack aims to bridge this gap by enabling patients to communicate naturally using silent EMG signals and their own regenerated voice.

---

# 3. Objectives

## Primary Objective

Restore a patient's ability to communicate using their own voice through silent EMG signal recognition and AI-powered voice regeneration.

## Secondary Objectives

- Provide personalized speech therapy.
- Enable doctor monitoring.
- Support caregiver communication.
- Maintain secure patient records.
- Improve communication speed using context-aware AI.
- Support multilingual communication.
- Integrate wearable hardware with cloud-based services.

---

# 4. System Architecture

```
                    VoiceBack Ecosystem

            ┌──────────────────────────┐
            │ React Progressive Web App│
            │ Patient / Doctor / Caregiver
            └─────────────┬────────────┘
                          │
                 REST API / WebSocket
                          │
            ┌─────────────▼────────────┐
            │ Node.js + Express Backend│
            └─────────────┬────────────┘
                          │
                    MongoDB Atlas
                          │
     ┌─────────────┬──────────────┬─────────────┐
     │             │              │             │
 Patients    Therapy Data   Voice Models   EMG Profiles
```

---

# 5. Technology Stack

## Frontend

- React
- Vite
- React Router
- Axios
- CSS
- Progressive Web App (PWA)

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- bcrypt
- REST APIs

---

## Database

- MongoDB Atlas
- Mongoose ODM

---

## Firmware

- ESP32
- AD620 EMG Sensor
- MAX98357A Audio Amplifier
- Bluetooth Low Energy (BLE)

---

## Artificial Intelligence (Planned)

- Silent Speech Recognition
- Voice Cloning
- Context-Aware Responses
- Personalized Vocabulary
- Therapy Recommendation Engine

---

# 6. Project Structure

```
voiceback/

├── backend/
│
├── firmware/
│
├── pwa/
│
└── docs/
    ├── VoiceBack_Master_Architecture_v1.md
    ├── Sprint1_Report.md
    ├── Sprint2_Report.md
    ├── Sprint3_Report.md
    ├── Backend_Architecture.md
    ├── Firmware_Architecture.md
    └── AI_Architecture.md
```

---

# 7. Completed Sprints

## Sprint 1 – Authentication Integration

### Completed

- React ↔ Node.js Authentication
- MongoDB Integration
- JWT Authentication
- Patient Registration
- Patient Login
- Doctor Registration
- Doctor Login
- Caregiver Registration
- Caregiver Login
- Protected Routes
- Session Management
- Logout
- Error Handling

**Status:** ✅ Complete

---

## Sprint 2 – Dashboard & Profile Integration

### Completed

- Patient Dashboard Integration
- Backend Data Integration
- Patient Profile
- Avatar Support
- Voice Profile Section
- Device Placeholder
- Appointment Integration
- Therapy Integration
- Communication History Integration

**Status:** ✅ Complete

---

## Sprint 3 – Voice Profile Foundation

### Completed

- Voice Profile Management
- Voice Sample Workflow
- Dataset Preparation
- Voice Training Workflow
- Recording Guidelines
- AI Placeholder Fields
- Backend Readiness Analysis

**Status:** ✅ Complete

---

# 8. Current Progress

| Module | Progress |
|----------|---------|
| Frontend | 99% |
| Backend | 92% |
| Database | 100% |
| Authentication | 100% |
| Frontend ↔ Backend Integration | 70% |
| Firmware | 45% |
| Artificial Intelligence | Planning Completed |

---

# 9. Backend Architecture

Current Backend Components

- Authentication
- JWT
- bcrypt
- Patients
- Doctors
- Caregivers
- Appointments
- Therapy Progress
- Voice Profiles
- Communication History
- EMG Profiles

Future Backend Components

- Voice Sample Upload
- AI Training API
- Speech Synthesis API
- Device Communication API

---

# 10. Firmware Architecture

Current Firmware

- ESP32
- AD620 EMG Sensor
- BLE Communication
- EMA Signal Filtering
- EMG Sampling
- Telemetry

Current Completion

Approximately 45%

Future Firmware

- Live BLE Streaming
- Battery Monitoring
- Signal Quality
- OTA Updates
- Device Pairing

---

# 11. AI Architecture

Planned AI Pipeline

```
Voice Samples

↓

Voice Dataset

↓

Voice Cloning Model

↓

Stored Voice Model

↓

Wearable EMG

↓

Signal Processing

↓

Silent Speech Recognition

↓

Context Engine

↓

Patient's Voice

↓

Speaker Output
```

Future AI Modules

- Silent Speech Recognition
- Voice Cloning
- Context-Aware Responses
- Frequently Used Words
- Personalized Vocabulary
- Therapy Recommendation

---

# 12. Database Collections

Current Collections

- UserLogin
- Patient
- Doctor
- Caregiver
- Appointment
- TherapyProgress
- CommunicationHistory
- VoiceProfile
- EMGProfile

Future Collections

- VoiceSamples
- AITrainingJobs
- DeviceStatus
- FirmwareLogs
- EMGStreams

---

# 13. APIs

Implemented APIs

- Authentication
- Patient APIs
- Doctor APIs
- Caregiver APIs
- Appointment APIs
- Therapy APIs
- Voice Profile APIs
- Communication APIs

Planned APIs

- Voice Sample Upload
- AI Training
- Speech Synthesis
- BLE Device Communication
- Live EMG Stream

---

# 14. Remaining Roadmap

## Sprint 4

Firmware Integration

- BLE Communication
- Device Status
- Battery
- Signal Quality
- WebSocket Bridge

---

## Sprint 5

AI Backend

- Voice Sample Upload
- Dataset Management
- AI Training
- Voice Synthesis APIs

---

## Sprint 6

AI Integration

- Silent Speech Recognition
- Voice Cloning
- Context-Aware Responses
- Personalized Vocabulary

---

## Sprint 7

Doctor & Caregiver AI

- Therapy Analytics
- AI Recommendations
- Progress Monitoring

---

## Sprint 8

Final Integration

- Frontend
- Backend
- Firmware
- AI

System Testing

Performance Optimization

Competition Preparation

---

# 15. Competition Deliverables

The final VoiceBack system should demonstrate:

- Wearable EMG Neckband
- Silent Speech Recognition
- Voice Regeneration
- Personalized Voice Cloning
- Therapy Monitoring
- Doctor Dashboard
- Caregiver Dashboard
- Emergency SOS
- AI-powered Communication Assistance

---

# 16. Future Enhancements

- Offline AI Processing
- Cloud Synchronization
- Multi-language Voice Models
- Smart Therapy Recommendations
- Emotion Recognition
- Smartwatch Integration
- Electronic Health Record Integration
- Hospital Dashboard
- OTA Firmware Updates

---

# Development Rules

1. Never display fake medical information.
2. Use placeholders only where backend, firmware, or AI are not yet implemented.
3. Backend integration takes priority over frontend redesign.
4. Every feature must support the core VoiceBack objective.
5. Analyze existing code before implementing new features.
6. Avoid duplicate implementations.
7. Maintain the existing VoiceBack design language.
8. Complete testing before merging changes.
9. Commit every completed sprint to GitHub.
10. Update this document whenever a major milestone is completed.

---

# Core Mission

> Restore natural communication for people with aphasia by converting silent EMG signals into the patient's own regenerated voice using wearable technology and Artificial Intelligence.