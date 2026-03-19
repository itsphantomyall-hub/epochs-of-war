/**
 * Server entry point.
 *
 * - HTTP server + WebSocket server on port 3200
 * - Health check at GET /health
 * - Routes messages to GameRoom instances
 * - Manages matchmaking queue
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Matchmaking } from './Matchmaking.js';
import { PlayerStore } from './PlayerStore.js';
import { GameRoom } from './GameRoom.js';
import type { ClientMessage } from './types.js';

const PORT = 3200;

// ── Stores ──
const playerStore = new PlayerStore();
const rooms: Map<string, GameRoom> = new Map();
const customRooms: Map<string, GameRoom> = new Map(); // roomCode → room
const clientRooms: Map<WebSocket, GameRoom> = new Map();
const clientIds: Map<WebSocket, string> = new Map();

// ── Matchmaking ──
const matchmaking = new Matchmaking(playerStore, (room: GameRoom) => {
  rooms.set(room.roomId, room);
  room.setOnClose((roomId) => {
    rooms.delete(roomId);
    // Clean up custom rooms
    for (const [code, r] of customRooms) {
      if (r.roomId === roomId) {
        customRooms.delete(code);
        break;
      }
    }
  });
});
matchmaking.start();

// ── HTTP Server ──
const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      rooms: rooms.size,
      queueSize: matchmaking.queueSize,
      uptime: process.uptime(),
    }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ── WebSocket Server ──
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws: WebSocket) => {
  const connectionId = uuidv4();

  ws.on('message', (rawData) => {
    let message: ClientMessage;
    try {
      message = JSON.parse(rawData.toString()) as ClientMessage;
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    handleMessage(ws, connectionId, message);
  });

  ws.on('close', () => {
    const playerId = clientIds.get(ws);
    if (playerId) {
      matchmaking.removeFromQueue(playerId);
    }
    clientRooms.delete(ws);
    clientIds.delete(ws);
  });

  ws.on('error', () => {
    clientRooms.delete(ws);
    clientIds.delete(ws);
  });
});

function handleMessage(ws: WebSocket, connectionId: string, message: ClientMessage): void {
  switch (message.type) {
    case 'joinQueue': {
      const player = playerStore.getPlayer(message.playerId, message.displayName);
      clientIds.set(ws, message.playerId);
      matchmaking.addToQueue(message.playerId, message.displayName, player.elo, ws);
      break;
    }

    case 'leaveQueue': {
      const playerId = clientIds.get(ws);
      if (playerId) {
        matchmaking.removeFromQueue(playerId);
      }
      break;
    }

    case 'customMatchCreate': {
      const player = playerStore.getPlayer(message.playerId, message.displayName);
      clientIds.set(ws, message.playerId);
      const room = new GameRoom(playerStore);
      room.setOnClose((roomId) => {
        rooms.delete(roomId);
        for (const [code, r] of customRooms) {
          if (r.roomId === roomId) {
            customRooms.delete(code);
            break;
          }
        }
      });
      room.join(message.playerId, message.displayName, ws, player.elo);
      rooms.set(room.roomId, room);
      customRooms.set(room.roomCode, room);
      clientRooms.set(ws, room);

      ws.send(JSON.stringify({
        type: 'customMatchCreated',
        roomCode: room.roomCode,
      }));
      break;
    }

    case 'customMatchJoin': {
      const room = customRooms.get(message.roomCode.toUpperCase());
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        return;
      }
      if (room.playerCount >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
        return;
      }
      const player = playerStore.getPlayer(message.playerId, message.displayName);
      clientIds.set(ws, message.playerId);
      room.join(message.playerId, message.displayName, ws, player.elo);
      clientRooms.set(ws, room);
      break;
    }

    case 'ping': {
      // If in a room, forward to room. Otherwise respond directly.
      const room = clientRooms.get(ws);
      const playerId = clientIds.get(ws);
      if (room && playerId) {
        room.handleMessage(playerId, message);
      } else {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: message.timestamp,
          serverTime: Date.now(),
        }));
      }
      break;
    }

    case 'spawn':
    case 'evolve':
    case 'special':
    case 'heroAbility':
    case 'rematch': {
      // Game commands — forward to the player's room
      const room = clientRooms.get(ws);
      const playerId = clientIds.get(ws);
      if (room && playerId) {
        room.handleMessage(playerId, message);
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Not in a game room' }));
      }
      break;
    }

    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

// Also track rooms for clients when match is found
wss.on('connection', (ws: WebSocket) => {
  // The original handler above already sets up the ws listeners.
  // We just need to track room assignments when matchmaking creates rooms.
  // This is handled by the join() flow in GameRoom which stores the ws reference.
});

// ── Start ──
httpServer.listen(PORT, () => {
  console.log(`Epochs of War server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
