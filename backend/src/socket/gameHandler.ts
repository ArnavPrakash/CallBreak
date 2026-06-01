import type { Server, Socket } from 'socket.io';
import type { Card, ClientToServerEvents, ServerToClientEvents } from '@callbreak/shared';
import {
  createGameEngine,
  getMatchWinner,
  normalizeTotalRounds,
  playCard,
  resolveTrick,
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
  setRoomMatchEnd,
  type Room,
} from './roomManager';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function broadcastRoomUpdate(io: Server, room: Room): void {
  io.to(room.code).emit('room:updated', {
    code: room.code,
    players: room.players.map((p) => ({
      socketId: p.socketId,
      username: p.username,
      connected: p.connected,
    })),
    hostId: room.hostId,
    status: room.status,
    totalRounds: room.totalRounds,
  });
}

export function resyncPlayer(io: Server, socket: GameSocket, room: Room): void {
  if (!room.game) return;

  const game = room.game;
  const seatIndex = getSeatIndex(room, socket.id);
  if (seatIndex < 0) return;

  const payload = {
    seatIndex,
    hand: game.hands[seatIndex],
    dealerIndex: game.dealerIndex,
    firstBidder: game.biddingIndex,
    players: game.players,
    roundNumber: game.roundNumber,
    totalRounds: game.totalRounds,
  };

  socket.emit('game:resync', payload);
  socket.emit('game:hand', { hand: game.hands[seatIndex] });
  socket.emit('game:state', toPublicState(game));

  if (game.phase === 'bidding' && game.bids[seatIndex] === null && game.biddingIndex === seatIndex) {
    socket.emit('game:bidRequest', { seatIndex });
  } else if (game.phase === 'playing' && game.currentTurn === seatIndex) {
    socket.emit('game:playRequest', { seatIndex });
  }
}

function emitGameState(io: Server, room: Room): void {
  if (!room.game) return;
  io.to(room.code).emit('game:state', toPublicState(room.game));
}

function sendPrivateHands(io: Server, room: Room): void {
  if (!room.game) return;
  for (const player of room.players) {
    if (!player.connected) continue;
    const seatIndex = getSeatIndex(room, player.socketId);
    if (seatIndex < 0) continue;
    io.to(player.socketId).emit('game:hand', {
      hand: room.game.hands[seatIndex],
    });
  }
}

export function handleGameStart(
  io: Server,
  socket: GameSocket,
  room: Room,
  totalRounds?: number
): void {
  if (socket.id !== room.hostId) {
    socket.emit('game:error', { message: 'Only the host can start the game' });
    return;
  }

  if (room.players.length !== 4) {
    socket.emit('game:error', { message: 'Need exactly 4 players to start' });
    return;
  }

  if (totalRounds !== undefined) {
    room.totalRounds = normalizeTotalRounds(totalRounds);
  }

  const playerNames = room.players.map((p) => p.username);
  const game = createGameEngine(playerNames, room.totalRounds);
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
      totalRounds: game.totalRounds,
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

  if (result.trickComplete) {
    // Broadcast state containing all 4 played cards immediately
    emitGameState(io, room);

    // Delay the resolution of the trick by 2 seconds so everyone can see the 4th card
    setTimeout(async () => {
      // Ensure the game still exists and is in the correct paused state before resolving
      if (!room.game || room.game.phase !== 'playing' || room.game.currentTurn !== -1) return;

      const resolveResult = resolveTrick(room.game);
      if (resolveResult.ok && resolveResult.winnerSeat !== undefined && resolveResult.completedTrick) {
        io.to(room.code).emit('game:trickWon', {
          winnerSeat: resolveResult.winnerSeat,
          trick: resolveResult.completedTrick,
        });

        const currentPhase = room.game.phase as string;
        if (currentPhase === 'roundEnd') {
          await handleRoundEnd(io, room);
        } else if (currentPhase === 'matchEnd') {
          await handleMatchEnd(io, room);
        } else if (currentPhase === 'playing') {
          io.to(room.code).emit('game:playRequest', { seatIndex: room.game.currentTurn });
          sendPrivateHands(io, room);
          emitGameState(io, room);
        }
      }
    }, 2000);
  } else {
    // Normal play with fewer than 4 cards in the trick
    if (room.game.phase === 'playing') {
      io.to(room.code).emit('game:playRequest', { seatIndex: room.game.currentTurn });
      sendPrivateHands(io, room);
    }
    emitGameState(io, room);
  }
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
      totalRounds: game.totalRounds,
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

  setRoomMatchEnd(room);
  broadcastRoomUpdate(io, room);
}

export function handleReturnToLobby(io: Server, room: Room): void {
  resetRoomToLobby(room);
  broadcastRoomUpdate(io, room);
}
