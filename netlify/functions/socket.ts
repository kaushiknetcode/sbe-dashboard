import { Handler } from '@netlify/functions';
import { Server } from 'socket.io';
import type { ServerOptions } from 'socket.io';

let io: Server | null = null;

const socketConfig: Partial<ServerOptions> = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['my-custom-header'],
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  allowUpgrades: true,
  cookie: false
};

const handler: Handler = async (event, context) => {
  if (!io) {
    try {
      io = new Server(socketConfig);

      io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('voting_update', (data) => {
          // Broadcast to all clients except sender
          socket.broadcast.emit('voting_update', data);
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        socket.on('disconnect', (reason) => {
          console.log('Client disconnected:', socket.id, 'Reason:', reason);
        });
      });

      // Error handling for the server
      io.engine.on('connection_error', (err) => {
        console.error('Connection error:', err);
      });

    } catch (error) {
      console.error('Failed to initialize socket server:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to initialize WebSocket server' })
      };
    }
  }

  // Handle WebSocket upgrade
  if (event.headers.upgrade?.toLowerCase() === 'websocket') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
      },
      body: JSON.stringify({ message: 'WebSocket upgrade successful' })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify({
      message: 'WebSocket server is running',
      timestamp: new Date().toISOString(),
    }),
  };
};

export { handler };