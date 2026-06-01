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
  const { apiFetch } = await import('./client');
  const res = await apiFetch(`/api/history?player=${encodeURIComponent(player)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string }).error ?? `Failed to fetch history (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}
