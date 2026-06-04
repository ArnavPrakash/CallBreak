export type Suit = 'S' | 'H' | 'D' | 'C';

export interface Card {
  suit: Suit;
  rank: number; // 2-14 (Ace = 14)
}

export interface RoundData {
  roundNumber: number;
  bids: [number, number, number, number];
  scores: [number, number, number, number];
}

export interface PlayerInfo {
  socketId: string;
  username: string;
  seatIndex: number;
}

export type RoomStatus = 'lobby' | 'bidding' | 'playing' | 'roundEnd' | 'matchEnd';

export interface RoomPlayer {
  socketId: string;
  username: string;
  connected: boolean;
  sessionToken?: string;
}

export interface RoomUpdatePayload {
  code: string;
  players: RoomPlayer[];
  hostId: string;
  status: RoomStatus;
  totalRounds: number;
}

export interface TrickPlay {
  seatIndex: number;
  card: Card;
}

export interface PublicGameState {
  phase: 'bidding' | 'playing' | 'roundEnd' | 'matchEnd';
  roundNumber: number;
  totalRounds: number;
  dealerIndex: number;
  currentTurn: number;
  bids: (number | null)[];
  tricksWon: number[];
  currentTrick: TrickPlay[];
  trickLeader: number;
  roundScores: number[][];
  totalScores: number[];
  completedRounds: RoundData[];
  players: string[];
}

export interface GameStartedPayload {
  seatIndex: number;
  hand: Card[];
  dealerIndex: number;
  firstBidder: number;
  players: string[];
  roundNumber: number;
  totalRounds: number;
}

export interface MatchOverPayload {
  winner: string;
  rounds: RoundData[];
  totals: number[];
  players: string[];
}
