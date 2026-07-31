/**
 * VoiceBack Backend Server Entry Point
 */

const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`  VoiceBack Backend API Server Running`);
  console.log(`  Environment: ${config.env}`);
  console.log(`  Server URL:  http://localhost:${config.port}`);
  console.log(`  Health Check: http://localhost:${config.port}/health`);
  console.log(`=======================================================`);
});

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
