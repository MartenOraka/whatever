import { CatalogGame, GAME_CATALOG } from '../data/gameCatalog';

// "HELLDIVERS™ 2", "helldivers 2" and "Helldivers II" style differences must not create different games.
export const normGame = (s: string) => s.toLowerCase().replace(/[™®©]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const index = new Map<string, CatalogGame>();
for (const game of GAME_CATALOG) {
  for (const label of [game.name, ...(game.aliases ?? [])]) {
    const key = normGame(label);
    const other = index.get(key);
    if (other) { console.warn(`[game catalog] "${label}" (${game.name}) is already used by "${other.name}" - remove one of them`); continue; }
    index.set(key, game);
  }
}

export const findGame = (name: string): CatalogGame | null => index.get(normGame(name)) ?? null;
export const canonicalGameName = (name: string) => findGame(name)?.name ?? name.trim();
export const gameKey = (name: string) => normGame(canonicalGameName(name));
export const rankLadder = (name: string) => findGame(name)?.ranks;

// Official names + no duplicates: "CS2" and "Counter-Strike 2" become ONE entry (the first one wins).
export function canonicalizeGames<T extends { name: string }>(games: T[]): T[] {
  const seen = new Set<string>(); const out: T[] = [];
  for (const g of games) {
    const name = canonicalGameName(g.name);
    if (!name || seen.has(normGame(name))) continue;
    seen.add(normGame(name)); out.push({ ...g, name });
  }
  return out;
}
