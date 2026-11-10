import { useEffect, useState } from 'react';
import { api } from './api';

// Game artwork comes from Steam. The backend resolves a game NAME to a Steam app id (any game in
// Steam's catalogue, no hard-coded list); the image URL is then built from that id.
const lookups = new Map<string, Promise<number | null>>();

export function resolveSteamApp(name: string): Promise<number | null> {
  const key = name.trim().toLowerCase();
  if (!key) return Promise.resolve(null);
  let p = lookups.get(key);
  if (!p) {
    p = api<{ app_id: number | null }>(`/games/artwork?name=${encodeURIComponent(name.trim())}`)
      .then((r) => r.app_id)
      .catch(() => { lookups.delete(key); return null; });      // network error: allow a retry next time
    lookups.set(key, p);
  }
  return p;
}

// undefined = still looking, null = not a Steam game (use the fallback tile), number = Steam app id
export function useSteamApp(name: string): number | null | undefined {
  const [id, setId] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setId(undefined);
    resolveSteamApp(name).then((v) => { if (live) setId(v); });
    return () => { live = false; };
  }, [name]);
  return id;
}

// library_600x900 is the nicest cover but not every game has one; header.jpg exists for every Steam app.
export const steamImage = (appId: number, kind: 'library' | 'header') =>
  `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/${kind === 'library' ? 'library_600x900.jpg' : 'header.jpg'}`;

export const searchGames = (q: string) => api<{ app_id: number; name: string }[]>(`/games/search?q=${encodeURIComponent(q)}`);
