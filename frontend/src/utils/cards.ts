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
