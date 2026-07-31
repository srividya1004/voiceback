/**
 * VoiceBack Backend Server Entry Point
 */

const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');

let server;

/**
 * Start the database connection and launch the Express server
 */
const startServer = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start Express HTTP Server
    server = app.listen(config.port, () => {
      console.log(`🚀 Server Running on Port ${config.port}`);
      console.log(`=======================================================`);
      console.log(`  VoiceBack Backend API Server Running`);
      console.log(`  Environment:  ${config.env}`);
      console.log(`  Server URL:   http://localhost:${config.port}`);
      console.log(`  Health Check: http://localhost:${config.port}/health`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown Handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
