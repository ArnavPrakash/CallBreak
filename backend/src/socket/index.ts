import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@callbreak/shared';
import {
  broadcastRoomUpdate,
  handleBid,
  handleGameStart,
  handlePlay,
  handleReturnToLobby,
  resyncPlayer,
} from './gameHandler';
import {
  createRoom,
  getRoomBySocket,
  joinRoom,
  leaveRoom,
  markPlayerDisconnected,
  reconnectRoom,
  setRoomRounds,
} from './roomManager';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Rate limiting helpers
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(socketId: string, limit = 5, windowMs = 3000): boolean {
  const now = Date.now();
  const limitInfo = rateLimits.get(socketId);

  if (!limitInfo || now > limitInfo.resetTime) {
    rateLimits.set(socketId, { count: 1, resetTime: now + windowMs });
    return false;
  }

  limitInfo.count++;
  if (limitInfo.count > limit) {
    return true;
  }
  return false;
}

export function setupSocket(io: GameServer): void {
  io.on('connection', (socket) => {
    console.log(`[Connection] Client connected: ${socket.id}`);

    socket.on('room:create', ({ username, password }) => {
      if (typeof username !== 'string' || !username.trim() || username.length > 20) {
        socket.emit('room:error', { message: 'Username is required (max 20 characters)' });
        return;
      }
      if (password !== undefined && (typeof password !== 'string' || password.length > 100)) {
        socket.emit('room:error', { message: 'Invalid password (max 100 characters)' });
        return;
      }

      const existing = getRoomBySocket(socket.id);
      if (existing) {
        socket.emit('room:error', { message: 'Already in a room' });
        return;
      }

      const room = createRoom(socket.id, username.trim(), password);
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player && player.sessionToken) {
        socket.emit('room:session', { sessionToken: player.sessionToken });
      }

      socket.join(room.code);
      broadcastRoomUpdate(io, room);
    });

    socket.on('room:join', ({ code, username, password }) => {
      if (typeof username !== 'string' || !username.trim() || username.length > 20) {
        socket.emit('room:error', { message: 'Username is required (max 20 characters)' });
        return;
      }
      if (typeof code !== 'string' || code.trim().length !== 4) {
        socket.emit('room:error', { message: 'Room code must be exactly 4 characters' });
        return;
      }
      if (password !== undefined && (typeof password !== 'string' || password.length > 100)) {
        socket.emit('room:error', { message: 'Invalid password (max 100 characters)' });
        return;
      }

      const existing = getRoomBySocket(socket.id);
      if (existing) {
        socket.emit('room:error', { message: 'Already in a room' });
        return;
      }

      const result = joinRoom(code.trim().toUpperCase(), socket.id, username.trim(), password);
      if (result.error || !result.room) {
        socket.emit('room:error', { message: result.error || 'Failed to join' });
        return;
      }

      const player = result.room.players.find((p) => p.socketId === socket.id);
      if (player && player.sessionToken) {
        socket.emit('room:session', { sessionToken: player.sessionToken });
      }

      socket.join(result.room.code);
      broadcastRoomUpdate(io, result.room);
      if (result.room.game) {
        resyncPlayer(io, socket, result.room);
      }
    });

    socket.on('room:reconnect', ({ code, username, sessionToken }) => {
      if (typeof username !== 'string' || !username.trim() || username.length > 20) {
        socket.emit('room:error', { message: 'Invalid username' });
        return;
      }
      if (typeof code !== 'string' || code.trim().length !== 4) {
        socket.emit('room:error', { message: 'Invalid room code' });
        return;
      }
      if (sessionToken !== undefined && (typeof sessionToken !== 'string' || sessionToken.length > 100)) {
        socket.emit('room:error', { message: 'Invalid session token' });
        return;
      }

      if (getRoomBySocket(socket.id)) {
        socket.emit('room:error', { message: 'Already connected to a room' });
        return;
      }

      const result = reconnectRoom(code.trim().toUpperCase(), socket.id, username.trim(), sessionToken);
      if (result.error || !result.room) {
        socket.emit('room:error', { message: result.error || 'Failed to reconnect' });
        return;
      }

      socket.join(result.room.code);
      broadcastRoomUpdate(io, result.room);
      if (result.room.game) {
        resyncPlayer(io, socket, result.room);
      }
    });

    socket.on('room:returnToLobby', () => {
      const room = getRoomBySocket(socket.id);
      if (!room) return;
      handleReturnToLobby(io, room);
    });

    socket.on('room:leave', () => {
      const room = getRoomBySocket(socket.id);
      if (!room) return;

      socket.leave(room.code);
      const result = leaveRoom(socket.id);
      if (result.room) {
        broadcastRoomUpdate(io, result.room);
      }
    });

    socket.on('room:setRounds', ({ totalRounds }) => {
      if (typeof totalRounds !== 'number' || isNaN(totalRounds) || totalRounds < 1 || totalRounds > 20) {
        socket.emit('room:error', { message: 'Invalid rounds parameter' });
        return;
      }
      const room = getRoomBySocket(socket.id);
      if (!room) {
        socket.emit('room:error', { message: 'Not in a room' });
        return;
      }
      const err = setRoomRounds(room, socket.id, totalRounds);
      if (err) {
        socket.emit('room:error', { message: err });
        return;
      }
      broadcastRoomUpdate(io, room);
    });

    socket.on('game:start', ({ totalRounds }) => {
      if (totalRounds !== undefined && (typeof totalRounds !== 'number' || isNaN(totalRounds) || totalRounds < 1 || totalRounds > 20)) {
        socket.emit('game:error', { message: 'Invalid rounds parameter' });
        return;
      }
      const room = getRoomBySocket(socket.id);
      if (!room) {
        socket.emit('game:error', { message: 'Not in a room' });
        return;
      }
      handleGameStart(io, socket, room, totalRounds);
    });

    socket.on('game:bid', ({ bid }) => {
      if (typeof bid !== 'number' || isNaN(bid) || bid < -8 || bid > 13) {
        socket.emit('game:error', { message: 'Invalid bid' });
        return;
      }
      handleBid(io, socket, bid);
    });

    socket.on('game:play', ({ card }) => {
      if (!card || typeof card.suit !== 'string' || typeof card.rank !== 'number' || isNaN(card.rank)) {
        socket.emit('game:error', { message: 'Invalid card payload' });
        return;
      }
      void handlePlay(io, socket, card);
    });

    socket.on('room:message', ({ message }) => {
      if (typeof message !== 'string' || !message.trim() || message.length > 500) {
        return;
      }
      if (isRateLimited(socket.id, 5, 3000)) {
        socket.emit('room:error', { message: 'Too many chat messages. Please slow down.' });
        return;
      }
      const room = getRoomBySocket(socket.id);
      if (!room) return;
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;
      console.log(`[Chat] Room ${room.code} | ${player.username}: ${message}`);
      io.to(room.code).emit('room:messageReceived', {
        username: player.username,
        message: message.trim(),
        timestamp: Date.now(),
      });
    });

    socket.on('room:emote', ({ emote }) => {
      if (typeof emote !== 'string' || !emote.trim() || emote.length > 500) {
        return;
      }
      if (isRateLimited(socket.id, 8, 3000)) {
        socket.emit('room:error', { message: 'Too many reactions. Please slow down.' });
        return;
      }
      const room = getRoomBySocket(socket.id);
      if (!room) return;
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) return;
      console.log(`[Emote] Room ${room.code} | ${player.username} sent: ${emote}`);
      io.to(room.code).emit('room:emoteReceived', {
        username: player.username,
        emote: emote.trim(),
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Connection] Client disconnected: ${socket.id}`);
      rateLimits.delete(socket.id);
      const result = markPlayerDisconnected(socket.id);
      if (result.room) {
        socket.leave(result.room.code);
        broadcastRoomUpdate(io, result.room);
      }
    });
  });
}
