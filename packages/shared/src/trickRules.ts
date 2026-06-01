import type { Card, Suit, TrickPlay } from './types';

const TRUMP: Suit = 'S';

function hasSuit(hand: Card[], suit: Suit): boolean {
  return hand.some((c) => c.suit === suit);
}

function highestRankInTrick(trick: TrickPlay[], suit: Suit): number {
  const ranks = trick.filter((p) => p.card.suit === suit).map((p) => p.card.rank);
  return ranks.length > 0 ? Math.max(...ranks) : 0;
}

/** If holding suit, must beat highest of that suit in trick when possible. */
function cardsOfSuitMustBeat(hand: Card[], suit: Suit, trick: TrickPlay[]): Card[] {
  const suitCards = hand.filter((c) => c.suit === suit);
  const toBeat = highestRankInTrick(trick, suit);
  const canBeat = suitCards.filter((c) => c.rank > toBeat);
  return canBeat.length > 0 ? canBeat : suitCards;
}

export function getLegalPlays(hand: Card[], ledSuit: Suit | null, trick: TrickPlay[] = []): Card[] {
  if (!ledSuit) return [...hand];

  if (hasSuit(hand, ledSuit)) {
    return cardsOfSuitMustBeat(hand, ledSuit, trick);
  }

  if (hasSuit(hand, TRUMP)) {
    return cardsOfSuitMustBeat(hand, TRUMP, trick);
  }

  return [...hand];
}

export function cardEquals(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function isValidPlay(
  hand: Card[],
  card: Card,
  ledSuit: Suit | null,
  trick: TrickPlay[] = []
): boolean {
  if (!hand.some((c) => cardEquals(c, card))) return false;
  const legal = getLegalPlays(hand, ledSuit, trick);
  return legal.some((c) => cardEquals(c, card));
}
