import type { TrickPlay } from '@callbreak/shared';
import { getLegalPlays, isValidPlay } from '@callbreak/shared';

export { getLegalPlays, isValidPlay };

export function determineTrickWinner(trick: TrickPlay[]): number {
  if (trick.length === 0) throw new Error('Empty trick');

  const TRUMP = 'S' as const;
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
