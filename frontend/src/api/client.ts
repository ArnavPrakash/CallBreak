/** Relative URL works with Vite dev proxy and production same-origin. */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL ?? '';
  return `${base}${path}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
