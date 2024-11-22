import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD 
  ? window.location.origin
  : 'http://localhost:5001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
  path: '/socket.io/'
});

const messageQueue: any[] = [];
let isConnected = false;

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  isConnected = true;

  // Process queued messages
  while (messageQueue.length > 0) {
    const data = messageQueue.shift();
    socket.emit('voting_update', data);
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
  isConnected = false;
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error.message);
  if (!isConnected) {
    setTimeout(() => {
      socket.connect();
    }, 1000);
  }
});

export const emitVotingUpdate = (data: any) => {
  if (isConnected) {
    socket.emit('voting_update', data);
  } else {
    console.warn('Socket not connected, queuing message');
    messageQueue.push(data);
  }
};

export const subscribeToVotingUpdates = (callback: (data: any) => void) => {
  socket.on('voting_update', callback);
  return () => {
    socket.off('voting_update', callback);
  };
};