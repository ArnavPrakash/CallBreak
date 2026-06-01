import type { Card, Suit } from '@callbreak/shared';

const SUIT_SYMBOLS: Record<Suit, string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

const RANK_LABELS: Record<number, string> = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export function formatCard(card: Card): string {
  const rank = RANK_LABELS[card.rank] ?? String(card.rank);
  return `${rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}

export function cardKey(card: Card): string {
  return `${card.suit}-${card.rank}`;
}

const SUIT_NAMES: Record<Suit, string> = {
  S: 'spades',
  H: 'hearts',
  D: 'diamonds',
  C: 'clubs',
};

const RANK_NAMES: Record<number, string> = {
  11: 'jack',
  12: 'queen',
  13: 'king',
  14: 'ace',
};

export function getCardImagePath(card: Card): string {
  const rank = RANK_NAMES[card.rank] ?? String(card.rank);
  const suit = SUIT_NAMES[card.suit];
  
  const isFaceCard = [11, 12, 13].includes(card.rank);
  const isAceOfSpades = card.rank === 14 && card.suit === 'S';
  const suffix = (isFaceCard || isAceOfSpades) ? '2' : '';
  
  return `/cards/${rank}_of_${suit}${suffix}.png`;
}

