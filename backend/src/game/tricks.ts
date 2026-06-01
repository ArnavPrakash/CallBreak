import type { Card, Suit, TrickPlay } from '@callbreak/shared';
import { cardEquals } from './deck';

const TRUMP: Suit = 'S';

export function hasSuit(hand: Card[], suit: Suit): boolean {
  return hand.some((c) => c.suit === suit);
}

export function isValidPlay(hand: Card[], card: Card, ledSuit: Suit | null): boolean {
  if (!hand.some((c) => cardEquals(c, card))) return false;

  if (!ledSuit) return true;

  if (hasSuit(hand, ledSuit)) {
    return card.suit === ledSuit;
  }

  if (hasSuit(hand, TRUMP)) {
    return card.suit === TRUMP;
  }

  return true;
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

export function determineTrickWinner(trick: TrickPlay[]): number {
  if (trick.length === 0) throw new Error('Empty trick');

  const ledSuit = trick[0].card.suit;
  let winnerIndex = 0;
  let winnerCard = trick[0].card;

  for (let i = 1; i < trick.length; i++) {
    const { card } = trick[i];

    if (card.suit === TRUMP && winnerCard.suit !== TRUMP) {
      winnerIndex = i;
      winnerCard = card;
    } else if (card.suit === TRUMP && winnerCard.suit === TRUMP) {
      if (card.rank > winnerCard.rank) {
        winnerIndex = i;
        winnerCard = card;
      }
    } else if (card.suit === ledSuit && winnerCard.suit === ledSuit) {
      if (card.rank > winnerCard.rank) {
        winnerIndex = i;
        winnerCard = card;
      }
    }
  }

  return trick[winnerIndex].seatIndex;
}
