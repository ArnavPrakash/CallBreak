import type { Card, Suit } from '@callbreak/shared';

const TRUMP: Suit = 'S';

function hasSuit(hand: Card[], suit: Suit): boolean {
  return hand.some((c) => c.suit === suit);
}

export function getLegalPlays(hand: Card[], ledSuit: Suit | null): Card[] {
  if (!ledSuit) return [...hand];

  if (hasSuit(hand, ledSuit)) {
    return hand.filter((c) => c.suit === ledSuit);
  }

  if (hasSuit(hand, TRUMP)) {
    return hand.filter((c) => c.suit === TRUMP);
  }

  return [...hand];
}
