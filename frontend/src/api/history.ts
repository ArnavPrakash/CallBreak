export interface MatchSummary {
  id: string;
  players: string[];
  winner: string;
  createdAt: string;
  playerScore: number;
  won: boolean;
}

export interface HistoryResponse {
  matches: MatchSummary[];
  stats: {
    wins: number;
    losses: number;
    totalGames: number;
    avgScore: number;
  };
}

export async function fetchHistory(player: string): Promise<HistoryResponse> {
  const res = await fetch(`/api/history?player=${encodeURIComponent(player)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch history');
  }
  return res.json();
}
