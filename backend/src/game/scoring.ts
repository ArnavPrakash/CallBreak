export function calculateRoundScore(bid: number, tricksWon: number): number {
  if (tricksWon >= bid) {
    return bid + 0.1 * (tricksWon - bid);
  }
  return -bid;
}

export function findWinner(totalScores: number[], players: string[]): string {
  let maxScore = -Infinity;
  let winnerIndex = 0;
  for (let i = 0; i < 4; i++) {
    if (totalScores[i] > maxScore) {
      maxScore = totalScores[i];
      winnerIndex = i;
    }
  }
  return players[winnerIndex];
}
