import type { Card, PublicGameState, RoundData, Suit, TrickPlay } from '@callbreak/shared';
import { cardEquals, createDeck, dealCards, removeCard, shuffleDeck } from './deck';
import { calculateRoundScore, findWinner } from './scoring';
import { determineTrickWinner, getLegalPlays, isValidPlay } from './tricks';

const TRICKS_PER_ROUND = 13;
const DEFAULT_TOTAL_ROUNDS = 5;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 20;

export interface GameEngineState {
  phase: 'bidding' | 'playing' | 'roundEnd' | 'matchEnd';
  roundNumber: number;
  totalRounds: number;
  dealerIndex: number;
  hands: Card[][];
  bids: (number | null)[];
  tricksWon: number[];
  currentTrick: TrickPlay[];
  trickLeader: number;
  currentTurn: number;
  biddingIndex: number;
  roundScores: number[][];
  totalScores: number[];
  completedRounds: RoundData[];
  players: string[];
}

export function normalizeTotalRounds(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_TOTAL_ROUNDS;
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.round(n)));
}

export function createGameEngine(
  players: string[],
  totalRounds = DEFAULT_TOTAL_ROUNDS,
  dealerIndex = 0
): GameEngineState {
  const deck = shuffleDeck(createDeck());
  const hands = dealCards(deck);

  return {
    phase: 'bidding',
    roundNumber: 1,
    totalRounds: normalizeTotalRounds(totalRounds),
    dealerIndex,
    hands,
    bids: [null, null, null, null],
    tricksWon: [0, 0, 0, 0],
    currentTrick: [],
    trickLeader: (dealerIndex + 1) % 4,
    currentTurn: (dealerIndex + 1) % 4,
    biddingIndex: (dealerIndex + 1) % 4,
    roundScores: [],
    totalScores: [0, 0, 0, 0],
    completedRounds: [],
    players,
  };
}

export function submitBid(state: GameEngineState, seatIndex: number, bid: number): boolean {
  if (state.phase !== 'bidding') return false;
  if (state.biddingIndex !== seatIndex) return false;
  if (bid < 1 || bid > 13) return false;

  state.bids[seatIndex] = bid;
  state.biddingIndex = (state.biddingIndex + 1) % 4;

  if (state.bids.every((b) => b !== null)) {
    state.phase = 'playing';
    state.currentTurn = state.trickLeader;
  }

  return true;
}

export interface PlayResult {
  ok: boolean;
  trickComplete?: boolean;
  completedTrick?: TrickPlay[];
  winnerSeat?: number;
}

export function playCard(state: GameEngineState, seatIndex: number, card: Card): PlayResult {
  if (state.phase !== 'playing') return { ok: false };
  if (state.currentTurn !== seatIndex) return { ok: false };

  const hand = state.hands[seatIndex];
  const ledSuit: Suit | null = state.currentTrick.length > 0 ? state.currentTrick[0].card.suit : null;

  if (!isValidPlay(hand, card, ledSuit, state.currentTrick)) return { ok: false };

  state.hands[seatIndex] = removeCard(hand, card);
  state.currentTrick.push({ seatIndex, card });

  if (state.currentTrick.length < 4) {
    state.currentTurn = (state.currentTurn + 1) % 4;
    return { ok: true };
  }

  const completedTrick = [...state.currentTrick];
  const winnerSeat = determineTrickWinner(completedTrick);
  state.tricksWon[winnerSeat]++;
  state.currentTrick = [];
  state.trickLeader = winnerSeat;
  state.currentTurn = winnerSeat;

  const totalTricks = state.tricksWon.reduce((a, b) => a + b, 0);
  if (totalTricks >= TRICKS_PER_ROUND) {
    endRound(state);
  }

  return { ok: true, trickComplete: true, completedTrick, winnerSeat };
}

function endRound(state: GameEngineState): void {
  const bids = state.bids as number[];
  const scores = bids.map((bid, i) => calculateRoundScore(bid, state.tricksWon[i]));

  state.roundScores.push(scores);
  for (let i = 0; i < 4; i++) {
    state.totalScores[i] += scores[i];
  }

  state.completedRounds.push({
    roundNumber: state.roundNumber,
    bids: bids as [number, number, number, number],
    scores: scores as [number, number, number, number],
  });

  if (state.roundNumber >= state.totalRounds) {
    state.phase = 'matchEnd';
    return;
  }

  state.phase = 'roundEnd';
}

export function startNextRound(state: GameEngineState): void {
  if (state.phase !== 'roundEnd') return;

  state.roundNumber++;
  state.dealerIndex = (state.dealerIndex + 1) % 4;

  const deck = shuffleDeck(createDeck());
  state.hands = dealCards(deck);
  state.bids = [null, null, null, null];
  state.tricksWon = [0, 0, 0, 0];
  state.currentTrick = [];
  state.trickLeader = (state.dealerIndex + 1) % 4;
  state.currentTurn = (state.dealerIndex + 1) % 4;
  state.biddingIndex = (state.dealerIndex + 1) % 4;
  state.phase = 'bidding';
}

export function getMatchWinner(state: GameEngineState): string {
  return findWinner(state.totalScores, state.players);
}

export function toPublicState(state: GameEngineState): PublicGameState {
  const currentTurn =
    state.phase === 'bidding' ? state.biddingIndex : state.currentTurn;

  return {
    phase: state.phase,
    roundNumber: state.roundNumber,
    totalRounds: state.totalRounds,
    dealerIndex: state.dealerIndex,
    currentTurn,
    bids: [...state.bids],
    tricksWon: [...state.tricksWon],
    currentTrick: [...state.currentTrick],
    trickLeader: state.trickLeader,
    roundScores: state.roundScores.map((r) => [...r]),
    totalScores: [...state.totalScores],
    completedRounds: [...state.completedRounds],
    players: [...state.players],
  };
}

export function getLegalCardsForPlayer(state: GameEngineState, seatIndex: number): Card[] {
  const hand = state.hands[seatIndex];
  const ledSuit: Suit | null = state.currentTrick.length > 0 ? state.currentTrick[0].card.suit : null;
  return getLegalPlays(hand, ledSuit, state.currentTrick);
}

export { cardEquals };
