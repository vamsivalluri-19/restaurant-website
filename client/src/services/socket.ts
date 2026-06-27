import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initiateSocketConnection = (): Socket => {
  if (!socket) {
    console.log('🔌 Connecting to socket.io server...');
    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
      : window.location.origin;
    socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToEvent = (event: string, callback: (data: any) => void) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const unsubscribeFromEvent = (event: string) => {
  if (socket) {
    socket.off(event);
  }
};

export const emitEvent = (event: string, data: any) => {
  if (socket) {
    socket.emit(event, data);
  }
};
