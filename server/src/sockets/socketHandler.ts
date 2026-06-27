import { Server, Socket } from 'socket.io';

export const setupSocketHandlers = (io: Server) => {
  console.log('🔌 Socket.IO event handler configured.');

  io.on('connection', (socket: Socket) => {
    console.log(`📡 New client connected: ${socket.id}`);

    // Join room based on role or order tracking id
    socket.on('join', (room: string) => {
      socket.join(room);
      console.log(`🚪 Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
