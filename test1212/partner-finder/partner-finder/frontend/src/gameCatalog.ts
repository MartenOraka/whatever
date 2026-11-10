import { useEffect, useState } from 'react';
import { api } from './api';

// The QREW game library lives on the server (backend/src/data/gameCatalog.ts). The browser loads it once.
export interface CatalogGame { name: string; category: string; platforms: string[]; color: string; aliases?: string[]; steam?: number; glyph?: string; ranks?: string[] }
export interface Catalog { categories: string[]; games: CatalogGame[]; find: (name: string) => CatalogGame | null; key: (name: string) => string }

// "HELLDIVERS™ 2" and "helldivers 2" are the same game
export const norm = (s: string) => s.toLowerCase().replace(/[™®©]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function build(raw: { categories: string[]; games: CatalogGame[] }): Catalog {
  const index = new Map<string, CatalogGame>();
  for (const g of raw.games) for (const label of [g.name, ...(g.aliases ?? [])]) if (!index.has(norm(label))) index.set(norm(label), g);
  const find = (name: string) => index.get(norm(name)) ?? null;
  return { ...raw, find, key: (name) => norm(find(name)?.name ?? name) };
}

let cached: Catalog | null = null;
let pending: Promise<Catalog> | null = null;
export function loadCatalog(): Promise<Catalog> {
  pending ??= api<{ categories: string[]; games: CatalogGame[] }>('/games/catalog').then((r) => (cached = build(r))).catch((e) => { pending = null; throw e; });
  return pending;
}

// null while loading (components then show a neutral loading state)
export function useCatalog(): Catalog | null {
  const [catalog, setCatalog] = useState<Catalog | null>(cached);
  useEffect(() => { let live = true; loadCatalog().then((c) => { if (live) setCatalog(c); }).catch(() => {}); return () => { live = false; }; }, []);
  return catalog;
}

// official names + no duplicates ("CS2" and "Counter-Strike 2" -> one row)
export function dedupeGames<T extends { name: string }>(cat: Catalog, games: T[]): T[] {
  const seen = new Set<string>();
  return games.map((g) => ({ ...g, name: cat.find(g.name)?.name ?? g.name })).filter((g) => { const k = cat.key(g.name); if (seen.has(k)) return false; seen.add(k); return true; });
}
