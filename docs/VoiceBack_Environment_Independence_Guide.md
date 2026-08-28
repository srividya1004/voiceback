# VOICEBACK — ENVIRONMENT-INDEPENDENCE & CLOUD DEPLOYMENT SPECIFICATION

**Date:** August 26, 2026  
**Status:** Environment-Independent Architecture Verified  
**Scope:** Universal Production Deployment, Environment Variable Mapping, MongoDB Atlas Cloud Access, and Cross-Platform Web Bluetooth Specification.

---

## 1. ARCHITECTURAL PRINCIPLE: ZERO LOCAL-HOST DEPENDENCY

The VoiceBack application is engineered to run from any cloud infrastructure (e.g. Render, Railway, Vercel, AWS, GCP, Heroku) or local environment without code modifications or hardcoded developer machine dependencies:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Client Device (Mobile Phone / Laptop / Tablet)                          │
│  - Runs VoiceBack React PWA                                              │
│  - Configured via VITE_API_URL environment variable                      │
│  - Web Bluetooth API connects to ESP32 GATT server over HTTPS            │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTPS REST API Requests
                                     v
┌──────────────────────────────────────────────────────────────────────────┐
│  Cloud Backend Server (Render / Railway / AWS / GCP)                     │
│  - Node.js Express REST API                                              │
│  - Configured via process.env (PORT, MONGODB_URI, JWT_SECRET, etc.)      │
│  - Location-independent server connection to MongoDB Atlas               │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ TLS 1.3 Mongoose Connection
                                     v
┌──────────────────────────────────────────────────────────────────────────┐
│  MongoDB Atlas Cloud Cluster (voicebackcluster.mpoeswq.mongodb.net)       │
│  - Managed Cloud Database persistence                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ENVIRONMENT VARIABLE CONFIGURATION MATRIX

### Backend Environment Variables (`backend/.env`)

| Variable Name | Required | Example Production Value | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5000` (or injected by PaaS) | Express HTTP server port. |
| `NODE_ENV` | Yes | `production` | Enables production optimizations & error suppression. |
| `CLIENT_ORIGIN` | Yes | `https://voiceback.app` or `*` | Configures CORS origin allowed to access REST API. |
| `MONGODB_URI` | Yes | `mongodb+srv://<user>:<password>@cluster.mongodb.net/voiceback` | MongoDB Atlas database connection string. |
| `JWT_SECRET` | Yes | `<high-entropy-random-string>` | Secret key for signing and verifying JWT session tokens. |
| `ELEVENLABS_API_KEY` | Yes | `<sk_elevenlabs_key>` | ElevenLabs API key for Instant Voice Cloning & `eleven_v3` TTS. |
| `ELEVENLABS_TTS_MODEL`| Optional| `eleven_v3` | ElevenLabs text-to-speech model version. |
| `GEMINI_API_KEY` | Yes | `<gemini_api_key>` | Google Gemini API key for dynamic context reasoning engine. |
| `GEMINI_MODEL` | Optional| `gemini-3.6-flash` | Gemini LLM model identifier. |

### Frontend PWA Environment Variables (`pwa/.env`)

| Variable Name | Required | Example Production Value | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `https://api.voiceback.app/api` | Base REST API URL of the deployed Express backend. |

---

## 3. MONGODB ATLAS PRODUCTION CLOUD ACCESS

To ensure the production backend server can connect to MongoDB Atlas regardless of which cloud host (Render, AWS, Railway, etc.) it is deployed on:

1. Log into **MongoDB Atlas Console** ([cloud.mongodb.com](https://cloud.mongodb.com)).
2. Go to **Security** $\rightarrow$ **Network Access**.
3. Add IP Entry: `0.0.0.0/0` (**Allow Access from Anywhere**).
4. Save entry. Cloud servers with dynamic IPs will successfully connect over TLS 1.3.

---

## 4. UNIVERSAL WEB BLUETOOTH SPECIFICATION

The Web Bluetooth implementation in [`pwa/src/services/deviceService.js`](file:///c:/Users/sagar/OneDrive/Desktop/voiceback/pwa/src/services/deviceService.js) strictly conforms to the W3C Web Bluetooth Standard:

- **Browser Compatibility:** Google Chrome (Android, Windows, macOS, Linux, ChromeOS), Microsoft Edge (Windows, macOS, Android), Opera, and WebBLE / Bluefy (iOS).
- **Security Prerequisite:** Must be served over **HTTPS** (or `http://localhost` for development).
- **Device Filter Matching:**
  ```javascript
  navigator.bluetooth.requestDevice({
    filters: [
      { name: 'VoiceBack-Neckband' },
      { namePrefix: 'VoiceBack' }
    ],
    optionalServices: ['4fa8c001-1278-472e-b997-63992e716a4d']
  });
  ```
- **Device Independence:** Any supported smartphone, tablet, or PC equipped with Bluetooth 4.0+ BLE hardware can pair with the ESP32 neckband.
