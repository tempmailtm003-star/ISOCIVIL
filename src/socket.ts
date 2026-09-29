import { io } from 'socket.io-client';

// Use same host, socket.io will default to the current host and port
export const socket = io({
  autoConnect: false,
  transports: ['websocket']
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
