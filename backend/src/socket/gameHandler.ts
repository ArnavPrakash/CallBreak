import type { Server, Socket } from 'socket.io';
import type { Card, ClientToServerEvents, ServerToClientEvents } from '@callbreak/shared';
import {
  createGameEngine,
  getMatchWinner,
  playCard,
  startNextRound,
  submitBid,
  toPublicState,
  type GameEngineState,
} from '../game/engine';
import { saveMatch } from '../services/matchPersistence';
import {
  getRoomBySocket,
  getSeatIndex,
  resetRoomToLobby,
  type Room,
} from './roomManager';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function broadcastRoomUpdate(io: Server, room: Room): void {
  io.to(room.code).emit('room:updated', {
    code: room.code,
    players: room.players.map((p) => ({ socketId: p.socketId, username: p.username })),
    hostId: room.hostId,
    status: room.status,
  });
}

function emitGameState(io: Server, room: Room): void {
  if (!room.game) return;
  io.to(room.code).emit('game:state', toPublicState(room.game));
}

function sendPrivateHands(io: Server, room: Room): void {
  if (!room.game) return;
  for (const player of room.players) {
    const seatIndex = getSeatIndex(room, player.socketId);
    io.to(player.socketId).emit('game:hand', {
      hand: room.game.hands[seatIndex],
    });
  }
}

export function handleGameStart(io: Server, socket: GameSocket, room: Room): void {
  if (socket.id !== room.hostId) {
    socket.emit('game:error', { message: 'Only the host can start the game' });
    return;
  }

  const playerNames = room.players.map((p) => p.username);
  const game = createGameEngine(playerNames);
  room.game = game;
  room.status = 'bidding';

  for (const player of room.players) {
    const seatIndex = getSeatIndex(room, player.socketId);
    io.to(player.socketId).emit('game:started', {
      seatIndex,
      hand: game.hands[seatIndex],
      dealerIndex: game.dealerIndex,
      firstBidder: game.biddingIndex,
      players: playerNames,
      roundNumber: game.roundNumber,
    });
  }

  io.to(room.code).emit('game:bidRequest', { seatIndex: game.biddingIndex });
  emitGameState(io, room);
  broadcastRoomUpdate(io, room);
}

export function handleBid(io: Server, socket: GameSocket, bid: number): void {
  const room = getRoomBySocket(socket.id);
  if (!room?.game) {
    socket.emit('game:error', { message: 'No active game' });
    return;
  }

  const seatIndex = getSeatIndex(room, socket.id);
  if (!submitBid(room.game, seatIndex, bid)) {
    socket.emit('game:error', { message: 'Invalid bid' });
    return;
  }

  emitGameState(io, room);

  io.to(room.code).emit('game:bidPlaced', { seatIndex, bid });

  if (room.game.phase === 'playing') {
    io.to(room.code).emit('game:playRequest', { seatIndex: room.game.currentTurn });
  } else if (room.game.phase === 'bidding') {
    io.to(room.code).emit('game:bidRequest', { seatIndex: room.game.biddingIndex });
  }
}

export async function handlePlay(io: Server, socket: GameSocket, card: Card): Promise<void> {
  const room = getRoomBySocket(socket.id);
  if (!room?.game) {
    socket.emit('game:error', { message: 'No active game' });
    return;
  }

  const seatIndex = getSeatIndex(room, socket.id);
  const result = playCard(room.game, seatIndex, card);

  if (!result.ok) {
    socket.emit('game:error', { message: 'Invalid card play' });
    return;
  }

  io.to(room.code).emit('game:cardPlayed', { seatIndex, card });

  if (result.trickComplete && result.completedTrick && result.winnerSeat !== undefined) {
    io.to(room.code).emit('game:trickWon', {
      winnerSeat: result.winnerSeat,
      trick: result.completedTrick,
    });
  }

  if (room.game.phase === 'roundEnd') {
    await handleRoundEnd(io, room);
  } else if (room.game.phase === 'matchEnd') {
    await handleMatchEnd(io, room);
  } else if (room.game.phase === 'playing') {
    io.to(room.code).emit('game:playRequest', { seatIndex: room.game.currentTurn });
    sendPrivateHands(io, room);
  }

  emitGameState(io, room);
}

async function handleRoundEnd(io: Server, room: Room): Promise<void> {
  const game = room.game!;
  const lastRound = game.completedRounds[game.completedRounds.length - 1];

  io.to(room.code).emit('game:roundScores', {
    roundNumber: lastRound.roundNumber,
    bids: [...lastRound.bids],
    scores: [...lastRound.scores],
    tricksWon: [...game.tricksWon],
  });

  startNextRound(game);
  room.status = 'bidding';

  sendPrivateHands(io, room);

  for (const player of room.players) {
    const seatIndex = getSeatIndex(room, player.socketId);
    io.to(player.socketId).emit('game:started', {
      seatIndex,
      hand: game.hands[seatIndex],
      dealerIndex: game.dealerIndex,
      firstBidder: game.biddingIndex,
      players: game.players,
      roundNumber: game.roundNumber,
    });
  }

  io.to(room.code).emit('game:bidRequest', { seatIndex: game.biddingIndex });
  emitGameState(io, room);
}

async function handleMatchEnd(io: Server, room: Room): Promise<void> {
  const game = room.game!;
  const winner = getMatchWinner(game);

  const lastRound = game.completedRounds[game.completedRounds.length - 1];
  io.to(room.code).emit('game:roundScores', {
    roundNumber: lastRound.roundNumber,
    bids: [...lastRound.bids],
    scores: [...lastRound.scores],
    tricksWon: [...game.tricksWon],
  });

  try {
    await saveMatch(game.players, game.completedRounds, winner);
  } catch (err) {
    console.error('Failed to save match:', err);
  }

  io.to(room.code).emit('game:matchOver', {
    winner,
    rounds: game.completedRounds,
    totals: [...game.totalScores],
    players: game.players,
  });

  resetRoomToLobby(room);
  broadcastRoomUpdate(io, room);
}
