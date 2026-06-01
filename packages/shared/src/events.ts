import type { Card, GameStartedPayload, MatchOverPayload, PublicGameState, RoomUpdatePayload } from './types';

// Client -> Server
export interface ClientToServerEvents {
  'room:create': (data: { username: string }) => void;
  'room:join': (data: { code: string; username: string }) => void;
  'room:reconnect': (data: { code: string; username: string }) => void;
  'room:returnToLobby': () => void;
  'room:leave': () => void;
  'room:setRounds': (data: { totalRounds: number }) => void;
  'game:start': (data: { totalRounds: number }) => void;
  'game:bid': (data: { bid: number }) => void;
  'game:play': (data: { card: Card }) => void;
}

// Server -> Client
export interface ServerToClientEvents {
  'room:updated': (data: RoomUpdatePayload) => void;
  'room:error': (data: { message: string }) => void;
  'game:started': (data: GameStartedPayload) => void;
  'game:state': (data: PublicGameState) => void;
  'game:hand': (data: { hand: Card[] }) => void;
  'game:bidRequest': (data: { seatIndex: number }) => void;
  'game:bidPlaced': (data: { seatIndex: number; bid: number }) => void;
  'game:playRequest': (data: { seatIndex: number }) => void;
  'game:cardPlayed': (data: { seatIndex: number; card: Card }) => void;
  'game:trickWon': (data: { winnerSeat: number; trick: { seatIndex: number; card: Card }[] }) => void;
  'game:roundScores': (data: { roundNumber: number; bids: number[]; scores: number[]; tricksWon: number[] }) => void;
  'game:matchOver': (data: MatchOverPayload) => void;
  'game:resync': (data: GameStartedPayload) => void;
  'game:error': (data: { message: string }) => void;
}
