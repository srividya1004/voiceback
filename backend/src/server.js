/**
 * VoiceBack Backend Server Entry Point
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const { corsOptions } = require('./config/cors');
const connectDB = require('./config/database');

let httpServer;
let io;

/**
 * Start the database connection and launch the Express + Socket.io server
 */
const startServer = async () => {
  try {
    // 1. Create HTTP Server & Attach Socket.io
    httpServer = http.createServer(app);
    io = new Server(httpServer, {
      cors: corsOptions,
    });

    // Handle Socket.io Connections
    io.on('connection', (socket) => {
      console.log(`🔌 Socket.io Client Connected: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`🔌 Socket.io Client Disconnected: ${socket.id}`);
      });
    });

    // Make io accessible across Express app routes
    app.set('io', io);

    const port = Number(process.env.PORT) || config.port || 5000;
    const host = process.env.HOST || '0.0.0.0';

    // 2. Start HTTP & Socket.io Server (bound to 0.0.0.0 for cloud hosting compatibility)
    httpServer.listen(port, host, () => {
      console.log(`🚀 Server Running on ${host}:${port}`);
      console.log(`=======================================================`);
      console.log(`  VoiceBack Backend API & Socket.io Server Running`);
      console.log(`  Environment:  ${config.env}`);
      console.log(`  Server URL:   http://${host}:${port}`);
      console.log(`  Health Check: http://${host}:${port}/health`);
      console.log(`  API Health:   http://${host}:${port}/api/health`);
      console.log(`  Socket.io:    ws://${host}:${port}/socket.io/`);
      console.log(`=======================================================`);
    });

    // 3. Connect to MongoDB Atlas asynchronously
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
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP server closed');
    });
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  if (httpServer) {
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
