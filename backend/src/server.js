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
    // 1. Start Express HTTP Server immediately
    server = app.listen(config.port, () => {
      console.log(`🚀 Server Running on Port ${config.port}`);
      console.log(`=======================================================`);
      console.log(`  VoiceBack Backend API Server Running`);
      console.log(`  Environment:  ${config.env}`);
      console.log(`  Server URL:   http://localhost:${config.port}`);
      console.log(`  Health Check: http://localhost:${config.port}/health`);
      console.log(`=======================================================`);
    });

    // 2. Connect to MongoDB Atlas asynchronously
    connectDB().catch((dbErr) => {
      console.warn('⚠️ MongoDB Connection Warning (API server operating in fallback mode):', dbErr.message);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
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
