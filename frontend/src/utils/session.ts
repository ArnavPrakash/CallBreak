const SESSION_KEY = 'callbreak_session';

export interface GameSession {
  code: string;
  username: string;
}

export function saveSession(code: string, username: string): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ code, username }));
}

export function loadSession(): GameSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameSession;
    if (parsed.code?.length === 4 && parsed.username?.trim()) {
      return { code: parsed.code.toUpperCase(), username: parsed.username.trim() };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
