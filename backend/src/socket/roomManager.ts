import type { RoomPlayer, RoomStatus } from '@callbreak/shared';
import { normalizeTotalRounds, type GameEngineState } from '../game/engine';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_PLAYERS = 4;

export interface Room {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  status: RoomStatus;
  totalRounds: number;
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

function makePlayer(socketId: string, username: string): RoomPlayer {
  return { socketId, username, connected: true };
}

export function createRoom(socketId: string, username: string): Room {
  const code = generateCode();
  const room: Room = {
    code,
    hostId: socketId,
    players: [makePlayer(socketId, username)],
    status: 'lobby',
    totalRounds: 5,
    game: null,
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(
  code: string,
  socketId: string,
  username: string
): { room?: Room; error?: string } {
  const upperCode = code.toUpperCase();
  const room = rooms.get(upperCode);

  if (!room) return { error: 'Room not found' };

  const disconnected = room.players.find((p) => p.username === username && !p.connected);
  if (disconnected) {
    disconnected.socketId = socketId;
    disconnected.connected = true;
    return { room };
  }

  if (room.status !== 'lobby') {
    return { error: 'Game in progress — use the same username to rejoin' };
  }
  if (room.players.length >= MAX_PLAYERS) return { error: 'Room is full' };
  if (room.players.some((p) => p.username === username)) {
    return { error: 'Username already taken in this room' };
  }
  if (room.players.some((p) => p.socketId === socketId)) {
    return { error: 'Already in room' };
  }

  room.players.push(makePlayer(socketId, username));
  return { room };
}

export function reconnectRoom(
  code: string,
  socketId: string,
  username: string
): { room?: Room; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: 'Room not found' };

  const player = room.players.find((p) => p.username === username);
  if (!player) {
    return { error: 'No seat found for this username in that room' };
  }

  player.socketId = socketId;
  player.connected = true;
  return { room };
}

export function markPlayerDisconnected(socketId: string): { room?: Room } {
  for (const room of rooms.values()) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) continue;

    player.connected = false;

    if (room.status === 'lobby' || room.players.filter((p) => p.connected).length === 0) {
      return leaveRoom(socketId);
    }

    return { room };
  }
  return {};
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

    const connected = room.players.filter((p) => p.connected);
    if (room.hostId === socketId && connected.length > 0) {
      room.hostId = connected[0].socketId;
    }

    if (room.status === 'lobby' || room.status === 'matchEnd') {
      if (connected.length === 0) {
        rooms.delete(code);
        return { deleted: true };
      }
    }

    return { room };
  }
  return {};
}

export function getRoomBySocket(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some((p) => p.socketId === socketId && p.connected)) {
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

export function setRoomRounds(room: Room, hostSocketId: string, totalRounds: number): string | null {
  if (room.hostId !== hostSocketId) return 'Only the host can change rounds';
  if (room.status !== 'lobby') return 'Cannot change rounds after the game has started';
  room.totalRounds = normalizeTotalRounds(totalRounds);
  return null;
}

export function setRoomMatchEnd(room: Room): void {
  room.status = 'matchEnd';
}

export function resetRoomToLobby(room: Room): void {
  room.status = 'lobby';
  room.game = null;
}
