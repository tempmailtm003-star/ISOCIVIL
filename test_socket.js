import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Become a dispatcher to see what is broadcast
  socket.emit('dispatcher:login');
  
  socket.on('dispatcher:receive_message', (data) => {
     console.log('[Dispatcher] Received:', data);
  });
  
  // Simulate mobile app sending a direct message
  setTimeout(() => {
     console.log('Mobile App sending direct message...');
     socket.emit('responder:send_message', {
        sender: 'FE-12',
        message: 'Hello from FE-12 direct',
        incidentId: 'direct-FE-12'
     });
  }, 1000);
  
  setTimeout(() => {
     process.exit(0);
  }, 3000);
});
