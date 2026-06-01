import type { Card, Suit } from '@callbreak/shared';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[]): Card[][] {
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 52; i++) {
    hands[i % 4].push(deck[i]);
  }
  for (const hand of hands) {
    hand.sort((a, b) => {
      if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
      return a.rank - b.rank;
    });
  }
  return hands;
}

export function cardEquals(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function removeCard(hand: Card[], card: Card): Card[] {
  return hand.filter((c) => !cardEquals(c, card));
}
