export function calculateRoundScore(bid: number, tricksWon: number): number {
  const isBlind = bid < 0;
  const actualBid = Math.abs(bid);

  if (tricksWon >= actualBid) {
    const base = isBlind ? actualBid * 2 : actualBid;
    return base + 0.1 * (tricksWon - actualBid);
  }
  
  return isBlind ? -actualBid * 2 : -actualBid;
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
