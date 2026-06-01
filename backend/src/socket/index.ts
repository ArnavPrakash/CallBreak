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

export function setupSocket(io: GameServer): void {
  io.on('connection', (socket) => {
    socket.on('room:create', ({ username }) => {
      if (!username?.trim()) {
        socket.emit('room:error', { message: 'Username is required' });
        return;
      }

      const existing = getRoomBySocket(socket.id);
      if (existing) {
        socket.emit('room:error', { message: 'Already in a room' });
        return;
      }

      const room = createRoom(socket.id, username.trim());
      socket.join(room.code);
      broadcastRoomUpdate(io, room);
    });

    socket.on('room:join', ({ code, username }) => {
      if (!username?.trim() || !code?.trim()) {
        socket.emit('room:error', { message: 'Username and room code are required' });
        return;
      }

      const existing = getRoomBySocket(socket.id);
      if (existing) {
        socket.emit('room:error', { message: 'Already in a room' });
        return;
      }

      const result = joinRoom(code.trim(), socket.id, username.trim());
      if (result.error || !result.room) {
        socket.emit('room:error', { message: result.error || 'Failed to join' });
        return;
      }

      socket.join(result.room.code);
      broadcastRoomUpdate(io, result.room);
      if (result.room.game) {
        resyncPlayer(io, socket, result.room);
      }
    });

    socket.on('room:reconnect', ({ code, username }) => {
      if (!username?.trim() || !code?.trim()) {
        socket.emit('room:error', { message: 'Username and room code are required' });
        return;
      }

      if (getRoomBySocket(socket.id)) {
        socket.emit('room:error', { message: 'Already connected to a room' });
        return;
      }

      const result = reconnectRoom(code.trim(), socket.id, username.trim());
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
      const room = getRoomBySocket(socket.id);
      if (!room) {
        socket.emit('game:error', { message: 'Not in a room' });
        return;
      }
      handleGameStart(io, socket, room, totalRounds);
    });

    socket.on('game:bid', ({ bid }) => {
      handleBid(io, socket, bid);
    });

    socket.on('game:play', ({ card }) => {
      void handlePlay(io, socket, card);
    });

    socket.on('disconnect', () => {
      const result = markPlayerDisconnected(socket.id);
      if (result.room) {
        socket.leave(result.room.code);
        broadcastRoomUpdate(io, result.room);
      }
    });
  });
}
