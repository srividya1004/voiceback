/**
 * VoiceBack CORS Configuration
 * Securely resolves allowed origins for Express REST API and Socket.io.
 */

const config = require('./index');

const isOriginAllowed = (origin, callback) => {
  const configuredOrigin = config.clientOrigin || process.env.CLIENT_ORIGIN || '*';

  // Allow requests with no origin (such as mobile apps, curl, server-to-server)
  if (!origin) {
    return callback(null, true);
  }

  // If wildcard configured or not set, reflect requesting origin to safely support credentials
  if (configuredOrigin === '*' || !configuredOrigin) {
    return callback(null, true);
  }

  // Normalize allowed origins (split by comma, trim, strip trailing slashes)
  const allowedList = configuredOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const normalizedOrigin = origin.replace(/\/+$/, '');

  if (allowedList.includes(normalizedOrigin) || allowedList.includes('*')) {
    return callback(null, true);
  }

  console.warn(`⚠️ [CORS Blocked] Origin "${origin}" is not authorized. Allowed: ${allowedList.join(', ')}`);
  return callback(new Error(`CORS error: Origin ${origin} not allowed by Access-Control-Allow-Origin`));
};

const corsOptions = {
  origin: isOriginAllowed,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['X-TTS-Provider', 'X-Cloned-Voice-Used', 'X-Voice-Id']
};

module.exports = {
  corsOptions,
  isOriginAllowed
};
