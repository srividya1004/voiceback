/**
 * VoiceBack Backend Server Entry Point
 */

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
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
      cors: {
        origin: config.clientOrigin || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
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

    // 2. Start HTTP & Socket.io Server
    httpServer.listen(config.port, () => {
      console.log(`🚀 Server Running on Port ${config.port}`);
      console.log(`=======================================================`);
      console.log(`  VoiceBack Backend API & Socket.io Server Running`);
      console.log(`  Environment:  ${config.env}`);
      console.log(`  Server URL:   http://localhost:${config.port}`);
      console.log(`  Health Check: http://localhost:${config.port}/health`);
      console.log(`  Socket.io:    ws://localhost:${config.port}/socket.io/`);
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
