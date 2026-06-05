import type { Card, GameStartedPayload, MatchOverPayload, PublicGameState, RoomUpdatePayload, PublicLobbySummary } from './types';

// Client -> Server
export interface ClientToServerEvents {
  'room:create': (data: { username: string; password?: string }) => void;
  'room:join': (data: { code: string; username: string; password?: string }) => void;
  'room:reconnect': (data: { code: string; username: string; sessionToken?: string }) => void;
  'room:returnToLobby': () => void;
  'room:leave': () => void;
  'room:setRounds': (data: { totalRounds: number }) => void;
  'game:start': (data: { totalRounds: number }) => void;
  'game:bid': (data: { bid: number }) => void;
  'game:reveal': () => void;
  'game:play': (data: { card: Card }) => void;
  'room:message': (data: { message: string }) => void;
  'room:emote': (data: { emote: string }) => void;
}

// Server -> Client
export interface ServerToClientEvents {
  'room:updated': (data: RoomUpdatePayload) => void;
  'room:session': (data: { sessionToken: string }) => void;
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
  'room:messageReceived': (data: { username: string; message: string; timestamp: number }) => void;
  'room:emoteReceived': (data: { username: string; emote: string; timestamp: number }) => void;
  'lobbies:updated': (lobbies: PublicLobbySummary[]) => void;
}
