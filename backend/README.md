# VoiceBack – Node.js Express Backend Foundation

> **Module Status:** Active Foundation  
> **Environment:** Node.js (v18+) / Express.js  

---

## 1. Directory Structure

```
backend/
├── package.json          # Node.js dependencies and script definitions
├── .env                  # Active environment variables configuration
├── .env.example          # Environment variables template
├── README.md             # Setup guide & documentation (this file)
│
└── src/                  # Application source code
    ├── server.js         # HTTP server entry point & shutdown handlers
    ├── app.js            # Express application setup, middleware & routes
    │
    ├── config/           # Centralized configuration & environment loader
    │   └── index.js
    │
    ├── controllers/      # Route request handlers
    │   └── healthController.js
    │
    ├── routes/           # Express router definitions
    │   └── healthRoutes.js
    │
    ├── middleware/       # Custom Express middleware
    │   ├── logger.js     # HTTP request logger
    │   └── errorHandler.js# Centralized error handler
    │
    ├── models/           # Mongoose schemas (Planned Phase 2)
    │   └── README.md
    │
    ├── services/         # Business logic & external API handlers (Planned)
    │   └── README.md
    │
    └── utils/            # Shared helper functions
        └── responseFormatter.js
```

---

## 2. Dependencies & Core Stack

### Production Dependencies:
- **`express` (`^4.18.2`)**: Fast, unopinionated Web framework for Node.js.
- **`cors` (`^2.8.5`)**: Middleware to enable Cross-Origin Resource Sharing (CORS) with the React PWA frontend.
- **`dotenv` (`^16.3.1`)**: Zero-dependency module that loads environment variables from `.env`.

### Development Dependencies:
- **`nodemon` (`^3.0.1`)**: Automatically restarts the Node application when file changes in `src/` are detected.

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Setup Steps
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Verify environment configuration:
   The `.env` file is initialized with default parameters:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_ORIGIN=*
   ```

4. Start the server in Development Mode (with hot-reload):
   ```bash
   npm run dev
   ```

5. Start the server in Production Mode:
   ```bash
   npm start
   ```

---

## 4. Active API Endpoints

### Health Check Endpoint
- **URL:** `GET http://localhost:5000/health`
- **Description:** Verifies that the Node.js Express server is active and returning operational statistics.
- **Response Format (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "VoiceBack backend service is operational",
    "data": {
      "service": "VoiceBack Backend API",
      "status": "healthy",
      "uptimeSeconds": 42,
      "environment": "development",
      "timestamp": "2026-07-31T14:03:00.000Z"
    },
    "timestamp": "2026-07-31T14:03:00.000Z"
  }
  ```

### API Root Endpoint
- **URL:** `GET http://localhost:5000/`
- **Response Format (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Welcome to VoiceBack REST API",
    "data": {
      "name": "VoiceBack Backend",
      "version": "0.1.0",
      "healthCheck": "/health",
      "documentation": "Consult docs/DATABASE.md and PROJECT_CONTEXT.md"
    },
    "timestamp": "2026-07-31T14:03:00.000Z"
  }
  ```
