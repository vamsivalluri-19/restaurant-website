import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { isMockDB, seedMockData, seedMongoDBData } from './utils/mockDbStore';
import { setupSocketHandlers } from './sockets/socketHandler';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to DB
  await connectDB();

  // Seed database
  if (isMockDB) {
    seedMockData();
  } else {
    await seedMongoDBData();
  }

  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  // Make Socket.IO globally available for controllers
  (global as any).io = io;

  setupSocketHandlers(io);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📌 Health check available at http://localhost:${PORT}/health`);
  });
};

startServer().catch(err => {
  console.error('Fatal server boot failure:', err);
});
