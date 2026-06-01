export interface LobbySummary {
  code: string;
  hostUsername: string;
  playerCount: number;
  players: string[];
  totalRounds: number;
}

export async function fetchLobbies(): Promise<LobbySummary[]> {
  const { apiFetch } = await import('./client');
  const res = await apiFetch('/api/lobbies');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string }).error ?? `Failed to fetch lobbies (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}
