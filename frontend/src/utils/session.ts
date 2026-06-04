const SESSION_KEY = 'callbreak_session';

export interface GameSession {
  code: string;
  username: string;
  sessionToken?: string;
}

export function saveSession(code: string, username: string, sessionToken?: string): void {
  const raw = sessionStorage.getItem(SESSION_KEY);
  let existingToken = sessionToken;
  if (!existingToken && raw) {
    try {
      existingToken = JSON.parse(raw).sessionToken;
    } catch {
      /* ignore */
    }
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ code, username, sessionToken: existingToken }));
}

export function loadSession(): GameSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameSession;
    if (parsed.code?.length === 4 && parsed.username?.trim()) {
      return {
        code: parsed.code.toUpperCase(),
        username: parsed.username.trim(),
        sessionToken: parsed.sessionToken,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
