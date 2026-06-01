import type { RoomPlayer, RoomStatus } from '@callbreak/shared';
import type { GameEngineState } from '../game/engine';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_PLAYERS = 4;

export interface Room {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  status: RoomStatus;
  game: GameEngineState | null;
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(socketId: string, username: string): Room {
  const code = generateCode();
  const room: Room = {
    code,
    hostId: socketId,
    players: [{ socketId, username }],
    status: 'lobby',
    game: null,
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, socketId: string, username: string): { room?: Room; error?: string } {
  const upperCode = code.toUpperCase();
  const room = rooms.get(upperCode);

  if (!room) return { error: 'Room not found' };
  if (room.status !== 'lobby') return { error: 'Game already in progress' };
  if (room.players.length >= MAX_PLAYERS) return { error: 'Room is full' };
  if (room.players.some((p) => p.username === username)) return { error: 'Username already taken in this room' };
  if (room.players.some((p) => p.socketId === socketId)) return { error: 'Already in room' };

  room.players.push({ socketId, username });
  return { room };
}

export function leaveRoom(socketId: string): { room?: Room; deleted?: boolean } {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex((p) => p.socketId === socketId);
    if (idx === -1) continue;

    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      rooms.delete(code);
      return { deleted: true };
    }

    if (room.hostId === socketId) {
      room.hostId = room.players[0].socketId;
    }

    if (room.status !== 'lobby') {
      room.status = 'lobby';
      room.game = null;
    }

    return { room };
  }
  return {};
}

export function getRoomBySocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socketId === socketId)) {
      return room;
    }
  }
  return undefined;
}

export function getRoomByCode(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function getSeatIndex(room: Room, socketId: string): number {
  return room.players.findIndex((p) => p.socketId === socketId);
}

export function resetRoomToLobby(room: Room): void {
  room.status = 'lobby';
  room.game = null;
}
