/**
 * VoiceBack Express Application Setup
 */

const express = require('express');
const cors = require('cors');
const config = require('./config');
const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const apiRoutes = require('./routes');
const { sendSuccess, sendError } = require('./utils/responseFormatter');

const app = express();

// Middleware: Enable CORS with configurable origin
app.use(cors({
  origin: config.clientOrigin,
  credentials: true
}));

// Middleware: Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware: Log HTTP requests
app.use(requestLogger);

// Root Route
app.get('/', (req, res) => {
  return sendSuccess(res, 200, 'Welcome to VoiceBack REST API', {
    name: 'VoiceBack Backend',
    version: '0.1.0',
    healthCheck: '/health',
    apiRoot: '/api',
    documentation: 'Consult docs/DATABASE.md and PROJECT_CONTEXT.md'
  });
});

// Route Registration
app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  return sendError(res, 404, `Route ${req.originalUrl} not found`);
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
